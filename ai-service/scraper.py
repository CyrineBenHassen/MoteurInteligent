from playwright.sync_api import sync_playwright

def scrape_page(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()

        try:
            page.goto(url, timeout=60000, wait_until="networkidle")
            page.wait_for_selector("body", timeout=10000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)

        except Exception as e:
            browser.close()
            return {"error": str(e), "url": url}

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

        # Selects
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

        # Checkboxes
        checkboxes = page.eval_on_selector_all(
            "input[type='checkbox'], input[type='radio']",
            """els => els.map(el => ({
                type: el.type,
                name: el.name || '',
                id: el.id || '',
                value: el.value || ''
            }))"""
        )

        # Boutons Ajouter au panier
        add_to_cart = page.eval_on_selector_all(
            "[class*='cart'], [id*='cart'], [class*='add-to'], [id*='add-to'], [class*='addto'], [id*='addto']",
            """els => els.slice(0, 10).map(el => ({
                text: el.innerText.trim() || '',
                id: el.id || '',
                class: el.className || ''
            }))"""
        )

        # Pagination
        pagination = page.eval_on_selector_all(
            ".pagination a, [class*='pagination'] a, [class*='page-'] a, [aria-label*='page']",
            """els => els.slice(0, 10).map(el => ({
                text: el.innerText.trim() || '',
                href: el.href || '',
                aria_label: el.getAttribute('aria-label') || ''
            }))"""
        )

        # Navigation links
        nav_links = page.eval_on_selector_all(
            "nav a, [class*='nav'] a, [class*='menu'] a, header a",
            """els => els.slice(0, 15).map(el => ({
                text: el.innerText.trim() || '',
                href: el.href || ''
            }))"""
        )

        # Popups / Modals
        modals = page.eval_on_selector_all(
            "[class*='modal'], [class*='popup'], [class*='dialog'], [role='dialog']",
            """els => els.slice(0, 5).map(el => ({
                id: el.id || '',
                class: el.className || '',
                visible: el.offsetParent !== null
            }))"""
        )

        #  Images
        images = page.eval_on_selector_all(
            "img",
            """els => els.slice(0, 10).map(el => ({
                src: el.src || '',
                alt: el.alt || '',
                loaded: el.complete && el.naturalWidth > 0
            }))"""
        )

        # Alertes / Notifications
        alerts = page.eval_on_selector_all(
            "[class*='alert'], [class*='error'], [class*='success'], [class*='warning'], [role='alert']",
            """els => els.slice(0, 5).map(el => ({
                text: el.innerText.trim() || '',
                class: el.className || ''
            }))"""
        )

        # Performance
        load_time = page.evaluate("""() => {
            const timing = performance.timing;
            return timing.loadEventEnd - timing.navigationStart;
        }""")

        # Détecter SPA
        is_spa = page.evaluate("""() => {
            return !!(window.React || window.angular || window.Vue || 
                     window.__NEXT_DATA__ || window.nuxt)
        }""")

        browser.close()

        return {
            "url":          url,
            "title":        title,
            "is_spa":       is_spa,
            "load_time_ms": load_time,      
            "inputs":       inputs,
            "buttons":      buttons,
            "links":        links,
            "forms":        forms,
            "selects":      selects,
            "textareas":    textareas,
            "checkboxes":   checkboxes,
            "add_to_cart":  add_to_cart,    
            "pagination":   pagination,      
            "nav_links":    nav_links,       
            "modals":       modals,          
            "images":       images,          
            "alerts":       alerts,          
        }