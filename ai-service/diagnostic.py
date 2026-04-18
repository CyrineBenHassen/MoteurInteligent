#!/usr/bin/env python3
"""
diagnostic.py — Run this ONCE to verify the new scraper/generator integration.
Usage:  python3 diagnostic.py https://rescat.tn/
"""
import sys, json

URL = sys.argv[1] if len(sys.argv) > 1 else "https://rescat.tn/"

print(f"\n{'='*60}")
print(f"NexTest v6 Integration Diagnostic")
print(f"URL: {URL}")
print(f"{'='*60}\n")

# ── 1. Check scraper keys ────────────────────────────────────────────────────
print("STEP 1 — Importing scraper...")
try:
    from scraper import scrape_page
    print("  ✓ scraper imported")
except ImportError as e:
    print(f"  ✗ IMPORT ERROR: {e}")
    print("    → Make sure you replaced scraper.py with the patched version")
    sys.exit(1)

print(f"STEP 2 — Scraping {URL} ...")
scraped = scrape_page(URL)

NEW_KEYS = ["lang_switcher", "search_bar", "images_audit", "icons", "input_fields"]
OLD_KEYS = ["inputs", "buttons", "nav_links", "search_inputs", "images"]

print("\n  OLD keys (must still exist — backward compat check):")
for k in OLD_KEYS:
    present = k in scraped
    count   = len(scraped.get(k, []))
    status  = "✓" if present else "✗ MISSING"
    print(f"    {status}  {k!r}: {count} items")

print("\n  NEW keys (must exist — v6 scraper check):")
all_new_ok = True
for k in NEW_KEYS:
    present = k in scraped
    count   = len(scraped.get(k, [])) if present else -1
    if present:
        status = "✓"
        print(f"    {status}  {k!r}: {count} items")
        if count > 0:
            first = scraped[k][0]
            print(f"         sample: {json.dumps(first, ensure_ascii=False)[:120]}")
    else:
        status = "✗ MISSING"
        all_new_ok = False
        print(f"    {status}  {k!r} — scraper.py was NOT replaced!")

# ── 2. Check generator detectors ────────────────────────────────────────────
print("\nSTEP 3 — Importing generator detectors...")
try:
    from generator import (
        _detect_lang_switcher,
        _detect_search_bar,
        _detect_images_with_alt,
        _detect_icons,
        _detect_input_fields,
        _build_critical_smoke_elements,
        SMOKE_CRITICALITY,
    )
    print("  ✓ generator imported")
except ImportError as e:
    print(f"  ✗ IMPORT ERROR: {e}")
    print("    → Make sure you replaced generator.py with the patched version")
    sys.exit(1)

# Verify new criticality keys exist
print("\n  SMOKE_CRITICALITY new entries:")
for k in ["lang_switch", "search_bar", "image_visible", "icon_present", "input_field"]:
    if k in SMOKE_CRITICALITY:
        c = SMOKE_CRITICALITY[k]
        print(f"    ✓  {k!r}: score={c['score']}, tier={c['tier']}")
    else:
        print(f"    ✗  {k!r} MISSING — generator.py was NOT replaced!")

# ── 3. Fire each detector ────────────────────────────────────────────────────
print("\nSTEP 4 — Running new detectors against scraped data:")

detectors = [
    ("lang_switch",   _detect_lang_switcher,   "lang_switcher"),
    ("search_bar",    _detect_search_bar,       "search_bar / search_inputs"),
    ("image_visible", _detect_images_with_alt,  "images_audit / images"),
    ("icon_present",  _detect_icons,            "icons"),
    ("input_field",   _detect_input_fields,     "input_fields / inputs"),
]

fired = []
for det_type, fn, source_key in detectors:
    result = fn(scraped)
    if result:
        fired.append(det_type)
        r = result[0]
        print(f"  ✓  {det_type!r} FIRED → name='{r['name']}' | selector='{r['selector']}'")
    else:
        # Explain WHY it didn't fire
        raw_key = source_key.split(" / ")[0]
        count   = len(scraped.get(raw_key, []))
        if count == 0:
            print(f"  ○  {det_type!r} — no data (scraped[{raw_key!r}]={count}) → element absent from page, OK")
        else:
            print(f"  ✗  {det_type!r} — scraped[{raw_key!r}]={count} items but detector returned [] — BUG")

# ── 4. Full element builder ──────────────────────────────────────────────────
print("\nSTEP 5 — _build_critical_smoke_elements() output:")
elements = _build_critical_smoke_elements(scraped)
for i, el in enumerate(elements, 1):
    tier = el.get("tier", "?")
    typ  = el.get("type", "?")
    opt  = " [OPTIONAL]" if typ in {"lang_switch","search_bar","image_visible","icon_present","input_field"} else ""
    print(f"  {i}. [T{tier}]{opt} {el['name']!r}")
    print(f"       selector: {el['selector']}")

# ── 5. Summary ───────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"SUMMARY")
print(f"{'='*60}")
if not all_new_ok:
    print("  ✗ scraper.py has NOT been replaced — new keys missing")
    print("    → Copy the patched scraper.py to your project and restart the FastAPI server")
elif not fired:
    print("  ○ All detectors returned empty (page has none of these UI elements)")
    print("    → This is normal for a simple site. Try a page with a contact form or lang switcher.")
else:
    print(f"  ✓ {len(fired)}/{len(detectors)} new detectors fired: {', '.join(fired)}")
    print(f"  ✓ Element builder produced {len(elements)} smoke elements")
    if len(elements) == 5 and not fired:
        print("  ⚠ Still showing only the original 5 — new checks not needed for this page")

print()