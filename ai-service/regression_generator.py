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

DEFAULT_PATHS = [
    "/dashboard", "/login", "/home", "/admin", "/index",
    "/profile", "/settings", "/users", "/reports", "/statistics",
]


def _extract_pages_from_doc(doc_text: str) -> list:
    """Use LLM to extract page paths from documentation"""
    print("[REGRESSION_GENERATOR] Extracting pages from doc_text via LLM...")
    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a path extractor. Extract all page/route paths from the documentation. "
                        "Return ONLY a JSON array of strings like [\"/dashboard\", \"/login\"]. "
                        "No markdown, no explanation, no extra text."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Extract all page/route paths from this documentation:\n\n{doc_text[:3000]}",
                },
            ],
            temperature=0.1,
            max_tokens=500,
        )
        raw = resp.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        paths = json.loads(raw.strip())
        if isinstance(paths, list) and len(paths) > 0:
            print(f"[REGRESSION_GENERATOR] LLM extracted {len(paths)} paths from doc")
            return paths
        raise ValueError("Empty or invalid paths list")
    except Exception as e:
        print(f"[REGRESSION_GENERATOR] Doc extraction error: {e} — using defaults")
        return DEFAULT_PATHS


def _discover_pages(base_url: str, paths: list) -> list:
    """Check which pages actually respond (not 404/500)"""
    discovered = []
    print(f"[REGRESSION_GENERATOR] Probing pages on {base_url}...")

    for path in paths:
        if path.startswith("/api/"):
            print(f"[REGRESSION_GENERATOR]   ⊘ {path} → skipped (API route, not a navigable page)")
            continue

        url = f"{base_url}{path}"
        try:
            resp = requests.get(url, verify=False, timeout=5, allow_redirects=True)
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

    print(f"[REGRESSION_GENERATOR] Discovered {len(discovered)} pages")
    return discovered


def generate_regression_tests(base_url: str, username: str = "", password: str = "", doc_text: str = "") -> dict:
    print(f"[REGRESSION] doc_text received: {doc_text[:100] if doc_text else 'EMPTY'}")

    # Step 1: Get pages from doc or defaults, then probe
    paths = _extract_pages_from_doc(doc_text) if doc_text else DEFAULT_PATHS
    discovered = _discover_pages(base_url, paths)

    if not discovered:
        discovered = [
            {"path": "/dashboard", "url": f"{base_url}/dashboard", "status": 200},
            {"path": "/login",     "url": f"{base_url}/login",     "status": 200},
        ]

    pages_str = "\n".join([
        f"  - {p['path']} (status: {p['status']})"
        for p in discovered
    ])

    # Step 2: Build app context from doc or generic
    if doc_text:
        app_context = f"Application documentation provided by user:\n{doc_text[:1500]}"
    else:
        app_context = f"Generic web application at {base_url}"

    print(f"[REGRESSION_GENERATOR] LLaMA generating regression tests...")

    prompt = f"""You are a regression testing expert using Playwright.

{app_context}

Base URL: {base_url}
Credentials: username={username}, password={password}

Available pages (discovered and responding):
{pages_str}

Generate Playwright regression test cases to verify these pages still work correctly after changes.
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

RULES:
- Generate exactly 2 authentication tests:
    * action="navigate" on the login page, requires_login=false
    * action="check_visible", selector="input[type='password']" on login page, requires_login=false
- Generate 1 navigation test per discovered page (action="navigate", requires_login=true)
- Generate 1 content test per discovered page using ONLY this selector:
    * action="check_visible", selector="body > div", requires_login=true
- Do NOT use main, nav, header, or any invented CSS class selectors

Generate ONLY {len(discovered) * 2 + 2} tests total.
Return ONLY the JSON array."""

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a regression testing expert. Return only valid JSON arrays. No markdown.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
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
            "test_cases":       cleaned,
            "total":            len(cleaned),
            "base_url":         base_url,
            "discovered_pages": discovered,
        }

    except json.JSONDecodeError as e:
        print(f"[REGRESSION_GENERATOR] JSON error: {e} — fallback")
        return _fallback_tests(base_url, discovered)

    except Exception as e:
        print(f"[REGRESSION_GENERATOR] LLaMA error: {e} — fallback")
        return _fallback_tests(base_url, discovered)


def _fallback_tests(base_url: str, discovered: list) -> dict:
    """Generic fallback static tests"""
    static = [
        {
            "id": 1, "name": "Login page loads",
            "category": "authentication", "severity": "critical",
            "page": "/login",
            "url": f"{base_url}/login",
            "action": "navigate", "selector": "",
            "expected": "Login page loads successfully",
            "description": "Login page must be accessible",
            "requires_login": False, "priority": "high",
        },
        {
            "id": 2, "name": "Login form is visible",
            "category": "authentication", "severity": "critical",
            "page": "/login",
            "url": f"{base_url}/login",
            "action": "check_visible", "selector": "input[type='password']",
            "expected": "Password input is visible",
            "description": "Login form elements must be present",
            "requires_login": False, "priority": "high",
        },
        {
            "id": 3, "name": "Dashboard loads after login",
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