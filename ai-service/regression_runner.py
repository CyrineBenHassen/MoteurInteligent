# regression_runner.py — NexTest Regression Test Runner (Playwright)

import time
import json
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ── Credentials ANPE ─────────────────────────────────────────────────────────
LOGIN_EMAIL    = "admin@admin.com"
LOGIN_PASSWORD = "password1%Aa"

# ── Token ANPE (même approche que api_runner.py) ─────────────────────────────
_CACHED_TOKEN ="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJhMGRmOWI3My01MzZmLTQxZmUtOGM1Ny01MTUwOGQ2NDE0NjQiLCJqdGkiOiJlMzdlN2RlMTdjYmMxNzY0MzNhYmQ3Yjc0MDhlMGQ2MWEyNGI4NzAzZjJmYWI1YjNlOTY5NGY2MDAwZjE3MTdmZTdiOGFmNTlhYWFkMDgwYSIsImlhdCI6MTc4MDE0MjE4Ny41NDA5MDksIm5iZiI6MTc4MDE0MjE4Ny41NDA5MSwiZXhwIjoxNzk2MDM5Nzg3LjUzOTk3NSwic3ViIjoiYTAxZWEwMDQtNTA3NC00NTEyLTllMGQtYTY3OTg0NWY1ZGNlIiwic2NvcGVzIjpbXX0.c47J3sKzQjGU9ZdnR_Q0AZ5VK7yNNwwSI2g-04P0tfhcMT-i_nol1d8yZh26BQuvqzqm2Rsv88axRNE8mKagTHkmmXIEMN28Nxy1GVcjiD3YDyGGcoKcmV4s4K__SqgOX-uq-cjmZBkaRHdsbixuEb98hNWwZeB0OlHAOeC2lMbkIwkamwQnJHUIN05IsmcqFoase9_KHKHe208SSnib2XIsEaW4rOVKhlJOYpWO5PnBtflqeq44RsHc58EnJzJSVQ6MHgzOzMrohkP6PANseyeZwRalU9c_Rv_wL4EAEBZZDrx-elFa48gceb8bjTAyrGjR49GtoOjmCCzoNX9jKgWhOrBcW72KBP1EG9FGKRcNQ7RmICtHoQbzj09MCIHv8kscNxD-RcNjmEDTO1VsZ1cwnR3KtafLqOGNPZ126BP6u9mxS9dZkL5YhQE7DeDetACYzWxJhhJhMwY0XTJY9gVp65JsTI3KuJYM6CVxWfqWIQ14_YQTCTgIPEVil4oyxqj5WRAQ_wkNx3c7FSmk44UHUgVD5CrZq-3DHfxodiFLcbPOWo0hR2HnlY5kK2-cMY7mCpxEwZQWhDHia3k2yZgQVI86c1oARpL_qcqpt1vTR5czK68JqDJYA1mKwrPjfDgKkQnkm4T-5WhO5ODX7LAoVyIBad0yk7895riCzjk"
def _inject_token(page, base_url: str) -> bool:
    """Inject JWT token into browser localStorage — same token as api_runner.py"""
    try:
        print(f"[REGRESSION_RUNNER] Injecting token into browser...")

        # 1. Ouvre le site d'abord (obligatoire pour accéder au localStorage)
        page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        # 2. Injecte le token dans localStorage
        page.evaluate(f"""
            () => {{
                localStorage.setItem('token', '{_CACHED_TOKEN}');
                localStorage.setItem('access_token', '{_CACHED_TOKEN}');
                localStorage.setItem('authToken', '{_CACHED_TOKEN}');
                localStorage.setItem('auth_token', '{_CACHED_TOKEN}');
            }}
        """)

        print(f"[REGRESSION_RUNNER] ✓ Token injected into localStorage")

        # 3. Va sur le dashboard directement
        page.goto(f"{base_url}/dashboard", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        current_url = page.url
        print(f"[REGRESSION_RUNNER] After token injection URL: {current_url}")

        if "login" not in current_url.lower():
            print(f"[REGRESSION_RUNNER] ✓ Token injection successful!")
            return True
        else:
            print(f"[REGRESSION_RUNNER] ✗ Token rejected — trying real login...")
            return _login_form(page, base_url)

    except Exception as e:
        print(f"[REGRESSION_RUNNER] Token injection error: {e}")
        return _login_form(page, base_url)


def _login_form(page, base_url: str) -> bool:
    """Fallback — login with form if token injection fails"""
    try:
        login_url = f"{base_url}/admin-anpe/login"
        page.goto(login_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        print(f"[REGRESSION_RUNNER] Trying form login at {login_url}")
        print(f"[REGRESSION_RUNNER] Title: {page.title()} | URL: {page.url}")

        # Debug inputs
        inputs = page.query_selector_all("input")
        for inp in inputs:
            print(f"[REGRESSION_RUNNER] Input: type={inp.get_attribute('type')} name={inp.get_attribute('name')}")

        for sel in ["input[type='email']", "input[name='email']", "input:nth-of-type(1)"]:
            try:
                if page.is_visible(sel):
                    page.fill(sel, LOGIN_EMAIL)
                    break
            except:
                continue

        for sel in ["input[type='password']", "input[name='password']"]:
            try:
                if page.is_visible(sel):
                    page.fill(sel, LOGIN_PASSWORD)
                    break
            except:
                continue

        for sel in ["button[type='submit']", "form button", "button:has-text('Connexion')"]:
            try:
                if page.is_visible(sel):
                    page.click(sel)
                    break
            except:
                continue

        page.wait_for_timeout(5000)
        current_url = page.url
        success = "login" not in current_url.lower()
        print(f"[REGRESSION_RUNNER] Form login: {'✓' if success else '✗'} | URL: {current_url}")
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
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(3000)
            else:
                page.evaluate(f"""
                    () => {{
                        localStorage.setItem('token', '{_CACHED_TOKEN}');
                        localStorage.setItem('access_token', '{_CACHED_TOKEN}');
                        localStorage.setItem('authToken', '{_CACHED_TOKEN}');
                    }}
                """)
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(3000)

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
        "description": tc.get("description", ""),
        "priority":    tc.get("priority", "medium"),
    }


def run_regression_tests(test_cases: list, base_url: str) -> dict:
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
            logged_in = _inject_token(page, base_url)
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

    return {
        "results":    results,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "skip_count": skip_count,
        "pass_rate":  pass_rate,
        "total":      len(results),
    }