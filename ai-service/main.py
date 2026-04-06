from fastapi import FastAPI
from scraper import scrape_page
from generator import generate_tests
from analyzer import analyze_error  
from fastapi.responses import Response
from pdf_generator import generate_pdf

app = FastAPI(title="NexTest AI Service")

@app.get("/")
def root():
    return {"message": "NexTest AI Service is running 🚀"}

@app.post("/scrape")
def scrape(data: dict):
    url = data.get("url")
    if not url:
        return {"error": "URL is required"}
    result = scrape_page(url)
    return result

@app.post("/generate")
def generate(data: dict):
    url       = data.get("url")
    framework = data.get("framework", "Selenium")
    
    if not url:
        return {"error": "URL is required"}
    
    # Étape 1 — Scraper la page
    scraped = scrape_page(url)
    
    if "error" in scraped:
        return {"error": scraped["error"]}
    
    # Étape 2 — Générer les tests avec Groq
    result = generate_tests(scraped, framework)
    
    return {
        "url": url,
        "framework": framework,
        "scraped": scraped,
        "result": result
    }

# Nouveau endpoint analyse des erreurs
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
        "framework": framework,
        "original_error": error,
        "analysis": result
    }
    
@app.post("/generate-pdf")
def generate_pdf_report(data: dict):
    try:
        pdf_bytes = generate_pdf(data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=nextest_report.pdf"
            }
        )
    except Exception as e:
        return {"error": str(e)}
   