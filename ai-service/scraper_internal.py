import os
from dotenv import load_dotenv

load_dotenv()
# scraper_internal.py — Back Office Internal Scraper
# Supports:
#   1. Login page testing (smoke + negative tests — CAPTCHA-aware)
#   2. Cookie-based session injection → direct dashboard scraping
#   3. Full dashboard DOM analysis after auth

import html

from playwright.sync_api import sync_playwright
import time
import json
import pytesseract
from PIL import Image
import base64
import io

import requests

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Token JWT valide jusqu'en janvier 2027
_CACHED_TOKEN = os.getenv("ANPE_TOKEN")


API_BASE = "https://anpe.back.demopro.tn:10443/api/v1"


# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

LOGIN_URL     = "https://anpe.demopro.tn:10443/admin-anpe/login"
DASHBOARD_URL = "https://anpe.demopro.tn:10443/dashboard"

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


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
def _get_captcha_token(email: str, password: str, api_base: str) -> str:
    """Login via API with auto OCR captcha solving — with retry"""
    import re
    from PIL import ImageEnhance, ImageOps
    import numpy as np

    for attempt in range(5):  # max 5 tentatives
        # Étape 1 — récupère un nouveau captcha
        r = requests.get(f"{api_base}/auth/captcha", verify=False, timeout=10)
        data = r.json()
        captcha_id = data["captcha_id"]
        image_b64 = data["captcha"].split(",")[1]

        # Étape 2 — OCR
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("L")
        width, height = image.size
        image = image.resize((width * 3, height * 3), Image.LANCZOS)
        image = ImageEnhance.Contrast(image).enhance(2.0)
        image = ImageOps.invert(image)
        img_array = np.array(image)
        img_array = (img_array > 128).astype(np.uint8) * 255
        image = Image.fromarray(img_array)
        image.save(r'C:\Users\syrin\Desktop\captcha_debug.png')

        captcha_code = pytesseract.image_to_string(
            image, config="--psm 7"
        ).strip()

        # Nettoie les caractères parasites
        captcha_code = re.sub(r'[^a-zA-Z0-9]', '', captcha_code)

        print(f"[CAPTCHA] attempt={attempt+1} | id={captcha_id} | code={captcha_code}")

        if not captcha_code:
            print(f"[CAPTCHA] Code vide, retry...")
            continue

        # Étape 3 — login
        r2 = requests.post(
            f"{api_base}/auth/login",
            json={
                "email": email,
                "password": password,
                "captcha": captcha_code,
                "captcha_id": captcha_id,
                "code": ""
            },
            verify=False,
            timeout=10
        )
        result = r2.json()
        token = result.get("token") or result.get("access_token") or result.get("data", {}).get("token")

        if token:
            print(f"[AUTH] ✅ Token obtenu à l'attempt {attempt+1}")
            return token

        print(f"[AUTH] attempt={attempt+1} échoué: {result.get('message')}")

    raise Exception("Login failed after 5 attempts")

def scrape_internal(
    target_url:   str,
    cookies:      list  = None,
    token:        str   = None,
    username:     str   = None,
    password:     str   = None,
    login_url:    str   = None,
    scrape_login: bool  = False,
    wait_time:    int   = 2000,
) -> dict:

    if scrape_login:
        return _scrape_login_page(login_url or LOGIN_URL, wait_time)

    # ── Si token fourni explicitement, l'utiliser directement ──────────────
    if token:
        return _scrape_with_jwt(target_url, token, wait_time)

    # ── Si credentials fournis → tenter un VRAI login d'abord ──────────────
    if username and password:
        result = _scrape_with_credentials(
            target_url = target_url,
            username   = username,
            password   = password,
            login_url  = login_url or LOGIN_URL,
            wait_time  = wait_time,
        )

        # Si le login a réussi (pas de captcha, pas d'erreur) → on garde ce résultat
        login_result = result.get("login_result", {})
        if login_result.get("success"):
            print(f"[AUTH] ✅ Login réussi avec credentials fournis")
            return result

        # Si bloqué par CAPTCHA → fallback sur le token caché (cas ANPE connu)
        if login_result.get("captcha_blocked") and _CACHED_TOKEN:
            print(f"[AUTH] ⚠️ CAPTCHA détecté — fallback sur token caché (ANPE)")
            return _scrape_with_jwt(target_url, _CACHED_TOKEN, wait_time)

        # Sinon (login échoué pour une autre raison) → retourner l'erreur telle quelle
        print(f"[AUTH] ❌ Login échoué: {login_result.get('error_message')}")
        return result

    if cookies:
        return _scrape_with_cookies(target_url, cookies, wait_time)

    return _scrape_login_page(login_url or LOGIN_URL, wait_time)

    # Auto-login via cached token
    if username and password and not token:
        token = _CACHED_TOKEN
        print(f"[AUTH] Token cached utilisé ✅")

    if token:
        return _scrape_with_jwt(target_url, token, wait_time)

    if cookies:
        return _scrape_with_cookies(target_url, cookies, wait_time)

    return _scrape_login_page(login_url or LOGIN_URL, wait_time)


# ─────────────────────────────────────────────────────────────────────────────
# MODE 1 — Scrape Login Page (no auth)
# Tests: page loads, fields present, button visible, negative tests
# ─────────────────────────────────────────────────────────────────────────────

def _scrape_login_page(login_url: str, wait_time: int = 2000) -> dict:
    """
    Scrapes the login page structure without authenticating.
    Detects: email field, password field, captcha, submit button,
             error containers, lang switcher.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox", "--disable-dev-shm-usage",
                "--ignore-certificate-errors",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        # ── Load login page ──────────────────────────────────────────────────
        loaded = False
        for wait_until in ["networkidle", "load", "domcontentloaded"]:
            try:
                page.goto(login_url, timeout=30000, wait_until=wait_until)
                loaded = True
                break
            except Exception:
                pass

        if not loaded:
            browser.close()
            return {"error": "Cannot load login page", "url": login_url}

        try:
            page.wait_for_selector("body", timeout=10000)
            page.wait_for_timeout(wait_time)
        except Exception:
            pass

        title = page.title()

        def safe_eval(selector, script):
            try:
                return page.eval_on_selector_all(selector, script)
            except Exception:
                return []

        email_inputs = safe_eval(
            "input[type='email'], input[type='text'], "
            "input[name*='email' i], input[name*='username' i], input[name*='login' i], "
            "input[name*='mail' i], input[name*='user' i], "
            "input[placeholder*='email' i], input[placeholder*='mail' i], "
            "input[placeholder*='utilisateur' i], input[placeholder*='identifiant' i], "
            "input[placeholder*='login' i], input[placeholder*='username' i]",
            _STABLE_CSS_JS + """
            els => els.map(el => ({
                css_selector: stableCSS(el, "input[type='text']"),
                type: el.type || 'text',
                name: el.name || '',
                placeholder: el.placeholder || '',
                required: el.required,
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )
        
        password_inputs = safe_eval(
            "input[type='password']",
            _STABLE_CSS_JS + """
            els => els.map(el => ({
                css_selector: stableCSS(el, "input[type='password']"),
                type: 'password',
                name: el.name || '',
                placeholder: el.placeholder || '',
                required: el.required,
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )

        # ── Detect CAPTCHA ────────────────────────────────────────────────────
        captcha_elements = safe_eval(
            "canvas, img[src*='captcha' i], img[src*='security' i], "
            "[class*='captcha' i], [id*='captcha' i], "
            "input[placeholder*='code' i], input[placeholder*='captcha' i], "
            "input[placeholder*='sécurité' i], input[placeholder*='securite' i]",
            _STABLE_CSS_JS + """
            els => els.map(el => ({
                css_selector: stableCSS(el, '[class*=captcha]'),
                tag: el.tagName.toLowerCase(),
                type: el.type || '',
                placeholder: el.placeholder || '',
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )

        # ── Detect CAPTCHA input (where user types the code) ──────────────────
        captcha_inputs = safe_eval(
            "input[placeholder*='code' i], input[placeholder*='saisir' i], "
            "input[placeholder*='captcha' i], input[placeholder*='sécurité' i]",
            _STABLE_CSS_JS + """
            els => els.map(el => ({
                css_selector: stableCSS(el, "input[placeholder*='code']"),
                placeholder: el.placeholder || '',
                name: el.name || '',
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )

        # ── Detect submit button ──────────────────────────────────────────────
        submit_buttons = safe_eval(
            "button[type='submit'], input[type='submit'], "
            "button:has-text('connecter'), button:has-text('login'), "
            "button:has-text('Se connecter')",
            _STABLE_CSS_JS + """
            els => els.map(el => ({
                css_selector: stableCSS(el, 'button[type=submit]'),
                text: (el.innerText || el.value || '').trim(),
                type: el.type || 'button',
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )

        # ── Detect error containers ───────────────────────────────────────────
        error_containers = safe_eval(
            "[class*='error' i], [class*='alert' i], [class*='invalid' i], "
            "[class*='danger' i], [id*='error' i], [role='alert'], "
            ".text-danger, .text-red, .validation-error",
            _STABLE_CSS_JS + """
            els => els.slice(0, 10).map(el => ({
                css_selector: stableCSS(el, '.error'),
                text: (el.innerText || '').trim().slice(0, 100),
                visible: el.offsetParent !== null,
            }))
            """
        )

        # ── Detect lang switcher ──────────────────────────────────────────────
        lang_switcher = safe_eval(
            "[class*='lang' i], select[name*='lang' i], "
            "button:has-text('Français'), button:has-text('العربية')",
            _STABLE_CSS_JS + """
            els => els.slice(0, 5).map(el => ({
                css_selector: stableCSS(el, '[class*=lang]'),
                text: (el.innerText || '').trim(),
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )

        # ── Detect logo ───────────────────────────────────────────────────────
        logos = safe_eval(
            "img[src*='logo' i], img[alt*='logo' i], img[alt*='anpe' i], "
            ".logo img, header img, .brand img",
            _STABLE_CSS_JS + """
            els => els.slice(0, 3).map(el => ({
                css_selector: stableCSS(el, 'img'),
                src: el.src || '',
                alt: el.alt || '',
                visible: el.offsetParent !== null,
                width: el.offsetWidth,
                height: el.offsetHeight,
            })).filter(e => e.visible && e.width > 20)
            """
        )

        # ── Detect "forgot password" link ─────────────────────────────────────
        forgot_links = safe_eval(
            "a[href*='forgot' i], a[href*='reset' i], a[href*='oubli' i], "
            "a:has-text('oublié'), a:has-text('forgot')",
            _STABLE_CSS_JS + """
            els => els.slice(0, 3).map(el => ({
                css_selector: stableCSS(el, 'a'),
                text: (el.innerText || '').trim(),
                href: el.href || '',
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )

        # ── Detect form ───────────────────────────────────────────────────────
        forms = safe_eval(
            "form",
            _STABLE_CSS_JS + """
            els => els.map(el => ({
                css_selector: stableCSS(el, 'form'),
                action: el.action || '',
                method: el.method || 'post',
                visible: el.offsetParent !== null,
            })).filter(e => e.visible)
            """
        )

        # ── Load time ─────────────────────────────────────────────────────────
        load_time = 0
        try:
            load_time = page.evaluate("""() => {
                const t = performance.timing;
                const lt = t.loadEventEnd - t.navigationStart;
                return lt > 0 ? lt : Date.now() - t.navigationStart;
            }""")
        except Exception:
            pass

        # ── HTTP check ────────────────────────────────────────────────────────
        import requests as req_lib
        http_status = 0
        try:
            r = req_lib.get(login_url, timeout=10, verify=False)
            http_status = r.status_code
        except Exception:
            pass

        has_captcha = len(captcha_elements) > 0 or len(captcha_inputs) > 0

        browser.close()

        return {
            # Meta
            "url":            login_url,
            "title":          title,
            "is_login_page":  True,
            "has_captcha":    has_captcha,
            "http_status":    http_status,
            "load_time_ms":   load_time,
            "is_spa":         False,

            # Login form elements
            "email_inputs":     email_inputs,
            "password_inputs":  password_inputs,
            "captcha_elements": captcha_elements,
            "captcha_inputs":   captcha_inputs,
            "submit_buttons":   submit_buttons,
            "forms":            forms,
            "forgot_links":     forgot_links,

            # Feedback elements
            "error_containers": error_containers,
            "lang_switcher":    lang_switcher,
            "logos":            logos,

            # Standard scraper compat keys (for generator.py)
            "inputs":         email_inputs + password_inputs + captcha_inputs,
            "buttons":        submit_buttons,
            "nav_links":      [],
            "images":         logos,
            "alerts":         error_containers,
            "search_bar":     [],
            "search_inputs":  [],
            "footer_data":    [],
            "content_sections": [],
            "headings":       [],
            "cards":          [],
            "images_audit":   logos,
            "icons":          [],
            "input_fields":   email_inputs + password_inputs + captcha_inputs,
            "modals":         [],
            "pagination":     [],
            "lang_switcher":  lang_switcher,
            "filters":        [],
            "selects":        [],
            "textareas":      [],
            "checkboxes":     [],
            "add_to_cart":    [],
            "links":          forgot_links,
        }


# ─────────────────────────────────────────────────────────────────────────────
# MODE 2 — Scrape Dashboard with Cookie Session
# ─────────────────────────────────────────────────────────────────────────────

def _scrape_with_cookies(
    target_url: str,
    cookies:    list,
    wait_time:  int = 2000,
) -> dict:
    """
    Injects session cookies to bypass login,
    then scrapes the target dashboard page.

    cookies format (list of dicts):
    [
        {"name": "session", "value": "abc123", "domain": "anpe.demopro.tn"},
        ...
    ]
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox", "--disable-dev-shm-usage",
                "--ignore-certificate-errors",
            ],
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )

        # ── Inject cookies ────────────────────────────────────────────────────
        try:
            context.add_cookies(cookies)
        except Exception as e:
            browser.close()
            return {"error": f"Invalid cookies: {e}", "url": target_url}

        page = context.new_page()

        # ── Load dashboard ────────────────────────────────────────────────────
        loaded = False
        for wait_until in ["networkidle", "load", "domcontentloaded"]:
            try:
                page.goto(target_url, timeout=30000, wait_until=wait_until)
                loaded = True
                break
            except Exception:
                pass

        if not loaded:
            browser.close()
            return {"error": "Cannot load dashboard", "url": target_url}

        # ── Check if redirected back to login (session expired) ───────────────
        current_url = page.url
        if "login" in current_url.lower() or "unauthorized" in current_url.lower():
            browser.close()
            return {
                "error": "Redirected to unauthorized",
                "url": target_url,
                "redirected_to": current_url,
            }

        try:
            page.wait_for_selector("body", timeout=10000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(wait_time)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(500)
        except Exception:
            pass

        result = _scrape_dashboard_content(page, target_url)
        browser.close()
        return result
    
def _scrape_with_jwt(
    target_url: str,
    token:      str,
    wait_time:  int = 2000,
) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--ignore-certificate-errors"],
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        # ── Étape 1 : ouvre la page login pour initialiser le domaine ─────────
        try:
            page.goto("https://anpe.demopro.tn:10443/dashboard", timeout=30000, wait_until="domcontentloaded")
        except Exception:
            pass

        page.wait_for_timeout(1000)

        # ── Étape 2 : injecte TOUS les items localStorage nécessaires ─────────
        try:
            page.evaluate("""() => {
            localStorage.setItem('token', '""" + token + """');
            localStorage.setItem('refreshToken', 'b72e3bfac0af120fb4c55ade2c2d1ba6d8579302d1d37988be39d193acf9a113af6a1bcefee0a018');
            localStorage.setItem('i18nextLng', 'fr');
            localStorage.setItem('user', JSON.stringify({
            "id": "a01ea004-5074-4512-9e0d-a679845f5dce",
            "fullName": "Super Admin",
            "email": "admin@admin.com",
            "is_super": true,
            "status": "active",
            "roles": [{"id": "a01ea004-0189-40e7-8dca-5f3e21a96630", "name": "super_admin"}],
            "permissions": [{"id": "31d71f0e-b76d-4417-902a-4ad1ac898917", "name": "view_dashboard", "type_code": "dashboard"}]
        }));
        localStorage.setItem('roles', JSON.stringify([{"id": "a01ea004-0189-40e7-8dca-5f3e21a96630", "name": "super_admin"}]));
        localStorage.setItem('permissions', JSON.stringify([
            {"id": "31d71f0e-b76d-4417-902a-4ad1ac898917", "name": "view_dashboard", "type_code": "dashboard"},
            {"id": "a57fcffd-165c-4eda-a419-32370bc5a7ea", "name": "view_statistiques", "type_code": "statistiques"},
            {"id": "629569f8-cdbf-4f4f-b0c7-99e4dc89ab58", "name": "view_audit", "type_code": "audits"},
            {"id": "465b2adf-f586-489a-abda-09bc4a8fd9d1", "name": "read_dossiers", "type_code": "reception"},
            {"id": "bc41cdae-c3dd-40ae-b47d-89def93fd1d7", "name": "read_commission", "type_code": "commissions"},
            {"id": "93f27077-e2b1-40bc-9895-3da7fa16c99b", "name": "read_dossier_eie", "type_code": "eie"},
            {"id": "0bca0396-b649-462f-b955-513d4fa2a222", "name": "read_dossier_ed", "type_code": "ed"},
            {"id": "c20749b9-aa2c-4004-9a1c-1f3e6421a0fd", "name": "read_dossier_af", "type_code": "af"},
            {"id": "1c7bdc43-904c-4caf-9fc9-11d97346b591", "name": "read_role", "type_code": "role"},
            {"id": "700e4a75-2f10-42d5-a3ef-7d1a7d77e15f", "name": "read_user", "type_code": "user"},
            {"id": "7ecb6362-67fe-4693-8057-15d3d1e53377", "name": "refuse_visite", "type_code": "visite"},
            {"id": "b1b1d205-3b60-4f26-a236-409820452dd8", "name": "update_visite", "type_code": "visite"},
            {"id": "b4287f83-af63-4f9b-a42d-9a1747556561", "name": "accept_visite", "type_code": "visite"},
            {"id": "9b2c3d4e-5f6a-7890-bcde-f01234567890", "name": "read_reunion", "type_code": "reunions"}
        ]));
        localStorage.setItem('lastActivityTimestamp', Date.now().toString());
    }""")
            
        except Exception as e:
            browser.close()
            return {{"error": f"Cannot inject token: {{e}}", "url": target_url}}

        page.wait_for_timeout(500)
        
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("requestfailed", lambda req: errors.append(f"[FAIL] {req.url} — {req.failure}"))

        # ── Étape 3 : recharge et attend que le dashboard soit vraiment là ─────
        try:
            page.goto(target_url, timeout=30000, wait_until="networkidle")
        except Exception:
            try:
                page.goto(target_url, timeout=30000, wait_until="domcontentloaded")
            except Exception:
                pass

        # ── Étape 4 : attend que le dashboard charge (pas login) ──────────────
        # Attendre que React rende le contenu
        try:
            page.wait_for_function(
            "() => document.querySelectorAll('.ant-menu-item').length > 0",
            timeout=15000
            )
            print(f"[JWT] React rendered ✅")
            
            try:
                page.evaluate("""() => {
                    document.querySelectorAll('.ant-menu-submenu-arrow, .ant-menu-submenu-title')
                        .forEach(el => el.click());
                }""")
                page.wait_for_timeout(1000)
            except Exception:
                pass
        except Exception as e:
            print(f"[JWT] React render timeout: {e}")
        page.wait_for_timeout(2000)
        
        print(f"[DEBUG] Console errors: {errors[:10]}")

        current_url = page.url
        print(f"[JWT] After reload → url={current_url}")

        if "login" in current_url.lower():
            browser.close()
            return {
                "error":         "Token invalid or expired — redirected to login",
                "url":           target_url,
                "redirected_to": current_url,
            }

        # ── Étape 5 : scroll pour charger les éléments lazy ───────────────────
        try:
            page.wait_for_selector("body", timeout=10000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(wait_time)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(500)
        except Exception:
            pass

        result = _scrape_dashboard_content(page, target_url)
        # DEBUG — sauvegarde le HTML pour voir ce que Playwright voit
        html = page.content()
        with open(r'C:\Users\syrin\Desktop\dashboard_debug.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"[DEBUG] HTML sauvegardé | longueur={len(html)}")
        print(f"[DEBUG] ant-menu-item dans HTML: {'ant-menu-item' in html}")
        print(f"[DEBUG] ant-layout-header dans HTML: {'ant-layout-header' in html}")
        browser.close()
        return result


# ─────────────────────────────────────────────────────────────────────────────
# MODE 3 — Attempt Login with Credentials (CAPTCHA-aware)
# ─────────────────────────────────────────────────────────────────────────────

def _scrape_with_credentials(
    target_url: str,
    username:   str,
    password:   str,
    login_url:  str,
    wait_time:  int = 2000,
) -> dict:
    """
    Attempts to log in with credentials.
    Since CAPTCHA is present, full login will likely fail.
    Returns login page data + partial test results about the login form.
    """
    login_result = {
        "attempted": True,
        "success":   False,
        "has_captcha": False,
        "captcha_blocked": False,
        "error_message": None,
        "redirected_to": None,
    }
    dashboard_result = None  # rempli seulement si le login réussit vraiment
    load_error       = None  # rempli si la page login ne charge pas du tout

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox", "--disable-dev-shm-usage",
                "--ignore-certificate-errors",
            ],
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
        )
        page = context.new_page()

        # ── Load login page ───────────────────────────────────────────────────
        try:
            page.goto(login_url, timeout=30000, wait_until="networkidle")
        except Exception:
            try:
                page.goto(login_url, timeout=30000, wait_until="domcontentloaded")
            except Exception:
                load_error = "Cannot load login page"

        if not load_error:
            page.wait_for_timeout(1500)

            try:
                email_sel = (
                    "input[type='email'], input[type='text'], "
                    "input[name*='email' i], input[name*='username' i], "
                    "input[placeholder*='email' i], input[placeholder*='mail' i], "
                    "input[placeholder*='utilisateur' i]"
                )
                page.wait_for_selector(email_sel, timeout=8000)
                page.fill(email_sel, username)

                # Fill password
                pwd_sel = "input[type='password']"
                page.wait_for_selector(pwd_sel, timeout=5000)
                page.fill(pwd_sel, password)

                # Check for CAPTCHA input
                captcha_input = page.query_selector(
                    "input[placeholder*='code' i], input[placeholder*='saisir' i], "
                    "input[placeholder*='sécurité' i]"
                )
                if captcha_input:
                    login_result["has_captcha"]     = True
                    login_result["captcha_blocked"] = True
                    login_result["error_message"]   = (
                        "CAPTCHA detected — automated login blocked. "
                        "Use cookie-based session injection instead."
                    )

                # Click submit anyway (to test form behavior)
                submit = page.query_selector("button[type='submit'], input[type='submit']")
                if submit:
                    submit.click()
                    page.wait_for_timeout(2000)

                current_url = page.url
                login_result["redirected_to"] = current_url

                if "login" not in current_url.lower():
                    login_result["success"] = True
                    # Scrape dashboard if login succeeded — toujours dans le même browser
                    dashboard_result = _scrape_dashboard_content(page, current_url)

            except Exception as e:
                login_result["error_message"] = str(e)[:200]

        # ── Fermeture propre AVANT toute réouverture de sync_playwright ────────
        browser.close()

    # ── ICI on est sorti du with : browser fermé, aucun conflit possible ───────

    if load_error:
        return {"error": load_error, "url": login_url}

    if dashboard_result is not None:
        dashboard_result["login_result"] = login_result
        return dashboard_result

    # Login échoué (captcha ou credentials invalides) — on rescrape la login page
    # via un tout nouveau sync_playwright(), maintenant que le premier est fermé.
    login_page_data = _scrape_login_page(login_url, wait_time)
    login_page_data["login_result"]     = login_result
    login_page_data["credentials_test"] = {
        "username_filled": True,
        "password_filled": True,
        "captcha_present": login_result["has_captcha"],
        "form_submitted":  True,
    }

    return login_page_data


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD CONTENT SCRAPER
# ─────────────────────────────────────────────────────────────────────────────
def _scrape_dashboard_content(page, url: str) -> dict:
    """
    Scrapes the full dashboard content after authentication.
    Detects: sidebar menu, stat cards, header elements, data tables,
             action buttons, notifications, etc.
    """

    def safe_eval(selector, script):
        try:
            return page.eval_on_selector_all(selector, script)
        except Exception:
            return []

    title = page.title()
    # DEBUG direct
    try:
        count = page.eval_on_selector_all('.ant-menu-item', 'els => els.length')
        print(f"[DEBUG] .ant-menu-item count = {count}")
    
        texts = page.eval_on_selector_all('.ant-menu-item', 'els => els.map(e => e.textContent.trim()).slice(0,5)')
        print(f"[DEBUG] .ant-menu-item texts = {texts}")
    
        header = page.eval_on_selector_all('.ant-layout-header', 'els => els.length')
        print(f"[DEBUG] .ant-layout-header count = {header}")
    except Exception as e:
        print(f"[DEBUG] eval error: {e}")
        
    try:
        frames_info = []
        for frame in page.frames:
            try:
                count = frame.eval_on_selector_all('.ant-menu-item', 'els => els.length')
                url = frame.url
                frames_info.append(f"frame={url} | count={count}")
            except Exception as fe:
                frames_info.append(f"frame error: {fe}")
        print(f"[DEBUG] frames: {frames_info}")
    
        all_divs = page.eval_on_selector_all('div', 'els => els.length')
        print(f"[DEBUG] total divs = {all_divs}")
    
        body_text = page.eval_on_selector('body', 'el => el.innerHTML.length')
        print(f"[DEBUG] body innerHTML length = {body_text}")
    
    except Exception as e:
        print(f"[DEBUG] error: {e}")

    # ── Sidebar menu items ────────────────────────────────────────────────────
    sidebar_items = safe_eval(
    ".ant-menu-item",
    """els => els.map(el => ({
        css_selector: '.ant-menu-item',
        text: (el.innerText || el.textContent || '').trim().slice(0, 60),
        href: '',
        is_active: el.classList.contains('ant-menu-item-selected'),
        visible: true,
    })).filter(e => e.text.length > 0)
    """
    )
    print(f"[DEBUG] sidebar_items raw = {sidebar_items}")
    
    # DEBUG — vérifie les classes de l'item actif
    active_check = page.eval_on_selector_all('.ant-menu-item', 
        'els => els.map(e => ({text: e.textContent.trim(), class: e.className}))')
    print(f"[DEBUG] active_check = {active_check}")
    
    # ── Charts / Graphiques ───────────────────────────────────────────────────
    charts = safe_eval(
        ".recharts-responsive-container, .recharts-wrapper",
        """els => els.map(el => ({
            css_selector: '.recharts-responsive-container',
            text: 'Chart',
            visible: true,
        }))
        """
    )
    print(f"[DEBUG] charts = {len(charts)}")

    # ── Stat cards (dashboard counters) ──────────────────────────────────────
    stat_cards = safe_eval(
    ".ant-card",
    """els => {
        return els.slice(0, 20).map(el => {
            const title = (el.querySelector('.ant-card-head-title') || {}).innerText || '';
            const body  = (el.querySelector('.ant-card-body') || {}).innerText || '';
            const rect  = el.getBoundingClientRect();
            return {
                css_selector: '.ant-card',
                title: title.trim().slice(0, 80),
                number: body.trim().slice(0, 50),
                visible: true,
                has_size: rect.width > 50 && rect.height > 50,
            };
        }).filter(e => e.has_size);
    }
    """
)

    # ── Header elements ───────────────────────────────────────────────────────
    header_elements = safe_eval(
            ".ant-layout-header",
            """els => els.map(el => ({
            css_selector: '.ant-layout-header',
            text: (el.innerText || el.textContent || '').trim().slice(0, 100),
            visible: true,
        }))
        """
    )
    print(f"[DEBUG] header_elements raw = {header_elements}")

    # ── Notification bell ─────────────────────────────────────────────────────
    notification_bell = safe_eval(
        ".anticon-bell, .ant-badge.ant-dropdown-trigger",
        """els => els.slice(0, 3).map(el => ({
            css_selector: '.anticon-bell',
            text: 'Notification bell',
            visible: true,
        }))
        """
    )

    # ── User profile / account ────────────────────────────────────────────────
    user_profile = safe_eval(
        ".dropdown-user-profil",
        """els => els.slice(0, 3).map(el => ({
            css_selector: '.dropdown-user-profil',
            text: (el.innerText || '').trim().slice(0, 50),
            visible: true,
        })).filter(e => e.text.length > 0)
        """
    )

    # ── Action buttons ────────────────────────────────────────────────────────
    action_buttons = safe_eval(
        "button, .btn, [class*='btn'], input[type='button'], a.btn",
        _STABLE_CSS_JS + """
        els => {
            const seen = new Set();
            return els.slice(0, 20).map(el => {
                const text = (el.innerText || el.value || '').trim();
                const css  = stableCSS(el, 'button');
                if (!text || seen.has(text)) return null;
                seen.add(text);
                return {
                    css_selector: css,
                    text: text.slice(0, 50),
                    type: el.type || 'button',
                    visible: el.offsetParent !== null,
                };
            }).filter(e => e && e.visible);
        }
        """
    )

    # ── Data tables ───────────────────────────────────────────────────────────
    data_tables = safe_eval(
        "table, .table, [class*='datatable' i], [class*='data-table' i]",
        _STABLE_CSS_JS + """
        els => els.slice(0, 5).map(el => {
            const css  = stableCSS(el, 'table');
            const rows = el.querySelectorAll('tr').length;
            const cols = el.querySelectorAll('th, td:first-child').length;
            return {
                css_selector: css,
                rows: rows,
                cols: cols,
                visible: el.offsetParent !== null,
                has_data: rows > 1,
            };
        }).filter(e => e.visible)
        """
    )
    
   
    # ── Ant Table ─────────────────────────────────────────────────────────────
    ant_tables = safe_eval(
        ".ant-table-wrapper",
        """els => els.map(el => {
            const parent = el.closest('.ant-card, .ant-pro-card, section') || el.parentElement;
            const titleEl = parent ? parent.querySelector(
                '.ant-card-head-title, .ant-pro-card-title, h2, h3, h4'
            ) : null;
            const title = titleEl
                ? titleEl.innerText.trim().slice(0, 60)
                : 'Tableau de données';
            return {
                css_selector: '.ant-table-wrapper',
                text: title,
                title: title,
                visible: true,
            };
        })
        """
    )
    print(f"[DEBUG] ant_tables = {len(ant_tables)}")

    # ── Forms (filters, search) ───────────────────────────────────────────────
    forms = safe_eval(
        "form, .filter-form, [class*='search-form' i]",
        _STABLE_CSS_JS + """
        els => els.slice(0, 5).map(el => ({
            css_selector: stableCSS(el, 'form'),
            action: el.action || '',
            visible: el.offsetParent !== null,
        })).filter(e => e.visible)
        """
    )

    # ── Search inputs ─────────────────────────────────────────────────────────
    search_inputs = safe_eval(
        "input[type='search'], input[placeholder*='search' i], "
        "input[placeholder*='chercher' i], input[placeholder*='recherche' i]",
        _STABLE_CSS_JS + """
        els => els.slice(0, 5).map(el => ({
            css_selector: stableCSS(el, 'input[type=search]'),
            placeholder: el.placeholder || '',
            visible: el.offsetParent !== null,
        })).filter(e => e.visible)
        """
    )
    
    
    # ── Filter inputs (back office filters) ──────────────────────────────────
    filter_inputs = safe_eval(
        "input[placeholder*='valeur' i], input[placeholder*='Entrer' i], "
        "input[placeholder*='numéro' i], input[placeholder*='référence' i]",
        """els => els.map(el => ({
            css_selector: '.ant-input',
            text: el.closest('.ant-form-item') 
                ? (el.closest('.ant-form-item').querySelector('label') || {}).innerText || el.placeholder || 'Filtre'
                : el.placeholder || 'Filtre',
            title: el.closest('.ant-form-item')
                ? (el.closest('.ant-form-item').querySelector('label') || {}).innerText || el.placeholder || 'Filtre'
                : el.placeholder || 'Filtre',
            placeholder: el.placeholder || '',
            visible: true,
        })).filter(e => e.text.length > 0)
        """
    )
    print(f"[DEBUG] filter_inputs = {len(filter_inputs)}")

    # ── Filter button ─────────────────────────────────────────────────────────
    filter_buttons = safe_eval(
        "button.ant-btn-primary",
        """els => els.map(el => ({
            css_selector: '.ant-btn-primary',
            text: (el.innerText || '').trim(),
            title: 'Bouton Filtrer',
            visible: true,
        })).filter(e => e.text.length > 0)
        """
    )
    print(f"[DEBUG] filter_buttons = {len(filter_buttons)}")

    # ── Export buttons ────────────────────────────────────────────────────────
    export_buttons = safe_eval(
        "button[class*='export' i], a[class*='export' i], "
        "button[class*='excel' i], a[href*='excel' i], a[href*='export' i], "
        "button:has-text('Export'), button:has-text('Excel')",
        _STABLE_CSS_JS + """
        els => els.slice(0, 5).map(el => ({
            css_selector: stableCSS(el, 'button'),
            text: (el.innerText || '').trim(),
            href: el.href || '',
            visible: el.offsetParent !== null,
        })).filter(e => e.visible)
        """
    )

    # ── Page headings ─────────────────────────────────────────────────────────
    headings = safe_eval(
        "h1, h2, h3",
        _STABLE_CSS_JS + """
        els => {
            const seen = new Set();
            return els.slice(0, 10).map(el => {
                const text = (el.innerText || '').trim();
                if (!text || seen.has(text)) return null;
                seen.add(text);
                return {
                    css_selector: stableCSS(el, el.tagName.toLowerCase()),
                    tag: el.tagName.toLowerCase(),
                    text: text.slice(0, 100),
                    visible: el.offsetParent !== null,
                };
            }).filter(e => e && e.visible);
        }
        """
    )

    # ── Lang switcher ─────────────────────────────────────────────────────────
    lang_switcher = safe_eval(
        "[class*='lang' i], select[name*='lang' i], "
        "button:has-text('Français'), button:has-text('Fr'), "
        "a:has-text('FR'), a:has-text('AR'), .lang-selector",
        _STABLE_CSS_JS + """
        els => els.slice(0, 5).map(el => ({
            css_selector: stableCSS(el, '[class*=lang]'),
            text: (el.innerText || '').trim(),
            visible: el.offsetParent !== null,
        })).filter(e => e.visible)
        """
    )

    # ── Breadcrumb ────────────────────────────────────────────────────────────
    breadcrumbs = safe_eval(
        ".ant-breadcrumb",
        """els => els.slice(0, 3).map(el => ({
            css_selector: '.ant-breadcrumb',
            text: (el.innerText || '').trim().slice(0, 100),
            visible: true,
        })).filter(e => e.text.length > 0)
        """
    )

    # ── Pagination ────────────────────────────────────────────────────────────
    pagination = safe_eval(
        ".ant-pagination",
        """els => els.slice(0, 1).map(el => ({
            css_selector: '.ant-pagination',
            text: (el.innerText || '').trim().slice(0, 50),
            visible: true,
        }))
        """
    )

    # ── Load time ─────────────────────────────────────────────────────────────
    load_time = 0
    try:
        load_time = page.evaluate("""() => {
            const t = performance.timing;
            const lt = t.loadEventEnd - t.navigationStart;
            return lt > 0 ? lt : Date.now() - t.navigationStart;
        }""")
    except Exception:
        pass

    # ── Is SPA ────────────────────────────────────────────────────────────────
    is_spa = False
    try:
        is_spa = page.evaluate("""() => {
            return !!(window.React || window.angular || window.Vue ||
                      window.__NEXT_DATA__ || window.nuxt ||
                      document.querySelector('[ng-app]') ||
                      document.querySelector('[data-reactroot]') ||
                      document.querySelector('#__next') ||
                      document.querySelector('#app[data-v-app]'));
        }""")
    except Exception:
        pass

    return {
        # Meta
        "url":            url,
        "title":          title,
        "is_login_page":  False,
        "is_dashboard":   True,
        "has_captcha":    False,
        "load_time_ms":   load_time,
        "is_spa":         is_spa,

        # Dashboard-specific
        "sidebar_items":    sidebar_items,
        "stat_cards":       stat_cards + charts + data_tables + ant_tables + filter_inputs + filter_buttons,
        "header_elements":  header_elements,
        "notification_bell": notification_bell,
        "user_profile":     user_profile,
        "action_buttons":   action_buttons,
        "data_tables":      data_tables,
        "export_buttons":   export_buttons,
        "breadcrumbs":      breadcrumbs,
        "lang_switcher":    lang_switcher,
        "search_inputs":    search_inputs,

        # Standard compat keys
        "inputs":           [],
        "buttons":          action_buttons + export_buttons,
        "nav_links":        sidebar_items,
        "forms":            forms,
        "images":           [],
        "alerts":           [],
        "search_bar":       search_inputs,
        "footer_data":      [],
        "content_sections": stat_cards + charts + data_tables + ant_tables + filter_inputs + filter_buttons,
        "headings":         headings,
        "cards":            stat_cards,
        "images_audit":     [],
        "icons":            [],
        "input_fields":     search_inputs,
        "modals":           [],
        "pagination":       pagination,
        "filters":          [],
        "selects":          [],
        "textareas":        [],
        "checkboxes":       [],
        "add_to_cart":      [],
        "links":            sidebar_items,
    }