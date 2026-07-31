# test_webvitals.py — Script de vérification indépendant
# Mesure FCP/LCP/TTFB directement via les APIs natives du navigateur
# (PerformanceObserver), les mêmes primitives que la lib web-vitals de Google
# utilise en interne — évite les soucis de chargement UMD via CDN.
#
# Usage : python test_webvitals.py

from playwright.sync_api import sync_playwright
import time


def measure_with_web_vitals(url: str):
    print(f"[WEB-VITALS] Measuring {url}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=1920,1080"],
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )
        page = context.new_page()

        # Enregistre les PerformanceObserver AVANT toute navigation,
        # avec buffered:true pour capter les entries même si l'observer
        # démarre après l'événement (comportement standard des Web Vitals).
        page.add_init_script("""
            window.__vitals = { fcp: null, lcp: null, ttfb: null };

            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
                    if (fcpEntry) window.__vitals.fcp = fcpEntry.startTime;
                }).observe({ type: 'paint', buffered: true });
            } catch (e) {}

            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const last = entries[entries.length - 1];
                    if (last) window.__vitals.lcp = last.startTime;
                }).observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {}
        """)

        t0 = time.time()
        page.goto(url, timeout=60_000, wait_until="networkidle")
        page.wait_for_timeout(2000)  # laisse le temps au LCP de se stabiliser

        vitals = page.evaluate("""() => {
            const nav = performance.getEntriesByType('navigation')[0] || {};
            return {
                fcp: window.__vitals.fcp,
                lcp: window.__vitals.lcp,
                ttfb: nav.responseStart || null,
            };
        }""")
        elapsed = round(time.time() - t0, 2)

        browser.close()

        def fmt(v):
            return f"{round(v)} ms" if v is not None else "N/A"

        print(f"\n{'='*40}")
        print(f"RESULTS (PerformanceObserver natif — même primitives que web-vitals)")
        print(f"{'='*40}")
        print(f"FCP : {fmt(vitals.get('fcp'))}")
        print(f"LCP : {fmt(vitals.get('lcp'))}")
        print(f"TTFB: {fmt(vitals.get('ttfb'))}")
        print(f"{'='*40}")
        print(f"Total script time: {elapsed}s")

        return vitals


if __name__ == "__main__":
    measure_with_web_vitals("https://en.wikipedia.org/")