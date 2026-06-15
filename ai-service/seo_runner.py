import os
import json
import traceback
from datetime import datetime
from groq import Groq
from seo_analyzer import analyze_seo, compute_seo_score

# ── Groq client ──────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ── LLaMA global recommendations ─────────────────────────────────────────────
def _generate_seo_recommendations(analysis: dict, score: int) -> dict:
    if not groq_client:
        return {"summary": "Groq API key not configured.", "recommendations": [], "action_plan": []}

    issues_text   = "\n".join(f"- {i}" for i in analysis["issues"])   or "None"
    warnings_text = "\n".join(f"- {w}" for w in analysis["warnings"]) or "None"
    passed_text   = "\n".join(f"- {p}" for p in analysis["passed"])   or "None"

    prompt = f"""You are an expert SEO auditor. Analyze the following SEO audit results for the URL: {analysis['url']}

SEO Score: {score}/100

ISSUES (critical):
{issues_text}

WARNINGS (important):
{warnings_text}

PASSED CHECKS:
{passed_text}

Additional data:
- Title: {analysis.get('title', 'N/A')}
- Meta description: {analysis.get('meta_description', 'N/A')}
- H1 tags: {analysis.get('h1_tags', [])}
- Word count: {analysis.get('word_count', 0)}
- Load time: {analysis.get('load_time_ms', 'N/A')}ms
- Images missing alt: {analysis.get('images_missing_alt', 0)} / {analysis.get('images_total', 0)}

Respond ONLY with a valid JSON object (no markdown, no backticks) with this exact structure:
{{
  "summary": "A concise 2-3 sentence overall SEO assessment",
  "recommendations": [
    {{
      "priority": "high|medium|low",
      "category": "category name",
      "issue": "what the problem is",
      "fix": "how to fix it"
    }}
  ],
  "action_plan": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ]
}}

Focus on the most impactful improvements. Provide at most 6 recommendations ordered by priority."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        return {"summary": f"AI recommendations unavailable: {str(e)}", "recommendations": [], "action_plan": []}


# ── LLaMA per-test analyses ───────────────────────────────────────────────────
def _generate_per_test_analyses(checks: list) -> dict:
    """
    Call Groq once with all SEO checks to get per-test root_cause + fix.
    Returns dict: { index: { root_cause: str, fix: str } }
    """
    if not groq_client:
        return {}

    checks_text = "\n".join(
    f"{i}. [{'PASS' if passed else 'FAIL'}] {name} — {detail}"
    for i, (name, category, passed, detail, rc_pass, rc_fail, fix) in enumerate(checks)
)

    prompt = f"""You are an SEO expert. For each SEO check result below, write a specific root_cause and fix using the actual data shown.

Respond ONLY with a valid JSON object mapping index to root_cause and fix.
Example: {{"0": {{"root_cause": "...", "fix": "..."}}}}

SEO Checks:
{checks_text}

Rules:
- Use the actual values shown (title text, character counts, URLs, ms values etc.)
- PASS: root_cause = mention the actual value found (e.g. title text, URL, count). fix = a specific SEO tip to improve it further.
- FAIL: root_cause = specific problem with actual value. fix = concrete actionable step.
- Max 20 words per sentence. No generic phrases like "no action required" or "continue to include"."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1500,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        return {int(k): v for k, v in parsed.items()}
    except Exception:
        return {}


# ── Build test cases ──────────────────────────────────────────────────────────
def _build_test_cases(analysis: dict, ai_result: dict = None) -> list:
    load_time = analysis.get("load_time_ms")
    title_len = analysis.get("title_length", 0)
    desc_len  = analysis.get("meta_description_length", 0)
    h1_count  = len(analysis.get("h1_tags", []))
    h2_count  = len(analysis.get("h2_tags", []))
    img_total = analysis.get("images_total", 0)
    img_miss  = analysis.get("images_missing_alt", 0)
    words     = analysis.get("word_count", 0)

    # (name, category, passed, detail, rc_pass, rc_fail, fix_fail)
    checks = [
        (
            "HTTPS Enabled", "security",
            analysis["https"],
            "Site uses HTTPS — connection is secure and encrypted." if analysis["https"] else "Site does not use HTTPS — Google penalizes non-secure sites.",
            "The site correctly serves content over HTTPS, ensuring encrypted communication.",
            "The site is served over HTTP instead of HTTPS, which Google penalizes in rankings.",
            "Obtain an SSL/TLS certificate (free via Let's Encrypt) and redirect all HTTP traffic to HTTPS.",
        ),
        (
            "Page Accessible", "accessibility",
            analysis["accessible"],
            f"Page returned HTTP {analysis.get('status_code', '?')} — fully accessible." if analysis["accessible"] else f"Page returned HTTP {analysis.get('status_code', '?')} — not accessible.",
            "Page responded with HTTP 200, confirming it is reachable by crawlers and users.",
            f"Page returned HTTP {analysis.get('status_code', '?')}, preventing indexing.",
            "Fix server configuration or check that the URL is correct and publicly accessible.",
        ),
        (
            "Title Tag Present", "meta",
            bool(analysis["title"]),
            f'Title found: "{analysis["title"]}"' if analysis["title"] else "No <title> tag found — required for search engine indexing.",
            "A <title> tag is present, helping search engines understand the page topic.",
            "No <title> tag was found. This is a critical SEO element required for indexing.",
            "Add a <title> tag inside the <head> with a descriptive, keyword-rich title (30-60 chars).",
        ),
        (
            "Title Length Optimal", "meta",
            30 <= title_len <= 60 if analysis["title"] else False,
            f"Title is {title_len} characters — optimal range is 30-60 chars." if analysis["title"] else "No title to evaluate.",
            f"Title length ({title_len} chars) is within the 30-60 character optimal range.",
            f"Title is {title_len} chars — {'too short' if title_len < 30 else 'too long'}, may be truncated in SERPs.",
            "Rewrite the title to be between 30 and 60 characters, including primary keywords.",
        ),
        (
            "Meta Description Present", "meta",
            bool(analysis["meta_description"]),
            f'Meta description: "{analysis["meta_description"][:80]}..."' if analysis["meta_description"] else "No meta description — Google may auto-generate a poor snippet.",
            "A meta description is present, improving click-through rates in search results.",
            "No meta description found. Google will auto-generate one, often with poor quality.",
            "Add a <meta name='description'> tag with a compelling summary (70-160 chars).",
        ),
        (
            "Meta Description Length Optimal", "meta",
            70 <= desc_len <= 160 if analysis["meta_description"] else False,
            f"Meta description is {desc_len} chars — optimal range is 70-160 chars." if analysis["meta_description"] else "No meta description to evaluate.",
            f"Meta description length ({desc_len} chars) is within the optimal 70-160 character range.",
            f"Meta description is {desc_len} chars — {'too short' if desc_len < 70 else 'too long'} and may be cut off in search results.",
            "Revise meta description to between 70 and 160 characters, including a call to action.",
        ),
        (
            "Single H1 Tag", "structure",
            h1_count == 1,
            f'H1 found: "{analysis["h1_tags"][0][:60]}"' if h1_count == 1 else f"{h1_count} H1 tags found — there should be exactly one.",
            "Exactly one H1 tag found, correctly signaling the main topic to search engines.",
            f"{'No H1 tag found' if h1_count == 0 else f'{h1_count} H1 tags found'} — search engines expect exactly one.",
            "Ensure exactly one H1 tag exists per page, containing the primary keyword.",
        ),
        (
            "H2 Tags Present", "structure",
            h2_count > 0,
            f"{h2_count} H2 subheading(s) found — good content structure." if h2_count > 0 else "No H2 tags found — add subheadings to improve content structure.",
            f"{h2_count} H2 tags found, indicating well-structured content hierarchy.",
            "No H2 subheadings detected, which weakens content structure and keyword distribution.",
            "Add H2 tags to break content into logical sections with descriptive, keyword-rich headings.",
        ),
        (
            "All Images Have Alt Text", "accessibility",
            img_miss == 0 and img_total > 0,
            f"All {img_total} image(s) have alt attributes — good for accessibility & SEO." if img_miss == 0 and img_total > 0 else f"{img_miss}/{img_total} image(s) missing alt text — required for accessibility.",
            f"All {img_total} images have alt attributes, supporting accessibility and image search indexing.",
            f"{img_miss} out of {img_total} images are missing alt text, harming accessibility and SEO.",
            "Add descriptive alt attributes to all <img> tags, describing image content with relevant keywords.",
        ),
        (
            "Viewport Meta Tag", "mobile",
            analysis["has_viewport_meta"],
            "Viewport meta tag present — page is mobile-friendly." if analysis["has_viewport_meta"] else "Missing viewport meta — page will not render correctly on mobile devices.",
            "Viewport meta tag is present, ensuring correct rendering on mobile devices.",
            "No viewport meta tag found — mobile users will see a desktop-sized page.",
            "Add <meta name='viewport' content='width=device-width, initial-scale=1'> inside <head>.",
        ),
        (
            "Canonical URL Defined", "technical",
            analysis["has_canonical"],
            f'Canonical URL: {analysis["canonical_url"]}' if analysis["has_canonical"] else "No canonical URL — may cause duplicate content issues.",
            "Canonical URL is defined, preventing duplicate content penalties from search engines.",
            "No canonical URL specified, risking duplicate content issues across multiple URLs.",
            "Add <link rel='canonical' href='your-preferred-url'> to the <head> section.",
        ),
        (
            "Open Graph Tags Present", "social",
            analysis["has_og_tags"],
            f'OG Title: "{analysis["og_title"]}" — social sharing is optimized.' if analysis["has_og_tags"] else "No Open Graph tags — links shared on Facebook/LinkedIn will look plain.",
            "Open Graph tags are present, enabling rich previews when shared on social media.",
            "No Open Graph tags found — social shares will display plain text without preview images.",
            "Add og:title, og:description, og:image, and og:url meta tags to the <head> section.",
        ),
        (
            "Schema Markup Present", "technical",
            analysis["has_schema_markup"],
            "Schema.org structured data found — helps Google show rich results." if analysis["has_schema_markup"] else "No Schema.org markup — add JSON-LD to enable rich snippets in Google.",
            "Schema.org structured data is present, enabling rich snippets in Google search results.",
            "No structured data found. Google cannot show rich results (ratings, FAQs, breadcrumbs).",
            "Add JSON-LD structured data using Schema.org types appropriate for your content.",
        ),
        (
            "robots.txt Found", "technical",
            analysis["has_robots_txt"],
            "robots.txt found — search engine crawlers are properly guided." if analysis["has_robots_txt"] else "No robots.txt — search engines may crawl unwanted pages.",
            "robots.txt is present, providing crawler guidance and preventing indexing of unwanted pages.",
            "No robots.txt found — search engines may crawl and index unintended pages.",
            "Create a /robots.txt file at your domain root defining crawl rules and sitemap location.",
        ),
        (
            "sitemap.xml Found", "technical",
            analysis["has_sitemap"],
            "sitemap.xml found — helps search engines discover all pages." if analysis["has_sitemap"] else "No sitemap.xml — submit one to Google Search Console for better indexing.",
            "sitemap.xml is present, helping search engines discover and index all pages efficiently.",
            "No sitemap.xml found — search engines may miss important pages.",
            "Generate a sitemap.xml and submit it to Google Search Console for faster indexing.",
        ),
        (
            "Sufficient Word Count", "content",
            words >= 300,
            f"{words} words detected — good content volume for SEO." if words >= 300 else f"Only {words} words — Google prefers pages with 300+ words of content.",
            f"Page has {words} words, meeting the 300+ word threshold for adequate content depth.",
            f"Only {words} words detected. Thin content pages rank poorly in search results.",
            "Expand page content to at least 300 words, focusing on relevant, informative text.",
        ),
        (
            "Fast Page Load (<3000ms)", "performance",
            load_time is not None and load_time < 3000,
            f"Page loaded in {load_time}ms — fast load improves ranking and user experience." if load_time is not None and load_time < 3000 else f"Page loaded in {load_time}ms — slow load hurts SEO ranking (target: <3000ms).",
            f"Page loaded in {load_time}ms, well within the 3000ms threshold for good Core Web Vitals.",
            f"Page load time is {load_time}ms, exceeding the 3000ms threshold and hurting rankings.",
            "Optimize images, enable caching, use a CDN, and minify CSS/JS to reduce load time.",
        ),
    ]

    # Generate AI analyses in batch via Groq
    ai_analyses = _generate_per_test_analyses(checks)

    test_cases = []
    for idx, (name, category, passed, detail, rc_pass, rc_fail, fix) in enumerate(checks):
        ai = ai_analyses.get(idx, {})
        test_cases.append({
            "name":     name,
            "category": category,
            "status":   "pass" if passed else "fail",
            "suite":    detail,
            "detail":   detail,
            "duration": "—",
            "ai_analysis": {
                "severity":   "low" if passed else ("high" if category in ["security", "technical"] else "medium"),
                "root_cause": ai.get("root_cause", rc_pass if passed else rc_fail),
                "fix":        ai.get("fix", "Continue maintaining this SEO best practice." if passed else fix),
            },
        })

    return test_cases

# ── Generate standalone Python script (Requests + BeautifulSoup) ────────────
def _generate_seo_script(url: str) -> str:
    return f'''"""
NexTest - SEO Audit Script
Generated automatically — Framework: Requests + BeautifulSoup
Target URL: {url}
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import time


TARGET_URL = "{url}"


def run_seo_audit(url):
    results = []
    parsed = urlparse(url)
    base_url = f"{{parsed.scheme}}://{{parsed.netloc}}"

    # 1. Fetch the page
    start = time.time()
    try:
        resp = requests.get(url, timeout=15, headers={{"User-Agent": "Mozilla/5.0"}})
        load_time_ms = round((time.time() - start) * 1000)
        status_code = resp.status_code
        html = resp.text
    except Exception as e:
        print(f"ERROR fetching {{url}}: {{e}}")
        return results

    soup = BeautifulSoup(html, "html.parser")

    # 2. HTTPS
    https = parsed.scheme == "https"
    results.append(("HTTPS Enabled", https, f"Scheme: {{parsed.scheme}}"))

    # 3. Accessibility
    accessible = status_code == 200
    results.append(("Page Accessible", accessible, f"HTTP {{status_code}}"))

    # 4. Title
    title_tag = soup.find("title")
    title = title_tag.text.strip() if title_tag else ""
    results.append(("Title Tag Present", bool(title), f'Title: "{{title}}"'))
    results.append(("Title Length Optimal", 30 <= len(title) <= 60, f"Length: {{len(title)}} chars"))

    # 5. Meta description
    meta_desc_tag = soup.find("meta", attrs={{"name": "description"}})
    meta_desc = meta_desc_tag["content"].strip() if meta_desc_tag and meta_desc_tag.get("content") else ""
    results.append(("Meta Description Present", bool(meta_desc), f"Length: {{len(meta_desc)}} chars"))
    results.append(("Meta Description Length Optimal", 70 <= len(meta_desc) <= 160, f"Length: {{len(meta_desc)}} chars"))

    # 6. H1 / H2
    h1_tags = soup.find_all("h1")
    h2_tags = soup.find_all("h2")
    results.append(("Single H1 Tag", len(h1_tags) == 1, f"{{len(h1_tags)}} H1 tag(s) found"))
    results.append(("H2 Tags Present", len(h2_tags) > 0, f"{{len(h2_tags)}} H2 tag(s) found"))

    # 7. Images alt text
    images = soup.find_all("img")
    images_missing_alt = sum(1 for img in images if not img.get("alt"))
    results.append((
        "All Images Have Alt Text",
        images_missing_alt == 0 and len(images) > 0,
        f"{{images_missing_alt}}/{{len(images)}} missing alt"
    ))

    # 8. Viewport meta
    viewport = soup.find("meta", attrs={{"name": "viewport"}})
    results.append(("Viewport Meta Tag", viewport is not None, "Mobile-friendly viewport tag"))

    # 9. Canonical URL
    canonical = soup.find("link", attrs={{"rel": "canonical"}})
    results.append(("Canonical URL Defined", canonical is not None, f"Canonical: {{canonical.get('href') if canonical else 'N/A'}}"))

    # 10. Open Graph
    og_title = soup.find("meta", attrs={{"property": "og:title"}})
    results.append(("Open Graph Tags Present", og_title is not None, f"OG Title: {{og_title.get('content') if og_title else 'N/A'}}"))

    # 11. Schema markup
    schema = soup.find("script", attrs={{"type": "application/ld+json"}})
    results.append(("Schema Markup Present", schema is not None, "JSON-LD structured data"))

    # 12. robots.txt
    try:
        robots_resp = requests.get(urljoin(base_url, "/robots.txt"), timeout=10)
        has_robots = robots_resp.status_code == 200
    except Exception:
        has_robots = False
    results.append(("robots.txt Found", has_robots, "Crawler directives file"))

    # 13. sitemap.xml
    try:
        sitemap_resp = requests.get(urljoin(base_url, "/sitemap.xml"), timeout=10)
        has_sitemap = sitemap_resp.status_code == 200
    except Exception:
        has_sitemap = False
    results.append(("sitemap.xml Found", has_sitemap, "XML sitemap for crawlers"))

    # 14. Word count
    text = soup.get_text(separator=" ", strip=True)
    word_count = len(text.split())
    results.append(("Sufficient Word Count", word_count >= 300, f"{{word_count}} words"))

    # 15. Load time
    results.append(("Fast Page Load (<3000ms)", load_time_ms < 3000, f"{{load_time_ms}}ms"))

    return results


def print_report(results):
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print("=" * 60)
    print(f"SEO AUDIT REPORT — {{TARGET_URL}}")
    print("=" * 60)
    for name, ok, detail in results:
        status = "PASS" if ok else "FAIL"
        print(f"[{{status}}] {{name}} — {{detail}}")
    print("-" * 60)
    print(f"Score: {{passed}}/{{total}} checks passed ({{round(passed/total*100)}}%)")
    print("=" * 60)


if __name__ == "__main__":
    results = run_seo_audit(TARGET_URL)
    print_report(results)
'''
# ── Main runner ───────────────────────────────────────────────────────────────
def run_seo_test(url: str) -> dict:
    started_at = datetime.now().isoformat()

    try:
        analysis  = analyze_seo(url)
        score     = compute_seo_score(analysis)
        ai_result = _generate_seo_recommendations(analysis, score)
        test_cases = _build_test_cases(analysis, ai_result)

        total  = len(test_cases)
        passed = sum(1 for t in test_cases if t["status"] == "pass")
        failed = total - passed

        return {
            "success":     True,
            "url":         url,
            "started_at":  started_at,
            "finished_at": datetime.now().isoformat(),
            "seo_score":   score,
            "summary": {
                "total":     total,
                "passed":    passed,
                "failed":    failed,
                "pass_rate": round((passed / total) * 100, 1) if total > 0 else 0,
            },
            "analysis":   analysis,
            "test_cases": test_cases,
            "ai":         ai_result,
            "script":     _generate_seo_script(url),
        }

    except Exception as e:
        return {
            "success":     False,
            "url":         url,
            "started_at":  started_at,
            "finished_at": datetime.now().isoformat(),
            "error":       str(e),
            "traceback":   traceback.format_exc(),
            "seo_score":   0,
            "summary":     {"total": 0, "passed": 0, "failed": 0, "pass_rate": 0},
            "analysis":    {},
            "test_cases":  [],
            "ai":          {"summary": "Error occurred", "recommendations": [], "action_plan": []},
        }