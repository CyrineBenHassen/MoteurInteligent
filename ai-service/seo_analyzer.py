import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import time
import re
from playwright.sync_api import sync_playwright

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError



import ssl
import requests.adapters

class LegacySSLAdapter(requests.adapters.HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        ctx.options |= 0x4  # SSL_OP_LEGACY_SERVER_CONNECT
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)
    
def _fetch_rendered_page(url: str, timeout_ms: int = 15000, load_time_runs: int = 3):
    load_times = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent="Mozilla/5.0 (compatible; NexTestSEOBot/1.0)",
            viewport={"width": 1366, "height": 768},
        )
        html = None
        status_code = None
        screenshot_bytes = None
        for i in range(load_time_runs):
            start = time.time()
            resp = page.goto(url, timeout=timeout_ms, wait_until="load")
            elapsed = round((time.time() - start) * 1000)
            load_times.append(elapsed)
            if i == load_time_runs - 1:
                status_code = resp.status if resp else 200
                html = page.content()
                page.wait_for_timeout(1500)
                try:
                    screenshot_bytes = page.screenshot(full_page=False, type="png")
                except Exception as e:
                    print(f"[SEO DEBUG] Screenshot capture failed: {e}")
        browser.close()
        median_load_time = sorted(load_times)[len(load_times) // 2]
    return status_code, html, screenshot_bytes, median_load_time

def analyze_seo(url: str) -> dict:
    """
    Full SEO analysis of a given public URL.
    Returns a structured dict with all SEO checks.
    """
    results = {
        "url": url,
        "accessible": False,
        "status_code": None,
        "https": False,
        "load_time_ms": None,
        "title": None,
        "title_length": 0,
        "meta_description": None,
        "meta_description_length": 0,
        "meta_keywords": None,
        "h1_tags": [],
        "h2_tags": [],
        "h3_tags": [],
        "images_total": 0,
        "images_missing_alt": 0,
        "images_missing_alt_list": [],
        "internal_links": 0,
        "external_links": 0,
        "broken_links": [],
        "has_robots_txt": False,
        "has_sitemap": False,
        "has_viewport_meta": False,
        "has_canonical": False,
        "canonical_url": None,
        "has_og_tags": False,
        "og_title": None,
        "og_description": None,
        "has_schema_markup": False,
        "word_count": 0,
        "screenshot": None,
        "issues": [],
        "warnings": [],
        "passed": [],
    }

    #HTTPS check
    parsed = urlparse(url)
    results["https"] = parsed.scheme == "https"
    if results["https"]:
        results["passed"].append("HTTPS enabled")
    else:
        results["issues"].append("Site is not using HTTPS")

    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_fetch_rendered_page, url, 15000)
            status_code, html, screenshot_bytes, median_load_time = future.result(timeout=45)

        elapsed = median_load_time
        results["load_time_ms"] = elapsed
        
        results["status_code"] = status_code
        results["accessible"] = status_code == 200
        results["screenshot"] = screenshot_bytes

        if status_code != 200:
            print(f"[SEO DEBUG] Non-200 response: {status_code} for {url}")
            results["issues"].append(f"Page returned status code {status_code}")
            return results

        if elapsed > 3000:
            results["issues"].append(f"Slow page load: {elapsed}ms (should be < 3000ms)")
        elif elapsed > 1500:
            results["warnings"].append(f"Page load time is {elapsed}ms (recommended < 1500ms)")
        else:
            results["passed"].append(f"Good page load time: {elapsed}ms")

    except Exception as e:
        print(f"[SEO DEBUG] EXCEPTION during fetch: {type(e).__name__}: {e}")
        results["issues"].append(f"Page not accessible: {str(e)}")
        return results

    soup = BeautifulSoup(html, "html.parser")

    #Title
    title_tag = soup.find("title")
    if title_tag and title_tag.text.strip():
        results["title"] = title_tag.text.strip()
        results["title_length"] = len(results["title"])
        if results["title_length"] < 30:
            results["warnings"].append(f"Title too short ({results['title_length']} chars, recommended 30-60)")
        elif results["title_length"] > 60:
            results["warnings"].append(f"Title too long ({results['title_length']} chars, recommended 30-60)")
        else:
            results["passed"].append(f"Title length is good ({results['title_length']} chars)")
    else:
        results["issues"].append("Missing <title> tag")

    #Meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content", "").strip():
        results["meta_description"] = meta_desc["content"].strip()
        results["meta_description_length"] = len(results["meta_description"])
        if results["meta_description_length"] < 70:
            results["warnings"].append(f"Meta description too short ({results['meta_description_length']} chars, recommended 70-160)")
        elif results["meta_description_length"] > 160:
            results["warnings"].append(f"Meta description too long ({results['meta_description_length']} chars, recommended 70-160)")
        else:
            results["passed"].append(f"Meta description length is good ({results['meta_description_length']} chars)")
    else:
        results["issues"].append("Missing meta description")

    #Meta keywords
    meta_kw = soup.find("meta", attrs={"name": "keywords"})
    if meta_kw and meta_kw.get("content", "").strip():
        results["meta_keywords"] = meta_kw["content"].strip()
        results["passed"].append("Meta keywords present")
    else:
        results["warnings"].append("Meta keywords not found (optional but recommended)")

    #Headings
    results["h1_tags"] = [h.text.strip() for h in soup.find_all("h1")]
    results["h2_tags"] = [h.text.strip() for h in soup.find_all("h2")]
    results["h3_tags"] = [h.text.strip() for h in soup.find_all("h3")]

    if len(results["h1_tags"]) == 0:
        results["issues"].append("No H1 tag found")
    elif len(results["h1_tags"]) > 1:
        results["warnings"].append(f"Multiple H1 tags found ({len(results['h1_tags'])}), should have only one")
    else:
        results["passed"].append("Exactly one H1 tag found")

    if len(results["h2_tags"]) == 0:
        results["warnings"].append("No H2 tags found — consider adding subheadings")
    else:
        results["passed"].append(f"{len(results['h2_tags'])} H2 tags found")

    #Images
    images = soup.find_all("img")
    results["images_total"] = len(images)
    for img in images:
        alt = img.get("alt", "").strip()
        if not alt:
            src = img.get("src", "unknown")
            results["images_missing_alt_list"].append(src)
    results["images_missing_alt"] = len(results["images_missing_alt_list"])

    if results["images_missing_alt"] == 0 and results["images_total"] > 0:
        results["passed"].append(f"All {results['images_total']} images have alt attributes")
    elif results["images_missing_alt"] > 0:
        results["issues"].append(f"{results['images_missing_alt']} image(s) missing alt attribute")

    #Links
    base_domain = parsed.netloc
    all_links = soup.find_all("a", href=True)
    for link in all_links:
        href = link["href"]
        full_url = urljoin(url, href)
        link_domain = urlparse(full_url).netloc
        if link_domain == base_domain:
            results["internal_links"] += 1
        else:
            results["external_links"] += 1

    if results["internal_links"] > 0:
        results["passed"].append(f"{results['internal_links']} internal links found")
    else:
        results["warnings"].append("No internal links found")

    #Viewport meta
    viewport = soup.find("meta", attrs={"name": "viewport"})
    if viewport:
        results["has_viewport_meta"] = True
        results["passed"].append("Viewport meta tag present (mobile-friendly)")
    else:
        results["issues"].append("Missing viewport meta tag (not mobile-friendly)")

    #Canonical
    canonical = soup.find("link", attrs={"rel": "canonical"})
    if canonical and canonical.get("href"):
        results["has_canonical"] = True
        results["canonical_url"] = canonical["href"]
        results["passed"].append("Canonical URL defined")
    else:
        results["warnings"].append("No canonical URL defined")

    #Open Graph tags
    og_title = soup.find("meta", attrs={"property": "og:title"})
    og_desc = soup.find("meta", attrs={"property": "og:description"})
    if og_title or og_desc:
        results["has_og_tags"] = True
        results["og_title"] = og_title["content"] if og_title else None
        results["og_description"] = og_desc["content"] if og_desc else None
        results["passed"].append("Open Graph tags present")
    else:
        results["warnings"].append("No Open Graph (og:) tags found — affects social media sharing")

    #Schema markup
    schema = soup.find("script", attrs={"type": "application/ld+json"})
    if schema:
        results["has_schema_markup"] = True
        results["passed"].append("Schema.org structured data found")
    else:
        results["warnings"].append("No Schema.org structured data found")

    #Word count
    body_text = soup.get_text(separator=" ", strip=True)
    words = re.findall(r'\b\w+\b', body_text)
    results["word_count"] = len(words)
    if results["word_count"] < 300:
        results["warnings"].append(f"Low word count: {results['word_count']} words (recommended 300+)")
    else:
        results["passed"].append(f"Good word count: {results['word_count']} words")

   # Robots.txt
    try:
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        session = requests.Session()
        session.mount("https://", LegacySSLAdapter())
        r = session.get(robots_url, timeout=5, headers={"User-Agent": "Mozilla/5.0 (compatible; NexTestSEOBot/1.0)"})
        if r.status_code == 200 and "user-agent" in r.text.lower():
            results["has_robots_txt"] = True
            results["passed"].append("robots.txt found")
        else:
            results["warnings"].append("robots.txt not found or invalid")
    except requests.exceptions.RequestException as e:
        results["warnings"].append(f"Could not check robots.txt: {e}")

    # Sitemap
    try:
        sitemap_url = f"{parsed.scheme}://{parsed.netloc}/sitemap.xml"
        session = requests.Session()
        session.mount("https://", LegacySSLAdapter())
        r = session.get(sitemap_url, timeout=5, headers={"User-Agent": "Mozilla/5.0 (compatible; NexTestSEOBot/1.0)"})
        content_lower = r.text.lower()
        if r.status_code == 200 and ("urlset" in content_lower or "sitemapindex" in content_lower):
            results["has_sitemap"] = True
            results["passed"].append("sitemap.xml found")
        else:
            results["warnings"].append("sitemap.xml not found")
    except requests.exceptions.RequestException as e:
        results["warnings"].append(f"Could not check sitemap.xml: {e}")

    return results

    


def compute_seo_score(analysis: dict) -> int:
    """
    Compute a simple SEO score out of 100 based on issues/warnings/passed.
    """
    total_checks = len(analysis["issues"]) + len(analysis["warnings"]) + len(analysis["passed"])
    if total_checks == 0:
        return 0
    score = round((len(analysis["passed"]) / total_checks) * 100)
    return score