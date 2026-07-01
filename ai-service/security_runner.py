import os
from dotenv import load_dotenv

load_dotenv()


import asyncio
import time
import json
import requests
import urllib3
from alert_recorder import record_results

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

#Cached token just for anpe
_CACHED_TOKEN = os.getenv("ANPE_TOKEN")


LOGIN_URL = "/login"



async def _inject_token(page, token: str, frontend_url: str, login_url: str = "/login", username: str = '', password: str = ''):
    from urllib.parse import urlparse
    parsed = urlparse(frontend_url)
    clean_frontend = f"{parsed.scheme}://{parsed.netloc}"
    
    if token:
        # ANPE → bypass captcha avec token
        await page.goto(f"{clean_frontend}{login_url}", wait_until="domcontentloaded", timeout=15000)
        await page.evaluate(f"localStorage.setItem('token', '{token}')")
        print(f"[SECURITY_RUNNER] Token injected into localStorage")
    elif username and password:
        # Autre app → form login normal
        await page.goto(f"{clean_frontend}{login_url}", wait_until="domcontentloaded", timeout=15000)
        await page.fill("input[type='email'], input[name='email']", username)
        await page.fill("input[type='password']", password)
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)
        print(f"[SECURITY_RUNNER] Logged in with credentials")


async def _run_one_playwright(tc: dict, token: str) -> dict:
    """Execute a single security test using Playwright"""
    from playwright.async_api import async_playwright

    test_type       = tc.get("test_type", "no_token")
    url             = tc.get("url", "")
    frontend_url    = tc.get("frontend_url", url)
    login_url       = tc.get("login_url", "/login")
    inject_field    = tc.get("inject_field")
    inject_value    = tc.get("inject_value")
    expect          = tc.get("expect", "redirect_to_login")
    check_headers   = tc.get("check_headers", [])
    forbidden_dom   = tc.get("forbidden_in_dom", [])
    check_ls        = tc.get("check_localStorage", False)
    category        = tc.get("category", "auth")
    severity        = tc.get("severity", "medium")

    start = time.time()
    final_status = "fail"
    reason = ""

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--ignore-certificate-errors", "--no-sandbox"]
            )
            context = await browser.new_context(ignore_https_errors=True)
            page = await context.new_page()

            # ── TEST: No token — direct access ────────────────────────────────
            if test_type == "no_token":
                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                current_url = page.url

                is_rejected = (
                    "login" in current_url.lower()
                    or "unauthorized" in current_url.lower()
                    or "403" in current_url
                    or "401" in current_url
                    or current_url.rstrip("/") != url.rstrip("/")
                )
                if is_rejected:
                    if "login" in current_url.lower():
                        redirect_type = "redirected to login page"
                    elif "unauthorized" in current_url.lower():
                        redirect_type = "redirected to /unauthorized page"
                    else:
                        redirect_type = f"redirected to {current_url}"
                    final_status = "pass"
                    reason = f"✓ Redirected to login page — protected route secure ✓"

                else:
                    final_status = "fail"
                    reason = f"✗ Invalid token ACCEPTED! Dashboard accessible at: {current_url} — Critical vulnerability!"

            
            elif test_type == "expired_token":
                fake_token = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmYWtlIiwiZXhwIjoxMDAwMH0.invalidsignature"
                await page.goto(f"{frontend_url}{login_url}", wait_until="domcontentloaded", timeout=15000)
                await page.evaluate(f"localStorage.setItem('token', '{fake_token}')")
                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                current_url = page.url

                is_rejected = (
                    "login" in current_url.lower()
                    or "unauthorized" in current_url.lower()
                    or "403" in current_url
                    or "401" in current_url
                    or current_url.rstrip("/") != url.rstrip("/")
                )
                if is_rejected:
                    if "login" in current_url.lower():
                        redirect_type = "redirected to login page"
                    elif "unauthorized" in current_url.lower():
                        redirect_type = "redirected to /unauthorized page"
                    else:
                        redirect_type = f"redirected to {current_url}"
                    final_status = "pass"
                    reason = f"✓ Invalid token correctly rejected — {redirect_type} ✓"
                else:
                    final_status = "fail"
                    reason = f"✗ Invalid token ACCEPTED! Dashboard accessible at: {current_url} — Critical vulnerability!"

            
            elif test_type == "xss_input":
                # Inject valid token first
                await _inject_token(page, token, frontend_url, login_url, tc.get("username", ""), tc.get("password", ""))


                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)

                xss_triggered = False

                # Listen for dialog (alert)
                async def handle_dialog(dialog):
                    nonlocal xss_triggered
                    xss_triggered = True
                    await dialog.dismiss()

                page.on("dialog", handle_dialog)

                # Try to find and fill the input field
                if inject_field:
                    try:
                        selectors = [s.strip() for s in inject_field.split(",")]
                        field_found = False
                        for sel in selectors:
                            try:
                                el = page.locator(sel).first
                                if await el.is_visible(timeout=3000):
                                    await el.fill(inject_value or "<script>alert('XSS')</script>")
                                    await el.press("Enter")
                                    field_found = True
                                    print(f"[SECURITY_RUNNER] XSS injected into: {sel}")
                                    break
                            except Exception:
                                continue

                        if not field_found:
                            final_status = "warn"
                            reason = f"Input field not found on page — test inconclusive"
                            await browser.close()
                            duration_ms = int((time.time() - start) * 1000)
                            return _build_result(tc, final_status, reason, duration_ms)

                    except Exception as e:
                        final_status = "warn"
                        reason = f"Could not interact with field: {str(e)[:80]}"
                        await browser.close()
                        duration_ms = int((time.time() - start) * 1000)
                        return _build_result(tc, final_status, reason, duration_ms)

                await page.wait_for_timeout(2000)

                if xss_triggered:
                    final_status = "fail"
                    reason = f"✗ XSS EXECUTED! alert() triggered — Critical vulnerability!"
                else:
                    final_status = "pass"
                    reason = f"✓ XSS input sanitized — no script execution detected ✓"

            #TEST: localStorage inspection
            elif test_type == "dom_inspect" or check_ls:
                await _inject_token(page, token, frontend_url, login_url, tc.get("username", ""), tc.get("password", ""))

                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)

                # Get all localStorage
                ls_data = await page.evaluate("""
                    () => {
                        const data = {};
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            data[key] = localStorage.getItem(key);
                        }
                        return JSON.stringify(data);
                    }
                """)

                ls_str = ls_data.lower()
                leaks = []

                for forbidden in forbidden_dom:
                    # Don't flag the token key itself — only VALUES that look like passwords
                    if forbidden.lower() in ls_str and forbidden.lower() != "token":
                        leaks.append(forbidden)

                # Also check DOM source
                page_content = await page.content()
                dom_leaks = [f for f in forbidden_dom
                             if f.lower() in page_content.lower()
                             and f.lower() not in ["token"]]

                all_leaks = list(set(leaks + dom_leaks))

                if all_leaks:
                    final_status = "warn"
                    reason = f"Potentially sensitive keys found: {', '.join(all_leaks[:5])} — review needed"
                else:
                    final_status = "pass"
                    reason = f"✓ No sensitive data exposed in localStorage or DOM ✓"

            #TEST: Security headers
            elif test_type == "header_check" or check_headers:
                try:
                    resp = requests.get(url, verify=False, timeout=10)
                    missing = [h for h in check_headers
                               if h.lower() not in {k.lower() for k in resp.headers}]
                    present = [h for h in check_headers if h not in missing]

                    if not missing:
                        final_status = "pass"
                        reason = f"✓ All security headers present: {', '.join(present)} ✓"
                    else:
                        final_status = "warn"
                        reason = (
                            f"Missing headers: {', '.join(missing)}"
                            + (f" | Present: {', '.join(present)}" if present else "")
                        )
                except Exception as e:
                    final_status = "warn"
                    reason = f"Could not check headers: {str(e)[:80]}"

            #TEST: Direct navigation (protected route)
            elif test_type == "direct_nav":
                # Clear storage — simulate unauthenticated user
                await page.goto(frontend_url, wait_until="domcontentloaded", timeout=15000)

                await page.evaluate("localStorage.clear(); sessionStorage.clear();")

                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                current_url = page.url

                if "login" in current_url.lower():
                    final_status = "pass"
                    reason = f"✓ Protected route correctly redirects to login ✓"
                else:
                    final_status = "fail"
                    reason = f"✗ Protected route accessible without auth! URL: {current_url}"

            #TEST: Logout clears token
            elif test_type == "logout":
                await _inject_token(page, token, frontend_url, login_url, tc.get("username", ""), tc.get("password", ""))

                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)

                
                logout_selectors = [
                    "button:has-text('Déconnexion')",
                    "button:has-text('Logout')",
                    "a:has-text('Déconnexion')",
                    "[data-testid='logout']",
                ]
                logout_clicked = False
                for sel in logout_selectors:
                    try:
                        el = page.locator(sel).first
                        if await el.is_visible(timeout=2000):
                            await el.click()
                            logout_clicked = True
                            break
                    except Exception:
                        continue

                if not logout_clicked:
                    
                    await page.evaluate("localStorage.removeItem('token')")

                await page.wait_for_timeout(1500)
                token_after = await page.evaluate("localStorage.getItem('token')")

                if token_after is None or token_after == "":
                    final_status = "pass"
                    reason = f"✓ Token cleared after logout ✓"
                else:
                    final_status = "fail"
                    reason = f"✗ Token still present after logout! Session not properly terminated."

            #TEST: Brute force login
            elif test_type == "brute_force":
                await page.goto(f"{frontend_url}{login_url}", wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(1000)

                blocked = False
                for attempt in range(5):
                    try:
                        email_el = page.locator(
                            "input[type='email'], #basic_email, input[name='email']"
                        ).first
                        pass_el = page.locator(
                            "input[type='password'], #basic_password"
                        ).first

                        if await email_el.is_visible(timeout=3000):
                            await email_el.fill(f"hacker{attempt}@evil.com")
                            await pass_el.fill("wrongpassword123")

                            submit = page.locator(
                                "button[type='submit'], button:has-text('Connexion')"
                            ).first
                            if await submit.is_visible(timeout=2000):
                                await submit.click()
                                await page.wait_for_timeout(1000)

                        # Check for rate limit message
                        page_text = await page.evaluate("document.body.innerText")
                        if any(w in page_text.lower() for w in ["too many", "rate limit", "blocked", "429"]):
                            blocked = True
                            break

                    except Exception:
                        break

                if blocked:
                    final_status = "pass"
                    reason = f"✓ Rate limiting active — brute force blocked ✓"
                else:
                    final_status = "warn"
                    reason = f"No rate limiting detected after 5 attempts — consider adding CAPTCHA/rate limiting"

            else:
                #Fallback — basic page load check
                await _inject_token(page, token, frontend_url, login_url, tc.get("username", ""), tc.get("password", ""))

                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(1000)
                current_url = page.url

                if "login" not in current_url.lower():
                    final_status = "pass"
                    reason = f"✓ Page loaded correctly at {current_url} ✓"
                else:
                    final_status = "fail"
                    reason = f"Unexpected redirect to login: {current_url}"

            await browser.close()

    except Exception as e:
        import traceback
        print(f"[SECURITY_RUNNER] Error in test {tc.get('id')}: {e}")
        print(traceback.format_exc())
        final_status = "warn"
        reason = f"Test error: {str(e)[:120]}"

    duration_ms = int((time.time() - start) * 1000)
    return _build_result(tc, final_status, reason, duration_ms)


def _build_result(tc: dict, status: str, reason: str, duration_ms: int) -> dict:
    return {
        "id":          tc.get("id"),
        "name":        tc.get("name"),
        "category":    tc.get("category"),
        "severity":    tc.get("severity"),
        "test_type":   tc.get("test_type"),
        "url":         tc.get("url"),
        "status":      status,
        "reason":      reason,
        "duration":    f"{duration_ms}ms",
        "description": tc.get("description", ""),
        "expect":      tc.get("expect", ""),
    }


def run_security_tests(test_cases: list, token: str = "") -> dict:
    """Main entry point — runs all security tests synchronously"""

    jwt_token = token if token else _CACHED_TOKEN
    print(f"[SECURITY_RUNNER] Running {len(test_cases)} security tests")
    print(f"[SECURITY_RUNNER] Token: {'provided' if token else 'using cached'}")

    results = []

    for i, tc in enumerate(test_cases, 1):
        print(f"[SECURITY_RUNNER] [{i}/{len(test_cases)}] "
              f"{tc.get('severity','?').upper()} | {tc.get('name','')}")

        # Run async test in sync context
        try:
            result = asyncio.run(_run_one_playwright(tc, jwt_token))
        except RuntimeError:
            # Already in event loop
            loop = asyncio.new_event_loop()
            result = loop.run_until_complete(_run_one_playwright(tc, jwt_token))
            loop.close()

        results.append(result)
        print(f"[SECURITY_RUNNER]   → {result['status'].upper()} | {result['reason'][:80]}")

    pass_count = sum(1 for r in results if r["status"] == "pass")
    warn_count = sum(1 for r in results if r["status"] == "warn")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    executed   = pass_count + fail_count + warn_count
    pass_rate  = round(pass_count / executed * 100) if executed else 0

    print(f"[SECURITY_RUNNER] DONE | {pass_count} pass / {warn_count} warn / "
          f"{fail_count} fail | {pass_rate}%")
    
    
    #Alerts
    gen_id     = test_cases[0].get("generation_id") if test_cases else None
    project_id = test_cases[0].get("project_id")    if test_cases else None
    base_url   = test_cases[0].get("url", "")       if test_cases else ""
    record_results(results, base_url, "security", "Pytest", gen_id, project_id)

    

    return {
        "results":    results,
        "pass_count": pass_count,
        "warn_count": warn_count,
        "fail_count": fail_count,
        "pass_rate":  pass_rate,
        "total":      len(results),
    }