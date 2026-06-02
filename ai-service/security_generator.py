# security_generator.py — NexTest Security Test Generator
# Tests the FRONTEND via Playwright using JWT token from localStorage
# Target: https://anpe.demopro.tn:10443

import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

# ── Pages disponibles après login ────────────────────────────────────────────
FRONTEND_PAGES = [
    "/dashboard",
    "/statistiques",
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
]

# ── Login page selectors ─────────────────────────────────────────────────────
LOGIN_URL        = "/admin-anpe/login"
EMAIL_SELECTOR   = "input[type='email'], #basic_email, input[name='email']"
PASSWORD_SELECTOR= "input[type='password'], #basic_password, input[name='password']"
SUBMIT_SELECTOR  = "button[type='submit'], .btn-primary, button:has-text('Connexion')"
CAPTCHA_SELECTOR = "#basic_captcha, input[name='captcha']"


def generate_security_tests(base_url: str, categories: list = None) -> dict:
    """
    Generate frontend security tests for ANPE using Playwright + JWT token.
    Tests: auth, xss, session, navigation, headers, info_exposure
    """

    if categories is None:
        categories = ["auth", "xss", "session", "navigation", "headers", "info_exposure"]

    frontend_url = base_url
    # Normalise URL — utilise le frontend pas le backend
    if "back.demopro" in base_url:
        frontend_url = base_url.replace("back.demopro", "demopro").replace(
            "anpe.back", "anpe"
        )

    print(f"[SECURITY_GENERATOR] Frontend URL: {frontend_url}")
    print(f"[SECURITY_GENERATOR] Generating tests for categories: {categories}")

    # ── Générer les tests via Groq ────────────────────────────────────────────
    prompt = f"""You are a security testing expert for web applications.

Target frontend URL: {frontend_url}
Login page: {frontend_url}{LOGIN_URL}
After login, user lands on: {frontend_url}/dashboard

Available pages after login:
{json.dumps(FRONTEND_PAGES, indent=2)}

The app uses JWT stored in localStorage key "token".
Testing framework: Playwright (Python async)
Testing approach: Use stored JWT token to authenticate, then test pages.

Generate exactly 12 security test cases as a JSON array.

Each test case structure:
{{
  "id": 1,
  "name": "Clear descriptive name",
  "category": "auth|xss|session|navigation|headers|info_exposure",
  "severity": "critical|high|medium|low",
  "test_type": "no_token|expired_token|xss_input|direct_nav|header_check|dom_inspect|brute_force|logout",
  "url": "{frontend_url}/page",
  "inject_field": null,
  "inject_value": null,
  "expect": "redirect_to_login|blocked|xss_not_executed|page_loaded|header_present|no_sensitive_data",
  "description": "What this test verifies",
  "check_localStorage": false,
  "check_headers": [],
  "forbidden_in_dom": []
}}

Generate EXACTLY these 12 tests:

category=auth (3 tests):
  1. Access /dashboard WITHOUT token → expect redirect_to_login, severity=critical
  2. Access /reception WITHOUT token → expect redirect_to_login, severity=critical  
  3. Access /dashboard with INVALID token (fake JWT) → expect redirect_to_login, severity=high

category=xss (2 tests):
  4. Inject <script>alert('XSS')</script> in search field "Rechercher par référence" on /reception → expect xss_not_executed, severity=high
  5. Inject <img src=x onerror=alert(1)> in search field on /dashboard → expect xss_not_executed, severity=high

category=session (2 tests):
  6. Check localStorage doesn't expose sensitive user data beyond token → check_localStorage=true, forbidden_in_dom=["password","secret","private_key"], severity=medium
  7. After logout, verify token is cleared from localStorage → expect no_token_after_logout, severity=high

category=navigation (2 tests):
  8. Direct URL access to /reception without being logged in → expect redirect_to_login, severity=high
  9. Direct URL access to /gestion_commission without being logged in → expect redirect_to_login, severity=medium

category=headers (2 tests):
  10. Check /dashboard for security headers X-Content-Type-Options, X-Frame-Options → check_headers=["X-Content-Type-Options","X-Frame-Options"], severity=medium
  11. Check login page {frontend_url}{LOGIN_URL} for security headers → check_headers=["X-Content-Type-Options","Strict-Transport-Security"], severity=medium

category=info_exposure (1 test):
  12. Verify dashboard DOM doesn't expose passwords, API keys, or secrets → forbidden_in_dom=["password","api_key","secret","private_key","token_secret"], severity=high

Return ONLY the JSON array. No markdown. No explanation."""

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a security testing expert. Return only valid JSON arrays. No markdown, no explanation.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=3000,
        )

        raw = resp.choices[0].message.content.strip()

        # Clean markdown
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        test_cases = json.loads(raw)

        # Normalize and clean
        cleaned = []
        for i, tc in enumerate(test_cases, 1):
            cleaned.append({
                "id":               i,
                "name":             tc.get("name", f"Security Test {i}"),
                "category":         tc.get("category", "auth"),
                "severity":         tc.get("severity", "medium"),
                "test_type":        tc.get("test_type", "no_token"),
                "url":              tc.get("url", f"{frontend_url}/dashboard"),
                "inject_field":     tc.get("inject_field"),
                "inject_value":     tc.get("inject_value"),
                "expect":           tc.get("expect", "redirect_to_login"),
                "description":      tc.get("description", ""),
                "check_localStorage": tc.get("check_localStorage", False),
                "check_headers":    tc.get("check_headers", []),
                "forbidden_in_dom": tc.get("forbidden_in_dom", []),
                "frontend_url":     frontend_url,
            })

        print(f"[SECURITY_GENERATOR] ✓ {len(cleaned)} security tests generated")
        return {
            "test_cases":   cleaned,
            "total":        len(cleaned),
            "categories":   categories,
            "base_url":     frontend_url,
            "test_target":  "frontend",
            "framework":    "Playwright",
        }

    except json.JSONDecodeError as e:
        print(f"[SECURITY_GENERATOR] JSON error: {e} — using fallback")
        return _fallback_tests(frontend_url, categories)

    except Exception as e:
        print(f"[SECURITY_GENERATOR] Error: {e} — using fallback")
        return _fallback_tests(frontend_url, categories)


def _fallback_tests(frontend_url: str, categories: list) -> dict:
    """Fallback static tests if Groq fails"""

    tests = [
        {
            "id": 1, "name": "Access dashboard without token",
            "category": "auth", "severity": "critical",
            "test_type": "no_token",
            "url": f"{frontend_url}/dashboard",
            "inject_field": None, "inject_value": None,
            "expect": "redirect_to_login",
            "description": "Dashboard must redirect unauthenticated users to login",
            "check_localStorage": False, "check_headers": [], "forbidden_in_dom": [],
            "frontend_url": frontend_url,
        },
        {
            "id": 2, "name": "Access reception without token",
            "category": "auth", "severity": "critical",
            "test_type": "no_token",
            "url": f"{frontend_url}/reception",
            "inject_field": None, "inject_value": None,
            "expect": "redirect_to_login",
            "description": "Reception page must redirect unauthenticated users",
            "check_localStorage": False, "check_headers": [], "forbidden_in_dom": [],
            "frontend_url": frontend_url,
        },
        {
            "id": 3, "name": "XSS in search field",
            "category": "xss", "severity": "high",
            "test_type": "xss_input",
            "url": f"{frontend_url}/reception",
            "inject_field": "input[placeholder*='Rechercher'], input[type='text']",
            "inject_value": "<script>alert('XSS')</script>",
            "expect": "xss_not_executed",
            "description": "Search field must sanitize XSS input",
            "check_localStorage": False, "check_headers": [], "forbidden_in_dom": [],
            "frontend_url": frontend_url,
        },
        {
            "id": 4, "name": "Session token exposure check",
            "category": "session", "severity": "medium",
            "test_type": "dom_inspect",
            "url": f"{frontend_url}/dashboard",
            "inject_field": None, "inject_value": None,
            "expect": "no_sensitive_data",
            "description": "localStorage must not expose passwords or secrets",
            "check_localStorage": True, "check_headers": [],
            "forbidden_in_dom": ["password", "secret", "private_key"],
            "frontend_url": frontend_url,
        },
        {
            "id": 5, "name": "Security headers on dashboard",
            "category": "headers", "severity": "medium",
            "test_type": "header_check",
            "url": f"{frontend_url}/dashboard",
            "inject_field": None, "inject_value": None,
            "expect": "header_present",
            "description": "Dashboard must return security headers",
            "check_localStorage": False,
            "check_headers": ["X-Content-Type-Options", "X-Frame-Options"],
            "forbidden_in_dom": [],
            "frontend_url": frontend_url,
        },
        {
            "id": 6, "name": "Direct URL access without login",
            "category": "navigation", "severity": "high",
            "test_type": "direct_nav",
            "url": f"{frontend_url}/gestion_commission",
            "inject_field": None, "inject_value": None,
            "expect": "redirect_to_login",
            "description": "Protected routes must redirect to login when not authenticated",
            "check_localStorage": False, "check_headers": [], "forbidden_in_dom": [],
            "frontend_url": frontend_url,
        },
    ]

    filtered = [t for t in tests if t["category"] in categories]

    return {
        "test_cases":   filtered,
        "total":        len(filtered),
        "categories":   categories,
        "base_url":     frontend_url,
        "test_target":  "frontend",
        "framework":    "Playwright",
    }