from fastapi import FastAPI
from scraper import scrape_page
from generator import generate_tests
from analyzer import analyze_error
from runner import run_selenium_script
from fastapi.responses import Response
from pdf_generator import generate_pdf

app = FastAPI(title="NexTest AI Service")


@app.get("/")
def root():
    return {"message": "NexTest AI Service is running — v11"}


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
    user_scenario = data.get("user_scenario", None)   # ← NOUVEAU : scénario utilisateur

    if not url:
        return {"error": "URL is required"}

    # Normalise test_type
    valid_test_types = {"smoke", "functional", "regression"}
    test_type = test_type.lower() if test_type else "smoke"
    if test_type not in valid_test_types:
        test_type = "smoke"

    print(f"[GENERATE] url={url} | framework={framework} | test_type={test_type} | scenario={bool(user_scenario)}")

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

    result = generate_tests(
        scraped,
        framework,
        username,
        password,
        test_type=test_type,
        user_scenario=user_scenario,   # ← NOUVEAU
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

    print(f"[RUN] script len={len(script)} | test_cases count={len(test_cases)} | framework={framework} | test_type={test_type}")
    if test_cases:
        print(f"[RUN] first step = {test_cases[0]}")

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

    return {
        "framework":      framework,
        "original_error": error,
        "analysis":       result,
    }
    
    
@app.post("/chat")
def chat(data: dict):
    message  = data.get("message", "")
    lang     = data.get("lang", "fr")
    history  = data.get("history", [])
    
    if not message:
        return {"error": "message is required"}

    system_prompt = (
        "Tu es l'assistant IA de NexTest, un outil de génération automatique de tests web.\n"
        "NexTest utilise LLaMA 3 via Groq pour analyser les pages web et générer des scripts de test.\n\n"
        "FONCTIONNALITÉS DE NEXTEST :\n"
        "- Scraping automatique du DOM (inputs, boutons, nav, forms, footer, hero...)\n"
        "- Génération par sections : header, hero, search, forms, content, footer, workflow\n"
        "- Frameworks : Selenium (.py), Playwright (.py), Cypress (.js), Both (les 3)\n"
        "- Types de tests : smoke (~30s), functional (~1min), regression (~3min), unit, security (~5min)\n"
        "- Projets Public (web apps) ou Internal (APIs, microservices)\n"
        "- Assertions : url_contains, element_visible, text_contains, input_value, element_not_visible\n"
        "- Export rapports : CSV, HTML, PDF\n"
        "- Historique des générations avec pass rate\n\n"
        "WORKFLOW NEXTEST :\n"
        "1. Projects → créer un projet (Public ou Internal)\n"
        "2. Ajouter une page (URL cible)\n"
        "3. Cliquer Generate → choisir test type + framework\n"
        "4. Voir les résultats dans Test Execution\n"
        "5. Télécharger le rapport ou le script\n\n"
        f"Réponds {'en français' if lang == 'fr' else 'in English'}, "
        "de manière concise. Utilise **gras** pour les termes importants. "
        "Max 5 phrases sauf si besoin de plus."
    ) if lang == 'fr' else (
        "You are the AI assistant for NexTest, an automated web test generation tool.\n"
        "NexTest uses LLaMA 3 via Groq to analyze web pages and generate test scripts.\n\n"
        "NEXTEST FEATURES:\n"
        "- Automatic DOM scraping (inputs, buttons, nav, forms, footer, hero...)\n"
        "- Section-based generation: header, hero, search, forms, content, footer, workflow\n"
        "- Frameworks: Selenium (.py), Playwright (.py), Cypress (.js), Both (all 3)\n"
        "- Test types: smoke (~30s), functional (~1min), regression (~3min), unit, security (~5min)\n"
        "- Public projects (web apps) or Internal (APIs, microservices)\n"
        "- Assertions: url_contains, element_visible, text_contains, input_value, element_not_visible\n"
        "- Export reports: CSV, HTML, PDF\n"
        "- Generation history with pass rate\n\n"
        "NEXTEST WORKFLOW:\n"
        "1. Projects → create a project (Public or Internal)\n"
        "2. Add a page (target URL)\n"
        "3. Click Generate → choose test type + framework\n"
        "4. See results in Test Execution\n"
        "5. Download report or script\n\n"
        "Respond in English, concisely. Use **bold** for important terms. "
        "Max 5 sentences unless more is needed."
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