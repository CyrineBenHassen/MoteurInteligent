# security_generator.py — NexTest Security Test Generator (LLaMA + endpoint discovery)

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

# ── Common API paths to probe ────────────────────────────────────────────────
COMMON_PATHS = [
    # Auth
    "/api/v1/auth/login",
    "/api/v1/auth/me",
    "/api/v1/auth/logout",
    # Real endpoints discovered
    "/api/v1/users",
    "/api/v1/roles",
    "/api/v1/dossiers",
    "/api/v1/commissions",
    "/api/v1/auditing",
]


def _discover_endpoints(base_url: str) -> list:
    """
    Probe common paths and return those that respond (not 404).
    """
    discovered = []

    print(f"[SECURITY_GENERATOR] Probing endpoints on {base_url}...")

    for path in COMMON_PATHS:
        url = f"{base_url}{path}"
        try:
            resp = requests.get(
                url,
                headers={},
                verify=False,
                timeout=5,
                allow_redirects=False,
            )
            # Any response except 404 means endpoint exists
            if resp.status_code != 404:
                discovered.append({
                    "path":   path,
                    "url":    url,
                    "status": resp.status_code,
                    "method": "GET",
                })
                print(f"[SECURITY_GENERATOR]   ✓ {path} → {resp.status_code}")
            else:
                print(f"[SECURITY_GENERATOR]   ✗ {path} → 404")

        except Exception as e:
            print(f"[SECURITY_GENERATOR]   ✗ {path} → error: {e}")
            continue

    print(f"[SECURITY_GENERATOR] Discovered {len(discovered)} endpoints")
    return discovered


def generate_security_tests(base_url: str, categories: list = None) -> dict:
    """
    1. Discover available endpoints
    2. LLaMA generates security tests for those endpoints
    """

    if categories is None:
        categories = ["auth", "input_validation", "rate_limiting", "headers"]

    # ── Step 1: Discover endpoints ───────────────────────────────────────────
    discovered = _discover_endpoints(base_url)

    if not discovered:
        print(f"[SECURITY_GENERATOR] No endpoints discovered — using defaults")
        discovered = [
            {"path": "/api/v1/auth/login", "url": f"{base_url}/api/v1/auth/login", "status": 200, "method": "POST"},
            {"path": "/api/v1/auth/me",    "url": f"{base_url}/api/v1/auth/me",    "status": 401, "method": "GET"},
        ]

    # Format for LLaMA
    endpoints_str = "\n".join([
        f"  - {e['method']} {e['path']} (responded with {e['status']})"
        for e in discovered
    ])

    print(f"[SECURITY_GENERATOR] LLaMA generating tests for {len(discovered)} endpoints...")

    # ── Step 2: LLaMA generates tests ────────────────────────────────────────
    prompt = f"""You are a security testing expert.

API Base URL: {base_url}
Login endpoint: POST {base_url}/api/v1/auth/login
Body: {{"email": "user@example.com", "password": "password"}}

Available endpoints (confirmed working):
- GET  {base_url}/api/v1/auth/me       → requires token (returns 500 without token)
- GET  {base_url}/api/v1/users         → requires token (returns 500 without token)
- GET  {base_url}/api/v1/roles         → requires token (returns 500 without token)
- GET  {base_url}/api/v1/dossiers      → requires token (returns 500 without token)
- GET  {base_url}/api/v1/commissions   → requires token (returns 500 without token)
- GET  {base_url}/api/v1/auditing      → requires token (returns 500 without token)
- POST {base_url}/api/v1/auth/login    → public endpoint (returns 422 for invalid input)

Categories to test: {', '.join(categories)}

Return ONLY a valid JSON array. No markdown. No explanation.

Each test case structure:
{{
  "id": 1,
  "name": "Descriptive test name",
  "category": "auth|input_validation|rate_limiting|headers",
  "severity": "critical|high|medium|low",
  "method": "GET|POST",
  "path": "/api/v1/endpoint",
  "url": "{base_url}/api/v1/endpoint",
  "headers": {{}},
  "body": null,
  "expect_status": 401,
  "description": "What this test verifies",
  "repeat": 1,
  "expect_blocked": false,
  "check_headers": [],
  "forbidden_in_response": []
}}

STRICT RULES — follow exactly:

category=auth (generate 4 tests):
  test 1: GET {base_url}/api/v1/auth/me, no headers, expect_status=401, severity=critical
  test 2: GET {base_url}/api/v1/users, no headers, expect_status=401, severity=critical
  test 3: GET {base_url}/api/v1/roles, no headers, expect_status=401, severity=high
  test 4: GET {base_url}/api/v1/dossiers, no headers, expect_status=401, severity=high

category=input_validation (generate 3 tests):
  test 5: POST {base_url}/api/v1/auth/login, body={{"email":"' OR '1'='1","password":"x"}}, expect_status=422, severity=critical
  test 6: POST {base_url}/api/v1/auth/login, body={{"email":"<script>alert(1)</script>@x.com","password":"x"}}, expect_status=422, severity=high
  test 7: POST {base_url}/api/v1/auth/login, body={{}}, expect_status=422, severity=medium

category=rate_limiting (generate 1 test ONLY):
  test 8: POST {base_url}/api/v1/auth/login, body={{"email":"hacker@evil.com","password":"wrongpass"}}, repeat=10, expect_blocked=true, expect_status=[422,429], severity=high

category=headers (generate 2 tests ONLY):
  test 9: GET {base_url}/api/v1/auth/me, no headers, expect_status=[401,500], check_headers=["X-Content-Type-Options","X-Frame-Options"], severity=medium
  test 10: POST {base_url}/api/v1/auth/login, body={{"email":"test@test.com","password":"test"}}, expect_status=[422,401,500], forbidden_in_response=["sql","password","secret","private_key"], severity=medium

Generate exactly these 10 tests in this exact order.
Return ONLY the JSON array."""

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a security testing expert. Return only valid JSON arrays. No markdown, no explanation, no code blocks."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=3000,
        )

        raw = resp.choices[0].message.content.strip()

        # Clean markdown if present
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        test_cases = json.loads(raw)

        # Clean and fix URLs
        cleaned = []
        for i, tc in enumerate(test_cases, 1):
            path = tc.get("path", "/api/v1/auth/me")
            cleaned.append({
                "id":                    i,
                "name":                  tc.get("name", f"Security Test {i}"),
                "category":              tc.get("category", "auth"),
                "severity":              tc.get("severity", "medium"),
                "method":                tc.get("method", "GET"),
                "path":                  path,
                "url":                   f"{base_url}{path}",
                "headers":               tc.get("headers", {}),
                "body":                  tc.get("body", None),
                "expect_status":         tc.get("expect_status", 401),
                "description":           tc.get("description", ""),
                "repeat":                tc.get("repeat", 1),
                "expect_blocked":        tc.get("expect_blocked", False),
                "check_headers":         tc.get("check_headers", []),
                "forbidden_in_response": tc.get("forbidden_in_response", []),
            })

        print(f"[SECURITY_GENERATOR] ✓ {len(cleaned)} security tests generated by LLaMA")

        return {
            "test_cases":          cleaned,
            "total":               len(cleaned),
            "categories":          categories,
            "base_url":            base_url,
            "discovered_endpoints": discovered,
        }

    except json.JSONDecodeError as e:
        print(f"[SECURITY_GENERATOR] JSON parse error: {e} — fallback")
        return _fallback_static_tests(base_url, categories, discovered)

    except Exception as e:
        print(f"[SECURITY_GENERATOR] LLaMA error: {e} — fallback")
        return _fallback_static_tests(base_url, categories, discovered)


def _fallback_static_tests(base_url: str, categories: list, discovered: list = None) -> dict:
    """Fallback to static tests if LLaMA fails"""

    # Use first discovered login endpoint or default
    login_path = "/api/v1/auth/login"
    me_path    = "/api/v1/auth/me"

    if discovered:
        for e in discovered:
            if "login" in e["path"]:
                login_path = e["path"]
            if "/me" in e["path"]:
                me_path = e["path"]

    static = [
        {
            "id": 1, "name": "Access protected endpoint — no token",
            "category": "auth", "severity": "critical",
            "method": "GET", "path": me_path,
            "url": f"{base_url}{me_path}",
            "headers": {}, "body": None, "expect_status": 401,
            "description": "Protected endpoint must reject requests with no token",
            "repeat": 1, "expect_blocked": False,
            "check_headers": [], "forbidden_in_response": [],
        },
        {
            "id": 2, "name": "SQL Injection — login",
            "category": "input_validation", "severity": "critical",
            "method": "POST", "path": login_path,
            "url": f"{base_url}{login_path}",
            "headers": {"Content-Type": "application/json"},
            "body": {"email": "' OR '1'='1", "password": "anything"},
            "expect_status": 422,
            "description": "SQL injection must be blocked",
            "repeat": 1, "expect_blocked": False,
            "check_headers": [], "forbidden_in_response": [],
        },
        {
            "id": 3, "name": "Brute force — 10 requests",
            "category": "rate_limiting", "severity": "high",
            "method": "POST", "path": login_path,
            "url": f"{base_url}{login_path}",
            "headers": {"Content-Type": "application/json"},
            "body": {"email": "admin@test.com", "password": "wrong"},
            "expect_status": [422, 429],
            "description": "Rate limiting should block brute force",
            "repeat": 10, "expect_blocked": True,
            "check_headers": [], "forbidden_in_response": [],
        },
        {
            "id": 4, "name": "Security headers check",
            "category": "headers", "severity": "medium",
            "method": "GET", "path": me_path,
            "url": f"{base_url}{me_path}",
            "headers": {}, "body": None, "expect_status": 401,
            "description": "API should return security headers",
            "repeat": 1, "expect_blocked": False,
            "check_headers": ["X-Content-Type-Options", "X-Frame-Options"],
            "forbidden_in_response": [],
        },
    ]

    filtered = [t for t in static if t["category"] in categories]

    return {
        "test_cases":           filtered,
        "total":                len(filtered),
        "categories":           categories,
        "base_url":             base_url,
        "discovered_endpoints": discovered or [],
    }