
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

def generate_functional_tests(base_url: str, target_url: str = None, username: str = "", password: str = "", doc_text: str = "") -> dict:
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
        page_rules = (
            "- This IS the login page. requires_login=false for all tests.\n"
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
            "- DO NOT use check_text for authentication tests\n"
        )
        login_context = ""
    else:
        form_features  = [f for f in features if any(x in f for x in ["form", "input", "fields"])]
        action_features = [f for f in features if any(x in f for x in ["button", "action"])]
        page_rules = (
            "- requires_login=true for all tests\n"
            "- Start with 1-2 navigation tests (page loads, main element visible)\n"
            "- Generate form tests for features: " + ", ".join(form_features) + "\n"
            "- Generate action tests for: " + ", ".join(action_features) + "\n"
            "- Use ONLY these real Ant Design selectors:\n"
            "  navigation: .ant-menu, .ant-menu-item, .ant-layout-sider, .ant-breadcrumb\n"
            "  stats/cards: .ant-card, .ant-statistic, .ant-card-body\n"
            "  tables: .ant-table, .ant-table-row, .ant-pagination\n"
            "  buttons: .ant-btn, button, .ant-btn-primary\n"
            "  forms: .ant-input, .ant-select, .ant-form-item, input, textarea\n"
            "  header: .ant-layout-header, .ant-page-header, header\n"
            "- NEVER invent class names like '.stat_cards', '.sidebar_navigation', '.header_menu'\n"
            "- fill_value: use realistic sample data\n"
            + (f"- Focus on the features specific to {page_path} based on the documentation provided.\n" if doc_text else "")
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

        cleaned = []
        for i, tc in enumerate(test_cases, 1):
            cleaned.append({
                "id":             i,
                "name":           tc.get("name", "Functional Test " + str(i)),
                "category":       tc.get("category", "navigation"),
                "severity":       tc.get("severity", "medium"),
                "page":           tc.get("page", page_path),
                "url":            tc.get("url", url_to_test),
                "action":         tc.get("action", "navigate"),
                "selector":       tc.get("selector", ""),
                "expected":       tc.get("expected", "Action reussie"),
                "description":    tc.get("description", ""),
                "requires_login": tc.get("requires_login", not is_login),
                "priority":       tc.get("priority", "medium"),
                "fill_value":     tc.get("fill_value", ""),
                "wait_after_ms":  tc.get("wait_after_ms", 2000),
            })

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