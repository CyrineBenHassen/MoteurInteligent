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

def analyze_error(error: str, script: str, framework: str) -> dict:
    prompt = f"""You are a QA automation expert. A test script failed with an error.

FRAMEWORK: {framework}

FAILED SCRIPT:
{script}

ERROR MESSAGE:
{error}

TASK:
Analyze this error and provide:
1. What caused the error
2. How to fix it
3. The corrected script

IMPORTANT: Return ONLY a valid JSON object. No markdown, no backticks, no extra text.
{{
  "error_type": "type of error (e.g. ElementNotFound, Timeout, etc.)",
  "cause": "explanation of what caused the error",
  "solution": "step by step explanation of how to fix it",
  "fixed_script": "the complete corrected script here"
}}"""

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
            temperature=0.3,
            max_tokens=4000,
        )

        content = response.choices[0].message.content.strip()

        print("=== ANALYZER RAW RESPONSE ===")
        print(content)
        print("=== END ANALYZER RESPONSE ===")

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