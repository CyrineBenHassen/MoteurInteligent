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


def build_prompt(scraped: dict, framework: str) -> str:
    url          = scraped.get("url", "")
    title        = scraped.get("title", "")
    is_spa       = scraped.get("is_spa", False)
    load_time    = scraped.get("load_time_ms", 0)
    inputs       = scraped.get("inputs", [])[:15]
    buttons      = scraped.get("buttons", [])[:10]
    forms        = scraped.get("forms", [])[:5]
    selects      = scraped.get("selects", [])[:5]
    textareas    = scraped.get("textareas", [])[:5]
    checkboxes   = scraped.get("checkboxes", [])[:10]
    add_to_cart  = scraped.get("add_to_cart", [])[:5]
    pagination   = scraped.get("pagination", [])[:5]
    nav_links    = scraped.get("nav_links", [])[:10]
    modals       = scraped.get("modals", [])[:5]
    images       = scraped.get("images", [])[:10]
    alerts       = scraped.get("alerts", [])[:5]

    inputs_str     = "\n".join([f"  - input: type={i['type']}, name={i['name']}, id={i['id']}, required={i.get('required', False)}" for i in inputs])
    buttons_str    = "\n".join([f"  - button: text='{b['text']}', id={b['id']}" for b in buttons])
    forms_str      = "\n".join([f"  - form: action={f['action']}, method={f['method']}" for f in forms])
    selects_str    = "\n".join([f"  - select: name={s['name']}, options={s['options']}" for s in selects])
    textareas_str  = "\n".join([f"  - textarea: name={t['name']}, id={t['id']}" for t in textareas])
    checkboxes_str = "\n".join([f"  - {c['type']}: name={c['name']}, value={c['value']}" for c in checkboxes])
    cart_str       = "\n".join([f"  - add_to_cart: text='{c['text']}', id={c['id']}" for c in add_to_cart])
    pagination_str = "\n".join([f"  - page: text='{p['text']}', href={p['href']}" for p in pagination])
    nav_str        = "\n".join([f"  - nav: text='{n['text']}', href={n['href']}" for n in nav_links])
    modals_str     = "\n".join([f"  - modal: id={m['id']}, visible={m['visible']}" for m in modals])
    images_str     = "\n".join([f"  - image: src={i['src'][:50]}, loaded={i['loaded']}" for i in images])
    alerts_str     = "\n".join([f"  - alert: text='{a['text']}', class={a['class']}" for a in alerts])

    spa_warning = "IMPORTANT: This is a SPA application. Use explicit waits for ALL elements." if is_spa else ""

    if framework.lower() == "selenium":
        script_rules = """
SELENIUM SCRIPT RULES:
- Always import: webdriver, By, WebDriverWait, expected_conditions as EC
- Use WebDriverWait(driver, 10).until() for ALL elements
- Use By.ID when id is available
- Each test must be a separate def test_xxx():
- Call all test functions at the end
- Always add driver.quit() at the end"""
    else:
        script_rules = """
CYPRESS SCRIPT RULES:
- Use describe() and it() blocks
- Use cy.visit() to navigate
- Use cy.get() with CSS selectors
- Use cy.should() for assertions
- Add beforeEach() to reset state"""

    prompt = f"""You are a QA automation expert. Analyze this web page and generate test cases.

PAGE INFO:
- URL: {url}
- Title: {title}
- Is SPA (React/Angular/Vue): {is_spa}
- Load Time: {load_time}ms
{spa_warning}

PAGE ELEMENTS:
Inputs:
{inputs_str}

Buttons:
{buttons_str}

Forms:
{forms_str}

Selects:
{selects_str}

Textareas:
{textareas_str}

Checkboxes:
{checkboxes_str}

Add to Cart Buttons:
{cart_str}

Pagination:
{pagination_str}

Navigation Links:
{nav_str}

Modals/Popups:
{modals_str}

Images:
{images_str}

Alerts/Notifications:
{alerts_str}

TASK:
Generate comprehensive test cases for {framework} covering:
1. Happy path (valid inputs)
2. Invalid inputs / negative cases
3. Empty fields validation
4. Boundary cases if applicable
5. Navigation testing (if nav_links exist)
6. Add to cart testing (if add_to_cart exists)
7. Pagination testing (if pagination exists)
8. Modal/Popup testing (if modals exist)
9. Image loading verification (if images exist)
10. Performance check (load time > 3000ms is slow)

{script_rules}

IMPORTANT: Return ONLY a valid JSON object. No markdown, no backticks, no extra text.
{{
  "test_cases": [
    {{
      "id": 1,
      "name": "test name",
      "description": "what this test verifies",
      "steps": ["step 1", "step 2"],
      "expected": "expected result",
      "type": "positive"
    }}
  ],
  "script": "complete {framework} script with \\n for newlines"
}}"""
    return prompt


def generate_single(scraped: dict, framework: str) -> dict:
    """Génère les tests pour un seul framework"""
    prompt = build_prompt(scraped, framework)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a QA automation expert. Always respond with valid JSON only. No markdown, no backticks, no extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.0,
            max_tokens=4000,
        )

        content = response.choices[0].message.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', content)
        content = re.sub(r'(?<!\\)\\(?!["\\/bfnrtu])', r'\\\\', content)

        depth = 0
        start = None
        end   = None
        for i, char in enumerate(content):
            if char == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break

        if start is not None and end is not None:
            content = content[start:end]

        return json.loads(content)

    except Exception as e:
        return {"error": str(e)}


def generate_tests(scraped: dict, framework: str) -> dict:
    if framework.lower() == "both":
        print("=== GENERATING SELENIUM ===")
        selenium_result = generate_single(scraped, "Selenium")

        print("=== GENERATING CYPRESS ===")
        cypress_result  = generate_single(scraped, "Cypress")

        return {
            "test_cases":          selenium_result.get("test_cases", []),  # pour compatibilité
            "test_cases_selenium": selenium_result.get("test_cases", []),  # 🆕
            "test_cases_cypress":  cypress_result.get("test_cases", []),   # 🆕
            "script_selenium":     selenium_result.get("script", ""),
            "script_cypress":      cypress_result.get("script", ""),
        }

    result = generate_single(scraped, framework)
    return result