import os
from unittest import result
from urllib.request import Request

from fastapi import FastAPI
from scraper import scrape_page
from generator import generate_tests

from analyzer import analyze_error
from runner import run_selenium_script
from runner_selenium import run_selenium_real
from fastapi.responses import Response
from pdf_generator import generate_pdf, generate_performance_xlsx, generate_k6_xlsx
from seo_pdf_generator import generate_seo_pdf
#internal test
from scraper_internal import scrape_internal
from generator_internal import generate_internal_tests
import asyncio
from concurrent.futures import ThreadPoolExecutor

from api_generator import generate_api_tests
from api_runner    import run_api_tests
from api_runner import _CACHED_TOKEN
import threading

from security_generator import generate_security_tests
from security_runner import run_security_tests

from regression_generator import generate_regression_tests
from regression_runner import run_regression_tests

from functional_generator import generate_functional_tests
from functional_runner import run_functional_tests

from performance_generator import generate_performance_tests
from performance_runner import run_performance_tests


from fastapi import Request as FastAPIRequest
from seo_runner import run_seo_test


import json
import asyncio
from fastapi.responses import StreamingResponse

from alert_recorder import record_results

from groq import Groq

#for the chatboot 
from chatbot import router as chatbot_router


from pydantic import BaseModel

from seo_pdf_generator import generate_seo_pdf, generate_seo_xlsx

from internal_api_pdf import generate_internal_api_pdf

from internal_regression_pdf import generate_internal_regression_pdf, generate_internal_regression_xlsx

from internal_functional_pdf import generate_internal_functional_pdf, generate_internal_functional_xlsx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
_groq_client_smoke = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None



def _generate_smoke_summary(results: list, url: str) -> dict:
    """Génère summary + recommendations + action_plan pour les smoke tests,
    au même format que le résultat SEO (ai.summary / ai.recommendations / ai.action_plan)."""
    if not _groq_client_smoke or not results:
        return {}

    fail_lines = []
    for r in results:
        if r.get("status") == "fail":
            detail = r.get("reason") or r.get("suite") or r.get("error") or "—"
            fail_lines.append(f"- {r.get('name','')}: {detail}")

    # ── Cas 100% pass : demander des recommandations PROACTIVES au lieu de [] ──
    if not fail_lines:
        pass_count = sum(1 for r in results if r.get("status") == "pass")
        pass_names = [r.get("name", "") for r in results if r.get("status") == "pass"]
        checks_text = "\n".join(f"- {n}" for n in pass_names)

        prompt = f"""You are a senior QA automation engineer. All {pass_count} smoke checks passed on {url}. No failures to analyze.

Passed checks:
{checks_text}

Since everything passed, suggest 2-3 PROACTIVE improvements a QA engineer should still consider (e.g. edge cases not covered, monitoring gaps, test coverage expansion, performance/security angles not yet tested).

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview confirming all checks passed and overall site health",
  "recommendations": [
    {{"priority": "low|medium", "category": "coverage|performance|security|monitoring", "issue": "gap or opportunity not currently tested", "fix": "concrete suggestion"}}
  ],
  "action_plan": ["optional next step 1", "optional next step 2"]
}}

Rules:
- Max 3 items in recommendations, priority should be low or medium (nothing is broken).
- Be specific to the checks listed above, no generic filler, no markdown fences."""

        try:
            response = _groq_client_smoke.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=800,
            )
            raw = response.choices[0].message.content.strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(raw)
        except Exception as e:
            print(f"[SMOKE AI SUMMARY - proactive] error: {e}")
            return {
                "summary": f"All {pass_count} smoke checks passed on {url}. Critical elements (navigation, content, auth entry points) are all functioning as expected.",
                "recommendations": [],
                "action_plan": [],
            }

    checks_text = "\n".join(fail_lines)
    prompt = f"""You are a senior QA automation engineer. Analyze these FAILED smoke test results for {url}.

Failed checks:
{checks_text}

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview mentioning how many issues were found and overall site health",
  "recommendations": [
    {{"priority": "high|medium|low", "category": "navigation|forms|performance|accessibility|content|security", "issue": "what failed", "fix": "concrete actionable fix"}}
  ],
  "action_plan": [
    {{"priority": "high|medium|low", "category": "Forms|Navigation|Auth|UI|Assertion", "action": "concrete action to take", "impact": "expected result once fixed (e.g. 'Unblocks login flow for all users')", "status": "To Do"}}
  ]
}}

Rules:
- Max 6 items in recommendations, ordered by priority (high first).
- Max 3 items in action_plan.
- Be specific, no generic filler, no markdown fences."""

    try:
        response = _groq_client_smoke.chat.completions.create(
                model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[SMOKE AI SUMMARY] error: {e}")
        return {}
def _generate_project_verdict(project_name: str, tests: int, pass_count: int, fail_count: int, pass_rate: int) -> dict:
    """Verdict IA rapide sur l'app la plus testée — rating 1-5 + texte court."""
    if not _groq_client_smoke:
        return {"rating": None, "text": "AI service unavailable."}

    if pass_rate >= 95:
        forced_rating = 5
    elif pass_rate >= 85:
        forced_rating = 4
    elif pass_rate >= 70:
        forced_rating = 3
    elif pass_rate >= 50:
        forced_rating = 2
    else:
        forced_rating = 1

    rating_word = {5: "excellent", 4: "bon", 3: "correct", 2: "fragile", 1: "critique"}[forced_rating]

    prompt = f"""You are a QA lead reviewing a tested application's stats.

App: {project_name}
Total tests: {tests}
Passed: {pass_count}
Failed: {fail_count}
Pass rate: {pass_rate}%
Rating already decided: {forced_rating}/5 ({rating_word})

Respond ONLY with a valid JSON object:
{{"text": "<one short sentence, max 20 words, in French, describing the result as '{rating_word}' — use that exact word or a close synonym, do not overstate it. Mention the actual numbers and give one concrete tip only if rate is below 95%>"}}"""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=150,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        return {"rating": forced_rating, "text": parsed.get("text", "")}
    except Exception as e:
        print(f"[PROJECT VERDICT AI] error: {e}")
        return {"rating": forced_rating, "text": "Analyse IA indisponible, verdict basé sur le taux de réussite."} 
def _generate_functional_analyses(results: list) -> dict:
    """Root cause + fix — n'analyse que les FAIL (les pass ont un message générique, pas besoin de LLaMA)."""
    if not _groq_client_smoke or not results:
        return {}

    # ── Ne garder que les index des FAIL — évite de saturer le prompt/tokens ──
    fail_indices = [i for i, r in enumerate(results) if r.get("status") == "fail"]
    if not fail_indices:
        return {}

    lines = []
    for i in fail_indices:
        r = results[i]
        meta = r.get("step_meta") or {}
        action = meta.get("action", "—")
        selector = meta.get("selector", "—")
        detail = r.get("reason") or r.get("error") or r.get("reason_skip") or "—"
        lines.append(f"{i}. [FAIL] {r.get('name','')} — action={action} selector={selector} — {detail}")
    checks_text = "\n".join(lines)

    prompt = f"""You are a QA automation expert reviewing FAILED Playwright/Selenium functional test steps.
For each failed test below, write a specific root_cause and fix using the actual data shown.

Respond ONLY with a valid JSON object mapping index (as string) to root_cause and fix.
Example: {{"{fail_indices[0]}": {{"root_cause": "...", "fix": "..."}}}}

Failed Tests:
{checks_text}

Rules:
- CRITICAL: Copy selector/action values EXACTLY as given. Never invent a different selector.
- root_cause = specific problem using the actual selector/action/detail shown.
- fix = concrete actionable step (selector fix, add explicit wait, fix backend validation, etc).
- Max 20 words per sentence. No generic filler like "no action required"."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2500,   # ← augmenté, suffisant même pour ~15-20 fails
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        result = {int(k): v for k, v in parsed.items()}
        print(f"[FUNCTIONAL AI] {len(result)}/{len(fail_indices)} fails analyzed")
        return result
    except Exception as e:
        print(f"[FUNCTIONAL AI] error: {e}")
        return {}


def _generate_functional_summary(results: list, url: str) -> dict:
    """Summary + recommendations + action_plan pour functional — même format que SEO/smoke."""
    if not _groq_client_smoke or not results:
        return {}

    fail_lines = []
    for r in results:
        if r.get("status") == "fail":
            meta = r.get("step_meta") or {}
            action = meta.get("action", "—")
            detail = r.get("reason") or r.get("error") or "—"
            fail_lines.append(f"- {r.get('name','')} ({action}): {detail}")

    # ── Cas 100% pass : recommandations PROACTIVES ──
    if not fail_lines:
        pass_count = sum(1 for r in results if r.get("status") == "pass")
        pass_names = [r.get("name", "") for r in results if r.get("status") == "pass"]
        checks_text = "\n".join(f"- {n}" for n in pass_names)

        prompt = f"""You are a senior QA automation engineer. All {pass_count} functional steps passed on {url}. No failures to analyze.

Passed steps:
{checks_text}

Since everything passed, suggest 2-3 PROACTIVE improvements a QA engineer should still consider (e.g. edge cases not covered, validation gaps, error-state handling not yet tested, accessibility or UX angles not yet tested).

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview confirming all functional steps passed and overall form/navigation health",
  "recommendations": [
    {{"priority": "low|medium", "category": "coverage|validation|accessibility|ux", "issue": "gap or opportunity not currently tested", "fix": "concrete suggestion"}}
  ],
  "action_plan": ["optional next step 1", "optional next step 2"]
}}

Rules:
- Max 3 items in recommendations, priority should be low or medium (nothing is broken).
- Be specific to the steps listed above, no generic filler, no markdown fences."""

        try:
            response = _groq_client_smoke.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=800,
            )
            raw = response.choices[0].message.content.strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(raw)
        except Exception as e:
            print(f"[FUNCTIONAL AI SUMMARY - proactive] error: {e}")
            return {
                "summary": f"All {pass_count} functional steps passed on {url}. Forms, navigation, and interactive elements behave as expected.",
                "recommendations": [],
                "action_plan": [],
            }

    # ── Cas avec échecs ──
    checks_text = "\n".join(fail_lines)
    prompt = f"""You are a senior QA automation engineer. Analyze these FAILED functional test steps for {url}.

Failed steps:
{checks_text}

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview mentioning how many issues were found and overall functional health",
  "recommendations": [
    {{"priority": "high|medium|low", "category": "forms|navigation|auth|ui|assertion", "issue": "what failed", "fix": "concrete actionable fix"}}
  ],
  "action_plan": [
    {{"priority": "high|medium|low", "category": "Forms|Navigation|Auth|UI|Assertion", "action": "concrete action to take", "impact": "expected result once fixed (e.g. 'Unblocks login flow for all users')", "status": "To Do"}}
  ]
}}

Rules:
- Max 6 items in recommendations, ordered by priority (high first).
- Max 3 items in action_plan, each with a specific non-empty "impact" describing what improves once the action is done.
- Be specific, no generic filler, no markdown fences."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[FUNCTIONAL AI SUMMARY] error: {e}")
        return {}
    
def _generate_regression_analyses(results: list) -> dict:
    """Root cause + fix — n'analyse que les FAIL."""
    if not _groq_client_smoke or not results:
        return {}

    fail_indices = [i for i, r in enumerate(results) if r.get("status") == "fail"]
    if not fail_indices:
        return {}

    lines = []
    for i in fail_indices:
        r = results[i]
        detail = r.get("reason") or r.get("error") or "—"
        lines.append(f"{i}. [FAIL] {r.get('name','')} — page={r.get('page','—')} — {detail}")
    checks_text = "\n".join(lines)

    prompt = f"""You are a QA automation expert reviewing FAILED regression test results.
For each failed test below, write a specific root_cause and fix using the actual data shown.

Respond ONLY with a valid JSON object mapping index (as string) to root_cause and fix.
Example: {{"{fail_indices[0]}": {{"root_cause": "...", "fix": "..."}}}}

Failed Tests:
{checks_text}

Rules:
- CRITICAL: Copy page/URL/status values EXACTLY as given. Never invent a different value.
- root_cause = specific problem using the actual page/detail shown.
- fix = concrete actionable step.
- Max 20 words per sentence. No generic filler like "no action required"."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        result = {int(k): v for k, v in parsed.items()}
        print(f"[REGRESSION AI] {len(result)}/{len(fail_indices)} fails analyzed")
        return result
    except Exception as e:
        print(f"[REGRESSION AI] error: {e}")
        return {}


def _generate_regression_summary(results: list, url: str) -> dict:
    """Summary + recommendations + action_plan — même format que SEO/functional."""
    if not _groq_client_smoke or not results:
        return {}

    fail_lines = []
    for r in results:
        if r.get("status") == "fail":
            detail = r.get("reason") or r.get("error") or "—"
            fail_lines.append(f"- {r.get('name','')} ({r.get('page','—')}): {detail}")

    if not fail_lines:
        pass_count = sum(1 for r in results if r.get("status") == "pass")
        return {
            "summary": f"All {pass_count} regression tests passed on {url}. No functionality broke after recent changes.",
            "recommendations": [],
            "action_plan": [],
        }

    checks_text = "\n".join(fail_lines)
    prompt = f"""You are a senior QA automation engineer. Analyze these FAILED regression test results for {url}.

Failed tests:
{checks_text}

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview mentioning how many regressions were found and overall stability",
  "recommendations": [
    {{"priority": "high|medium|low", "category": "navigation|auth|api|content", "issue": "what broke", "fix": "concrete actionable fix"}}
  ],
  "action_plan": ["step 1", "step 2", "step 3"]
}}

Rules:
- Max 6 items in recommendations, ordered by priority (high first).
- Max 3 items in action_plan.
- Be specific, no generic filler, no markdown fences."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[REGRESSION AI SUMMARY] error: {e}")
        return {} 
def _generate_k6_summary(summary: dict, execution_results: list, url: str) -> dict:
    """Summary + recommendations + action_plan pour k6 performance — même format que regression/functional."""
    if not _groq_client_smoke or not summary:
        return {}

    type_lines = []
    for test_type, data in summary.items():
        status  = data.get("status", "N/A")
        metrics = data.get("metrics", {})
        th_fail = data.get("threshold_failures", [])
        line = (
            f"- {test_type.upper()}: status={status}, "
            f"p95={metrics.get('http_req_duration_p95', 'N/A')}, "
            f"error_rate={metrics.get('http_req_failed_rate', 'N/A')}%, "
            f"throughput={metrics.get('http_reqs_per_second', 'N/A')} req/s, "
            f"max_vus={metrics.get('vus_max', 'N/A')}, "
            f"duration={data.get('duration_seconds', 'N/A')}s"
        )
        if th_fail:
            line += f", failed_thresholds=[{', '.join(th_fail)}]"
        type_lines.append(line)

    fail_count = sum(1 for r in execution_results if r.get("status") == "fail")
    pass_count = sum(1 for r in execution_results if r.get("status") == "pass")

    if fail_count == 0:
        checks_text = "\n".join(type_lines)
        prompt = f"""You are a senior performance engineer. All k6 threshold checks passed on {url}. No failures to analyze.

Test type results:
{checks_text}

Since everything passed, suggest 2-3 PROACTIVE improvements a performance engineer should still consider (e.g. higher load ceilings not yet tested, caching/CDN opportunities, monitoring gaps, scalability angles not yet explored).

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview confirming all load/stress/spike/soak tests passed and overall performance health",
  "recommendations": [
    {{"priority": "low|medium", "category": "server|caching|network|scalability", "issue": "opportunity not currently tested", "fix": "concrete suggestion"}}
  ],
  "action_plan": ["optional next step 1", "optional next step 2"]
}}

Rules:
- Max 3 items in recommendations, priority should be low or medium (nothing is broken).
- Be specific to the metrics listed above, no generic filler, no markdown fences."""

        try:
            response = _groq_client_smoke.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=800,
            )
            raw = response.choices[0].message.content.strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(raw)
        except Exception as e:
            print(f"[K6 AI SUMMARY - proactive] error: {e}")
            return {
                "summary": f"All k6 threshold checks passed on {url}. Application handles load, stress, spike and soak scenarios well.",
                "recommendations": [],
                "action_plan": [],
            }

    checks_text = "\n".join(type_lines)
    prompt = f"""You are a senior performance engineer. Analyze these k6 load testing results for {url}. {fail_count} threshold check(s) failed out of {fail_count + pass_count}.

Test type results:
{checks_text}

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview mentioning how many threshold checks failed and overall performance health under load",
  "recommendations": [
    {{"priority": "high|medium|low", "category": "server|caching|network|scalability", "issue": "what failed and at which test type", "fix": "concrete actionable fix"}}
  ],
  "action_plan": ["step 1", "step 2", "step 3"]
}}

Rules:
- Max 6 items in recommendations, ordered by priority (high first).
- Max 3 items in action_plan.
- Reference the actual test type (load/stress/spike/soak) and metric values shown above.
- Be specific, no generic filler, no markdown fences."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[K6 AI SUMMARY] error: {e}")
        return {} 
def _generate_performance_summary(perf_data: dict, execution_results: list, url: str) -> dict:
    """Summary + recommendations + action_plan pour Performance (Playwright) — même format que k6/regression/functional."""
    if not _groq_client_smoke or not perf_data:
        return {}

    metrics = perf_data.get("metrics", {})
    score   = perf_data.get("global_score", 0)
    fail_lines = []
    for r in execution_results:
        if r.get("status") == "fail":
            detail = r.get("description") or r.get("suite") or "—"
            fail_lines.append(f"- {r.get('name','')}: {detail}")

    pass_count = sum(1 for r in execution_results if r.get("status") == "pass")
    fail_count = sum(1 for r in execution_results if r.get("status") == "fail")

    metrics_text = (
        f"Load Time: {metrics.get('load_time_ms')}ms | FCP: {metrics.get('fcp_ms')}ms | "
        f"LCP: {metrics.get('lcp_ms')}ms | TTI: {metrics.get('tti_ms')}ms | "
        f"Requests: {metrics.get('request_count')} | Total Size: {metrics.get('total_size_kb')}KB | "
        f"JS: {metrics.get('js_size_kb')}KB | DOM Elements: {metrics.get('dom_size')}"
    )

    if not fail_lines:
        prompt = f"""You are a senior performance engineer. All {pass_count} performance metrics passed on {url} (score: {score}/100).

Measured metrics:
{metrics_text}

Since everything passed, suggest 2-3 PROACTIVE improvements a performance engineer should still consider (e.g. further optimization opportunities, monitoring gaps, edge cases like slow 3G networks not yet tested).

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview confirming all metrics passed and overall performance health",
  "recommendations": [
    {{"priority": "low|medium", "category": "images|javascript|css|server|caching|network", "issue": "opportunity not currently tested", "fix": "concrete suggestion"}}
  ],
  "action_plan": ["optional next step 1", "optional next step 2"]
}}

Rules:
- Max 3 items in recommendations, priority should be low or medium (nothing is broken).
- Be specific to the metrics listed above, no generic filler, no markdown fences."""
    else:
        checks_text = "\n".join(fail_lines)
        prompt = f"""You are a senior performance engineer. Analyze these FAILED performance metrics for {url} (score: {score}/100, {fail_count} failed out of {pass_count + fail_count}).

Measured metrics:
{metrics_text}

Failed checks:
{checks_text}

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview mentioning how many metrics failed and overall performance health",
  "recommendations": [
    {{"priority": "high|medium|low", "category": "images|javascript|css|server|caching|network", "issue": "what failed", "fix": "concrete actionable fix"}}
  ],
  "action_plan": ["step 1", "step 2", "step 3"]
}}

Rules:
- Max 6 items in recommendations, ordered by priority (high first).
- Max 3 items in action_plan.
- Reference the actual metric values shown above.
- Be specific, no generic filler, no markdown fences."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[PERFORMANCE AI SUMMARY] error: {e}")
        return {}
def _generate_api_summary(results: list, url: str) -> dict:
    """Summary + recommendations + action_plan pour API — même format que regression/functional."""
    if not _groq_client_smoke or not results:
        return {}

    fail_lines = []
    for r in results:
        if r.get("status") == "fail":
            detail = r.get("reason") or r.get("error") or "—"
            fail_lines.append(f"- {r.get('method','')} {r.get('name','')}: {detail}")

    if not fail_lines:
        pass_count = sum(1 for r in results if r.get("status") == "pass")
        return {
            "summary": f"All {pass_count} API tests passed on {url}. All endpoints respond correctly with expected status codes.",
            "recommendations": [],
            "action_plan": [],
        }

    checks_text = "\n".join(fail_lines)
    prompt = f"""You are a senior QA automation engineer. Analyze these FAILED API test results for {url}.

Failed endpoints:
{checks_text}

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview mentioning how many endpoints failed and overall API health",
  "recommendations": [
    {{"priority": "high|medium|low", "category": "auth|validation|crud|performance", "issue": "what failed", "fix": "concrete actionable fix"}}
  ],
  "action_plan": [
    {{"priority": "high|medium|low", "category": "Auth|CRUD|Validation|Error Handling|Performance", "action": "concrete action to take", "impact": "expected result once fixed (e.g. 'Unblocks all authenticated endpoints')", "status": "To Do"}}
  ]
}}

Rules:
- Max 6 items in recommendations, ordered by priority (high first).
- Max 3 items in action_plan, each with a specific non-empty "impact" describing what improves once the action is done.
- Be specific, no generic filler, no markdown fences."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[API AI SUMMARY] error: {e}")
        return {}
    
         
def _generate_smoke_analyses(results: list) -> dict:
    if not _groq_client_smoke or not results:
        return {}

    lines = []
    for i, r in enumerate(results):
        status = "PASS" if r.get("status") == "pass" else ("FAIL" if r.get("status") == "fail" else "SKIP")
        detail = r.get("reason") or r.get("suite") or r.get("error") or r.get("reason_skip") or "—"
        lines.append(f"{i}. [{status}] {r.get('name','')} — {detail}")
    checks_text = "\n".join(lines)

    prompt = f"""You are a QA automation expert. For each smoke test result below, write a specific root_cause and fix using the actual data shown.

Respond ONLY with a valid JSON object mapping index to root_cause and fix.
Example: {{"0": {{"root_cause": "...", "fix": "..."}}}}

Smoke Test Results:
{checks_text}

Rules:
- CRITICAL: Copy numeric values (ms, counts) EXACTLY as given. Never invent a different number.
- PASS: root_cause = mention the actual element/check that succeeded. fix = a tip to keep it robust.
- FAIL: root_cause = specific problem using the actual detail shown. fix = concrete actionable step (selector fix, config change, etc).
- SKIP: root_cause = why the element is optional/absent. fix = whether it needs attention or can stay skipped.
- Max 20 words per sentence. No generic filler like "no action required"."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1500,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        return {int(k): v for k, v in parsed.items()}
    except Exception as e:
        print(f"[SMOKE AI] error: {e}")
        return {}

from runner_performance import run_performance, run_k6_performance

from performance_generator import generate_performance_tests  # ← internal k6


_api_lock = threading.Lock()

executor = ThreadPoolExecutor(max_workers=8)

app = FastAPI(title="NexTest AI Service")
app.include_router(chatbot_router)


def _generate_security_analyses(results: list) -> dict:
    """Root cause + fix — analyse les FAIL et WARN (comme functional/regression)."""
    if not _groq_client_smoke or not results:
        return {}

    target_indices = [i for i, r in enumerate(results) if r.get("status") in ("fail", "warn")]
    if not target_indices:
        return {}

    lines = []
    for i in target_indices:
        r = results[i]
        detail = r.get("reason") or r.get("error") or "—"
        lines.append(f"{i}. [{r.get('status','').upper()}] {r.get('name','')} — category={r.get('category','—')} severity={r.get('severity','—')} — {detail}")
    checks_text = "\n".join(lines)

    prompt = f"""You are a security testing expert reviewing FAILED and WARNING security test results.
For each test below, write a specific root_cause and fix using the actual data shown.

Respond ONLY with a valid JSON object mapping index (as string) to root_cause and fix.
Example: {{"{target_indices[0]}": {{"root_cause": "...", "fix": "..."}}}}

Security Test Results:
{checks_text}

Rules:
- CRITICAL: Copy category/severity/detail values EXACTLY as given. Never invent a different value.
- root_cause = specific security problem using the actual detail shown.
- fix = concrete actionable remediation step.
- Max 20 words per sentence. No generic filler like "no action required"."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        result = {int(k): v for k, v in parsed.items()}
        print(f"[SECURITY AI] {len(result)}/{len(target_indices)} analyzed")
        return result
    except Exception as e:
        print(f"[SECURITY AI] error: {e}")
        return {}


def _generate_security_summary(results: list, url: str) -> dict:
    """Summary + recommendations + action_plan — même format que regression/functional."""
    if not _groq_client_smoke or not results:
        return {}

    issue_lines = []
    for r in results:
        if r.get("status") in ("fail", "warn"):
            detail = r.get("reason") or r.get("error") or "—"
            issue_lines.append(f"- [{r.get('status').upper()}] {r.get('name','')} ({r.get('category','—')}): {detail}")

    if not issue_lines:
        pass_count = sum(1 for r in results if r.get("status") == "pass")
        return {
            "summary": f"All {pass_count} security tests passed on {url}. No vulnerabilities or warnings detected.",
            "recommendations": [],
            "action_plan": [],
        }

    checks_text = "\n".join(issue_lines)
    prompt = f"""You are a senior application security engineer. Analyze these security test results (FAIL/WARN) for {url}.

Findings:
{checks_text}

Respond ONLY with valid JSON in this exact shape, no markdown:
{{
  "summary": "2-3 sentence overview mentioning how many vulnerabilities/warnings were found and overall security posture",
  "recommendations": [
    {{"priority": "high|medium|low", "category": "auth|xss|session|navigation|headers|info_exposure", "issue": "what was found", "fix": "concrete actionable fix"}}
  ],
  "action_plan": ["step 1", "step 2", "step 3"]
}}

Rules:
- Max 6 items in recommendations, ordered by priority (high first).
- Max 3 items in action_plan.
- Be specific, no generic filler, no markdown fences."""

    try:
        response = _groq_client_smoke.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[SECURITY AI SUMMARY] error: {e}")
        return {}
#Doc file
def get_doc_text(data: dict) -> str:
    """Extrait le doc_text si présent, sinon retourne ''"""
    return data.get("doc_text", "").strip()

@app.post("/generate-seo")
async def generate_seo(request: FastAPIRequest):
    body = await request.json()
    url = body.get("url", "")
    result = run_seo_test(url)
    generation_id = body.get("generation_id")
    project_id    = body.get("project_id")
    for tc in result.get("test_cases", []):
        tc["generation_id"] = generation_id
        tc["project_id"]    = project_id
    return {"result": result}

@app.get("/")
def root():
    return {"message": "NexTest AI Service is running — v14 (Performance)"}

#Scarper
@app.post("/scrape")
def scrape(data: dict):
    url       = data.get("url")
    wait_time = data.get("wait_time", 2000)
    if not url:
        return {"error": "URL is required"}
    return scrape_page(url, wait_time=wait_time)

#Generate
@app.post("/generate")
def generate(data: dict):
    print(f"==============================")
    print(f"[MAIN] test_type = {data.get('test_type')}")
    print(f"==============================")
    
    url           = data.get("url")
    framework     = data.get("framework", "Selenium")
    username      = data.get("username")
    password      = data.get("password")
    wait_time     = data.get("wait_time", 2000)
    test_type     = data.get("test_type", "smoke")
    

    user_scenario = data.get("user_scenario", None)
    doc_text = get_doc_text(data)
    print(f"[DEBUG] doc_text length: {len(doc_text)}")

    if not url:
        return {"error": "URL is required"}

    # ── Normalise test_type ──────────────────────────────────────────────────
    valid_test_types = {"smoke", "functional", "regression", "performance"}
    test_type = test_type.lower() if test_type else "smoke"
    if test_type not in valid_test_types:
        test_type = "smoke"

    print(f"[GENERATE] url={url} | framework={framework} | test_type={test_type}")

    # ── Scrape the page ──────────────────────────────────────────────────────
    scraped = scrape_page(url, wait_time=4000)

    if "error" in scraped:
        return {
            "error": f"Cannot scrape this page: {scraped['error']}",
            "scraped": {
                "url": url, "load_time_ms": 0, "is_spa": False,
                "inputs": [], "buttons": [], "forms": [], "selects": [],
                "textareas": [], "checkboxes": [], "nav_links": [],
                "add_to_cart": [], "pagination": [], "modals": [],
                "images": [], "alerts": [], "links": [],
                "lang_switcher": [], "search_bar": [], "images_audit": [],
                "icons": [], "input_fields": [],
            }
        }

    # ── PERFORMANCE : isolé du reste, ne s'exécute QUE si demandé ────────────
    if test_type == "performance":
        print(f"[GENERATE] Performance test | framework={framework} | url={url}")

        if framework == "k6":
            from runner_performance import run_k6_performance
            result = run_k6_performance(url, scraped)
        else:
            from generator_performance import generate_performance_tests as gen_perf_public
            metrics = run_performance(url)
            result  = gen_perf_public(
                scraped,
                framework,
                metrics=metrics,
            )
            ai_summary = _generate_performance_summary(
                result.get("performance", {}),
                result.get("test_cases", []),
                url,
            )
            result["ai"] = ai_summary

        return {
            "url":           url,
            "framework":     framework,
            "test_type":     "performance",
            "user_scenario": "",
            "scraped":       scraped,
            "result":        result,
        }

    # ── SMOKE / FUNCTIONAL / REGRESSION : chemin classique ──────────────────
    result = generate_tests(
        scraped,
        framework,
        username,
        password,
        test_type=test_type,
        user_scenario=user_scenario,
        doc_text=doc_text,
        
    )

    return {
        "url":           url,
        "framework":     framework,
        "test_type":     test_type,
        "user_scenario": user_scenario or "",
        "scraped":       scraped,
        "result":        result,
    }
#Runner
@app.post("/run")
async def run_tests(data: dict):
    script     = data.get("script", "")
    framework = data.get("framework", "selenium")
    test_cases = data.get("test_cases", [])
    test_type  = data.get("test_type", "smoke")

    print(f"[RUN] test_cases={len(test_cases)} | framework={framework} | test_type={test_type}")

    # Performance tests
    if test_type == "performance":
        pass_count = sum(1 for tc in test_cases if tc.get("status") == "pass")
        fail_count = sum(1 for tc in test_cases if tc.get("status") == "fail")
        skip_count = sum(1 for tc in test_cases if tc.get("status") == "skip")
        executed   = pass_count + fail_count
        pass_rate  = round(pass_count / executed * 100) if executed else 0
        return {
            "results":    test_cases,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "skip_count": skip_count,
            "pass_rate":  pass_rate,
            "total":      len(test_cases),
            "duration_s": 0,
            "raw_output": "",
        }

    if not script and not test_cases:
        return {"error": "script or test_cases is required"}

    #Filtrer les pré-calculés
    PRE_CALC_TYPES = {"http_status", "ssl", "performance"}
    pre_calculated = [s for s in test_cases if s.get("type") in PRE_CALC_TYPES and "status" in s]
    to_run         = [s for s in test_cases if s.get("type") not in PRE_CALC_TYPES]

    pre_results = []
    for step in pre_calculated:
        pre_results.append({
            "name":             step.get("name", ""),
            "status":           step.get("status", "fail"),
            "duration":         "0s",
            "error":            None if step.get("status") == "pass" else step.get("suite"),
            "reason":           step.get("suite"),
            "reason_pass":      step.get("suite") if step.get("status") == "pass" else None,
            "reason_skip":      None,
            "assertion_result": None,
            "step_meta":        None,
            "priority":         step.get("priority", "high"),
            "category":         step.get("category", "smoke"),
            "section":          step.get("section", "smoke"),
            "screenshot":       None,
        })

    
    loop = asyncio.get_event_loop()
    if framework.lower() == "selenium":
        run_result = await loop.run_in_executor(
            executor, lambda: run_selenium_real(script, to_run)
        )
    elif framework.lower() == "playwright":
        run_result = await loop.run_in_executor(
            executor, lambda: run_selenium_script(script, to_run)
        )
    else:
        run_result = await loop.run_in_executor(
            executor, lambda: run_selenium_real(script, to_run)
        )

    #Combiner pré-calculés + résultats runner
    all_results = pre_results + run_result.get("results", [])
    
    ai_summary = None 

    if test_type in ("smoke", "functional", "internal_smoke"):
        analyses_fn = _generate_smoke_analyses if test_type == "smoke" else _generate_functional_analyses
        summary_fn  = _generate_smoke_summary  if test_type == "smoke" else _generate_functional_summary

        ai_analyses = await loop.run_in_executor(
            executor, lambda: analyses_fn(all_results)
        )
        for idx, r in enumerate(all_results):
            ai = ai_analyses.get(idx, {})
            severity = "low" if r["status"] == "pass" else (
                "high" if r.get("priority") == "high" else "medium"
            )
            r["ai_analysis"] = {
                "severity":   severity,
                "root_cause": ai.get("root_cause", r.get("reason") or r.get("suite") or "—"),
                "fix":        ai.get("fix", "No action needed." if r["status"] == "pass" else "Investigate this failure."),
            }

        base_url_for_summary = to_run[0].get("base_url", "") if to_run else ""
        ai_summary = await loop.run_in_executor(
            executor, lambda: summary_fn(all_results, base_url_for_summary)
        )
        print(f"[SMOKE AI SUMMARY] recommendations count = {len(ai_summary.get('recommendations', []))}")
        print(f"[SMOKE AI SUMMARY] full content = {json.dumps(ai_summary, indent=2)}")

    pass_count  = sum(1 for r in all_results if r["status"] == "pass")
    fail_count  = sum(1 for r in all_results if r["status"] == "fail")
    skip_count  = sum(1 for r in all_results if r["status"] == "skip")
    total       = len(all_results)
    pass_rate   = round(pass_count / total * 100) if total else 0
    
    
    print(f"[SMOKE AI] ai_summary keys = {list(ai_summary.keys()) if ai_summary else None}")

    return {
        "results":    all_results,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "skip_count": skip_count,
        "pass_rate":  pass_rate,
        "total":      len(all_results),
        "duration_s": run_result.get("duration_s", 0),
        "raw_output": "",
        "ai":         ai_summary, 
        "screenshot": run_result.get("screenshot"),
    }
class ProjectVerdictRequest(BaseModel):
    project_name: str
    tests: int
    pass_count: int
    fail_count: int
    pass_rate: int

@app.post("/project-verdict")
def project_verdict(payload: ProjectVerdictRequest):
    return _generate_project_verdict(
        payload.project_name, payload.tests, payload.pass_count, payload.fail_count, payload.pass_rate
    )
#Analyzer
@app.post("/analyze")
def analyze(data: dict):
    error     = data.get("error")
    script    = data.get("script")
    framework = data.get("framework", "Selenium")

    if not error:
        return {"error": "error message is required"}
    if not script:
        return {"error": "script is required"}

    result = analyze_error(error, script, framework)
    return {"framework": framework, "original_error": error, "analysis": result}


#Rapport
@app.post("/generate-pdf")
def generate_pdf_report(data: dict):
    try:
        print(f"[PDF] Received data keys: {list(data.keys())}")
        print(f"[PDF] test_type: {data.get('test_type')}")
        print(f"[PDF] test_cases count: {len(data.get('test_cases', []))}")
        print(f"[PDF] execution_results count: {len(data.get('execution_results', []))}")
        
        test_type = data.get('test_type', '')
        if test_type == 'seo':
            pdf_bytes = generate_seo_pdf(data)
        elif test_type == 'internal_smoke':
            from internal_smoke_pdf import generate_internal_smoke_pdf
            pdf_bytes = generate_internal_smoke_pdf(data)
        elif test_type in ('regression', 'internal_regression'):
                pdf_bytes = generate_internal_regression_pdf(data)
        elif test_type == 'functional':                     
            pdf_bytes = generate_internal_functional_pdf(data)
        else:
            pdf_bytes = generate_pdf(data)
        
        print(f"[PDF] Generated {len(pdf_bytes)} bytes")
        
        if len(pdf_bytes) < 100:
            print(f"[PDF] WARNING — too small, content: {pdf_bytes}")
            return {"error": f"PDF too small: {pdf_bytes}"}
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=nextest_report.pdf"}
        )
    except Exception as e:
        import traceback
        print(f"[PDF] ERROR: {e}")
        traceback.print_exc() 
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
    
#Rapport XLSX — Smoke
@app.post("/generate-smoke-xlsx")
def generate_smoke_xlsx_report(data: dict):
    try:
        print(f"[XLSX-SMOKE] Received data keys: {list(data.keys())}")

        tests   = data.get('execution_results') or data.get('test_cases') or []
        ai_data = data.get('ai', {}) or {}

        from pdf_generator import generate_smoke_xlsx
        xlsx_bytes = generate_smoke_xlsx(data, tests, ai_data)

        print(f"[XLSX-SMOKE] Generated {len(xlsx_bytes)} bytes")

        if len(xlsx_bytes) < 100:
            return {"error": f"XLSX too small: {xlsx_bytes}"}

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_smoke_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-SMOKE] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
@app.post("/generate-internal-functional-xlsx")
def generate_internal_functional_xlsx_report(data: dict):
    try:
        print(f"[XLSX-INTERNAL-FUNCTIONAL] Received data keys: {list(data.keys())}")
        xlsx_bytes = generate_internal_functional_xlsx(data)
        print(f"[XLSX-INTERNAL-FUNCTIONAL] Generated {len(xlsx_bytes)} bytes")
        if len(xlsx_bytes) < 100:
            return {"error": f"XLSX too small: {xlsx_bytes}"}
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_internal_functional_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-INTERNAL-FUNCTIONAL] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
#Rapport XLSX — Security
@app.post("/generate-security-xlsx")
def generate_security_xlsx_report(data: dict):
    try:
        print(f"[XLSX-SECURITY] Received data keys: {list(data.keys())}")

        tests = data.get('execution_results') or data.get('test_cases') or []
        data['_groq_recs'] = data.get('ai', {}) or {}

        from pdf_generator import generate_security_xlsx
        xlsx_bytes = generate_security_xlsx(data, tests)

        print(f"[XLSX-SECURITY] Generated {len(xlsx_bytes)} bytes")

        if len(xlsx_bytes) < 100:
            return {"error": f"XLSX too small: {xlsx_bytes}"}

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_security_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-SECURITY] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}    
#Rapport XLSX — Internal Smoke
@app.post("/generate-internal-smoke-xlsx")
def generate_internal_smoke_xlsx_report(data: dict):
    try:
        print(f"[XLSX-INTERNAL-SMOKE] Received data keys: {list(data.keys())}")

        from internal_smoke_pdf import generate_internal_smoke_xlsx
        xlsx_bytes = generate_internal_smoke_xlsx(data)

        print(f"[XLSX-INTERNAL-SMOKE] Generated {len(xlsx_bytes)} bytes")

        if len(xlsx_bytes) < 100:
            return {"error": f"XLSX too small: {xlsx_bytes}"}

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_internal_smoke_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-INTERNAL-SMOKE] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.post("/generate-internal-api-pdf")
def generate_internal_api_pdf_report(data: dict):
    try:
        print(f"[PDF-INTERNAL-API] Received data keys: {list(data.keys())}")

        pdf_bytes = generate_internal_api_pdf(data)

        print(f"[PDF-INTERNAL-API] Generated {len(pdf_bytes)} bytes")

        if len(pdf_bytes) < 100:
            print(f"[PDF-INTERNAL-API] WARNING — too small, content: {pdf_bytes}")
            return {"error": f"PDF too small: {pdf_bytes}"}

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=nextest_internal_api_report.pdf"}
        )
    except Exception as e:
        import traceback
        print(f"[PDF-INTERNAL-API] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
    
@app.post("/generate-internal-api-xlsx")
def generate_internal_api_xlsx_report(data: dict):
    try:
        print(f"[XLSX-INTERNAL-API] Received data keys: {list(data.keys())}")

        from internal_api_pdf import generate_internal_api_xlsx
        xlsx_bytes = generate_internal_api_xlsx(data)

        print(f"[XLSX-INTERNAL-API] Generated {len(xlsx_bytes)} bytes")

        if len(xlsx_bytes) < 100:
            return {"error": f"XLSX too small: {xlsx_bytes}"}

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_internal_api_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-INTERNAL-API] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
@app.post("/generate-internal-regression-pdf")
def generate_internal_regression_pdf_report(data: dict):
    try:
        print(f"[PDF-INTERNAL-REGRESSION] Received data keys: {list(data.keys())}")
        pdf_bytes = generate_internal_regression_pdf(data)
        print(f"[PDF-INTERNAL-REGRESSION] Generated {len(pdf_bytes)} bytes")
        if len(pdf_bytes) < 100:
            return {"error": f"PDF too small: {pdf_bytes}"}
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=nextest_internal_regression_report.pdf"}
        )
    except Exception as e:
        import traceback
        print(f"[PDF-INTERNAL-REGRESSION] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.post("/generate-internal-regression-xlsx")
def generate_internal_regression_xlsx_report(data: dict):
    try:
        print(f"[XLSX-INTERNAL-REGRESSION] Received data keys: {list(data.keys())}")
        xlsx_bytes = generate_internal_regression_xlsx(data)
        print(f"[XLSX-INTERNAL-REGRESSION] Generated {len(xlsx_bytes)} bytes")
        if len(xlsx_bytes) < 100:
            return {"error": f"XLSX too small: {xlsx_bytes}"}
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_internal_regression_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-INTERNAL-REGRESSION] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
#Rapport XLSX
@app.post("/generate-seo-xlsx")
def generate_seo_xlsx_report(data: dict):
    try:
        print(f"[XLSX] Received data keys: {list(data.keys())}")

        from seo_pdf_generator import generate_seo_xlsx
        xlsx_bytes = generate_seo_xlsx(data)

        print(f"[XLSX] Generated {len(xlsx_bytes)} bytes")

        if len(xlsx_bytes) < 100:
            print(f"[XLSX] WARNING — too small, content: {xlsx_bytes}")
            return {"error": f"XLSX too small: {xlsx_bytes}"}

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_seo_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
#Rapport XLSX — Performance
@app.post("/generate-performance-xlsx")
def generate_performance_xlsx_report(data: dict):
    

    try:
        print(f"[XLSX-PERF] Received data keys: {list(data.keys())}")

        tests     = data.get('execution_results') or data.get('test_cases') or []
        perf_data = data.get('performance', {}) or {}
        ai_data   = data.get('ai', {}) or {}

        xlsx_bytes = generate_performance_xlsx(data, tests, perf_data, ai_data)

        print(f"[XLSX-PERF] Generated {len(xlsx_bytes)} bytes")

        if len(xlsx_bytes) < 100:
            print(f"[XLSX-PERF] WARNING — too small, content: {xlsx_bytes}")
            return {"error": f"XLSX too small: {xlsx_bytes}"}

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_performance_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-PERF] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
#Rapport XLSX — k6 Performance
@app.post("/generate-k6-xlsx")
def generate_k6_xlsx_report(data: dict):
    try:
        print(f"[XLSX-K6] Received data keys: {list(data.keys())}")

        tests   = data.get('execution_results') or data.get('test_cases') or []
        summary = data.get('summary') or {}

        xlsx_bytes = generate_k6_xlsx(data, tests, summary)

        print(f"[XLSX-K6] Generated {len(xlsx_bytes)} bytes")

        if len(xlsx_bytes) < 100:
            print(f"[XLSX-K6] WARNING — too small, content: {xlsx_bytes}")
            return {"error": f"XLSX too small: {xlsx_bytes}"}

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=nextest_k6_performance_report.xlsx"}
        )
    except Exception as e:
        import traceback
        print(f"[XLSX-K6] ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}
#Generate interne
@app.post("/generate-internal")
def generate_internal(data: dict):

    url          = data.get("url")
    framework    = data.get("framework", "playwright")
    test_type    = data.get("test_type", "smoke").lower()
    cookies      = data.get("cookies", None)   
    token        = data.get("token", None)
    username     = data.get("username", None)
    password     = data.get("password", None)
    login_url    = data.get("login_url", None)
    scrape_login = data.get("scrape_login", False)
    doc_text = get_doc_text(data)
    wait_time    = data.get("wait_time", 2000)

    print(f"[INTERNAL] url={url} | test_type={test_type} | "
          f"scrape_login={scrape_login} | has_cookies={bool(cookies)} | "
          f"has_credentials={bool(username)}")

    if not url:
        return {"error": "URL is required"}

    #1. Scrape
    scraped = scrape_internal(
        target_url   = url,
        cookies      = cookies,
        token        = token,
        username     = username,
        password     = password,
        login_url    = login_url,
        scrape_login = scrape_login,
        wait_time    = wait_time,
    )
    print(f"[INTERNAL] scraped is_login={scraped.get('is_login_page')} | is_dashboard={scraped.get('is_dashboard')} | url={scraped.get('url')}")
    print(f"[INTERNAL] sidebar_items={len(scraped.get('sidebar_items', []))} | stat_cards={len(scraped.get('stat_cards', []))} | headings={len(scraped.get('headings', []))}")

    # ── Login échoué (credentials invalides OU captcha sans fallback token) ────
    login_result = scraped.get("login_result")
    if login_result and not login_result.get("success", True):
        error_code = "captcha_blocked" if login_result.get("captcha_blocked") else "login_failed"
        return {
            "error":         error_code,
            "error_message": login_result.get("error_message", "Login failed"),
            "url":           url,
            "scraped":       scraped,
        }

    # ── Erreur de scraping classique (page injoignable, timeout, etc.) ─────────
    if "error" in scraped:
        return {
            "error":   f"Scraping failed: {scraped['error']}",
            "url":     url,
            "scraped": scraped,
        }

    # ── 2. Generate tests ────────────────────────────────────────────────────
    # Pour l'instant : smoke uniquement
    # Tu pourras ajouter functional, security, etc. plus tard
    VALID_TYPES = {"smoke", "functional", "regression", "security",
                   "e2e", "api", "performance", "negative"}

    if test_type not in VALID_TYPES:
        test_type = "smoke"

    result = generate_internal_tests(
        scraped   = scraped,
        framework = framework,
        doc_text  = doc_text,
        username  = username,
        password  = password,
        login_url = login_url,
    )

    return {
        "url":        url,
        "framework":  framework,
        "test_type":  result.get("test_type", test_type),  
        "scraped":    scraped,
        "result":     result,
    }
    
@app.post("/generate-api")
def generate_api(data: dict):
    if not _api_lock.acquire(blocking=False):
        return {"error": "Request already in progress"}
    try:
        url       = data.get("url", "")
        framework = data.get("framework", "Pytest")
        token     = data.get("token", "")
        print(f"[DEBUG] token from frontend: '{token[:20] if token else 'EMPTY'}'")
        domains   = data.get("domains", ["auth"])
        username  = data.get("username", "")
        password  = data.get("password", "")
        doc_text  = get_doc_text(data) 

        if not url:
            return {"error": "URL is required"}

        base_api_url = data.get("base_api_url", "")
        if not base_api_url:
            if "demopro.tn" in url:
                base_api_url = "https://anpe.back.demopro.tn:10443"
            else:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                base_api_url = f"{parsed.scheme}://{parsed.netloc}"

        print(f"[GENERATE-API] base_api_url={base_api_url} | framework={framework} | domains={domains}")
        doc_text = get_doc_text(data)
        # ── 1. Generate test cases ──
        result = generate_api_tests(
            base_url     = base_api_url,
            framework    = framework,
            token        = token,
            domains      = domains,
            original_url = url,
            username     = data.get("username", ""),
            password     = data.get("password", ""),
            doc_text     = doc_text,
        )

        if not result:
            return {"error": "generate_api_tests returned None"}
        if "error" in result:
            return {"error": result["error"]}

        # ── 2. Use cached token as fallback ──
        jwt_token = token if token else _CACHED_TOKEN
        print(f"[GENERATE-API] Using token: {'frontend' if token else 'cached'}")

        # ── 3. Run tests ──
        test_cases = result.get("test_cases", [])
        generation_id = data.get("generation_id")
        project_id    = data.get("project_id")
        for tc in test_cases:
            tc["generation_id"] = generation_id
            tc["project_id"]    = project_id
        run_result = run_api_tests(
            test_cases,
            jwt_token,
            username=username,
            password=password,
            base_url=base_api_url,
            )

        execution_results = run_result.get("results", [])

        # ── AI summary global (comme regression/functional) ───────────────────
        ai_summary = _generate_api_summary(execution_results, url)

        record_results(
    results=execution_results,
    base_url=url,
    test_type="api",
    framework=framework,
    generation_id=generation_id,
    project_id=project_id,
)

        return {
            "url":       url,
            "framework": framework,
            "test_type": "api",
            "scraped":   {"url": url, "load_time_ms": 0},
            "result": {
                **result,
                "test_cases":        execution_results,
                "execution_results": execution_results,
                "pass_count":        run_result["pass_count"],
                "fail_count":        run_result["fail_count"],
                "skip_count":        run_result["skip_count"],
                "pass_rate":         run_result["pass_rate"],
                "ai":                ai_summary,
            },
        }
    finally:
        _api_lock.release()
        
        
@app.post("/generate-security")
def generate_security(data: dict):
    url        = data.get("url", "")
    token      = data.get("token", "")
    categories = data.get("categories", None)
    framework  = data.get("framework", "Pytest")
    username   = data.get("username", "")
    password   = data.get("password", "")
    print(f"[SECURITY DEBUG] username='{username}' | password={'set' if password else 'EMPTY'}")


    if not url:
        return {"error": "URL is required"}

    # ── Extraire le frontend URL proprement ──────────────────────────────────
    frontend_url = url
    for suffix in ["/admin-anpe/login", "/admin-anpe", "/dashboard",
                   "/reception", "/statistiques", "/outbox"]:
        if suffix in frontend_url:
            frontend_url = frontend_url.split(suffix)[0]
            break

    # S'assurer qu'on teste bien le frontend et pas le backend
    if "back.demopro" in frontend_url:
        frontend_url = frontend_url.replace("anpe.back.demopro", "anpe.demopro")

    print(f"[SECURITY] frontend_url={frontend_url} | framework={framework} | categories={categories}")

    # ── 1. Générer les tests cases via Groq ──────────────────────────────────
    doc_text = get_doc_text(data)
    gen_result = generate_security_tests(
        base_url   = frontend_url,
        categories = categories,
        doc_text   = doc_text,
        username   = username,
        password   = password,
    )

    test_cases = gen_result.get("test_cases", [])
    print(f"[SECURITY] Generated {len(test_cases)} test cases")

    if not test_cases:
        return {"error": "No security test cases generated"}

    # ── 2. Exécuter les tests avec le token ──────────────────────────────────
    from security_runner import _CACHED_TOKEN
    jwt_token = token if token else (_CACHED_TOKEN if not (username and password) else "")

    generation_id = data.get("generation_id")
    project_id    = data.get("project_id")
    for tc in test_cases:
        tc["generation_id"] = generation_id
        tc["project_id"]    = project_id
    run_result = run_security_tests(test_cases, jwt_token, username=username, password=password)
    execution_results = run_result.get("results", [])
    ai_analyses = _generate_security_analyses(execution_results)
    for idx, r in enumerate(execution_results):
        ai = ai_analyses.get(idx, {})
        severity = "low" if r["status"] == "pass" else ("high" if r.get("severity") in ("critical", "high") else "medium")
        r["ai_analysis"] = {
            "severity":   severity,
            "root_cause": ai.get("root_cause", r.get("reason") or "—"),
            "fix":        ai.get("fix", "No action needed." if r["status"] == "pass" else "Investigate this finding."),
        }

    ai_summary = _generate_security_summary(execution_results, url)
    pass_count = run_result["pass_count"]
    fail_count = run_result["fail_count"]
    warn_count = run_result.get("warn_count", 0)
    skip_count = warn_count   # warn → affiché comme skip dans le frontend
    pass_rate  = run_result["pass_rate"]

    print(f"[SECURITY] DONE | {pass_count} pass / {warn_count} warn / {fail_count} fail | {pass_rate}%")
    
    record_results(
    results=execution_results,
    base_url=url,
    test_type="security",
    framework="Pytest",
    generation_id=generation_id,
    project_id=project_id,
)

    return {
        "url":       url,
        "framework": framework,   # "Pytest" — cohérent avec le frontend
        "test_type": "security",
        "scraped":   {
            "url":          frontend_url,
            "load_time_ms": 0,
            "_is_security": True,
        },
        "result": {
            **gen_result,
            "test_cases":        execution_results,
            "execution_results": execution_results,
            "pass_count":        pass_count,
            "fail_count":        fail_count,
            "skip_count":        skip_count,
            "pass_rate":         pass_rate,
            "test_type":         "security",
            "framework":         framework,
            "ai":                ai_summary,
        },
    }


@app.post("/run-security")
def run_security(data: dict):
    """Endpoint séparé si le frontend veut re-runner les tests manuellement"""
    test_cases = data.get("test_cases", [])
    token      = data.get("token", "")
    username   = data.get("username", "")
    password   = data.get("password", "")

    if not test_cases:
        return {"error": "test_cases is required"}

    print(f"[RUN-SECURITY] Running {len(test_cases)} security tests")

    from security_runner import _CACHED_TOKEN
    jwt_token = token if token else (_CACHED_TOKEN if not (username and password) else "")

    run_result = run_security_tests(test_cases, jwt_token, username=username, password=password)
    
    ai_analyses = _generate_security_analyses(run_result["results"])
    for idx, r in enumerate(run_result["results"]):
        ai = ai_analyses.get(idx, {})
        severity = "low" if r["status"] == "pass" else ("high" if r.get("severity") in ("critical", "high") else "medium")
        r["ai_analysis"] = {
            "severity":   severity,
            "root_cause": ai.get("root_cause", r.get("reason") or "—"),
            "fix":        ai.get("fix", "No action needed." if r["status"] == "pass" else "Investigate this finding."),
        }
    base_url_rs = test_cases[0].get("frontend_url", "") if test_cases else ""
    ai_summary = _generate_security_summary(run_result["results"], base_url_rs)

    return {
        "results":    run_result["results"],
        "pass_count": run_result["pass_count"],
        "warn_count": run_result["warn_count"],
        "fail_count": run_result["fail_count"],
        "pass_rate":  run_result["pass_rate"],
        "total":      run_result["total"],
        "ai":         ai_summary,
    }
@app.post("/generate-regression")
def generate_regression(data: dict):
    url = data.get("url", "")

    if not url:
        return {"error": "URL is required"}

    from urllib.parse import urlparse
    parsed   = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    print(f"[REGRESSION] base_url={base_url}")

    # Generate tests
    doc_text = get_doc_text(data)
    result = generate_regression_tests(base_url=base_url, username=data.get("username", ""), password=data.get("password", ""), doc_text=doc_text)
    test_cases = result.get("test_cases", [])

    # Run tests
    generation_id = data.get("generation_id")
    project_id    = data.get("project_id")
    for tc in test_cases:
        tc["generation_id"] = generation_id
        tc["project_id"]    = project_id
    run_result = run_regression_tests(
        test_cases=test_cases,
        base_url=base_url,
        username=data.get("username", ""),
        password=data.get("password", ""),
    )
    execution_results = run_result.get("results", [])

    # ── AI analysis (root_cause + fix par test, comme SEO/functional) ────────
    ai_analyses = _generate_regression_analyses(execution_results)
    for idx, r in enumerate(execution_results):
        ai = ai_analyses.get(idx, {})
        severity = "low" if r["status"] == "pass" else "high"
        r["ai_analysis"] = {
            "severity":   severity,
            "root_cause": ai.get("root_cause", r.get("reason") or "—"),
            "fix":        ai.get("fix", "No action needed." if r["status"] == "pass" else "Investigate this failure."),
        }

    ai_summary = _generate_regression_summary(execution_results, url)

    pass_count = run_result["pass_count"]
    fail_count = run_result["fail_count"]
    skip_count = run_result["skip_count"]
    pass_rate  = run_result["pass_rate"]
    
    record_results(
    results=execution_results,
    base_url=url,
    test_type="regression",
    framework="Playwright",
    generation_id=generation_id,
    project_id=project_id,
)

    return {
        "url":       url,
        "framework": "Playwright",
        "test_type": "regression",
        "scraped":   {"url": url, "load_time_ms": 0},
        "result": {
            **result,
            "test_cases":        execution_results,
            "execution_results": execution_results,
            "pass_count":        pass_count,
            "fail_count":        fail_count,
            "skip_count":        skip_count,
            "pass_rate":         pass_rate,
            "test_type":         "regression",
            "ai":                ai_summary,
        },
    }

def _build_real_elements_summary(scraped: dict) -> str:
    """Transforme le résultat de scrape_internal en texte lisible pour le prompt LLM,
    avec les VRAIS sélecteurs CSS confirmés — pas juste des labels."""
    parts = []
    confirmed_selectors = set()

    sidebar = [i.get("text", "") for i in scraped.get("sidebar_items", []) if i.get("text")]
    if sidebar:
        parts.append("Sidebar navigation items: " + ", ".join(sidebar[:15]))
        confirmed_selectors.add(".ant-menu-item")

    cards = [c.get("title", "") for c in scraped.get("stat_cards", []) if c.get("title")]
    if cards:
        parts.append("Cards/modules visible on page (selector: .ant-card, body text via .ant-card-body): " + ", ".join(cards[:15]))
        confirmed_selectors.add(".ant-card")
        confirmed_selectors.add(".ant-card-body")

    # ── Action buttons avec leurs VRAIS sélecteurs ────────────────────────────
    action_buttons = scraped.get("action_buttons", [])
    if action_buttons:
        btn_lines = []
        for b in action_buttons[:10]:
            text = b.get("text", "")
            css = b.get("css_selector", "")
            if text and css:
                btn_lines.append(f"'{text}' (selector: {css})")
                confirmed_selectors.add(css)
        if btn_lines:
            parts.append("Buttons on page with their EXACT selector: " + "; ".join(btn_lines))

    # ── Row action buttons (view/edit/delete dans le tableau) ────────────────
    row_actions = scraped.get("row_action_buttons", [])
    if row_actions:
        row_labels = [r.get("text", "") for r in row_actions if r.get("text")]
        if row_labels:
            parts.append(
                "Row action icons in the table (view/edit/delete per row), labels: "
                + ", ".join(row_labels[:10])
                + " — selector: .ant-table-tbody .anticon, .ant-table-tbody button"
            )
            confirmed_selectors.add(".ant-table-tbody .anticon")
            confirmed_selectors.add(".ant-table-tbody button")

    headings = [h.get("text", "") for h in scraped.get("headings", []) if h.get("text")]
    if headings:
        parts.append("Headings (selectors: h1, h2, h3): " + ", ".join(headings[:10]))
        confirmed_selectors.add("h1, h2, h3")

    header_els = scraped.get("header_elements", [])
    if header_els:
        parts.append("Header confirmed present (selector: .ant-layout-header)")
        confirmed_selectors.add(".ant-layout-header")

    breadcrumbs = scraped.get("breadcrumbs", [])
    if breadcrumbs:
        parts.append("Breadcrumb confirmed present (selector: .ant-breadcrumb)")
        confirmed_selectors.add(".ant-breadcrumb")

    sidebar_menu = scraped.get("sidebar_items", [])
    if sidebar_menu:
        confirmed_selectors.add(".ant-menu")

    # ── Tables (data_tables + ant_tables) ─────────────────────────────────────
    tables = scraped.get("data_tables", []) + scraped.get("ant_tables", [])
    if tables:
        parts.append(f"{len(tables)} data table(s) present (selector: .ant-table-wrapper)")
        confirmed_selectors.add(".ant-table-wrapper")
        confirmed_selectors.add(".ant-table")
    else:
        parts.append("NO table present — do NOT generate a test targeting .ant-table or .ant-table-wrapper")

    # ── Filtres (filter_inputs / filter_buttons — capturés dans stat_cards) ──
    filter_inputs = [c for c in scraped.get("stat_cards", []) if c.get("kind") == "filter_input"]
    if filter_inputs:
        labels = [f.get("title", "") for f in filter_inputs if f.get("title")]
        parts.append("Filter fields present: " + ", ".join(labels[:10]) + " — selector: .ant-form-item")
        confirmed_selectors.add(".ant-form-item")

    filter_buttons = [c for c in scraped.get("stat_cards", []) if c.get("kind") == "filter_button"]
    if filter_buttons:
        parts.append("Filter button present — selector: .ant-btn-primary")
        confirmed_selectors.add(".ant-btn-primary")

    forms = scraped.get("forms", [])
    if forms:
        parts.append(f"{len(forms)} form(s) present (selector: form)")
    else:
        parts.append("NO standalone form/login present on this page — do NOT generate login-style form tests")

    if not sidebar_menu:
        parts.append("NO sidebar/menu present — do NOT use .ant-menu or .ant-menu-item")

    if not parts:
        return ""

    selectors_line = (
        "CONFIRMED selectors that exist on this page (use ONLY these exact strings, "
        "copy them verbatim, no invented sub-variants): " + ", ".join(sorted(confirmed_selectors))
    )

    return "Real scraped elements on this page:\n" + "\n".join(f"- {p}" for p in parts) + "\n\n" + selectors_line


@app.post("/generate-functional")
def generate_functional(data: dict):
    url = data.get("url", "")

    if not url:
        return {"error": "URL is required"}

    from urllib.parse import urlparse
    parsed   = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    print(f"[FUNCTIONAL] target_url={url} | base_url={base_url}")

    username = data.get("username", "")
    password = data.get("password", "")
    doc_text = get_doc_text(data)

    has_captcha = False
    is_login_url = "login" in url.lower()

    if is_login_url:
        try:
            from scraper_internal import _scrape_login_page
            login_probe = _scrape_login_page(url, wait_time=1500)
            has_captcha = login_probe.get("has_captcha", False)
            print(f"[FUNCTIONAL] captcha detection on {url} → has_captcha={has_captcha}")
        except Exception as e:
            print(f"[FUNCTIONAL] captcha detection failed: {e} — assuming no captcha")
    else:
        if not doc_text:
            try:
                from scraper_internal import scrape_internal
                real_scraped = scrape_internal(
                    target_url=url,
                    username=username,
                    password=password,
                    wait_time=2000,
                )
                if "error" not in real_scraped:
                    real_summary = _build_real_elements_summary(real_scraped)
                    if real_summary:
                        doc_text = real_summary
                        print(f"[FUNCTIONAL] real content scraped — {len(real_summary)} chars used as doc_text")
                else:
                    print(f"[FUNCTIONAL] real scrape failed: {real_scraped.get('error')}")
            except Exception as e:
                print(f"[FUNCTIONAL] real scrape exception: {e} — falling back to DEFAULT_FEATURES")

    gen_result = generate_functional_tests(
        base_url    = base_url,
        target_url  = url,
        username    = username,
        password    = password,
        doc_text    = doc_text,
        has_captcha = has_captcha,
    )

    test_cases = gen_result.get("test_cases", [])

    if not test_cases:
        return {"error": "No functional test cases generated"}

    print(f"[FUNCTIONAL] {len(test_cases)} tests generated for {gen_result.get('page')} — running...")

    generation_id = data.get("generation_id")
    project_id    = data.get("project_id")
    for tc in test_cases:
        tc["generation_id"] = generation_id
        tc["project_id"]    = project_id

    run_result        = run_functional_tests(test_cases=test_cases, base_url=base_url, username=username, password=password)
    execution_results = run_result.get("results", [])

    ai_summary = _generate_functional_summary(execution_results, url)

    pass_count = run_result["pass_count"]
    fail_count = run_result["fail_count"]
    skip_count = run_result["skip_count"]
    pass_rate  = run_result["pass_rate"]

    print(f"[FUNCTIONAL] DONE | {pass_count} pass / {fail_count} fail | {pass_rate}%")

    record_results(
        results=execution_results,
        base_url=url,
        test_type="functional",
        framework="Playwright",
        generation_id=generation_id,
        project_id=project_id,
    )

    return {
        "url":       url,
        "framework": "Playwright",
        "test_type": "functional",
        "scraped":   {"url": url, "load_time_ms": 0},
        "result": {
            **gen_result,
            "test_cases":        execution_results,
            "execution_results": execution_results,
            "pass_count":        pass_count,
            "fail_count":        fail_count,
            "skip_count":        skip_count,
            "pass_rate":         pass_rate,
            "test_type":         "functional",
            "category_stats":    run_result.get("category_stats", {}),
            "ai":                ai_summary,
        },
    }


@app.post("/generate-performance")
def generate_performance(data: dict):
    url        = data.get("url", "")
    test_types = data.get("test_types", ["load", "stress", "spike", "soak"])

    if not url:
        return {"error": "URL is required"}

    from urllib.parse import urlparse
    parsed   = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    print(f"[PERFORMANCE] base_url={base_url} | types={test_types}")
    doc_text = get_doc_text(data)

    gen_result = generate_performance_tests(
        base_url=base_url,
        test_types=test_types,
        doc_text=doc_text,
        username=data.get("username", ""),
        password=data.get("password", ""),
    )
    scripts = gen_result.get("scripts", {})

    if not scripts:
        return {"error": "Failed to generate k6 scripts"}

    run_result = run_performance_tests(
        scripts=scripts,
        base_url=base_url,
        username=data.get("username", ""),
        password=data.get("password", ""),
    )

    execution_results = run_result.get("results", [])
    pass_count = run_result["pass_count"]
    fail_count = run_result["fail_count"]
    skip_count = run_result["skip_count"]
    pass_rate  = run_result["pass_rate"]

    summary = {}
    for test_type, rr in run_result.get("run_results", {}).items():
        summary[test_type] = {
            "name":             scripts[test_type]["name"],
            "status":           rr["status"],
            "duration_seconds": rr.get("duration_seconds", 0),
            "metrics":          rr.get("metrics", {}),
            "threshold_passes": rr.get("threshold_passes", []),
            "threshold_failures": rr.get("threshold_failures", []),
        }

    ai_summary = _generate_k6_summary(summary, execution_results, url)

    return {
        "url":       url,
        "framework": "k6",
        "test_type": "performance",
        "scraped":   {"url": url, "load_time_ms": 0},
        "result": {
            "test_cases":        execution_results,
            "execution_results": execution_results,
            "pass_count":        pass_count,
            "fail_count":        fail_count,
            "skip_count":        skip_count,
            "pass_rate":         pass_rate,
            "test_type":         "performance",
            "summary":           summary,
            "scripts":           {k: v["script"] for k, v in scripts.items()},
            "ai":                ai_summary,
        },
    }


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

async def stream_generate(data: dict):
    """
    Générateur SSE — appelle tes fonctions EXISTANTES
    et streame chaque résultat test par test.
    """

    url       = data.get("url", "")
    framework = data.get("framework", "Selenium")
    test_type = data.get("test_type", "smoke").lower()

    yield sse({"type": "log", "text": f"NexTest AI Engine — connecting to {url}"})
    await asyncio.sleep(0.05)
    yield sse({"type": "log", "text": f"Launching {framework} (headless)..."})
    await asyncio.sleep(0.05)
    yield sse({"type": "log", "text": "Scraping DOM and analyzing page structure..."})
    await asyncio.sleep(0.05)

    try:
        loop = asyncio.get_event_loop()

        if test_type == "functional":
            from urllib.parse import urlparse
            base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
            gen_result = await loop.run_in_executor(
                executor, lambda: generate_functional_tests(base_url=base_url, target_url=url)
            )
            test_cases = gen_result.get("test_cases", [])
            runner_fn  = lambda: run_functional_tests(test_cases=test_cases, base_url=base_url)

        elif test_type == "security":
            frontend_url = url
            for suffix in ["/admin-anpe/login", "/admin-anpe", "/dashboard", "/reception"]:
                if suffix in frontend_url:
                    frontend_url = frontend_url.split(suffix)[0]
                    break
            gen_result = await loop.run_in_executor(
                executor, lambda: generate_security_tests(base_url=frontend_url)
            )
            test_cases = gen_result.get("test_cases", [])
            from security_runner import _CACHED_TOKEN
            jwt = data.get("token") or _CACHED_TOKEN
            runner_fn = lambda: run_security_tests(test_cases, jwt)

        elif test_type == "regression":
            from urllib.parse import urlparse
            base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
            gen_result = await loop.run_in_executor(
                executor, lambda: generate_regression_tests(base_url=base_url, username=data.get("username", ""), password=data.get("password", ""))
            )
            test_cases = gen_result.get("test_cases", [])
            runner_fn  = lambda: run_regression_tests(test_cases=test_cases, base_url=base_url, username=data.get("username", ""), password=data.get("password", ""))

        elif test_type == "api":
            from urllib.parse import urlparse
            parsed = urlparse(url)
            base_api_url = f"{parsed.scheme}://{parsed.netloc}"
            gen_result = await loop.run_in_executor(
                executor, lambda: generate_api_tests(
                    base_url=base_api_url,
                    framework=framework,
                    token=data.get("token", ""),
                    domains=data.get("domains", ["auth"]),
                    original_url=url,
                )
            )
            test_cases = gen_result.get("test_cases", [])
            from api_runner import _CACHED_TOKEN
            jwt = data.get("token") or _CACHED_TOKEN
            runner_fn  = lambda: run_api_tests(test_cases, jwt)

        else:
            scraped = await loop.run_in_executor(
                executor, lambda: scrape_page(url, wait_time=4000)
            )
            gen_result = await loop.run_in_executor(
                executor, lambda: generate_tests(
                    scraped, framework,
                    data.get("username"), data.get("password"),
                    test_type=test_type,
                    user_scenario=data.get("user_scenario"),
                )
            )
            test_cases = gen_result.get("test_cases", [])
            runner_fn  = lambda: run_selenium_real(
                gen_result.get("script", ""), test_cases
            )

        total = len(test_cases)
        yield sse({"type": "log", "text": f"AI generated {total} test cases — starting execution..."})
        yield sse({"type": "log", "text": "─" * 52})
        await asyncio.sleep(0.05)

        run_result = await loop.run_in_executor(executor, runner_fn)
        results    = run_result.get("results", [])

        pass_count = 0
        fail_count = 0
        skip_count = 0

        for i, r in enumerate(results):
            status = r.get("status", "skip")
            if status == "pass":  pass_count += 1
            elif status == "fail": fail_count += 1
            else:                  skip_count += 1

            yield sse({
                "type":       "test_result",
                "index":      i,
                "total":      total,
                "name":       r.get("name", f"Test {i+1}"),
                "status":     status,
                "duration":   r.get("duration", "—"),
                "suite":      r.get("suite", r.get("detail", "")),
                "category":   r.get("category", "smoke"),
                "priority":   r.get("priority", "medium"),
                "ai_analysis": r.get("ai_analysis"),
                "assertion_result": r.get("assertion_result"),
                "step_meta":  r.get("step_meta"),
                "screenshot": r.get("screenshot"),
                "http_status": r.get("http_status"),
                "pass_count": pass_count,
                "fail_count": fail_count,
                "skip_count": skip_count,
                "progress":   round((i + 1) / total * 100),
            })
            await asyncio.sleep(0.02)

        total_exec = pass_count + fail_count
        rate = round(pass_count / total_exec * 100) if total_exec else 0

        yield sse({"type": "log", "text": "─" * 52})
        yield sse({"type": "log", "text": f"Execution complete — {pass_count} passed · {fail_count} failed · {skip_count} skipped"})
        yield sse({"type": "log", "text": f"Pass rate: {rate}% — Generating AI analysis report..."})
        yield sse({"type": "log", "text": "Done ✓"})

        yield sse({
            "type":       "complete",
            "results":    results,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "skip_count": skip_count,
            "pass_rate":  rate,
            "total":      total,
            "script":            gen_result.get("script", ""),
            "script_selenium":   gen_result.get("script_selenium", ""),
            "script_playwright": gen_result.get("script_playwright", ""),
            "script_cypress":    gen_result.get("script_cypress", ""),
            "script_postman":    gen_result.get("script_postman", ""),
            "script_pytest":     gen_result.get("script_pytest", ""),
            "summary":           run_result.get("summary", {}),
            "test_type":         test_type,
            "framework":         framework,
        })

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[SSE ERROR] {e}\n{tb}")
        yield sse({"type": "error", "text": f"Error: {str(e)}"})


@app.post("/generate-stream")
async def generate_stream(request: FastAPIRequest):
    """
    Endpoint SSE — React se connecte ici avec fetch + ReadableStream.
    Remplace les appels /generate + /run par un seul flux en temps réel.
    """
    data = await request.json()
    return StreamingResponse(
        stream_generate(data),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "Connection":       "keep-alive",
            "X-Accel-Buffering": "no",   
        }
    )

  