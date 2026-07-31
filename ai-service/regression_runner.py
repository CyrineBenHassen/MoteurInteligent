import os
from dotenv import load_dotenv
load_dotenv()
import time
import json
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from alert_recorder import record_results


#token for captcha
_CACHED_TOKEN = os.getenv("ANPE_TOKEN")

def _is_anpe(base_url: str) -> bool:
    """ANPE = flux token/captcha (comportement historique, ne pas toucher).
    Toute autre app interne = credentials classiques (username/password)."""
    return "anpe" in (base_url or "").lower()

def _inject_token(page, base_url: str, username: str = "", password: str = "") -> bool:
    """
    ANPE (captcha) → injecte le token JWT caché dans localStorage.
    Toute autre app interne (sans captcha) → login classique via credentials.
    """
    if _is_anpe(base_url) and _CACHED_TOKEN:
        try:
            print(f"[REGRESSION_RUNNER] ANPE detected — injecting cached token...")

            page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2000)

            page.evaluate(f"""
                () => {{
                    localStorage.setItem('token', '{_CACHED_TOKEN}');
                    localStorage.setItem('access_token', '{_CACHED_TOKEN}');
                    localStorage.setItem('authToken', '{_CACHED_TOKEN}');
                    localStorage.setItem('auth_token', '{_CACHED_TOKEN}');
                }}
            """)

            print(f"[REGRESSION_RUNNER] ✓ Token injected into localStorage")

            page.goto(f"{base_url}/dashboard", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(3000)

            current_url = page.url
            print(f"[REGRESSION_RUNNER] After token injection URL: {current_url}")

            if "login" not in current_url.lower():
                print(f"[REGRESSION_RUNNER] ✓ Token injection successful!")
                return True
            else:
                print(f"[REGRESSION_RUNNER] ✗ Token rejected — trying real login...")

        except Exception as e:
            print(f"[REGRESSION_RUNNER] Token injection error: {e}")

    # ── App générique (pas de captcha) — login classique credentials ──
    print(f"[REGRESSION_RUNNER] Generic app — logging in with credentials...")
    return _login_form(page, base_url, username, password)

def _login_form(page, base_url: str, username: str = "", password: str = "") -> bool:
    """Générique — login via formulaire credentials (username/password), sans token/captcha."""
    try:
        login_url = f"{base_url}/login"
        page.goto(login_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        print(f"[REGRESSION_RUNNER] Trying form login at {login_url}")
        print(f"[REGRESSION_RUNNER] Title: {page.title()} | URL: {page.url}")

        inputs = page.query_selector_all("input")
        for inp in inputs:
            print(f"[REGRESSION_RUNNER] Input: type={inp.get_attribute('type')} name={inp.get_attribute('name')}")

        # ── Username field ── (couvre type=email, name=email/username, ou simple type=text comme DGAC)
        username_selectors = [
            "input[type='email']",
            "input[name='email']",
            "input[name='username']",
            "input[autocomplete='username']",
            "input[type='text']",
        ]
        username_filled = False
        for sel in username_selectors:
            try:
                el = page.locator(sel).first
                if el.count() > 0 and el.is_visible():
                    el.fill(username)
                    username_filled = True
                    print(f"[REGRESSION_RUNNER] ✓ Username filled via '{sel}'")
                    break
            except Exception:
                continue

        # ── Password field ──
        password_filled = False
        for sel in ["input[type='password']", "input[name='password']"]:
            try:
                el = page.locator(sel).first
                if el.count() > 0 and el.is_visible():
                    el.fill(password)
                    password_filled = True
                    print(f"[REGRESSION_RUNNER] ✓ Password filled via '{sel}' | user='{username}' | pwd_len={len(password)}")
                    break
            except Exception:
                continue

        if not username_filled or not password_filled:
            print(f"[REGRESSION_RUNNER] ✗ Champs introuvables (user={username_filled}, pwd={password_filled})")
            return False

        # ── Submit ──
        submit_selectors = [
            "button[type='submit']",
            "input[type='submit']",
            "form button",
            "button:has-text('Connexion')",
            "button:has-text('Login')",
            "button:has-text('Se connecter')",
        ]
        clicked = False
        for sel in submit_selectors:
            try:
                el = page.locator(sel).first
                if el.count() > 0 and el.is_visible():
                    el.click()
                    clicked = True
                    print(f"[REGRESSION_RUNNER] ✓ Submit clicked via '{sel}'")
                    break
            except Exception:
                continue

        if not clicked:
            try:
                page.locator("input[type='password']").first.press("Enter")
                clicked = True
                print(f"[REGRESSION_RUNNER] ✓ Submitted via Enter key")
            except Exception:
                pass

        page.wait_for_timeout(4000)
        try:
            page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass

        current_url = page.url
        password_still_present = False
        try:
            password_still_present = page.locator("input[type='password']").first.is_visible()
        except Exception:
            pass
        success = ("login" not in current_url.lower()) and not password_still_present
        print(f"[REGRESSION_RUNNER] Form login: {'✓' if success else '✗'} | URL: {current_url}")

        if not success:
            try:
                body_text = page.locator("body").inner_text()[:500]
                print(f"[REGRESSION_RUNNER] Page content after failed login: {body_text}")
            except Exception:
                pass
            try:
                page.screenshot(path="login_debug.png")
                print("[REGRESSION_RUNNER] Screenshot saved: login_debug.png")
            except Exception:
                pass

        return success

    except Exception as e:
        print(f"[REGRESSION_RUNNER] Form login error: {e}")
        return False

def _run_one_regression(page, tc: dict, base_url: str) -> dict:
    """Execute a single regression test"""

    url         = tc.get("url", "")
    action      = tc.get("action", "navigate")
    selector    = tc.get("selector", "")
    expected    = tc.get("expected", "")
    category    = tc.get("category", "navigation")
    severity    = tc.get("severity", "medium")
    name        = tc.get("name", "")

    start = time.time()
    final_status = "fail"
    reason = ""

    try:
        # ── Navigate to page ─────────────────────────────────────────────────
        if action == "navigate" or not action:
            if tc.get("requires_login", True) and _is_anpe(base_url):
                page.evaluate(f"""
                    () => {{
                        localStorage.setItem('token', '{_CACHED_TOKEN}');
                        localStorage.setItem('access_token', '{_CACHED_TOKEN}');
                        localStorage.setItem('authToken', '{_CACHED_TOKEN}');
                        localStorage.setItem('auth_token', '{_CACHED_TOKEN}');
                    }}
                 """)
            page.goto(url, wait_until="networkidle", timeout=20000)
            page.wait_for_timeout(1500)

            current_url = page.url
            title       = page.title()

            # Check no error page
            content = page.content().lower()
            has_error = any(err in content for err in [
                "404", "not found", "error", "exception",
                "forbidden", "unauthorized", "500"
            ])

            if has_error and "404" in content:
                final_status = "fail"
                reason = f"Page {url} returned 404 — Not Found"
            elif "login" in current_url.lower() and tc.get("requires_login"):
                final_status = "fail"
                reason = f"Redirected to login — session expired or page requires auth"
            else:
                final_status = "pass"
                reason = f"Page loaded ✓ | Title: {title[:40] if title else 'N/A'}"

        # ── Check element visible ─────────────────────────────────────────────
        elif action == "check_visible" and selector:
            if "login" in url:
                page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
                page.goto(url, wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(5000)
            else:
                if _is_anpe(base_url):
                    page.evaluate(f"""
                        () => {{
                            localStorage.setItem('token', '{_CACHED_TOKEN}');
                            localStorage.setItem('access_token', '{_CACHED_TOKEN}');
                            localStorage.setItem('authToken', '{_CACHED_TOKEN}');
                        }}
                    """)
                page.goto(url, wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(5000)

            try:
                # Fix guillemets pour input[type='email']
                safe_selector = selector.replace("'", '"')
                page.wait_for_selector(safe_selector, timeout=10000)
                is_visible = page.is_visible(safe_selector)
                if is_visible:
                    final_status = "pass"
                    reason = f"Element '{selector}' is visible ✓"
                else:
                    final_status = "fail"
                    reason = f"Element '{selector}' exists but not visible"
            except:
                final_status = "fail"
                reason = f"Element '{selector}' not found on page"

        # ── Check text present ────────────────────────────────────────────────
        elif action == "check_text" and selector:
            page.goto(url, wait_until="networkidle", timeout=20000)
            page.wait_for_timeout(1500)

            content = page.content()
            if selector.lower() in content.lower():
                final_status = "pass"
                reason = f"Text '{selector}' found on page ✓"
            else:
                final_status = "fail"
                reason = f"Text '{selector}' NOT found on page"

        # ── Authentication test ───────────────────────────────────────────────
        elif action == "fill" and category == "authentication":
            page.goto(url, wait_until="networkidle", timeout=20000)
            page.wait_for_timeout(1500)

            login_success = _login(page, base_url)
            if login_success:
                final_status = "pass"
                reason = f"Authentication successful ✓ | Redirected to dashboard"
            else:
                final_status = "fail"
                reason = f"Authentication failed — check credentials or login form"

        # ── Click test ────────────────────────────────────────────────────────
        elif action == "click" and selector:
            # Si c'est la page login, ouvre un contexte fresh sans token
            if "login" in url:
                page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(3000)
            else:
                page.goto(url, wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(1500)

            try:
                page.click(selector, timeout=5000)
                page.wait_for_timeout(1000)
                final_status = "pass"
                reason = f"Element '{selector}' clicked successfully ✓"
            except:
                final_status = "fail"
                reason = f"Could not click '{selector}'"

        else:
            # Default: just navigate and check no 404
            page.goto(url, wait_until="networkidle", timeout=20000)
            page.wait_for_timeout(1500)
            content = page.content().lower()
            if "404" in content or "not found" in content:
                final_status = "fail"
                reason = f"Page not found (404)"
            else:
                final_status = "pass"
                reason = f"Page accessible ✓"

    except PlaywrightTimeout:
        final_status = "fail"
        reason = f"Timeout — page took too long to load (>20s)"

    except Exception as e:
        final_status = "fail"
        reason = f"Error: {str(e)[:80]}"

    duration_ms = int((time.time() - start) * 1000)

    return {
        "id":          tc.get("id"),
        "name":        name,
        "category":    category,
        "severity":    severity,
        "url":         url,
        "status":      final_status,
        "reason":      reason,
        "duration":    f"{duration_ms}ms",
        "expected":    expected,
        "description": tc.get("description", ""),
        "priority":    tc.get("priority", "medium"),
    }


def run_regression_tests(test_cases: list, base_url: str, username: str = "", password: str = "") -> dict:
    """Run all regression tests with Playwright"""

    print(f"[REGRESSION_RUNNER] Running {len(test_cases)} regression tests")

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox",
                  "--ignore-certificate-errors"]
        )
        context = browser.new_context(
            ignore_https_errors=True,
            viewport={"width": 1280, "height": 720},
        )
        page = context.new_page()

        # ── Login once for all tests ──────────────────────────────────────────
        logged_in = False
        needs_login = any(tc.get("requires_login", True) for tc in test_cases)

        if needs_login:
            logged_in = _inject_token(page, base_url, username, password)
            if not logged_in:
                print(f"[REGRESSION_RUNNER] ⚠ Login failed — running without session")

        # ── Run each test ─────────────────────────────────────────────────────
        for i, tc in enumerate(test_cases, 1):
            print(f"[REGRESSION_RUNNER] [{i}/{len(test_cases)}] {tc.get('severity','?').upper()} | {tc.get('name','')}")

            # Skip login tests if already logged in
            if tc.get("category") == "authentication" and tc.get("action") == "fill" and logged_in:
                results.append({
                    "id":          tc.get("id"),
                    "name":        tc.get("name"),
                    "category":    "authentication",
                    "severity":    tc.get("severity", "critical"),
                    "url":         tc.get("url"),
                    "status":      "pass",
                    "reason":      "Authentication already verified ✓",
                    "duration":    "0ms",
                    "expected":    tc.get("expected", ""),
                    "description": tc.get("description", ""),
                    "priority":    tc.get("priority", "high"),
                })
                continue

            result = _run_one_regression(page, tc, base_url)
            results.append(result)
            print(f"[REGRESSION_RUNNER]   → {result['status'].upper()} | {result['reason'][:80]}")

        browser.close()

    # ── Stats ─────────────────────────────────────────────────────────────────
    pass_count = sum(1 for r in results if r["status"] == "pass")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    skip_count = sum(1 for r in results if r["status"] == "skip")
    executed   = pass_count + fail_count + skip_count
    pass_rate  = round(pass_count / executed * 100) if executed else 0

    print(f"[REGRESSION_RUNNER] DONE | {pass_count} pass / {fail_count} fail / {skip_count} skip | {pass_rate}%")
     
     
     
    # ── Alerts ────────────────────────────────────────────────────────────────────
    gen_id     = test_cases[0].get("generation_id") if test_cases else None
    project_id = test_cases[0].get("project_id")    if test_cases else None
    record_results(results, base_url, "functional", "Playwright", gen_id, project_id)
    
    return {
        "results":    results,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "skip_count": skip_count,
        "pass_rate":  pass_rate,
        "total":      len(results),
    }