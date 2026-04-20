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
    return {"message": "NexTest AI Service is running"}


@app.post("/scrape")
def scrape(data: dict):
    url       = data.get("url")
    wait_time = data.get("wait_time", 2000)
    if not url:
        return {"error": "URL is required"}
    return scrape_page(url, wait_time=wait_time)


@app.post("/generate")
def generate(data: dict):
    url       = data.get("url")
    framework = data.get("framework", "Selenium")
    username  = data.get("username")
    password  = data.get("password")
    wait_time = data.get("wait_time", 2000)
    test_type = data.get("test_type", "smoke")   # ✅ FIX 1: was missing — defaulting to smoke

    if not url:
        return {"error": "URL is required"}

    # ✅ FIX 2: Normalise test_type casing to match generator expectations
    valid_test_types = {"smoke", "functional", "regression"}
    test_type = test_type.lower() if test_type else "smoke"
    if test_type not in valid_test_types:
        test_type = "smoke"

    print(f"[GENERATE] url={url} | framework={framework} | test_type={test_type}")

    scraped = scrape_page(url, wait_time=wait_time)

    # ✅ FIX 3: Propagate scraping error cleanly
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

    # ✅ FIX 4: Pass test_type to generate_tests
    result = generate_tests(scraped, framework, username, password, test_type=test_type)

    return {
        "url":       url,
        "framework": framework,
        "test_type": test_type,
        "scraped":   scraped,
        "result":    result,
    }


@app.post("/run")
def run_tests(data: dict):
    script     = data.get("script", "")
    framework  = data.get("framework", "Selenium")
    test_cases = data.get("test_cases", [])
    test_type  = data.get("test_type", "smoke")   # ✅ FIX 5: accept test_type for logging

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