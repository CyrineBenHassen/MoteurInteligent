from fastapi import FastAPI
from scraper import scrape_page
from generator import generate_tests
from generator_performance import generate_performance_tests
from runner_performance import run_performance
from analyzer import analyze_error
from runner import run_selenium_script
from fastapi.responses import Response
from pdf_generator import generate_pdf

app = FastAPI(title="NexTest AI Service")


@app.get("/")
def root():
    return {"message": "NexTest AI Service is running — v14 (Performance)"}


@app.post("/scrape")
def scrape(data: dict):
    url       = data.get("url")
    wait_time = data.get("wait_time", 2000)
    if not url:
        return {"error": "URL is required"}
    return scrape_page(url, wait_time=wait_time)


@app.post("/generate")
def generate(data: dict):
    url           = data.get("url")
    framework     = data.get("framework", "Selenium")
    username      = data.get("username")
    password      = data.get("password")
    wait_time     = data.get("wait_time", 2000)
    test_type     = data.get("test_type", "smoke")
    user_scenario = data.get("user_scenario", None)

    if not url:
        return {"error": "URL is required"}

    # ── Normalise test_type ──────────────────────────────────────────────────
    valid_test_types = {"smoke", "functional", "regression", "performance"}
    test_type = test_type.lower() if test_type else "smoke"
    if test_type not in valid_test_types:
        test_type = "smoke"

    print(f"[GENERATE] url={url} | framework={framework} | test_type={test_type}")

    # ── Scrape the page ──────────────────────────────────────────────────────
    scraped = scrape_page(url, wait_time=wait_time)

    if "error" in scraped:
        return {
            "error": f"Cannot scrape this page: {scraped['error']}",
            "scraped": {
                "url": url, "load_time_ms": 0, "is_spa": False,
                "inputs": [], "buttons": [], "forms": [], "selects": [],
                "textareas": [], "checkboxes": [], "nav_links": [],
                "add_to_cart": [], "pagination": [], "modals": [],
                "images": [], "alerts": [], "links": [],
                "lang_switcher": [], "search_bar": [], "images_audit": [],
                "icons": [], "input_fields": [],
            }
        }

    # ── PERFORMANCE : chemin dédié ───────────────────────────────────────────
    if test_type == "performance":
        print(f"[GENERATE] Performance test | framework={framework} | url={url}")

        if framework == "k6":
            # ── K6 : Load Test ───────────────────────────────────────────
            from runner_performance import run_k6_performance
            result = run_k6_performance(url, scraped)

        else:
            # ── PLAYWRIGHT : Web Vitals ──────────────────────────────────
            metrics = run_performance(url)
            result  = generate_performance_tests(
                scraped=scraped,
                framework=framework,
                metrics=metrics,
            )

        return {
            "url":           url,
            "framework":     framework,
            "test_type":     "performance",
            "user_scenario": "",
            "scraped":       scraped,
            "result":        result,
        }

    # ── SMOKE / FUNCTIONAL / REGRESSION : chemin classique ──────────────────
    result = generate_tests(
        scraped,
        framework,
        username,
        password,
        test_type=test_type,
        user_scenario=user_scenario,
    )

    return {
        "url":           url,
        "framework":     framework,
        "test_type":     test_type,
        "user_scenario": user_scenario or "",
        "scraped":       scraped,
        "result":        result,
    }


@app.post("/run")
def run_tests(data: dict):
    script     = data.get("script", "")
    framework  = data.get("framework", "Selenium")
    test_cases = data.get("test_cases", [])
    test_type  = data.get("test_type", "smoke")

    print(f"[RUN] test_cases={len(test_cases)} | framework={framework} | test_type={test_type}")

    # Performance tests — résultats déjà dans test_cases, pas de re-run
    if test_type == "performance":
        pass_count = sum(1 for tc in test_cases if tc.get("status") == "pass")
        fail_count = sum(1 for tc in test_cases if tc.get("status") == "fail")
        skip_count = sum(1 for tc in test_cases if tc.get("status") == "skip")
        executed   = pass_count + fail_count
        pass_rate  = round(pass_count / executed * 100) if executed else 0
        return {
            "results":    test_cases,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "skip_count": skip_count,
            "pass_rate":  pass_rate,
            "total":      len(test_cases),
            "duration_s": 0,
            "raw_output": "",
        }

    if not script and not test_cases:
        return {"error": "script or test_cases is required"}

    if framework.lower() not in ("selenium", "playwright"):
        return {"error": "Only Selenium/Playwright scripts supported"}

    return run_selenium_script(script, test_cases)


@app.post("/analyze")
def analyze(data: dict):
    error     = data.get("error")
    script    = data.get("script")
    framework = data.get("framework", "Selenium")

    if not error:
        return {"error": "error message is required"}
    if not script:
        return {"error": "script is required"}

    result = analyze_error(error, script, framework)
    return {"framework": framework, "original_error": error, "analysis": result}


@app.post("/chat")
def chat(data: dict):
    message = data.get("message", "")
    lang    = data.get("lang", "fr")
    history = data.get("history", [])

    if not message:
        return {"error": "message is required"}

    system_prompt = (
        "Tu es l'assistant IA de NexTest, un outil de génération automatique de tests web.\n"
        "NexTest utilise LLaMA 3 via Groq pour analyser les pages web et générer des scripts de test.\n\n"
        "FONCTIONNALITÉS DE NEXTEST :\n"
        "- Scraping automatique du DOM\n"
        "- Génération par sections : header, hero, search, forms, content, footer, workflow\n"
        "- Frameworks : Selenium (.py), Playwright (.py), Cypress (.js), Both\n"
        "- Types de tests : smoke, functional, regression, performance\n"
        "- Performance : mesure LCP, FCP, TTI, Load Time, DOM Size, Resource Size\n"
        "- Score global Lighthouse-style (0-100) + recommandations LLaMA\n"
        "- Projets Public ou Internal\n"
        "- Export rapports : CSV, HTML, PDF\n\n"
        f"Réponds {'en français' if lang == 'fr' else 'in English'}, "
        "de manière concise. Max 5 phrases."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        *history[-6:],
        {"role": "user", "content": message},
    ]

    try:
        from openai import OpenAI
        from dotenv import load_dotenv
        import os
        load_dotenv()

        groq_client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
        )

        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )

        return {"reply": resp.choices[0].message.content.strip()}

    except Exception as e:
        return {"error": str(e)}


@app.post("/generate-pdf")
def generate_pdf_report(data: dict):
    try:
        pdf_bytes = generate_pdf(data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=nextest_report.pdf"}
        )
    except Exception as e:
        return {"error": str(e)}