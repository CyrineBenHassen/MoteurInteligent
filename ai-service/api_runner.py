import requests
import time
import json
import urllib3
import os
from openai import OpenAI
from dotenv import load_dotenv
from alert_recorder import record_results

load_dotenv()

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

_CACHED_TOKEN = os.getenv("ANPE_TOKEN")
print(f"[DEBUG] ANPE_TOKEN loaded: {str(_CACHED_TOKEN)[:30] if _CACHED_TOKEN else 'NONE'}")


def _get_nested(obj: dict, path: str):
    """Navigate nested dict using dot notation e.g. 'data.token'"""
    parts = path.split(".")
    current = obj
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current


def _run_one(tc: dict, token: str) -> dict:
    """
    Execute one API test case.
    Returns result dict with status, duration, reason, assertions.
    """
    method     = tc.get("method", "GET").upper()
    url        = tc.get("url", "")
    body       = tc.get("body")
    skip_auth  = tc.get("skip_auth", False)
    expect     = tc.get("expect_status", 200)
    expect_field = tc.get("expect_field")
    assertions   = tc.get("assertions", [])

    # Build headers
    headers = {
        "Accept": "application/json",
        }
    if not skip_auth and token:
            headers["Authorization"] = f"Bearer {token}"

    use_formdata = tc.get("use_formdata", False)
    # Generate unique email + matricule for create tests
    if body and isinstance(body, dict) and body.get("email", "") == "nextest_new@test.com":
        import time as _t
        ts = int(_t.time())
        unique_email = f"nextest_{ts}@test.com"
        unique_matricule = f"NXT{ts % 100000}"
        body = {**body, "email": unique_email, "matricule": unique_matricule}
        print(f"[API_RUNNER] Generated unique email: {unique_email} | matricule: {unique_matricule}")

    # Execute request
    start = time.time()
    try:
        if use_formdata and body:
            resp = requests.post(url, data=body, headers=headers, verify=False, timeout=15)
        elif method == "POST" and body:
            headers["Content-Type"] = "application/json"
            resp = requests.post(url, json=body, headers=headers, verify=False, timeout=15)
            if "users" in url and resp.status_code != 201:
                print(f"[DEBUG-USER] status={resp.status_code} | body={resp.text[:300]}")
        elif method == "GET":
            headers["Content-Type"] = "application/json"
            resp = requests.get(url, headers=headers, verify=False, timeout=15)
        elif method == "PUT" and body:
            headers["Content-Type"] = "application/json"
            resp = requests.put(url, json=body, headers=headers, verify=False, timeout=15)
        elif method == "DELETE":
            headers["Content-Type"] = "application/json"
            resp = requests.delete(url, headers=headers, verify=False, timeout=15)
        else:
            headers["Content-Type"] = "application/json"
            resp = requests.request(method, url, json=body, headers=headers, verify=False, timeout=15)
    

        duration_ms = round((time.time() - start) * 1000)

        # Parse response
        try:
            resp_json = resp.json()
        except Exception:
            resp_json = {}

        #Check status code
        # For DELETE, accept both 200 and 404 (already deleted by parallel run)
        if method == "DELETE" and resp.status_code == 404:
            status_ok = True
        else:
            status_ok = (resp.status_code == expect)

        #Check expected field
        field_ok = True
        field_msg = ""
        if expect_field and expect_field != "None" and status_ok:
            field_val = _get_nested(resp_json, expect_field)
            if field_val is None:
                field_ok = False
                field_msg = f"Field '{expect_field}' not found in response"

        #Run LLaMA3 assertions
        assertion_results = []
        for assertion in assertions:
            atype    = assertion.get("type", "")
            afield   = assertion.get("field", "")
            aexpect  = assertion.get("expected", "")
            adesc    = assertion.get("description", "")
            critical = assertion.get("critical", False)

            passed = True
            actual = None
            error  = None

            try:
                if atype == "status_code":
                    actual = str(resp.status_code)
                    passed = actual == str(aexpect)

                elif atype == "field_exists":
                    actual = _get_nested(resp_json, afield)
                    passed = actual is not None

                elif atype == "field_value":
                    actual = _get_nested(resp_json, afield)
                    passed = str(actual) == str(aexpect)

                elif atype == "field_type":
                    actual = _get_nested(resp_json, afield)
                    type_map = {"string": str, "int": int, "bool": bool, "list": list, "dict": dict}
                    expected_type = type_map.get(aexpect.lower(), str)
                    passed = isinstance(actual, expected_type)

                elif atype == "response_time":
                    actual = str(duration_ms)
                    threshold = int(aexpect.replace("ms","").replace("<","").strip()) if aexpect else 5000
                    passed = duration_ms < threshold

                elif atype == "header":
                    actual = resp.headers.get(afield, "")
                    passed = bool(actual)

            except Exception as e:
                passed = False
                error  = str(e)

            assertion_results.append({
                "type":        atype,
                "description": adesc,
                "passed":      passed,
                "actual":      str(actual)[:100] if actual is not None else None,
                "expected":    aexpect,
                "critical":    critical,
                "error":       error,
            })

        #Final verdict
        all_ok = status_ok and field_ok

        if all_ok:
            final_status = "pass"
            reason = (
                f"HTTP {resp.status_code} ✓ | "
                f"{duration_ms}ms | "
                + (f"Field '{expect_field}' present ✓" if expect_field else "Response OK")
            )
        else:
            final_status = "fail"
            reasons = []
            if not status_ok:
                reasons.append(f"Expected status {expect}, got {resp.status_code}")
            if not field_ok:
                reasons.append(field_msg)
            reason = " | ".join(reasons) if reasons else "Test failed"

        return {
            "name":              tc.get("name", ""),
            "method":            method,
            "url":               url,
            "status":            final_status,
            "duration":          f"{duration_ms}ms",
            "http_status":       resp.status_code,
            "expected_status":   expect,
            "reason":            reason,
            "reason_pass":       reason if final_status == "pass" else None,
            "error":             reason if final_status == "fail" else None,
            "category":          tc.get("category", "api"),
            "priority":          tc.get("priority", "medium"),
            "section":           "api",
            "suite":             tc.get("suite", ""),
            "assertion_result":  None,
            "step_meta":         {
                "action":   method,
                "selector": url,
                "value":    json.dumps(body, ensure_ascii=False)[:100] if body else "",
            },
            "screenshot":        None,
            "assertions_detail": assertion_results,
            "response_preview":  json.dumps(resp_json, ensure_ascii=False)[:1000] if resp_json else "",
        }

    except requests.exceptions.ConnectionError as e:
        return {
            "name":     tc.get("name", ""),
            "method":   method,
            "url":      url,
            "status":   "fail",
            "duration": "—",
            "error":    f"Connection error: {str(e)[:100]}",
            "reason":   f"Cannot connect to {url}",
            "reason_pass": None,
            "category": tc.get("category", "api"),
            "priority": tc.get("priority", "medium"),
            "section":  "api",
            "suite":    tc.get("suite", ""),
            "assertion_result": None,
            "step_meta": None,
            "screenshot": None,
        }
    except requests.exceptions.Timeout:
        return {
            "name":     tc.get("name", ""),
            "method":   method,
            "url":      url,
            "status":   "fail",
            "duration": "15000ms",
            "error":    "Request timeout after 15s",
            "reason":   "Request timed out",
            "reason_pass": None,
            "category": tc.get("category", "api"),
            "priority": tc.get("priority", "medium"),
            "section":  "api",
            "suite":    tc.get("suite", ""),
            "assertion_result": None,
            "step_meta": None,
            "screenshot": None,
        }
    except Exception as e:
        return {
            "name":     tc.get("name", ""),
            "method":   method,
            "url":      url,
            "status":   "fail",
            "duration": "—",
            "error":    str(e)[:200],
            "reason":   f"Unexpected error: {str(e)[:100]}",
            "reason_pass": None,
            "category": tc.get("category", "api"),
            "priority": tc.get("priority", "medium"),
            "section":  "api",
            "suite":    tc.get("suite", ""),
            "assertion_result": None,
            "step_meta": None,
            "screenshot": None,
        }

def _analyze_failures_with_llama(results: list) -> list:
    failures = results  # analyser tous les tests
    if not failures:
        return results


    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY"),
    )

    failures_summary = [
    {
        "name": r["name"],
        "method": r["method"],
        "url": r["url"],
        "expected_status": r["expected_status"],
        "http_status": r.get("http_status"),
        "status": r.get("status", ""),
        "error": r.get("error", ""),
    }
    for r in failures
]

    try:
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert API QA engineer. Respond ONLY with valid JSON."},
                {"role": "user", "content": f"""Analyze these API test results (pass, fail, and skip):
{json.dumps(failures_summary, indent=2)}

Return ONLY this JSON:
{{
  "analyses": [
    {{
      "test_name": "exact test name",
      "root_cause": "why it passed/failed/skipped — brief explanation",
      "fix": "what to improve or confirm",
      "severity": "critical|high|medium|low"
    }}
  ],
  "summary": "overall assessment"
}}"""},
            ],
            temperature=0.2,
            max_tokens=1000,
        )
        raw = resp.choices[0].message.content.strip()
        for fence in ["```json", "```"]:
            if fence in raw:
                raw = raw.split(fence)[1].split("```")[0].strip()
                break
        analysis = json.loads(raw)
        analyses_map = {a["test_name"]: a for a in analysis.get("analyses", [])}
        for result in results:
            if result["name"] in analyses_map:
                a = analyses_map[result["name"]]
                result["ai_analysis"] = {
                    "root_cause": a.get("root_cause", ""),
                    "fix": a.get("fix", ""),
                    "severity": a.get("severity", "medium"),
                }
        print(f"[API_RUNNER] LLaMA analysis: {analysis.get('summary', '')}")
    except Exception as e:
        print(f"[API_RUNNER] LLaMA analysis failed: {e}")

    return results

def run_api_tests(test_cases: list, token: str = "") -> dict:
    """
    Main entry point — called from main.py /run-api endpoint.
    Runs all API test cases and returns results.
    """
    print(f"[API_RUNNER] Running {len(test_cases)} API tests")
    start_total = time.time()

    results = []
    created_user_id = None

    for i, tc in enumerate(test_cases, 1):
        # Si on a un ID créé, remplace dans l'URL
        if created_user_id:
            tc = dict(tc)
            if "CREATED_ID" in tc.get("url", ""):
                tc["url"] = tc["url"].replace("CREATED_ID", created_user_id)
                tc["path"] = tc.get("path", "").replace("CREATED_ID", created_user_id)

        print(f"[API_RUNNER] [{i}/{len(test_cases)}] {tc.get('method','GET')} {tc.get('url','')}")
        result = _run_one(tc, token)

        # Capture l'ID créé après un POST create
        if tc.get("name") == "Create user" and result["status"] == "pass":
            try:
                resp_data = json.loads(result.get("response_preview", "{}"))
                created_user_id = resp_data.get("data", {}).get("id")
                print(f"[API_RUNNER] Captured created user ID: {created_user_id}")
            except Exception:
                pass

        print(f"[API_RUNNER] [{i}/{len(test_cases)}] {tc.get('method','GET')} {tc.get('url','')}")
        result = _run_one(tc, token)

        # Capture l'ID créé après un POST create
        if tc.get("name") == "Create user" and result["status"] == "pass":
            try:
                preview = result.get("response_preview", "") or ""
                import re
                id_match = re.search(r'"id"\s*:\s*"([a-f0-9\-]{36})"', preview)
                created_user_id = id_match.group(1) if id_match else None
                print(f"[API_RUNNER] Captured created user ID: {created_user_id}")
            except Exception as e:
                print(f"[API_RUNNER] Failed to capture ID: {e}")

        results.append(result)
        print(f"[API_RUNNER]   → {result['status'].upper()} ({result.get('duration','—')})")

    duration_total = round(time.time() - start_total, 2)

    pass_count = sum(1 for r in results if r["status"] == "pass")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    skip_count = sum(1 for r in results if r["status"] == "skip")
    executed   = pass_count + fail_count
    pass_rate  = round(pass_count / executed * 100) if executed else 0

    #LLaMA analyse les failures
    results = _analyze_failures_with_llama(results)

    print(f"[API_RUNNER] DONE | {pass_count} pass / {fail_count} fail | {pass_rate}% | {duration_total}s")

    # ── Alerts ────────────────────────────────────────────────────────────────
    gen_id     = test_cases[0].get("generation_id") if test_cases else None
    project_id = test_cases[0].get("project_id")    if test_cases else None
    base_url   = test_cases[0].get("url", "") if test_cases else ""
    record_results(results, base_url, "api", "Pytest", gen_id, project_id)

    return {
        "results":    results,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "skip_count": skip_count,
        "pass_rate":  pass_rate,
        "total":      len(results),
        "duration_s": duration_total,
        "raw_output": "",
    }