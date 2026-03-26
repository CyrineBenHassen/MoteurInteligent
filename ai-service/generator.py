import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def build_prompt(scraped: dict, framework: str) -> str:
    url        = scraped.get("url", "")
    title      = scraped.get("title", "")
    inputs     = scraped.get("inputs", [])
    buttons    = scraped.get("buttons", [])
    forms      = scraped.get("forms", [])
    selects    = scraped.get("selects", [])
    textareas  = scraped.get("textareas", [])
    checkboxes = scraped.get("checkboxes", [])

    inputs_str     = "\n".join([f"  - input: type={i['type']}, name={i['name']}, id={i['id']}" for i in inputs])
    buttons_str    = "\n".join([f"  - button: text='{b['text']}', id={b['id']}" for b in buttons])
    forms_str      = "\n".join([f"  - form: action={f['action']}, method={f['method']}" for f in forms])
    selects_str    = "\n".join([f"  - select: name={s['name']}, options={s['options']}" for s in selects])
    textareas_str  = "\n".join([f"  - textarea: name={t['name']}, id={t['id']}" for t in textareas])
    checkboxes_str = "\n".join([f"  - {c['type']}: name={c['name']}, value={c['value']}" for c in checkboxes])

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

Selects:
{selects_str}

Textareas:
{textareas_str}

Checkboxes:
{checkboxes_str}

TASK:
Generate comprehensive test cases for {framework} covering:
1. Happy path (valid inputs)
2. Invalid inputs / negative cases
3. Empty fields validation
4. Boundary cases if applicable

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
  "script": "complete {framework} script here"
}}"""
    return prompt


def generate_tests(scraped: dict, framework: str) -> dict:
    prompt = build_prompt(scraped, framework)

    try:
        response = client.chat.completions.create(
            model="qwen/qwen-2.5-coder-32b-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are a QA automation expert. Always respond with valid JSON only. No markdown, no backticks, no extra text before or after the JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=8000,
        )

        content = response.choices[0].message.content.strip()

        # Nettoyer les backticks markdown
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        # Supprimer les caractères de contrôle
        content = re.sub(r'[\x00-\x1f\x7f]', ' ', content)

        # Trouver le premier JSON complet
        depth = 0
        start = None
        end = None
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

        result = json.loads(content)
        return result

    except Exception as e:
        return {"error": str(e)}