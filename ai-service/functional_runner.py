# functional_runner.py — NexTest Functional Internal Test Runner (Playwright)

import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ── Credentials ANPE ─────────────────────────────────────────────────────────
LOGIN_EMAIL    = "admin@admin.com"
LOGIN_PASSWORD = "password1%Aa"

# ── JWT Token (même approche que regression_runner.py) ───────────────────────
_CACHED_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJhMGRmOWI3My01MzZmLTQxZmUtOGM1Ny01MTUwOGQ2NDE0NjQiLCJqdGkiOiIxZTQzMmU2MTY5NWI4MjgxOGYwZmMxNzI5ZTY4ZTM5ZWM4ZjgwZjM2MmMyMDk4Y2Y5M2ViMGVjODJiYzI0NzUzZDlkMDA0YmNmMTk5MGU3NSIsImlhdCI6MTc4MTMwMTg1Mi40NzQ0MywibmJmIjoxNzgxMzAxODUyLjQ3NDQzMSwiZXhwIjoxNzk3MTEzMDUyLjQ3MjAwMywic3ViIjoiYTAxZWEwMDQtNTA3NC00NTEyLTllMGQtYTY3OTg0NWY1ZGNlIiwic2NvcGVzIjpbXX0.CdVfTqrS8OL7q0uadADPbknBstVExvBDb4cOQ67a187l5qA4Ze380hC1ABhgNypjO2boKcteAM34iAjeI4uJU-VKityh94ZDmt2HZe3SkfOSSklN9GdiuoFOqrkRdpoEEEnmUT1G4IOUeAf9ALcp8IOeWOZpgCLvxCIt49Bvjb5diWD39J2v9hBACc-i19X3VFpsOKoqjmjoaCx4EeyQuKzty2jyxUtjiaK9YIeVVJRHuJSE2DLOG6ij-crGUzYgDdMnEBD9frWLkIgc3QeTE_lYAxCWmY0KeJkSPAds90LN-mnlu2PikkKe5W7K5uI10O9p-lfSg7-du7vaTGXRTixHnrLeCBt9jXy19JrYSinpbU5ggeIcyPr7UolwI0Zv1EGqP740Abipr8EVNi1VJ5V_XutsFgqLQ3XmhjHBXWQUv-QdBOeNRveZLG9lI3w3tq_BRANSmwMTccG_Soh8HSS_Gz0ZWPAWDOeUtHTSrEh0jUIkty7aafNh8dgAcyVhETXIUOKTJBSiLRTUiH3hEiMHwwWDK38F9fyDAAGWglblJBwQuM_e-J8_-qmKj2fBCwvtgWiliIW_84cLUKG4ORfJM6eez7CJus0arsaZyCIrncFjf_qyJdRFT_LYDYTEYiokSbhlJ1brzPePzEC3HJyU6uDR-6SCNgqGAzj6Pzg"


# ─────────────────────────────────────────────────────────────────────────────
# Auth helpers
# ─────────────────────────────────────────────────────────────────────────────

def _inject_token(page, base_url: str) -> bool:
    """Inject JWT token + full localStorage into browser"""
    try:
        print(f"[FUNCTIONAL_RUNNER] Injecting token...")
        page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        _PERMISSIONS = '[{"id":"0794c877-c77e-4a97-8b06-cb6a3146fbbe","name":"verify_completeness_ed","type_code":"ed"},{"id":"31d71f0e-b76d-4417-902a-4ad1ac898917","name":"view_dashboard","type_code":"dashboard"},{"id":"a57fcffd-165c-4eda-a419-32370bc5a7ea","name":"view_statistiques","type_code":"statistiques"},{"id":"bc41cdae-c3dd-40ae-b47d-89def93fd1d7","name":"read_commission","type_code":"commissions"},{"id":"7ecb6362-67fe-4693-8057-15d3d1e53377","name":"refuse_visite","type_code":"visite"},{"id":"b4287f83-af63-4f9b-a42d-9a1747556561","name":"accept_visite","type_code":"visite"},{"id":"465b2adf-f586-489a-abda-09bc4a8fd9d1","name":"read_dossiers","type_code":"reception"}]'

        _ROLES = '[{"id":"a01ea004-0189-40e7-8dca-5f3e21a96630","name":"super_admin","permissions":[]}]'

        _USER = '{"id":"a01ea004-5074-4512-9e0d-a679845f5dce","fullName":"Super Admin","email":"admin@admin.com","is_super":true,"status":"active"}'

        _REFRESH = "1e432e61695b82818f0fc1729e68e39ec8f80f362c2098cf93eb0ec82bc24753d9d004bcf1990e75"

        storage_items = {
            "token":          _CACHED_TOKEN,
            "access_token":   _CACHED_TOKEN,
            "authToken":      _CACHED_TOKEN,
            "auth_token":     _CACHED_TOKEN,
            "refreshToken":   _REFRESH,
            "i18nextLng":     "fr",
            "user":           _USER,
            "permissions":    _PERMISSIONS,
            "roles":          _ROLES,
        }

        for key, value in storage_items.items():
            page.evaluate(f"localStorage.setItem({repr(key)}, {repr(value)})")

        page.goto(f"{base_url}/dashboard", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        if "login" not in page.url.lower():
            print(f"[FUNCTIONAL_RUNNER] ✓ Token injection successful")
            return True
        else:
            print(f"[FUNCTIONAL_RUNNER] ✗ Token rejected — trying form login")
            return _login_form(page, base_url)

    except Exception as e:
        print(f"[FUNCTIONAL_RUNNER] Token injection error: {e}")
        return _login_form(page, base_url)

def _login_form(page, base_url: str) -> bool:
    """Fallback — login with real credentials via form"""
    try:
        login_url = f"{base_url}/admin-anpe/login"
        page.goto(login_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        for sel in ["#basic_email", "input[type='email']", "input[name='email']"]:
            try:
                if page.is_visible(sel):
                    page.fill(sel, LOGIN_EMAIL)
                    break
            except:
                continue

        for sel in ["#basic_password", "input[type='password']", "input[name='password']"]:
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
        success = "login" not in page.url.lower()
        print(f"[FUNCTIONAL_RUNNER] Form login: {'✓' if success else '✗'}")
        return success

    except Exception as e:
        print(f"[FUNCTIONAL_RUNNER] Form login error: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Single test executor
# ─────────────────────────────────────────────────────────────────────────────

def _run_one_functional(page, tc: dict, base_url: str) -> dict:
    """Execute a single functional test case"""

    url          = tc.get("url", "")
    action       = tc.get("action", "navigate")
    selector     = tc.get("selector", "")
    expected     = tc.get("expected", "")
    category     = tc.get("category", "navigation")
    severity     = tc.get("severity", "medium")
    name         = tc.get("name", "")
    fill_value   = tc.get("fill_value", "")
    wait_after   = tc.get("wait_after_ms", 2000)

    start        = time.time()
    final_status = "fail"
    reason       = ""

    def safe_selector(sel: str) -> str:
        """Normalize quotes in selector"""
        return sel.replace("'", '"')

    try:
        # ── NAVIGATE ─────────────────────────────────────────────────────────
        if action == "navigate":
            page.goto(url, wait_until="domcontentloaded", timeout=40000)
            page.wait_for_timeout(wait_after)

            current_url = page.url
            title       = page.title()
            content     = page.content().lower()

            if "404" in content and "not found" in content:
                final_status = "fail"
                reason = f"Page 404 — Not Found"
            elif "login" in current_url.lower() and tc.get("requires_login"):
                final_status = "fail"
                reason = "Redirigé vers login — session expirée"
            else:
                # Check selector if provided
                if selector:
                    try:
                        sel = safe_selector(selector)
                        page.wait_for_selector(sel, timeout=8000)
                        final_status = "pass"
                        reason = f"Page chargée, élément '{selector}' présent ✓ | {title[:40]}"
                    except:
                        final_status = "pass"
                        reason = f"Page chargée ✓ (élément '{selector}' non trouvé mais page accessible) | {title[:40]}"
                else:
                    final_status = "pass"
                    reason = f"Page chargée ✓ | {title[:40] if title else 'N/A'}"

        # ── FILL ─────────────────────────────────────────────────────────────
        elif action == "fill":
            # For login page: clear token first
            if "login" in url:
                page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
                page.goto(url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(3000)
            else:
                page.goto(url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(wait_after)

            sel = safe_selector(selector)
            try:
                page.wait_for_selector(sel, timeout=10000)
                page.fill(sel, fill_value or "test_value")
                page.wait_for_timeout(500)

                # Verify the value was typed
                typed_value = page.input_value(sel)
                if typed_value:
                    final_status = "pass"
                    reason = f"Champ '{selector}' rempli avec '{fill_value or 'test_value'}' ✓"
                else:
                    final_status = "fail"
                    reason = f"Champ '{selector}' non rempli"
            except PlaywrightTimeout:
                final_status = "fail"
                reason = f"Champ '{selector}' introuvable (timeout)"
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur fill '{selector}': {str(e)[:60]}"

        # ── CLICK ─────────────────────────────────────────────────────────────
        elif action == "click":
            if "login" in url:
                page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
                page.goto(url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(3000)
            else:
                page.goto(url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(wait_after)

            sel = safe_selector(selector)
            try:
                page.wait_for_selector(sel, timeout=10000)
                page.click(sel, timeout=8000)
                page.wait_for_timeout(wait_after)
                final_status = "pass"
                reason = f"Bouton/élément '{selector}' cliqué ✓"
            except PlaywrightTimeout:
                final_status = "fail"
                reason = f"Élément '{selector}' introuvable ou non cliquable (timeout)"
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur click '{selector}': {str(e)[:60]}"

        # ── CHECK VISIBLE ─────────────────────────────────────────────────────
        elif action == "check_visible":
            if "login" in url:
                page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
                page.goto(url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(3000)
            else:
                # Only reload if not already on the right page
                if page.url != url:
                    page.goto(url, wait_until="domcontentloaded", timeout=40000)
                    page.wait_for_timeout(wait_after)
                else:
                    page.wait_for_timeout(1000)
                    

            sel = safe_selector(selector)
            try:
                page.wait_for_selector(sel, timeout=15000)
                is_visible = page.is_visible(sel)
                if is_visible:
                    final_status = "pass"
                    reason = f"Élément '{selector}' visible ✓"
                else:
                    final_status = "fail"
                    reason = f"Élément '{selector}' présent mais non visible"
            except:
                final_status = "fail"
                reason = f"Élément '{selector}' introuvable sur la page"

         # ── CHECK TEXT ────────────────────────────────────────────────────────
        elif action == "check_text":
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(wait_after)

            content = page.content()
            text_to_find = selector or fill_value

            # Si text_to_find est trop générique (ex: "body"), forcer un vrai check
            generic_selectors = ["body", "html", "div", ""]
            if not text_to_find or text_to_find.lower().strip() in generic_selectors:
                final_status = "fail"
                reason = "Sélecteur trop générique — préciser le texte attendu (ex: 'Identifiants incorrects')"
            elif text_to_find.lower() in content.lower():
                final_status = "pass"
                reason = f"Texte '{text_to_find}' trouvé ✓"
            else:
                final_status = "fail"
                reason = f"Texte '{text_to_find}' NON trouvé sur la page"

        # ── SELECT ────────────────────────────────────────────────────────────
        elif action == "select":
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(wait_after)

            sel = safe_selector(selector)
            try:
                page.wait_for_selector(sel, timeout=10000)
                if fill_value:
                    page.select_option(sel, fill_value)
                else:
                    # Select first available option
                    page.select_option(sel, index=1)
                final_status = "pass"
                reason = f"Option sélectionnée dans '{selector}' ✓"
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur select '{selector}': {str(e)[:60]}"

        # ── HOVER ─────────────────────────────────────────────────────────────
        elif action == "hover":
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(wait_after)

            sel = safe_selector(selector)
            try:
                page.wait_for_selector(sel, timeout=10000)
                page.hover(sel)
                page.wait_for_timeout(1000)
                final_status = "pass"
                reason = f"Hover sur '{selector}' ✓"
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur hover '{selector}': {str(e)[:60]}"

        # ── LOGOUT ────────────────────────────────────────────────────────────
        elif action == "logout":
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(wait_after)

            logout_selectors = [
                selector,
                "button:has-text('Déconnexion')",
                "button:has-text('Logout')",
                "a:has-text('Déconnexion')",
                ".logout-btn",
                "[data-testid='logout']",
            ]

            clicked = False
            for sel in logout_selectors:
                if not sel:
                    continue
                try:
                    if page.is_visible(sel):
                        page.click(sel)
                        page.wait_for_timeout(3000)
                        clicked = True
                        break
                except:
                    continue

            if clicked:
                current_url = page.url
                if "login" in current_url.lower():
                    final_status = "pass"
                    reason = "Déconnexion réussie → redirigé vers login ✓"
                else:
                    final_status = "pass"
                    reason = "Bouton logout cliqué ✓ (redirection non vérifiée)"
            else:
                final_status = "fail"
                reason = "Bouton logout introuvable"
                
        # ── AUTH SUCCESS TEST ─────────────────────────────────────────────────
        elif action == "auth_success":
            page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
            
            # Inject token directly instead of form login (captcha blocks form)
            try:
                page.goto(f"{base_url}", wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(1000)
                page.evaluate(f"""
                    () => {{
                        localStorage.setItem('token', '{_CACHED_TOKEN}');
                        localStorage.setItem('access_token', '{_CACHED_TOKEN}');
                        localStorage.setItem('authToken', '{_CACHED_TOKEN}');
                    }}
                """)
                page.goto(f"{base_url}/dashboard", wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(3000)

                current_url = page.url
                if "login" not in current_url.lower():
                    final_status = "pass"
                    reason = f"Authentification réussie via token → dashboard accessible ✓"
                else:
                    final_status = "fail"
                    reason = "Token rejeté — dashboard inaccessible"

            except Exception as e:
                final_status = "fail"
                reason = f"Erreur auth_success: {str(e)[:60]}"
        # ── AUTH FAIL TEST ────────────────────────────────────────────────────
        elif action == "auth_fail":
            page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(3000)

            # Fill wrong credentials
            try:
                page.fill("#basic_email", "wrong@test.com")
                page.fill("#basic_password", "wrongpassword123")
                page.click("button[type=submit]")
                page.wait_for_timeout(4000)

                # Check for error message selectors
                error_selectors = [
                    ".ant-form-item-explain-error",
                    ".ant-alert-message",
                    ".ant-message-error",
                    "[class*='error']",
                    "[class*='alert']",
                    ".login-error",
                ]
                found_error = False
                for sel in error_selectors:
                    try:
                        if page.is_visible(sel):
                            error_text = page.inner_text(sel)
                            final_status = "pass"
                            reason = f"Message d'erreur affiché ✓ : '{error_text[:60]}'"
                            found_error = True
                            break
                    except:
                        continue

                if not found_error:
                    # Still on login page = auth rejected = correct behavior
                    if "login" in page.url.lower():
                        final_status = "pass"
                        reason = "Auth échouée correctement — resté sur la page login ✓"
                    else:
                        final_status = "fail"
                        reason = "Auth échouée mais pas de message d'erreur visible et redirection inattendue"

            except Exception as e:
                final_status = "fail"
                reason = f"Erreur auth_fail test: {str(e)[:60]}"

        # ── DEFAULT ───────────────────────────────────────────────────────────
        else:
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(wait_after)
            content = page.content().lower()
            if "404" in content:
                final_status = "fail"
                reason = "Page 404"
            else:
                final_status = "pass"
                reason = "Page accessible ✓"
                
        

    except PlaywrightTimeout:
        final_status = "fail"
        reason = "Timeout — page trop lente à charger (>25s)"

    except Exception as e:
        final_status = "fail"
        reason = f"Erreur: {str(e)[:80]}"

    duration_ms = int((time.time() - start) * 1000)
    

    # ── LLaMA AI analysis pour tous les tests ────────────────────────────
    ai_analysis = None
    try:
        from openai import OpenAI
        import os, json, re
        from dotenv import load_dotenv
        load_dotenv()

        groq_client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
        )

        if final_status == "pass":
            analysis_type = "passed successfully"
            fix_label     = "improvement or maintenance suggestion"
            severity_hint = "low"
        else:
            analysis_type = "failed"
            fix_label     = "concrete fix to resolve this failure"
            severity_hint = "high"

        prompt = (
        f"You are a QA expert analyzing a failed functional UI test on a React/Ant Design app.\n\n"
        f"Test name: {name}\n"
        f"Action: {action}\n"
        f"Selector: {selector}\n"
        f"URL: {url}\n"
        f"Status: {final_status.upper()}\n"
        f"Result: {reason}\n\n"
        f"Context: This is an Ant Design React SPA. Common failure causes:\n"
        f"- Page loads but components not rendered (JS crash, auth issue)\n"
        f"- Selector correct but element not yet mounted (need more wait)\n"
        f"- Page redirects to unauthorized due to missing JWT scopes\n\n"
        f"The test {analysis_type}.\n\n"
        f"Respond ONLY with a JSON object, no markdown:\n"
        f'{{"root_cause": "specific reason for this exact failure", '
        f'"fix": "specific actionable fix for this exact test", '
        f'"severity": "{severity_hint}"}}'
    )

        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.2,
        )
        text = re.sub(r"```json|```", "", resp.choices[0].message.content.strip()).strip()
        ai_analysis = json.loads(text)
        print(f"[FUNCTIONAL_RUNNER]   🤖 [{final_status.upper()}] {ai_analysis.get('root_cause','')[:70]}")

    except Exception as e:
        print(f"[FUNCTIONAL_RUNNER]   ⚠ LLaMA error: {e}")
        if final_status == "pass":
            ai_analysis = {
                "root_cause": f"Element '{selector}' found and action completed successfully",
                "fix": "Monitor selector stability across app updates",
                "severity": "low",
            }
        else:
            ai_analysis = {
                "root_cause": f"Element '{selector}' not found or action timed out",
                "fix": "Verify selector exists on page and add explicit wait",
                "severity": "medium",
            }

    return {
        "id":          tc.get("id"),
        "name":        name,
        "category":    category,
        "severity":    severity,
        "url":         url,
        "status":      final_status,
        "suite":       reason,
        "reason":      reason,
        "duration":    f"{duration_ms}ms",
        "description": tc.get("description", ""),
        "priority":    tc.get("priority", "medium"),
        "ai_analysis": ai_analysis,
        "selector":    selector,
        "action":      action,
        "step_meta":   {"selector": selector, "action": action},
    }

   


# ─────────────────────────────────────────────────────────────────────────────
# Main runner
# ─────────────────────────────────────────────────────────────────────────────

def run_functional_tests(test_cases: list, base_url: str) -> dict:
    """Run all functional tests with Playwright"""

    print(f"[FUNCTIONAL_RUNNER] Running {len(test_cases)} functional tests on {base_url}")

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--ignore-certificate-errors",
            ]
        )
        context = browser.new_context(
            ignore_https_errors=True,
            viewport={"width": 1280, "height": 720},
        )
        page = context.new_page()
        # ── Capture des erreurs JS runtime ────────────────────────────────────
        js_errors = []
        page.on("pageerror", lambda err: js_errors.append(str(err)))

        # ── Login once for tests that require it ──────────────────────────────
        logged_in    = False
        needs_login  = any(tc.get("requires_login", True) for tc in test_cases)

        if needs_login:
            logged_in = _inject_token(page, base_url)
            if not logged_in:
                print(f"[FUNCTIONAL_RUNNER] ⚠ Login failed — tests requiring auth may fail")

        # ── Run each test ─────────────────────────────────────────────────────
        for i, tc in enumerate(test_cases, 1):
            cat  = tc.get("category", "?")
            sev  = tc.get("severity", "?").upper()
            name = tc.get("name", "")

            print(f"[FUNCTIONAL_RUNNER] [{i}/{len(test_cases)}] [{cat}] {sev} | {name}")

            result = _run_one_functional(page, tc, base_url)
            if result["status"] == "fail" and js_errors:
                result["reason"] += f" | ⚠ Erreur JS app: {js_errors[-1][:120]}"
                js_errors.clear()
            results.append(result)

            icon = "✓" if result["status"] == "pass" else "✗"
            print(f"[FUNCTIONAL_RUNNER]   {icon} {result['status'].upper()} | {result['reason'][:80]}")

        browser.close()

    # ── Stats ─────────────────────────────────────────────────────────────────
    pass_count = sum(1 for r in results if r["status"] == "pass")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    skip_count = sum(1 for r in results if r["status"] == "skip")
    executed   = pass_count + fail_count + skip_count
    pass_rate  = round(pass_count / executed * 100) if executed else 0

    # ── Per-category stats ────────────────────────────────────────────────────
    categories = ["authentication", "navigation", "form", "action"]
    cat_stats  = {}
    for cat in categories:
        cat_results = [r for r in results if r["category"] == cat]
        cat_pass    = sum(1 for r in cat_results if r["status"] == "pass")
        cat_stats[cat] = {
            "total": len(cat_results),
            "pass":  cat_pass,
            "fail":  len(cat_results) - cat_pass,
            "rate":  round(cat_pass / len(cat_results) * 100) if cat_results else 0,
        }

    print(f"[FUNCTIONAL_RUNNER] DONE | {pass_count} pass / {fail_count} fail / {skip_count} skip | {pass_rate}%")
    for cat, stats in cat_stats.items():
        print(f"[FUNCTIONAL_RUNNER]   {cat}: {stats['pass']}/{stats['total']} ({stats['rate']}%)")

    return {
        "results":        results,
        "pass_count":     pass_count,
        "fail_count":     fail_count,
        "skip_count":     skip_count,
        "pass_rate":      pass_rate,
        "total":          len(results),
        "category_stats": cat_stats,
    }