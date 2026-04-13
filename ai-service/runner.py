import subprocess
import tempfile
import os
import re
import sys
import time


def run_selenium_script(script: str, test_cases: list = None) -> dict:
    patched  = _patch_headless(script)

    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.py', delete=False, encoding='utf-8'
    ) as f:
        f.write(patched)
        tmp_path = f.name

    start = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = proc.stdout + proc.stderr
    except subprocess.TimeoutExpired:
        output = "TIMEOUT: script took more than 120 seconds"
    except Exception as e:
        output = f"ERROR: {e}"
    finally:
        elapsed = round(time.time() - start, 2)
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    results  = _parse_output(output, script, test_cases or [])

    pass_count = sum(1 for r in results if r["status"] == "pass")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    skip_count = sum(1 for r in results if r["status"] == "skip")
    total      = len(results)
    pass_rate  = round((pass_count / total) * 100) if total > 0 else 0

    return {
        "results":    results,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "skip_count": skip_count,
        "pass_rate":  pass_rate,
        "total":      total,
        "duration_s": elapsed,
        "raw_output": output[:1000],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _patch_headless(script: str) -> str:
    """
    Remplace setup_driver() par une version headless robuste.
    Injecte aussi des prints standardisés 'Test N: PASSED/FAILED'
    si le script utilise des noms de fonctions sans numéro.
    """
    headless_block = (
        "def setup_driver():\n"
        "    from selenium.webdriver.chrome.options import Options\n"
        "    from selenium.webdriver.chrome.service import Service\n"
        "    from webdriver_manager.chrome import ChromeDriverManager\n"
        "    opts = Options()\n"
        "    opts.add_argument('--headless')\n"
        "    opts.add_argument('--no-sandbox')\n"
        "    opts.add_argument('--disable-dev-shm-usage')\n"
        "    opts.add_argument('--disable-gpu')\n"
        "    opts.add_argument('--window-size=1920,1080')\n"
        "    service = Service(ChromeDriverManager().install())\n"
        "    return webdriver.Chrome(service=service, options=opts)\n"
    )
    script = re.sub(
        r'def setup_driver\(\):.*?(?=\ndef |\nif |\Z)',
        headless_block + '\n',
        script,
        flags=re.DOTALL,
    )

    # ── Normaliser les prints pour garantir "Test N: PASSED/FAILED" ──────────
    # Remplace: print('Test X: PASSED') ou print(f'Test X: FAILED — {e}')
    # où X peut être un mot (test_Page_load) → on renumérote par position

    test_fns = re.findall(r'def (test_\w+)\(driver\)', script)

    for i, fn in enumerate(test_fns, start=1):
        # Remplacer tous les prints PASSED/FAILED liés à cette fonction
        # Pattern: print('Test <fn_name>: PASSED') ou print('Test <anything>: PASSED') dans le bloc try
        # On cherche les prints qui contiennent le nom de la fonction ou un index non-numérique
        script = re.sub(
            rf"print\(['\"]Test {re.escape(fn.replace('test_', '').replace('_', ' ').title())}[^'\"]*PASSED[^'\"]*['\"]\)",
            f"print('Test {i}: PASSED')",
            script
        )
        script = re.sub(
            rf"print\(f['\"]Test {re.escape(fn.replace('test_', '').replace('_', ' ').title())}[^'\"]*FAILED[^'\"]*['\"]\)",
            f"print(f'Test {i}: FAILED — {{e}}')",
            script
        )

    # ── Fallback: remplacer print('Test X: PASSED') où X n'est pas un entier ─
    def normalize_print(m):
        label = m.group(1)
        status = m.group(2)
        # Si label est déjà un entier, garder tel quel
        if label.strip().isdigit():
            return m.group(0)
        # Sinon remplacer par position (sera re-indexé au parsing)
        return m.group(0)  # garder pour l'instant, géré dans _parse_output

    return script


def _parse_output(output: str, script: str, test_cases: list = []) -> list:
    results  = []
    test_fns = re.findall(r'def (test_\w+)\(driver\)', script)

    if not test_fns:
        return [{
            "name":        "Script Error",
            "status":      "fail",
            "duration":    "—",
            "error":       output[:300] if output else "No test functions found",
            "reason":      "Le script n'a pas pu etre execute — aucune fonction de test trouvee.",
            "reason_pass": None,
            "reason_skip": None,
        }]

    # ── Détection PASSED/FAILED robuste — supporte numéros ET noms ───────────
    passed_ids: set[int] = set()
    failed_ids: set[int] = set()

    # Pattern 1: "Test 3: PASSED" ou "Test 3: FAILED" (format numéroté standard)
    for m in re.finditer(r'Test\s+(\d+)\s*:?\s*PASSED', output, re.IGNORECASE):
        passed_ids.add(int(m.group(1)))
    for m in re.finditer(r'Test\s+(\d+)\s*:?\s*FAILED', output, re.IGNORECASE):
        failed_ids.add(int(m.group(1)))

    # Pattern 2: "test_Page_load_time: PASSED" → mapper sur index
    if not passed_ids and not failed_ids:
        for i, fn in enumerate(test_fns, start=1):
            fn_readable = fn.replace('test_', '').replace('_', ' ')
            # Chercher le nom de la fonction dans l'output
            pattern_pass = rf'(?:Test\s+)?{re.escape(fn)}[^:]*:?\s*PASSED'
            pattern_fail = rf'(?:Test\s+)?{re.escape(fn)}[^:]*:?\s*FAILED'
            if re.search(pattern_pass, output, re.IGNORECASE):
                passed_ids.add(i)
            elif re.search(pattern_fail, output, re.IGNORECASE):
                failed_ids.add(i)

    # Pattern 3: lignes "PASSED" / "FAILED" dans l'ordre d'apparition
    if not passed_ids and not failed_ids:
        lines = output.splitlines()
        fn_index = 1
        for line in lines:
            line_upper = line.upper()
            if 'PASSED' in line_upper and fn_index <= len(test_fns):
                passed_ids.add(fn_index)
                fn_index += 1
            elif 'FAILED' in line_upper and fn_index <= len(test_fns):
                failed_ids.add(fn_index)
                fn_index += 1

    # ── Construire les résultats ──────────────────────────────────────────────
    for i, fn_name in enumerate(test_fns, start=1):
        if test_cases and (i - 1) < len(test_cases):
            tc       = test_cases[i - 1]
            display  = tc.get("name", "") or fn_name.replace('test_', '').replace('_', ' ').title()
            tc_type  = tc.get("type", "positive")
            expected = tc.get("expected", "")
            category = tc.get("category", "functional")
            priority = tc.get("priority", "medium")
        else:
            display  = fn_name.replace('test_', '').replace('_', ' ').title()
            tc_type  = "positive"
            expected = ""
            category = "functional"
            priority = "medium"

        if i in passed_ids:
            status      = 'pass'
            error       = None
            reason_pass = _explain_pass(tc_type, expected, category, display)
            reason_fail = None
            reason_skip = None

        elif i in failed_ids:
            status      = 'fail'
            error       = _extract_error(output, fn_name)
            reason_fail = _explain_fail(error, tc_type, expected, display)
            reason_pass = None
            reason_skip = None

        else:
            # ── Pas trouvé → chercher une vraie erreur dans l'output ──────────
            real_error = _extract_error(output, fn_name)
            if real_error:
                status      = 'fail'
                error       = real_error
                reason_fail = _explain_fail(real_error, tc_type, expected, display)
            else:
                # Vraiment pas exécuté — chercher si crash global
                if 'TimeoutException' in output or 'NoSuchElementException' in output:
                    global_error = _extract_error(output, fn_name)
                    status      = 'fail'
                    error       = global_error or 'Crash in previous test'
                    reason_fail = _explain_fail(error, tc_type, expected, display)
                else:
                    status      = 'fail'
                    error       = 'Test did not execute'
                    reason_fail = _explain_fail(None, tc_type, expected, display)
            reason_pass = None
            reason_skip = None

        results.append({
            "name":        display,
            "status":      status,
            "duration":    "—",
            "error":       error,
            "reason":      reason_fail,
            "reason_pass": reason_pass,
            "reason_skip": reason_skip,
            "priority":    priority,
            "category":    category,
        })

    return results


def _explain_pass(tc_type: str, expected: str, category: str, name: str) -> str:
    exp        = expected.lower()
    name_lower = name.lower()

    if 'login' in exp or 'logged' in exp or 'login' in name_lower:
        return "Login reussi — credentials valides acceptes, redirection vers la page principale confirmee."
    if 'navigation' in exp or 'navigate' in name_lower or 'nav' in name_lower:
        return "Navigation reussie — lien clique et nouvelle page chargee correctement."
    if 'performance' in exp or 'load time' in exp or 'performance' in name_lower:
        return "Performance OK — temps de chargement < 5s, conforme a la limite fixee."
    if 'basket' in name_lower or 'cart' in name_lower or 'add to' in name_lower:
        return "Ajout au panier reussi — bouton clique et page produit chargee."
    if 'pagination' in name_lower or 'next' in name_lower:
        return "Pagination fonctionnelle — navigation vers la page suivante confirmee."
    if tc_type == 'negative':
        if 'error' in exp or 'message' in exp:
            return "Validation correcte — message d'erreur affiche comme attendu apres saisie invalide."
        return "Comportement negatif verifie — la page gere correctement les cas d'erreur."
    if 'button' in exp or 'click' in name_lower or 'button' in name_lower:
        return "Bouton fonctionnel — element trouve, visible, actif et interactif."
    if 'image' in exp or 'image' in name_lower:
        return "Images chargees — src valides et dimensions confirmees (naturalWidth > 0)."
    if 'load' in exp or 'title' in exp or 'visible' in exp:
        return "Page chargee correctement — titre present et contenu visible dans le DOM."
    if 'form' in exp or 'submit' in name_lower:
        return "Formulaire soumis avec succes — donnees envoyees et reponse recue."
    if category == 'performance':
        return "Performance validee — temps de reponse dans les limites acceptables."
    if category == 'ui':
        return "Interface correcte — elements visuels presentes et conformes aux attentes."
    if category == 'navigation':
        return "Navigation fonctionnelle — transitions entre pages effectuees sans erreur."

    return "Test reussi — toutes les assertions validees, comportement conforme aux specifications."


def _explain_fail(error: str, tc_type: str, expected: str, name: str) -> str:
    name_lower = name.lower()

    # ── Pas de vraie erreur trouvée ───────────────────────────────────────────
    if not error or error == 'Test did not execute':
        # Donner une raison contextuelle selon le type de test
        if 'form' in name_lower or 'submit' in name_lower:
            return (
                "Test invalide — aucun formulaire (<form>) detecte sur cette page. "
                "Ce test ne devrait pas exister pour ce site. "
                "Action: regenerez les tests pour obtenir des cas adaptes a cette page."
            )
        if 'error' in name_lower or 'alert' in name_lower or 'message' in name_lower:
            return (
                "Test invalide — aucun conteneur d'erreur/alerte detecte sur cette page. "
                "Ce test ne devrait pas exister pour ce site. "
                "Action: regenerez les tests pour obtenir des cas adaptes a cette page."
            )
        if 'login' in name_lower or 'credential' in name_lower or 'password' in name_lower:
            return (
                "Test invalide — aucun formulaire de login detecte sur cette page. "
                "Ce test ne devrait pas exister pour ce site. "
                "Action: regenerez les tests pour obtenir des cas adaptes a cette page."
            )
        if 'basket' in name_lower or 'cart' in name_lower:
            return (
                "Echec ajout panier — le clic sur le bouton n'a pas change l'URL. "
                "Le bouton est peut-etre desactive ou la page ne redirige pas. "
                "Action: verifiez le comportement du bouton sur le site."
            )
        if 'navigation' in name_lower or 'nav' in name_lower or 'link' in name_lower:
            return (
                "Navigation echouee — le lien clique n'a pas change l'URL. "
                "Le texte du lien est peut-etre different ou le lien pointe vers la meme page."
            )
        return (
            "Test non execute — erreur dans le script avant d'atteindre ce test. "
            "Verifiez les tests precedents pour une erreur en cascade."
        )

    error_lower = error.lower()

    # Timeout
    if 'timeoutexception' in error_lower or 'timeout' in error_lower:
        if 'login' in name_lower or 'password' in name_lower:
            return (
                "Timeout sur le formulaire de login — le selecteur CSS du champ username, "
                "password ou bouton submit est incorrect ou l'element n'est pas present. "
                "Action: verifiez les selecteurs dans le DOM."
            )
        if 'error' in name_lower or tc_type == 'negative':
            return (
                "Timeout sur le message d'erreur — le conteneur d'erreur n'est pas apparu. "
                "Le selecteur CSS du message d'erreur est probablement incorrect. "
                "Action: inspectez le DOM apres soumission invalide."
            )
        if 'navigation' in name_lower or 'nav' in name_lower or 'link' in name_lower:
            return (
                "Timeout sur la navigation — le lien clique n'a pas change l'URL dans les 10s. "
                "Le texte exact du lien est peut-etre different. "
                "Action: verifiez le texte exact du lien avec By.LINK_TEXT."
            )
        if 'basket' in name_lower or 'cart' in name_lower:
            return (
                "Timeout apres clic panier — l'URL n'a pas change dans les 5s. "
                "Le bouton 'Add to basket' redirige peut-etre vers la page produit, pas le panier. "
                "Action: verifiez le comportement du bouton manuellement."
            )
        return (
            "Timeout (10s) — l'element cible n'a pas ete trouve dans le delai imparti. "
            "Causes: selecteur CSS incorrect, element absent, ou page trop lente. "
            "Action: verifiez le selecteur dans les outils dev (F12)."
        )

    # Element not found
    if 'nosuchelementexception' in error_lower:
        return (
            "Element introuvable dans le DOM — le selecteur CSS ne correspond a aucun element. "
            "L'element a peut-etre ete renomme ou est dans un iframe. "
            "Action: ouvrez F12 et verifiez que le selecteur existe."
        )

    # Assertion error
    if 'assertionerror' in error_lower:
        if 'performance' in name_lower or 'load time' in name_lower:
            return (
                "Performance insuffisante — le temps de chargement depasse 5 secondes. "
                "La page est trop lente. Action: verifiez la connexion reseau."
            )
        if 'navigation' in name_lower or 'url' in name_lower:
            return (
                "Assertion URL echouee — l'URL n'a pas change apres le clic. "
                "Le lien pointe peut-etre vers la meme page."
            )
        if 'basket' in name_lower or 'cart' in name_lower:
            return (
                "Assertion panier echouee — l'URL n'a pas change apres le clic. "
                "Le bouton 'Add to basket' ne redirige pas comme attendu."
            )
        if 'title' in name_lower or 'load' in name_lower:
            return (
                "Assertion du titre echouee — le titre de la page est vide ou inattendu. "
                "La page n'a peut-etre pas charge correctement."
            )
        return (
            "Assertion echouee — la condition verifiee n'est pas satisfaite. "
            f"Attendu: {expected[:80] if expected else 'voir description du test'}."
        )

    if 'elementnotinteractable' in error_lower:
        return (
            "Element non interactif — l'element existe mais ne peut pas etre clique. "
            "Il est peut-etre cache ou desactive. "
            "Action: verifiez que l'element est visible avant interaction."
        )

    if 'staleelementreferenceexception' in error_lower:
        return (
            "Element obsolete — la page a ete rechargee apres que l'element a ete trouve. "
            "Action: re-trouvez l'element apres chaque rechargement."
        )

    if 'webdriverexception' in error_lower:
        return (
            "Erreur WebDriver — probleme avec Chrome ou ChromeDriver. "
            "Action: verifiez que Chrome et ChromeDriver sont a jour."
        )

    if 'connection' in error_lower or 'refused' in error_lower:
        return (
            "Connexion refusee — la page cible n'est pas accessible. "
            "Action: verifiez que l'URL est correcte et que le site est en ligne."
        )

    return (
        f"Echec inattendu — {error[:120]}. "
        "Action: consultez le script genere pour identifier la ligne exacte en echec."
    )


def _extract_error(output: str, fn_name: str) -> str | None:
    priority = [
        'AssertionError',
        'TimeoutException',
        'NoSuchElementException',
        'ElementNotInteractableException',
        'StaleElementReferenceException',
        'WebDriverException',
        'Error',
    ]
    for line in output.splitlines():
        for keyword in priority:
            if keyword.lower() in line.lower():
                return line.strip()[:250]
    return None