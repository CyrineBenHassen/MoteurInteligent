from playwright.sync_api import sync_playwright
import re


# ─────────────────────────────────────────────────────────────────────────────
# Helper JS : sélecteur CSS stable (filtre classes dynamiques avec hash)
# ─────────────────────────────────────────────────────────────────────────────
_STABLE_CSS_JS = """
function stableCSS(el, fallback) {
    if (el.id && !/^\\d/.test(el.id)) return '#' + el.id;
    const tag = el.tagName.toLowerCase();
    if (el.name) return tag + "[name='" + el.name + "']";
    const classes = (el.className || '').toString().trim().split(/\\s+/)
        .filter(c => c.length > 2
            && !/[0-9a-f]{5,}/i.test(c)
            && !/^\\d+$/.test(c)
            && !/^(css|sc|wp)-/.test(c)
            && !/--/.test(c)
        );
    if (classes.length) return tag + '.' + classes[0];
    if (el.type && el.type !== 'text') return tag + "[type='" + el.type + "']";
    return fallback || tag;
}
"""


def scrape_page(url: str, wait_time: int = 2000) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars', '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--disable-web-security', '--allow-running-insecure-content',
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            extra_http_headers={
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache", "Pragma": "no-cache",
                "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none", "Upgrade-Insecure-Requests": "1",
            },
            viewport={"width": 1920, "height": 1080},
            locale="fr-FR", timezone_id="Africa/Tunis", ignore_https_errors=True,
        )
        page = context.new_page()
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            Object.defineProperty(navigator, 'languages', {get: () => ['fr-FR', 'fr', 'en']});
            window.chrome = { runtime: {} };
        """)

        # ── Chargement robuste avec fallback ─────────────────────────────────
        loaded = False
        for wait_until, extra_wait in [
            ("networkidle", 0),
            ("load", 3000),
            ("domcontentloaded", 5000),
            ("commit", 8000),
        ]:
            if loaded:
                break
            try:
                page.goto(url, timeout=30000, wait_until=wait_until)
                if extra_wait:
                    page.wait_for_timeout(extra_wait)
                loaded = True
            except Exception:
                pass

        if not loaded:
            browser.close()
            return {"error": "Could not load page", "url": url}

        # ── Attendre le body + scroll pour déclencher lazy-load ──────────────
        try:
            page.wait_for_selector("body", timeout=10000)
        except Exception:
            pass
        try:
            page.evaluate("window.scrollTo(0, 300)")
            page.wait_for_timeout(1000)
            page.evaluate("window.scrollTo(0, 600)")
            page.wait_for_timeout(1000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(wait_time)  
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(1000)
        except Exception:
            pass

        title = page.title()

        def safe_eval(selector, script):
            try:
                return page.eval_on_selector_all(selector, script)
            except Exception:
                return []

        def safe_eval_js(script):
            try:
                return page.evaluate(script)
            except Exception:
                return []

        # ── INPUTS ────────────────────────────────────────────────────────────
        inputs = safe_eval("input:not([type='hidden'])", _STABLE_CSS_JS + """
        els => els.map(el => {
            const css = stableCSS(el, "input[type='" + (el.type||'text') + "']");
            return {
                type: el.type||'text',
                name: el.name||'',
                id: el.id||'',
                placeholder: el.placeholder||'',
                required: el.required,
                css_selector: css
            };
        })""")

        # ── BUTTONS ───────────────────────────────────────────────────────────
        buttons = safe_eval(
            "button, input[type='submit'], input[type='button'], [role='button']",
            _STABLE_CSS_JS + """
        els => els.map(el => {
            const text = (el.innerText||el.value||'').trim();
            const css = stableCSS(el, 'button');
            return {
                type: el.type||'button',
                text: text,
                id: el.id||'',
                name: el.name||'',
                css_selector: css
            };
        }).filter(b => b.text || b.id)
        """)

        # ── LINKS ─────────────────────────────────────────────────────────────
        links = safe_eval(
            "a[href]",
            "els => els.slice(0,15).map(el => ({text:(el.innerText||'').trim(), href:el.href||''}))"
        )

        # ── FORMS ─────────────────────────────────────────────────────────────
        forms = safe_eval("form", _STABLE_CSS_JS + """
        els => els.map(el => {
            const css = stableCSS(el, 'form');
            return {
                id: el.id||'',
                action: el.action||'',
                method: el.method||'get',
                css_selector: css
            };
        })""")

        # ── SELECTS ───────────────────────────────────────────────────────────
        selects = safe_eval("select", _STABLE_CSS_JS + """
        els => els.map(el => {
            const css = stableCSS(el, 'select');
            return {
                name: el.name||'',
                id: el.id||'',
                options: Array.from(el.options).map(o => o.value).slice(0,5),
                css_selector: css
            };
        })""")

        # ── TEXTAREAS ─────────────────────────────────────────────────────────
        textareas = safe_eval("textarea", _STABLE_CSS_JS + """
        els => els.map(el => {
            const css = stableCSS(el, 'textarea');
            return {name: el.name||'', id: el.id||'', placeholder: el.placeholder||'', css_selector: css};
        })""")

        # ── CHECKBOXES ────────────────────────────────────────────────────────
        checkboxes = safe_eval(
            "input[type='checkbox'], input[type='radio']",
            _STABLE_CSS_JS + """
        els => els.map(el => {
            const css = stableCSS(el, "input[type='" + el.type + "']");
            return {type: el.type, name: el.name||'', id: el.id||'', value: el.value||'', css_selector: css};
        })""")

        # ── ADD TO CART ───────────────────────────────────────────────────────
        add_to_cart = safe_eval(
            "[class*='cart'],[id*='cart'],[class*='add-to'],[id*='add-to']",
            _STABLE_CSS_JS + """
        els => els.slice(0,10).map(el => {
            const css = stableCSS(el, '[class*=cart]');
            return {text:(el.innerText||'').trim(), id:el.id||'', css_selector:css};
        })""")

        # ── PAGINATION ────────────────────────────────────────────────────────
        pagination = safe_eval(
            ".pagination a, [class*='pagination'] a, [class*='page-item'] a",
            "els => els.slice(0,10).map(el => ({text:(el.innerText||'').trim(), href:el.href||'', aria_label:el.getAttribute('aria-label')||''}))"
        )

        # ── NAV LINKS ─────────────────────────────────────────────────────────
        raw_nav = safe_eval(
            "nav a, [class*='nav'] a, [class*='menu'] a, header a, [class*='navbar'] a",
            "els => els.slice(0,20).map(el => ({text:(el.innerText||'').trim(), href:el.href||''}))"
        )
        seen_nav = set()
        nav_links = []
        base = url.rstrip("/")
        for n in raw_nav:
            href = n.get("href", "").rstrip("/")
            text = n.get("text", "").strip()
            if (not href or not text or href == base
                    or href.endswith("#") or href in seen_nav
                    or href.startswith("javascript")):
                continue
            seen_nav.add(href)
            nav_links.append(n)

        # ── MODALS ────────────────────────────────────────────────────────────
        modals = safe_eval(
            "[class*='modal'],[class*='popup'],[role='dialog']",
            _STABLE_CSS_JS + """
        els => els.slice(0,5).map(el => {
            const css = stableCSS(el, '[role=dialog]');
            return {id:el.id||'', visible:el.offsetParent!==null, css_selector:css};
        })""")

        # ── IMAGES (existing) ─────────────────────────────────────────────────
        images = safe_eval(
            "img",
            "els => els.slice(0,10).map(el => ({src:el.src||'', alt:el.alt||'', loaded:el.complete&&el.naturalWidth>0}))"
        )

        # ── ALERTS ────────────────────────────────────────────────────────────
        alerts = safe_eval(
            "[class*='alert'],[class*='error'],[id*='error'],[class*='success'],"
            "[class*='warning'],[role='alert'],[id*='alert'],[id*='message'],"
            "[class*='message'],[class*='flash'],[class*='notification'],[class*='toast']",
            _STABLE_CSS_JS + """
        els => els.slice(0,10).map(el => {
            const css = stableCSS(el, '');
            return {text:(el.innerText||'').trim(), class:el.className||'', id:el.id||'', css_selector:css};
        })""")

        # ── SEARCH INPUTS (existing) ──────────────────────────────────────────
        search_inputs = safe_eval(
            "input[type='search'], input[name='s'], "
            "input[placeholder*='search' i], input[placeholder*='recherche' i], "
            "input[placeholder*='chercher' i], input[placeholder*='بحث' i], "
            "input[name*='search' i], input[name*='query' i], "
            "[class*='search'] input, [id*='search'] input",
            _STABLE_CSS_JS + """
        els => {
            const seen = new Set();
            return els.map(el => {
                const css = stableCSS(el, "input[name='s']");
                if (seen.has(css)) return null;
                seen.add(css);
                return {
                    type: el.type||'text',
                    name: el.name||'',
                    id: el.id||'',
                    placeholder: el.placeholder||'',
                    css_selector: css
                };
            }).filter(Boolean);
        }""")

        # ── FILTERS ───────────────────────────────────────────────────────────
        filters = safe_eval(
            "[class*='filter'] select, [id*='filter'] select, "
            "[class*='filtre'] select, select[name*='filter' i], "
            "select[name*='sort' i], select[name*='category' i], "
            "[class*='sort'] select",
            _STABLE_CSS_JS + """
        els => els.slice(0,10).map(el => {
            const css = stableCSS(el, '[class*=filter]');
            return {tag:el.tagName.toLowerCase(), id:el.id||'', css_selector:css, text:(el.innerText||el.value||'').trim().slice(0,50)};
        })""")

        # ── LANGUAGE SWITCHER ────────────────────────────────────────────────
        lang_switcher = safe_eval(
            ".pll-parent-menu-item, .wpml-ls-item, [class*='lang-switch'], "
            "[class*='language-switch'], [class*='lang-selector'], "
            "a[hreflang], "
            "a[href*='/fr/'], a[href*='/en/'], a[href*='/ar/'], a[href*='/de/'], "
            "a[href*='lang=fr'], a[href*='lang=en'], a[href*='lang=ar']",
            _STABLE_CSS_JS + r"""
        els => {
            const seen = new Set();
            return els.slice(0, 10).map(el => {
                const css  = stableCSS(el, 'a[hreflang]');
                const text = (el.innerText || el.getAttribute('hreflang') || '').trim().toUpperCase();
                const href = el.href || '';
                if (seen.has(css)) return null;
                seen.add(css);
                return { css_selector: css, text, href, hreflang: el.getAttribute('hreflang') || '' };
            }).filter(Boolean);
        }"""
        )
        _seen_lang = set()
        _lang_clean = []
        for _l in lang_switcher:
            _key = (_l.get("text", ""), _l.get("hreflang", ""), _l.get("href", "")[:60])
            if _key not in _seen_lang:
                _seen_lang.add(_key)
                _lang_clean.append(_l)
        lang_switcher = _lang_clean[:6]

        # ── SEARCH BAR (form-level) ───────────────────────────────────────────
        search_bar = safe_eval(
            "form[role='search'], form[action*='search'], "
            "[class*='search-form'], [class*='search-bar'], [class*='search-box'], "
            "[id*='search-form'], [id*='searchform']",
            _STABLE_CSS_JS + """
        els => els.slice(0, 5).map(el => {
            const css   = stableCSS(el, 'form[role=search]');
            const input = el.querySelector("input[type='search'], input[name='s'], input[type='text']");
            return {
                css_selector:      css,
                has_input:         !!input,
                input_placeholder: input ? (input.placeholder || '') : '',
                visible:           el.offsetParent !== null,
            };
        })"""
        )

        # ── IMAGES AUDIT (visibility + alt) ──────────────────────────────────
        images_audit = safe_eval(
            "img",
            """els => els.slice(0, 20).map(el => {
            const rect   = el.getBoundingClientRect();
            const inView = rect.width > 0 && rect.height > 0;
            const loaded = el.complete && el.naturalWidth > 0;
            const alt    = el.alt || '';
            const src    = el.src || el.getAttribute('data-src') || '';
            let css = '';
            if (el.id)                       css = '#' + el.id;
            else if (alt && alt.length < 60) css = "img[alt='" + alt.replace(/'/g,"") + "']";
            else if (src) {
                const frag = src.split('/').pop().split('?')[0].slice(0, 30);
                if (frag)                    css = "img[src*='" + frag + "']";
            }
            if (!css) css = 'img';
            return {
                css_selector: css,
                src:          src.slice(0, 120),
                alt:          alt,
                has_alt:      alt.trim().length > 0,
                is_decorative: alt === '',
                loaded:       loaded,
                in_viewport:  inView,
                width:        Math.round(rect.width),
                height:       Math.round(rect.height),
            };
        }).filter(img => img.loaded && img.width > 10)
        """
        )

        # ── ICON DETECTION (SVG + font icons) ─────────────────────────────────
        icons = safe_eval(
            "svg, "
            "[class*='fa-'], [class*='icon-'], [class*='bi-'], [class*='ri-'], "
            "[class*='mdi-'], [class*='feather-'], [class*='heroicon-'], "
            "[class*='icon']:not(section):not(div):not(article), "
            "i[class*='fa'], i[class*='icon'], i[class*='bi']",
            _STABLE_CSS_JS + """
        els => {
            const seen = new Set();
            return els.slice(0, 15).map(el => {
                const tag = el.tagName.toLowerCase();
                const cls = (el.className && el.className.toString) ? el.className.toString() : '';
                const css = stableCSS(el, tag);
                if (seen.has(css)) return null;
                seen.add(css);
                const kind = tag === 'svg' ? 'svg'
                           : cls.match(/fa[- ]/)  ? 'font-awesome'
                           : cls.match(/bi-/)      ? 'bootstrap-icon'
                           : cls.match(/mdi-/)     ? 'material-icon'
                           : cls.match(/icon/)     ? 'generic-icon'
                           : 'unknown';
                const visible = el.offsetParent !== null || tag === 'svg';
                return { css_selector: css, kind, visible, class: cls.trim().slice(0, 60) };
            }).filter(Boolean).filter(ic => ic.visible);
        }"""
        )

        # ── INPUT FIELDS (semantic, form-context aware) ───────────────────────
        input_fields = safe_eval(
            "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), "
            "textarea, select",
            _STABLE_CSS_JS + """
        els => {
            const labelFor = id => {
                if (!id) return '';
                const lbl = document.querySelector("label[for='" + id + "']");
                return lbl ? lbl.innerText.trim() : '';
            };
            return els.slice(0, 20).map(el => {
                const tag   = el.tagName.toLowerCase();
                const type  = el.type || tag;
                const css   = stableCSS(el, tag + "[type='" + type + "']");
                const label = labelFor(el.id) || el.getAttribute('aria-label') || el.placeholder || '';
                const hint  = (el.name + ' ' + el.id + ' ' + el.placeholder + ' ' + label).toLowerCase();
                const role  = type === 'email'                        ? 'email'
                            : type === 'tel'                          ? 'phone'
                            : type === 'password'                     ? 'password'
                            : /message|comment|body|content/i.test(hint) ? 'message'
                            : /subject|objet|sujet/i.test(hint)       ? 'subject'
                            : /name|nom|prenom|firstname/i.test(hint) ? 'name'
                            : /search|query|recherche/i.test(hint)    ? 'search'
                            : tag === 'textarea'                      ? 'textarea'
                            : tag === 'select'                        ? 'select'
                            : 'text';
                const form    = el.closest('form');
                const formCss = form
                    ? (form.id ? '#'+form.id
                        : (form.className ? '.'+form.className.trim().split(' ')[0] : 'form'))
                    : '';
                return {
                    css_selector: css,
                    type, role, label,
                    name:     el.name || '',
                    id:       el.id   || '',
                    required: el.required,
                    form_css: formCss,
                    visible:  el.offsetParent !== null,
                };
            }).filter(f => f.visible);
        }"""
        )

        # ── NEW: FOOTER DETECTION ─────────────────────────────────────────────
        footer_data = safe_eval(
            "footer, #footer, .footer, [class*='footer'], "
            ".copyright, [class*='copyright']",
            _STABLE_CSS_JS + """
        els => els.slice(0, 3).map(el => {
            const css     = stableCSS(el, 'footer');
            const text    = (el.innerText || '').trim().slice(0, 200);
            const links   = Array.from(el.querySelectorAll('a')).slice(0, 8).map(a => ({
                text: (a.innerText || '').trim(),
                href: a.href || ''
            })).filter(a => a.text);
            const phones  = (text.match(/\\+?[\\d\\s\\-\\.]{7,}/g) || []).slice(0, 3);
            const emails  = (text.match(/[\\w.-]+@[\\w.-]+\\.[a-z]{2,}/gi) || []).slice(0, 3);
            const visible = el.offsetParent !== null;
            return { css_selector: css, text, links, phones, emails, visible };
        }).filter(f => f.visible)
        """
        )

        # ── NEW: CONTENT SECTIONS (Piliers, Cards, Articles) ─────────────────
        content_sections = safe_eval(   
            "section, article, .elementor-section, .elementor-widget, "
            "[class*='service'], [class*='actualit'], [class*='event'], "
            "[class*='partner'], [class*='partenaire'], [class*='slider'], "
            "div.container > div, div.row > div[class*='col'], "
            ".wp-block, [class*='block'], main > div > div",
            _STABLE_CSS_JS + """
        els => {
            const seen = new Set();
            return els.slice(0, 20).map(el => {
                const css     = stableCSS(el, el.tagName.toLowerCase());
                if (seen.has(css)) return null;
                seen.add(css);
                const heading = el.querySelector('h1,h2,h3,h4');
                const title   = heading ? (heading.innerText || '').trim().slice(0, 80) : '';
                const text    = (el.innerText || '').trim().slice(0, 100);
                const visible = el.offsetParent !== null;
                const rect    = el.getBoundingClientRect();
                const hasSize = rect.width > 50 && rect.height > 50;
                return { css_selector: css, title, text, visible, has_size: hasSize };
            }).filter(Boolean).filter(s => s.visible && s.has_size && (s.title || s.text));
        }"""
        )

        # ── NEW: HEADINGS (H2, H3) — vrais titres de sections ────────────────
        headings = safe_eval(
            "h1, h2, h3, h4",
            _STABLE_CSS_JS + """
        els => {
            const seen = new Set();
            return els.slice(0, 15).map(el => {
                const css  = stableCSS(el, el.tagName.toLowerCase());
                const text = (el.innerText || '').trim();
                if (!text || seen.has(text)) return null;
                seen.add(text);
                const visible = el.offsetParent !== null;
                return {
                    css_selector: css,
                    tag:  el.tagName.toLowerCase(),
                    text: text.slice(0, 100),
                    visible
                };
            }).filter(Boolean).filter(h => h.visible && h.text.length > 2);
        }"""
        )

        # ── NEW: CARDS / ITEMS avec liens ─────────────────────────────────────
        cards = safe_eval(
            "[class*='card'], [class*='item'], [class*='post'], "
            "[class*='bloc'], [class*='tile'], [class*='box']",
            _STABLE_CSS_JS + """
        els => {
            const seen = new Set();
            return els.slice(0, 10).map(el => {
                const css     = stableCSS(el, '[class*=card]');
                if (seen.has(css)) return null;
                seen.add(css);
                const heading = el.querySelector('h1,h2,h3,h4,h5');
                const link    = el.querySelector('a');
                const title   = heading ? (heading.innerText || '').trim().slice(0, 60) : '';
                const href    = link ? (link.href || '') : '';
                const visible = el.offsetParent !== null;
                const rect    = el.getBoundingClientRect();
                return {
                    css_selector: css,
                    title, href,
                    visible,
                    has_size: rect.width > 30 && rect.height > 30
                };
            }).filter(Boolean).filter(c => c.visible && c.has_size);
        }"""
        )

        # ── PERFORMANCE & SPA DETECTION ───────────────────────────────────────
        load_time = 0
        try:
            load_time = page.evaluate("""() => {
                const t = performance.timing;
                const lt = t.loadEventEnd - t.navigationStart;
                return lt > 0 ? lt : Date.now() - t.navigationStart;
            }""")
        except Exception:
            pass

        is_spa = False
        try:
            is_spa = page.evaluate("""() => {
                return !!(window.React || window.angular || window.Vue ||
                          window.__NEXT_DATA__ || window.nuxt || window.__NUXT__ ||
                          window.Ember || document.querySelector('[ng-app]') ||
                          document.querySelector('[data-reactroot]') ||
                          document.querySelector('#__next') ||
                          document.querySelector('#app[data-v-app]'));
            }""")
        except Exception:
            pass


      # ── EXTRACTION DIRECTE DU CONTENU ────────────────────────────────────────
        try:
            page_text = page.evaluate("""() => {
                return {
                    all_links: Array.from(document.querySelectorAll('a')).slice(0,50).map(a => ({
                        text: (a.innerText||'').trim(),
                        href: a.href||''
                    })).filter(a => a.text && a.href),
                    all_headings: Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => ({
                         tag: h.tagName,
                         text: (h.innerText||'').trim()
                    })).filter(h => h.text),
                    all_buttons: Array.from(document.querySelectorAll('button, a.btn, a[class*=btn], input[type=submit]')).map(b => ({
                        text: (b.innerText||b.value||'').trim(),
                        href: b.href||''
                    })).filter(b => b.text),
                    all_sections: Array.from(document.querySelectorAll('section, .section, [class*=section]')).slice(0,10).map(s => ({
                        class: s.className||'',
                        text: (s.innerText||'').trim().slice(0,100)
                    }))
                }
            }""")
            print(f"[SCRAPER] all_links: {len(page_text.get('all_links', []))}")
            print(f"[SCRAPER] all_headings: {len(page_text.get('all_headings', []))}")
            print(f"[SCRAPER] all_buttons: {len(page_text.get('all_buttons', []))}")
            print(f"[SCRAPER] all_sections: {len(page_text.get('all_sections', []))}")
        except Exception as e:
            print(f"[SCRAPER] page_text error: {e}")

        browser.close()

        return {
            # ── Existing keys (unchanged) ──────────────────────────────────
            "url":            url,
            "title":          title,
            "is_spa":         is_spa,
            "load_time_ms":   load_time,
            "inputs":         inputs,
            "buttons":        buttons,
            "links":          links,
            "forms":          forms,
            "selects":        selects,
            "textareas":      textareas,
            "checkboxes":     checkboxes,
            "add_to_cart":    add_to_cart,
            "pagination":     pagination,
            "nav_links":      nav_links,
            "modals":         modals,
            "images":         images,
            "alerts":         alerts,
            "search_inputs":  search_inputs,
            "filters":        filters,
            # ── Existing NEW keys ──────────────────────────────────────────
            "lang_switcher":  lang_switcher,
            "search_bar":     search_bar,
            "images_audit":   images_audit,
            "icons":          icons,
            "input_fields":   input_fields,
            # ── NEW v2 keys ────────────────────────────────────────────────
            "footer_data":        footer_data,        # footer + contact + emails + phones
            "content_sections":   content_sections,   # sections/piliers/cards/articles
            "headings":           headings,            # H2, H3 titres réels
            "cards":              cards,               # cards/items avec liens
        }