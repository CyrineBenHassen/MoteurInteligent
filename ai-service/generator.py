def build_prompt(scraped: dict, framework: str) -> str:
    url      = scraped.get("url", "")
    title    = scraped.get("title", "")
    inputs   = scraped.get("inputs", [])
    buttons  = scraped.get("buttons", [])
    forms    = scraped.get("forms", [])

    # Convertir les éléments en texte lisible
    inputs_str = "\n".join([
        f"  - input: type={i['type']}, name={i['name']}, id={i['id']}, placeholder={i['placeholder']}"
        for i in inputs
    ])

    buttons_str = "\n".join([
        f"  - button: type={b['type']}, text='{b['text']}', id={b['id']}"
        for b in buttons
    ])

    forms_str = "\n".join([
        f"  - form: id={f['id']}, action={f['action']}, method={f['method']}"
        for f in forms
    ])

    prompt = f"""You are a QA automation expert. Analyze this web page and generate test cases.

PAGE INFO:
- URL: {url}
- Title: {title}

PAGE ELEMENTS:
Inputs:
{inputs_str}

Buttons:
{buttons_str}

Forms:
{forms_str}

TASK:
Generate comprehensive test cases for {framework} covering:
1. Happy path (valid inputs)
2. Invalid inputs / negative cases  
3. Empty fields validation
4. Boundary cases if applicable

Return ONLY a valid JSON object with this exact structure, no extra text:
{{
  "test_cases": [
    {{
      "id": 1,
      "name": "test name",
      "description": "what this test verifies",
      "steps": ["step 1", "step 2", "step 3"],
      "expected": "expected result",
      "type": "positive"
    }}
  ],
  "script": "complete {framework} script here"
}}"""

    return prompt