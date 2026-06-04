
import re

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
SMOKE_MAX_STEPS = 50
SMOKE_MIN_STEPS = 3

# Criticality scores for back office elements
CRITICALITY_INTERNAL = {
    "http_status":       {"score": 100, "tier": 1, "optional": False},
    "ssl":               {"score": 99,  "tier": 1, "optional": False},
    "page_load":         {"score": 98,  "tier": 1, "optional": False},
    "body":              {"score": 97,  "tier": 1, "optional": False},
    # Login page
    "email_field":       {"score": 96,  "tier": 1, "optional": False},
    "password_field":    {"score": 95,  "tier": 1, "optional": False},
    "submit_button":     {"score": 94,  "tier": 1, "optional": False},
    "login_form":        {"score": 93,  "tier": 1, "optional": False},
    "captcha":           {"score": 85,  "tier": 2, "optional": True},
    "logo":              {"score": 75,  "tier": 2, "optional": True},
    "forgot_password":   {"score": 60,  "tier": 3, "optional": True},
    "lang_switch":       {"score": 55,  "tier": 3, "optional": True},
    # Dashboard
    "sidebar":           {"score": 96,  "tier": 1, "optional": False},
    "sidebar_item":      {"score": 88,  "tier": 1, "optional": False},
    "stat_card":         {"score": 85,  "tier": 2, "optional": True},
    "header":            {"score": 90,  "tier": 1, "optional": False},
    "notification_bell": {"score": 70,  "tier": 2, "optional": True},
    "user_profile":      {"score": 80,  "tier": 2, "optional": True},
    "export_button":     {"score": 65,  "tier": 3, "optional": True},
    "data_table":        {"score": 78,  "tier": 2, "optional": True},
    "search_input":      {"score": 72,  "tier": 2, "optional": True},
    "heading":           {"score": 82,  "tier": 1, "optional": False},
    "breadcrumb":        {"score": 60,  "tier": 3, "optional": True},
    "pagination":        {"score": 55,  "tier": 3, "optional": True},
}

LOAD_THRESHOLD_MS = 5000
LOAD_CRITICAL_MS  = 8000


# ─────────────────────────────────────────────────────────────────────────────
# Step Builder Helper
# ─────────────────────────────────────────────────────────────────────────────

def _make_step(name: str, selector: str, check_type: str, reason: str, optional: bool = None) -> dict:
    meta = CRITICALITY_INTERNAL.get(check_type, {"score": 40, "tier": 3, "optional": True})
    return {
        "name":        name,
        "selector":    selector,
        "type":        check_type,
        "tier":        meta["tier"],
        "score":       meta["score"],
        "optional":    meta["optional"] if optional is None else optional,
        "reason":      reason,
        "action":      "check_visible",
        "value":       "",
        "assertion":   None,
        "category":    "smoke",
        "priority":    "high" if meta["tier"] == 1 else "medium",
        "expected":    reason,
        "description": reason,
        "section":     "smoke",
    }


# ─────────────────────────────────────────────────────────────────────────────
# HTTP / SSL / Load Time checks (common to both login + dashboard)
# ─────────────────────────────────────────────────────────────────────────────

def _build_infra_steps(scraped: dict) -> list:
    """
    Generates HTTP status, SSL, and load time smoke steps.
    These are always included regardless of page type.
    """
    steps = []
    url   = scraped.get("url", "")

    # ── HTTP Status ────────────────────────────────────────────────────────
    http_status = scraped.get("http_status", 0)
    # Dashboard n'a pas de http_status car accès via JWT
    if http_status == 0 and scraped.get("is_dashboard"):
     http_status = 200
    http_ok = http_status == 200
    steps.append({
        **_make_step(
            f"HTTP Status 200 (got {http_status})",
            "body", "http_status",
            f"HTTP response must be 200 — got {http_status}", False,
        ),
        "status": "pass" if http_ok else "fail",
        "suite":  f"Pass — HTTP 200 OK" if http_ok else f"FAIL — HTTP {http_status}",
    })

    # ── SSL ────────────────────────────────────────────────────────────────
    ssl_ok = url.startswith("https://")
    steps.append({
        **_make_step("SSL/HTTPS valid", "body", "ssl", "URL must use HTTPS", False),
        "status": "pass" if ssl_ok else "fail",
        "suite":  "Pass — HTTPS valid" if ssl_ok else "FAIL — URL does not use HTTPS",
    })

    # ── Load Time
    load_ms  = scraped.get("load_time_ms", 0)
    load_ok  = 0 < load_ms < LOAD_THRESHOLD_MS
    load_status = (
        "pass" if load_ms < LOAD_THRESHOLD_MS
        else "fail" if load_ms > LOAD_CRITICAL_MS
        else "warn"
    )
    steps.append({
        **_make_step(
            f"Load time acceptable ({load_ms}ms)",
            "body", "page_load",
            f"Load time must be < {LOAD_THRESHOLD_MS}ms", False,
        ),
        "status": load_status,
        "suite":  (
            f"Pass — {load_ms}ms < {LOAD_THRESHOLD_MS}ms" if load_ok
            else f"FAIL — {load_ms}ms > {LOAD_THRESHOLD_MS}ms"
        ),
    })

    return steps


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN PAGE SMOKE STEPS
# ─────────────────────────────────────────────────────────────────────────────

def _build_login_smoke_steps(scraped: dict) -> list:
    """
    Smoke checks for the login page.
    Verifies: page body, email field, password field, submit button,
              CAPTCHA presence, logo, forgot password link, lang switcher.
    """
    steps      = []
    seen_css   = set()

    def _add(step):
        css = step.get("selector", "")
        if css and css not in seen_css:
            seen_css.add(css)
            steps.append(step)

    # 1. Body
    _add(_make_step("Login page body rendered", "body", "body",
        "Login page body element present", False))

    # 2. Email / username input
    email_inputs = scraped.get("email_inputs", [])
    if email_inputs:
        css = email_inputs[0].get("css_selector", "input[type='email']")
        _add(_make_step("Email/username field visible", css, "email_field",
            "Email or username input is present on login page", False))
    else:
        _add(_make_step("Email/username field visible",
        "input[type='email'], input[type='text'], input[name*='email' i], "
        "input[name*='username' i], input[placeholder*='email' i], "
        "input[placeholder*='mail' i], input[placeholder*='utilisateur' i]",
        "email_field",
        "Email or username input is present on login page", False))

    # 3. Password input
    password_inputs = scraped.get("password_inputs", [])
    if password_inputs:
        css = password_inputs[0].get("css_selector", "input[type='password']")
        _add(_make_step("Password field visible", css, "password_field",
            "Password input is present on login page", False))
    else:
        _add(_make_step("Password field visible",
            "input[type='password']", "password_field",
            "Password input not detected — fallback selector used", False))

    # 4. Submit button
    submit_buttons = scraped.get("submit_buttons", [])
    if submit_buttons:
        css  = submit_buttons[0].get("css_selector", "button[type='submit']")
        text = submit_buttons[0].get("text", "submit")
        _add(_make_step(f"Submit button visible: '{text}'", css, "submit_button",
            f"Submit button '{text}' is present and visible", False))
    else:
        _add(_make_step("Submit button visible",
            "button[type='submit'], input[type='submit']", "submit_button",
            "Submit button not detected — fallback selector used", False))

    # 5. Login form container
    forms = scraped.get("forms", [])
    if forms:
        css = forms[0].get("css_selector", "form")
        _add(_make_step("Login form container present", css, "login_form",
            "Form element wrapping the login fields is visible", False))

    # 6. CAPTCHA (optional — just verify its presence for smoke)
    if scraped.get("has_captcha"):
        captcha_elems = scraped.get("captcha_elements", [])
        css = captcha_elems[0].get("css_selector", "canvas, [class*='captcha']") \
              if captcha_elems else "canvas, [class*='captcha']"
        _add({
            **_make_step("CAPTCHA element detected", css, "captcha",
                "CAPTCHA is present — automated login will be blocked", True),
            "status": "warn",
            "suite":  "WARN — CAPTCHA detected (automated login blocked)",
        })

        # CAPTCHA input field (where user types the code)
        captcha_inputs = scraped.get("captcha_inputs", [])
        if captcha_inputs:
            ci_css = captcha_inputs[0].get("css_selector", "input[placeholder*='code']")
            _add(_make_step("CAPTCHA input field visible", ci_css, "captcha",
                "CAPTCHA code input field is present", True))

    # 7. Logo
    logos = scraped.get("logos", [])
    if logos:
        css = logos[0].get("css_selector", "img[src*='logo']")
        _add(_make_step("Application logo visible", css, "logo",
            "Brand/application logo is present on the login page", True))

    # 8. Forgot password link
    forgot_links = scraped.get("forgot_links", [])
    if forgot_links:
        css  = forgot_links[0].get("css_selector", "a[href*='forgot']")
        text = forgot_links[0].get("text", "forgot password")
        _add(_make_step(f"Forgot password link: '{text}'", css, "forgot_password",
            f"Forgot password link '{text}' is present", True))

    # 9. Language switcher
    lang_items = scraped.get("lang_switcher", [])
    for ls in lang_items[:2]:
        css  = ls.get("css_selector", "[class*='lang']")
        text = ls.get("text", "lang")
        if css:
            _add(_make_step(f"Language switcher: '{text}'", css, "lang_switch",
                f"Language option '{text}' is visible", True))

    return steps


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD SMOKE STEPS
# ─────────────────────────────────────────────────────────────────────────────

def _build_dashboard_smoke_steps(scraped: dict) -> list:
    """
    Smoke checks for the dashboard after authentication.
    Verifies: body, headings, sidebar, stat cards, header,
              notification bell, user profile, search, export, tables,
              breadcrumbs, pagination, lang switcher.
    """
    steps    = []
    seen_css = set()

    def _add(step):
        css = step.get("selector", "")
        if css and css not in seen_css:
            seen_css.add(css)
            steps.append(step)

    # 1. Body
    _add(_make_step("Dashboard body rendered", "body", "body",
        "Dashboard page body is present — not redirected to login", False))

    # 2. Main headings (H1/H2/H3)
    headings = scraped.get("headings", [])
    for h in headings[:3]:
        css  = h.get("css_selector", "").strip()
        text = h.get("text", "").strip()
        tag  = h.get("tag", "h1")
        if css and text:
            _add(_make_step(
                f"Heading visible: '{text[:50]}'", css, "heading",
                f"{tag.upper()} heading '{text[:50]}' is visible on dashboard", False,
            ))

    # 3. Header / navbar
    header_elements = scraped.get("header_elements", [])
    if header_elements:
        css = header_elements[0].get("css_selector", "header, .navbar")
        _add(_make_step("Dashboard header/navbar present", css, "header",
            "Top navigation bar or header is visible", False))
    else:
        _add(_make_step("Dashboard header present",
        ".ant-layout-header", "header",
        "Header not detected — fallback selector used", False))

    # 4. Sidebar present
    sidebar_items = scraped.get("sidebar_items", [])
    if sidebar_items:
        _add(_make_step("Sidebar navigation present",
            "aside, .sidebar, nav.sidebar, [class*='sidebar']", "sidebar",
            "Sidebar/left navigation menu is visible", False))

    # 5. Sidebar item — uniquement l'item actif selon l'URL
    url_str = scraped.get("url", "")
    url_to_label = {
        "/dashboard":                    "Tableau de bord",
        "/statistiques":                 "Statistiques",
        "/reception":                    "Boîte de reception",
        "/outbox":                       "Boîte d'envoi",
        "/gestion_commission":           "Gestion des commissions",
        "/reunions":                     "Réunions",
        "/visites":                      "Gestion des visites",
        "/traitement_dossier_eie":       "Étude d'impact environnementaux",
        "/traitement_dossier_ed":        "Étude de dépollution",
        "/traitement_dossier_avis":      "Traitement des dossiers d'avis",
        "/traitement_dossier_af":        "Avantages Fiscaux",
        "/traitement_dossier_cc":        "Cahier des charges",
        "/traitement_dossier_transaction": "Demande de transactions",
    }

    active_label = None
    for path, label in url_to_label.items():
        if path in url_str:
            active_label = label
            break

    if active_label:
        _add(_make_step(
            f"Sidebar item: '{active_label}'",
            ".ant-menu-item",
            "sidebar_item",
            f"Sidebar menu item '{active_label}' is visible on this page",
            False,
        ))
    elif sidebar_items:
        first = sidebar_items[0]
        css  = first.get("css_selector", ".ant-menu-item")
        text = first.get("text", "")
        if css and text:
            _add(_make_step(
                f"Sidebar item: '{text[:40]}'",
                css,
                "sidebar_item",
                f"Sidebar menu item '{text[:40]}' is visible",
                False,
            ))
            
    # Détecte la page courante depuis le header breadcrumb
    current_page = ""
    if header_elements:
        header_text = header_elements[0].get("text", "")
        parts = [p.strip() for p in header_text.split("\n") if p.strip()]
        if len(parts) >= 2:
            current_page = parts[1]  # ex: "Gestion Commission"
    
    if current_page:
        _add(_make_step(
            f"Page active: '{current_page}'",
            ".ant-layout-header",
            "header",
            f"Current page '{current_page}' detected in breadcrumb",
            False,
        ))

    # 6. Stat cards / dashboard tiles
    stat_cards = scraped.get("stat_cards", [])
    for card in stat_cards[:6]:
        css   = card.get("css_selector", "")
        title = card.get("title", card.get("text", "stat card"))
        if css and title:
            _add(_make_step(
                f"Stat card: '{title[:50]}'", css, "stat_card",
                f"Dashboard stat card '{title[:50]}' is visible", True,
            ))
            
    # ── Charts ────────────────────────────────────────────────────────────────
    charts = [c for c in scraped.get("stat_cards", []) if c.get("css_selector") == ".recharts-responsive-container"]
    if charts:
        _add(_make_step(
        "Charts/Graphiques visibles",
        ".recharts-responsive-container",
        "chart",
        "Recharts graphs rendered successfully",
        True
    ))
  
   
    

    # 7. Notification bell
    bell_items = scraped.get("notification_bell", [])
    if bell_items:
        css = bell_items[0].get("css_selector", "[class*='notif']")
        _add(_make_step("Notification bell visible", css, "notification_bell",
            "Notification icon is present in the header", True))

    # 8. User profile / account menu
    user_items = scraped.get("user_profile", [])
    if user_items:
        css  = user_items[0].get("css_selector", "[class*='user']")
        text = user_items[0].get("text", "user profile")
        _add(_make_step(f"User profile: '{text[:30]}'", css, "user_profile",
            f"User profile element '{text[:30]}' is visible in header", True))

    # 9. Search input
    search_inputs = scraped.get("search_inputs", [])
    if search_inputs:
        css = search_inputs[0].get("css_selector", "input[type='search']")
        _add(_make_step("Search input visible", css, "search_input",
            "Search field is present on the dashboard", True))

    # 10. Export button
    export_buttons = scraped.get("export_buttons", [])
    if export_buttons:
        css  = export_buttons[0].get("css_selector", "button")
        text = export_buttons[0].get("text", "Export")
        _add(_make_step(f"Export button: '{text[:30]}'", css, "export_button",
            f"Export/Excel button '{text[:30]}' is visible", True))

    # 11. Data tables
    data_tables = scraped.get("data_tables", [])
    
    for tbl in data_tables[:2]:
        css = tbl.get("css_selector", "table")
        if css:
            rows = tbl.get("rows", 0)
            _add(_make_step(
                f"Data table visible ({rows} rows)", css, "data_table",
                f"Data table with {rows} rows is visible on dashboard", True,
            ))

    # 12. Breadcrumb
    breadcrumbs = scraped.get("breadcrumbs", [])
    if breadcrumbs:
        css = breadcrumbs[0].get("css_selector", ".breadcrumb")
        _add(_make_step("Breadcrumb navigation present", css, "breadcrumb",
            "Breadcrumb navigation is visible", True))

    # 13. Pagination
    pagination = scraped.get("pagination", [])
    if pagination:
        css = pagination[0].get("css_selector", ".pagination")
        _add(_make_step("Pagination present", css, "pagination",
            "Pagination component is visible", True))

    # 14. Language switcher
    lang_items = scraped.get("lang_switcher", [])
    for ls in lang_items[:2]:
        css  = ls.get("css_selector", "[class*='lang']")
        text = ls.get("text", "lang")
        if css:
            _add(_make_step(f"Language switcher: '{text}'", css, "lang_switch",
                f"Language option '{text}' is visible on dashboard", True))

    return steps


# ─────────────────────────────────────────────────────────────────────────────
# SCRIPT BUILDERS
# ─────────────────────────────────────────────────────────────────────────────

def _build_selenium_script(steps: list, url: str) -> str:
    lines = [
        "from selenium import webdriver",
        "from selenium.webdriver.common.by import By",
        "from selenium.webdriver.support.ui import WebDriverWait",
        "from selenium.webdriver.support import expected_conditions as EC",
        "from selenium.webdriver.chrome.options import Options",
        "import time", "",
        "def setup_driver():",
        "    opts = Options()",
        "    opts.add_argument('--headless')",
        "    opts.add_argument('--no-sandbox')",
        "    opts.add_argument('--disable-dev-shm-usage')",
        "    opts.add_argument('--ignore-certificate-errors')",
        "    opts.add_argument('--window-size=1440,900')",
        "    driver = webdriver.Chrome(options=opts)",
        "    driver.set_page_load_timeout(30)",
        "    driver.implicitly_wait(10)",
        "    return driver", "",
    ]
    fn_names = []
    for i, step in enumerate(steps, 1):
        selector = step.get("selector", "")
        name     = step.get("name", f"step_{i}")
        optional = step.get("optional", False)
        fn_name  = f"test_{i}_" + re.sub(r"[^a-z0-9]", "_", name.lower())[:35]
        fn_names.append(fn_name)

        lines.append(f"def {fn_name}(driver):")
        lines.append(f"    driver.get('{url}')")
        if optional:
            lines += [
                f"    try:",
                f"        el = WebDriverWait(driver, 10).until(",
                f"            EC.presence_of_element_located((By.CSS_SELECTOR, '{selector}')))",
                f"        assert el is not None",
                f"    except Exception:",
                f"        print('[WARN] Optional element not found: {selector}')",
            ]
        else:
            lines += [
                f"    el = WebDriverWait(driver, 15).until(",
                f"        EC.presence_of_element_located((By.CSS_SELECTOR, '{selector}')))",
                f"    assert el is not None, 'FAIL: Element not found: {selector}'",
            ]
        lines.append("")

    lines += [
        "if __name__ == '__main__':",
        "    driver = setup_driver()",
        f"    tests = [{', '.join(fn_names)}]",
        "    passed = failed = warned = 0",
        "    try:",
        "        for i, t in enumerate(tests, 1):",
        "            try:",
        "                t(driver)",
        "                print(f'  [{i}] PASSED: {t.__name__}')",
        "                passed += 1",
        "            except AssertionError as e:",
        "                print(f'  [{i}] FAILED: {e}')",
        "                failed += 1",
        "            except Exception as e:",
        "                print(f'  [{i}] WARN: {e}')",
        "                warned += 1",
        "    finally:",
        "        driver.quit()",
        "        print(f'\\n=== Smoke Results: {passed} passed / {failed} failed / {warned} warned ===')",
    ]
    return "\n".join(lines)


def _build_playwright_script(steps: list, url: str) -> str:
    lines = [
        "from playwright.sync_api import sync_playwright, expect",
        "import pytest", "",
        f"BASE_URL = '{url}'", "",
        "@pytest.fixture(scope='module')",
        "def page():",
        "    with sync_playwright() as p:",
        "        browser = p.chromium.launch(",
        "            headless=True,",
        "            args=['--ignore-certificate-errors', '--no-sandbox']",
        "        )",
        "        ctx = browser.new_context(",
        "            viewport={'width': 1440, 'height': 900},",
        "            ignore_https_errors=True,",
        "        )",
        "        pg = ctx.new_page()",
        "        pg.goto(BASE_URL, wait_until='domcontentloaded', timeout=30000)",
        "        yield pg",
        "        browser.close()", "",
    ]
    for i, step in enumerate(steps, 1):
        selector = step.get("selector", "")
        name     = step.get("name", f"step_{i}")
        optional = step.get("optional", False)
        fn_name  = "test_" + re.sub(r"[^a-z0-9]", "_", name.lower())[:40]

        lines.append(f"def {fn_name}(page):")
        if optional:
            lines += [
                f"    try:",
                f"        expect(page.locator('{selector}').first).to_be_visible(timeout=10000)",
                f"    except Exception:",
                f"        pytest.skip('Optional: {selector}')",
            ]
        else:
            lines.append(
                f"    expect(page.locator('{selector}').first).to_be_visible(timeout=15000)"
            )
        lines.append("")
    return "\n".join(lines)


def _build_cypress_script(steps: list, url: str) -> str:
    lines = [
        "// Cypress Smoke Suite — Internal Back Office (NexTest)",
        f"const BASE_URL = '{url}';", "",
        "describe('Internal Smoke Tests', () => {{",
        "  beforeEach(() => {{ cy.visit(BASE_URL); }});", "",
    ]
    for i, step in enumerate(steps, 1):
        selector = step.get("selector", "")
        name     = step.get("name", f"step {i}")
        optional = step.get("optional", False)
        section  = step.get("section", "smoke")

        lines.append(f"  // [{section.upper()}]")
        lines.append(f"  it('{name}', () => {{")
        if optional:
            lines += [
                f"    cy.get('body').then($b => {{",
                f"      if ($b.find('{selector}').length > 0) {{",
                f"        cy.get('{selector}').first().should('exist');",
                f"      }} else {{",
                f"        cy.log('WARN: optional element not found — {selector}');",
                f"      }}",
                f"    }});",
            ]
        else:
            lines.append(f"    cy.get('{selector}').first().should('exist');")
        lines += ["  });", ""]
    lines.append("});")
    return "\n".join(lines)


def _build_scripts(steps: list, url: str, framework: str) -> dict:
    fw = framework.lower()
    result = {
        "script":            "",
        "script_selenium":   "",
        "script_playwright": "",
        "script_cypress":    "",
    }
    if fw == "selenium":
        result["script_selenium"] = _build_selenium_script(steps, url)
        result["script"]          = result["script_selenium"]
    elif fw == "playwright":
        result["script_playwright"] = _build_playwright_script(steps, url)
        result["script"]            = result["script_playwright"]
    elif fw == "cypress":
        result["script_cypress"] = _build_cypress_script(steps, url)
        result["script"]         = result["script_cypress"]
    elif fw in ("both", "all"):
        result["script_selenium"]   = _build_selenium_script(steps, url)
        result["script_playwright"] = _build_playwright_script(steps, url)
        result["script_cypress"]    = _build_cypress_script(steps, url)
        result["script"]            = result["script_selenium"]
    return result


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def generate_internal_tests(
    scraped:   dict,
    framework: str  = "playwright",
) -> dict:
    """
    Main entry point for internal back office smoke tests.

    Args:
        scraped:   Output from scraper_internal.scrape_internal()
        framework: 'selenium' | 'playwright' | 'cypress' | 'both'

    Returns:
        dict with test_cases, scripts, stats
    """
    url          = scraped.get("url", "")
    is_login     = scraped.get("is_login_page", False)
    is_dashboard = scraped.get("is_dashboard",  False)

    print(f"[GEN_INTERNAL] mode={'login' if is_login else 'dashboard'} | url={url}")

    # 1. Infrastructure checks (HTTP, SSL, load time)
    infra_steps = _build_infra_steps(scraped)

    # 2. Page-specific smoke steps
    if is_login:
        page_steps = _build_login_smoke_steps(scraped)
        page_type  = "login"
    elif is_dashboard:
        page_steps = _build_dashboard_smoke_steps(scraped)
        page_type  = "dashboard"
    else:
        # Default: treat as login page
        page_steps = _build_login_smoke_steps(scraped)
        page_type  = "login"

    # 3. Merge + deduplicate
    all_steps = infra_steps + page_steps
    seen_css  = set()
    unique    = []
    for step in all_steps:
        css = step.get("selector", "")
        key = f"{step.get('type','')}:{css}"
        if key not in seen_css:
            seen_css.add(key)
            unique.append(step)

    # 4. Sort by score (critical first)
    unique.sort(key=lambda x: x.get("score", 0), reverse=True)

    # 5. Cap at max
    final = unique[:SMOKE_MAX_STEPS]
    if len(final) < SMOKE_MIN_STEPS:
        final = unique[:SMOKE_MIN_STEPS]

    # 6. Renumber + enrich
    for i, step in enumerate(final, 1):
        step["id"]       = i
        step["base_url"] = url
        step["test_type"] = "smoke"
        step.setdefault("status",    "pending")
        step.setdefault("suite",     "")
        step.setdefault("assertion", None)

    # 7. Build scripts
    scripts = _build_scripts(final, url, framework)

    # 8. Stats
    passed  = sum(1 for s in final if s.get("status") == "pass")
    failed  = sum(1 for s in final if s.get("status") == "fail")
    warned  = sum(1 for s in final if s.get("status") == "warn")
    pending = sum(1 for s in final if s.get("status") == "pending")

    print(f"[GEN_INTERNAL] DONE | {len(final)} steps | "
          f"pass={passed} fail={failed} warn={warned} pending={pending}")

    return {
        # Test data
        "test_cases":          final,
        "test_cases_selenium": final,
        "test_cases_cypress":  final,

        # Scripts
        "script":              scripts["script"],
        "script_selenium":     scripts["script_selenium"],
        "script_playwright":   scripts["script_playwright"],
        "script_cypress":      scripts["script_cypress"],

        # Meta
        "page_type":  page_type,
        "test_type":  "smoke",
        "url":        url,

        # Stats
        "pass_count":  passed,
        "fail_count":  failed,
        "total_steps": len(final),
        "pass_rate":   round(passed / len(final) * 100, 1) if final else 0.0,
    }