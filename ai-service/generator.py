# generator.py — v8
# Key change: smoke tests now use REAL scraped data (nav_links, images_audit, buttons, icons, pagination)
# instead of only generic hardcoded selectors.
# LLM is still used for functional/regression only.
import os, json, re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

# ─────────────────────────────────────────────────────────────────────────────
# Criticality tiers
# ─────────────────────────────────────────────────────────────────────────────
SMOKE_CRITICALITY = {
    "auth_trigger":  {"score": 100, "label": "Auth entry point",   "tier": 1},
    "primary_cta":   {"score": 95,  "label": "Primary CTA",        "tier": 1},
    "main_nav":      {"score": 90,  "label": "Main navigation",    "tier": 1},
    "core_content":  {"score": 85,  "label": "Core content area",  "tier": 1},
    "page_identity": {"score": 80,  "label": "Page identity (h1)", "tier": 1},
    "input_field":   {"score": 72,  "label": "Form input field",   "tier": 2},
    "search_bar":    {"score": 68,  "label": "Search bar",         "tier": 2},
    "lang_switch":   {"score": 66,  "label": "Language switcher",  "tier": 2},
    "hero":          {"score": 65,  "label": "Hero / banner",      "tier": 2},
    "logo":          {"score": 60,  "label": "Brand identity",     "tier": 2},
    "image_visible": {"score": 45,  "label": "Image visible",      "tier": 2},
    "icon_present":  {"score": 35,  "label": "Icon/SVG rendered",  "tier": 3},
    "footer":        {"score": 30,  "label": "Footer",             "tier": 3},
    "generic_nav":   {"score": 25,  "label": "Generic nav",        "tier": 3},
}

SMOKE_MAX_STEPS = 15   # v9: increased from 12 to 15 to cover more real page elements
SMOKE_MIN_STEPS = 3
SMOKE_MAX_TIER  = 2

OPTIONAL_TYPES = frozenset({
    "lang_switch", "search_bar", "image_visible", "icon_present", "input_field"
})

# ─────────────────────────────────────────────────────────────────────────────
# CSS fallback selectors
# ─────────────────────────────────────────────────────────────────────────────
CSS = {
    "lang_switch": (
        ".pll-parent-menu-item, .wpml-ls-item, "
        "[class*='lang-switch'], [class*='language-switch'], [class*='lang-selector'], "
        "[class*='language-selector'], [id*='lang-switch'], "
        "a[hreflang], "
        "a[href*='/fr'], a[href*='/en'], a[href*='/ar'], a[href*='/de'], "
        "a[href*='lang=fr'], a[href*='lang=en'], a[href*='lang=ar'], "
        "select[name*='lang' i], select[id*='lang' i]"
    ),
    "search_bar": (
        "form[role='search'], form[action*='search'], "
        "[class*='search-form'], [class*='searchform'], "
        "[id*='search-form'], [id*='searchform'], "
        "[class*='search-bar'], [class*='search-box'], "
        "input[type='search'], input[name='s'], "
        "input[placeholder*='search' i], input[placeholder*='recherche' i], "
        "input[placeholder*='chercher' i], input[placeholder*='بحث' i]"
    ),
    "image_visible": (
        "main img, article img, .content img, "
        "[class*='hero'] img, [class*='banner'] img, "
        "img[src]:not([src='']):not([width='1']):not([height='1'])"
    ),
    "icon_font": (
        "i[class*='fa'], i[class*='icon'], i[class*='bi'], i[class*='ri'], "
        "[class*='fa-'], [class*='icon-'], [class*='bi-'], [class*='material-icon']"
    ),
    "input_field": (
        "form input[type='email'], form input[type='text'], "
        "form textarea, form select, "
        "input[type='email'], input[type='text'], textarea"
    ),
}


# ─────────────────────────────────────────────────────────────────────────────
# Page profile classifier
# ─────────────────────────────────────────────────────────────────────────────
def _classify_page_profile(scraped: dict) -> str:
    has_inputs = any(
        i.get("css_selector") and i.get("type") not in {"hidden", "submit", "button", "reset"}
        for i in scraped.get("inputs", [])
    )
    has_forms   = bool(scraped.get("forms"))
    has_nav     = any(
        n.get("href") and n.get("text", "").strip()
        and n["href"].rstrip("/").split("/")[-1] not in ("", "#", "pll_switcher")
        for n in scraped.get("nav_links", [])
    )
    has_buttons = bool(scraped.get("buttons"))
    if has_inputs or has_forms:
        return "rich"
    if has_nav or has_buttons:
        return "nav_only"
    return "static"


def _extract_clickable_nav(scraped: dict, max_links: int = 6) -> list:
    results     = []
    seen_slugs  = set()
    base_domain = ""
    if "//" in scraped.get("url", ""):
        base_domain = scraped["url"].split("/")[2]
    for n in scraped.get("nav_links", []):
        href = n.get("href", "").strip()
        text = n.get("text", "").strip()
        if not href or not text:
            continue
        slug = href.rstrip("/").split("/")[-1]
        if not slug or slug in ("#", "pll_switcher", ""):
            continue
        if href.startswith("http") and base_domain and base_domain not in href:
            continue
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        results.append({"css": f"a[href*='{slug}']", "text": text, "slug": slug, "href": href})
        if len(results) >= max_links:
            break
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Individual detectors (existing)
# ─────────────────────────────────────────────────────────────────────────────
def _pick_selector(scraped_items: list, fallback_css: str) -> str:
    for item in scraped_items:
        sel = (item.get("css_selector") or "").strip()
        if sel:
            return sel
    return fallback_css


def _detect_auth(scraped: dict) -> list:
    auth_kw = {"login", "signin", "sign-in", "register", "signup", "sign-up",
               "account", "connexion", "inscription", "تسجيل", "دخول", "حساب"}
    for btn in scraped.get("buttons", []):
        text = btn.get("text", "").lower().strip()
        if any(k in text for k in auth_kw) and btn.get("css_selector"):
            return [{"name": f"Auth entry: {btn['text'][:40]}", "selector": btn["css_selector"],
                     "type": "auth_trigger", "tier": 1, "optional": False,
                     "reason": "Auth entry point — users cannot log in if missing"}]
    for nav in scraped.get("nav_links", []):
        text = nav.get("text", "").lower()
        href = nav.get("href", "").lower()
        if any(k in text or k in href for k in auth_kw):
            slug = nav["href"].rstrip("/").split("/")[-1]
            if slug:
                return [{"name": f"Auth link: {nav['text'][:40]}",
                         "selector": f"a[href*='{slug}']",
                         "type": "auth_trigger", "tier": 1, "optional": False,
                         "reason": "Auth navigation — critical for user access"}]
    return []


def _detect_primary_cta(scraped: dict) -> list:
    cta_kw = {"get started", "start", "try", "demo", "buy", "shop", "book",
              "order", "subscribe", "download", "contact", "learn more", "explore"}
    for btn in scraped.get("buttons", []):
        text = btn.get("text", "").lower().strip()
        css  = btn.get("css_selector", "")
        if not css or not text:
            continue
        is_primary  = any(k in css.lower() for k in ["primary", "cta", "btn-main", "hero", "action"])
        is_cta_text = any(k in text for k in cta_kw)
        if is_primary or is_cta_text:
            return [{"name": f"Primary CTA: {btn['text'][:40]}", "selector": css,
                     "type": "primary_cta", "tier": 1, "optional": False,
                     "reason": "Primary CTA — signals core feature is reachable"}]
    return []


def _detect_lang_switch(scraped: dict) -> list:
    items = scraped.get("lang_switcher", [])
    if items:
        sel  = _pick_selector(items, CSS["lang_switch"])
        lang = (items[0].get("text") or items[0].get("hreflang") or "LANG").upper()
        return [{"name": f"Language switcher ({lang})", "selector": sel,
                 "type": "lang_switch", "tier": 2, "optional": True,
                 "reason": "Lang switcher present — i18n routing is operational"}]
    locale_texts = {"fr", "en", "ar", "de", "es", "it", "nl", "pt"}
    locale_hrefs = ["/fr", "/en", "/ar", "/de", "lang=fr", "lang=en", "lang=ar"]
    for nav in scraped.get("nav_links", []):
        text = nav.get("text", "").strip().lower()
        href = nav.get("href", "").lower()
        if text in locale_texts or any(p in href for p in locale_hrefs):
            slug = nav["href"].rstrip("/").split("/")[-1]
            sel  = f"a[href*='{slug}']" if slug else CSS["lang_switch"]
            return [{"name": f"Language switcher ({nav['text'].upper()})", "selector": sel,
                     "type": "lang_switch", "tier": 2, "optional": True,
                     "reason": "Lang switcher present — i18n routing is operational"}]
    return [{"name": "Language switcher (if present)", "selector": CSS["lang_switch"],
             "type": "lang_switch", "tier": 2, "optional": True,
             "reason": "Lang switcher — i18n routing health check"}]


def _detect_search_bar(scraped: dict) -> list:
    bars = scraped.get("search_bar", [])
    if bars:
        sel = _pick_selector(bars, CSS["search_bar"])
        return [{"name": "Search bar", "selector": sel,
                 "type": "search_bar", "tier": 2, "optional": True,
                 "reason": "Search form present — content discovery is rendered"}]
    inputs = scraped.get("search_inputs", [])
    if inputs:
        sel = _pick_selector(inputs, "input[type='search']")
        return [{"name": "Search input", "selector": sel,
                 "type": "search_bar", "tier": 2, "optional": True,
                 "reason": "Search input present — content discovery is available"}]
    return [{"name": "Search bar (if present)", "selector": CSS["search_bar"],
             "type": "search_bar", "tier": 2, "optional": True,
             "reason": "Search bar — content discovery health check"}]


def _detect_images(scraped: dict) -> list:
    audit = scraped.get("images_audit", [])
    best  = next(
        (img for img in audit
         if img.get("loaded") and img.get("css_selector") and img.get("src")
         and img.get("width", 0) > 20),
        None
    )
    if best:
        note = "has alt" if best.get("has_alt") else "no alt"
        return [{"name": f"Content image visible ({note})", "selector": best["css_selector"],
                 "type": "image_visible", "tier": 2, "optional": True,
                 "reason": "Image rendered — CDN and media pipeline are operational"}]
    raw    = scraped.get("images", [])
    loaded = [img for img in raw if img.get("loaded") and img.get("src")]
    if loaded:
        alt  = loaded[0].get("alt", "")
        src  = loaded[0].get("src", "")
        if alt and len(alt) < 60:
            sel = "img[alt='{}']".format(alt.replace("'", ""))
        elif src:
            frag = src.split("/")[-1].split("?")[0][:30]
            sel  = f"img[src*='{frag}']" if frag else "img"
        else:
            sel = "img"
        return [{"name": "Content image visible", "selector": sel,
                 "type": "image_visible", "tier": 2, "optional": True,
                 "reason": "Image rendered — CDN and media pipeline are operational"}]
    return [{"name": "Content images (if present)", "selector": CSS["image_visible"],
             "type": "image_visible", "tier": 2, "optional": True,
             "reason": "Image visibility — media pipeline health check"}]


def _detect_icons(scraped: dict) -> list:
    icons = scraped.get("icons", [])
    if icons:
        svg_first = sorted(icons, key=lambda ic: 0 if ic.get("kind") == "svg" else 1)
        sel  = svg_first[0].get("css_selector", "svg")
        kind = svg_first[0].get("kind", "svg")
        return [{"name": f"Icon rendered ({kind})", "selector": sel,
                 "type": "icon_present", "tier": 3, "optional": True,
                 "reason": f"{kind} icon visible — icon sprite/font loaded"}]
    return [{"name": "SVG/font icon (if present)",
             "selector": "svg, " + CSS["icon_font"],
             "type": "icon_present", "tier": 3, "optional": True,
             "reason": "Icon presence — icon font/SVG sprite loaded"}]


def _detect_input_fields(scraped: dict) -> list:
    fields         = scraped.get("input_fields", [])
    priority_roles = ["email", "name", "message", "subject", "phone", "textarea", "text"]
    best = next(
        (f for role in priority_roles
         for f in fields if f.get("role") == role and f.get("visible") and f.get("css_selector")),
        fields[0] if fields else None
    )
    if best:
        sel  = best["css_selector"]
        role = best.get("role", "input")
        req  = " (required)" if best.get("required") else ""
        return [{"name": f"Form field visible ({role}{req})", "selector": sel,
                 "type": "input_field", "tier": 2, "optional": True,
                 "reason": f"Form input '{role}' present — form rendered correctly"}]
    skip = {"hidden", "submit", "button", "reset"}
    raw  = [i for i in scraped.get("inputs", [])
            if i.get("css_selector") and i.get("type") not in skip]
    if raw:
        return [{"name": f"Form input visible ({raw[0].get('type','text')})",
                 "selector": raw[0]["css_selector"],
                 "type": "input_field", "tier": 2, "optional": True,
                 "reason": "Form input present — form rendering confirmed"}]
    if scraped.get("forms"):
        return [{"name": "Form input field", "selector": CSS["input_field"],
                 "type": "input_field", "tier": 2, "optional": True,
                 "reason": "Form input visible — form rendering confirmed"}]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# v8 NEW: Real page element detectors
# ─────────────────────────────────────────────────────────────────────────────
def _detect_real_nav_links(scraped: dict, max_links: int = 4) -> list:
    """v8: One smoke check per real nav link found by the scraper."""
    results     = []
    seen_slugs  = set()
    base_domain = ""
    if "//" in scraped.get("url", ""):
        base_domain = scraped["url"].split("/")[2]
    for nav in scraped.get("nav_links", []):
        href = nav.get("href", "").strip()
        text = nav.get("text", "").strip()
        if not href or not text:
            continue
        slug = href.rstrip("/").split("/")[-1]
        if not slug or slug in ("#", "pll_switcher", ""):
            continue
        if href.startswith("http") and base_domain and base_domain not in href:
            continue
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        results.append({
            "name":     f"Nav link visible: {text[:40]}",
            "selector": f"a[href*='{slug}']",
            "type":     "main_nav",
            "tier":     1,
            "optional": False,
            "score":    78,
            "reason":   f"Nav link '{text}' present — page routing confirmed",
        })
        if len(results) >= max_links:
            break
    return results


def _detect_real_buttons(scraped: dict, max_buttons: int = 3) -> list:
    """v8: One smoke check per real button found by the scraper."""
    results = []
    for btn in scraped.get("buttons", []):
        css  = btn.get("css_selector", "")
        text = btn.get("text", "").strip()
        if not css or not text or len(text) < 2:
            continue
        results.append({
            "name":     f"Button visible: {text[:40]}",
            "selector": css,
            "type":     "primary_cta",
            "tier":     1,
            "optional": True,
            "score":    70,
            "reason":   f"Button '{text}' present and rendered correctly",
        })
        if len(results) >= max_buttons:
            break
    return results


def _detect_real_images(scraped: dict, max_images: int = 3) -> list:
    """v8: One smoke check per real loaded image found by the scraper."""
    results         = []
    seen_selectors  = set()
    for img in scraped.get("images_audit", []):
        if not img.get("loaded") or not img.get("css_selector"):
            continue
        if img.get("width", 0) < 20:
            continue
        sel = img["css_selector"]
        if sel in seen_selectors:
            continue
        seen_selectors.add(sel)
        alt_text = img.get("alt", "").strip()
        note     = f"alt='{alt_text[:20]}'" if alt_text else "no alt"
        src_hint = img.get("src", "").split("/")[-1][:30]
        label    = alt_text[:30] if alt_text else src_hint
        results.append({
            "name":     f"Image visible ({note}): {label}",
            "selector": sel,
            "type":     "image_visible",
            "tier":     2,
            "optional": True,
            "score":    45,
            "reason":   "Image rendered — CDN and media pipeline operational",
        })
        if len(results) >= max_images:
            break
    return results


def _detect_real_icons(scraped: dict, max_icons: int = 2) -> list:
    """v8: One smoke check per real SVG/font icon found by the scraper."""
    results = []
    for icon in scraped.get("icons", []):
        css  = icon.get("css_selector", "")
        kind = icon.get("kind", "svg")
        if not css:
            continue
        results.append({
            "name":     f"Icon rendered ({kind})",
            "selector": css,
            "type":     "icon_present",
            "tier":     3,
            "optional": True,
            "score":    35,
            "reason":   f"{kind} icon visible — icon sprite/font loaded correctly",
        })
        if len(results) >= max_icons:
            break
    return results


def _detect_pagination(scraped: dict) -> list:
    """v8: Check pagination if scraper detected it."""
    if scraped.get("pagination"):
        return [{
            "name":     "Pagination present",
            "selector": ".pagination a, [class*='pagination'] a, [class*='page-item'] a",
            "type":     "core_content",
            "tier":     2,
            "optional": True,
            "score":    50,
            "reason":   "Pagination rendered — content listing operational",
        }]
    return []


def _detect_footer(scraped: dict) -> list:
    """v8: Check footer presence."""
    return [{
        "name":     "Footer present",
        "selector": "footer, [class*='footer'], #footer",
        "type":     "footer",
        "tier":     3,
        "optional": True,
        "score":    30,
        "reason":   "Footer rendered — page structure is complete",
    }]


# ─────────────────────────────────────────────────────────────────────────────
# DETERMINISTIC smoke builder — v8: uses real scraped data
# ─────────────────────────────────────────────────────────────────────────────
def _build_smoke_steps(scraped: dict) -> list:
    candidates = []

    # ── Tier 1: structural baseline (always present) ──────────────────────────
    candidates += [
        {"name": "Main navigation present",
         "selector": "nav, [class*='navbar'], [class*='nav-bar'], header nav",
         "type": "main_nav", "tier": 1, "optional": False,
         "score": SMOKE_CRITICALITY["main_nav"]["score"],
         "reason": "Navigation confirms routing system is operational"},
        {"name": "Page title (H1) present",
         "selector": "h1",
         "type": "page_identity", "tier": 1, "optional": False,
         "score": SMOKE_CRITICALITY["page_identity"]["score"],
         "reason": "H1 confirms correct page loaded with content"},
        {"name": "Main content area present",
         "selector": "main, [role='main'], #main, #content, .main-content",
         "type": "core_content", "tier": 1, "optional": False,
         "score": SMOKE_CRITICALITY["core_content"]["score"],
         "reason": "Content container confirms page rendering succeeded"},
    ]

    # ── Tier 1: auth + primary CTA ────────────────────────────────────────────
    for el in _detect_auth(scraped):
        candidates.append({**el, "score": SMOKE_CRITICALITY["auth_trigger"]["score"]})
    for el in _detect_primary_cta(scraped):
        candidates.append({**el, "score": SMOKE_CRITICALITY["primary_cta"]["score"]})

    # ── v9: Real nav links from scraper — increased to 6 ─────────────────────
    for el in _detect_real_nav_links(scraped, max_links=6):
        candidates.append(el)

    # ── v9: Real buttons from scraper ────────────────────────────────────────
    for el in _detect_real_buttons(scraped, max_buttons=4):
        candidates.append(el)

    # ── Tier 2: optional usability checks ────────────────────────────────────
    for el in _detect_input_fields(scraped):
        candidates.append({**el, "score": SMOKE_CRITICALITY["input_field"]["score"]})
    for el in _detect_search_bar(scraped):
        candidates.append({**el, "score": SMOKE_CRITICALITY["search_bar"]["score"]})
    for el in _detect_lang_switch(scraped):
        candidates.append({**el, "score": SMOKE_CRITICALITY["lang_switch"]["score"]})

    candidates += [
        {"name": "Hero section present",
         "selector": "[class*='hero'], [class*='banner'], [class*='jumbotron'], [class*='slider']",
         "type": "hero", "tier": 2, "optional": True,
         "score": SMOKE_CRITICALITY["hero"]["score"],
         "reason": "Hero section confirms above-the-fold content rendered"},
        {"name": "Brand logo present",
         "selector": (
             "img[alt*='logo' i], img[src*='logo' i], "
             "[class*='logo'] img, .logo img, .navbar-brand img, "
             "[class*='logo'] svg, header [class*='brand']"
         ),
         "type": "logo", "tier": 2, "optional": True,
         "score": SMOKE_CRITICALITY["logo"]["score"],
         "reason": "Logo confirms correct site identity"},
    ]

    # ── v9: Real images from images_audit — increased to 4 ───────────────────
    for el in _detect_real_images(scraped, max_images=4):
        candidates.append(el)

    # ── v9: Pagination + Footer (moved to tier 2) ────────────────────────────
    for el in _detect_pagination(scraped):
        candidates.append(el)
    for el in _detect_footer(scraped):
        el["tier"] = 2   # v9: promoted from tier 3 → tier 2 to ensure inclusion
        candidates.append(el)

    # ── Tier 3: icons ─────────────────────────────────────────────────────────
    for el in _detect_real_icons(scraped, max_icons=2):
        candidates.append(el)

    # ── Sort, deduplicate, enforce cap ────────────────────────────────────────
    candidates.sort(key=lambda x: x.get("score", 0), reverse=True)
    seen, unique = set(), []
    for c in candidates:
        key = c["selector"][:80]
        if key not in seen:
            seen.add(key)
            unique.append(c)

    tier_1_2 = [c for c in unique if c.get("tier", 3) <= SMOKE_MAX_TIER]
    tier_3   = [c for c in unique if c.get("tier", 3)  > SMOKE_MAX_TIER]
    final    = tier_1_2[:SMOKE_MAX_STEPS]
    if len(final) < SMOKE_MIN_STEPS:
        final.extend(tier_3[:SMOKE_MIN_STEPS - len(final)])

    # Stamp runner-required fields
    for i, step in enumerate(final, 1):
        step.setdefault("id",          i)
        step.setdefault("action",      "check_visible")
        step.setdefault("value",       "")
        step.setdefault("assertion",   None)
        step.setdefault("category",    "smoke")
        step.setdefault("priority",    "medium")
        step.setdefault("expected",    step.get("reason", "Element should be present"))
        step.setdefault("description", step["expected"])

    return final


# ─────────────────────────────────────────────────────────────────────────────
# LLM path — functional / regression only
# ─────────────────────────────────────────────────────────────────────────────
def _build_system_prompt(test_type: str, page_profile: str) -> str:
    if test_type == "functional":
        if page_profile == "nav_only":
            return (
                "You are a QA engineer generating FUNCTIONAL navigation tests.\n"
                "This page has NO forms or inputs. Nav links are your ONLY interaction targets.\n\n"
                "STRICT RULES:\n"
                "1. Respond ONLY with valid JSON — no markdown, no backticks\n"
                "2. Use ONLY selectors from CLICK TARGETS\n"
                "3. REQUIRED: at least 2 click steps with url_contains assertions\n"
                "4. FORBIDDEN: only check_visible steps — will be REJECTED\n"
                "5. Pattern: check_visible(link) → click(link) + assertion(url_contains)\n"
                "6. Generate 4-8 steps"
            )
        return (
            "You are a QA engineer generating FUNCTIONAL tests.\n"
            "STRICT RULES:\n"
            "1. Respond ONLY with valid JSON — no markdown, no backticks\n"
            "2. Use ONLY selectors from PAGE ELEMENTS\n"
            "3. REQUIRED: at least 1 click or fill with an assertion\n"
            "4. EVERY click/fill MUST have an assertion field\n"
            "5. Assertion: { type, value, selector_target }\n"
            "6. Generate 5-10 steps"
        )
    return (
        "You are a QA engineer generating REGRESSION tests.\n"
        "STRICT RULES:\n"
        "1. Respond ONLY with valid JSON — no markdown, no backticks\n"
        "2. Use ONLY selectors from PAGE ELEMENTS\n"
        "3. REQUIRED: minimum 6 steps, at least 3 assertions\n"
        "4. EVERY click/fill MUST have assertion\n"
        "5. Build complete user journey flows\n"
        "6. Generate 6-10 steps"
    )


TEST_TYPE_PROFILES = {
    "smoke":      {"category": "smoke",      "priority": "medium", "has_assertion": False},
    "functional": {"category": "functional", "priority": "high",   "has_assertion": True},
    "regression": {"category": "regression", "priority": "high",   "has_assertion": True},
}

INTERACTION_ACTIONS = {"click", "fill", "submit"}
ASSERTION_TYPES     = {"url_contains", "element_visible", "element_exists",
                       "text_contains", "input_value"}


def _validate_steps(steps: list, test_type: str, downgraded: bool = False) -> tuple:
    errors = []
    if not steps:
        return False, ["No steps generated"]
    if downgraded:
        test_type = "smoke"
    if test_type == "smoke":
        bad = [s["action"] for s in steps if s.get("action") in INTERACTION_ACTIONS]
        if bad:
            errors.append(f"Smoke test contains forbidden actions: {bad}")
        if len(steps) > SMOKE_MAX_STEPS:
            errors.append(f"Smoke test has too many steps ({len(steps)}) — max {SMOKE_MAX_STEPS}.")
    elif test_type in ("functional", "regression"):
        interactions = [s for s in steps if s.get("action") in INTERACTION_ACTIONS]
        if not interactions:
            errors.append(f"{test_type} test has zero interactions")
        for i, step in enumerate(steps):
            if step.get("action") not in INTERACTION_ACTIONS:
                continue
            assertion = step.get("assertion")
            if not assertion or not isinstance(assertion, dict):
                errors.append(f"Step {i+1} ({step.get('action')}) missing assertion")
            elif assertion.get("type") not in ASSERTION_TYPES:
                errors.append(f"Step {i+1} invalid assertion type '{assertion.get('type')}'")
        if test_type == "regression":
            n_assert = sum(1 for s in steps if s.get("assertion"))
            if n_assert < 3:
                errors.append(f"Regression needs >=3 assertions, got {n_assert}")
            if len(steps) < 6:
                errors.append(f"Regression needs >=6 steps, got {len(steps)}")
    return len(errors) == 0, errors


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    for model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
        try:
            resp = groq_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=0.0, max_tokens=2000, seed=42,
            )
            content = resp.choices[0].message.content.strip()
            if resp.choices[0].finish_reason != "length":
                return content
        except Exception as e:
            if "429" not in str(e):
                raise
    raise ValueError("All LLM models unavailable")


def _safe_parse(content: str) -> dict:
    content = content.strip()
    for fence in ["```json", "```"]:
        if fence in content:
            content = content.split(fence)[1].split("```")[0].strip()
            break
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        depth = 0; start = None
        for i, ch in enumerate(content):
            if ch == "{":
                if depth == 0: start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start is not None:
                    try:
                        return json.loads(content[start:i+1])
                    except Exception:
                        pass
        raise ValueError(f"Cannot parse JSON: {content[:200]}")


def _build_elements_block(scraped: dict, test_type: str,
                           page_profile: str, clickable_nav: list) -> str:
    lines = []
    if page_profile == "nav_only" and clickable_nav:
        lines.append("CLICK TARGETS — use at least 2 with click + assertion:")
        for n in clickable_nav:
            lines.append(f"  css='{n['css']}' text='{n['text']}' → assert url_contains='{n['slug']}'")
        lines.append("")
    skip_types = {"hidden", "submit", "button", "reset"}
    inputs = [i for i in scraped.get("inputs", [])[:10]
              if i.get("css_selector") and i.get("type") not in skip_types]
    if inputs:
        lines.append("Inputs (fill + assertion):")
        for inp in inputs:
            lines.append(f"  css='{inp['css_selector']}' type={inp['type']} placeholder='{inp.get('placeholder','')}'")
    buttons = [b for b in scraped.get("buttons", [])[:8]
               if b.get("css_selector") and b.get("text")]
    if buttons:
        lines.append("Buttons (click + assertion):")
        for b in buttons:
            lines.append(f"  css='{b['css_selector']}' text='{b['text']}'")
    forms = scraped.get("forms", [])[:3]
    if forms:
        lines.append("Forms:")
        for f in forms:
            lines.append(f"  css='{f.get('css_selector','')}' action='{f.get('action','')}'")
    else:
        lines.append("Forms: NONE")
    if page_profile == "rich":
        nav_lines = []
        for n in scraped.get("nav_links", [])[:6]:
            href = n.get("href", ""); text = n.get("text", "").strip()
            if not href or not text: continue
            slug = href.rstrip("/").split("/")[-1]
            if slug and slug not in ("", "#", "pll_switcher"):
                nav_lines.append(f"  css='a[href*=\"{slug}\"]' text='{text}'")
        if nav_lines:
            lines.append("Nav links (click → assert url_contains):")
            lines.extend(nav_lines)
    return "\n".join(lines) if lines else "No elements found."


def _build_user_prompt(scraped: dict, test_type: str, page_profile: str,
                        clickable_nav: list, retry_errors: list = None) -> str:
    url      = scraped.get("url", "")
    title    = scraped.get("title", "")
    profile  = TEST_TYPE_PROFILES[test_type]
    elements = _build_elements_block(scraped, test_type, page_profile, clickable_nav)
    strategy_block = ""
    if page_profile == "nav_only" and clickable_nav:
        nav_examples = "\n".join(
            f"  Step A: check_visible selector='{n['css']}'\n"
            f"  Step B: click selector='{n['css']}' + assertion url_contains='{n['slug']}'"
            for n in clickable_nav[:2]
        )
        strategy_block = "MANDATORY STRATEGY:\n" + nav_examples + "\nDo NOT generate only check_visible."
    elif page_profile == "rich":
        strategy_block = "STRATEGY: fill inputs + assert_input_value, click submit + assert_url."
    retry_block = ""
    if retry_errors:
        retry_block = "\nPREVIOUS ATTEMPT REJECTED:\n" + "\n".join(f"  x {e}" for e in retry_errors)
    return f"""Generate {profile['category']} test steps for this page.
URL: {url}
Title: {title}
Page profile: {page_profile}

{elements}

{strategy_block}
{retry_block}

Return ONLY this JSON:
{{
  "steps": [
    {{
      "id": 1,
      "name": "descriptive name",
      "action": "check_visible | click | fill",
      "selector": "exact selector from elements above",
      "value": "text to type (fill only, else empty string)",
      "expected": "what should happen",
      "category": "{profile['category']}",
      "priority": "high",
      "assertion": null
    }}
  ]
}}

For click/fill steps replace null with:
  {{"type": "url_contains|element_visible|text_contains|input_value", "value": "...", "selector_target": "..."}}"""


# ─────────────────────────────────────────────────────────────────────────────
# Script builders
# ─────────────────────────────────────────────────────────────────────────────
def _is_optional(step: dict) -> bool:
    return step.get("optional", False) or step.get("type") in OPTIONAL_TYPES


def _build_selenium_script(steps: list, url: str) -> str:
    lines = [
        "from selenium import webdriver",
        "from selenium.webdriver.common.by import By",
        "from selenium.webdriver.support.ui import WebDriverWait",
        "from selenium.webdriver.support import expected_conditions as EC",
        "from selenium.webdriver.chrome.options import Options",
        "import time",
        "",
        "def setup_driver():",
        "    opts = Options()",
        "    opts.add_argument('--headless')",
        "    opts.add_argument('--no-sandbox')",
        "    opts.add_argument('--disable-dev-shm-usage')",
        "    opts.add_argument('--window-size=1920,1080')",
        "    driver = webdriver.Chrome(options=opts)",
        "    driver.set_page_load_timeout(30)",
        "    driver.implicitly_wait(10)",
        "    return driver",
        "",
    ]
    for i, step in enumerate(steps, 1):
        action    = step.get("action", "check_visible")
        selector  = step.get("selector", "")
        value     = step.get("value", "")
        name      = step.get("name", f"step_{i}")
        fn_name   = f"test_{i}_" + re.sub(r"[^a-z0-9]", "_", name.lower())[:30]
        assertion = step.get("assertion")
        optional  = _is_optional(step)
        lines.append(f"def {fn_name}(driver):")
        lines.append(f"    driver.get('{url}')")
        if action == "check_visible":
            if optional:
                lines.append(f"    try:")
                lines.append(f"        el = WebDriverWait(driver, 10).until(")
                lines.append(f"            EC.presence_of_element_located((By.CSS_SELECTOR, '{selector}')))")
                lines.append(f"        assert el is not None")
                lines.append(f"    except Exception:")
                lines.append(f"        print('[WARN] Optional element not found: {selector}')")
            else:
                lines.append(f"    el = WebDriverWait(driver, 15).until(")
                lines.append(f"        EC.presence_of_element_located((By.CSS_SELECTOR, '{selector}')))")
                lines.append(f"    assert el is not None, 'Element not found: {selector}'")
        elif action == "click":
            lines.append(f"    el = WebDriverWait(driver, 15).until(")
            lines.append(f"        EC.element_to_be_clickable((By.CSS_SELECTOR, '{selector}')))")
            lines.append(f"    el.click()")
            lines.append(f"    time.sleep(1)")
            if assertion:
                if assertion.get("type") == "url_contains":
                    lines.append(f"    assert '{assertion['value']}' in driver.current_url")
                elif assertion.get("type") in ("element_visible", "element_exists"):
                    t = assertion.get("selector_target", "")
                    lines.append(f"    WebDriverWait(driver, 10).until(")
                    lines.append(f"        EC.presence_of_element_located((By.CSS_SELECTOR, '{t}')))")
        elif action == "fill":
            lines.append(f"    el = WebDriverWait(driver, 15).until(")
            lines.append(f"        EC.presence_of_element_located((By.CSS_SELECTOR, '{selector}')))")
            lines.append(f"    el.clear()")
            lines.append(f"    el.send_keys('{value}')")
            lines.append(f"    assert el.get_attribute('value') == '{value}', 'Fill failed'")
        lines.append("")
    fn_names = [f"test_{i}_" + re.sub(r"[^a-z0-9]", "_", s.get("name","step").lower())[:30]
                for i, s in enumerate(steps, 1)]
    lines += [
        "if __name__ == '__main__':",
        "    driver = setup_driver()",
        "    tests = [" + ", ".join(fn_names) + "]",
        "    passed = failed = 0",
        "    try:",
        "        for i, t in enumerate(tests, 1):",
        "            try:",
        "                t(driver)",
        "                print(f'Test {i}: PASSED')",
        "                passed += 1",
        "            except Exception as e:",
        "                print(f'Test {i}: FAILED — {e}')",
        "                failed += 1",
        "    finally:",
        "        driver.quit()",
        "        print(f'\\n{passed} passed / {failed} failed')",
    ]
    return "\n".join(lines)


def _build_playwright_script(steps: list, url: str) -> str:
    lines = [
        "from playwright.sync_api import sync_playwright, expect",
        "import pytest, re",
        "",
        f"BASE_URL = '{url}'",
        "",
        "@pytest.fixture(scope='module')",
        "def page():",
        "    with sync_playwright() as p:",
        "        browser = p.chromium.launch(headless=True)",
        "        ctx = browser.new_context(viewport={'width': 1920, 'height': 1080})",
        "        pg  = ctx.new_page()",
        "        pg.goto(BASE_URL, wait_until='domcontentloaded')",
        "        yield pg",
        "        browser.close()",
        "",
    ]
    for i, step in enumerate(steps, 1):
        action    = step.get("action", "check_visible")
        selector  = step.get("selector", "")
        value     = step.get("value", "")
        name      = step.get("name", f"step_{i}")
        fn_name   = "test_" + re.sub(r"[^a-z0-9]", "_", name.lower())[:40]
        assertion = step.get("assertion")
        optional  = _is_optional(step)
        lines.append(f"def {fn_name}(page):")
        if action == "check_visible":
            if optional:
                lines.append(f"    try:")
                lines.append(f"        expect(page.locator('{selector}').first).to_be_visible(timeout=10000)")
                lines.append(f"    except Exception:")
                lines.append(f"        pytest.skip('Optional element not found: {selector}')")
            else:
                lines.append(f"    expect(page.locator('{selector}').first).to_be_visible(timeout=15000)")
        elif action == "click":
            lines.append(f"    page.locator('{selector}').first.click()")
            lines.append(f"    page.wait_for_load_state('domcontentloaded')")
            if assertion:
                if assertion.get("type") == "url_contains":
                    _av = re.escape(assertion.get("value", ""))
                    lines.append(f"    expect(page).to_have_url(re.compile(r'{_av}'))")
                elif assertion.get("type") in ("element_visible", "element_exists"):
                    _at = assertion.get("selector_target", "")
                    lines.append(f"    expect(page.locator('{_at}').first).to_be_visible(timeout=10000)")
        elif action == "fill":
            lines.append(f"    page.fill('{selector}', '{value}')")
            lines.append(f"    expect(page.locator('{selector}')).to_have_value('{value}')")
        lines.append("")
    return "\n".join(lines)


def _build_cypress_script(steps: list, url: str) -> str:
    lines = [
        "// Cypress smoke suite — auto-generated by NexTest v8",
        f"const BASE_URL = '{url}';",
        "",
        "describe('NexTest Smoke Suite', () => {",
        "  beforeEach(() => { cy.visit(BASE_URL); });",
        "",
    ]
    for i, step in enumerate(steps, 1):
        action    = step.get("action", "check_visible")
        selector  = step.get("selector", "")
        value     = step.get("value", "")
        name      = step.get("name", f"step {i}")
        assertion = step.get("assertion")
        optional  = _is_optional(step)
        lines.append(f"  it('{name}', () => {{")
        if action == "check_visible":
            if optional:
                lines.append(f"    cy.get('body').then($body => {{")
                lines.append(f"      if ($body.find('{selector}').length > 0) {{")
                lines.append(f"        cy.get('{selector}').first().should('exist');")
                lines.append(f"      }} else {{")
                lines.append(f"        cy.log('WARN: optional element not found — {selector}');")
                lines.append(f"      }}")
                lines.append(f"    }});")
            else:
                lines.append(f"    cy.get('{selector}').first().should('exist');")
        elif action == "click":
            lines.append(f"    cy.get('{selector}').first().click();")
            if assertion:
                if assertion.get("type") == "url_contains":
                    _cv = assertion.get("value", "")
                    lines.append(f"    cy.url().should('include', '{_cv}');")
                elif assertion.get("type") in ("element_visible", "element_exists"):
                    _ct = assertion.get("selector_target", "")
                    lines.append(f"    cy.get('{_ct}').should('be.visible');")
        elif action == "fill":
            lines.append(f"    cy.get('{selector}').clear().type('{value}');")
            lines.append(f"    cy.get('{selector}').should('have.value', '{value}');")
        lines.append("  });")
        lines.append("")
    lines.append("});")
    return "\n".join(lines)


def _build_scripts(steps: list, url: str, framework: str) -> dict:
    fw = framework.lower()
    scripts = {"script": "", "script_selenium": "", "script_playwright": "", "script_cypress": ""}
    if fw == "selenium":
        scripts["script_selenium"] = _build_selenium_script(steps, url)
        scripts["script"]          = scripts["script_selenium"]
    elif fw == "playwright":
        scripts["script_playwright"] = _build_playwright_script(steps, url)
        scripts["script"]            = scripts["script_playwright"]
    elif fw == "cypress":
        scripts["script_cypress"] = _build_cypress_script(steps, url)
        scripts["script"]         = scripts["script_cypress"]
    elif fw in ("both", "all"):
        scripts["script_selenium"]   = _build_selenium_script(steps, url)
        scripts["script_playwright"] = _build_playwright_script(steps, url)
        scripts["script_cypress"]    = _build_cypress_script(steps, url)
        scripts["script"]            = scripts["script_selenium"]
    return scripts


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────
def generate_tests(scraped: dict, framework: str,
                   username: str = None, password: str = None,
                   test_type: str = "smoke") -> dict:

    if test_type not in TEST_TYPE_PROFILES:
        test_type = "smoke"

    profile      = TEST_TYPE_PROFILES[test_type]
    url          = scraped.get("url", "")
    page_profile = _classify_page_profile(scraped)

    print(f"[GEN] {test_type} | page_profile={page_profile} | url={url}")

    # ── SMOKE: deterministic — skip LLM entirely ──────────────────────────────
    if test_type == "smoke":
        steps = _build_smoke_steps(scraped)
        for step in steps:
            step["base_url"] = url
        scripts = _build_scripts(steps, url, framework)
        print(f"[GEN] OK smoke | {len(steps)} steps | deterministic (no LLM)")
        return {
            "test_cases":          steps,
            "test_cases_selenium": steps,
            "test_cases_cypress":  steps,
            "script":              scripts["script"],
            "script_selenium":     scripts["script_selenium"],
            "script_playwright":   scripts["script_playwright"],
            "script_cypress":      scripts["script_cypress"],
            "page_type":           "general",
            "test_type":           "smoke",
            "page_profile":        page_profile,
        }

    # ── FUNCTIONAL / REGRESSION: LLM path ────────────────────────────────────
    clickable_nav = _extract_clickable_nav(scraped)

    if page_profile == "static":
        print(f"[GEN] DOWNGRADE {test_type} → smoke (no interactable elements)")
        result = generate_tests(scraped, framework, username, password, test_type="smoke")
        for step in result.get("test_cases", []):
            step["downgraded"]         = True
            step["original_test_type"] = test_type
        result.update({
            "test_type":        test_type,
            "execution_type":   "smoke",
            "downgraded":       True,
            "downgrade_reason": (
                f"No interactable elements found. {test_type.capitalize()} "
                "requires clickable/fillable targets. Executed as smoke instead."
            ),
        })
        return result

    system_prompt = _build_system_prompt(test_type, page_profile)
    last_errors   = []

    for attempt in range(3):
        try:
            user_prompt = _build_user_prompt(
                scraped, test_type, page_profile, clickable_nav,
                retry_errors=last_errors if attempt > 0 else None,
            )
            raw    = _call_llm(system_prompt, user_prompt)
            parsed = _safe_parse(raw)
            steps  = parsed.get("steps", [])
            if not steps:
                last_errors = ["No steps returned"]; continue
            valid, errors = _validate_steps(steps, test_type)
            if not valid:
                print(f"[GEN] Attempt {attempt+1} failed: {errors}")
                last_errors = errors; continue
            for step in steps:
                step["base_url"]    = url
                step["category"]    = step.get("category", profile["category"])
                step["priority"]    = step.get("priority", "high")
                step["description"] = step.get("expected", "")
                step.setdefault("assertion", None)
            scripts = _build_scripts(steps, url, framework)
            print(f"[GEN] OK {test_type} | {len(steps)} steps | attempt {attempt+1}")
            return {
                "test_cases":          steps,
                "test_cases_selenium": steps,
                "test_cases_cypress":  steps,
                "script":              scripts["script"],
                "script_selenium":     scripts["script_selenium"],
                "script_playwright":   scripts["script_playwright"],
                "script_cypress":      scripts["script_cypress"],
                "page_type":           "general",
                "test_type":           test_type,
                "page_profile":        page_profile,
            }
        except Exception as e:
            print(f"[GEN] Attempt {attempt+1} exception: {e}")
            last_errors = [str(e)]

    return {
        "error":             f"Generation failed: {last_errors}",
        "validation_errors": last_errors,
        "test_cases":        [],
        "script":            "",
        "script_selenium":   "",
        "script_playwright": "",
        "script_cypress":    "",
        "test_type":         test_type,
        "page_profile":      page_profile,
    }