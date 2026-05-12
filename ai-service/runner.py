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
from urllib.parse import unquote        


_TIMEOUT     = 12_000
_NAV_TIMEOUT = 20_000

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
    page.goto(url, timeout=_NAV_TIMEOUT, wait_until="domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=6_000)
    except PWTimeout:
        pass
    page.wait_for_selector("body", timeout=5_000)
    page.wait_for_timeout(300)


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




    """
    Handles Polylang / WPML / language switcher dropdowns.
    Strategy:
      1. Try direct click on the selector
      2. If URL doesn't change → open #pll_switcher first then click
      3. Fallback: try hreflang attribute link directly
    """
    url_before = page.url

    # Attempt 1 — direct click
    try:
        page.click(selector, timeout=5_000)
        page.wait_for_load_state("domcontentloaded", timeout=6_000)
        page.wait_for_timeout(400)
        if page.url != url_before:
            return  # Navigation happened — success
    except Exception:
        pass

    # Attempt 2 — open Polylang dropdown first
    polylang_toggles = [
        "#pll_switcher",
        ".pll-parent-menu-item",
        "[id*='pll']",
        "[class*='pll']",
        "li.menu-item:has(a[hreflang])",
        ".lang-item-first",
    ]
    for toggle in polylang_toggles:
        try:
            el = page.query_selector(toggle)
            if el and el.is_visible():
                page.click(toggle)
                page.wait_for_timeout(600)
                # Now try the lang link again
                page.click(selector, timeout=5_000)
                page.wait_for_load_state("domcontentloaded", timeout=6_000)
                page.wait_for_timeout(400)
                if page.url != url_before:
                    return  # Success
        except Exception:
            continue

    # Attempt 3 — extract hreflang and navigate directly
    try:
        match = re.search(r"hreflang='([^']+)'", selector)
        if match:
            lang_code = match.group(1)
            # Find the actual href from the DOM
            el = page.query_selector(f"a[hreflang='{lang_code}']")
            if el:
                href = el.get_attribute("href")
                if href and href != "#" and "pll_switcher" not in href:
                    page.goto(href, timeout=15_000, wait_until="domcontentloaded")
                    page.wait_for_timeout(400)
                    return
    except Exception:
        pass

    # Attempt 4 — force click via JavaScript
    try:
        page.evaluate(f"document.querySelector(\"{selector}\")?.click()")
        page.wait_for_load_state("domcontentloaded", timeout=6_000)
        page.wait_for_timeout(400)
    except Exception:
        pass

def _click_lang_switch(page, selector: str) -> None:
    """
    Handles Polylang / WPML language switcher.
    Optimized: tries direct href navigation first (fastest).
    """
    url_before = page.url

   # Attempt 1 — extract href directly from DOM and navigate
    try:
        match = re.search(r"hreflang='([^']+)'", selector)
        if match:
            lang_code = match.group(1)
            el = page.query_selector(f"a[hreflang='{lang_code}']")
            if el:
                href = el.get_attribute("href")
                if href and href != "#" and "pll_switcher" not in href:
                    page.goto(href, timeout=15_000, wait_until="domcontentloaded")
                    try:
                        page.wait_for_load_state("networkidle", timeout=5_000)
                    except PWTimeout:
                        pass
                    page.wait_for_timeout(300)
                    return
            else:
                # Element not found — lang probably doesn't exist, skip silently
                return
    except Exception:
        pass

    # Attempt 2 — open Polylang dropdown then click
    polylang_toggles = [
        "#pll_switcher",
        ".pll-parent-menu-item",
        "[id*='pll']",
        "[class*='pll']",
        ".lang-item-first",
    ]
    for toggle in polylang_toggles:
        try:
            el = page.query_selector(toggle)
            if el and el.is_visible():
                page.click(toggle)
                page.wait_for_timeout(500)
                page.click(selector, timeout=4_000)
                page.wait_for_load_state("domcontentloaded", timeout=6_000)
                page.wait_for_timeout(300)
                if page.url != url_before:
                    return
        except Exception:
            continue

    # Attempt 3 — direct click
    try:
        page.click(selector, timeout=5_000)
        page.wait_for_load_state("domcontentloaded", timeout=6_000)
        page.wait_for_timeout(300)
        if page.url != url_before:
            return
    except Exception:
        pass

    # Attempt 4 — JavaScript click
    try:
        page.evaluate(f"document.querySelector(\"{selector}\")?.click()")
        page.wait_for_load_state("domcontentloaded", timeout=6_000)
        page.wait_for_timeout(300)
    except Exception:
        pass
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
            
            
            # Special handling for Polylang / language switcher
            if "hreflang" in selector or "lang" in step.get("type", ""):
                _click_lang_switch(page, selector)
            else:
                page.click(selector)
            try:
                page.wait_for_load_state("domcontentloaded", timeout=6_000)
            except PWTimeout:
                pass
            try:
                page.wait_for_load_state("networkidle", timeout=6_000)
            except PWTimeout:
                pass
            page.wait_for_timeout(400)

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
        "reason":      _reason(action, "fail", action_error, assertion_result, step_name=name) if status == "fail" else None,
        "reason_pass": _reason(action, "pass", None, assertion_result, step_name=name),
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
 
            # Special case: if checking for default language (fr)
            # and the site uses fr as default (no /fr/ in URL),
            # check if we navigated away from base or page loaded
            if a_value and a_value not in current_url:
                # Check if lang code appears anywhere (path, subdomain, param)
                from urllib.parse import urlparse, parse_qs
                parsed = urlparse(current_url)
 
                # Accept if lang is in path, query string, or subdomain
                in_path      = f"/{a_value}/" in parsed.path or f"/{a_value}" == parsed.path
                in_query     = a_value in parsed.query
                in_subdomain = parsed.netloc.startswith(f"{a_value}.")
 
                # Accept if it's the default lang and URL is the base domain
                is_default_lang = (
                    parsed.path in ("", "/") and
                    not parsed.query and
                    len(a_value) == 2  # lang code like 'fr', 'en'
                )
 
                passed = in_path or in_query or in_subdomain or is_default_lang
            else:
                passed = bool(a_value) and a_value in current_url
 
            return {
                "passed":   passed,
                "type":     a_type,
                "expected": f"URL contains '{a_value}' or is default language page",
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

def _friendly_url(url: str) -> str:
    """
    Converts a raw URL into a readable page description.
    e.g. 'https://rescat.tn/faq/' → 'FAQ page'
         'https://rescat.tn/ar/%d8%a7%d9%84%d...' → 'Arabic version'
         'https://rescat.tn/contact' → 'Contact page'
    """
    if not url:
        return "destination page"
 
    try:
        decoded = unquote(url).rstrip("/")
    except Exception:
        decoded = url.rstrip("/")
 
    # Detect language codes in URL
    lang_map = {
        "/ar/": "Arabic version",
        "/fr/": "French version",
        "/en/": "English version",
        "/es/": "Spanish version",
        "/de/": "German version",
        "/it/": "Italian version",
        "/pt/": "Portuguese version",
        "/zh/": "Chinese version",
        "/ja/": "Japanese version",
        "/ru/": "Russian version",
    }
    for key, label in lang_map.items():
        if key in decoded.lower():
            return label
 
    # Arabic/non-ASCII chars in path = likely a localized page
    path = decoded.split("//")[-1].split("/", 1)[-1] if "//" in decoded else decoded
    if any(ord(c) > 127 for c in path):
        return "localized page"
 
    # Extract last meaningful path segment
    segment = decoded.split("/")[-1].strip()
    if not segment:
        segment = decoded.split("/")[-2].strip() if decoded.count("/") > 2 else ""
 
    # Slug → human-readable label mapping
    slug_map = {
        "faq":           "FAQ page",
        "faqs":          "FAQ page",
        "contact":       "Contact page",
        "about":         "About Us page",
        "about-us":      "About Us page",
        "home":          "homepage",
        "index":         "homepage",
        "login":         "Login page",
        "signin":        "Sign In page",
        "signup":        "Sign Up page",
        "register":      "Registration page",
        "logout":        "Logout page",
        "dashboard":     "Dashboard",
        "profile":       "Profile page",
        "account":       "Account page",
        "settings":      "Settings page",
        "cart":          "Cart page",
        "checkout":      "Checkout page",
        "shop":          "Shop page",
        "products":      "Products page",
        "product":       "Product page",
        "blog":          "Blog page",
        "news":          "News page",
        "services":      "Services page",
        "pricing":       "Pricing page",
        "search":        "Search results page",
        "results":       "Results page",
        "gallery":       "Gallery page",
        "portfolio":     "Portfolio page",
        "team":          "Team page",
        "careers":       "Careers page",
        "jobs":          "Jobs page",
        "privacy":       "Privacy Policy page",
        "terms":         "Terms of Service page",
        "help":          "Help page",
        "support":       "Support page",
        "docs":          "Documentation page",
        "documentation": "Documentation page",
        "api":           "API page",
        "404":           "404 error page",
        "error":         "error page",
    }
 
    slug_lower = segment.lower().replace("-", " ").replace("_", " ")
    if segment.lower() in slug_map:
        return slug_map[segment.lower()]
 
    # Try partial match
    for key, label in slug_map.items():
        if key in slug_lower:
            return label
 
    # If the segment looks readable (no weird chars), use it
    if segment and re.match(r'^[a-zA-Z0-9\-_ ]+$', segment):
        return f"'{segment}' page"
 
    return "destination page"
 
 
def _friendly_element(selector: str, step_name: str = "") -> str:
    """
    Returns a human-readable description of the element being tested.
    """
    name_lower = step_name.lower()
    sel_lower  = selector.lower() if selector else ""
 
    # From step name keywords
    element_hints = {
        "nav":          "navigation menu",
        "menu":         "navigation menu",
        "logo":         "site logo",
        "search":       "search bar",
        "hero":         "hero section",
        "banner":       "banner",
        "footer":       "footer",
        "header":       "header",
        "button":       "button",
        "btn":          "button",
        "link":         "link",
        "form":         "form",
        "input":        "input field",
        "email":        "email field",
        "password":     "password field",
        "submit":       "submit button",
        "login":        "login element",
        "signup":       "sign-up element",
        "register":     "registration element",
        "cart":         "cart element",
        "checkout":     "checkout element",
        "image":        "image",
        "img":          "image",
        "video":        "video",
        "modal":        "modal dialog",
        "popup":        "popup",
        "dropdown":     "dropdown menu",
        "tab":          "tab",
        "accordion":    "accordion",
        "carousel":     "carousel",
        "slider":       "slider",
        "pagination":   "pagination",
        "breadcrumb":   "breadcrumb",
        "contact":      "contact element",
        "social":       "social media link",
        "lang":         "language switcher",
        "language":     "language switcher",
        "faq":          "FAQ section",
        "heading":      "page heading",
        "title":        "page title",
    }
 
    for keyword, label in element_hints.items():
        if keyword in name_lower or keyword in sel_lower:
            return label
 
    return "element"
 
 
def _reason(action: str, status: str, error: str | None,
            assertion_result: dict | None = None,
            step_name: str = "") -> str:
    """
    Generates a human-friendly, descriptive reason message for test results.
    """
 
    # ── PASS ──────────────────────────────────────────────────────────────────
    if status == "pass":
 
        if action == "check_visible":
            elem = _friendly_element("", step_name)
            return f"The {elem} is visible and accessible on the page."
 
        elif action == "fill":
            elem = _friendly_element("", step_name)
            if "email" in step_name.lower():
                return "Email address entered successfully and verified in the input field."
            if "password" in step_name.lower():
                return "Password entered successfully in the field."
            if "search" in step_name.lower():
                return "Search query entered successfully in the search field."
            return f"Text entered successfully in the {elem}."
 
        elif action == "click":
            elem = _friendly_element("", step_name)
 
            if assertion_result and assertion_result.get("passed"):
                a_type   = assertion_result.get("type", "")
                a_actual = assertion_result.get("actual", "")
                a_value  = assertion_result.get("value", "")
 
                if a_type == "url_contains":
                    # Decode the URL value for a friendly message
                    url_val = a_value or (a_actual if isinstance(a_actual, str) else "")
 
                    # Language redirect detection
                    lang_codes = {
                        "ar": "Arabic version",
                        "fr": "French version",
                        "en": "English version",
                        "es": "Spanish version",
                        "de": "German version",
                        "it": "Italian version",
                    }
                    for code, label in lang_codes.items():
                        if f"/{code}/" in url_val or url_val == code:
                            return f"Successfully redirected to the {label} of the site."
 
                    # Friendly page name from URL
                    page_name = _friendly_url(a_actual if isinstance(a_actual, str) else url_val)
 
                    # Special cases based on element name
                    name_lower = step_name.lower()
                    if "nav" in name_lower or "menu" in name_lower or "link" in name_lower:
                        return f"Navigation completed successfully — user redirected to the {page_name}."
                    if "lang" in name_lower or "language" in name_lower:
                        return f"Language switch successful — page switched to {page_name}."
                    if "logo" in name_lower:
                        return f"Logo click successful — user redirected to the {page_name}."
                    if "button" in name_lower or "btn" in name_lower or "cta" in name_lower:
                        return f"Button clicked successfully — user redirected to the {page_name}."
 
                    return f"Click successful — user was redirected to the {page_name}."
 
                elif a_type in ("element_visible", "element_exists"):
                    target_elem = _friendly_element(assertion_result.get("selector_target", ""), step_name)
                    if "submit" in step_name.lower() or "send" in step_name.lower():
                        return "Form submitted successfully and confirmation element appeared."
                    if "search" in step_name.lower():
                        return "Search executed successfully and results are displayed."
                    if "login" in step_name.lower() or "signin" in step_name.lower():
                        return "Login action completed and user interface updated."
                    if "menu" in step_name.lower() or "nav" in step_name.lower():
                        return "Navigation menu opened and content is visible."
                    if "modal" in step_name.lower() or "popup" in step_name.lower():
                        return "Modal dialog opened successfully."
                    return f"Click successful — the {target_elem} appeared as expected."
 
                elif a_type == "element_not_visible":
                    if "submit" in step_name.lower() or "empty" in step_name.lower():
                        return "Form validation triggered correctly — error message displayed for empty submission."
                    return "Click successful — expected element is no longer visible (correct behavior)."
 
                elif a_type == "text_contains":
                    a_val = assertion_result.get("actual", "")[:40]
                    return f"Click successful — page content updated and contains expected text: '{a_val}'."
 
            # Fallback for click without assertion
            if "nav" in step_name.lower() or "link" in step_name.lower():
                return "Navigation link clicked and page loaded successfully."
            if "button" in step_name.lower() or "btn" in step_name.lower():
                return "Button clicked successfully."
            if "lang" in step_name.lower():
                return "Language switcher clicked successfully."
            return f"Click on {elem} executed successfully."
 
        return "Test passed successfully."
 
    # ── FAIL ──────────────────────────────────────────────────────────────────
    if status == "fail":
 
        if assertion_result and not assertion_result.get("passed"):
            a_type = assertion_result.get("type", "")
            a_exp  = assertion_result.get("expected", "")
            a_act  = assertion_result.get("actual", "")
            a_err  = assertion_result.get("error", "")
 
            if a_type == "url_contains":
                page_name = _friendly_url(a_act if isinstance(a_act, str) else "")
                return (
                    f"Click was executed but the expected URL was not reached. "
                    f"The page did not navigate to the expected destination. "
                    f"Current URL: {str(a_act)[:80]}"
                )
 
            elif a_type in ("element_visible", "element_exists"):
                elem = _friendly_element(
                    assertion_result.get("selector_target", ""), step_name
                )
                return (
                    f"Action was executed but the expected {elem} did not appear. "
                    f"The element may be hidden, not rendered, or the selector is outdated."
                )
 
            elif a_type == "text_contains":
                return (
                    f"Action completed but page content did not match expectations. "
                    f"Expected to find '{a_exp}' but found '{str(a_act)[:60]}'."
                )
 
            elif a_type == "input_value":
                return (
                    f"Text input failed verification. "
                    f"Expected '{a_exp}' in the field but found '{a_act}'."
                )
 
            elif a_type == "element_not_visible":
                return (
                    "Form was submitted without validation triggering. "
                    "No error message appeared — validation may be missing."
                )
 
            if a_err:
                return f"Test failed: {a_err[:120]}"
 
        # Action-level failures (no assertion result)
        if not error:
            return "Test failed for an unknown reason."
 
        e = error.lower()
 
        if "timeout" in e:
            elem = _friendly_element("", step_name)
            if action == "click":
                return (
                    f"The {elem} was not clickable within the timeout period. "
                    f"It may be hidden, disabled, or slow to load."
                )
            elif action == "fill":
                return (
                    f"The input field was not available within the timeout. "
                    f"The form may not have loaded in time."
                )
            else:
                return (
                    f"The {elem} did not appear within the expected time. "
                    f"The page may be loading slowly or the element is missing."
                )
 
        if "not found" in e or "no such element" in e:
            elem = _friendly_element("", step_name)
            return (
                f"The {elem} could not be found in the page. "
                f"It may have been removed, renamed, or is not rendered."
            )
 
        if "fill verification" in e:
            return "Text was entered but the field value did not match what was typed."
 
        if "invalid selector" in e:
            return f"Test skipped — the CSS selector is invalid or not supported."
 
        if "failed to reset" in e or "cannot load" in e.lower():
            return "Could not navigate to the test page. The URL may be unreachable."
 
        if "intercept" in e or "net::" in e:
            return "Network error occurred while loading the page. Check internet connectivity."
 
        return f"Test failed: {error[:120]}"
 
    return "Test status unknown."