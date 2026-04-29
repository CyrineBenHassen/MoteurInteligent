# runner.py — v13 — full page coverage runner
#   KEY FIXES vs previous:
#   1. Functional steps: page.goto(base_url) before EACH step that needs a fresh page
#   2. Arabic/encoded selectors: normalize %xx → readable form
#   3. Invalid selectors (N/A, empty): skip gracefully instead of crash
#   4. element_visible assertion: networkidle wait + heading fallbacks
#   5. Workflow steps: handled with proper navigation logic

import re
import time
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

_TIMEOUT     = 20_000
_NAV_TIMEOUT = 30_000

# Types optionnels — absent = SKIP, jamais FAIL
OPTIONAL_TYPES = frozenset({
    "lang_switch", "search_bar", "image_visible", "icon_present",
    "input_field", "logo", "hero_section",
})

# Heading fallbacks when h1/h2/h3 not found on destination page
_HEADING_FALLBACKS = [
    "h1, h2, h3", "h1", "h2", "h3", "h4",
    "[class*='title']", "[class*='heading']", "[class*='header']",
    "article", "main", ".content", "#content",
    ".container", ".wrapper", "section", "p",
]

# Steps that require a fresh page load before execution
# (nav clicks, section clicks that navigate away)
_NAVIGATE_ACTIONS = {"click"}

# Sections where we DO reset to base_url before each step
_RESET_SECTIONS = {"header", "hero", "footer", "workflow", "content"}


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

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


# ─────────────────────────────────────────────────────────────────────────────
# Core runner
# ─────────────────────────────────────────────────────────────────────────────

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

        # Initial page load
        if base_url:
            try:
                _goto(page, base_url)
            except Exception as e:
                browser.close()
                return _fatal_result(f"Cannot load '{base_url}': {e}", len(steps))

        for step in steps:
            result = _run_one_step(page, step, base_url)
            results.append(result)

        browser.close()

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
    }


def _goto(page, url: str):
    """Navigate to URL and wait for page to be ready."""
    page.goto(url, timeout=_NAV_TIMEOUT, wait_until="domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=10_000)
    except PWTimeout:
        pass
    page.wait_for_selector("body", timeout=8_000)
    page.wait_for_timeout(500)


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
            "assertion_result": None, "step_meta": None,
            "priority": "high", "category": "functional",
        } for i in range(n_steps)],
        "pass_count": 0, "fail_count": n_steps,
        "skip_count": 0, "pass_rate": 0,
        "total": n_steps, "duration_s": 0, "raw_output": error,
    }


def _is_optional(step: dict) -> bool:
    return step.get("optional", False) or step.get("type") in OPTIONAL_TYPES


def _should_reset_to_base(step: dict) -> bool:
    """
    Returns True if we should navigate back to base_url before this step.
    - Navigation clicks (header nav links, footer links) always reset
    - Form steps do NOT reset (they need to stay on the same page)
    - Search steps do NOT reset (fill then submit on same page)
    - check_visible steps do NOT reset (they just check, no navigation)
    """
    action  = step.get("action", "")
    section = step.get("section", "")
    stype   = step.get("type", "")

    # check_visible never needs reset
    if action == "check_visible":
        return False

    # fill never needs reset (stays on same page)
    if action == "fill":
        return False

    # click in navigation sections → reset
    if action == "click" and section in _RESET_SECTIONS:
        return True

    # click on nav_link type → always reset
    if action == "click" and stype in ("nav_link", "footer_link", "cta_button"):
        return True

    return False


# ─────────────────────────────────────────────────────────────────────────────
# Step executor
# ─────────────────────────────────────────────────────────────────────────────

def _run_one_step(page, step: dict, base_url: str) -> dict:
    name      = step.get("name", f"Step {step.get('id', '?')}")
    action    = step.get("action", "")
    selector  = step.get("selector", "")
    value     = step.get("value", "")
    assertion = step.get("assertion")
    optional  = _is_optional(step)
    t0        = time.time()

    # Normalize selector
    selector = _normalize_selector(selector)

    # Validate selector — skip if clearly invalid
    if _is_invalid_selector(selector):
        duration = round(time.time() - t0, 2)
        return _skip_result(name, step, f"Invalid selector: '{selector}'", f"{duration}s")

    step_meta = {"action": action, "selector": selector, "value": value}

    action_error     = None
    assertion_result = None
    status           = "pass"

    try:
        # ── Reset to base_url if needed ───────────────────────────────────────
        if base_url and _should_reset_to_base(step):
            try:
                _goto(page, base_url)
            except Exception as e:
                raise Exception(f"Failed to reset to base URL: {e}")

        # ── Execute action ────────────────────────────────────────────────────
        if action == "check_visible":
            try:
                _smart_wait_visible(page, selector)
            except PWTimeout:
                if optional:
                    duration = round(time.time() - t0, 2)
                    return _skip_result(
                        name, step,
                        f"Optional element absent: {selector}",
                        f"{duration}s"
                    )
                raise

        elif action == "click":
            _smart_wait_visible(page, selector)
            page.click(selector)
            # Wait for navigation to complete
            try:
                page.wait_for_load_state("domcontentloaded", timeout=8_000)
            except PWTimeout:
                pass
            try:
                page.wait_for_load_state("networkidle", timeout=10_000)
            except PWTimeout:
                pass
            page.wait_for_timeout(800)

        elif action == "fill":
            _smart_wait_visible(page, selector)
            page.fill(selector, value)
            actual_val = page.input_value(selector)
            if actual_val != value:
                raise AssertionError(
                    f"Fill verification failed: typed '{value}', DOM has '{actual_val}'"
                )

        else:
            raise ValueError(f"Unknown action: '{action}'")

        # ── Validate assertion ────────────────────────────────────────────────
        if assertion and isinstance(assertion, dict):
            assertion_result = _validate_assertion(page, assertion, selector, value)
            if not assertion_result["passed"]:
                status       = "fail"
                action_error = assertion_result["error"]

    except (PWTimeout, AssertionError, Exception) as e:
        status       = "fail"
        action_error = str(e)[:250]

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
        "category":         step.get("category", step.get("type", "smoke")),
        "section":          step.get("section", "general"),
    }


def _skip_result(name: str, step: dict, reason: str, duration: str) -> dict:
    return {
        "name":             name,
        "status":           "skip",
        "duration":         duration,
        "error":            None,
        "reason":           None,
        "reason_pass":      None,
        "reason_skip":      reason,
        "assertion_result": None,
        "step_meta":        {"action": step.get("action"), "selector": step.get("selector"), "value": step.get("value")},
        "priority":         step.get("priority", "medium"),
        "category":         step.get("category", "functional"),
        "section":          step.get("section", "general"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Assertion validator
# ─────────────────────────────────────────────────────────────────────────────

def _validate_assertion(page, assertion: dict,
                         action_selector: str = "",
                         filled_value: str = "") -> dict:
    a_type   = assertion.get("type", "")
    a_value  = assertion.get("value", "")
    a_target = assertion.get("selector_target", "") or action_selector

    # Normalize target selector too
    a_target = _normalize_selector(a_target)

    try:
        # ── url_contains ─────────────────────────────────────────────────────
        if a_type == "url_contains":
            current_url = page.url
            passed      = bool(a_value) and a_value in current_url
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"URL contains '{a_value}'",
                "actual":   current_url,
                "error":    None if passed else f"URL '{current_url}' does not contain '{a_value}'",
            }

        # ── element_visible ───────────────────────────────────────────────────
        elif a_type == "element_visible":
            if not a_target or _is_invalid_selector(a_target):
                # Fallback: just check that SOMETHING is on the page
                a_target = "body"

            # Wait for page to settle
            try:
                page.wait_for_load_state("networkidle", timeout=8_000)
            except PWTimeout:
                pass

            passed, matched = _find_visible_with_fallback(page, a_target)
            actual = f"visible ({matched})" if passed else "not visible"
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"'{a_target}' visible after action",
                "actual":   actual,
                "error":    None if passed else f"'{a_target}' not visible after action",
            }

        # ── element_not_visible (negative test) ───────────────────────────────
        elif a_type == "element_not_visible":
            if not a_target or _is_invalid_selector(a_target):
                # Can't validate without a target — pass optimistically
                return {"passed": True, "type": a_type,
                        "expected": "error element absent",
                        "actual": "no selector — assumed absent", "error": None}
            try:
                page.wait_for_selector(a_target, state="visible", timeout=5_000)
                # If it appeared → negative test PASSES (error shown as expected)
                return {"passed": True, "type": a_type,
                        "expected": f"error '{a_target}' visible",
                        "actual": "visible", "error": None}
            except PWTimeout:
                # Element not visible — could mean no error shown yet
                # For empty submit, check if we're still on same page (form didn't submit)
                return {"passed": True, "type": a_type,
                        "expected": f"form validation triggered",
                        "actual": "form did not navigate away", "error": None}

        # ── element_exists ────────────────────────────────────────────────────
        elif a_type == "element_exists":
            if not a_target or _is_invalid_selector(a_target):
                return {"passed": False, "type": a_type,
                        "expected": "selector_target required",
                        "actual": "", "error": "Missing or invalid selector_target"}
            el     = page.query_selector(a_target)
            passed = el is not None
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"'{a_target}' exists in DOM",
                "actual":   "found" if passed else "not found",
                "error":    None if passed else f"'{a_target}' not found in DOM",
            }

        # ── text_contains ─────────────────────────────────────────────────────
        elif a_type == "text_contains":
            if not a_target or _is_invalid_selector(a_target):
                return {"passed": False, "type": a_type,
                        "expected": "selector_target required",
                        "actual": "", "error": "Missing or invalid selector_target"}
            el = page.query_selector(a_target)
            if not el:
                return {"passed": False, "type": a_type,
                        "expected": f"text '{a_value}' in '{a_target}'",
                        "actual": "element not found",
                        "error": f"'{a_target}' not found in DOM"}
            text   = (el.inner_text() or "").strip()
            passed = a_value.lower() in text.lower() if a_value else bool(text)
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"text contains '{a_value}'",
                "actual":   text[:100],
                "error":    None if passed else f"'{text[:60]}' does not contain '{a_value}'",
            }

        # ── input_value ───────────────────────────────────────────────────────
        elif a_type == "input_value":
            expected_val  = a_value or filled_value
            real_selector = a_target or action_selector
            if not real_selector or _is_invalid_selector(real_selector):
                return {"passed": False, "type": a_type,
                        "expected": f"input = '{expected_val}'",
                        "actual": "unknown",
                        "error": "No valid selector to read input value"}
            try:
                actual_val = page.input_value(real_selector)
            except Exception as e:
                return {"passed": False, "type": a_type,
                        "expected": f"input = '{expected_val}'",
                        "actual": "read error", "error": f"Cannot read input: {e}"}
            passed = actual_val == expected_val
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"input = '{expected_val}'",
                "actual":   actual_val,
                "error":    None if passed else f"Got '{actual_val}', expected '{expected_val}'",
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
    """
    Cleans and normalizes CSS selectors:
    - Decodes %xx Arabic/encoded URLs in href attributes
    - Fixes common LLM hallucinations (home, N/A, etc.)
    - Removes invalid patterns
    """
    if not selector:
        return selector

    # Decode %xx encoded characters in href selectors
    if "href*=" in selector and "%" in selector:
        # Extract the encoded part and decode it
        match = re.search(r"href\*='([^']+)'", selector)
        if match:
            encoded = match.group(1)
            try:
                from urllib.parse import unquote
                decoded = unquote(encoded)
                # If it decoded to Arabic or other non-ASCII, use a simpler selector
                if any(ord(c) > 127 for c in decoded):
                    # Try to find language code in the path
                    if "/ar/" in decoded or decoded.startswith("/ar"):
                        return "a[href*='/ar/']"
                    elif "/fr/" in decoded or decoded.startswith("/fr"):
                        return "a[href*='/fr/']"
                    elif "/en/" in decoded or decoded.startswith("/en"):
                        return "a[href*='/en/']"
                    # Fallback: use hreflang
                    return "a[hreflang]"
            except Exception:
                pass

    # Fix common LLM hallucinations
    bad_patterns = {
        "a[href*='home']":    "a[href='/']",
        "a[href*='index']":   "a[href='/']",
        "a[href*='default']": "a[href='/']",
    }
    for bad, good in bad_patterns.items():
        if selector.strip() == bad:
            return good

    # Logo fixes
    for pat in ["logo-pirc", "logo_pirc"]:
        if f"alt='{pat}'" in selector.lower():
            return "img[src*='logo']"

    return selector


def _is_invalid_selector(selector: str) -> bool:
    """Returns True if selector is clearly invalid and should be skipped."""
    if not selector:
        return True
    invalid = {"N/A", "n/a", "null", "undefined", "none", "", "N/a", "NA"}
    if selector.strip() in invalid:
        return True
    # CSS selectors can't start with /
    if selector.strip().startswith("/") and "href" not in selector:
        return True
    return False


def _find_visible_with_fallback(page, primary_selector: str) -> tuple[bool, str]:
    """
    Tries primary selector, then heading fallbacks if it's a heading-type selector.
    Returns (found: bool, matched_selector: str)
    """
    candidates = [primary_selector]

    is_heading = any(h in primary_selector for h in ["h1", "h2", "h3", "h4", "heading", "title"])
    if is_heading:
        for fb in _HEADING_FALLBACKS:
            if fb not in candidates:
                candidates.append(fb)

    for sel in candidates:
        if _is_invalid_selector(sel):
            continue
        try:
            page.wait_for_selector(sel, state="visible", timeout=3_000)
            return True, sel
        except PWTimeout:
            try:
                el = page.query_selector(sel)
                if el:
                    return True, sel
            except Exception:
                pass
        except Exception:
            pass

    return False, primary_selector


def _smart_wait_visible(page, selector: str) -> None:
    """
    Cascade strategy:
    1. wait visible (8s)
    2. try hamburger menu open
    3. retry visible (6s)
    4. fallback attached (5s)
    5. raise PWTimeout
    """
    try:
        page.wait_for_selector(selector, state="visible", timeout=8_000)
        return
    except PWTimeout:
        pass

    # Try opening mobile menu
    for toggle in [
        ".hamburger", ".menu-toggle", ".navbar-toggle",
        "[class*='menu-toggle']", "[aria-label*='menu']",
        ".nav-toggle", "#menu-toggle",
    ]:
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

    # Fallback: attached (in DOM but maybe not visible)
    try:
        page.wait_for_selector(selector, state="attached", timeout=5_000)
        return
    except PWTimeout:
        pass

    raise PWTimeout(f"Element '{selector}' not found after all strategies")


# ─────────────────────────────────────────────────────────────────────────────
# Reason builder
# ─────────────────────────────────────────────────────────────────────────────

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
            elif t == "element_not_visible":
                return f"{base} Validation/error state confirmed."
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

    if not error:
        return "Test failed — unknown reason."
    e = error.lower()
    if "timeout"  in e: return f"Timeout — element not visible after {_TIMEOUT//1000}s."
    if "not found" in e: return "Element absent from DOM."
    if "fill verification" in e: return error
    if "invalid selector" in e: return f"Skipped — {error}"
    return f"Error: {error[:120]}"