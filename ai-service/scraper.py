from playwright.sync_api import sync_playwright


def scrape_page(url: str, wait_time: int = 2000) -> dict:
    with sync_playwright() as p:

        # ── Launch avec options anti-détection ──────────────────────────────
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--ignore-certificate-errors',        # ✅ SSL invalide
                '--ignore-certificate-errors-spki-list',
                '--disable-web-security',
                '--allow-running-insecure-content',
            ]
        )

        # ── Context anti-détection avancé ────────────────────────────────────
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            extra_http_headers={
                "Accept-Language":  "en-US,en;q=0.9",
                "Accept":           "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Encoding":  "gzip, deflate, br",
                "Cache-Control":    "no-cache",
                "Pragma":           "no-cache",
                "Sec-Fetch-Dest":   "document",
                "Sec-Fetch-Mode":   "navigate",
                "Sec-Fetch-Site":   "none",
                "Upgrade-Insecure-Requests": "1",
            },
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
            ignore_https_errors=True,               # ✅ ignorer erreurs SSL
        )

        # ── Masquer Playwright complètement ──────────────────────────────────
        page = context.new_page()
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({ query: () => Promise.resolve({ state: 'granted' }) })
            });
        """)

        # ── Stratégie de chargement multi-niveaux ────────────────────────────
        loaded = False

        # Niveau 1 : networkidle (idéal)
        if not loaded:
            try:
                page.goto(url, timeout=30000, wait_until="networkidle")
                loaded = True
            except Exception:
                pass

        # Niveau 2 : load event
        if not loaded:
            try:
                page.goto(url, timeout=30000, wait_until="load")
                page.wait_for_timeout(3000)
                loaded = True
            except Exception:
                pass

        # Niveau 3 : domcontentloaded (minimal)
        if not loaded:
            try:
                page.goto(url, timeout=30000, wait_until="domcontentloaded")
                page.wait_for_timeout(5000)
                loaded = True
            except Exception:
                pass

        # Niveau 4 : commit (juste la navigation)
        if not loaded:
            try:
                page.goto(url, timeout=30000, wait_until="commit")
                page.wait_for_timeout(8000)
                loaded = True
            except Exception as e:
                browser.close()
                return {"error": str(e), "url": url}

        # ── Attendre que le body soit présent ────────────────────────────────
        try:
            page.wait_for_selector("body", timeout=10000)
        except Exception:
            pass

        # ── Scroll pour charger le lazy content ──────────────────────────────
        try:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(wait_time)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(500)
        except Exception:
            pass

        # ── Vérifier que la page a du contenu ────────────────────────────────
        title = page.title()
        body_text = ""
        try:
            body_text = page.inner_text("body")
        except Exception:
            pass

        # ── Scrape tous les éléments ─────────────────────────────────────────

        def safe_eval(selector, script, default=None):
            """Eval sécurisé — retourne default si échec."""
            try:
                return page.eval_on_selector_all(selector, script)
            except Exception:
                return default or []

        # Inputs
        inputs = safe_eval(
            "input:not([type='hidden'])",
            """els => els.map(el => {
                const id = el.id || ''; const name = el.name || '';
                const type = el.type || 'text'; const className = el.className || '';
                let css = id ? '#'+id : name ? "[name='"+name+"']" :
                          className ? '.'+className.trim().split(/\\s+/)[0] : "input[type='"+type+"']";
                return { type, name, id, placeholder: el.placeholder||'', required: el.required, css_selector: css };
            })"""
        )

        # Buttons
        buttons = safe_eval(
            "button, input[type='submit'], input[type='button'], [role='button'], [type='button']",
            """els => els.map(el => {
                const id = el.id || ''; const text = (el.innerText||el.value||'').trim();
                const className = el.className || '';
                let css = id ? '#'+id : className ? '.'+className.trim().split(/\\s+/)[0] : 'button';
                return { type: el.type||'button', text, id, name: el.name||'', css_selector: css, text_content: text };
            })"""
        )

        # Links
        links = safe_eval(
            "a[href]",
            "els => els.slice(0,15).map(el => ({ text: el.innerText.trim()||'', href: el.href||'' }))"
        )

        # Forms
        forms = safe_eval(
            "form",
            """els => els.map(el => {
                const id = el.id||''; const className = el.className||'';
                let css = id ? '#'+id : className ? '.'+className.trim().split(/\\s+/)[0] : 'form';
                return { id, action: el.action||'', method: el.method||'get', css_selector: css };
            })"""
        )

        # Selects
        selects = safe_eval(
            "select",
            """els => els.map(el => {
                const id=el.id||''; const name=el.name||'';
                let css = id?'#'+id:name?"select[name='"+name+"']":'select';
                return { name, id, options: Array.from(el.options).map(o=>o.value).slice(0,5), css_selector: css };
            })"""
        )

        # Textareas
        textareas = safe_eval(
            "textarea",
            """els => els.map(el => {
                const id=el.id||''; const name=el.name||'';
                let css = id?'#'+id:name?"textarea[name='"+name+"']":'textarea';
                return { name, id, placeholder: el.placeholder||'', css_selector: css };
            })"""
        )

        # Checkboxes
        checkboxes = safe_eval(
            "input[type='checkbox'], input[type='radio']",
            """els => els.map(el => {
                const id=el.id||''; const name=el.name||'';
                let css = id?'#'+id:name?"[name='"+name+"']":"input[type='"+el.type+"']";
                return { type: el.type, name, id, value: el.value||'', css_selector: css };
            })"""
        )

        # Add to cart
        add_to_cart = safe_eval(
            "[class*='cart'], [id*='cart'], [class*='add-to'], [id*='add-to'], [class*='addtocart']",
            """els => els.slice(0,10).map(el => {
                const id=el.id||''; const className=el.className||'';
                let css = id?'#'+id:className?'.'+className.trim().split(/\\s+/)[0]:'[class*="cart"]';
                return { text: (el.innerText||'').trim(), id, class: className, css_selector: css };
            })"""
        )

        # Pagination
        pagination = safe_eval(
            ".pagination a, [class*='pagination'] a, [aria-label*='page'], [class*='page-item'] a",
            """els => els.slice(0,10).map(el => ({
                text: (el.innerText||'').trim(), href: el.href||'', aria_label: el.getAttribute('aria-label')||''
            }))"""
        )

        # Nav links
        nav_links = safe_eval(
            "nav a, [class*='nav'] a, [class*='menu'] a, header a, [class*='navbar'] a",
            "els => els.slice(0,15).map(el => ({ text: (el.innerText||'').trim(), href: el.href||'' }))"
        )

        # Modals
        modals = safe_eval(
            "[class*='modal'], [class*='popup'], [role='dialog'], [class*='overlay']",
            """els => els.slice(0,5).map(el => {
                const id=el.id||''; const className=el.className||'';
                let css = id?'#'+id:className?'.'+className.trim().split(/\\s+/)[0]:'[role="dialog"]';
                return { id, class: className, visible: el.offsetParent!==null, css_selector: css };
            })"""
        )

        # Images
        images = safe_eval(
            "img",
            "els => els.slice(0,10).map(el => ({ src: el.src||'', alt: el.alt||'', loaded: el.complete&&el.naturalWidth>0 }))"
        )

        # Alerts — détection maximale
        alerts = safe_eval(
            "[class*='alert'], [class*='error'], [id*='error'], [class*='success'], "
            "[class*='warning'], [role='alert'], [id*='alert'], [id*='message'], "
            "[class*='message'], [class*='flash'], [class*='notification'], [class*='toast']",
            """els => els.slice(0,10).map(el => {
                const id=el.id||''; const className=el.className||'';
                let css = id?'#'+id:className?'.'+className.trim().split(/\\s+/)[0]:'';
                return { text: (el.innerText||'').trim(), class: className, id: id, css_selector: css };
            })"""
        )

        # Performance
        load_time = 0
        try:
            load_time = page.evaluate("""() => {
                const t = performance.timing;
                const lt = t.loadEventEnd - t.navigationStart;
                return lt > 0 ? lt : Date.now() - t.navigationStart;
            }""")
        except Exception:
            pass

        # SPA Detection élargie
        is_spa = False
        try:
            is_spa = page.evaluate("""() => {
                return !!(window.React || window.angular || window.Vue ||
                          window.__NEXT_DATA__ || window.nuxt ||
                          window.__NUXT__ || window.Ember ||
                          document.querySelector('[ng-app]') ||
                          document.querySelector('[data-reactroot]') ||
                          document.querySelector('#__next') ||
                          document.querySelector('#app[data-v-app]'));
            }""")
        except Exception:
            pass

        browser.close()

        return {
            "url": url, "title": title, "is_spa": is_spa, "load_time_ms": load_time,
            "inputs": inputs, "buttons": buttons, "links": links, "forms": forms,
            "selects": selects, "textareas": textareas, "checkboxes": checkboxes,
            "add_to_cart": add_to_cart, "pagination": pagination, "nav_links": nav_links,
            "modals": modals, "images": images, "alerts": alerts,
        }