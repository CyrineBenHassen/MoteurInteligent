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

    if not url:
        return {"error": "URL is required"}

    scraped = scrape_page(url, wait_time=wait_time)

    # Vérifier si scraping a échoué avec une vraie erreur
    if "error" in scraped:
        return {
            "error": f"Cannot scrape this page: {scraped['error']}",
            "scraped": {
                "url": url, "load_time_ms": 0, "is_spa": False,
                "inputs": [], "buttons": [], "forms": [], "selects": [],
                "textareas": [], "checkboxes": [], "nav_links": [],
                "add_to_cart": [], "pagination": [], "modals": [],
                "images": [], "alerts": [], "links": []
            }
        }

    # ✅ Ne plus bloquer si peu d'éléments — générer quand même
    # Le generator a un fallback pour les pages sans éléments
    result = generate_tests(scraped, framework, username, password)

    return {
        "url":       url,
        "framework": framework,
        "scraped":   scraped,
        "result":    result,
    }


@app.post("/run")
def run_tests(data: dict):
    script     = data.get("script", "")
    framework  = data.get("framework", "Selenium")
    test_cases = data.get("test_cases", [])

    if not script:
        return {"error": "script is required"}

    if framework.lower() != "selenium":
        return {"error": "Only Selenium scripts can be executed server-side"}

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