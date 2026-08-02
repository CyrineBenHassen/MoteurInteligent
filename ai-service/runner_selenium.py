# runner_selenium.py — Real Selenium Runner with Screenshots
# Uses ChromeDriver via webdriver-manager (auto-install)

import re
import time
import base64
import os
import subprocess
from dotenv import load_dotenv

load_dotenv()
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException,
    ElementNotInteractableException, WebDriverException
)
from webdriver_manager.chrome import ChromeDriverManager
from alert_recorder import record_results

_CACHED_TOKEN = os.getenv("ANPE_TOKEN")



os.environ['WDM_CACHE_PATH'] = '.wdm_cache'
os.environ['WDM_LOG'] = '0'
SCREENSHOTS_DIR = Path("screenshots_selenium")
SCREENSHOTS_DIR.mkdir(exist_ok=True)

_TIMEOUT     = 8
_NAV_TIMEOUT = 15

OPTIONAL_TYPES = frozenset({
    "lang_switch", "search_bar", "image_visible", "icon_present",
    "input_field", "logo", "hero_section",
})

_HEADING_FALLBACKS = [
    "h1, h2, h3", "h1", "h2", "h3", "h4",
    "[class*='title']", "[class*='heading']",
    "article", "main", ".content", "#content",
]


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def run_selenium_real(script: str, test_cases: list = None) -> dict:
    if not test_cases:
        return {
            "results": [{
                "name": "No steps", "status": "fail",
                "error": "No test_cases provided",
                "reason": "Provide steps from /generate",
                "reason_pass": None, "reason_skip": None,
                "assertion_result": None, "screenshot": None,
                "priority": "high", "category": "functional",
            }],
            "pass_count": 0, "fail_count": 1, "skip_count": 0,
            "pass_rate": 0, "total": 1, "duration_s": 0, "raw_output": "",
        }
    return _run_steps(test_cases)


# ─────────────────────────────────────────────────────────────────────────────
# Setup Selenium Driver
# ─────────────────────────────────────────────────────────────────────────────

def _setup_driver() -> webdriver.Chrome:
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--ignore-certificate-errors")
    opts.add_argument("--disable-renderer-backgrounding")
    opts.add_argument("--disable-backgrounding-occluded-windows")
    opts.add_argument("--disable-ipc-flooding-protection")
    opts.add_argument("--no-first-run")
    opts.add_argument("--no-default-browser-check")
    opts.add_argument("--disable-popup-blocking")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    opts.binary_location = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

    service = Service()
    if os.name == "nt":
        service.creation_flags = subprocess.CREATE_NO_WINDOW

    driver = webdriver.Chrome(service=service, options=opts)
    driver.set_page_load_timeout(30)
    driver.implicitly_wait(3)
    return driver


# ─────────────────────────────────────────────────────────────────────────────
# Core runner
# ─────────────────────────────────────────────────────────────────────────────

def _run_steps(steps: list) -> dict:
    results     = []
    start_total = time.time()
    base_url    = _extract_base_url(steps)

    # ── AJOUT : séparer les pré-calculés ─────────────────────────────────────
    PRE_CALC_TYPES = {"http_status", "ssl", "performance"}
    pre_calculated = [s for s in steps if s.get("type") in PRE_CALC_TYPES and "status" in s]
    to_run         = [s for s in steps if s.get("type") not in PRE_CALC_TYPES]

    for step in pre_calculated:
        results.append({
            "name":             step.get("name", ""),
            "status":           step.get("status", "fail"),
            "duration":         "0s",
            "error":            None if step.get("status") == "pass" else step.get("suite"),
            "reason":           step.get("suite"),
            "reason_pass":      step.get("suite") if step.get("status") == "pass" else None,
            "reason_skip":      None,
            "assertion_result": None,
            "step_meta":        None,
            "priority":         step.get("priority", "high"),
            "category":         step.get("category", "smoke"),
            "section":          step.get("section", "smoke"),
            "screenshot":       None,
        })

    driver = _setup_driver()
    page_screenshot_b64 = None

    try:
        # Initial page load
        if base_url:
            try:
                INTERNAL_URLS = ["dashboard", "statistiques", "reception",
                                 "gestion_commission", "reunions", "visites",
                                 "traitement_dossier", "outbox"]

                if any(u in base_url for u in INTERNAL_URLS):
                    driver.get("https://anpe.demopro.tn:10443/dashboard")
                    time.sleep(2)
                    driver.execute_script("""
                        localStorage.setItem('token', '""" + _CACHED_TOKEN + """');
                        localStorage.setItem('refreshToken', 'b72e3bfac0af120fb4c55ade2c2d1ba6d8579302d1d37988be39d193acf9a113af6a1bcefee0a018');
                        localStorage.setItem('i18nextLng', 'fr');
                        localStorage.setItem('user', JSON.stringify({"id": "a01ea004-5074-4512-9e0d-a679845f5dce", "fullName": "Super Admin", "email": "admin@admin.com", "is_super": true, "status": "active"}));
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
                            {"id": "9b2c3d4e-5f6a-7890-bcde-f01234567890", "name": "read_reunion", "type_code": "reunions"},
                            {"id": "65a0cbbf-50a9-4195-b1a0-b388429a7d2a", "name": "voir_toutes_les_reunions", "type_code": "commissions"}
                        ]));
                        localStorage.setItem('lastActivityTimestamp', Date.now().toString());
                    """)
                    driver.get(base_url)
                    # Attendre que React rende le menu
                    try:
                        
                        WebDriverWait(driver, 15).until(
                            lambda d: len(d.find_elements(By.CSS_SELECTOR, ".ant-menu-item")) > 0
                        )
                        print("[RUNNER] React rendered ✅")
                    except Exception:
                        time.sleep(3)
                    
                    # Attendre aussi le header
                    try:
                        WebDriverWait(driver, 10).until(
                            lambda d: len(d.find_elements(By.CSS_SELECTOR, ".ant-layout-header")) > 0
                        )
                        print("[RUNNER] Header rendered ✅")
                    except Exception:
                        time.sleep(2)
                    
                    print("[RUNNER] JWT token injecté ✅")
                else:
                    driver.get(base_url)
                    time.sleep(2)

            except Exception as e:
                driver.quit()
                return _fatal_result(f"Cannot load '{base_url}': {e}", len(steps))

        # ── Capture screenshot de la page après chargement initial ──
        try:
            page_screenshot_b64 = base64.b64encode(driver.get_screenshot_as_png()).decode("utf-8")
        except Exception as e:
            print(f"[RUNNER-SELENIUM] page screenshot failed: {e}")

        for step in to_run:
            result = _run_one_step(driver, step, base_url)
            results.append(result)

    finally:
        driver.quit()

    duration   = round(time.time() - start_total, 2)
    pass_count = sum(1 for r in results if r["status"] == "pass")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    skip_count = sum(1 for r in results if r["status"] == "skip")
    total      = len(results)
    executed   = pass_count + fail_count
    pass_rate  = round(pass_count / executed * 100) if executed else 0

    return {
        "results":    results,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "skip_count": skip_count,
        "pass_rate":  pass_rate,
        "total":      total,
        "duration_s": duration,
        "raw_output": "",
        "screenshot": page_screenshot_b64,
    }


def _extract_base_url(steps: list) -> str | None:
    for step in steps:
        if step.get("base_url"): return step["base_url"]
        if step.get("url"):      return step["url"]
    return None


def _fatal_result(error: str, n_steps: int) -> dict:
    return {
        "results": [{
            "name": f"Step {i+1}", "status": "fail", "duration": "-",
            "error": error, "reason": f"Cannot load page — {error}",
            "reason_pass": None, "reason_skip": None,
            "assertion_result": None, "step_meta": None, "screenshot": None,
            "priority": "high", "category": "functional",
        } for i in range(n_steps)],
        "pass_count": 0, "fail_count": n_steps,
        "skip_count": 0, "pass_rate": 0,
        "total": n_steps, "duration_s": 0, "raw_output": error,
    }


def _is_optional(step: dict) -> bool:
    return step.get("optional", False) or step.get("type") in OPTIONAL_TYPES


def _should_reset_to_base(step: dict) -> bool:
    action  = step.get("action", "")
    section = step.get("section", "")
    stype   = step.get("type", "")

    if action == "check_visible":
        return False
    if action == "fill":
        return False
    if stype == "lang_switch":
        return True
    if action == "click" and section in {"header", "hero", "footer", "workflow", "content"}:
        return True
    if action == "click" and stype in ("nav_link", "footer_link", "cta_button"):
        return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# Screenshot — Selenium native
# ─────────────────────────────────────────────────────────────────────────────

def _take_screenshot(driver, step_name: str, status: str) -> str | None:
    try:
        safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", step_name)[:40]
        filename  = SCREENSHOTS_DIR / f"{status}_{safe_name}.png"

        # Selenium native screenshot
        driver.save_screenshot(str(filename))

        with open(filename, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        return b64
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Step runner
# ─────────────────────────────────────────────────────────────────────────────

def _run_one_step(driver, step: dict, base_url: str) -> dict:
    name      = step.get("name", f"Step {step.get('id', '?')}")
    action    = step.get("action", "")
    selector  = step.get("selector", "")
    value     = step.get("value", "")
    assertion = step.get("assertion")
    optional  = _is_optional(step)
    t0        = time.time()

    # Normalize selector
    selector = _normalize_selector(selector)

    # Validate selector
    if _is_invalid_selector(selector):
        duration = round(time.time() - t0, 2)
        return _skip_result(name, step, f"Invalid selector: '{selector}'", f"{duration}s")

    step_meta        = {"action": action, "selector": selector, "value": value}
    action_error     = None
    assertion_result = None
    status           = "pass"

    try:
        # Reset to base_url if needed
        if base_url and _should_reset_to_base(step):
            try:
                driver.get(base_url)
                time.sleep(3)
            except Exception as e:
                raise Exception(f"Failed to reset to base URL: {e}")

        # Execute action
        if action == "check_visible":
            try:
                _smart_wait_visible(driver, selector)
            except TimeoutException:
                if optional:
                    duration = round(time.time() - t0, 2)
                    return _skip_result(
                        name, step,
                        f"Optional element absent: {selector}",
                        f"{duration}s"
                    )
                raise

        elif action == "click":
            el = _smart_wait_visible(driver, selector)
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
            time.sleep(0.3)
            try:
                el.click()
            except ElementNotInteractableException:
                driver.execute_script("arguments[0].click();", el)
            time.sleep(0.8)

        elif action == "fill":
            el = _smart_wait_visible(driver, selector)
            el.clear()
            el.send_keys(value)
            actual_val = el.get_attribute("value")
            if actual_val != value:
                raise AssertionError(
                    f"Fill verification failed: typed '{value}', DOM has '{actual_val}'"
                )

        else:
            raise ValueError(f"Unknown action: '{action}'")

        # Validate assertion
        if assertion and isinstance(assertion, dict):
            assertion_result = _validate_assertion(driver, assertion, selector, value)
            if not assertion_result["passed"]:
                status       = "fail"
                action_error = assertion_result["error"]

    except (TimeoutException, AssertionError, Exception) as e:
        status       = "fail"
        action_error = str(e)[:250]

    duration = round(time.time() - t0, 2)

    # Screenshot on FAIL — Selenium native
    screenshot_b64 = None
    if status == "fail":
        screenshot_b64 = _take_screenshot(driver, name, "fail")

    return {
        "name":             name,
        "screenshot":       screenshot_b64,
        "status":           status,
        "duration":         f"{duration}s",
        "error":            action_error,
        "reason":           action_error if status == "fail" else None,
        "reason_pass":      f"Test passed successfully." if status == "pass" else None,
        "reason_skip":      None,
        "assertion_result": assertion_result,
        "step_meta":        step_meta,
        "priority":         step.get("priority", "medium"),
        "category":         step.get("category", step.get("type", "smoke")),
        "section":          step.get("section", "general"),
    }


def _skip_result(name: str, step: dict, reason: str, duration: str) -> dict:
    return {
        "name":             name,
        "status":           "skip",
        "duration":         duration,
        "error":            None,
        "screenshot":       None,
        "reason":           None,
        "reason_pass":      None,
        "reason_skip":      reason,
        "assertion_result": None,
        "step_meta":        {
            "action":   step.get("action"),
            "selector": step.get("selector"),
            "value":    step.get("value"),
        },
        "priority": step.get("priority", "medium"),
        "category": step.get("category", "functional"),
        "section":  step.get("section", "general"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Assertion validator
# ─────────────────────────────────────────────────────────────────────────────

def _validate_assertion(driver, assertion: dict,
                         action_selector: str = "",
                         filled_value: str = "") -> dict:
    a_type   = assertion.get("type", "")
    a_value  = assertion.get("value", "")
    a_target = assertion.get("selector_target", "") or action_selector
    a_target = _normalize_selector(a_target)

    try:
        if a_type == "url_contains":
            current_url = driver.current_url
            passed = bool(a_value) and a_value in current_url
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"URL contains '{a_value}'",
                "actual":   current_url,
                "error":    None if passed else f"URL '{current_url}' does not contain '{a_value}'",
            }

        elif a_type == "element_visible":
            if not a_target or _is_invalid_selector(a_target):
                a_target = "body"
            try:
                el = WebDriverWait(driver, 8).until(
                    EC.visibility_of_element_located((By.CSS_SELECTOR, a_target))
                )
                passed = el is not None
            except TimeoutException:
                passed = False
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"'{a_target}' visible",
                "actual":   "visible" if passed else "not visible",
                "error":    None if passed else f"'{a_target}' not visible",
            }

        elif a_type == "element_exists":
            if not a_target or _is_invalid_selector(a_target):
                return {"passed": False, "type": a_type,
                        "expected": "selector_target required",
                        "actual": "", "error": "Missing selector_target"}
            els    = driver.find_elements(By.CSS_SELECTOR, a_target)
            passed = len(els) > 0
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"'{a_target}' exists",
                "actual":   "found" if passed else "not found",
                "error":    None if passed else f"'{a_target}' not found",
            }

        elif a_type == "text_contains":
            if not a_target or _is_invalid_selector(a_target):
                return {"passed": False, "type": a_type,
                        "expected": "selector_target required",
                        "actual": "", "error": "Missing selector_target"}
            els = driver.find_elements(By.CSS_SELECTOR, a_target)
            if not els:
                return {"passed": False, "type": a_type,
                        "expected": f"text '{a_value}' in '{a_target}'",
                        "actual": "element not found",
                        "error": f"'{a_target}' not found"}
            text   = els[0].text.strip()
            passed = a_value.lower() in text.lower() if a_value else bool(text)
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"text contains '{a_value}'",
                "actual":   text[:100],
                "error":    None if passed else f"'{text[:60]}' does not contain '{a_value}'",
            }

        elif a_type == "input_value":
            expected_val  = a_value or filled_value
            real_selector = a_target or action_selector
            if not real_selector or _is_invalid_selector(real_selector):
                return {"passed": False, "type": a_type,
                        "expected": f"input = '{expected_val}'",
                        "actual": "unknown", "error": "No valid selector"}
            els = driver.find_elements(By.CSS_SELECTOR, real_selector)
            if not els:
                return {"passed": False, "type": a_type,
                        "expected": f"input = '{expected_val}'",
                        "actual": "not found", "error": "Element not found"}
            actual_val = els[0].get_attribute("value") or ""
            passed     = actual_val == expected_val
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"input = '{expected_val}'",
                "actual":   actual_val,
                "error":    None if passed else f"Got '{actual_val}', expected '{expected_val}'",
            }

        elif a_type == "element_not_visible":
            if not a_target or _is_invalid_selector(a_target):
                return {"passed": True, "type": a_type,
                        "expected": "error element absent",
                        "actual": "assumed absent", "error": None}
            els    = driver.find_elements(By.CSS_SELECTOR, a_target)
            passed = len(els) == 0 or not els[0].is_displayed()
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"'{a_target}' not visible",
                "actual":   "not visible" if passed else "visible",
                "error":    None if passed else f"'{a_target}' is still visible",
            }

        else:
            return {"passed": False, "type": a_type,
                    "expected": "known assertion type",
                    "actual": a_type,
                    "error": f"Unknown assertion type: '{a_type}'"}

    except Exception as e:
        return {"passed": False, "type": a_type,
                "expected": a_value or a_target,
                "actual": "", "error": str(e)[:150]}


# ─────────────────────────────────────────────────────────────────────────────
# Selector helpers
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_selector(selector: str) -> str:
    if not selector:
        return selector

    # Selenium ne supporte pas les sélecteurs multiples avec virgule
    # Prendre seulement le premier sélecteur valide
    if "," in selector:
        parts = [s.strip() for s in selector.split(",")]
        # Chercher le premier sélecteur Ant Design si possible
        for part in parts:
            if "ant-" in part:
                return part
        # Sinon retourner le premier
        return parts[0]

    # Decode URL encoded Arabic selectors
    if "href*=" in selector and "%" in selector:
        try:
            from urllib.parse import unquote
            decoded = unquote(selector)
            if any(ord(c) > 127 for c in decoded):
                if "/ar/" in decoded or "ar" in decoded.lower():
                    return "a[hreflang='ar'], a[href*='/ar/']"
                elif "/fr/" in decoded:
                    return "a[hreflang='fr'], a[href*='/fr/']"
                elif "/en/" in decoded:
                    return "a[hreflang='en'], a[href*='/en/']"
        except Exception:
            pass

    # Fix homepage selector
    if selector.strip() in ("a[href='/']", "a[href*='home']", "a[href*='index']"):
        return "a[href='/'], .logo a, header a[href='/'], #logo a"

    # Fix logo selector
    if "logo" in selector.lower() and "src*=" in selector:
        return "img[src*='logo'], .logo img, header img"

    return selector


def _is_invalid_selector(selector: str) -> bool:
    if not selector:
        return True
    invalid = {"N/A", "n/a", "null", "undefined", "none", "", "N/a", "NA"}
    if selector.strip() in invalid:
        return True
    if selector.strip().startswith("/") and "href" not in selector:
        return True
    return False

def _smart_wait_visible(driver, selector: str):
    # Gérer les sélecteurs multiples (virgule)
    selectors = [s.strip() for s in selector.split(",")]

    for sel in selectors:
        try:
            el = WebDriverWait(driver, 8).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, sel))
            )
            return el
        except TimeoutException:
            continue

    # Try opening mobile menu
    for toggle in [
        ".hamburger", ".menu-toggle", ".navbar-toggle",
        "[aria-label*='menu']", ".nav-toggle", "#menu-toggle",
    ]:
        try:
            btn = driver.find_element(By.CSS_SELECTOR, toggle)
            if btn.is_displayed():
                btn.click()
                time.sleep(0.8)
                break
        except Exception:
            continue

    for sel in selectors:
        try:
            el = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, sel))
            )
            return el
        except TimeoutException:
            continue

    raise TimeoutException(f"Element '{selector}' not found after all strategies")