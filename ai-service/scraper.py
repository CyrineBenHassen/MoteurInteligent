from playwright.sync_api import sync_playwright

def scrape_page(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(url, timeout=30000, wait_until="domcontentloaded")
            
        except Exception as e:
            browser.close()
            return {"error": str(e), "url": url}

        # Titre de la page
        title = page.title()

        # Inputs
        inputs = page.eval_on_selector_all(
            "input:not([type='hidden'])",
            """els => els.map(el => ({
                type: el.type || 'text',
                name: el.name || '',
                id: el.id || '',
                placeholder: el.placeholder || '',
                required: el.required
            }))"""
        )

        # Boutons
        buttons = page.eval_on_selector_all(
            "button, input[type='submit'], input[type='button']",
            """els => els.map(el => ({
                type: el.type || 'button',
                text: el.innerText || el.value || '',
                id: el.id || '',
                name: el.name || ''
            }))"""
        )

        # Liens
        links = page.eval_on_selector_all(
            "a[href]",
            """els => els.slice(0, 15).map(el => ({
                text: el.innerText.trim() || '',
                href: el.href || ''
            }))"""
        )

        # Formulaires
        forms = page.eval_on_selector_all(
            "form",
            """els => els.map(el => ({
                id: el.id || '',
                action: el.action || '',
                method: el.method || 'get'
            }))"""
        )

        browser.close()

        return {
            "url": url,
            "title": title,
            "inputs": inputs,
            "buttons": buttons,
            "links": links,
            "forms": forms
        }