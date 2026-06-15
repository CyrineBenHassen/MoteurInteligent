# functional_generator.py — NexTest Functional Test Generator (single page, LLaMA-powered)

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

# ── Map page path → features connues ─────────────────────────────────────────
PAGE_FEATURES = {
    "/dashboard": ["click_menu_item", "click_card", "verify_data", "navigate_to_page"],
    "/reception":                      ["dossier_list", "search_filter", "open_dossier", "assign_button"],
    "/outbox":                         ["dossier_list", "search_filter", "send_action"],
    "/traitement_dossier_eie":         ["form_fields", "validate_button", "reject_button", "submit_form"],
    "/traitement_dossier_ed":          ["form_fields", "validate_button", "reject_button"],
    "/traitement_dossier_avis":        ["form_fields", "validate_button", "submit_form"],
    "/traitement_dossier_transaction": ["form_fields", "validate_button"],
    "/gestion_commission":             ["commission_list", "create_button", "form_fields"],
    "/reunions":                       ["reunion_list", "create_button", "form_fields", "calendar"],
    "/traitement_dossier_cc":          ["form_fields", "validate_button", "reject_button"],
    "/visites":                        ["visite_list", "create_button", "form_fields"],
    "/statistiques":                   ["charts", "filters", "export_button"],
    "/admin-anpe/login":               ["email_input", "password_input", "submit_button", "captcha"],
}


def _get_page_features(path: str) -> list:
    if path in PAGE_FEATURES:
        return PAGE_FEATURES[path]
    for key, features in PAGE_FEATURES.items():
        if key in path:
            return features
    return ["page_content", "navigation", "buttons", "form_fields"]


def generate_functional_tests(base_url: str, target_url: str = None) -> dict:
    url_to_test = target_url or base_url

    parsed    = urlparse(url_to_test)
    page_path = parsed.path or "/dashboard"
    base      = "{0}://{1}".format(parsed.scheme, parsed.netloc)

    features     = _get_page_features(page_path)
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
            "  3. action=fill, selector='#basic_email', fill_value='admin@admin.com'\n"
            "  4. action=fill, selector='#basic_password', fill_value='password1%Aa'\n"
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
            + (
                "- For /dashboard page: ONLY generate these tests:\n"
                "  1. navigate — page loads\n"
                "  2. check_visible selector='.ant-card' — cartes stats visibles\n"
                "  3. check_visible selector='.ant-btn' — boutons visibles\n"
                "  4. check_visible selector='.ant-card-body' — contenu cartes visible\n"
                "  5. check_visible selector='.ant-btn-primary' — bouton principal visible\n"
                "  6. check_visible selector='.sider-primary', wait_after_ms=5000 — sidebar visible\n"
                "- DO NOT use selectors: header, .ant-menu, .ant-statistic, .ant-layout-content\n"
                "- DO NOT generate form/search tests for dashboard\n"
                if page_path == "/dashboard" else
                "- For /gestion_commission page: ONLY generate these 6 tests, in this exact order:\n"
                "  1. action=navigate, selector='body' — page se charge\n"
                "  2. action=check_visible, selector='text=Gestion des commissions', wait_after_ms=4000 — titre de la page visible\n"
                "  3. action=check_visible, selector='input[placeholder=\"Entrer une valeur\"]' — champ filtre identifiant visible\n"
                "  4. action=fill, selector='input[placeholder=\"Entrer une valeur\"]', fill_value='TEST-999' — remplir le filtre identifiant\n"
                "  5. action=check_visible, selector='.ant-table', wait_after_ms=4000 — tableau des commissions visible\n"
                "  6. action=check_visible, selector='button:has-text(\"Ajouter une commission\")' — bouton ajouter une commission visible\n"
                "- DO NOT use selectors: .ant-page-header, .ant-form-item .ant-input, generic .ant-btn-primary\n"
                if page_path == "/gestion_commission" else
                "- For /visites page: ONLY generate these 6 tests, in this exact order:\n"
                "  1. action=navigate, selector='body' — page se charge\n"
                "  2. action=check_visible, selector='text=Gestion des visites planifiées', wait_after_ms=4000 — titre de la page visible\n"
                "  3. action=check_visible, selector='text=Numéro de dossier', wait_after_ms=4000 — en-tete du tableau visible\n"
                "  4. action=check_visible, selector='input[placeholder=\"Entrer une valeur\"] >> nth=0' — champ filtre numero de dossier visible\n"
                "  5. action=fill, selector='input[placeholder=\"Entrer une valeur\"] >> nth=0', fill_value='A26' — remplir le filtre numero de dossier\n"
                "  6. action=check_visible, selector='.ant-btn-primary' — bouton Filtrer visible\n"
                "- DO NOT generate 'creation form' tests — there is NO standalone create form on this page\n"
                "- DO NOT use selectors: .ant-table, .ant-form-item, .ant-input\n"
                if page_path == "/visites" else
                "- For /statistiques page: ONLY generate these 6 tests:\n"
                "  1. action=navigate, selector='body' — page se charge\n"
                "  2. action=check_visible, selector='text=Statistiques des Dossiers', wait_after_ms=4000 — titre visible\n"
                "  3. action=check_visible, selector='.ant-card', wait_after_ms=3000 — cartes stats visibles\n"
                "  4. action=check_visible, selector='button:has-text(\"Exporter Excel\")' — bouton export visible\n"
                "  5. action=check_visible, selector='.ant-table', wait_after_ms=4000 — tableau promoteurs visible\n"
                "  6. action=check_visible, selector='input[placeholder*=\"Rechercher\"]' — champ recherche visible\n"
                "- DO NOT use selectors: .ant-statistic, .ant-layout-content\n"
                if page_path == "/statistiques" else ""
            )
        )
        
        
        login_context = (
            "Login URL: " + base + "/admin-anpe/login\n"
            "Credentials: email=admin@admin.com, password=password1%Aa\n"
        )
        

    requires_login_default = "false" if is_login else "true"

    prompt = (
        "You are a functional testing expert using Playwright for internal web apps.\n\n"
        "Application: ANPE (Agence Nationale de Protection de l'Environnement) — Tunisia\n"
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
            model="llama-3.3-70b-versatile",
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
        # ── Force correct selectors for known pages ───────────────────────────
        if page_path == "/dashboard":
            for tc in cleaned:
                if "sidebar" in tc["name"].lower() or "menu" in tc["name"].lower() or "sider" in tc["selector"] or "ant-menu" in tc["selector"]:
                    tc["selector"] = ".ant-layout"
                    tc["action"]   = "check_visible"
                    tc["name"]     = "Layout principal visible"

        elif page_path == "/gestion_commission":
            for tc in cleaned:
                sel = tc.get("selector", "")
                if "page-header" in sel:
                    tc["selector"]      = "text=Gestion des commissions"
                    tc["action"]        = "check_visible"
                    tc["wait_after_ms"] = max(tc.get("wait_after_ms", 2000), 4000)
                elif ".ant-form-item" in sel or "ant-input" in sel:
                    tc["selector"] = 'input[placeholder="Entrer une valeur"]'
                    if tc["action"] == "fill" and not tc.get("fill_value"):
                        tc["fill_value"] = "TEST-999"
                elif ".ant-btn-primary" in sel:
                    tc["selector"] = 'button:has-text("Ajouter une commission")'
                if ".ant-table" in sel:
                    tc["wait_after_ms"] = max(tc.get("wait_after_ms", 2000), 4000)
        elif page_path == "/visites":
            for tc in cleaned:
                sel = tc.get("selector", "")
                if ".ant-table" in sel:
                    tc["selector"]      = "text=Numéro de dossier"
                    tc["wait_after_ms"] = max(tc.get("wait_after_ms", 2000), 4000)
                elif ".ant-form-item" in sel or sel == ".ant-input":
                    tc["selector"] = 'input[placeholder="Entrer une valeur"] >> nth=0'
                    if tc["action"] == "fill" and not tc.get("fill_value"):
                        tc["fill_value"] = "A26"
        elif page_path == "/statistiques":
            for tc in cleaned:
                sel = tc.get("selector", "")
                if ".ant-statistic" in sel:
                    tc["selector"] = ".ant-card"
                    tc["wait_after_ms"] = max(tc.get("wait_after_ms", 2000), 3000)
                if ".ant-layout-content" in sel:
                    tc["selector"] = "text=Statistiques des Dossiers"
                    tc["wait_after_ms"] = max(tc.get("wait_after_ms", 2000), 4000)
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
        return _fallback_tests(base, url_to_test, page_path, features, is_login)

    except Exception as e:
        print("[FUNCTIONAL_GENERATOR] LLaMA error: " + str(e) + " — fallback")
        return _fallback_tests(base, url_to_test, page_path, features, is_login)


def _fallback_tests(base_url: str, url: str, page_path: str, features: list, is_login: bool) -> dict:
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
                "fill_value": "admin@admin.com", "wait_after_ms": 500,
            },
            {
                "id": 5, "name": "Saisie mot de passe",
                "category": "authentication", "severity": "critical",
                "page": page_path, "url": url,
                "action": "fill", "selector": "#basic_password",
                "expected": "Mot de passe saisi", "description": "Fill password field",
                "requires_login": False, "priority": "high",
                "fill_value": "password1%Aa", "wait_after_ms": 500,
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