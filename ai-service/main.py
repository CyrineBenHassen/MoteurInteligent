from fastapi import FastAPI
from scraper import scrape_page

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