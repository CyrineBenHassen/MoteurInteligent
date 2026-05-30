# regression_generator.py — NexTest Regression Test Generator (LLaMA-powered)

import json
import os
import requests
import urllib3
from openai import OpenAI
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

# ── Pages ANPE connues ────────────────────────────────────────────────────────
ANPE_PAGES = [
    "/statistiques",
    "/dashboard",
    "/reception",
    "/outbox",
    "/traitement_dossier_eie",
    "/traitement_dossier_ed",
    "/traitement_dossier_avis",
    "/traitement_dossier_transaction",
    "/gestion_commission",
    "/reunions",
    "/traitement_dossier_cc",
    "/visites",
    "/traitement_dossier_af",
    "/ancien_module_eie", #fausse url n'existe pas dans anpe
]

def _discover_pages(base_url: str) -> list:
    """Check which pages respond (not 404)"""
    discovered = []
    print(f"[REGRESSION_GENERATOR] Probing pages on {base_url}...")

    for path in ANPE_PAGES:
        url = f"{base_url}{path}"
        try:
            resp = requests.get(
                url, verify=False, timeout=5,
                allow_redirects=True,
            )
            if resp.status_code not in [404, 500]:
                discovered.append({
                    "path":   path,
                    "url":    url,
                    "status": resp.status_code,
                })
                print(f"[REGRESSION_GENERATOR]   ✓ {path} → {resp.status_code}")
            else:
                print(f"[REGRESSION_GENERATOR]   ✗ {path} → {resp.status_code}")
        except Exception as e:
            print(f"[REGRESSION_GENERATOR]   ✗ {path} → error: {e}")
            continue

    print(f"[REGRESSION_GENERATOR] Discovered {len(discovered)} pages")
    return discovered


def generate_regression_tests(base_url: str) -> dict:
    """
    1. Discover available pages
    2. LLaMA generates regression test cases
    """

    # ── Step 1: Discover pages ───────────────────────────────────────────────
    discovered = _discover_pages(base_url)

    if not discovered:
        discovered = [
            {"path": "/dashboard", "url": f"{base_url}/dashboard", "status": 200},
            {"path": "/reception", "url": f"{base_url}/reception", "status": 200},
        ]

    pages_str = "\n".join([
        f"  - {p['path']} (status: {p['status']})"
        for p in discovered
    ])

    print(f"[REGRESSION_GENERATOR] LLaMA generating regression tests...")

    # ── Step 2: LLaMA generates tests ────────────────────────────────────────
    prompt = f"""You are a regression testing expert using Playwright.

    Application: ANPE (Agence Nationale de Protection de l'Environnement) — Tunisia
    Base URL: {base_url}
    Login URL: {base_url}/admin-anpe/login
    Credentials: email=admin@admin.com, password=password1%Aa

Available pages:
{pages_str}

Generate Playwright regression test cases to verify these pages still work correctly.
Return ONLY a valid JSON array. No markdown. No explanation.

Each test case must have this exact structure:
{{
  "id": 1,
  "name": "Descriptive test name",
  "category": "navigation|authentication|content|functionality",
  "severity": "critical|high|medium|low",
  "page": "/dashboard",
  "url": "{base_url}/dashboard",
  "action": "navigate|click|fill|check_visible|check_text",
  "selector": "CSS selector or text",
  "expected": "What should happen",
  "description": "What this test verifies",
  "requires_login": true,
  "priority": "high|medium|low"
}}

STRICT RULES:
- authentication tests MUST be exactly these 2:
    * {{"name": "Verify login page loads", "category": "authentication", "severity": "critical", "page": "/admin-anpe/login", "url": "{base_url}/admin-anpe/login", "action": "navigate", "selector": "", "expected": "Login page loads", "requires_login": false, "priority": "high"}}
    * {{"name": "Verify login form works", "category": "authentication", "severity": "critical", "page": "/admin-anpe/login", "url": "{base_url}/admin-anpe/login", "action": "fill", "selector": "input[type='email']", "expected": "Redirected to dashboard", "requires_login": false, "priority": "high"}}

- navigation tests: one per discovered page, action="navigate", requires_login=true

- content tests MUST be exactly these 3 (check login form elements):
    * {{"name": "Verify email input exists in login", "category": "content", "severity": "critical", "page": "/admin-anpe/login", "url": "{base_url}/admin-anpe/login", "action": "check_visible", "selector": "#basic_email", "expected": "Email input is visible", "requires_login": false, "priority": "high"}}
    * {{"name": "Verify password input exists in login", "category": "content", "severity": "critical", "page": "/admin-anpe/login", "url": "{base_url}/admin-anpe/login", "action": "check_visible", "selector": "#basic_password", "expected": "Password input is visible", "requires_login": false, "priority": "high"}}
    * {{"name": "Verify submit button exists in login", "category": "content", "severity": "critical", "page": "/admin-anpe/login", "url": "{base_url}/admin-anpe/login", "action": "check_visible", "selector": "button[type=submit]", "expected": "Submit button is visible", "requires_login": false, "priority": "high"}}
    * {{"name": "Verify captcha exists in login", "category": "content", "severity": "critical", "page": "/admin-anpe/login", "url": "{base_url}/admin-anpe/login", "action": "check_visible", "selector": "#basic_captcha", "expected": "Captcha is visible", "requires_login": false, "priority": "high"}}
- functionality tests MUST be exactly these 2:
    * {{"name": "Verify submit button is clickable", "category": "functionality", "severity": "critical", "page": "/admin-anpe/login", "url": "{base_url}/admin-anpe/login", "action": "click", "selector": "button[type=submit]", "expected": "Button clicked successfully", "requires_login": false, "priority": "high"}}
    * {{"name": "Verify dashboard content exists", "category": "functionality", "severity": "high", "page": "/dashboard", "url": "{base_url}/dashboard", "action": "check_visible", "selector": "div", "expected": "Dashboard content is visible", "requires_login": true, "priority": "high"}}

Generate 2 authentication + {len(discovered)} navigation + 4 content + 2 functionality = total tests.
Return ONLY the JSON array."""

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a regression testing expert. Return only valid JSON arrays. No markdown."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=4000,
        )

        raw = resp.choices[0].message.content.strip()

        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        test_cases = json.loads(raw)

        cleaned = []
        for i, tc in enumerate(test_cases, 1):
            cleaned.append({
                "id":             i,
                "name":           tc.get("name", f"Regression Test {i}"),
                "category":       tc.get("category", "navigation"),
                "severity":       tc.get("severity", "medium"),
                "page":           tc.get("page", "/dashboard"),
                "url":            tc.get("url", f"{base_url}/dashboard"),
                "action":         tc.get("action", "navigate"),
                "selector":       tc.get("selector", ""),
                "expected":       tc.get("expected", "Page loads successfully"),
                "description":    tc.get("description", ""),
                "requires_login": tc.get("requires_login", True),
                "priority":       tc.get("priority", "medium"),
            })

        print(f"[REGRESSION_GENERATOR] ✓ {len(cleaned)} regression tests generated")

        return {
            "test_cases":        cleaned,
            "total":             len(cleaned),
            "base_url":          base_url,
            "discovered_pages":  discovered,
        }

    except json.JSONDecodeError as e:
        print(f"[REGRESSION_GENERATOR] JSON error: {e} — fallback")
        return _fallback_tests(base_url, discovered)

    except Exception as e:
        print(f"[REGRESSION_GENERATOR] LLaMA error: {e} — fallback")
        return _fallback_tests(base_url, discovered)


def _fallback_tests(base_url: str, discovered: list) -> dict:
    """Fallback static tests"""
    static = [
        {
            "id": 1, "name": "Login page loads",
            "category": "authentication", "severity": "critical",
            "page": "/admin-anpe/login",
            "url": f"{base_url}/admin-anpe/login",
            "action": "navigate", "selector": "input[type='email']",
            "expected": "Login form visible",
            "description": "Login page must load correctly",
            "requires_login": False, "priority": "high",
        },
        {
            "id": 2, "name": "Login with credentials",
            "category": "authentication", "severity": "critical",
            "page": "/admin-anpe/login",
            "url": f"{base_url}/admin-anpe/login",
            "action": "fill", "selector": "input[type='email']",
            "expected": "Redirected to dashboard",
            "description": "Login must work with valid credentials",
            "requires_login": False, "priority": "high",
        },
        {
            "id": 3, "name": "Dashboard loads",
            "category": "navigation", "severity": "high",
            "page": "/dashboard",
            "url": f"{base_url}/dashboard",
            "action": "navigate", "selector": "",
            "expected": "Dashboard page loads",
            "description": "Dashboard must be accessible after login",
            "requires_login": True, "priority": "high",
        },
    ]

    for i, page in enumerate(discovered, 4):
        static.append({
            "id": i,
            "name": f"Page {page['path']} loads",
            "category": "navigation", "severity": "medium",
            "page": page["path"],
            "url": page["url"],
            "action": "navigate", "selector": "",
            "expected": "Page loads without error",
            "description": f"Verify {page['path']} is accessible",
            "requires_login": True, "priority": "medium",
        })

    return {
        "test_cases":       static,
        "total":            len(static),
        "base_url":         base_url,
        "discovered_pages": discovered,
    }