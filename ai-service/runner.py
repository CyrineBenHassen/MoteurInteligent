import subprocess
import tempfile
import os
import re
import sys
import time


def run_selenium_script(script: str, test_cases: list = None) -> dict:
    """
    Exécute un script Selenium et retourne les vrais résultats.
    test_cases: liste des cas de test pour récupérer les vrais noms.
    """

    # ── 1. Patcher le script pour le mode headless ───────────────────────────
    patched = _patch_headless(script)

    # ── 2. Écrire dans un fichier temporaire ────────────────────────────────
    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.py', delete=False, encoding='utf-8'
    ) as f:
        f.write(patched)
        tmp_path = f.name

    # ── 3. Exécuter le script ────────────────────────────────────────────────
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

    # ── 4. Parser les résultats ──────────────────────────────────────────────
    results = _parse_output(output, script, test_cases or [])

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
    """Remplace setup_driver() pour injecter Chrome headless automatiquement."""
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
    return script


def _parse_output(output: str, script: str, test_cases: list = []) -> list:
    """
    Parse la sortie du script pour extraire pass/fail par test.
    Utilise les vrais noms depuis test_cases si disponibles.
    """
    results = []

    # Extraire les noms des fonctions de test depuis le script
    test_fns = re.findall(r'def (test_\w+)\(driver\)', script)

    if not test_fns:
        return [{
            "name":     "Script Error",
            "status":   "fail",
            "duration": "—",
            "error":    output[:300] if output else "No test functions found",
        }]

    # Parser les lignes PASSED / FAILED
    passed_ids = set(
        int(m) for m in re.findall(r'Test\s+(\d+).*?PASSED', output, re.IGNORECASE)
    )
    failed_ids = set(
        int(m) for m in re.findall(r'Test\s+(\d+).*?FAILED', output, re.IGNORECASE)
    )

    for i, fn_name in enumerate(test_fns, start=1):
        # ✅ Utiliser le vrai nom du test case si disponible
        if test_cases and (i - 1) < len(test_cases):
            display = test_cases[i - 1].get("name", "")
            if not display:
                display = fn_name.replace('test_', '').replace('_', ' ').title()
        else:
            display = fn_name.replace('test_', '').replace('_', ' ').title()

        if i in passed_ids:
            status = 'pass'
            error  = None
        elif i in failed_ids:
            status = 'fail'
            error  = _extract_error(output, fn_name)
        else:
            status = 'fail'
            error  = _extract_error(output, fn_name) or 'Test did not execute'

        results.append({
            "name":     display,
            "status":   status,
            "duration": "—",
            "error":    error,
        })

    return results


def _extract_error(output: str, fn_name: str) -> str | None:
    """Extrait le message d'erreur le plus pertinent depuis la sortie."""
    priority = [
        'AssertionError',
        'TimeoutException',
        'NoSuchElementException',
        'ElementNotInteractableException',
        'WebDriverException',
        'Error',
    ]
    for line in output.splitlines():
        for keyword in priority:
            if keyword.lower() in line.lower():
                return line.strip()[:250]
    return None