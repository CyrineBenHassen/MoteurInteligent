# generator_performance.py — NexTest Performance Module
# À intégrer dans generator.py (coller après les constantes, avant generate_tests())
#
# ARCHITECTURE:
#   1. Playwright mesure les vraies métriques Web Vitals
#   2. LLaMA3 analyse le type de site + adapte les seuils
#   3. LLaMA3 génère des recommandations d'optimisation
#   4. Score global calculé comme Lighthouse (0-100)

import os, json, time, re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

# ─────────────────────────────────────────────────────────────────────────────
# DEFAULT THRESHOLDS (LLaMA adaptera ces seuils selon le type de site)
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_THRESHOLDS = {
    "load_time_ms":       {"good": 3000,  "poor": 6000,  "unit": "ms",  "label": "Page Load Time"},
    "fcp_ms":             {"good": 1800,  "poor": 3000,  "unit": "ms",  "label": "First Contentful Paint"},
    "lcp_ms":             {"good": 2500,  "poor": 4000,  "unit": "ms",  "label": "Largest Contentful Paint"},
    "tti_ms":             {"good": 3800,  "poor": 7300,  "unit": "ms",  "label": "Time to Interactive"},
    "request_count":      {"good": 50,    "poor": 100,   "unit": "",    "label": "Network Requests"},
    "total_size_kb":      {"good": 2048,  "poor": 4096,  "unit": "KB",  "label": "Total Resource Size"},
    "dom_size":           {"good": 1500,  "poor": 3000,  "unit": "",    "label": "DOM Elements"},
    "js_size_kb":         {"good": 512,   "poor": 1024,  "unit": "KB",  "label": "JavaScript Size"},
    "css_size_kb":        {"good": 100,   "poor": 300,   "unit": "KB",  "label": "CSS Size"},
    "image_size_kb":      {"good": 1024,  "poor": 2048,  "unit": "KB",  "label": "Images Size"},
}

# Poids pour le score global (inspiré de Lighthouse)
METRIC_WEIGHTS = {
    "fcp_ms":         0.10,
    "lcp_ms":         0.20,
    "tti_ms":         0.25,
    "load_time_ms":   0.15,
    "total_size_kb":  0.08,
    "dom_size":       0.04,
    "request_count":  0.08,
    "js_size_kb":     0.06,
    "css_size_kb":    0.02,
    "image_size_kb":  0.02,
}

# Types de sites reconnus
SITE_TYPES = {
    "ecommerce":  ["shop", "store", "cart", "product", "checkout", "buy", "price", "magasin", "boutique"],
    "saas":       ["dashboard", "app.", "platform", "software", "signin", "login", "subscribe"],
    "blog":       ["blog", "post", "article", "news", "magazine", "journal"],
    "landing":    ["landing", "home", "index", "about", "contact", "portfolio"],
    "media":      ["video", "youtube", "stream", "media", "player", "watch"],
    "corporate":  ["company", "enterprise", "business", "services", "solutions"],
}

# Multiplicateurs de seuils selon le type de site
SITE_THRESHOLDS_MULTIPLIER = {
    "ecommerce":  {"load_time_ms": 1.2, "total_size_kb": 1.5, "request_count": 1.3},
    "saas":       {"load_time_ms": 1.0, "total_size_kb": 1.2, "lcp_ms": 1.1},
    "blog":       {"load_time_ms": 0.8, "total_size_kb": 0.8, "fcp_ms": 0.9},
    "landing":    {"load_time_ms": 0.7, "total_size_kb": 0.7, "fcp_ms": 0.8},
    "media":      {"load_time_ms": 1.5, "total_size_kb": 3.0, "image_size_kb": 3.0},
    "corporate":  {"load_time_ms": 1.0, "total_size_kb": 1.0},
}


# ─────────────────────────────────────────────────────────────────────────────
# SITE TYPE DETECTOR
# ─────────────────────────────────────────────────────────────────────────────

def _detect_site_type(url: str, scraped: dict) -> str:
    """Détecte le type de site depuis l'URL et le contenu scrappé."""
    text_to_check = (
        url.lower() + " " +
        scraped.get("title", "").lower() + " " +
        " ".join([n.get("text", "").lower() for n in scraped.get("nav_links", [])])
    )
    for site_type, keywords in SITE_TYPES.items():
        if any(kw in text_to_check for kw in keywords):
            return site_type
    return "landing"  # défaut


def _adapt_thresholds(site_type: str) -> dict:
    """Adapte les seuils DEFAULT selon le type de site."""
    thresholds = {k: dict(v) for k, v in DEFAULT_THRESHOLDS.items()}
    multipliers = SITE_THRESHOLDS_MULTIPLIER.get(site_type, {})
    for metric, mult in multipliers.items():
        if metric in thresholds:
            thresholds[metric]["good"] = int(thresholds[metric]["good"] * mult)
            thresholds[metric]["poor"] = int(thresholds[metric]["poor"] * mult)
    return thresholds


# ─────────────────────────────────────────────────────────────────────────────
# LLaMA — ANALYSE DU SITE + SEUILS ADAPTÉS + RECOMMANDATIONS
# ─────────────────────────────────────────────────────────────────────────────

def _llama_analyze_performance(
    url: str,
    scraped: dict,
    metrics: dict,
    site_type: str,
    base_thresholds: dict,
) -> dict:
    """
    LLaMA analyse le site et retourne :
    - thresholds affinés (adaptés au contexte réel)
    - recommendations (liste de conseils d'optimisation)
    - site_analysis (description courte du site)
    """
    system_prompt = (
        "You are a senior web performance engineer specialized in Core Web Vitals.\n"
        "You analyze websites and provide PRECISE performance thresholds and optimization recommendations.\n"
        "RULES:\n"
        "1. Respond ONLY with valid JSON — no markdown, no explanation\n"
        "2. Thresholds must be realistic for the site type\n"
        "3. Recommendations must be specific and actionable\n"
        "4. Consider the actual measured metrics when setting thresholds\n"
    )

    # Résumé des métriques mesurées
    metrics_summary = "\n".join([
        f"  - {k}: {v}" for k, v in metrics.items() if v is not None
    ])

    # Résumé du site scrappé
    nav_links = [n.get("text", "") for n in scraped.get("nav_links", [])[:5]]
    buttons   = [b.get("text", "") for b in scraped.get("buttons", [])[:5]]
    headings  = [h.get("text", "") for h in scraped.get("headings", [])[:3]]

    user_prompt = f"""Analyze this website's performance:

URL: {url}
Detected site type: {site_type}
Page title: {scraped.get("title", "N/A")}
Navigation: {", ".join(nav_links)}
Main buttons: {", ".join(buttons)}
Headings: {", ".join(headings)}
Is SPA: {scraped.get("is_spa", False)}
DOM elements: {scraped.get("dom_element_count", "N/A")}

MEASURED METRICS:
{metrics_summary}

BASE THRESHOLDS for this site type ({site_type}):
{json.dumps(base_thresholds, indent=2)}

Return ONLY this JSON:
{{
  "site_analysis": "2-3 sentence description of the site and its performance context",
  "site_type_confirmed": "{site_type}",
  "thresholds": {{
    "load_time_ms":  {{"good": <int_ms>, "poor": <int_ms>}},
    "fcp_ms":        {{"good": <int_ms>, "poor": <int_ms>}},
    "lcp_ms":        {{"good": <int_ms>, "poor": <int_ms>}},
    "tti_ms":        {{"good": <int_ms>, "poor": <int_ms>}},
    "request_count": {{"good": <int>,    "poor": <int>}},
    "total_size_kb": {{"good": <int_kb>, "poor": <int_kb>}},
    "dom_size":      {{"good": <int>,    "poor": <int>}},
    "js_size_kb":    {{"good": <int_kb>, "poor": <int_kb>}},
    "css_size_kb":   {{"good": <int_kb>, "poor": <int_kb>}},
    "image_size_kb": {{"good": <int_kb>, "poor": <int_kb>}}
  }},
  "recommendations": [
    {{
      "priority": "critical|high|medium|low",
      "category": "images|javascript|css|server|caching|fonts|network",
      "title": "Short actionable title",
      "description": "Specific recommendation based on measured metrics",
      "impact": "Expected improvement if fixed"
    }}
  ],
  "performance_summary": "1-2 sentence overall assessment"
}}

Generate 4-6 specific recommendations based on the ACTUAL measured metrics above.
"""

    for attempt in range(3):
        try:
            resp = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=2000,
                seed=42,
            )
            content = resp.choices[0].message.content.strip()

            # Parse JSON
            for fence in ["```json", "```"]:
                if fence in content:
                    content = content.split(fence)[1].split("```")[0].strip()
                    break
            return json.loads(content)

        except Exception as e:
            print(f"[PERF] LLaMA attempt {attempt+1} failed: {e}")
            time.sleep(1)

    # Fallback si LLaMA échoue
    return {
        "site_analysis":       f"Performance analysis for {site_type} site at {url}",
        "site_type_confirmed": site_type,
        "thresholds":          base_thresholds,
        "recommendations": [
            {
                "priority":    "high",
                "category":    "images",
                "title":       "Optimize images",
                "description": "Convert images to WebP format and implement lazy loading",
                "impact":      "20-40% reduction in page weight",
            },
            {
                "priority":    "high",
                "category":    "javascript",
                "title":       "Reduce JavaScript bundle size",
                "description": "Implement code splitting and tree shaking",
                "impact":      "Improved TTI by 1-2 seconds",
            },
        ],
        "performance_summary": "Analysis completed with default recommendations.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# SCORE CALCULATOR (Lighthouse-style 0-100)
# ─────────────────────────────────────────────────────────────────────────────

def _metric_score(value: float, good: float, poor: float) -> int:
    """Calcule un score 0-100 pour une métrique."""
    if value is None:
        return 50  # neutre si non mesuré

    # Garde-fou : seuil "good" invalide (0 ou négatif) → seuil corrompu, score neutre
    if good <= 0:
        print(f"[PERF] Invalid 'good' threshold ({good}) — returning neutral score")
        return 50

    if value <= good:
        ratio = value / good
        return max(90, int(100 - ratio * 10))
    if value >= poor:
        return 0

    # Entre good et poor : interpolation 90 → 0
    if poor == good:
        # Bornes identiques, pas d'interpolation possible
        return 0
    ratio = (value - good) / (poor - good)
    return int(90 * (1 - ratio))


def _compute_global_score(metrics: dict, thresholds: dict) -> int:
    """Score global pondéré Lighthouse-style."""
    total_weight = 0
    weighted_sum = 0
    for metric_key, weight in METRIC_WEIGHTS.items():
        value = metrics.get(metric_key)
        if value is None:
            continue
        th    = thresholds.get(metric_key, {})
        good  = th.get("good", DEFAULT_THRESHOLDS.get(metric_key, {}).get("good", 3000))
        poor  = th.get("poor", DEFAULT_THRESHOLDS.get(metric_key, {}).get("poor", 6000))
        score = _metric_score(float(value), float(good), float(poor))
        weighted_sum += score * weight
        total_weight += weight
    if total_weight == 0:
        return 50
    return min(100, max(0, int(weighted_sum / total_weight)))


def _score_label(score: int) -> str:
    if score >= 90: return "Excellent"
    if score >= 75: return "Good"
    if score >= 50: return "Needs Improvement"
    if score >= 25: return "Poor"
    return "Critical"


def _score_color(score: int) -> str:
    if score >= 90: return "#10b981"
    if score >= 75: return "#22c55e"
    if score >= 50: return "#f59e0b"
    if score >= 25: return "#ef4444"
    return "#dc2626"


# ─────────────────────────────────────────────────────────────────────────────
# BUILD PERFORMANCE TEST CASES (format compatible avec ExecutionPanel)
# ─────────────────────────────────────────────────────────────────────────────

def _build_performance_test_cases(
    metrics:    dict,
    thresholds: dict,
    site_type:  str,
) -> list:
    """
    Génère les test_cases au format standard NexTest.
    Chaque métrique = un test case avec status pass/fail/skip.
    """
    test_cases = []
    metric_id  = 1

    METRIC_META = {
        "load_time_ms":  {
            "name":     "Page Load Time",
            "selector": "window.performance",
            "category": "performance",
            "section":  "timing",
            "icon":     "⏱",
        },
        "fcp_ms": {
            "name":     "First Contentful Paint (FCP)",
            "selector": "paint-timing-api",
            "category": "performance",
            "section":  "timing",
            "icon":     "🎨",
        },
        "lcp_ms": {
            "name":     "Largest Contentful Paint (LCP)",
            "selector": "largest-contentful-paint",
            "category": "performance",
            "section":  "timing",
            "icon":     "🖼",
        },
        "tti_ms": {
            "name":     "Time to Interactive (TTI)",
            "selector": "long-tasks-api",
            "category": "performance",
            "section":  "timing",
            "icon":     "🖱",
        },
        "request_count": {
            "name":     "Network Requests Count",
            "selector": "performance.getEntriesByType('resource')",
            "category": "performance",
            "section":  "network",
            "icon":     "🌐",
        },
        "total_size_kb": {
            "name":     "Total Page Size",
            "selector": "resource-timing-api",
            "category": "performance",
            "section":  "network",
            "icon":     "📦",
        },
        "dom_size": {
            "name":     "DOM Elements Count",
            "selector": "document.querySelectorAll('*')",
            "category": "performance",
            "section":  "dom",
            "icon":     "🌲",
        },
        "js_size_kb": {
            "name":     "JavaScript Bundle Size",
            "selector": "script[src]",
            "category": "performance",
            "section":  "assets",
            "icon":     "⚡",
        },
        "css_size_kb": {
            "name":     "CSS Stylesheets Size",
            "selector": "link[rel=stylesheet]",
            "category": "performance",
            "section":  "assets",
            "icon":     "🎨",
        },
        "image_size_kb": {
            "name":     "Images Total Size",
            "selector": "img",
            "category": "performance",
            "section":  "assets",
            "icon":     "🖼",
        },
    }

    for metric_key, meta in METRIC_META.items():
        value = metrics.get(metric_key)
        th    = thresholds.get(metric_key, DEFAULT_THRESHOLDS.get(metric_key, {}))
        good  = th.get("good", 9999)
        poor  = th.get("poor", 99999)
        unit  = DEFAULT_THRESHOLDS.get(metric_key, {}).get("unit", "")
        label = DEFAULT_THRESHOLDS.get(metric_key, {}).get("label", meta["name"])

        if value is None:
            status = "skip"
            reason = "Metric could not be measured"
            score  = None
        else:
            score = _metric_score(float(value), float(good), float(poor))
            if value <= good:
                status = "pass"
                reason = f"✓ {value}{unit} ≤ {good}{unit} (good threshold for {site_type})"
            elif value >= poor:
                status = "fail"
                reason = f"✗ {value}{unit} ≥ {poor}{unit} (exceeds poor threshold for {site_type})"
            else:
                status = "fail"
                reason = f"⚠ {value}{unit} between {good}{unit} (good) and {poor}{unit} (poor)"

        # Format de valeur affiché
        if value is not None:
            if unit == "ms":
                display_value = f"{value:,}ms" if value >= 1000 else f"{value}ms"
            elif unit == "KB":
                display_value = f"{value:,} KB" if value < 1024 else f"{value/1024:.1f} MB"
            else:
                display_value = f"{value:,}"
        else:
            display_value = "N/A"

        test_cases.append({
            "id":          metric_id,
            "name":        f"{meta['icon']} {meta['name']}",
            "action":      "measure",
            "selector":    meta["selector"],
            "value":       display_value,
            "status":      status,
            "duration":    "—",
            "category":    "performance",
            "priority":    "high" if metric_key in ("lcp_ms", "tti_ms", "fcp_ms") else "medium",
            "section":     meta["section"],
            "optional":    False,
            "description": reason,
            "suite":       reason,
            "base_url":    metrics.get("url", ""),
            "metric_key":  metric_key,
            "metric_value": value,
            "metric_unit":  unit,
            "metric_good":  good,
            "metric_poor":  poor,
            "metric_score": score,
            "assertion": {
                "type":             "performance_threshold",
                "expected":         f"≤ {good}{unit}",
                "actual":           display_value,
                "passed":           status == "pass",
                "error":            reason if status == "fail" else None,
            } if value is not None else None,
        })
        metric_id += 1

    return test_cases


# ─────────────────────────────────────────────────────────────────────────────
# SCRIPT BUILDERS FOR PERFORMANCE (Selenium / Playwright / Cypress)
# ─────────────────────────────────────────────────────────────────────────────

def _build_performance_selenium_script(metrics: dict, thresholds: dict, url: str) -> str:
    lines = [
        "from selenium import webdriver",
        "from selenium.webdriver.chrome.options import Options",
        "import time, json", "",
        "def setup_driver():",
        "    opts = Options()",
        "    opts.add_argument('--headless')",
        "    opts.add_argument('--no-sandbox')",
        "    opts.add_argument('--disable-dev-shm-usage')",
        "    driver = webdriver.Chrome(options=opts)",
        "    driver.set_page_load_timeout(30)",
        "    return driver", "",
        f"URL = '{url}'", "",
        "def measure_performance(driver):",
        "    t0 = time.time()",
        "    driver.get(URL)",
        "    load_time = round((time.time() - t0) * 1000)",
        "    timing = driver.execute_script('return JSON.stringify(performance.timing)')",
        "    resources = driver.execute_script(",
        "        'return performance.getEntriesByType(\"resource\").length'",
        "    )",
        "    dom_size = driver.execute_script(",
        "        'return document.querySelectorAll(\"*\").length'",
        "    )",
        "    return {'load_time_ms': load_time, 'request_count': resources, 'dom_size': dom_size}",
        "",
    ]

    for metric_key, th in thresholds.items():
        good = th.get("good", 9999)
        unit = DEFAULT_THRESHOLDS.get(metric_key, {}).get("unit", "")
        label = DEFAULT_THRESHOLDS.get(metric_key, {}).get("label", metric_key)
        fn_name = f"test_perf_{metric_key}"
        value = metrics.get(metric_key)
        lines += [
            f"def {fn_name}(driver):",
            f"    metrics = measure_performance(driver)",
            f"    value = metrics.get('{metric_key}')",
            f"    if value is None:",
            f"        print('[SKIP] {label}: not measurable')",
            f"        return",
            f"    assert value <= {good}, f'{label}: {{value}}{unit} > {good}{unit} (good threshold)'",
            f"    print(f'[PASS] {label}: {{value}}{unit} ≤ {good}{unit}')",
            "",
        ]

    all_fns = [f"test_perf_{k}" for k in thresholds.keys()]
    lines += [
        "if __name__ == '__main__':",
        "    driver = setup_driver()",
        "    tests = [" + ", ".join(all_fns) + "]",
        "    passed = failed = skipped = 0",
        "    try:",
        "        for i, t in enumerate(tests, 1):",
        "            try:",
        "                t(driver)",
        "                passed += 1",
        "            except AssertionError as e:",
        "                print(f'[FAIL] Test {i}: {e}')",
        "                failed += 1",
        "            except Exception as e:",
        "                print(f'[SKIP] Test {i}: {e}')",
        "                skipped += 1",
        "    finally:",
        "        driver.quit()",
        "        print(f'\\nResults: {passed} passed / {failed} failed / {skipped} skipped')",
    ]
    return "\n".join(lines)


def _build_performance_playwright_script(metrics: dict, thresholds: dict, url: str) -> str:
    lines = [
        "from playwright.sync_api import sync_playwright",
        "import pytest, time", "",
        f"BASE_URL = '{url}'", "",
        "def get_metrics(page):",
        "    page.goto(BASE_URL, wait_until='networkidle')",
        "    return page.evaluate('''() => {",
        "        const nav = performance.getEntriesByType('navigation')[0] || {};",
        "        const resources = performance.getEntriesByType('resource');",
        "        const paintEntries = performance.getEntriesByType('paint');",
        "        const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');",
        "        return {",
        "            load_time_ms:  Math.round(nav.loadEventEnd || 0),",
        "            fcp_ms:        Math.round(fcp ? fcp.startTime : 0),",
        "            lcp_ms:        Math.round(nav.domContentLoadedEventEnd || 0),",
        "            request_count: resources.length,",
        "            dom_size:      document.querySelectorAll('*').length,",
        "            total_size_kb: Math.round(resources.reduce((s,r) => s + (r.transferSize||0), 0) / 1024),",
        "        };",
        "    }''')", "",
        "@pytest.fixture(scope='module')",
        "def metrics():",
        "    with sync_playwright() as p:",
        "        browser = p.chromium.launch(headless=True)",
        "        page = browser.new_page()",
        "        m = get_metrics(page)",
        "        browser.close()",
        "        return m", "",
    ]

    for metric_key, th in thresholds.items():
        good  = th.get("good", 9999)
        unit  = DEFAULT_THRESHOLDS.get(metric_key, {}).get("unit", "")
        label = DEFAULT_THRESHOLDS.get(metric_key, {}).get("label", metric_key)
        fn    = f"test_{metric_key}"
        lines += [
            f"def {fn}(metrics):",
            f"    value = metrics.get('{metric_key}')",
            f"    if not value:",
            f"        pytest.skip('{label} not measurable')",
            f"    assert value <= {good}, f'{label}: {{value}}{unit} exceeds {good}{unit}'",
            "",
        ]
    return "\n".join(lines)


def _build_performance_cypress_script(metrics: dict, thresholds: dict, url: str) -> str:
    threshold_js = json.dumps({k: v.get("good") for k, v in thresholds.items()}, indent=4)
    lines = [
        "// NexTest Performance Suite — Cypress",
        f"const BASE_URL = '{url}';",
        f"const THRESHOLDS = {threshold_js};", "",
        "describe('Performance Tests', () => {",
        "  let metrics = {};", "",
        "  before(() => {",
        "    cy.visit(BASE_URL);",
        "    cy.window().then(win => {",
        "      const nav = win.performance.getEntriesByType('navigation')[0] || {};",
        "      const resources = win.performance.getEntriesByType('resource');",
        "      const paint = win.performance.getEntriesByType('paint');",
        "      const fcp = paint.find(e => e.name === 'first-contentful-paint');",
        "      metrics.load_time_ms  = Math.round(nav.loadEventEnd || 0);",
        "      metrics.fcp_ms        = Math.round(fcp ? fcp.startTime : 0);",
        "      metrics.request_count = resources.length;",
        "      metrics.dom_size      = win.document.querySelectorAll('*').length;",
        "      metrics.total_size_kb = Math.round(resources.reduce((s,r) => s + (r.transferSize||0), 0) / 1024);",
        "    });",
        "  });", "",
    ]

    for metric_key, th in thresholds.items():
        good  = th.get("good", 9999)
        unit  = DEFAULT_THRESHOLDS.get(metric_key, {}).get("unit", "")
        label = DEFAULT_THRESHOLDS.get(metric_key, {}).get("label", metric_key)
        lines += [
            f"  it('{label} ≤ {good}{unit}', () => {{",
            f"    const value = metrics['{metric_key}'];",
            f"    if (!value) {{ cy.log('SKIP: {label} not measurable'); return; }}",
            f"    expect(value, '{label}').to.be.at.most({good});",
            f"  }});", "",
        ]
    lines.append("});")
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY — generate_performance_tests()
# ─────────────────────────────────────────────────────────────────────────────

def generate_performance_tests(
    scraped:   dict,
    framework: str,
    metrics:   dict = None,   # métriques mesurées par runner.py
) -> dict:
    """
    Point d'entrée principal pour le mode performance.
    
    Args:
        scraped:   résultat du scraper Playwright
        framework: Selenium | Playwright | Cypress | Both
        metrics:   métriques déjà mesurées par run_performance() dans runner.py
                   (si None, on utilise load_time_ms du scraped)
    
    Returns:
        dict compatible avec le format standard NexTest generate_tests()
    """
    url = scraped.get("url", "")

    # 1. Métriques de base depuis scraped si pas fournies
    if metrics is None:
        metrics = {
            "url":           url,
            "load_time_ms":  scraped.get("load_time_ms"),
            "fcp_ms":        scraped.get("fcp_ms"),
            "lcp_ms":        scraped.get("lcp_ms"),
            "tti_ms":        scraped.get("tti_ms"),
            "request_count": scraped.get("request_count"),
            "total_size_kb": scraped.get("total_size_kb"),
            "dom_size":      scraped.get("dom_size"),
            "js_size_kb":    scraped.get("js_size_kb"),
            "css_size_kb":   scraped.get("css_size_kb"),
            "image_size_kb": scraped.get("image_size_kb"),
        }

    print(f"[PERF] Generating performance tests for {url}")
    print(f"[PERF] Metrics: {metrics}")

    # 2. Détection du type de site
    site_type = _detect_site_type(url, scraped)
    print(f"[PERF] Site type detected: {site_type}")

    # 3. Seuils de base adaptés au type de site
    base_thresholds = _adapt_thresholds(site_type)

    # 4. LLaMA affine les seuils + génère des recommandations
    llama_result = _llama_analyze_performance(
        url, scraped, metrics, site_type, base_thresholds
    )

    # Merge thresholds — LLaMA a priorité
    # Merge thresholds — LLaMA a priorité, avec garde-fou contre les valeurs aberrantes
    final_thresholds = dict(base_thresholds)
    for k, v in llama_result.get("thresholds", {}).items():
        if not (isinstance(v, dict) and "good" in v and "poor" in v):
            continue
        if k not in final_thresholds:
            continue
        base_good = base_thresholds[k]["good"]
        base_poor = base_thresholds[k]["poor"]
        try:
            new_good = float(v["good"])
            new_poor = float(v["poor"])
        except (TypeError, ValueError):
            continue  # valeur non numérique renvoyée par LLaMA → on garde le seuil de base

        # Rejette si LLaMA dévie de plus de 3x le seuil de base (probable hallucination)
        if not (base_good / 3 <= new_good <= base_good * 3):
            print(f"[PERF] Rejected LLaMA threshold for '{k}': good={new_good} (base={base_good})")
            continue
        if not (base_poor / 3 <= new_poor <= base_poor * 3):
            print(f"[PERF] Rejected LLaMA threshold for '{k}': poor={new_poor} (base={base_poor})")
            continue
        if new_good >= new_poor:
            print(f"[PERF] Rejected LLaMA threshold for '{k}': good >= poor")
            continue

        final_thresholds[k]["good"] = new_good
        final_thresholds[k]["poor"] = new_poor

    # 5. Score global Lighthouse-style
    global_score = _compute_global_score(metrics, final_thresholds)
    score_label  = _score_label(global_score)
    score_color  = _score_color(global_score)

    # 6. Build test cases (format NexTest standard)
    test_cases = _build_performance_test_cases(metrics, final_thresholds, site_type)

    # 7. Build scripts
    fw = framework.lower()
    scripts = {"script": "", "script_selenium": "", "script_playwright": "", "script_cypress": ""}

    if fw in ("selenium", "both", "all"):
        scripts["script_selenium"]   = _build_performance_selenium_script(metrics, final_thresholds, url)
    if fw in ("playwright", "both", "all"):
        scripts["script_playwright"] = _build_performance_playwright_script(metrics, final_thresholds, url)
    if fw in ("cypress", "both", "all"):
        scripts["script_cypress"]    = _build_performance_cypress_script(metrics, final_thresholds, url)

    scripts["script"] = (
        scripts["script_selenium"]   or
        scripts["script_playwright"] or
        scripts["script_cypress"]    or ""
    )

    pass_count = sum(1 for tc in test_cases if tc["status"] == "pass")
    fail_count = sum(1 for tc in test_cases if tc["status"] == "fail")
    skip_count = sum(1 for tc in test_cases if tc["status"] == "skip")

    print(f"[PERF] Done | score={global_score} ({score_label}) | "
          f"pass={pass_count} fail={fail_count} skip={skip_count}")

    return {
        # Standard NexTest fields
        "test_cases":          test_cases,
        "test_cases_selenium": test_cases,
        "test_cases_cypress":  test_cases,
        "script":              scripts["script"],
        "script_selenium":     scripts["script_selenium"],
        "script_playwright":   scripts["script_playwright"],
        "script_cypress":      scripts["script_cypress"],
        "page_type":           "general",
        "test_type":           "performance",
        "page_profile":        "performance",

        # Performance-specific fields
        "performance": {
            "global_score":    global_score,
            "score_label":     score_label,
            "score_color":     score_color,
            "site_type":       site_type,
            "site_analysis":   llama_result.get("site_analysis", ""),
            "performance_summary": llama_result.get("performance_summary", ""),
            "metrics":         metrics,
            "thresholds":      final_thresholds,
            "recommendations": llama_result.get("recommendations", []),
            "pass_count":      pass_count,
            "fail_count":      fail_count,
            "skip_count":      skip_count,
        },
    }