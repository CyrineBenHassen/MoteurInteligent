from playwright.sync_api import sync_playwright
import json

BASE_URL = "https://anpe.demopro.tn:10443"
TARGET_PATH = "/statistiques"
_CACHED_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJhMGRmOWI3My01MzZmLTQxZmUtOGM1Ny01MTUwOGQ2NDE0NjQiLCJqdGkiOiIxZTQzMmU2MTY5NWI4MjgxOGYwZmMxNzI5ZTY4ZTM5ZWM4ZjgwZjM2MmMyMDk4Y2Y5M2ViMGVjODJiYzI0NzUzZDlkMDA0YmNmMTk5MGU3NSIsImlhdCI6MTc4MTMwMTg1Mi40NzQ0MywibmJmIjoxNzgxMzAxODUyLjQ3NDQzMSwiZXhwIjoxNzk3MTEzMDUyLjQ3MjAwMywic3ViIjoiYTAxZWEwMDQtNTA3NC00NTEyLTllMGQtYTY3OTg0NWY1ZGNlIiwic2NvcGVzIjpbXX0.CdVfTqrS8OL7q0uadADPbknBstVExvBDb4cOQ67a187l5qA4Ze380hC1ABhgNypjO2boKcteAM34iAjeI4uJU-VKityh94ZDmt2HZe3SkfOSSklN9GdiuoFOqrkRdpoEEEnmUT1G4IOUeAf9ALcp8IOeWOZpgCLvxCIt49Bvjb5diWD39J2v9hBACc-i19X3VFpsOKoqjmjoaCx4EeyQuKzty2jyxUtjiaK9YIeVVJRHuJSE2DLOG6ij-crGUzYgDdMnEBD9frWLkIgc3QeTE_lYAxCWmY0KeJkSPAds90LN-mnlu2PikkKe5W7K5uI10O9p-lfSg7-du7vaTGXRTixHnrLeCBt9jXy19JrYSinpbU5ggeIcyPr7UolwI0Zv1EGqP740Abipr8EVNi1VJ5V_XutsFgqLQ3XmhjHBXWQUv-QdBOeNRveZLG9lI3w3tq_BRANSmwMTccG_Soh8HSS_Gz0ZWPAWDOeUtHTSrEh0jUIkty7aafNh8dgAcyVhETXIUOKTJBSiLRTUiH3hEiMHwwWDK38F9fyDAAGWglblJBwQuM_e-J8_-qmKj2fBCwvtgWiliIW_84cLUKG4ORfJM6eez7CJus0arsaZyCIrncFjf_qyJdRFT_LYDYTEYiokSbhlJ1brzPePzEC3HJyU6uDR-6SCNgqGAzj6Pzg"

_USER = json.dumps({"id":"a01ea004-5074-4512-9e0d-a679845f5dce","fullName":"Super Admin","email":"admin@admin.com","is_super":True,"status":"active"})

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--ignore-certificate-errors","--no-sandbox"])
    context = browser.new_context(ignore_https_errors=True)
    page = context.new_page()
    page.on("pageerror", lambda err: print(f"[ERROR] {err}"))

    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(2000)

    for key, value in {"token": _CACHED_TOKEN, "access_token": _CACHED_TOKEN, "refreshToken": "1e432e61...", "i18nextLng": "fr", "user": _USER}.items():
        page.evaluate(f"localStorage.setItem(`{key}`, `{value}`)")

    page.goto(f"{BASE_URL}{TARGET_PATH}", wait_until="domcontentloaded", timeout=40000)
    page.wait_for_timeout(10000)

    print("=== TEXT ===")
    print(page.inner_text("body")[:500] or "(VIDE)")
    page.screenshot(path="stat_debug.png", full_page=True)
    browser.close()