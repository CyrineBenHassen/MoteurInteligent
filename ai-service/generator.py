import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ── Client Groq ───────────────────────────────────────────────────────────────
groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

# ── Gemini fallback (optionnel) ───────────────────────────────────────────────
try:
    from google import genai as _genai
    gemini_client = _genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    GEMINI_AVAILABLE = True
except Exception:
    gemini_client    = None
    GEMINI_AVAILABLE = False

client = groq_client

# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a QA automation expert. Generate realistic, executable test cases and scripts.

STRICT RULES:
1. Respond ONLY with valid JSON — no markdown, no backticks, no explanation
2. Use ONLY css_selector values from PAGE ELEMENTS — never invent selectors
3. If a css_selector is empty, SKIP that element entirely
4. Every test MUST have a real assert — tests without assert are FORBIDDEN
5. Generate tests ONLY for elements that actually exist on the page
6. Use only ASCII characters — no unicode
7. NEVER use 'assert True' — it always passes and is completely useless
8. NEVER use 'or True' in lambda conditions — it always returns True and is useless
9. NEVER generate tests for elements that do not exist in PAGE ELEMENTS
10. Do NOT generate form submission tests if no form exists in PAGE ELEMENTS
11. Do NOT generate error message tests if no alert/error container exists in PAGE ELEMENTS"""

KNOWN_SITES = {
    "practicetestautomation.com": {
        "username":       "student",
        "password":       "Password123",
        "success_url":    "logged-in-successfully",
        "error_selector": "#error",
    },
    "saucedemo.com": {
        "username":       "standard_user",
        "password":       "secret_sauce",
        "success_url":    "/inventory.html",
        "error_selector": ".error-message-container",
    },
    "the-internet.herokuapp.com": {
        "username":       "tomsmith",
        "password":       "SuperSecretPassword!",
        "success_url":    "/secure",
        "error_selector": ".flash.error",
    },
    "juice-shop.herokuapp.com": {
        "username":       "admin@juice-sh.op",
        "password":       "admin123",
        "success_url":    "/#/",
        "error_selector": ".mat-error",
    },
    "automationexercise.com": {
        "username":       "test@automationexercise.com",
        "password":       "test1234",
        "success_url":    "/",
        "error_selector": ".login-form p",
    },
}


def _detect_error_selector(scraped: dict) -> str:
    alerts = scraped.get("alerts", [])
    for a in alerts:
        css = a.get("css_selector", "").strip()
        cls = a.get("class", "").strip()
        aid = a.get("id", "").strip()
        for keyword in ["error", "alert", "message", "warning", "flash", "notification"]:
            if keyword in css.lower() or keyword in cls.lower() or keyword in aid.lower():
                if css: return css
                if aid: return f"#{aid}"
                if cls: return f".{cls.split()[0]}"
    if alerts:
        css = alerts[0].get("css_selector", "").strip()
        if css: return css
    return ""   # ✅ vide si aucun sélecteur d'erreur trouvé


def _detect_success_url(url: str, scraped: dict) -> str:
    for domain, info in KNOWN_SITES.items():
        if domain in url:
            return info.get("success_url", "")
    nav_links = scraped.get("nav_links", [])
    for nav in nav_links:
        href = nav.get("href", "").lower()
        text = nav.get("text", "").lower()
        for keyword in ["dashboard", "home", "account", "profile", "welcome", "inventory"]:
            if keyword in href or keyword in text:
                from urllib.parse import urlparse
                parsed = urlparse(href)
                return parsed.path if parsed.path and parsed.path != "/" else ""
    return ""


def _get_site_info(url: str, username: str = None, password: str = None, scraped: dict = None) -> dict:
    scraped        = scraped or {}
    error_selector = _detect_error_selector(scraped)
    success_url    = _detect_success_url(url, scraped)

    if username and password:
        return {"username": username, "password": password,
                "success_url": success_url, "error_selector": error_selector or "#error"}

    for domain, info in KNOWN_SITES.items():
        if domain in url:
            result = info.copy()
            if error_selector and error_selector != "#error":
                result["error_selector"] = error_selector
            return result

    return {"username": "", "password": "",
            "success_url": success_url, "error_selector": error_selector or "#error"}


# ─────────────────────────────────────────────────────────────────────────────
# JSON parsing robuste
# ─────────────────────────────────────────────────────────────────────────────

def _safe_parse(content: str) -> dict:
    content = content.strip()

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    depth = 0; start = None; end = None
    for i, char in enumerate(content):
        if char == "{":
            if depth == 0: start = i
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0: end = i + 1; break

    if start is not None and end is not None:
        content = content[start:end]

    def fix_newlines(s: str) -> str:
        result = []; in_string = False; escape = False
        for ch in s:
            if escape: result.append(ch); escape = False
            elif ch == "\\": result.append(ch); escape = True
            elif ch == '"': in_string = not in_string; result.append(ch)
            elif in_string and ch == "\n": result.append("\\n")
            elif in_string and ch == "\r": result.append("\\r")
            elif in_string and ch == "\t": result.append("\\t")
            else: result.append(ch)
        return "".join(result)

    content = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", content)

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        try:
            return json.loads(fix_newlines(content))
        except json.JSONDecodeError:
            pass

    # Extraction manuelle du script si JSON malformé
    if '"script"' in content:
        match = re.search(r'"script"\s*:\s*"(.*)"(?:\s*\}|\s*,)', content, re.DOTALL)
        if match:
            script_val = match.group(1).replace('\\n', '\n').replace('\\"', '"')
            no_script  = re.sub(r'"script"\s*:\s*".*"', '"script": "__PH__"', content, flags=re.DOTALL)
            try:
                parsed = json.loads(fix_newlines(no_script))
                parsed["script"] = script_val
                return parsed
            except Exception:
                return {"script": script_val}

    content = content.encode("utf-8", errors="ignore").decode("utf-8")
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON parse failed: {e}\nContent: {content[:300]}")


def _call_llm(prompt: str, max_tokens: int = 2000) -> str:
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": SYSTEM_PROMPT},
                      {"role": "user",   "content": prompt}],
            temperature=0.0, max_tokens=max_tokens, top_p=1, seed=42,
        )
        print("[LLM] llama-3.3-70b-versatile (Groq)")
        return response.choices[0].message.content.strip()
    except Exception as e:
        if "429" not in str(e) and "rate_limit" not in str(e): raise
        print("[LLM] Groq 70b limit → llama-3.1-8b-instant...")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": SYSTEM_PROMPT},
                      {"role": "user",   "content": prompt}],
            temperature=0.0, max_tokens=max_tokens, top_p=1, seed=42,
        )
        print("[LLM] llama-3.1-8b-instant (Groq)")
        return response.choices[0].message.content.strip()
    except Exception as e:
        if "429" not in str(e) and "rate_limit" not in str(e): raise
        print("[LLM] Groq 8b limit → Gemini...")

    if GEMINI_AVAILABLE and gemini_client:
        try:
            resp = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=f"{SYSTEM_PROMPT}\n\n{prompt}",
            )
            print("[LLM] gemini-2.0-flash (Google)")
            return resp.text.strip()
        except Exception as e:
            raise ValueError(f"Gemini failed: {e}")

    raise ValueError("All LLM models unavailable")


def _has_elements(scraped: dict) -> bool:
    return bool(scraped.get("inputs") or scraped.get("buttons") or
                scraped.get("forms") or scraped.get("nav_links"))


def _build_elements_block(scraped: dict) -> str:
    inputs      = scraped.get("inputs",     [])[:15]
    buttons     = scraped.get("buttons",    [])[:10]
    forms       = scraped.get("forms",      [])[:5]
    selects     = scraped.get("selects",    [])[:5]
    textareas   = scraped.get("textareas",  [])[:5]
    checkboxes  = scraped.get("checkboxes", [])[:10]
    nav_links   = scraped.get("nav_links",  [])[:10]
    add_to_cart = scraped.get("add_to_cart",[])[:5]
    pagination  = scraped.get("pagination", [])[:5]
    modals      = scraped.get("modals",     [])[:5]
    images      = scraped.get("images",     [])[:10]
    alerts      = scraped.get("alerts",     [])[:10]
    links       = scraped.get("links",      [])[:10]

    if not _has_elements(scraped) and not links:
        url = scraped.get("url", "")
        return (f"PAGE ELEMENTS: No elements detected.\n"
                f"URL: {url}\nGenerate generic tests based on URL and title.")

    lines = ["PAGE ELEMENTS (use ONLY these selectors):"]

    if inputs:
        lines.append("Inputs:")
        for i in inputs:
            lines.append(f"  - type={i['type']}, name={i['name']}, "
                         f"css_selector='{i.get('css_selector','')}', required={i.get('required',False)}")

    if buttons:
        lines.append("Buttons:")
        for b in buttons:
            lines.append(f"  - text='{b['text']}', css_selector='{b.get('css_selector','')}'")

    if forms:
        lines.append("Forms (only generate form tests if this section exists):")
        for f in forms:
            lines.append(f"  - action={f['action']}, method={f['method']}, css_selector='{f.get('css_selector','')}'")

    if selects:
        lines.append("Selects:")
        for s in selects:
            lines.append(f"  - name={s['name']}, options={s['options']}, css_selector='{s.get('css_selector','')}'")

    if textareas:
        lines.append("Textareas:")
        for t in textareas:
            lines.append(f"  - name={t['name']}, css_selector='{t.get('css_selector','')}'")

    if checkboxes:
        lines.append("Checkboxes:")
        for c in checkboxes:
            lines.append(f"  - type={c['type']}, name={c['name']}, css_selector='{c.get('css_selector','')}'")

    if nav_links:
        lines.append("Navigation links (use By.LINK_TEXT with text value):")
        for n in nav_links:
            if n.get("text"):
                lines.append(f"  - text='{n['text']}' → use By.LINK_TEXT, href={n['href']}")

    if links:
        lines.append("Page links:")
        for l in links:
            if l.get("text"):
                lines.append(f"  - text='{l['text']}', href={l['href']}")

    if add_to_cart:
        lines.append("Add-to-cart buttons:")
        for c in add_to_cart:
            lines.append(f"  - text='{c['text']}', css_selector='{c.get('css_selector','')}'")

    if pagination:
        lines.append("Pagination:")
        for p in pagination:
            lines.append(f"  - text='{p['text']}', href={p['href']}")

    if modals:
        lines.append("Modals:")
        for m in modals:
            lines.append(f"  - id={m['id']}, visible={m['visible']}, css_selector='{m.get('css_selector','')}'")

    if images:
        lines.append("Images (use css_selector 'img' or img[alt='text'] — NEVER use src URL):")
        for img in images:
            alt = img.get('alt', '')
            css = f"img[alt='{alt}']" if alt else 'img'
            lines.append(f"  - css_selector='{css}', loaded={img['loaded']}")

    if alerts:
        lines.append("Error/Alert containers (only generate error tests if this section exists):")
        seen = set()
        for a in alerts:
            css = a.get("css_selector","").strip()
            cls = a.get("class","").strip()
            aid = a.get("id","").strip()
            if css and css not in seen:
                seen.add(css); lines.append(f"  - css_selector='{css}'")
            elif aid and f"#{aid}" not in seen:
                seen.add(f"#{aid}"); lines.append(f"  - css_selector='#{aid}'")
            elif cls and cls not in seen:
                seen.add(cls); lines.append(f"  - css_selector='.{cls.split()[0]}'")
    else:
        lines.append("Error/Alert containers: NONE DETECTED — do NOT generate error message tests")

    if not forms:
        lines.append("Forms: NONE DETECTED — do NOT generate form submission tests")

    return "\n".join(lines)


def _detect_page_type(url: str, scraped: dict) -> str:
    url_lower    = url.lower()
    inputs       = scraped.get("inputs", [])
    has_password = any(i.get("type") == "password" for i in inputs)

    if has_password or any(k in url_lower for k in ["/login","/signin","/auth","/connexion"]):
        return "login"
    if scraped.get("add_to_cart") or any(k in url_lower for k in ["/product","/inventory","/shop","/store","/cart"]):
        return "ecommerce"
    if any(k in url_lower for k in ["/contact","/support","/form","/register","/signup"]):
        return "form"
    if any(k in url_lower for k in ["/dashboard","/admin","/panel"]):
        return "dashboard"
    if inputs and not has_password:
        return "form"
    return "general"


def _prompt_test_cases(scraped: dict, framework: str) -> str:
    url       = scraped.get("url",   "")
    title     = scraped.get("title", "")
    is_spa    = scraped.get("is_spa", False)
    load_time = scraped.get("load_time_ms", 0)
    elements  = _build_elements_block(scraped)
    page_type = _detect_page_type(url, scraped)
    has_forms  = bool(scraped.get("forms"))
    has_alerts = bool(scraped.get("alerts"))

    spa_note  = "NOTE: SPA — use explicit waits." if is_spa else ""
    perf_note = "NOTE: Load > 3s — include one performance test (limit: elapsed < 5)." if load_time > 3000 else ""

    return f"""Generate focused, realistic test cases for this web page.

PAGE INFO:
- URL: {url}
- Title: {title}
- Framework: {framework}
- Load time: {load_time} ms
- PAGE TYPE: {page_type}
- Has forms: {has_forms}
- Has error containers: {has_alerts}
{spa_note}
{perf_note}

{elements}

RULES FOR TEST GENERATION:
- Generate 5 to 7 tests
- Use ONLY selectors from PAGE ELEMENTS — never invent
- type = "positive" or "negative" only
- priority = "high" / "medium" / "low"
- category = "functional" / "performance" / "ui" / "navigation"

IMPORTANT CONSTRAINTS:
- If Has forms = False → do NOT generate form submission tests
- If Has error containers = False → do NOT generate error message visibility tests
- Only generate tests for elements that actually exist in PAGE ELEMENTS
- For performance test: expected MUST say "Page load time is less than 5 seconds"

Return ONLY this JSON:
{{
  "page_type": "{page_type}",
  "test_cases": [
    {{
      "id": 1,
      "name": "test name",
      "description": "what it verifies",
      "preconditions": "Browser open, page accessible",
      "steps": ["step 1", "step 2"],
      "test_data": {{}},
      "expected": "expected result",
      "type": "positive",
      "priority": "high",
      "category": "functional"
    }}
  ]
}}"""


def _prompt_script(test_cases: list, scraped: dict, framework: str,
                   username: str = None, password: str = None) -> str:
    url       = scraped.get("url", "")
    is_spa    = scraped.get("is_spa", False)
    elements  = _build_elements_block(scraped)
    site_info = _get_site_info(url, username, password, scraped)
    spa_warn  = "IMPORTANT: SPA — use explicit waits." if is_spa else ""

    success_assert = (
        f"assert '{site_info['success_url']}' in driver.current_url, 'Login failed'"
        if site_info.get("success_url")
        else "assert driver.current_url != original_url, 'URL did not change'"
    )

    error_sel = site_info.get("error_selector", "#error")

    if framework.lower() == "selenium":
        rules = f"""SELENIUM RULES:

IMPORTS:
  from selenium import webdriver
  from selenium.webdriver.common.by import By
  from selenium.webdriver.support.ui import WebDriverWait
  from selenium.webdriver.support import expected_conditions as EC

CREDENTIALS: username='{site_info.get("username","")}', password='{site_info.get("password","")}'

ASSERTION PATTERNS — use the correct one for each test:

  PAGE LOAD / TITLE:
    assert driver.title != '', 'Page title empty'

  ELEMENT EXISTS:
    el = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'selector')))
    assert el is not None and el.is_displayed(), 'Element not found or not visible'

  NAVIGATION (link click → URL changes):
    original = driver.current_url
    driver.find_element(By.LINK_TEXT, 'link text').click()
    WebDriverWait(driver, 10).until(lambda d: d.current_url != original)
    assert driver.current_url != original, 'Navigation failed'

  LOGIN SUCCESS:
    {success_assert}

  LOGIN FAILURE / ERROR VISIBLE:
    error = WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, '{error_sel}')))
    assert error.is_displayed(), 'Error not visible'

  IMAGE LOADED:
    img = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'img')))
    loaded = driver.execute_script('return arguments[0].complete && arguments[0].naturalWidth > 0', img)
    assert loaded, 'Image not loaded'

  ADD TO CART (click then verify cart counter OR page title changed):
    original_url = driver.current_url
    btn = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, '.btn')))
    btn.click()
    WebDriverWait(driver, 5).until(lambda d: d.current_url != original_url)
    assert driver.current_url != original_url, 'Cart page not loaded after add to cart'

  PERFORMANCE:
    import time
    start = time.time()
    driver.get('{url}')
    elapsed = time.time() - start
    assert elapsed < 5, f'Page too slow: {{elapsed:.2f}}s'

ABSOLUTE FORBIDDEN:
  - assert True  ← ALWAYS passes, COMPLETELY USELESS, NEVER use
  - lambda d: d.current_url != url or True  ← ALWAYS True, USELESS
  - assert not something  ← only use if you KNOW the element is NOT supposed to be there
  - Invented selectors not in PAGE ELEMENTS
  - img[src="..."] selectors — use img or img[alt="text"]
  - a[href="https://..."] selectors — use By.LINK_TEXT

STRUCTURE:
  def setup_driver():
      from selenium.webdriver.chrome.options import Options
      opts = Options()
      return webdriver.Chrome(options=opts)

  def test_N_name(driver):
      driver.get('{url}')
      # assertions here
      assert something, 'message'

  if __name__ == '__main__':
      driver = setup_driver()
      try:
          try:
              test_1_name(driver)
              print('Test 1: PASSED')
          except (AssertionError, Exception):
              print('Test 1: FAILED')
          # repeat for each test
      finally:
          driver.quit()"""

    else:
        rules = f"""CYPRESS RULES:
  - describe() + it() + beforeEach(cy.visit('{url}'))
  - Use cy.get() with ONLY selectors from PAGE ELEMENTS
  - username='{site_info.get("username","")}', password='{site_info.get("password","")}'
  - Every it() MUST end with cy.should()
  - NEVER use cy.should('be.true') — it's meaningless"""

    tc_json = json.dumps(test_cases, indent=2)

    return f"""Generate a complete {framework} test script.

URL: {url}
{spa_warn}

{elements}

{rules}

TESTS:
{tc_json}

Return ONLY:
{{
  "script": "complete script — use single quotes in Python, \\n for newlines"
}}"""


def generate_single(scraped: dict, framework: str,
                    username: str = None, password: str = None) -> dict:
    try:
        raw1       = _call_llm(_prompt_test_cases(scraped, framework), max_tokens=2000)
        tc_result  = _safe_parse(raw1)
        test_cases = tc_result.get("test_cases", [])
    except Exception as e:
        return {"error": f"test_cases generation failed: {e}"}

    if not test_cases:
        return {"error": "No test cases were generated"}

    try:
        raw2          = _call_llm(_prompt_script(test_cases, scraped, framework, username, password), max_tokens=3000)
        script_result = _safe_parse(raw2)
        script        = script_result.get("script", "")
    except Exception as e:
        script = f"# Script generation failed: {e}"

    return {"test_cases": test_cases, "script": script}


def generate_tests(scraped: dict, framework: str,
                   username: str = None, password: str = None) -> dict:
    if framework.lower() == "both":
        print("=== SELENIUM ===")
        sel = generate_single(scraped, "Selenium", username, password)
        print("=== CYPRESS ===")
        cyp = generate_single(scraped, "Cypress",  username, password)
        return {
            "test_cases":          sel.get("test_cases", []),
            "test_cases_selenium": sel.get("test_cases", []),
            "test_cases_cypress":  cyp.get("test_cases", []),
            "script_selenium":     sel.get("script", ""),
            "script_cypress":      cyp.get("script", ""),
        }
    return generate_single(scraped, framework, username, password)