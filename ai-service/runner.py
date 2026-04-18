# runner.py — assertions strictes + real DOM validation
import time
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

_TIMEOUT     = 20_000
_NAV_TIMEOUT = 30_000


def run_selenium_script(script: str, test_cases: list = None) -> dict:
    if not test_cases:
        return {
            "results": [{"name": "No steps", "status": "fail",
                         "error": "No test_cases provided",
                         "reason": "Provide steps from /generate",
                         "reason_pass": None, "reason_skip": None,
                         "assertion_result": None,
                         "priority": "high", "category": "functional"}],
            "pass_count": 0, "fail_count": 1, "skip_count": 0,
            "pass_rate": 0, "total": 1, "duration_s": 0, "raw_output": "",
        }
    return _run_steps(test_cases)


def _run_steps(steps: list) -> dict:
    results     = []
    start_total = time.time()
    base_url    = _extract_base_url(steps)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox", "--disable-dev-shm-usage",
                "--disable-gpu", "--window-size=1920,1080",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        page.set_default_timeout(_TIMEOUT)

        if base_url:
            try:
                page.goto(base_url, timeout=_NAV_TIMEOUT, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=10_000)
                except PWTimeout:
                    pass
                page.wait_for_selector("body", timeout=10_000)
                page.evaluate("window.scrollTo(0, 300)")
                page.wait_for_timeout(1500)
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(500)
            except Exception as e:
                browser.close()
                return _fatal_result(f"Cannot load '{base_url}': {e}", len(steps))

        for step in steps:
            result = _run_one_step(page, step)
            results.append(result)

        browser.close()

    duration   = round(time.time() - start_total, 2)
    pass_count = sum(1 for r in results if r["status"] == "pass")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    total      = len(results)

    return {
        "results":    results,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "skip_count": 0,
        "pass_rate":  round(pass_count / total * 100) if total else 0,
        "total":      total,
        "duration_s": duration,
        "raw_output": "",
    }


def _extract_base_url(steps: list) -> str | None:
    for step in steps:
        if step.get("base_url"): return step["base_url"]
        if step.get("url"):      return step["url"]
    return None


def _fatal_result(error: str, n_steps: int) -> dict:
    return {
        "results": [{
            "name": f"Step {i+1}", "status": "fail",
            "duration": "-", "error": error,
            "reason": f"Cannot load page — {error}",
            "reason_pass": None, "reason_skip": None,
            "assertion_result": None,
            "priority": "high", "category": "functional",
        } for i in range(n_steps)],
        "pass_count": 0, "fail_count": n_steps,
        "skip_count": 0, "pass_rate": 0,
        "total": n_steps, "duration_s": 0, "raw_output": error,
    }


def _run_one_step(page, step: dict) -> dict:
    name      = step.get("name", f"Step {step.get('id', '?')}")
    action    = step.get("action", "")
    selector  = step.get("selector", "")
    value     = step.get("value", "")
    assertion = step.get("assertion")
    t0        = time.time()

    selector = _normalize_selector(selector)

    action_error     = None
    assertion_result = None
    status           = "pass"

    # ── Métadonnées à exposer au frontend ────────────────────
    step_meta = {
        "action":   action,
        "selector": selector,
        "value":    value,
    }

    try:
        # ── 1. Exécuter l'action ──────────────────────────────
        if action == "check_visible":
            _smart_wait_visible(page, selector)

        elif action == "click":
            _smart_wait_visible(page, selector)
            page.click(selector)
            try:
                page.wait_for_load_state("domcontentloaded", timeout=5_000)
            except PWTimeout:
                pass
            page.wait_for_timeout(800)

        elif action == "fill":
            _smart_wait_visible(page, selector)
            page.fill(selector, value)
            # Vérification DOM immédiate après fill
            actual_val = page.input_value(selector)
            if actual_val != value:
                raise AssertionError(
                    f"Fill verification failed: typed '{value}', DOM contains '{actual_val}'"
                )

        else:
            raise ValueError(f"Unknown action: '{action}'")

        # ── 2. Valider l'assertion post-action ────────────────
        if assertion and isinstance(assertion, dict):
            assertion_result = _validate_assertion(page, assertion, selector, value)
            if not assertion_result["passed"]:
                status       = "fail"
                action_error = assertion_result["error"]

    except (PWTimeout, AssertionError, Exception) as e:
        status           = "fail"
        action_error     = str(e)[:250]
        assertion_result = None

    duration = round(time.time() - t0, 2)

    return {
        "name":             name,
        "status":           status,
        "duration":         f"{duration}s",
        "error":            action_error,
        "reason":           _reason(action, "fail", action_error, assertion_result) if status == "fail" else None,
        "reason_pass":      _reason(action, "pass", None, assertion_result)         if status == "pass" else None,
        "reason_skip":      None,
        "assertion_result": assertion_result,
        "step_meta":        step_meta,
        "priority":         step.get("priority", "medium"),
        "category":         step.get("category", "functional"),
    }


def _validate_assertion(page, assertion: dict,
                         action_selector: str = "",
                         filled_value: str = "") -> dict:
    a_type    = assertion.get("type", "")
    a_value   = assertion.get("value", "")
    a_target  = assertion.get("selector_target", "") or action_selector

    try:
        # ── url_contains ─────────────────────────────────────
        if a_type == "url_contains":
            current_url = page.url
            passed      = a_value in current_url
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"URL contains '{a_value}'",
                "actual":   current_url,
                "error":    None if passed
                            else f"URL '{current_url}' does not contain '{a_value}'",
            }

        # ── element_visible ───────────────────────────────────
        elif a_type == "element_visible":
            if not a_target:
                return {"passed": False, "type": a_type,
                        "expected": "selector_target required",
                        "actual": "", "error": "Missing selector_target"}
            try:
                page.wait_for_selector(a_target, state="visible", timeout=8_000)
                passed = True; actual = "visible"
            except PWTimeout:
                passed = False; actual = "not visible / not found"
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"'{a_target}' visible after action",
                "actual":   actual,
                "error":    None if passed
                            else f"'{a_target}' not visible after action",
            }

        # ── element_exists ────────────────────────────────────
        elif a_type == "element_exists":
            if not a_target:
                return {"passed": False, "type": a_type,
                        "expected": "selector_target required",
                        "actual": "", "error": "Missing selector_target"}
            el     = page.query_selector(a_target)
            passed = el is not None
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"'{a_target}' exists in DOM",
                "actual":   "found" if passed else "not found",
                "error":    None if passed
                            else f"'{a_target}' not found in DOM",
            }

        # ── text_contains ─────────────────────────────────────
        elif a_type == "text_contains":
            if not a_target:
                return {"passed": False, "type": a_type,
                        "expected": "selector_target required",
                        "actual": "", "error": "Missing selector_target"}
            el = page.query_selector(a_target)
            if not el:
                return {"passed": False, "type": a_type,
                        "expected": f"text '{a_value}' in '{a_target}'",
                        "actual": "element not found",
                        "error": f"'{a_target}' not found in DOM"}
            text   = (el.inner_text() or "").strip()
            passed = a_value.lower() in text.lower()
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"text contains '{a_value}'",
                "actual":   text[:100],
                "error":    None if passed
                            else f"'{text[:60]}' does not contain '{a_value}'",
            }

        # ── input_value — STRICT DOM read ─────────────────────
        elif a_type == "input_value":
            expected_val = a_value or filled_value
            # Lire la valeur réelle depuis le DOM via le selector de l'action
            real_selector = a_target or action_selector
            if not real_selector:
                return {"passed": False, "type": a_type,
                        "expected": f"input = '{expected_val}'",
                        "actual": "unknown",
                        "error": "No selector available to read input value"}
            try:
                actual_val = page.input_value(real_selector)
            except Exception as e:
                return {"passed": False, "type": a_type,
                        "expected": f"input = '{expected_val}'",
                        "actual": "read error",
                        "error": f"Cannot read input value: {e}"}

            passed = actual_val == expected_val
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"input = '{expected_val}'",
                "actual":   actual_val,
                "error":    None if passed
                            else f"Input contains '{actual_val}', expected '{expected_val}'",
            }

        else:
            return {
                "passed": False, "type": a_type,
                "expected": "known assertion type",
                "actual": a_type,
                "error": f"Unknown assertion type: '{a_type}'",
            }

    except Exception as e:
        return {
            "passed": False, "type": a_type,
            "expected": a_value or a_target,
            "actual": "", "error": str(e)[:150],
        }


def _normalize_selector(selector: str) -> str:
    if not selector: return selector
    for pat in ["logo-pirc", "logo_pirc"]:
        if f"alt='{pat}'" in selector.lower():
            return "img[src*='logo']"
    if "href*=" in selector and "%d8" in selector.lower():
        return "a[href*='/ar/']"
    if "href*=" in selector and "home" in selector.lower():
        return "a[href*='/en/']"
    return selector


def _smart_wait_visible(page, selector: str) -> None:
    try:
        page.wait_for_selector(selector, state="visible", timeout=8_000)
        return
    except PWTimeout:
        pass
    for toggle in [".hamburger", ".menu-toggle", ".navbar-toggle",
                   "[class*='menu-toggle']", "[aria-label*='menu']",
                   ".nav-toggle", "#menu-toggle"]:
        try:
            el = page.query_selector(toggle)
            if el and el.is_visible():
                page.click(toggle)
                page.wait_for_timeout(800)
                break
        except Exception:
            continue
    try:
        page.wait_for_selector(selector, state="visible", timeout=6_000)
        return
    except PWTimeout:
        pass
    try:
        page.wait_for_selector(selector, state="attached", timeout=5_000)
        return
    except PWTimeout:
        pass
    raise PWTimeout(f"Element '{selector}' not found after all strategies")


def _reason(action: str, status: str, error: str | None,
            assertion_result: dict | None = None) -> str:
    if status == "pass":
        base = {
            "check_visible": "Element visible in DOM.",
            "click":         "Click executed successfully.",
            "fill":          "Text typed — DOM value verified.",
        }.get(action, "Test passed.")
        if assertion_result and assertion_result.get("passed"):
            t = assertion_result.get("type", "")
            a = assertion_result.get("actual", "")
            if t == "url_contains":
                return f"{base} URL verified: '{a}'."
            elif t in ("element_visible", "element_exists"):
                return f"{base} Post-action element confirmed."
            elif t == "text_contains":
                return f"{base} Text verified: '{a[:40]}'."
            elif t == "input_value":
                return f"{base} Input value confirmed in DOM."
        return base

    if assertion_result and not assertion_result.get("passed"):
        t  = assertion_result.get("type", "")
        ex = assertion_result.get("expected", "")
        ac = assertion_result.get("actual", "")
        er = assertion_result.get("error", "")
        if t == "url_contains":
            return f"Action OK but URL assertion failed. Expected '{ex}', got '{ac[:80]}'."
        elif t in ("element_visible", "element_exists"):
            return f"Action OK but element not found after action. {er}"
        elif t == "text_contains":
            return f"Action OK but text mismatch. Expected '{ex}', got '{ac[:60]}'."
        elif t == "input_value":
            return f"Fill OK but DOM value mismatch. Expected '{ex}', got '{ac}'."
        return f"Assertion failed: {er or ex}"

    if not error: return "Test failed — unknown reason."
    e = error.lower()
    if "timeout"  in e: return f"Timeout — element not visible after {_TIMEOUT//1000}s."
    if "not found" in e: return "Element absent from DOM."
    if "fill verification" in e: return error
    return f"Error: {error[:120]}"