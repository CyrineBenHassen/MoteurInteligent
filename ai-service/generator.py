import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

SYSTEM_PROMPT = """You are a QA automation expert that generates test cases and scripts.

STRICT RULES:
1. Always respond with valid JSON only — no markdown, no backticks, no extra text
2. Use ONLY the css_selector values provided in the PAGE ELEMENTS — never invent selectors
3. If a css_selector is empty, skip that element or use a fallback text-based selector
4. Keep test cases focused and realistic based on the actual page elements provided
5. Never hallucinate elements that are not listed in PAGE ELEMENTS
6. NEVER generate a test function without an assert statement — a test without assert is useless
7. Use only ASCII characters in the script — no special unicode or control characters"""

# ── Known test sites credentials & selectors ─────────────────────────────────
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
        "username":       "admin",
        "password":       "admin",
        "success_url":    "/secure",
        "error_selector": ".flash.error",
    },
    "juice-shop.herokuapp.com": {
        "username":       "admin@juice-sh.op",
        "password":       "admin123",
        "success_url":    "/#/",
        "error_selector": ".mat-error",
    },
   
}


def _get_site_info(url: str, username: str = None, password: str = None) -> dict:
    """Retourne les infos du site — priorité aux credentials fournis par l'utilisateur."""
    # ✅ Credentials fournis par l'utilisateur — priorité maximale
    if username and password:
        base = {"success_url": "", "error_selector": "#error"}
        for domain, info in KNOWN_SITES.items():
            if domain in url:
                base = info.copy()
                break
        base["username"] = username
        base["password"] = password
        return base

    # Chercher dans les sites connus
    for domain, info in KNOWN_SITES.items():
        if domain in url:
            return info.copy()

    # Fallback générique
    return {
        "username":       "testuser@test.com",
        "password":       "Test@1234",
        "success_url":    "",
        "error_selector": "#error",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _safe_parse(content: str) -> dict:
    content = content.strip()

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', content)
    content = re.sub(r'(?<!\\)\\(?!["\\/bfnrtu])', r'\\\\', content)
    content = content.replace('\t', '    ')

    depth = 0; start = None; end = None
    for i, char in enumerate(content):
        if char == '{':
            if depth == 0: start = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0: end = i + 1; break

    if start is not None and end is not None:
        content = content[start:end]

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        content = content.encode('utf-8', errors='ignore').decode('utf-8')
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parse failed: {e}\nContent: {content[:200]}")


def _call_llm(prompt: str, max_tokens: int = 2000) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.0,
        max_tokens=max_tokens,
        top_p=1,
        seed=42,
    )
    return response.choices[0].message.content.strip()


def _has_elements(scraped: dict) -> bool:
    return bool(
        scraped.get("inputs") or
        scraped.get("buttons") or
        scraped.get("forms") or
        scraped.get("nav_links")
    )


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builders
# ─────────────────────────────────────────────────────────────────────────────

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

    if not _has_elements(scraped):
        url = scraped.get("url", "")
        return f"""PAGE ELEMENTS: No elements detected automatically.
The page at {url} may require authentication or use heavy JavaScript rendering.
Generate generic test cases based on the URL and page title.
Use standard selectors like: input[type='email'], input[type='password'], button[type='submit']"""

    lines = ["PAGE ELEMENTS (use ONLY these css_selector values):"]

    if inputs:
        lines.append("Inputs:")
        for i in inputs:
            lines.append(
                f"  - type={i['type']}, name={i['name']}, "
                f"css_selector='{i.get('css_selector', '')}', required={i.get('required', False)}"
            )

    if buttons:
        lines.append("Buttons:")
        for b in buttons:
            lines.append(f"  - text='{b['text']}', css_selector='{b.get('css_selector', '')}'")

    if forms:
        lines.append("Forms:")
        for f in forms:
            lines.append(f"  - action={f['action']}, method={f['method']}, css_selector='{f.get('css_selector', '')}'")

    if selects:
        lines.append("Selects:")
        for s in selects:
            lines.append(f"  - name={s['name']}, options={s['options']}, css_selector='{s.get('css_selector', '')}'")

    if textareas:
        lines.append("Textareas:")
        for t in textareas:
            lines.append(f"  - name={t['name']}, css_selector='{t.get('css_selector', '')}'")

    if checkboxes:
        lines.append("Checkboxes/Radios:")
        for c in checkboxes:
            lines.append(f"  - type={c['type']}, name={c['name']}, css_selector='{c.get('css_selector', '')}'")

    if nav_links:
        lines.append("Navigation links:")
        for n in nav_links:
            lines.append(f"  - text='{n['text']}', href={n['href']}")

    if add_to_cart:
        lines.append("Add-to-cart buttons:")
        for c in add_to_cart:
            lines.append(f"  - text='{c['text']}', css_selector='{c.get('css_selector', '')}'")

    if pagination:
        lines.append("Pagination:")
        for p in pagination:
            lines.append(f"  - text='{p['text']}', href={p['href']}")

    if modals:
        lines.append("Modals:")
        for m in modals:
            lines.append(f"  - id={m['id']}, visible={m['visible']}, css_selector='{m.get('css_selector', '')}'")

    if images:
        lines.append("Images:")
        for img in images:
            lines.append(f"  - src={img['src'][:60]}, loaded={img['loaded']}")

    if alerts:
        lines.append("Error/Alert containers (USE THESE css_selectors for negative test assertions):")
        seen = set()
        for a in alerts:
            css = a.get("css_selector", "").strip()
            cls = a.get("class", "").strip()
            aid = a.get("id", "").strip()

            if css and css not in seen:
                seen.add(css)
                lines.append(f"  - css_selector='{css}', class='{cls}', id='{aid}'")
            elif aid and f"#{aid}" not in seen:
                seen.add(f"#{aid}")
                lines.append(f"  - css_selector='#{aid}', id='{aid}'")
            elif cls and cls not in seen:
                seen.add(cls)
                first_class = cls.split()[0]
                lines.append(f"  - css_selector='.{first_class}', full_class='{cls}'")

    return "\n".join(lines)


def _prompt_test_cases(scraped: dict, framework: str) -> str:
    url       = scraped.get("url",   "")
    title     = scraped.get("title", "")
    is_spa    = scraped.get("is_spa", False)
    load_time = scraped.get("load_time_ms", 0)
    elements  = _build_elements_block(scraped)

    spa_note  = "NOTE: This is a SPA — all tests must account for async rendering." if is_spa else ""
    perf_note = "NOTE: Page load time exceeds 3 s — include a performance test case." if load_time > 3000 else ""

    return f"""Generate test cases for the following web page.

PAGE INFO:
- URL: {url}
- Title: {title}
- Framework: {framework}
- Load time: {load_time} ms
{spa_note}
{perf_note}

{elements}

TASK:
Generate between 5 and 8 focused test cases covering:
1. Happy path (valid inputs, successful actions)
2. Negative / invalid input cases
3. Empty required fields
4. Navigation (if nav_links exist)
5. Add-to-cart flow (if add_to_cart exists)
6. Pagination (if pagination exists)
7. Modal interaction (if modals exist)
8. Performance (if load_time > 3000 ms)

Return ONLY this JSON structure:
{{
  "test_cases": [
    {{
      "id": 1,
      "name": "short test name",
      "description": "what this test verifies",
      "steps": ["step 1 with real selector", "step 2"],
      "expected": "expected result",
      "type": "positive"
    }}
  ]
}}"""


def _prompt_script(test_cases: list, scraped: dict, framework: str, username: str = None, password: str = None) -> str:
    """✅ Accepte maintenant username et password optionnels."""
    url       = scraped.get("url", "")
    is_spa    = scraped.get("is_spa", False)
    elements  = _build_elements_block(scraped)

    # ✅ Utiliser credentials fournis par l'utilisateur en priorité
    site_info = _get_site_info(url, username, password)

    spa_warning = "IMPORTANT: SPA detected — use explicit waits for ALL interactions." if is_spa else ""

    success_assert = (
        f"WebDriverWait(driver, 10).until(EC.url_contains('{site_info['success_url']}'))\\n"
        f"        assert '{site_info['success_url']}' in driver.current_url, 'Login failed'"
        if site_info["success_url"]
        else f"assert driver.current_url != '{url}', 'URL did not change after login'"
    )

    if framework.lower() == "selenium":
        rules = f"""SELENIUM RULES:
- Always include these exact imports at the top:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
- Use WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'selector'))) for every element
- Use By.CSS_SELECTOR with ONLY the css_selector values from PAGE ELEMENTS

CREDENTIALS FOR THIS SITE:
- username: '{site_info["username"]}'
- password: '{site_info["password"]}'

ASSERTIONS:
- Positive login test MUST use:
    {success_assert}
- Negative tests MUST use this error selector: '{site_info["error_selector"]}'
    error = WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, '{site_info["error_selector"]}')))
    assert error.is_displayed(), 'Error message should be visible'
- If the error selector from PAGE ELEMENTS is different, use that one instead
- NEVER generate a test without an assert — commented-out asserts are FORBIDDEN
- Each test = a separate def test_xxx(driver): function
- def setup_driver(): must return webdriver.Chrome()
- Wrap all test calls in try/except AssertionError and print 'Test N: PASSED' or 'Test N: FAILED'
- Also catch Exception as e and print 'Test N: FAILED' for any other error
- Always call driver.quit() inside a finally block"""

    else:
        rules = f"""CYPRESS RULES:
- Use describe() and it() blocks
- Use cy.visit() to navigate
- Use cy.get('css_selector') with ONLY the css_selector values from PAGE ELEMENTS
- CREDENTIALS: username='{site_info["username"]}', password='{site_info["password"]}'
- EVERY it() block MUST end with at least one cy.should() assertion:
    * Positive login: cy.url().should('include', '{site_info["success_url"] or "/"}')
    * Negative tests: cy.get('{site_info["error_selector"]}').should('be.visible')
- Add beforeEach(() => cy.visit(url)) to reset state before each test
- Use cy.wait() only when strictly necessary (SPA async)"""

    tc_json = json.dumps(test_cases, indent=2)

    return f"""Generate a complete, executable {framework} test script.

TARGET URL: {url}
{spa_warning}

{elements}

{rules}

TEST CASES TO IMPLEMENT:
{tc_json}

ABSOLUTE REQUIREMENTS:
- Every single test function MUST have a real assert (Selenium) or cy.should() (Cypress)
- Commented-out assertions like "# No error message" are STRICTLY FORBIDDEN
- If you cannot find the error selector in PAGE ELEMENTS, use '{site_info["error_selector"]}' as fallback
- Use only ASCII characters — no special unicode or control characters
- Use \\n for newlines inside the script string — never use actual newline characters inside strings
- A test without assertion will ALWAYS pass even when broken — this is unacceptable

Return ONLY this JSON structure:
{{
  "script": "complete {framework} script using \\n for newlines"
}}"""


# ─────────────────────────────────────────────────────────────────────────────
# Core generation functions
# ─────────────────────────────────────────────────────────────────────────────

def generate_single(scraped: dict, framework: str, username: str = None, password: str = None) -> dict:
    # ── Appel 1 : cas de test ────────────────────────────────────────────────
    try:
        raw1       = _call_llm(_prompt_test_cases(scraped, framework), max_tokens=2000)
        tc_result  = _safe_parse(raw1)
        test_cases = tc_result.get("test_cases", [])
    except Exception as e:
        return {"error": f"test_cases generation failed: {e}"}

    if not test_cases:
        return {"error": "No test cases were generated"}

    # ── Appel 2 : script — ✅ passer username et password ────────────────────
    try:
        raw2          = _call_llm(_prompt_script(test_cases, scraped, framework, username, password), max_tokens=3000)
        script_result = _safe_parse(raw2)
        script        = script_result.get("script", "")
    except Exception as e:
        script = f"# Script generation failed: {e}"

    return {
        "test_cases": test_cases,
        "script":     script,
    }


def generate_tests(scraped: dict, framework: str, username: str = None, password: str = None) -> dict:
    if framework.lower() == "both":
        print("=== GENERATING SELENIUM ===")
        selenium_result = generate_single(scraped, "Selenium", username, password)

        print("=== GENERATING CYPRESS ===")
        cypress_result  = generate_single(scraped, "Cypress", username, password)

        return {
            "test_cases":          selenium_result.get("test_cases", []),
            "test_cases_selenium": selenium_result.get("test_cases", []),
            "test_cases_cypress":  cypress_result.get("test_cases",  []),
            "script_selenium":     selenium_result.get("script",     ""),
            "script_cypress":      cypress_result.get("script",      ""),
        }

    # ✅ Bug fixé — return était après le if, jamais exécuté !
    return generate_single(scraped, framework, username, password)