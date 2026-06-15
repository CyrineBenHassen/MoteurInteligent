
import os, json, re, time

from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

SMOKE_MAX_STEPS = 50
SMOKE_MIN_STEPS = 3

INTERACTION_ACTIONS = {"click", "fill", "submit"}
ASSERTION_TYPES = {
    "url_contains", "element_visible", "element_exists",
    "text_contains", "input_value", "element_not_visible",
}

OPTIONAL_TYPES = frozenset({
    "footer", "search", "hero", "logo", "image", "pagination",
    "section", "input_field", "cta", "icon", "lang_switch", "nav_link",
})

TEST_TYPE_PROFILES = {
    "smoke":      {"category": "smoke",      "priority": "medium"},
    "functional": {"category": "functional", "priority": "high"},
    "regression": {"category": "regression", "priority": "high"},
}

# Section priority order
SECTION_PRIORITY = [
    "header",   # navbar, logo, lang switch
    "hero",     # hero buttons, CTAs
    "search",   # search bar
    "forms",    # all forms + negative tests
    "content",  # content sections, cards, internal CTAs
    "footer",   # footer links, contact info
    "workflow", # multi-step user journeys
]

FLEX = {
    "navigation": ["nav", "[role='navigation']", ".navbar", ".nav", "header ul", ".menu"],
    "footer":     ["footer", "[role='contentinfo']", ".footer", "#footer"],
    "search":     ["input[type='search']", "input[name='s']", "form[role='search']"],
    "hero":       ["[class*='hero']", "[class*='banner']", "[class*='jumbotron']"],
    "main_content": ["main", "[role='main']", "#content", ".content", "article"],
}

CRITICALITY = {
    "body":        {"score": 100, "tier": 1, "optional": False},
    "heading":     {"score": 90,  "tier": 1, "optional": False},
    "main_content":{"score": 85,  "tier": 1, "optional": False},
    "auth":        {"score": 95,  "tier": 1, "optional": False},
    "cta":         {"score": 88,  "tier": 1, "optional": True},
    "navigation":  {"score": 78,  "tier": 1, "optional": True},
    "nav_link":    {"score": 72,  "tier": 1, "optional": True},
    "input_field": {"score": 68,  "tier": 2, "optional": True},
    "search":      {"score": 65,  "tier": 2, "optional": True},
    "footer":      {"score": 60,  "tier": 2, "optional": True},
    "hero":        {"score": 62,  "tier": 2, "optional": True},
    "logo":        {"score": 58,  "tier": 2, "optional": True},
    "pagination":  {"score": 50,  "tier": 2, "optional": True},
    "section":     {"score": 52,  "tier": 2, "optional": True},
    "image":       {"score": 45,  "tier": 2, "optional": True},
    "lang_switch": {"score": 55,  "tier": 2, "optional": True},
    "icon":        {"score": 30,  "tier": 3, "optional": True},
}


def _joined(key: str) -> str:
    return ", ".join(FLEX.get(key, [key]))


# ─────────────────────────────────────────────────────────────────────────────
# SECTION EXTRACTOR — divides the page into testable sections
# ─────────────────────────────────────────────────────────────────────────────

def _extract_sections(scraped: dict) -> dict:
    """
    Divides all detected elements into named sections.
    Returns a dict: section_name → list of detected elements.
    Each element has: css, text, type, role, required, etc.
    """
    url         = scraped.get("url", "")
    base_domain = url.split("/")[2] if "//" in url else ""
    sections    = {s: [] for s in SECTION_PRIORITY}
    seen_css    = set()

    def _add(section: str, elem: dict):
        css = elem.get("css", "")
        if css and css not in seen_css:
            seen_css.add(css)
            sections[section].append(elem)

    # ── HEADER: nav links + logo + lang switch ────────────────────────────────
    seen_slugs = set()
    for n in scraped.get("nav_links", []):
        href = n.get("href", "").strip()
        text = n.get("text", "").strip()
        if not href or not text:
            continue
        slug = href.rstrip("/").split("/")[-1]
        if not slug or slug in ("#", "pll_switcher", "", "index.html", "index", "home"):
            continue
        if href.startswith("http") and base_domain and base_domain not in href:
            continue
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        _add("header", {
            "css":      f"a[href*='{slug}']",
            "text":     text,
            "slug":     slug,
            "href":     href,
            "type":     "nav_link",
            "section":  "header",
            "priority": "high",
        })

    # Logo
    for img in scraped.get("images_audit", []):
        alt = img.get("alt", "").lower()
        src = img.get("src", "").lower()
        if "logo" in alt or "logo" in src:
            _add("header", {
                "css":     img.get("css_selector", "img[src*='logo']"),
                "text":    "logo",
                "type":    "logo",
                "section": "header",
                "priority":"medium",
            })
            break

    # Lang switch
    for ls in scraped.get("lang_switcher", []):
        hreflang = ls.get("hreflang", "").strip()
        href     = ls.get("href", "").strip()
        text     = ls.get("text", hreflang or "lang").strip()
 
        # Build the best possible selector
        if hreflang:
            css = f"a[hreflang='{hreflang}']"
        elif href and "#pll_switcher" not in href:
            slug = href.rstrip("/").split("/")[-1]
            css  = f"a[href*='/{slug}/']" if slug else ""
        else:
            # Skip #pll_switcher anchors — they open a dropdown, not navigate
            continue
 
        OPTIONAL_LANGS = {"en", "de", "it", "pt", "zh", "ja", "ru", "es"}

        if css:
            _add("header", {
                "css":      css,
                "text":     text,
                "hreflang": hreflang,
                "type":     "lang_switch",
                "section":  "header",
                "priority": "medium",
                "optional": hreflang.lower() in OPTIONAL_LANGS,
            })

    # ── HERO: hero/banner buttons and CTAs ───────────────────────────────────
    hero_kw = {"hero", "banner", "jumbotron", "slider", "carousel", "intro"}
    cta_kw  = {"get started", "start", "try", "demo", "buy", "shop", "book",
                "order", "subscribe", "download", "contact", "learn more", "explore",
                "en savoir", "découvrir", "voir", "commencer"}

    for sec in scraped.get("content_sections", []):
        css = sec.get("css_selector", "")
        if any(k in css.lower() for k in hero_kw):
            _add("hero", {
                "css": css, "text": sec.get("title", "hero section"),
                "type": "hero_section", "section": "hero", "priority": "high",
            })

    for btn in scraped.get("buttons", []):
        css  = btn.get("css_selector", "")
        text = btn.get("text", "").lower().strip()
        if not css or not text:
            continue
        is_cta = any(k in text for k in cta_kw) or any(
            k in css.lower() for k in ("primary", "cta", "hero", "action", "btn-main")
        )
        if is_cta:
            _add("hero", {
                "css": css, "text": btn.get("text", ""),
                "type": "cta_button", "section": "hero", "priority": "high",
            })

    # ── SEARCH ────────────────────────────────────────────────────────────────
    for bar in scraped.get("search_bar", []) + scraped.get("search_inputs", []):
        css = bar.get("css_selector", "").strip()
        if css:
            _add("search", {
                "css": css, "text": "search input",
                "type": "search_input", "section": "search", "priority": "high",
            })

    for inp in scraped.get("inputs", []):
        if inp.get("type") == "search":
            css = inp.get("css_selector", "")
            if css:
                _add("search", {
                    "css": css, "text": "search",
                    "type": "search_input", "section": "search", "priority": "high",
                })

    # ── FORMS: all inputs + forms + submit buttons ────────────────────────────
    skip_types = {"hidden", "submit", "button", "reset"}

    for f in scraped.get("input_fields", []):
        if not f.get("css_selector") or not f.get("visible"):
            continue
        if f.get("type") in skip_types:
            continue
        _add("forms", {
            "css":      f["css_selector"],
            "text":     f.get("label", f.get("placeholder", f.get("role", "input"))),
            "type":     "input",
            "role":     f.get("role", f.get("type", "text")),
            "required": f.get("required", False),
            "section":  "forms",
            "priority": "high",
        })

    if not sections["forms"]:
        for inp in scraped.get("inputs", []):
            if not inp.get("css_selector") or inp.get("type") in skip_types:
                continue
            _add("forms", {
                "css":      inp["css_selector"],
                "text":     inp.get("placeholder", inp.get("type", "input")),
                "type":     "input",
                "role":     inp.get("type", "text"),
                "required": inp.get("required", False),
                "section":  "forms",
                "priority": "high",
            })

    for form in scraped.get("forms", []):
        css = form.get("css_selector", "")
        if css:
            _add("forms", {
                "css": css, "text": "form",
                "type": "form", "action": form.get("action", ""),
                "section": "forms", "priority": "high",
            })

    # Submit buttons
    for btn in scraped.get("buttons", []):
        css  = btn.get("css_selector", "")
        text = btn.get("text", "").lower()
        if css and any(k in text for k in ("submit", "send", "envoyer", "soumettre", "save", "ok")):
            _add("forms", {
                "css": css, "text": btn.get("text", "submit"),
                "type": "submit_button", "section": "forms", "priority": "high",
            })

    # ── CONTENT: headings, sections, cards, internal links ───────────────────
    for h in scraped.get("headings", []):
        css  = h.get("css_selector", "").strip()
        text = h.get("text", "").strip()
        if css and text:
            _add("content", {
                "css": css, "text": text[:60],
                "type": "heading", "section": "content", "priority": "medium",
            })

    for card in scraped.get("cards", []):
        css   = card.get("css_selector", "")
        title = card.get("title", card.get("text", "card"))
        if css:
            _add("content", {
                "css": css, "text": title[:60],
                "type": "card", "section": "content", "priority": "medium",
            })

    for sec in scraped.get("content_sections", []):
        css   = sec.get("css_selector", "")
        title = sec.get("title", sec.get("text", "section"))
        if css and not any(k in css.lower() for k in hero_kw):
            _add("content", {
                "css": css, "text": title[:60],
                "type": "content_section", "section": "content", "priority": "medium",
            })

    # Non-CTA buttons in content
    for btn in scraped.get("buttons", []):
        css  = btn.get("css_selector", "")
        text = btn.get("text", "").lower().strip()
        if not css or not text:
            continue
        is_cta = any(k in text for k in cta_kw)
        is_submit = any(k in text for k in ("submit", "send", "envoyer"))
        if not is_cta and not is_submit:
            _add("content", {
                "css": css, "text": btn.get("text", "button"),
                "type": "button", "section": "content", "priority": "medium",
            })

    # ── FOOTER: footer links + contact info ──────────────────────────────────
    for f in scraped.get("footer_data", []):
        if not f.get("visible"):
            continue
        css = f.get("css_selector", "footer")
        _add("footer", {
            "css": css, "text": "footer",
            "type": "footer_container", "section": "footer", "priority": "low",
            "phones": f.get("phones", []),
            "emails": f.get("emails", []),
        })
        for link in f.get("links", [])[:6]:
            lhref = link.get("href", "").strip()
            ltext = link.get("text", "").strip()
            if lhref and ltext:
                slug = lhref.rstrip("/").split("/")[-1]
                if slug and slug not in seen_slugs:
                    seen_slugs.add(slug)
                    _add("footer", {
                        "css": f"footer a[href*='{slug}']",
                        "text": ltext, "slug": slug,
                        "type": "footer_link", "section": "footer", "priority": "low",
                    })

    # ── WORKFLOW: automatic multi-step journeys ───────────────────────────────
    # These are defined by combining detected elements, not from scraper directly
    # (populated later in _define_workflows)

    return sections


def _define_workflows(sections: dict, scraped: dict) -> list:
    """
    Defines multi-step user journeys based on what was detected.
    Returns a list of workflow definitions.
    """
    workflows = []

    # Workflow 1: Search flow
    if sections.get("search"):
        search_elem = sections["search"][0]
        workflows.append({
            "name":   "Search workflow",
            "type":   "search_flow",
            "steps": [
                {"action": "check_visible", "css": search_elem["css"], "desc": "Search bar is visible"},
                {"action": "fill",          "css": search_elem["css"], "value": "test", "desc": "Type search query"},
                {"action": "submit_search", "css": search_elem["css"], "desc": "Submit search"},
            ],
        })

    # Workflow 2: Navigation → back to homepage
    nav_links = sections.get("header", [])
    nav_links = [n for n in nav_links if n.get("type") == "nav_link"]
    if nav_links:
        first_nav = nav_links[0]
        base_url  = scraped.get("url", "")
        base_slug = base_url.rstrip("/").split("/")[-1] or "/"
        workflows.append({
            "name": f"Navigate to {first_nav['text']} then back",
            "type": "nav_back_flow",
            "steps": [
                {"action": "click",         "css": first_nav["css"], "desc": f"Click {first_nav['text']}"},
                {"action": "check_url",     "value": first_nav["slug"], "desc": "Verify destination URL"},
                {"action": "navigate_back", "value": base_url,          "desc": "Return to homepage"},
            ],
        })

    # Workflow 3: Form empty submit (negative test)
    form_inputs = [e for e in sections.get("forms", []) if e.get("type") == "input"]
    submit_btn  = next((e for e in sections.get("forms", []) if e.get("type") == "submit_button"), None)
    if form_inputs and submit_btn:
        workflows.append({
            "name": "Form empty submit — validation errors expected",
            "type": "form_negative",
            "steps": [
                {"action": "click", "css": submit_btn["css"],
                 "desc": "Submit empty form — expect validation error"},
            ],
        })

    # Workflow 4: Language switch
    lang_elems = [e for e in sections.get("header", []) if e.get("type") == "lang_switch"]
    if lang_elems:
        workflows.append({
            "name": "Language switch workflow",
            "type": "lang_flow",
            "steps": [
                {"action": "click",     "css": lang_elems[0]["css"], "desc": "Click language switcher"},
                {"action": "check_url", "value": "",                  "desc": "Verify URL changed"},
            ],
        })

    return workflows


# ─────────────────────────────────────────────────────────────────────────────
# COVERAGE TRACKER
# ─────────────────────────────────────────────────────────────────────────────

class CoverageTracker:
    def __init__(self, sections: dict):
        self.detected: dict[str, list] = {}   # section → elements
        self.tested:   dict[str, list] = {}   # section → tested css selectors

        for sec, elems in sections.items():
            if elems:
                self.detected[sec] = elems
                self.tested[sec]   = []

    def mark_tested(self, section: str, css: str):
        if section in self.tested and css not in self.tested[section]:
            self.tested[section].append(css)

    def total_detected(self) -> int:
        return sum(len(v) for v in self.detected.values())

    def total_tested(self) -> int:
        return sum(len(v) for v in self.tested.values())

    def coverage_pct(self) -> float:
        total = self.total_detected()
        return round(self.total_tested() / total * 100, 1) if total else 0.0

    def per_section(self) -> dict:
        result = {}
        for sec in self.detected:
            det  = len(self.detected[sec])
            test = len(self.tested.get(sec, []))
            result[sec] = {
                "detected": det,
                "tested":   test,
                "coverage": round(test / det * 100, 1) if det else 0.0,
            }
        return result

    def report(self) -> dict:
        return {
            "total_detected_elements": self.total_detected(),
            "total_tested_elements":   self.total_tested(),
            "coverage_percentage":     self.coverage_pct(),
            "per_section":             self.per_section(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# LLM CALL
# ─────────────────────────────────────────────────────────────────────────────

def _call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 4000) -> str:
    try:
        from openai import OpenAI
        groq_client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
        )
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=max_tokens,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        raise ValueError(f"Groq API error: {e}")


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


# ─────────────────────────────────────────────────────────────────────────────
# SECTION PROMPTS — one LLM call per section
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM_BASE = (
    "You are an expert QA automation engineer generating functional test steps.\n"
    "ABSOLUTE RULES:\n"
    "1. Respond ONLY with valid JSON — no markdown, no explanation\n"
    "2. Use ONLY the CSS selectors listed — never invent selectors\n"
    "3. Every click/fill step MUST have a non-null assertion\n"
    "4. check_visible steps may have assertion: null\n"
    "5. Assertion types: url_contains, element_visible, text_contains, input_value, element_not_visible\n"
    "6. Generate a step for EVERY element listed — do not skip any\n"
    "7. Add section and priority fields to every step\n"
    # ── NOUVEAU ──
    "8. Test ALL page elements: buttons, forms, images, headings, sections, cards, footer — NOT only nav links\n"
    "9. For EACH section generate COMPLETE tests covering ALL detected elements\n"
    "10. Never skip any element — if it exists on the page, test it\n"
)

_STEP_SCHEMA = """{
  "id": <int>,
  "name": "<descriptive name>",
  "action": "check_visible|click|fill",
  "selector": "<exact CSS selector>",
  "value": "<text if fill, else empty>",
  "expected": "<what should happen>",
  "category": "functional",
  "priority": "high|medium|low",
  "section": "<section name>",
  "assertion": {
    "type": "url_contains|element_visible|text_contains|input_value|element_not_visible",
    "value": "<expected value>",
    "selector_target": "<CSS selector to check>"
  }
}"""


def _generate_section_steps(
    section_name:  str,
    elements:      list,
    scraped:       dict,
    start_id:      int = 1,
    extra_context: str = "",
) -> list:
    if not elements:
        return []

    url   = scraped.get("url", "")
    title = scraped.get("title", "")

    # Build element list for the prompt
    elem_lines = []
    for e in elements:
        line = f"  selector: '{e['css']}'  type: {e.get('type','')}  text: '{e.get('text','')[:50]}'"
        if e.get("role"):
            line += f"  role: {e['role']}"
        if e.get("required"):
            line += "  required: true"
        if e.get("slug"):
            line += f"  slug: '{e['slug']}'"
        elem_lines.append(line)

    # Section-specific strategy instructions
    strategies = {
        "header": (
    "SECTION: HEADER / NAVBAR\n"
    "For EACH nav link:\n"
    "  - Step A: check_visible (assertion: null)\n"
    "  - Step B: click → assert url_contains the slug\n"
    "For logo: check_visible (assertion: null)\n"
    "For lang_switch:\n"
    "  - Step A: check_visible (assertion: null)\n"
    "  - Step B: click → assert url_contains the hreflang code\n"
    "    IMPORTANT: use selector a[hreflang='xx'] NOT a[href*='#pll_switcher']\n"
    "    The assertion value must be the lang code e.g. 'fr', 'ar', 'en'\n"
    "    If the lang is already the current page lang, skip the click step\n"
),
        "hero": (
            "SECTION: HERO / BANNER\n"
            "For hero sections: check_visible (assertion: null)\n"
            "For CTA buttons: check_visible → then click → assert element_visible or url_contains\n"
        ),
        "search": (
            "SECTION: SEARCH\n"
            "Generate a COMPLETE search workflow:\n"
            "  1. check_visible on search input\n"
            "  2. fill search input with 'test' → assert input_value\n"
            "  3. click submit or press Enter equivalent (click the search input's form or button)\n"
            "     → assert element_visible on results or url_contains 'search' or '?s='\n"
        ),
        "forms": (
            "SECTION: FORMS\n"
            "For EACH input field:\n"
            "  - check_visible → assertion: null\n"
            "  - fill with realistic test data → assert input_value\n"
            "For submit button:\n"
            "  - Generate POSITIVE test: fill all fields then click submit → assert element_visible (success)\n"
            "  - Generate NEGATIVE test: click submit WITHOUT filling → assert element_visible (error message)\n"
            "    Use selector_target like '.error, .alert, [class*=error], [class*=invalid]' for negative\n"
        ),
        "content": (
            "SECTION: CONTENT\n"
            "For headings: check_visible with text_contains assertion\n"
            "For cards/sections: check_visible (assertion: null)\n"
            "For buttons: click → assert url_contains or element_visible\n"
        ),
        "footer": (
            "SECTION: FOOTER\n"
            "For footer container: check_visible (assertion: null)\n"
            "For footer links: check_visible → click → assert url_contains slug\n"
        ),
    }

    strategy = strategies.get(section_name, f"SECTION: {section_name.upper()}\nTest all listed elements.\n")

    system_prompt = _SYSTEM_BASE + f"\n{strategy}"

    user_prompt = f"""Generate functional test steps for the {section_name.upper()} section.
URL: {url}
PAGE TITLE: {title}
IDs start at: {start_id}
{extra_context}

=== ELEMENTS TO TEST (test ALL of them — not only links!) ===
{chr(10).join(elem_lines)}

IMPORTANT:
- Test EVERY element listed — buttons, forms, images, headings, sections
- Do NOT focus only on navigation links
- Cover the ENTIRE page content

Return ONLY this JSON:
{{
  "steps": [
    {_STEP_SCHEMA}
  ]
}}

CRITICAL:
- Test EVERY element listed above — do not skip any
- For click/fill: assertion must be non-null
- Include section: "{section_name}" in every step
"""

    for attempt in range(3):
        try:
            raw    = _call_llm(system_prompt, user_prompt)
            parsed = _safe_parse(raw)
            steps  = parsed.get("steps", [])
            if steps:
                # Ensure section field is set
                for s in steps:
                    s.setdefault("section", section_name)
                return steps
        except Exception as e:
            print(f"[GEN] Section '{section_name}' attempt {attempt+1} failed: {e}")
            time.sleep(1)

    return []


def _generate_workflow_steps(
    workflows:  list,
    scraped:    dict,
    start_id:   int = 1,
) -> list:
    if not workflows:
        return []

    url = scraped.get("url", "")

    workflow_lines = []
    for wf in workflows:
        workflow_lines.append(f"WORKFLOW: {wf['name']} (type: {wf['type']})")
        for st in wf["steps"]:
            workflow_lines.append(f"  action: {st['action']}  css: {st.get('css', 'N/A')}  desc: {st['desc']}")
        workflow_lines.append("")

    system_prompt = (
        _SYSTEM_BASE
        + "\nSECTION: WORKFLOWS\n"
        "Generate multi-step user journey tests.\n"
        "For search_flow: fill input → click/submit → assert results visible\n"
        "For nav_back_flow: click nav link → assert URL → navigate to original URL → assert homepage loaded\n"
        "For form_negative: click submit without filling → assert error element visible\n"
        "For lang_flow: click lang switch → assert URL contains lang code or page content changed\n"
    )

    user_prompt = f"""Generate workflow test steps.
URL: {url}
IDs start at: {start_id}

=== WORKFLOWS TO IMPLEMENT ===
{chr(10).join(workflow_lines)}

Return ONLY this JSON:
{{
  "steps": [
    {_STEP_SCHEMA}
  ]
}}

CRITICAL:
- Each workflow must have multiple steps that chain together
- Include section: "workflow" in every step
- For navigate_back: use action "click" on a home link or logo selector
- For error assertions: use selector_target '.error, .alert, [class*=error], [class*=invalid], [aria-invalid]'
"""

    for attempt in range(3):
        try:
            raw    = _call_llm(system_prompt, user_prompt)
            parsed = _safe_parse(raw)
            steps  = parsed.get("steps", [])
            if steps:
                for s in steps:
                    s.setdefault("section", "workflow")
                return steps
        except Exception as e:
            print(f"[GEN] Workflow attempt {attempt+1} failed: {e}")
            time.sleep(1)

    return []


# ─────────────────────────────────────────────────────────────────────────────
# SMOKE HELPERS (unchanged from v12)
# ─────────────────────────────────────────────────────────────────────────────

def _scraper_best_heading(scraped):
    for h in scraped.get("headings", []):
        sel  = h.get("css_selector", "").strip()
        text = h.get("text", "").strip()
        if sel and text:
            return sel
    return "h1, h2, h3"

def _scraper_best_main_content(scraped):
    for sec in scraped.get("content_sections", []):
        css = sec.get("css_selector", "").strip()
        if css and sec.get("has_size"):
            if any(tok in css for tok in ("main","content","container","wrapper","article","section")):
                return css
    return "main, [role='main'], #content, .content, article"

def _scraper_has_nav(scraped):
        for nav in scraped.get("nav_links", []):
            href = nav.get("href","").strip()
        text = nav.get("text","").strip()
        slug = href.rstrip("/").split("/")[-1] if href else ""
        if text and slug and slug not in ("","#","pll_switcher","index.html","index","home"):
            return True, f"a[href*='{slug}']"
        return False, "nav a, [role='navigation'] a, header a"

def _scraper_has_search(scraped):
    for bar in scraped.get("search_bar", []):
        sel = bar.get("css_selector","").strip()
        if sel: return True, sel
    return False, "input[type='search']"

def _scraper_has_footer(scraped):
    for f in scraped.get("footer_data",[]):
        if f.get("visible"):
            sel = f.get("css_selector","").strip()
            return True, sel or "footer"
    return False, "footer"

def _scraper_has_auth(scraped):
    auth_kw = {"login","signin","register","signup","account","connexion"}
    for btn in scraped.get("buttons",[]):
        text = btn.get("text","").lower()
        css  = btn.get("css_selector","")
        if css and any(k in text for k in auth_kw): return True, css
    for nav in scraped.get("nav_links",[]):
        text = nav.get("text","").lower()
        href = nav.get("href","").lower()
        if any(k in text or k in href for k in auth_kw):
            slug = nav["href"].rstrip("/").split("/")[-1]
            if slug: return True, f"a[href*='{slug}']"
    return False, ""

def _scraper_has_logo(scraped):
    for img in scraped.get("images_audit",[]):
        alt = img.get("alt","").lower(); src = img.get("src","").lower()
        if "logo" in alt or "logo" in src:
            return True, "img[src*='logo'], .logo img, header img"
    return False, "img[src*='logo']"

def _scraper_real_nav_links(scraped, max_links=4):
    results, seen = [], set()
    base_domain = scraped.get("url","").split("/")[2] if "//" in scraped.get("url","") else ""
    for nav in scraped.get("nav_links",[]):
        href = nav.get("href","").strip(); text = nav.get("text","").strip()
        if not href or not text: continue
        slug = href.rstrip("/").split("/")[-1]
        if not slug or slug in ("#", "pll_switcher", "", "index.html", "index", "home"):
            continue
        if href.startswith("http") and base_domain and base_domain not in href: continue
        if slug in seen: continue
        seen.add(slug)
        results.append({"css": f"a[href*='{slug}']", "text": text, "slug": slug})
        if len(results) >= max_links: break
    return results

def _make_smoke_step(name, selector, check_type, reason, optional=None):
    meta = CRITICALITY.get(check_type, {"score": 40, "tier": 3, "optional": True})
    return {
        "name": name, "selector": selector, "type": check_type,
        "tier": meta.get("tier",3), "score": meta.get("score",40),
        "optional": meta.get("optional",True) if optional is None else optional,
        "reason": reason, "action": "check_visible", "value": "",
        "assertion": None, "category": "smoke",
        "priority": "high" if meta.get("tier",3)==1 else "medium",
        "expected": reason, "description": reason, "section": "smoke",
    }


    candidates = []
    url = scraped.get("url","")

    candidates.append(_make_smoke_step("Page body rendered","body","body","body element present",False))

    heading_sel = _scraper_best_heading(scraped)
    candidates.append(_make_smoke_step("Page heading visible", heading_sel, "heading",
        "Heading present — correct page loaded", False))

    content_sel = _scraper_best_main_content(scraped)
    candidates.append(_make_smoke_step("Main content area present", content_sel, "main_content",
        "Content container present", False))

    auth_found, auth_sel = _scraper_has_auth(scraped)
    if auth_found:
        candidates.append(_make_smoke_step("Auth entry point present", auth_sel, "auth",
            "Auth element detected", False))

    nav_found, nav_sel = _scraper_has_nav(scraped)
    if nav_found:
        candidates.append(_make_smoke_step("Navigation present", nav_sel, "navigation",
            "Navigation detected"))
        for link in _scraper_real_nav_links(scraped, max_links=4):
            candidates.append(_make_smoke_step(
                f"Nav link: {link['text'][:40]}", link["css"], "nav_link",
                f"Nav link '{link['text']}' present"))

    search_found, search_sel = _scraper_has_search(scraped)
    if search_found:
        candidates.append(_make_smoke_step("Search bar present", search_sel, "search",
            "Search component detected"))

    logo_found, logo_sel = _scraper_has_logo(scraped)
    if logo_found:
        candidates.append(_make_smoke_step("Brand logo visible", logo_sel, "logo",
            "Logo detected"))

    footer_found, footer_sel = _scraper_has_footer(scraped)
    if footer_found:
        candidates.append(_make_smoke_step("Footer present", footer_sel, "footer",
            "Footer detected"))

    candidates.sort(key=lambda x: x.get("score",0), reverse=True)
    seen, unique = set(), []
    for c in candidates:
        key = c["selector"][:120]
        if key not in seen:
            seen.add(key); unique.append(c)

    final = unique[:SMOKE_MAX_STEPS]
    if len(final) < SMOKE_MIN_STEPS:
        final = unique[:SMOKE_MIN_STEPS]

    for i, step in enumerate(final, 1):
        step["id"] = i; step["base_url"] = url
    return final
def _build_smoke_steps(scraped: dict) -> list:
    candidates = []
    url = scraped.get("url", "")
    seen_selectors = set()
    # ── AJOUT ICI : HTTP 200 + SSL + Load Time ────────────────────────────────
    import requests as req_lib

    # HTTP 200
    try:
        resp        = req_lib.get(url, timeout=10, allow_redirects=True)
        http_status = resp.status_code
        http_ok     = http_status == 200
    except Exception:
        http_status = 0
        http_ok     = False

    # SSL
    ssl_ok = url.startswith("https://")

    # Load Time
    load_time_ms    = scraped.get("load_time_ms", 0)
    print(f"[DEBUG] load_time_ms from scraped = {load_time_ms}")

    LOAD_THRESHOLD = 5000   # warning
    LOAD_CRITICAL  = 8000   # fail
    load_status = (
    "pass" if load_time_ms < LOAD_THRESHOLD
    else "fail"  # tout ce qui dépasse le seuil = fail
)
    load_ok         = 0 < load_time_ms < LOAD_THRESHOLD

    candidates.append({
        "name":        f"HTTP Status 200 (got {http_status})",
        "selector":    "body",
        "type":        "http_status",
        "tier":        1,
        "score":       98,
        "optional":    False,
        "reason":      f"HTTP response must be 200 — got {http_status}",
        "action":      "check_visible",
        "value":       "",
        "assertion":   None,
        "category":    "smoke",
        "priority":    "high",
        "expected":    "HTTP 200 OK",
        "description": f"HTTP response is {http_status}",
        "section":     "smoke",
        "status":      "pass" if http_ok else "fail",
        "suite":       "Pass — HTTP 200 OK" if http_ok else f"FAIL — HTTP {http_status} (expected 200)",
    })

    candidates.append({
        "name":        "SSL/HTTPS valid",
        "selector":    "body",
        "type":        "ssl",
        "tier":        1,
        "score":       97,
        "optional":    False,
        "reason":      "URL must use HTTPS",
        "action":      "check_visible",
        "value":       "",
        "assertion":   None,
        "category":    "smoke",
        "priority":    "high",
        "expected":    "URL starts with https://",
        "description": "URL must use HTTPS",
        "section":     "smoke",
        "status":      "pass" if ssl_ok else "fail",
        "suite":       "Pass — HTTPS valid" if ssl_ok else "FAIL — URL does not use HTTPS",
    })

    candidates.append({
        "name":        f"Load time acceptable ({load_time_ms}ms)",
        "selector":    "body",
        "type":        "performance",
        "tier":        1,
        "score":       95,
        "optional":    False,
        "reason":      f"Load time must be < {LOAD_THRESHOLD}ms",
        "action":      "check_visible",
        "value":       "",
        "assertion":   None,
        "category":    "smoke",
        "priority":    "high",
        "expected":    f"< {LOAD_THRESHOLD}ms",
        "description": f"Page loaded in {load_time_ms}ms",
        "section":     "smoke",
        "status":      "pass" if load_ok else "fail",
        "suite":       f"Pass — {load_time_ms}ms < {LOAD_THRESHOLD}ms" if load_ok else f"FAIL — {load_time_ms}ms > {LOAD_THRESHOLD}ms",
    })

    def _add(step):
        sel = step.get("selector", "")
        if sel and sel not in seen_selectors:
            seen_selectors.add(sel)
            candidates.append(step)

    # ── TIER 1 : éléments critiques (toujours testés) ─────────────────────────

    # 1. Body
    _add(_make_smoke_step("Page body rendered", "body", "body",
        "body element present", False))

    # 2. Heading
    heading_sel = _scraper_best_heading(scraped)
    _add(_make_smoke_step("Page heading visible", heading_sel, "heading",
        "Heading present — correct page loaded", False))

    # 3. Main content
    content_sel = _scraper_best_main_content(scraped)
    _add(_make_smoke_step("Main content area present", content_sel, "main_content",
        "Content container present", False))

    # 4. Auth
    auth_found, auth_sel = _scraper_has_auth(scraped)
    if auth_found:
        _add(_make_smoke_step("Auth entry point present", auth_sel, "auth",
            "Auth element detected", False))

    # ── TIER 2 : navigation complète ─────────────────────────────────────────

    nav_found, nav_sel = _scraper_has_nav(scraped)
    if nav_found:
        _add(_make_smoke_step("Navigation present", nav_sel, "navigation",
            "Navigation detected"))

        # TOUTES les nav links (plus de limite à 4)
        for link in _scraper_real_nav_links(scraped, max_links=20):
            _add(_make_smoke_step(
                f"Nav link: {link['text'][:40]}",
                link["css"], "nav_link",
                f"Nav link '{link['text']}' present"))

    # ── TIER 3 : search ───────────────────────────────────────────────────────

    search_found, search_sel = _scraper_has_search(scraped)
    if search_found:
        _add(_make_smoke_step("Search bar present", search_sel, "search",
            "Search component detected"))

    # ── TIER 4 : logo ─────────────────────────────────────────────────────────

    logo_found, logo_sel = _scraper_has_logo(scraped)
    if logo_found:
        _add(_make_smoke_step("Brand logo visible", logo_sel, "logo",
            "Logo detected"))

    # ── TIER 5 : footer + footer links ───────────────────────────────────────

    footer_found, footer_sel = _scraper_has_footer(scraped)
    if footer_found:
        _add(_make_smoke_step("Footer present", footer_sel, "footer",
            "Footer detected"))
        # Footer links
        for f in scraped.get("footer_data", []):
            for link in f.get("links", [])[:8]:
                lhref = link.get("href", "").strip()
                ltext = link.get("text", "").strip()
                if lhref and ltext:
                    slug = lhref.rstrip("/").split("/")[-1]
                    if slug and slug not in ("", "#", "pll_switcher", "index.html"):
                        _add(_make_smoke_step(
                            f"Footer link: {ltext[:40]}",
                            f"footer a[href*='{slug}']", "footer",
                            f"Footer link '{ltext}' present"))

    # ── TIER 6 : headings H2/H3 ──────────────────────────────────────────────

    for h in scraped.get("headings", [])[1:15]:  # Skip first heading (likely H1)
        css  = h.get("css_selector", "").strip()
        text = h.get("text", "").strip()
        if css and text:
            _add(_make_smoke_step(
                f"Heading: {text[:40]}",
                css, "heading",
                f"Heading '{text[:40]}' visible"))

    # ── TIER 7 : boutons CTA ─────────────────────────────────────────────────

    cta_kw = {"get started", "start", "try", "demo", "buy", "shop", "book",
              "order", "subscribe", "download", "contact", "learn more",
              "en savoir", "découvrir", "voir", "commencer"}

    for btn in scraped.get("buttons", [])[:20]:
        css  = btn.get("css_selector", "")
        text = btn.get("text", "").lower().strip()
        if not css or not text:
            continue
        is_cta = any(k in text for k in cta_kw) or any(
            k in css.lower() for k in ("primary", "cta", "hero", "action")
        )
        if is_cta:
            _add(_make_smoke_step(
                f"CTA button: {btn.get('text','')[:40]}",
                css, "cta",
                f"CTA button '{btn.get('text','')}' visible"))

    # ── TIER 8 : formulaires (check_visible seulement) ───────────────────────

    for f in scraped.get("forms", [])[:3]:
        css = f.get("css_selector", "")
        if css:
            _add(_make_smoke_step(
                "Form present",
                css, "input_field",
                "Form detected on page"))

    for inp in scraped.get("input_fields", [])[:10]:
        css = inp.get("css_selector", "")
        if css and inp.get("visible"):
            label = inp.get("label", inp.get("placeholder", inp.get("role", "input")))
            _add(_make_smoke_step(
                f"Input field: {label[:40]}",
                css, "input_field",
                f"Input '{label}' visible"))

    # ── TIER 9 : sections/cards visibles ─────────────────────────────────────

    for sec in scraped.get("content_sections", [])[:15]:
        css   = sec.get("css_selector", "")
        title = sec.get("title", sec.get("text", "section"))
        if css and title:
            _add(_make_smoke_step(
                f"Section: {title[:40]}",
                css, "section",
                f"Content section '{title[:40]}' visible"))

    for card in scraped.get("cards", [])[:12]:
        css   = card.get("css_selector", "")
        title = card.get("title", "card")
        if css:
            _add(_make_smoke_step(
                f"Card: {title[:40]}",
                css, "section",
                f"Card '{title[:40]}' visible"))

    # ── TIER 10 : images importantes ─────────────────────────────────────────

 
    # APRÈS — indentation correcte (le if est DANS la boucle)
    for i, img in enumerate(scraped.get("images_audit", [])[:5]):
        css    = img.get("css_selector", "")
        alt    = img.get("alt", "").strip()
        loaded = img.get("loaded", False)
        if css and loaded and img.get("width", 0) > 100:   # ← 8 espaces !
            src  = img.get("src", "").split("/")[-1][:30]
            name = alt if alt else (src if src else f"image-{i+1}")
            _add(_make_smoke_step(
                f"Image: {name[:40]}",
                css, "image",
                f"Image '{name}' visible and loaded"))

    # ── TIER 11 : lang switch ─────────────────────────────────────────────────

    for ls in scraped.get("lang_switcher", [])[:3]:
        hreflang = ls.get("hreflang", "").strip()
        text     = ls.get("text", hreflang or "lang").strip()
        if hreflang:
            css = f"a[hreflang='{hreflang}']"
        else:
            continue
        _add(_make_smoke_step(
            f"Lang switch: {text[:20]}",
            css, "lang_switch",
            f"Language switcher '{text}' present"))

    # ── TIER 12 : pagination ──────────────────────────────────────────────────

    if scraped.get("pagination"):
        _add(_make_smoke_step(
            "Pagination present",
            ".pagination, [class*='pagination'], [class*='page-item']",
            "pagination",
            "Pagination detected"))

    # ── Tri par score + déduplication ────────────────────────────────────────

    candidates.sort(key=lambda x: x.get("score", 0), reverse=True)

    final = candidates[:SMOKE_MAX_STEPS]
    if len(final) < SMOKE_MIN_STEPS:
        final = candidates[:SMOKE_MIN_STEPS]

    for i, step in enumerate(final, 1):
        step["id"] = i
        step["base_url"] = url

    return final

# ─────────────────────────────────────────────────────────────────────────────
# PAGE PROFILE CLASSIFIER
# ─────────────────────────────────────────────────────────────────────────────

def _classify_page_profile(scraped: dict) -> str:
    has_inputs = any(
        i.get("css_selector") and i.get("type") not in {"hidden","submit","button","reset"}
        for i in scraped.get("inputs",[])
    )
    has_forms   = bool(scraped.get("forms"))
    has_nav     = any(
        n.get("href") and n.get("text","").strip()
        and n["href"].rstrip("/").split("/")[-1] not in ("","#","pll_switcher")
        for n in scraped.get("nav_links",[])
    )
    has_buttons = bool(scraped.get("buttons"))
    if has_inputs or has_forms: return "rich"
    if has_nav or has_buttons:  return "nav_only"
    return "static"


# ─────────────────────────────────────────────────────────────────────────────
# SCRIPT BUILDERS (Selenium / Playwright / Cypress)
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
        "import time", "",
        "def setup_driver():",
        "    opts = Options()",
        "    opts.add_argument('--headless')",
        "    opts.add_argument('--no-sandbox')",
        "    opts.add_argument('--disable-dev-shm-usage')",
        "    opts.add_argument('--window-size=1920,1080')",
        "    driver = webdriver.Chrome(options=opts)",
        "    driver.set_page_load_timeout(30)",
        "    driver.implicitly_wait(10)",
        "    return driver", "",
    ]
    for i, step in enumerate(steps, 1):
        action    = step.get("action","check_visible")
        selector  = step.get("selector","")
        value     = step.get("value","")
        name      = step.get("name",f"step_{i}")
        fn_name   = f"test_{i}_" + re.sub(r"[^a-z0-9]","_",name.lower())[:30]
        assertion = step.get("assertion")
        optional  = _is_optional(step)
        lines.append(f"def {fn_name}(driver):")
        lines.append(f"    driver.get('{url}')")
        if action == "check_visible":
            if optional:
                lines += [f"    try:",
                          f"        el = WebDriverWait(driver,10).until(EC.presence_of_element_located((By.CSS_SELECTOR,'{selector}')))",
                          f"        assert el is not None",
                          f"    except Exception: print('[WARN] Optional: {selector}')"]
            else:
                lines += [f"    el = WebDriverWait(driver,15).until(EC.presence_of_element_located((By.CSS_SELECTOR,'{selector}')))",
                          f"    assert el is not None, 'Not found: {selector}'"]
        elif action == "click":
            lines += [f"    el = WebDriverWait(driver,15).until(EC.element_to_be_clickable((By.CSS_SELECTOR,'{selector}')))",
                      f"    el.click()", f"    time.sleep(1)"]
            if assertion:
                if assertion.get("type") == "url_contains":
                    lines.append(f"    assert '{assertion['value']}' in driver.current_url")
                elif assertion.get("type") in ("element_visible","element_exists"):
                    t = assertion.get("selector_target","")
                    lines.append(f"    WebDriverWait(driver,10).until(EC.presence_of_element_located((By.CSS_SELECTOR,'{t}')))")
                elif assertion.get("type") == "text_contains":
                    t = assertion.get("selector_target",""); v = assertion.get("value","")
                    lines += [f"    el2 = driver.find_element(By.CSS_SELECTOR,'{t}')",
                              f"    assert '{v}' in el2.text"]
                elif assertion.get("type") == "element_not_visible":
                    t = assertion.get("selector_target","")
                    lines.append(f"    assert len(driver.find_elements(By.CSS_SELECTOR,'{t}')) == 0")
        elif action == "fill":
            lines += [f"    el = WebDriverWait(driver,15).until(EC.presence_of_element_located((By.CSS_SELECTOR,'{selector}')))",
                      f"    el.clear()", f"    el.send_keys('{value}')"]
            if assertion and assertion.get("type") == "input_value":
                lines.append(f"    assert el.get_attribute('value') == '{value}'")
        lines.append("")

    fn_names = [f"test_{i}_"+re.sub(r"[^a-z0-9]","_",s.get("name","step").lower())[:30]
                for i,s in enumerate(steps,1)]
    lines += ["if __name__ == '__main__':",
              "    driver = setup_driver()",
              "    tests = ["+", ".join(fn_names)+"]",
              "    passed = failed = 0",
              "    try:",
              "        for i,t in enumerate(tests,1):",
              "            try: t(driver); print(f'Test {i}: PASSED'); passed+=1",
              "            except Exception as e: print(f'Test {i}: FAILED — {e}'); failed+=1",
              "    finally:",
              "        driver.quit()",
              "        print(f'\\n{passed} passed / {failed} failed')"]
    return "\n".join(lines)

def _build_playwright_script(steps: list, url: str) -> str:
    lines = [
        "from playwright.sync_api import sync_playwright, expect",
        "import pytest, re", "",
        f"BASE_URL = '{url}'", "",
        "@pytest.fixture(scope='module')",
        "def page():",
        "    with sync_playwright() as p:",
        "        browser = p.chromium.launch(headless=True)",
        "        ctx = browser.new_context(viewport={'width':1920,'height':1080})",
        "        pg = ctx.new_page()",
        "        pg.goto(BASE_URL, wait_until='domcontentloaded')",
        "        yield pg",
        "        browser.close()", "",
    ]
    for i, step in enumerate(steps, 1):
        action    = step.get("action","check_visible")
        selector  = step.get("selector","")
        value     = step.get("value","")
        name      = step.get("name",f"step_{i}")
        fn_name   = "test_"+re.sub(r"[^a-z0-9]","_",name.lower())[:40]
        assertion = step.get("assertion")
        optional  = _is_optional(step)
        lines.append(f"def {fn_name}(page):")
        if action == "check_visible":
            if optional:
                lines += [f"    try: expect(page.locator('{selector}').first).to_be_visible(timeout=10000)",
                          f"    except Exception: pytest.skip('Optional: {selector}')"]
            else:
                lines.append(f"    expect(page.locator('{selector}').first).to_be_visible(timeout=15000)")
        elif action == "click":
            lines += [f"    page.locator('{selector}').first.click()",
                      f"    page.wait_for_load_state('domcontentloaded')"]
            if assertion:
                if assertion.get("type") == "url_contains":
                    av = re.escape(assertion.get("value",""))
                    lines.append(f"    expect(page).to_have_url(re.compile(r'{av}'))")
                elif assertion.get("type") in ("element_visible","element_exists"):
                    at = assertion.get("selector_target","")
                    lines.append(f"    expect(page.locator('{at}').first).to_be_visible(timeout=15000)")
                elif assertion.get("type") == "text_contains":
                    at = assertion.get("selector_target",""); av = assertion.get("value","")
                    lines.append(f"    expect(page.locator('{at}').first).to_contain_text('{av}')")
                elif assertion.get("type") == "element_not_visible":
                    at = assertion.get("selector_target","")
                    lines.append(f"    expect(page.locator('{at}')).to_have_count(0)")
        elif action == "fill":
            lines.append(f"    page.fill('{selector}','{value}')")
            if assertion and assertion.get("type") == "input_value":
                lines.append(f"    expect(page.locator('{selector}')).to_have_value('{value}')")
        lines.append("")
    return "\n".join(lines)

def _build_cypress_script(steps: list, url: str) -> str:
    lines = [
        "// Cypress functional suite — NexTest v13",
        f"const BASE_URL = '{url}';", "",
        "describe('NexTest Full Coverage Suite', () => {",
        "  beforeEach(() => { cy.visit(BASE_URL); });", "",
    ]
    for i, step in enumerate(steps, 1):
        action    = step.get("action","check_visible")
        selector  = step.get("selector","")
        value     = step.get("value","")
        name      = step.get("name",f"step {i}")
        assertion = step.get("assertion")
        optional  = _is_optional(step)
        section   = step.get("section","general")
        lines.append(f"  // [{section.upper()}]")
        lines.append(f"  it('{name}', () => {{")
        if action == "check_visible":
            if optional:
                lines += [f"    cy.get('body').then($b => {{",
                          f"      if ($b.find('{selector}').length > 0) cy.get('{selector}').first().should('exist');",
                          f"      else cy.log('WARN: optional — {selector}');",
                          f"    }});"]
            else:
                lines.append(f"    cy.get('{selector}').first().should('exist');")
        elif action == "click":
            lines.append(f"    cy.get('{selector}').first().click();")
            if assertion:
                if assertion.get("type") == "url_contains":
                    lines.append(f"    cy.url().should('include', '{assertion['value']}');")
                elif assertion.get("type") in ("element_visible","element_exists"):
                    ct = assertion.get("selector_target","")
                    lines.append(f"    cy.get('{ct}').should('be.visible');")
                elif assertion.get("type") == "text_contains":
                    ct = assertion.get("selector_target",""); cv = assertion.get("value","")
                    lines.append(f"    cy.get('{ct}').should('contain', '{cv}');")
                elif assertion.get("type") == "element_not_visible":
                    ct = assertion.get("selector_target","")
                    lines.append(f"    cy.get('{ct}').should('not.exist');")
        elif action == "fill":
            lines.append(f"    cy.get('{selector}').clear().type('{value}');")
            if assertion and assertion.get("type") == "input_value":
                lines.append(f"    cy.get('{selector}').should('have.value', '{value}');")
        lines += ["  });", ""]
    lines.append("});")
    return "\n".join(lines)

def _build_scripts(steps: list, url: str, framework: str) -> dict:
    fw = framework.lower()
    s  = {"script":"","script_selenium":"","script_playwright":"","script_cypress":""}
    if fw == "selenium":
        s["script_selenium"] = _build_selenium_script(steps, url)
        s["script"]          = s["script_selenium"]
    elif fw == "playwright":
        s["script_playwright"] = _build_playwright_script(steps, url)
        s["script"]            = s["script_playwright"]
    elif fw == "cypress":
        s["script_cypress"] = _build_cypress_script(steps, url)
        s["script"]         = s["script_cypress"]
    elif fw in ("both","all"):
        s["script_selenium"]   = _build_selenium_script(steps, url)
        s["script_playwright"] = _build_playwright_script(steps, url)
        s["script_cypress"]    = _build_cypress_script(steps, url)
        s["script"]            = s["script_selenium"]
    return s


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def generate_tests(
    scraped:       dict,
    framework:     str,
    username:      str = None,
    password:      str = None,
    test_type:     str = "smoke",
    user_scenario: str = None,
) -> dict:

    if test_type not in TEST_TYPE_PROFILES:
        test_type = "smoke"

    url          = scraped.get("url","")
    page_profile = _classify_page_profile(scraped)

    print(f"[GEN v13] {test_type} | profile={page_profile} | url={url}")
    
    print(f"[SCRAPER] buttons: {len(scraped.get('buttons', []))}")
    print(f"[SCRAPER] nav_links: {len(scraped.get('nav_links', []))}")
    print(f"[SCRAPER] content_sections: {len(scraped.get('content_sections', []))}")
    print(f"[SCRAPER] footer_data: {len(scraped.get('footer_data', []))}")
    print(f"[SCRAPER] headings: {len(scraped.get('headings', []))}")
    print(f"[SCRAPER] cards: {len(scraped.get('cards', []))}")
    print(f"[SCRAPER] images_audit: {len(scraped.get('images_audit', []))}")
    print(f"[SCRAPER] forms: {len(scraped.get('forms', []))}")

    # ── SMOKE : deterministic, no LLM ────────────────────────────────────────
    if test_type == "smoke":
        print(f"[DEBUG] ENTERING SMOKE BRANCH")
        steps = _build_smoke_steps(scraped)
        for step in steps:
            step["base_url"] = url
        scripts = _build_scripts(steps, url, framework)
        print(f"[GEN v13] smoke OK | {len(steps)} steps")
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
            "coverage_report":     None,
        }

    # ── FUNCTIONAL / REGRESSION : section-based full coverage ────────────────

    # ── SMOKE : deterministic, no LLM ────────────────────────────────────────
    if test_type == "smoke":
        print(f"[DEBUG] ENTERING SMOKE BRANCH")
        steps = _build_smoke_steps(scraped)
        for step in steps:
            step["base_url"] = url
        scripts = _build_scripts(steps, url, framework)
        print(f"[GEN v13] smoke OK | {len(steps)} steps")
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
            "coverage_report":     None,
        }

    # ── FUNCTIONAL / REGRESSION : section-based full coverage ────────────────

    if page_profile == "static" and not user_scenario:
        print(f"[GEN v13] static page — no interactions found")
        return {
            "test_cases": [],
            "test_type":  test_type,
            "downgraded": True,
            "downgrade_reason": "No interactable elements found.",
        }

    # 1. Extract sections
    sections  = _extract_sections(scraped)

    # 1. Extract sections
    sections  = _extract_sections(scraped)
    workflows = _define_workflows(sections, scraped)
    tracker   = CoverageTracker(sections)

    print(f"[GEN v13] Sections detected: "
          + ", ".join(f"{s}:{len(e)}" for s,e in sections.items() if e))

    # 2. Generate steps per section
    all_steps  = []
    current_id = 1

    for sec_name in SECTION_PRIORITY:
        elems = sections.get(sec_name, [])
        if not elems and sec_name != "workflow":
            continue

        if sec_name == "workflow":
            sec_steps = _generate_workflow_steps(workflows, scraped, start_id=current_id)
        else:
            sec_steps = _generate_section_steps(
                section_name=sec_name,
                elements=elems,
                scraped=scraped,
                start_id=current_id,
            )

        if sec_steps:
            print(f"[GEN v13] Section '{sec_name}': {len(sec_steps)} steps")
            all_steps.extend(sec_steps)
            current_id += len(sec_steps)

            # Track coverage
            for step in sec_steps:
                sel = step.get("selector","")
                if sel:
                    tracker.mark_tested(sec_name, sel)

    # 3. Deduplicate by action+selector
    seen_keys     = set()
    unique_steps  = []
    for step in all_steps:
        key = f"{step.get('action')}:{step.get('selector','')}"
        if key not in seen_keys:
            seen_keys.add(key)
            unique_steps.append(step)

    # 4. Renumber + enrich
    profile = TEST_TYPE_PROFILES[test_type]
    for i, step in enumerate(unique_steps, 1):
        step["id"]          = i
        step["base_url"]    = url
        step["category"]    = step.get("category", profile["category"])
        step["priority"]    = step.get("priority", profile["priority"])
        step["description"] = step.get("expected","")
        step["section"]     = step.get("section","general")
        step.setdefault("assertion", None)
        step.setdefault("optional",  False)

    # 5. Coverage report
    coverage_report = tracker.report()
    coverage_report["note"] = (
        "coverage_percentage reflects tested/detected interactive elements. "
        "It does NOT mean 100% of page behaviour is validated."
    )

    print(f"[GEN v13] DONE | {len(unique_steps)} steps | "
          f"coverage={coverage_report['coverage_percentage']}% "
          f"({coverage_report['total_tested_elements']}/{coverage_report['total_detected_elements']})")

    # 6. Build scripts
    scripts = _build_scripts(unique_steps, url, framework)

    return {
        "test_cases":          unique_steps,
        "test_cases_selenium": unique_steps,
        "test_cases_cypress":  unique_steps,
        "script":              scripts["script"],
        "script_selenium":     scripts["script_selenium"],
        "script_playwright":   scripts["script_playwright"],
        "script_cypress":      scripts["script_cypress"],
        "page_type":           "general",
        "test_type":           test_type,
        "page_profile":        page_profile,
        "user_scenario":       user_scenario or "",
        "total_steps":         len(unique_steps),
        "coverage_report":     coverage_report,
    }