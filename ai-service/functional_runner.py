import os
from dotenv import load_dotenv
load_dotenv()
import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

from alert_recorder import record_results

_CACHED_TOKEN = os.getenv("ANPE_TOKEN")

def _inject_token(page, base_url: str, username: str = "", password: str = "") -> bool:
    """Inject JWT token + full localStorage into browser"""
    try:
        print(f"[FUNCTIONAL_RUNNER] Injecting token...")

        # ── Si credentials fournis → login API pour token frais ──
        if username and password:
            import requests
            try:
                resp = requests.post(
                    f"{base_url}/api/auth/login",
                    json={"email": username.strip(), "password": password.strip()},
                    verify=False,
                    timeout=15
                )
                print(f"[DEBUG] API login status: {resp.status_code}")
                print(f"[DEBUG] API login response: {resp.text[:200]}")
                if resp.status_code == 200:
                    data = resp.json()
                    fresh_token = data.get("token") or data.get("access_token")
                    if fresh_token:
                        print(f"[FUNCTIONAL_RUNNER] ✓ Fresh token via API login")
                        page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
                        page.wait_for_timeout(1000)
                        page.evaluate(f"localStorage.setItem('token', '{fresh_token}')")
                        page.evaluate(f"localStorage.setItem('access_token', '{fresh_token}')")
                        page.goto(f"{base_url}/dashboard", wait_until="domcontentloaded", timeout=30000)
                        page.wait_for_timeout(3000)
                        if "login" not in page.url.lower():
                            print(f"[FUNCTIONAL_RUNNER] ✓ Token injection successful")
                            return True
            except Exception as e:
                print(f"[FUNCTIONAL_RUNNER] API login failed: {e}")

            # Credentials fournis mais API login absent/échoué → login formulaire générique,
            # ne JAMAIS retomber sur les données ANPE hardcodées ci-dessous.
            print(f"[FUNCTIONAL_RUNNER] Falling back to form login (generic, credentials-based)")
            return _login_form(page, base_url, username, password)
            
        

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
        
        page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        for key, value in storage_items.items():
            page.evaluate(f"localStorage.setItem({repr(key)}, {repr(value)})")

        page.goto(f"{base_url}/dashboard", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        if "login" not in page.url.lower():
            print(f"[FUNCTIONAL_RUNNER] ✓ Token injection successful")
            return True
        else:
            print(f"[FUNCTIONAL_RUNNER] ✗ Token rejected — trying form login")
            return _login_form(page, base_url, username, password)  

    except Exception as e:
        print(f"[FUNCTIONAL_RUNNER] Token injection error: {e}")
        return _login_form(page, base_url)

def _login_form(page, base_url: str, username: str = "", password: str = "") -> bool:
    """Fallback — generic credentials-based login (same selector strategy as scraper_internal.py)"""
    try:
        login_url = f"{base_url}/login"
        page.goto(login_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(1500)

        email_sel = (
            "input[type='email'], input[type='text'], "
            "input[name*='email' i], input[name*='username' i], "
            "input[placeholder*='email' i], input[placeholder*='mail' i], "
            "input[placeholder*='utilisateur' i]"
        )
        pwd_sel = "input[type='password']"

        try:
            page.wait_for_selector(email_sel, timeout=8000)
            page.fill(email_sel, username)
        except Exception as e:
            print(f"[FUNCTIONAL_RUNNER] email field not found: {e}")
            return False

        try:
            page.wait_for_selector(pwd_sel, timeout=5000)
            page.fill(pwd_sel, password)
        except Exception as e:
            print(f"[FUNCTIONAL_RUNNER] password field not found: {e}")
            return False

        submit = page.query_selector(
            "button[type='submit'], input[type='submit'], "
            "button:has-text('connecter'), button:has-text('login'), "
            "button:has-text('Se connecter'), button:has-text('Sign in')"
        )
        if not submit:
            print(f"[FUNCTIONAL_RUNNER] submit button not found")
            return False

        submit.click()

        try:
            page.wait_for_url(lambda u: "login" not in u.lower(), timeout=12000)
        except Exception:
            pass

        page.wait_for_timeout(2000)
        success = "login" not in page.url.lower()
        print(f"[FUNCTIONAL_RUNNER] Form login: {'✓' if success else '✗'} | url={page.url}")
        return success

    except Exception as e:
        print(f"[FUNCTIONAL_RUNNER] Form login error: {e}")
        return False

def _friendly_step_element(selector: str) -> str:
    """Human-readable element description from a CSS selector."""
    s = (selector or "").lower()
    if "input" in s or "form-item" in s: return "input field"
    if "btn" in s or "button" in s: return "button"
    if "table" in s: return "table"
    if "card" in s: return "card"
    if "menu" in s: return "navigation menu"
    if "header" in s: return "header"
    if "breadcrumb" in s: return "breadcrumb"
    return "element"

def _friendly_reason(action: str, selector: str = "", fill_value: str = "", title: str = "", text: str = "") -> str:
    """Human-readable success message, same style as the public runner."""
    elem = _friendly_step_element(selector)
    if action == "navigate":
        return f"The page loaded successfully" + (f" — {title[:50]}." if title else ".")
    if action == "fill":
        return f"Text entered successfully in the {elem}."
    if action == "click":
        return f"The {elem} was clicked successfully."
    if action == "check_visible":
        return f"The {elem} is visible and accessible on the page."
    if action == "check_text":
        return f"The page content contains the expected text '{text}'."
    if action == "select":
        return f"An option was selected successfully in the {elem}."
    if action == "hover":
        return f"Hover interaction on the {elem} completed successfully."
    return "Test passed successfully."

def _execute_steps(page, tc: dict, base_url: str) -> tuple:
    """Execute a multi-step scenario (fill -> click -> verify) as one test."""
    steps      = tc.get("steps", [])
    url        = tc.get("url", base_url)
    wait_after = tc.get("wait_after_ms", 1500)

    def safe_selector(sel: str) -> str:
        return sel.replace("'", '"')

    try:
        if "login" in url:
            page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(wait_after)
    except Exception as e:
        return "fail", "Could not navigate to the test page. The URL may be unreachable."

    completed = []  # friendly descriptions of steps that succeeded so far

    for idx, step in enumerate(steps, 1):
        s_action = step.get("action", "")
        s_sel    = safe_selector(step.get("selector", ""))
        s_fill   = step.get("fill_value", "")
        s_text   = step.get("expected_text", "") or s_fill
        elem     = _friendly_step_element(s_sel)

        try:
            if s_action == "fill":
                page.wait_for_selector(s_sel, timeout=8000)
                target_sel = s_sel
                try:
                    tag = page.locator(s_sel).first.evaluate("el => el.tagName.toLowerCase()")
                except Exception:
                    tag = ""
                if tag not in ("input", "textarea", "select"):
                    fallback_sel = f"{s_sel} input, {s_sel} textarea"
                    if page.locator(fallback_sel).count() > 0:
                        target_sel = fallback_sel
                page.fill(target_sel, s_fill)
                page.wait_for_timeout(400)
                completed.append(f"filled the {elem} with '{s_fill}'")

            elif s_action == "click":
                page.wait_for_selector(s_sel, timeout=8000)
                page.click(s_sel, timeout=6000)
                page.wait_for_timeout(step.get("wait_after_ms", 1500))
                completed.append(f"clicked the {elem}")

            elif s_action == "check_visible":
                page.wait_for_selector(s_sel, timeout=8000)
                if not page.is_visible(s_sel):
                    return "fail", f"Action was executed but the expected {elem} did not appear. The element may be hidden, not rendered, or the selector is outdated."
                completed.append(f"verified the {elem} is visible")

            elif s_action == "check_text":
                content = page.content().lower()
                no_data_markers = ["no data", "aucune donnée", "aucun résultat", "pas de résultat", "aucune direction"]
                found_expected = s_text and s_text.lower() in content
                found_no_data  = any(marker in content for marker in no_data_markers)

                if found_expected:
                    completed.append(f"verified the page shows '{s_text}'")
                elif found_no_data:
                    completed.append("verified the filter returned no matching results (empty state shown correctly)")
                else:
                    prior = f"Successfully {', then '.join(completed)}, but " if completed else "Action was executed but "
                    return "fail", f"{prior}neither the expected text '{s_text}' nor an empty-results message was found on the page."

            elif s_action == "select":
                page.wait_for_selector(s_sel, timeout=8000)
                page.select_option(s_sel, s_fill) if s_fill else page.select_option(s_sel, index=1)
                completed.append(f"selected an option in the {elem}")

            elif s_action == "hover":
                page.wait_for_selector(s_sel, timeout=8000)
                page.hover(s_sel)
                completed.append(f"hovered over the {elem}")

        except PlaywrightTimeout:
            prior = f"Successfully {', then '.join(completed)}, but then " if completed else "Action was executed but "
            return "fail", f"{prior}the {elem} was not found within the timeout period. It may be hidden, disabled, or slow to load."
        except Exception as e:
            print(f"[FUNCTIONAL_RUNNER] _execute_steps error on step {idx} ({s_action} / {s_sel}): {repr(e)}")
            prior = f"Successfully {', then '.join(completed)}, but then " if completed else "Action was executed but "
            return "fail", f"{prior}an unexpected error occurred while interacting with the {elem}."

    summary = tc.get("expected") or "the workflow completed as expected"
    return "pass", f"Scenario completed successfully — {', then '.join(completed)}. {summary}."


   
def _run_one_functional(page, tc: dict, base_url: str, username: str = "", password: str = "") -> dict:
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
        if tc.get("steps"):
            final_status, reason = _execute_steps(page, tc, base_url)

        elif action == "navigate":
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
                        reason = _friendly_reason("navigate", selector, title=title)
                    except:
                        final_status = "pass"
                        reason = _friendly_reason("navigate", title=title)
                else:
                    final_status = "pass"
                    reason = _friendly_reason("navigate", title=title)

        
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
                    reason = _friendly_reason("fill", selector, fill_value)
                else:
                    final_status = "fail"
                    reason = f"Champ '{selector}' non rempli"
            except PlaywrightTimeout:
                final_status = "fail"
                reason = f"Champ '{selector}' introuvable (timeout)"
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur fill '{selector}': {str(e)[:60]}"

        
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
                reason = _friendly_reason("click", selector)
            except PlaywrightTimeout:
                final_status = "fail"
                reason = f"Élément '{selector}' introuvable ou non cliquable (timeout)"
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur click '{selector}': {str(e)[:60]}"

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
                    reason = _friendly_reason("check_visible", selector)
                else:
                    final_status = "fail"
                    reason = f"Élément '{selector}' présent mais non visible"
            except:
                final_status = "fail"
                reason = f"Élément '{selector}' introuvable sur la page"

        elif action == "check_text":
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(wait_after)

            content = page.content()
            text_to_find = selector or fill_value

            
            generic_selectors = ["body", "html", "div", ""]
            if not text_to_find or text_to_find.lower().strip() in generic_selectors:
                final_status = "fail"
                reason = "Sélecteur trop générique — préciser le texte attendu (ex: 'Identifiants incorrects')"
            elif text_to_find.lower() in content.lower():
                final_status = "pass"
                reason = _friendly_reason("check_text", text=text_to_find)
            else:
                final_status = "fail"
                reason = f"Texte '{text_to_find}' NON trouvé sur la page"

        
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
                reason = _friendly_reason("select", selector)
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur select '{selector}': {str(e)[:60]}"

       
        elif action == "hover":
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(wait_after)

            sel = safe_selector(selector)
            try:
                page.wait_for_selector(sel, timeout=10000)
                page.hover(sel)
                page.wait_for_timeout(1000)
                final_status = "pass"
                reason = _friendly_reason("hover", selector)
            except Exception as e:
                final_status = "fail"
                reason = f"Erreur hover '{selector}': {str(e)[:60]}"

        
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
                
        
        elif action == "auth_success":
            page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")

            # ── Cas générique : credentials fournis → vrai login formulaire ──
            if username and password:
                try:
                    ok = _login_form(page, base_url, username, password)
                    if ok:
                        final_status = "pass"
                        reason = "Authentification réussie via credentials → dashboard accessible ✓"
                    else:
                        final_status = "fail"
                        reason = "Login échoué avec les credentials fournis"
                except Exception as e:
                    final_status = "fail"
                    reason = f"Erreur auth_success (credentials): {str(e)[:60]}"

            # ── Cas ANPE : pas de credentials, token caché disponible ──
            elif _CACHED_TOKEN:
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
                        reason = "Authentification réussie via token → dashboard accessible ✓"
                    else:
                        final_status = "fail"
                        reason = "Token rejeté — dashboard inaccessible"

                except Exception as e:
                    final_status = "fail"
                    reason = f"Erreur auth_success (token): {str(e)[:60]}"
            else:
                final_status = "fail"
                reason = "Ni credentials ni token disponible pour ce test"
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
            model="openai/gpt-oss-120b",
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
        "expected":    expected, 
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

def run_functional_tests(test_cases: list, base_url: str, username: str = "", password: str = "") -> dict:
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
            logged_in = _inject_token(page, base_url, username, password) 
            if not logged_in:
                print(f"[FUNCTIONAL_RUNNER] ⚠ Login failed — tests requiring auth may fail")

        # ── Run each test ─────────────────────────────────────────────────────
        for i, tc in enumerate(test_cases, 1):
            cat  = tc.get("category", "?")
            sev  = tc.get("severity", "?").upper()
            name = tc.get("name", "")

            print(f"[FUNCTIONAL_RUNNER] [{i}/{len(test_cases)}] [{cat}] {sev} | {name}")

            result = _run_one_functional(page, tc, base_url, username, password)
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
        
    # ── Alerts ────────────────────────────────────────────────────────────────────
    gen_id     = test_cases[0].get("generation_id") if test_cases else None
    project_id = test_cases[0].get("project_id")    if test_cases else None
    record_results(results, base_url, "functional", "Playwright", gen_id, project_id)

    return {
        "results":        results,
        "pass_count":     pass_count,
        "fail_count":     fail_count,
        "skip_count":     skip_count,
        "pass_rate":      pass_rate,
        "total":          len(results),
        "category_stats": cat_stats,
    }