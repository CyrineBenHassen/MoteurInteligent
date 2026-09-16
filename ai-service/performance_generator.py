
import json
import os
import re
import requests
import urllib3
from openai import OpenAI
from dotenv import load_dotenv
import base64

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

groq_client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

_CACHED_TOKEN = os.getenv("ANPE_TOKEN", "")

GENERIC_PAGES = [
    "/dashboard",
    "/login",
    "/home",
    "/profile",
    "/settings",
]

ANPE_ENDPOINTS = [
    {"method": "GET", "path": "/api/statistiques"},
    {"method": "GET", "path": "/api/dossiers"},
    {"method": "GET", "path": "/api/commissions"},
    {"method": "GET", "path": "/api/reunions"},
    {"method": "GET", "path": "/api/user"},
]

TEST_PROFILES = {
    "load": {
        "name": "Load Test",
        "description": "Normal expected load — verify system handles regular traffic",
        "stages": [
            {"duration": "30s", "target": 10},
            {"duration": "1m",  "target": 10},
            {"duration": "15s", "target": 0},
        ],
        "thresholds": {
            "http_req_duration": ["p(95)<2000"],
            "http_req_failed":   ["rate<0.05"],
        },
    },
    "stress": {
        "name": "Stress Test",
        "description": "Beyond normal capacity — find breaking point",
        "stages": [
            {"duration": "30s", "target": 20},
            {"duration": "30s", "target": 40},
            {"duration": "30s", "target": 60},
            {"duration": "30s", "target": 80},
            {"duration": "30s", "target": 0},
        ],
        "thresholds": {
            "http_req_duration": ["p(95)<5000"],
            "http_req_failed":   ["rate<0.15"],
        },
    },
    "spike": {
        "name": "Spike Test",
        "description": "Sudden traffic spike — verify system recovery",
        "stages": [
            {"duration": "10s", "target": 5},
            {"duration": "10s", "target": 100},
            {"duration": "10s", "target": 5},
            {"duration": "10s", "target": 100},
            {"duration": "10s", "target": 0},
        ],
        "thresholds": {
            "http_req_duration": ["p(95)<8000"],
            "http_req_failed":   ["rate<0.20"],
        },
    },
    "soak": {
        "name": "Soak Test",
        "description": "Extended load over time — detect memory leaks and degradation",
        "stages": [
            {"duration": "1m",  "target": 10},
            {"duration": "3m",  "target": 10},
            {"duration": "30s", "target": 0},
        ],
        "thresholds": {
            "http_req_duration": ["p(95)<3000"],
            "http_req_failed":   ["rate<0.05"],
        },
    },
}

def _extract_pages_from_doc(doc_text: str) -> list:
    """Extract page paths from documentation using LLaMA."""
    prompt = f"""Extract all page URLs/paths from this documentation.
Return ONLY a JSON array of path strings, like ["/dashboard", "/login"].
No markdown, no explanation.

Documentation:
{doc_text[:3000]}
"""
    try:
        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = "\n".join(content.split("\n")[1:-1])
        pages = json.loads(content)
        if isinstance(pages, list) and pages:
            print(f"[PERF_GENERATOR] ✓ Extracted {len(pages)} pages from doc")
            return pages
    except Exception as e:
        print(f"[PERF_GENERATOR] ✗ Doc extraction failed: {e}")
    return []
def _probe_pages(base_url: str, auth_header: str = "", pages_to_probe: list = None) -> list:
    if pages_to_probe is None:
        pages_to_probe = GENERIC_PAGES
    available = []
    headers = {"Authorization": auth_header} if auth_header else {}
    for page in pages_to_probe:
        try:
            r = requests.get(
                f"{base_url}{page}",
                headers=headers,
                verify=False,
                timeout=10,
                allow_redirects=True,
            )
            print(f"[PERF_GENERATOR]   ✓ {page} → {r.status_code}")
            available.append(page)
        except Exception as e:
            print(f"[PERF_GENERATOR]   ✗ {page} → {e}")
    return available


def _validate_k6_script(script: str) -> tuple[bool, str]:
    """
    Validate that a k6 script has all required imports and structure.
    Returns (is_valid, error_message)
    """
    if not script or len(script) < 100:
        return False, "Script too short"

    # Check required imports
    if "import http from 'k6/http'" not in script and 'import http from "k6/http"' not in script:
        return False, "Missing: import http from 'k6/http'"

    if "import" not in script or "k6" not in script:
        return False, "Missing k6 imports"

    if "export let options" not in script and "export const options" not in script:
        return False, "Missing: export let options"

    if "export default function" not in script:
        return False, "Missing: export default function"

    if "stages" not in script:
        return False, "Missing: stages in options"

    if "thresholds" not in script:
        return False, "Missing: thresholds in options"

    if "http.get(" not in script and "http.post(" not in script and "http.request(" not in script:
        return False, "Missing: no HTTP requests in script"

    return True, "OK"


def _build_fallback_script(base_url: str, test_type: str, profile: dict, pages: list, auth_header: str = "") -> str:
    """
    Generate a guaranteed-correct k6 script as fallback when LLaMA fails.
    This script is hand-crafted and always valid.
    """
    stages_json = json.dumps(profile["stages"])
    thresholds  = profile["thresholds"]

    # Build thresholds JS object
    th_lines = []
    for metric, rules in thresholds.items():
        rules_str = json.dumps(rules)
        th_lines.append(f'    "{metric}": {rules_str}')
    thresholds_js = "{\n" + ",\n".join(th_lines) + "\n  }"

    # Build pages array (max 5)
    page_list = pages[:5]
    pages_js  = json.dumps([f"{base_url}{p}" for p in page_list])

    script = f"""import http from 'k6/http';
import {{ sleep, check, group }} from 'k6';

export let options = {{
  insecureSkipTLSVerify: true,
  stages: {stages_json},
  thresholds: {thresholds_js},
}};

const BASE_URL = '{base_url}';
const PAGES    = {pages_js};

const HEADERS = {{
  'Authorization': '{auth_header}',
  'Content-Type': 'application/json',
}};

export default function () {{
  console.log('Starting test');

  group('Pages', function () {{
    for (const url of PAGES) {{
      const res = http.get(url, {{ headers: HEADERS }});
      check(res, {{
        'status is 200 or 302': (r) => r.status === 200 || r.status === 302,
        'response time < 3000ms': (r) => r.timings.duration < 3000,
      }});
    }}
  }});

  sleep(Math.random() * 2 + 1);
  console.log('Test iteration completed');
}}
"""
    return script


def generate_k6_script_with_llama(
    base_url: str, test_type: str, profile: dict, pages: list, auth_header: str = ""
) -> str:
    """
    Use LLaMA to generate a k6 script.
    Falls back to hand-crafted script if LLaMA output is invalid.
    """
    pages_str     = "\n".join([f"  - {base_url}{p}" for p in pages])
    endpoints_str = "\n".join([f"  - {e['method']} {base_url}{e['path']}" for e in ANPE_ENDPOINTS])
    stages_str    = json.dumps(profile["stages"], indent=2)
    thresholds_str = json.dumps(profile["thresholds"], indent=2)

    prompt = f"""You are a k6 performance testing expert. Generate a complete k6 JavaScript script.

Base URL: {base_url}
Auth Header: {auth_header}
Test Type: {profile['name']}
Description: {profile['description']}

Pages to test (HTTP GET):
{pages_str}

Test Stages:
{stages_str}

Thresholds:
{thresholds_str}

MANDATORY REQUIREMENTS — the script will be rejected if any of these are missing:

1. FIRST LINE must be: import http from 'k6/http';
2. SECOND LINE must be: import {{ sleep, check, group }} from 'k6';
3. Must have: export let options = {{ insecureSkipTLSVerify: true, stages: [...], thresholds: {{...}} }}
4. Must have: export default function () {{ ... }}
5. Must use: http.get(url, {{ headers: {{ 'Authorization': '{auth_header}' }} }})
6. Must use: check(res, {{ 'status is 200 or 302': (r) => r.status === 200 || r.status === 302 }})
7. Must use: sleep(Math.random() * 2 + 1)
8. Must use group() for organizing requests

RETURN ONLY the JavaScript code. No markdown. No explanation. No code fences.
Start directly with: import http from 'k6/http';"""

    print(f"[PERF_GENERATOR] Generating k6 script for {profile['name']} with LLaMA...")

    try:
        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,   # lower = more deterministic = less hallucination
            max_tokens=4000,
        )

        script = response.choices[0].message.content.strip()

        # Clean markdown fences if present
        if script.startswith("```"):
            lines  = script.split("\n")
            script = "\n".join(lines[1:])
            if script.rstrip().endswith("```"):
                script = "\n".join(script.split("\n")[:-1])
            script = script.strip()

        # Validate the script
        is_valid, error = _validate_k6_script(script)

        if is_valid:
            print(f"[PERF_GENERATOR] ✓ LLaMA script valid ({len(script)} chars)")
            return script
        else:
            print(f"[PERF_GENERATOR] ✗ LLaMA script invalid: {error} — using fallback")
            fallback = _build_fallback_script(base_url, test_type, profile, pages, auth_header)
            print(f"[PERF_GENERATOR] ✓ Fallback script built ({len(fallback)} chars)")
            return fallback

    except Exception as e:
        print(f"[PERF_GENERATOR] ✗ LLaMA call failed: {e} — using fallback")
        return _build_fallback_script(base_url, test_type, profile, pages)


def generate_performance_tests(base_url: str, test_types: list = None, doc_text: str = "",
                                username: str = "", password: str = "") -> dict:
    if test_types is None:
        test_types = ["load", "stress", "spike", "soak"]

    # ANPE = token bearer (comportement historique inchangé)
    # Toute autre app interne (DGAC, etc.) = Basic Auth avec credentials
    if "anpe" in base_url.lower():
        auth_header = f"Bearer {_CACHED_TOKEN}"
        print(f"[PERF_GENERATOR] Auth mode: Bearer (ANPE)")
    elif username and password:
        b64 = base64.b64encode(f"{username}:{password}".encode()).decode()
        auth_header = f"Basic {b64}"
        print(f"[PERF_GENERATOR] Auth mode: Basic ({username})")
    else:
        auth_header = ""
        print(f"[PERF_GENERATOR] Auth mode: none (no credentials provided)")

    pages_to_probe = GENERIC_PAGES
    if doc_text:
        doc_pages = _extract_pages_from_doc(doc_text)
        if doc_pages:
            pages_to_probe = doc_pages

    print(f"[PERF_GENERATOR] Probing pages on {base_url}...")
    pages = _probe_pages(base_url, auth_header, pages_to_probe)
    print(f"[PERF_GENERATOR] {len(pages)} pages available")
    pages = pages[:5]

    scripts = {}
    for test_type in test_types:
        if test_type not in TEST_PROFILES:
            print(f"[PERF_GENERATOR] Unknown test type: {test_type}, skipping")
            continue

        profile = TEST_PROFILES[test_type]
        script  = generate_k6_script_with_llama(base_url, test_type, profile, pages, auth_header)

        is_valid, error = _validate_k6_script(script)
        if not is_valid:
            print(f"[PERF_GENERATOR] ✗ Even fallback failed ({error}) — forcing minimal script")
            script = _build_fallback_script(base_url, test_type, profile, pages, auth_header)

        scripts[test_type] = {
            "name":        profile["name"],
            "description": profile["description"],
            "script":      script,
            "stages":      profile["stages"],
            "thresholds":  profile["thresholds"],
        }
        print(f"[PERF_GENERATOR] ✓ {profile['name']} ready ({len(script)} chars)")

    return {
        "base_url":   base_url,
        "pages":      pages,
        "test_types": test_types,
        "scripts":    scripts,
    }