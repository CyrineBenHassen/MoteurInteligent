from playwright.sync_api import sync_playwright

def scrape_page(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()

        try:
            # ✅ Support SPA : attend que le réseau soit calme
            page.goto(url, timeout=60000, wait_until="networkidle")
            
            # ✅ Attendre en plus que le body soit visible
            page.wait_for_selector("body", timeout=10000)
            
            # ✅ Scroll pour déclencher le lazy loading
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)  # attendre 2 secondes
            
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
            "button, input[type='submit'], input[type='button'], [role='button']",
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

        # Select (listes déroulantes)
        selects = page.eval_on_selector_all(
            "select",
            """els => els.map(el => ({
                name: el.name || '',
                id: el.id || '',
                options: Array.from(el.options).map(o => o.value).slice(0, 5)
            }))"""
        )

        # Textareas
        textareas = page.eval_on_selector_all(
            "textarea",
            """els => els.map(el => ({
                name: el.name || '',
                id: el.id || '',
                placeholder: el.placeholder || ''
            }))"""
        )

        # Checkboxes et radios
        checkboxes = page.eval_on_selector_all(
            "input[type='checkbox'], input[type='radio']",
            """els => els.map(el => ({
                type: el.type,
                name: el.name || '',
                id: el.id || '',
                value: el.value || ''
            }))"""
        )

        # ✅ NOUVEAU : détecter si c'est une SPA
        is_spa = page.evaluate("""() => {
            return !!(window.React || window.angular || window.Vue || 
                     window.__NEXT_DATA__ || window.nuxt)
        }""")

        browser.close()

        return {
            "url":        url,
            "title":      title,
            "is_spa":     is_spa,    
            "inputs":     inputs,
            "buttons":    buttons,
            "links":      links,
            "forms":      forms,
            "selects":    selects,
            "textareas":  textareas,
            "checkboxes": checkboxes,
        }