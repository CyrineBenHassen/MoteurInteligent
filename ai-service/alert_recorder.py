# alert_recorder.py — NexTest shared alert recorder

from dotenv import load_dotenv
load_dotenv()
import os
import requests



NEXTEST_API_URL   = os.getenv("NEXTEST_API_URL",   "http://localhost:8000/api")
NEXTEST_API_TOKEN = os.getenv("NEXTEST_API_TOKEN", "")


def record_results(results: list, base_url: str, test_type: str, framework: str,
                   generation_id: int = None, project_id: int = None):
    """
    Call /flaky-tests/record for each result.
    Triggers alert creation in NexTest when a test changes flakiness status.

    Args:
        results:       list of result dicts with at least 'name' and 'status'
        base_url:      target URL being tested
        test_type:     'functional' | 'regression' | 'security' | 'api' | 'seo' | 'performance' | 'smoke'
        framework:     'Playwright' | 'Selenium' | 'Cypress' | 'Pytest' | 'Requests' | 'k6'
        generation_id: generation ID from NexTest DB
        project_id:    project ID from NexTest DB (optional)
    """
    if not generation_id:
        print(f"[ALERT_RECORDER] ⚠ No generation_id — skipping alert recording")
        return

    if not NEXTEST_API_TOKEN:
        print(f"[ALERT_RECORDER] ⚠ No NEXTEST_API_TOKEN in .env — skipping alert recording")
        return

    headers = {
        "Authorization": f"Bearer {NEXTEST_API_TOKEN}",
        "Accept":        "application/json",
        "Content-Type":  "application/json",
    }

    recorded = 0
    for r in results:
        # Normalize status to pass/fail/skip
        raw_status = r.get("status", "skip")
        if raw_status == "pass":
            status = "pass"
        elif raw_status in ("fail", "error"):
            status = "fail"
        else:
            status = "skip"

        # Skip 'skip' results — not useful for flakiness detection
        if status == "skip":
            continue

        payload = {
            "generation_id": generation_id,
            "project_id":    project_id,
            "url":           r.get("url", base_url),
            "test_type":     test_type,
            "framework":     framework,
            "test_name":     r.get("name", f"test_{recorded}"),
            "status":        status,
        }

        try:
            resp = requests.post(
                f"{NEXTEST_API_URL}/flaky-tests/record",
                json=payload,
                headers=headers,
                timeout=5,
            )
            if resp.status_code == 200:
                recorded += 1
            else:
                print(f"[ALERT_RECORDER] ⚠ {r.get('name','')} → HTTP {resp.status_code}")
        except Exception as e:
            print(f"[ALERT_RECORDER] ⚠ {r.get('name','')} → {e}")

    print(f"[ALERT_RECORDER] ✓ {recorded}/{len(results)} results recorded for alert detection")