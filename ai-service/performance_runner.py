
import subprocess
import tempfile
import os
from dotenv import load_dotenv

load_dotenv()
import time
import re
import requests
from alert_recorder import record_results

# ── k6 binary path ────────────────────────────────────────────────────────────
K6_BINARY = os.getenv("K6_PATH", "k6")

# ── ANPE token ──────────────────────────────────────────────────────────
_CACHED_TOKEN = os.getenv("ANPE_TOKEN", "")
ANPE_BASE_URL = os.getenv("ANPE_BASE_URL", "https://anpe.demopro.tn:10443")

TEST_LABELS = {
    "load":   "Load Test",
    "stress": "Stress Test",
    "spike":  "Spike Test",
    "soak":   "Soak Test",
}


# ── Token refresh ─────────────────────────────────────────────────────────────
def _refresh_token(username: str = "", password: str = "") -> str:
    global _CACHED_TOKEN
    try:
        r = requests.post(
            f"{ANPE_BASE_URL}/api/auth/login",
            json={"email": username, "password": password},
            verify=False,
            timeout=10,
        )
        data = r.json()
        token = data.get("token") or data.get("access_token") or _CACHED_TOKEN
        _CACHED_TOKEN = token
        print(f"[TOKEN] Refreshed: {_CACHED_TOKEN[:30]}...")
    except Exception as e:
        print(f"[TOKEN] Refresh failed: {e} — using cached token")
    return _CACHED_TOKEN


# ── Duration converter ────────────────────────────────────────────────────────
def _to_ms(val_str: str):
    """Convert k6 duration string to milliseconds. Returns float or None."""
    if not val_str or val_str in ("N/A", "None", "null", "0s", ""):
        return None
    val_str = str(val_str).strip()

    m = re.match(r"(\d+)m([\d.]+)s", val_str)
    if m:
        return float(m.group(1)) * 60000 + float(m.group(2)) * 1000

    m = re.match(r"([\d.]+)s$", val_str)
    if m:
        val = float(m.group(1)) * 1000
        return None if val == 0 else val   # 0s = not collected

    m = re.match(r"([\d.]+)ms$", val_str)
    if m:
        return float(m.group(1))

    m = re.match(r"([\d.]+)µs$", val_str)
    if m:
        return float(m.group(1)) / 1000

    return None


# ── k6 output parser ──────────────────────────────────────────────────────────
def _parse_k6_output(stdout: str, stderr: str, test_type: str) -> dict:
    metrics = {
        "http_req_duration_avg":  None,
        "http_req_duration_p90":  None,
        "http_req_duration_p95":  None,
        "http_req_duration_max":  None,
        "http_req_failed_rate":   None,
        "http_reqs_total":        None,
        "http_reqs_per_second":   None,
        "vus_max":                None,
        "iterations":             None,
        "data_received":          None,
        "data_sent":              None,
        "checks_rate":            None,
    }

    output = (stdout or "") + "\n" + (stderr or "")
    print(f"[PERF_RUNNER] raw output sample:\n{output[:3000]}")

    # ── http_req_duration ─────────────────────────────────────────────────────
    dur_match = re.search(
        r"http_req_duration[.\s]+avg=([\d.]+\w+)\s+min=[\d.]+\w+\s+med=[\d.]+\w+\s+max=([\d.]+\w+)\s+p\(90\)=([\d.]+\w+)\s+p\(95\)=([\d.]+\w+)",
        output
    )
    if not dur_match:
        dur_match = re.search(
            r"http_req_duration[.\s:]+avg=([\d.µmsk]+).*?max=([\d.µmsk]+).*?p\(90\)=([\d.µmsk]+).*?p\(95\)=([\d.µmsk]+)",
            output
        )
    if dur_match:
        metrics["http_req_duration_avg"] = dur_match.group(1)
        metrics["http_req_duration_max"] = dur_match.group(2)
        metrics["http_req_duration_p90"] = dur_match.group(3)
        metrics["http_req_duration_p95"] = dur_match.group(4)
        print(f"[PERF_RUNNER] ✓ p95={dur_match.group(4)} avg={dur_match.group(1)}")
    else:
        print(f"[PERF_RUNNER] ✗ http_req_duration NOT parsed")

    # ── http_req_failed ───────────────────────────────────────────────────────
    failed_match = re.search(r"http_req_failed[.\s:]+(\d+\.?\d*)%", output)
    if failed_match:
        metrics["http_req_failed_rate"] = float(failed_match.group(1))
        print(f"[PERF_RUNNER] ✓ failed_rate={failed_match.group(1)}%")
    else:
        print(f"[PERF_RUNNER] ✗ http_req_failed NOT parsed")

    # ── http_reqs ─────────────────────────────────────────────────────────────
    reqs_match = re.search(r"http_reqs[.\s:]+(\d+)\s+([\d.]+)/s", output)
    if reqs_match:
        metrics["http_reqs_total"]      = int(reqs_match.group(1))
        metrics["http_reqs_per_second"] = float(reqs_match.group(2))
        print(f"[PERF_RUNNER] ✓ reqs={reqs_match.group(1)} ({reqs_match.group(2)}/s)")

    # ── vus_max ───────────────────────────────────────────────────────────────
    vus_match = re.search(r"vus_max[.\s:]+(\d+)", output)
    if vus_match:
        metrics["vus_max"] = int(vus_match.group(1))

    # ── iterations ───────────────────────────────────────────────────────────
    iter_match = re.search(r"iterations[.\s:]+(\d+)\s", output)
    if iter_match:
        metrics["iterations"] = int(iter_match.group(1))

    # ── data received / sent ─────────────────────────────────────────────────
    data_rcv = re.search(r"data_received[.\s:]+([0-9.]+ \w+)", output)
    data_snt = re.search(r"data_sent[.\s:]+([0-9.]+ \w+)", output)
    if data_rcv:
        metrics["data_received"] = data_rcv.group(1)
    if data_snt:
        metrics["data_sent"] = data_snt.group(1)

    # ── checks ───────────────────────────────────────────────────────────────
    
    checks_match = re.search(r"checks_succeeded\.+:\s*(\d+\.?\d*)%", output)
    if not checks_match:
        checks_match = re.search(r"checks[.\s:]+(\d+\.?\d*)%", output)
    if checks_match:
        metrics["checks_rate"] = float(checks_match.group(1))
        print(f"[PERF_RUNNER] ✓ checks={checks_match.group(1)}%")
    else:
        print(f"[PERF_RUNNER] ✗ checks NOT parsed")
        
    # ── Thresholds ───────────────────────────────────────────────────────────
    threshold_passes   = [t.strip() for t in re.findall(r"✓\s+(.+)", output)]
    threshold_failures = [t.strip() for t in re.findall(r"✗\s+(.+)", output)]

    # ── Status ───────────────────────────────────────────────────────────────
    p95_ms    = _to_ms(metrics.get("http_req_duration_p95"))
    checks    = metrics.get("checks_rate")
    p95_limit = {"load": 2000, "stress": 5000, "spike": 8000, "soak": 3000}.get(test_type, 3000)

    hard_fail = (
        len(threshold_failures) > 0
        or (p95_ms is not None and p95_ms >= p95_limit)
        or (checks is not None and checks < 95)
    )
    status = "fail" if hard_fail else "pass"
    print(f"[PERF_RUNNER] status={status} p95={p95_ms}ms checks={checks}% th_fails={len(threshold_failures)}")

    return {
        "status":             status,
        "metrics":            metrics,
        "threshold_passes":   threshold_passes,
        "threshold_failures": threshold_failures,
        "raw_output":         output[-3000:],
    }


# ── k6 script executor ────────────────────────────────────────────────────────
def _run_k6_script(script: str, test_type: str, timeout: int = 600) -> dict:
    if not script or len(script) < 50:
        return {
            "status": "error", "metrics": {},
            "threshold_passes": [], "threshold_failures": ["Empty script"],
            "raw_output": "", "duration_seconds": 0, "returncode": -1,
        }

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".js", delete=False,
        prefix=f"nextest_{test_type}_", encoding="utf-8"
    ) as f:
        f.write(script)
        script_path = f.name

    print(f"[PERF_RUNNER] Running {TEST_LABELS.get(test_type, test_type)} → {script_path}")
    start_time = time.time()

    try:
        result = subprocess.run(
            [K6_BINARY, "run", "--insecure-skip-tls-verify", script_path],
            capture_output=True, text=True,
            timeout=timeout, encoding="utf-8", errors="replace",
        )
        print(f"[DEBUG STDOUT]:\n{result.stdout[-2000:]}")
        print(f"[DEBUG STDERR]:\n{result.stderr[-2000:]}")

        elapsed = time.time() - start_time
        print(f"[PERF_RUNNER] ✓ finished in {elapsed:.1f}s rc={result.returncode}")

        parsed = _parse_k6_output(result.stdout, result.stderr, test_type)
        parsed["duration_seconds"] = round(elapsed, 1)
        parsed["returncode"]       = result.returncode
        return parsed

    except subprocess.TimeoutExpired:
        return {
            "status": "fail", "metrics": {},
            "threshold_passes": [],
            "threshold_failures": [f"Timeout after {timeout}s"],
            "raw_output": "TIMEOUT",
            "duration_seconds": round(time.time() - start_time, 1),
            "returncode": -1,
        }
    except FileNotFoundError:
        return {
            "status": "error", "metrics": {},
            "threshold_passes": [],
            "threshold_failures": ["k6 binary not found"],
            "raw_output": "", "duration_seconds": 0, "returncode": -1,
        }
    finally:
        try:
            os.unlink(script_path)
        except Exception:
            pass


# ── Test cases builder ────────────────────────────────────────────────────────
def _build_test_cases(test_type: str, run_result: dict, profile_name: str) -> list:
    metrics      = run_result.get("metrics", {})
    threshold_ms = {"load": 2000, "stress": 5000, "spike": 8000, "soak": 3000}.get(test_type, 3000)
    error_limit  = {"load": 5,    "stress": 15,   "spike": 20,   "soak": 5}.get(test_type, 10)
    cases        = []

    p95_ms = _to_ms(metrics.get("http_req_duration_p95"))
    avg_ms = _to_ms(metrics.get("http_req_duration_avg"))
    max_ms = _to_ms(metrics.get("http_req_duration_max"))

    # 1. p95
    if p95_ms is not None:
        p95_status = "pass" if p95_ms < threshold_ms else "fail"
    else:
        th_failed = any("p(95)" in t or "http_req_duration" in t
                        for t in run_result.get("threshold_failures", []))
        p95_status = "fail" if th_failed else "skip"

    cases.append({"id": 1, "name": f"[{profile_name}] Response Time p95 < {threshold_ms}ms",
                  "category": "performance", "severity": "critical", "status": p95_status,
                  "suite": f"p95={metrics.get('http_req_duration_p95') or 'N/A'} (threshold: {threshold_ms}ms)",
                  "duration": int(p95_ms) if p95_ms else 0, "section": "Response Time"})

    # 2. avg
    cases.append({"id": 2, "name": f"[{profile_name}] Average Response Time",
                  "category": "performance", "severity": "high",
                  "status": "pass" if avg_ms is not None else "skip",
                  "suite": f"avg={metrics.get('http_req_duration_avg') or 'N/A'}",
                  "duration": int(avg_ms) if avg_ms else 0, "section": "Response Time"})

    # 3. max
    cases.append({"id": 3, "name": f"[{profile_name}] Max Response Time",
                  "category": "performance", "severity": "medium",
                  "status": "pass" if max_ms is not None else "skip",
                  "suite": f"max={metrics.get('http_req_duration_max') or 'N/A'}",
                  "duration": int(max_ms) if max_ms else 0, "section": "Response Time"})

    # 4. error rate
    failed_rate = metrics.get("http_req_failed_rate")
    cases.append({"id": 4, "name": f"[{profile_name}] Error Rate < {error_limit}%",
                  "category": "reliability", "severity": "critical",
                  "status": "pass" if (failed_rate is not None and failed_rate < error_limit)
                            else ("skip" if failed_rate is None else "fail"),
                  "suite": f"error_rate={failed_rate:.2f}%" if failed_rate is not None else "N/A",
                  "duration": 0, "section": "Error Rate"})

    # 5. throughput
    rps = metrics.get("http_reqs_per_second")
    cases.append({"id": 5, "name": f"[{profile_name}] Throughput (req/s)",
                  "category": "performance", "severity": "high",
                  "status": "pass" if rps is not None else "skip",
                  "suite": f"{rps:.2f} req/s" if rps is not None else "N/A",
                  "duration": 0, "section": "Throughput"})

    # 6. vus_max
    vus_max = metrics.get("vus_max")
    cases.append({"id": 6, "name": f"[{profile_name}] Max Virtual Users reached",
                  "category": "scalability", "severity": "high",
                  "status": "pass" if vus_max is not None else "skip",
                  "suite": f"max_vus={vus_max}" if vus_max is not None else "N/A",
                  "duration": 0, "section": "Scalability"})

    # 7. checks
    checks = metrics.get("checks_rate")
    cases.append({"id": 7, "name": f"[{profile_name}] k6 Checks Pass Rate > 95%",
                  "category": "reliability", "severity": "high",
                  "status": "pass" if (checks is not None and checks >= 95)
                            else ("fail" if checks is not None else "skip"),
                  "suite": f"checks={checks:.1f}%" if checks is not None else "N/A",
                  "duration": 0, "section": "Reliability"})

    # 8+. threshold passes
    for i, th in enumerate(run_result.get("threshold_passes", []), start=8):
        cases.append({"id": i, "name": f"[{profile_name}] Threshold: {th}",
                      "category": "threshold", "severity": "medium", "status": "pass",
                      "suite": "✓ Passed", "duration": 0, "section": "Thresholds"})

    # N+. threshold failures
    base = 8 + len(run_result.get("threshold_passes", []))
    for i, th in enumerate(run_result.get("threshold_failures", []), start=base):
        cases.append({"id": i, "name": f"[{profile_name}] Threshold: {th}",
                      "category": "threshold", "severity": "critical", "status": "fail",
                      "suite": "✗ Failed", "duration": 0, "section": "Thresholds"})

    return cases


# ── Main entry point ──────────────────────────────────────────────────────────
def run_performance_tests(scripts: dict, base_url: str, username: str = "", password: str = "") -> dict:
    all_test_cases  = []
    all_run_results = {}
    total_pass = total_fail = total_skip = 0
    summary = {}

    for test_type, script_data in scripts.items():
        profile_name = script_data["name"]
        script_code  = script_data["script"]

        print(f"\n[PERF_RUNNER] ══ Starting: {profile_name} ══")

        # ← refresh token avant chaque test type
        _refresh_token(username, password)

        run_result = _run_k6_script(script_code, test_type)
        all_run_results[test_type] = run_result

        test_cases = _build_test_cases(test_type, run_result, profile_name)

        type_pass = type_fail = type_skip = 0
        for tc in test_cases:
            if tc["status"] == "pass":
                total_pass += 1; type_pass += 1
            elif tc["status"] == "fail":
                total_fail += 1; type_fail += 1
            else:
                total_skip += 1; type_skip += 1

        all_test_cases.extend(test_cases)

        summary[test_type] = {
            "status":             run_result["status"],
            "metrics":            run_result["metrics"],
            "threshold_passes":   run_result["threshold_passes"],
            "threshold_failures": run_result["threshold_failures"],
            "duration_seconds":   run_result.get("duration_seconds", 0),
            "pass_count":         type_pass,
            "fail_count":         type_fail,
            "skip_count":         type_skip,
        }

    total     = total_pass + total_fail + total_skip
    pass_rate = round((total_pass / total * 100)) if total > 0 else 0
     
     
     # ── Alerts ────────────────────────────────────────────────────────────────
    gen_id     = all_test_cases[0].get("generation_id") if all_test_cases else None
    project_id = all_test_cases[0].get("project_id")    if all_test_cases else None
    record_results(all_test_cases, base_url, "performance", "k6", gen_id, project_id)
    
    return {
        "results":     all_test_cases,
        "run_results": all_run_results,
        "summary":     summary,
        "pass_count":  total_pass,
        "fail_count":  total_fail,
        "skip_count":  total_skip,
        "pass_rate":   pass_rate,
    }