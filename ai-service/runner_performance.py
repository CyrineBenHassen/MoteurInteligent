# runner_performance.py — NexTest Performance Runner

import time
import subprocess
import tempfile
import os
import json
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

_NAV_TIMEOUT  = 90_000
_WAIT_TIMEOUT = 15_000


def run_performance(url: str) -> dict:
    print(f"[PERF RUNNER] Measuring metrics for {url}")
    t_start = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=1920,1080"],
        )

        context_cold = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )

        page_cold = context_cold.new_page()
        resources = []
        page_cold.on("response", lambda r: resources.append({"url": r.url, "status": r.status}))

        t_nav_start = time.time()
        try:
            page_cold.goto(url, timeout=_NAV_TIMEOUT, wait_until="networkidle")
        except PWTimeout:
            try:
                page_cold.goto(url, timeout=_NAV_TIMEOUT, wait_until="load")
            except PWTimeout:
                try:
                    page_cold.goto(url, timeout=_NAV_TIMEOUT, wait_until="domcontentloaded")
                except Exception as e:
                    browser.close()
                    return _error_metrics(url, str(e))

        t_nav_end = time.time()
        wall_load_time = int((t_nav_end - t_nav_start) * 1000)

        try:
            page_cold.wait_for_load_state("networkidle", timeout=10_000)
        except PWTimeout:
            pass
        page_cold.wait_for_timeout(1000)

        raw_metrics = page_cold.evaluate("""() => {
            const nav = performance.getEntriesByType('navigation')[0] || {};
            const resources = performance.getEntriesByType('resource') || [];
            const paint = performance.getEntriesByType('paint') || [];
            const fcpEntry = paint.find(e => e.name === 'first-contentful-paint');
            const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;
            const loadTime = nav.loadEventEnd ? Math.round(nav.loadEventEnd - nav.fetchStart) : null;
            const tti = nav.domInteractive ? Math.round(nav.domInteractive - nav.fetchStart) : null;
            const lcp_approx = nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd - nav.fetchStart) : null;
            let jsSize = 0, cssSize = 0, imgSize = 0, totalSize = 0;
            let jsCount = 0, cssCount = 0, imgCount = 0;
            resources.forEach(r => {
                const size = r.transferSize || r.encodedBodySize || 0;
                totalSize += size;
                const url = r.name.toLowerCase();
                if (url.includes('.js') || r.initiatorType === 'script') { jsSize += size; jsCount++; }
                else if (url.includes('.css') || r.initiatorType === 'link') { cssSize += size; cssCount++; }
                else if (r.initiatorType === 'img' || url.match(/\\.(png|jpg|jpeg|gif|webp|svg|ico)/i)) { imgSize += size; imgCount++; }
            });
            const domSize = document.querySelectorAll('*').length;
            return {
                load_time_ms: loadTime, fcp_ms: fcp, lcp_ms: lcp_approx, tti_ms: tti,
                ttfb_ms: nav.responseStart ? Math.round(nav.responseStart - nav.fetchStart) : null,
                dns_ms: nav.domainLookupEnd ? Math.round(nav.domainLookupEnd - nav.domainLookupStart) : null,
                connect_ms: nav.connectEnd ? Math.round(nav.connectEnd - nav.connectStart) : null,
                request_count: resources.length, total_size_kb: Math.round(totalSize / 1024),
                js_size_kb: Math.round(jsSize / 1024), css_size_kb: Math.round(cssSize / 1024),
                image_size_kb: Math.round(imgSize / 1024), js_count: jsCount, css_count: cssCount,
                image_count: imgCount, dom_size: domSize,
            };
        }""")

        if not raw_metrics.get("load_time_ms"):
            raw_metrics["load_time_ms"] = wall_load_time

        context_cold.close()
        browser.close()

    total_time = round(time.time() - t_start, 2)
    print(f"[PERF RUNNER] Done in {total_time}s")

    return {"url": url, "measured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "runner_time_s": total_time, **raw_metrics}


def _error_metrics(url: str, error: str) -> dict:
    print(f"[PERF RUNNER] Error measuring {url}: {error}")
    return {
        "url": url, "error": error,
        "load_time_ms": None, "fcp_ms": None, "lcp_ms": None, "tti_ms": None,
        "ttfb_ms": None, "dns_ms": None, "connect_ms": None,
        "request_count": None, "total_size_kb": None,
        "js_size_kb": None, "css_size_kb": None, "image_size_kb": None,
        "js_count": None, "css_count": None, "image_count": None, "dom_size": None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# K6 — Load Test Runner
# ─────────────────────────────────────────────────────────────────────────────

def run_k6_performance(url: str, scraped: dict) -> dict:
    from generator_performance import generate_performance_tests

    print(f"[K6 RUNNER] Generating k6 script for {url}")
    llama_config = generate_performance_tests(scraped, framework="k6")
    k6_script    = llama_config.get("k6_script", _default_k6_script(url))

    tmp_script = None
    tmp_output = None
    k6_raw     = {}

    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write(k6_script)
            tmp_script = f.name

        tmp_output = tmp_script.replace(".js", "_out.json")

        print(f"[K6 RUNNER] Running k6 script: {tmp_script}")
        cmd = ["k6", "run", "--out", f"json={tmp_output}", "--quiet", tmp_script]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        print(f"[K6 RUNNER] stdout: {result.stdout[:300]}")
        if result.returncode != 0:
            print(f"[K6 RUNNER] stderr: {result.stderr[:300]}")

        k6_raw = _parse_k6_json(tmp_output)

    except FileNotFoundError:
        print("[K6 RUNNER] ERROR: k6 not found!")
        k6_raw = {"error": "k6_not_installed"}
    except subprocess.TimeoutExpired:
        print("[K6 RUNNER] ERROR: k6 timeout!")
        k6_raw = {"error": "k6_timeout"}
    except Exception as e:
        print(f"[K6 RUNNER] ERROR: {e}")
        k6_raw = {"error": str(e)}
    finally:
        if tmp_script and os.path.exists(tmp_script):
            os.unlink(tmp_script)
        if tmp_output and os.path.exists(tmp_output):
            os.unlink(tmp_output)

    thresholds = llama_config.get("test_config", {}).get("thresholds", {})
    test_cases = _build_k6_test_cases(k6_raw, thresholds)

    passed = sum(1 for t in test_cases if t["status"] == "pass")
    total  = len(test_cases)
    score  = round((passed / total) * 100) if total > 0 else 0

    score_label = "Excellent" if score >= 90 else "Good" if score >= 75 else "Needs Improvement" if score >= 50 else "Poor"
    score_color = "#10b981" if score >= 90 else "#22c55e" if score >= 75 else "#f59e0b" if score >= 50 else "#ef4444"

    return {
        "test_cases":          test_cases,
        "test_cases_selenium": test_cases,
        "test_cases_cypress":  test_cases,
        "script":              k6_script,
        "script_selenium":     "",
        "script_playwright":   "",
        "script_cypress":      "",
        "test_type":           "performance",
        "performance": {
            "framework":           "k6",
            "global_score":        score,
            "score_label":         score_label,
            "score_color":         score_color,
            "site_type":           llama_config.get("page_type", "web"),
            "site_analysis":       llama_config.get("performance", {}).get("site_analysis", ""),
            "performance_summary": llama_config.get("performance", {}).get("performance_summary", ""),
            "metrics":             k6_raw,
            "recommendations":     llama_config.get("performance", {}).get("recommendations", []),
            "k6_script":           k6_script,
        },
    }


def _parse_k6_json(json_file: str) -> dict:
    """Parse le fichier NDJSON de sortie k6."""
    metrics = {
        "http_req_duration_avg": None,
        "http_req_duration_p95": None,
        "http_req_duration_p99": None,
        "http_req_failed_rate":  None,
        "http_reqs_total":       None,
        "vus_max":               None,
        "iterations":            None,
        "checks_passed_pct":     None,
    }

    if not json_file or not os.path.exists(json_file):
        return metrics

    try:
        data = {}
        with open(json_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("type") == "Point":
                        metric = entry.get("metric", "")
                        value  = entry.get("data", {}).get("value", 0)
                        if metric not in data:
                            data[metric] = []
                        data[metric].append(float(value))
                except Exception:
                    continue

        def avg(lst):
            return round(sum(lst) / len(lst), 2) if lst else None

        def percentile(lst, p):
            if not lst:
                return None
            s = sorted(lst)
            i = max(0, int(len(s) * p / 100) - 1)
            return round(s[i], 2)

        durations = data.get("http_req_duration", [])
        metrics["http_req_duration_avg"] = avg(durations)
        metrics["http_req_duration_p95"] = percentile(durations, 95)
        metrics["http_req_duration_p99"] = percentile(durations, 99)

        failed = data.get("http_req_failed", [])
        metrics["http_req_failed_rate"] = round(
            (sum(failed) / len(failed)) * 100, 2
        ) if failed else 0.0

        reqs = data.get("http_reqs", [])
        metrics["http_reqs_total"] = len(reqs)

        vus = data.get("vus", [])
        metrics["vus_max"] = int(max(vus)) if vus else 0

        iters = data.get("iterations", [])
        metrics["iterations"] = len(iters)

        # ── Checks passed % ──────────────────────────────────────────────────
        checks_total  = data.get("checks", [])
        checks_passed = [v for v in checks_total if v == 1.0]
        metrics["checks_passed_pct"] = round(
            (len(checks_passed) / len(checks_total)) * 100, 1
        ) if checks_total else None

    except Exception as e:
        print(f"[K6 PARSER] Error: {e}")

    return metrics


def _build_k6_test_cases(metrics: dict, thresholds: dict) -> list:
    """Convertit les métriques k6 en test cases pour ExecutionPanel."""
    p95_good  = thresholds.get("http_req_duration_p95_ms", 2000)
    avg_good  = thresholds.get("http_req_duration_avg_ms", 1000)
    fail_good = thresholds.get("http_req_failed_rate", 0.05) * 100

    error = metrics.get("error")

    if error:
        error_messages = {
            "k6_not_installed": "k6 is not installed. Run: winget install k6",
            "k6_timeout":       "k6 test timed out (> 120s)",
        }
        return [{
            "id": 1, "name": "⚠ k6 Execution Error",
            "section": "server", "metric_key": "error",
            "metric_value": None, "metric_good": None, "metric_poor": None, "metric_unit": "",
            "value": error_messages.get(error, error), "status": "fail",
            "suite": error_messages.get(error, error), "duration": "—", "category": "performance",
        }]

    def status(val, good, poor=None):
        if val is None:
            return "skip"
        poor = poor or good * 2
        return "pass" if val <= good else "fail" if val >= poor else "warn"

    avg    = metrics.get("http_req_duration_avg")
    p95    = metrics.get("http_req_duration_p95")
    p99    = metrics.get("http_req_duration_p99")
    fail   = metrics.get("http_req_failed_rate")
    vus    = metrics.get("vus_max")
    iters  = metrics.get("iterations")
    total  = metrics.get("http_reqs_total")
    checks = metrics.get("checks_passed_pct")

    return [
        {
            "id": 1, "name": "⚡ Avg Response Time", "section": "server",
            "metric_key": "http_req_duration_avg", "metric_value": avg,
            "metric_good": avg_good, "metric_poor": avg_good * 3, "metric_unit": "ms",
            "value": f"{avg}ms" if avg else "N/A", "status": status(avg, avg_good),
            "suite": f"Good ≤{avg_good}ms", "duration": "—", "category": "performance",
        },
        {
            "id": 2, "name": "📊 P95 Response Time", "section": "server",
            "metric_key": "http_req_duration_p95", "metric_value": p95,
            "metric_good": p95_good, "metric_poor": p95_good * 2, "metric_unit": "ms",
            "value": f"{p95}ms" if p95 else "N/A", "status": status(p95, p95_good),
            "suite": f"Good ≤{p95_good}ms · 95% of requests", "duration": "—", "category": "performance",
        },
        {
            "id": 3, "name": "📈 P99 Response Time", "section": "server",
            "metric_key": "http_req_duration_p99", "metric_value": p99,
            "metric_good": p95_good * 1.5, "metric_poor": p95_good * 3, "metric_unit": "ms",
            "value": f"{p99}ms" if p99 else "N/A", "status": status(p99, p95_good * 1.5),
            "suite": f"Good ≤{round(p95_good * 1.5)}ms · 99% of requests", "duration": "—", "category": "performance",
        },
        {
            "id": 4, "name": "❌ Error Rate", "section": "server",
            "metric_key": "http_req_failed_rate", "metric_value": fail,
            "metric_good": fail_good, "metric_poor": fail_good * 3, "metric_unit": "%",
            "value": f"{fail}%" if fail is not None else "N/A", "status": status(fail, fail_good),
            "suite": f"Good ≤{fail_good}% error rate", "duration": "—", "category": "performance",
        },
        {
            "id": 5, "name": "✅ Checks Passed", "section": "server",
            "metric_key": "checks_passed_pct", "metric_value": checks,
            "metric_good": 95, "metric_poor": 50, "metric_unit": "%",
            "value": f"{checks}%" if checks is not None else "N/A",
            "status": (
                "pass" if checks is not None and checks >= 95 else
                "fail" if checks is not None and checks < 50 else
                "warn" if checks is not None else
                "skip"
            ),
            "suite": "Good ≥95% checks passing", "duration": "—", "category": "performance",
        },
        {
            "id": 6, "name": "👥 Virtual Users Peak", "section": "load",
            "metric_key": "vus_max", "metric_value": vus,
            "metric_good": 50, "metric_poor": 10, "metric_unit": " users",
            "value": f"{vus} users" if vus else "N/A",
            "status": "pass" if vus and vus >= 40 else "fail",
            "suite": "Peak of 50 virtual users reached", "duration": "—", "category": "performance",
        },
        {
            "id": 7, "name": "🔄 Total Iterations", "section": "load",
            "metric_key": "iterations", "metric_value": iters,
            "metric_good": 100, "metric_poor": 10, "metric_unit": "",
            "value": f"{iters} iterations" if iters else "N/A",
            "status": "pass" if iters and iters >= 50 else "warn",
            "suite": "Total test iterations completed", "duration": "—", "category": "performance",
        },
        {
            "id": 8, "name": "🚀 Total Requests", "section": "load",
            "metric_key": "http_reqs_total", "metric_value": total,
            "metric_good": 500, "metric_poor": 50, "metric_unit": " reqs",
            "value": f"{total} requests" if total else "N/A",
            "status": "pass" if total and total >= 100 else "warn",
            "suite": "Total HTTP requests made during test", "duration": "—", "category": "performance",
        },
    ]


def _default_k6_script(url: str) -> str:
    return f"""import http from 'k6/http';
import {{ sleep, check }} from 'k6';

export const options = {{
  stages: [
    {{ duration: '15s', target: 50 }},
    {{ duration: '30s', target: 50 }},
    {{ duration: '15s', target: 0 }},
  ],
  thresholds: {{
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
  }},
}};

export default function () {{
  const res = http.get('{url}');
  check(res, {{
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000,
  }});
  sleep(1);
}}"""