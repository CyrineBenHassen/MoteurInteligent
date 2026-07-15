
import json
import os
from urllib.parse import urlparse
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

DEFAULT_FEATURES = ["page_content", "navigation", "buttons", "form_fields"]

def _get_page_features(path: str, doc_text: str = "") -> list:
    if not doc_text:
        return DEFAULT_FEATURES

    print(f"[FUNCTIONAL_GENERATOR] Extracting features for {path} from doc_text via LLM...")
    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a feature extractor. Given documentation and a page path, "
                        "extract the UI features/elements present on that page. "
                        "Return ONLY a JSON array of short strings like "
                        "[\"form_fields\", \"search_filter\", \"create_button\"]. "
                        "No markdown, no explanation."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Page path: {path}\n\nDocumentation:\n{doc_text[:2000]}\n\nWhat UI features exist on this page?",
                },
            ],
            temperature=0.1,
            max_tokens=300,
        )
        raw = resp.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        features = json.loads(raw.strip())
        if isinstance(features, list) and len(features) > 0:
            print(f"[FUNCTIONAL_GENERATOR] LLM extracted features: {features}")
            return features
        return DEFAULT_FEATURES
    except Exception as e:
        print(f"[FUNCTIONAL_GENERATOR] Feature extraction error: {e} — using defaults")
        return DEFAULT_FEATURES
_EXPECTED_FALLBACK = {
    "navigate":      "The page loads successfully without errors",
    "click":         "The element responds to the click action as expected",
    "fill":          "The field accepts and retains the entered value",
    "check_visible": "The element is visible and accessible on the page",
    "check_text":    "The expected text appears on the page",
    "select":        "An option is selected successfully in the dropdown",
    "hover":         "The hover state is applied to the element",
    "auth_success":  "Login succeeds and the dashboard becomes accessible",
    "auth_fail":     "Login is rejected and an error message is displayed",
}

def _clean_expected(tc: dict) -> str:
    """Guards against the LLM returning non-string values (true/false/null)
    for 'expected' — falls back to a readable sentence based on action type."""
    raw = tc.get("expected", "")
    if isinstance(raw, str) and raw.strip() and raw.strip().lower() not in ("true", "false", "none", "null"):
        return raw.strip()
    if tc.get("steps"):
        return "The workflow completes successfully with the expected result"
    action = tc.get("action", "navigate")
    return _EXPECTED_FALLBACK.get(action, "The step completes successfully")
def generate_functional_tests(base_url: str, target_url: str = None, username: str = "", password: str = "", doc_text: str = "", has_captcha: bool = False) -> dict:
    print(f"[FUNCTIONAL_GENERATOR] username='{username}' | password='{password[:15] if password else 'EMPTY'}'") 
    username = username.strip()
    password = password.strip()

    url_to_test = target_url or base_url

    parsed    = urlparse(url_to_test)
    page_path = parsed.path or "/dashboard"
    base      = "{0}://{1}".format(parsed.scheme, parsed.netloc)

    features     = _get_page_features(page_path, doc_text)
    is_login     = "login" in page_path.lower()
    features_str = ", ".join(features)

    print("[FUNCTIONAL_GENERATOR] Generating tests for: " + url_to_test)
    print("[FUNCTIONAL_GENERATOR] Page: " + page_path + " | Features: " + features_str)

    # Build page-specific rules as plain string (no nested f-string)
    if is_login:
        if has_captcha:
            steps_list = (
                "- Generate exactly these 8 tests in this order:\n"
                "  1. action=navigate, selector='body'\n"
                "  2. action=check_visible, selector='#basic_email'\n"
                "  3. action=fill, selector='#basic_email', fill_value='" + username + "'\n"
                "  4. action=fill, selector='#basic_password', fill_value='" + password + "'\n"
                "  5. action=click, selector='button[type=submit]'\n"
                "  6. action=check_visible, selector='#basic_captcha'\n"
                "  7. action=auth_success — name='Authentification reussie', category='authentication', selector='body', fill_value='', expected='Dashboard visible'\n"
                "  8. action=auth_fail — name='Authentification echouee', category='authentication', selector='body', fill_value='', expected='Message erreur visible'\n"
                "- For tests 7 and 8, action must be exactly 'auth_success' and 'auth_fail'\n"
            )
        else:
            steps_list = (
                "- Generate exactly these 7 tests in this order (NO captcha test — this app has no captcha):\n"
                "  1. action=navigate, selector='body'\n"
                "  2. action=check_visible, selector='#basic_email'\n"
                "  3. action=fill, selector='#basic_email', fill_value='" + username + "'\n"
                "  4. action=fill, selector='#basic_password', fill_value='" + password + "'\n"
                "  5. action=click, selector='button[type=submit]'\n"
                "  6. action=auth_success — name='Authentification reussie', category='authentication', selector='body', fill_value='', expected='Dashboard visible'\n"
                "  7. action=auth_fail — name='Authentification echouee', category='authentication', selector='body', fill_value='', expected='Message erreur visible'\n"
                "- For tests 6 and 7, action must be exactly 'auth_success' and 'auth_fail'\n"
            )

        page_rules = (
            "- This IS the login page. requires_login=false for all tests.\n"
            + steps_list +
            "- DO NOT use check_text for authentication tests\n"
        )
        login_context = ""
    else:
        form_features  = [f for f in features if any(x in f for x in ["form", "input", "fields"])]
        action_features = [f for f in features if any(x in f for x in ["button", "action"])]
        page_rules = (
            "- requires_login=true for all tests\n"
            "- Start with 1-2 navigation tests (page loads, main element visible)\n"
            "- CRITICAL: ONLY generate tests for elements EXPLICITLY confirmed present in the "
            "- STRICT RULE: only use CSS selectors that appear literally in the 'CONFIRMED selectors' "
            "line of the documentation above. NEVER create sub-selectors like '.ant-card-title' or "
            "'.ant-page-header-title' unless that exact string is listed as confirmed.\n"
            "'Real scraped elements' documentation above. DO NOT generate a test for menu, table, "
            "form, create button, search, or 404-page UNLESS that exact element is listed as present.\n"
            "- If the documentation says 'NO form present' or 'no_create_button' or similar negative "
            "feature, DO NOT generate any test targeting that element type.\n"
            "- Reference selectors (use ONLY if the matching element was confirmed present):\n"
            "  navigation: .ant-menu, .ant-menu-item, .ant-layout-sider, .ant-breadcrumb\n"
            "  stats/cards: .ant-card, .ant-statistic, .ant-card-body\n"
            "  tables: .ant-table, .ant-table-row, .ant-pagination\n"
            "  buttons: .ant-btn, button, .ant-btn-primary\n"
            "  forms: .ant-input, .ant-select, .ant-form-item, input, textarea\n"
            "  header: .ant-layout-header, .ant-page-header, header\n"
            "- NEVER invent class names like '.stat_cards', '.sidebar_navigation', '.header_menu'\n"
            "- fill_value: use realistic sample data. For filter/search fields specifically, "
            "extract a real, distinctive word or substring from the 'documentation'/scraped content "
            "above (e.g. an actual name, code, or label visible on the page) — NEVER invent a generic "
            "word like 'reference', 'test', or 'designation' that likely won't match any real row.\n"
            "- For check_text steps verifying filter/search results: set expected_text to that same "
            "real substring you used as fill_value, NOT a generic sentence like 'Les resultats sont "
            "affiches' — such invented sentences never appear literally in the DOM and will always fail.\n"
            "- CRITICAL for fill actions: NEVER use '.ant-form-item' or '.ant-form-item-control' as the "
            "fill selector — these are wrapper divs, not inputs. Always target the actual input, e.g. "
            "'.ant-form-item input', 'input[placeholder*=\"reference\" i]', or the exact input selector "
            "from the confirmed elements list.\n"
            "- DO NOT generate a separate check_text test just to verify 'no 404' or 'page loads without error' "
            "— the navigate action test already validates this automatically in the runner. Only use check_text "
            "to verify specific, meaningful content (e.g. a filtered result, an error message, a success banner).\n"
            + (f"- Focus ONLY on the features specific to {page_path} based on the documentation provided above.\n" if doc_text else "")
        )
        
        login_context = (
            "Login URL: " + base + "/login\n"
            "Credentials: username=" + username + ", password=" + password + "\n"
        )
        

    requires_login_default = "false" if is_login else "true"

    app_context = f"Application documentation:\n{doc_text[:1500]}\n\n" if doc_text else ""

    prompt = (
        "You are a functional testing expert using Playwright for internal web apps.\n\n"
        + app_context +
        "Base URL: " + base + "\n"
        + login_context +
        "Target page to test: " + url_to_test + "\n"
        "Page path: " + page_path + "\n"
        "Known features on this page: " + features_str + "\n\n"
        "Generate Playwright functional test cases for THIS PAGE ONLY covering:\n"
        "1. navigation — Page loads, title/content visible, no 404\n"
        "2. form — Fill inputs, check fields visible, submit (if form exists)\n"
        "3. action — Click buttons (validate, reject, send, create), check result\n"
        "4. authentication — Only if this is the login page\n\n"
        "Return ONLY a valid JSON array. No markdown. No explanation.\n\n"
        "Each test must have EXACTLY this structure:\n"
        '{\n'
        '  "id": 1,\n'
        '  "name": "Nom du test en francais",\n'
        '  "category": "navigation|form|action|authentication",\n'
        '  "severity": "critical|high|medium|low",\n'
        '  "page": "' + page_path + '",\n'
        '  "url": "' + url_to_test + '",\n'
        '  "action": "navigate|click|fill|check_visible|check_text|select|hover",\n'
        '  "selector": "CSS selector precis",\n'
        '  "expected": "Ce qui doit se passer",\n'
        '  "description": "Ce que ce test verifie",\n'
        '  "requires_login": ' + requires_login_default + ',\n'
        '  "priority": "high|medium|low",\n'
        '  "fill_value": "valeur si action=fill sinon vide",\n'
        '  "wait_after_ms": 2000\n'
        '}\n\n'
        "ALTERNATE structure for multi-step SCENARIOS (use for real workflows: filter, "
        "add/edit/delete item, submit a form and verify the result — NOT for simple visibility checks):\n"
        "Omit top-level 'action' and 'selector', use a 'steps' array instead:\n"
        '{\n'
        '  "id": 2,\n'
        '  "name": "Filtrer par designation retourne les bons resultats",\n'
        '  "category": "action",\n'
        '  "severity": "high",\n'
        '  "page": "' + page_path + '",\n'
        '  "url": "' + url_to_test + '",\n'
        '  "steps": [\n'
        '    {"action": "fill", "selector": "CSS precis", "fill_value": "valeur reelle"},\n'
        '    {"action": "click", "selector": "CSS precis"},\n'
        '    {"action": "check_text", "selector": "", "expected_text": "texte attendu dans le resultat"}\n'
        '  ],\n'
        '  "expected": "La table se met a jour avec les bons resultats",\n'
        '  "description": "...",\n'
        '  "requires_login": ' + requires_login_default + ',\n'
        '  "priority": "high",\n'
        '  "fill_value": "",\n'
        '  "wait_after_ms": 2000\n'
        '}\n'
        "steps[].action can be: fill|click|check_visible|check_text|select|hover — "
        "same selector rules apply (only CONFIRMED selectors from the documentation).\n"
        "REQUIREMENT: at least 2 of your 'action' or 'form' category tests MUST use the "
        "'steps' scenario format if a filter/search, add/create, or edit/delete workflow "
        "is present on this page. Simple presence checks (navigation, check_visible) stay "
        "single-action.\n\n"
        "RULES for this page (" + page_path + "):\n"
        + page_rules + "\n\n"
        "Generate between 6 and 10 tests total. Focus on what makes sense for THIS specific page.\n"
        "Return ONLY the JSON array."
    )

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a functional testing expert. Return only valid JSON arrays. No markdown. No preamble."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=4000,
        )

        raw = resp.choices[0].message.content.strip()

        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        test_cases = json.loads(raw)

        _VAGUE_TEXTS = {"", "404", "not found", "error", "identifiants incorrects"}

        cleaned = []
        skipped_vague = 0
        for i, tc in enumerate(test_cases, 1):
            if (tc.get("action") == "check_text" and not tc.get("steps")
                    and (tc.get("selector", "") or "").strip().lower() in _VAGUE_TEXTS):
                skipped_vague += 1
                continue
            cleaned.append({
        
                "id":             len(cleaned) + 1,
                "steps":          tc.get("steps", None),
                "name":           tc.get("name", "Functional Test " + str(i)),
                "category":       tc.get("category", "navigation"),
                "severity":       tc.get("severity", "medium"),
                "page":           tc.get("page", page_path),
                "url":            tc.get("url", url_to_test),
                "action":         tc.get("action", "navigate"),
                "selector":       tc.get("selector", ""),
                "expected":       _clean_expected(tc),
                "description":    tc.get("description", "") if isinstance(tc.get("description", ""), str) and tc.get("description", "").strip() else _clean_expected(tc),
                "requires_login": tc.get("requires_login", not is_login),
                "priority":       tc.get("priority", "medium"),
                "fill_value":     tc.get("fill_value", ""),
                "wait_after_ms":  tc.get("wait_after_ms", 2000),
            })
            
        if skipped_vague:
            print(f"[FUNCTIONAL_GENERATOR] Skipped {skipped_vague} vague check_text test(s)")

        print("[FUNCTIONAL_GENERATOR] Generated " + str(len(cleaned)) + " tests for " + page_path)

       
          
        return {
            "test_cases": cleaned,
            "total":      len(cleaned),
            "base_url":   base,
            "target_url": url_to_test,
            "page":       page_path,
            "features":   features,
            "categories": {
                "authentication": len([t for t in cleaned if t["category"] == "authentication"]),
                "navigation":     len([t for t in cleaned if t["category"] == "navigation"]),
                "form":           len([t for t in cleaned if t["category"] == "form"]),
                "action":         len([t for t in cleaned if t["category"] == "action"]),
            }
        }

    except json.JSONDecodeError as e:
        print("[FUNCTIONAL_GENERATOR] JSON error: " + str(e) + " — fallback")
        return _fallback_tests(base, url_to_test, page_path, features, is_login, username, password)


    except Exception as e:
        print("[FUNCTIONAL_GENERATOR] LLaMA error: " + str(e) + " — fallback")
        return _fallback_tests(base, url_to_test, page_path, features, is_login, username, password)



def _fallback_tests(base_url: str, url: str, page_path: str, features: list, is_login: bool, username: str = "", password: str = "") -> dict:
    static = [
        {
            "id": 1,
            "name": "La page " + page_path + " se charge",
            "category": "navigation",
            "severity": "critical",
            "page": page_path,
            "url": url,
            "action": "navigate",
            "selector": "body",
            "expected": "Page chargee sans erreur",
            "description": "La page doit etre accessible",
            "requires_login": not is_login,
            "priority": "high",
            "fill_value": "",
            "wait_after_ms": 2000,
        },
        {
            "id": 2,
            "name": "Contenu principal visible",
            "category": "navigation",
            "severity": "high",
            "page": page_path,
            "url": url,
            "action": "check_visible",
            "selector": "div",
            "expected": "Contenu principal visible",
            "description": "Le contenu de la page doit etre affiche",
            "requires_login": not is_login,
            "priority": "high",
            "fill_value": "",
            "wait_after_ms": 2000,
        },
    ]

    if is_login:
        static += [
            {
                "id": 3, "name": "Champ email visible",
                "category": "authentication", "severity": "critical",
                "page": page_path, "url": url,
                "action": "check_visible", "selector": "#basic_email",
                "expected": "Email visible", "description": "Email input visible",
                "requires_login": False, "priority": "high",
                "fill_value": "", "wait_after_ms": 1000,
            },
            {
                "id": 4, "name": "Saisie email",
                "category": "authentication", "severity": "critical",
                "page": page_path, "url": url,
                "action": "fill", "selector": "#basic_email",
                "expected": "Email saisi", "description": "Fill email field",
                "requires_login": False, "priority": "high",
                "fill_value": username, "wait_after_ms": 500,
            },
            {
                "id": 5, "name": "Saisie mot de passe",
                "category": "authentication", "severity": "critical",
                "page": page_path, "url": url,
                "action": "fill", "selector": "#basic_password",
                "expected": "Mot de passe saisi", "description": "Fill password field",
                "requires_login": False, "priority": "high",
                "fill_value": password, "wait_after_ms": 500,
            },
            {
                "id": 6, "name": "Clic bouton submit",
                "category": "authentication", "severity": "critical",
                "page": page_path, "url": url,
                "action": "click", "selector": "button[type=submit]",
                "expected": "Formulaire soumis", "description": "Submit button clickable",
                "requires_login": False, "priority": "high",
                "fill_value": "", "wait_after_ms": 3000,
            },
        ]
    else:
        if any(f in features for f in ["form_fields", "create_button"]):
            static.append({
                "id": 3, "name": "Champ de formulaire visible",
                "category": "form", "severity": "high",
                "page": page_path, "url": url,
                "action": "check_visible", "selector": "input, textarea, .ant-input",
                "expected": "Champ visible", "description": "Form fields present",
                "requires_login": True, "priority": "high",
                "fill_value": "", "wait_after_ms": 2000,
            })
        if any(f in features for f in ["validate_button", "reject_button", "assign_button"]):
            static.append({
                "id": 4, "name": "Bouton d'action visible",
                "category": "action", "severity": "high",
                "page": page_path, "url": url,
                "action": "check_visible", "selector": "button, .ant-btn",
                "expected": "Bouton visible", "description": "Action buttons present",
                "requires_login": True, "priority": "high",
                "fill_value": "", "wait_after_ms": 2000,
            })

    return {
        "test_cases": static,
        "total":      len(static),
        "base_url":   base_url,
        "target_url": url,
        "page":       page_path,
        "features":   features,
        "categories": {
            "authentication": len([t for t in static if t["category"] == "authentication"]),
            "navigation":     len([t for t in static if t["category"] == "navigation"]),
            "form":           len([t for t in static if t["category"] == "form"]),
            "action":         len([t for t in static if t["category"] == "action"]),
        }
    }