# ═════════════════════════════════════════════════════════════════════════════
# INTERNAL SMOKE TEST — PDF REPORT (single authenticated page)
# ═════════════════════════════════════════════════════════════════════════════
#
# HOW TO INTEGRATE
# -----------------
# This module lives in the SAME folder as pdf_generator.py (the file
# containing `_generate_smoke_public_pdf`, `section_header`, `sub_section_header`,
# `stat_card`, `_grade_from_score`, `_make_score_gauge`, `_build_certificate_card`,
# the NAVY/GOLD/... palette, PRIORITY_COLORS, etc.). It imports those helpers
# directly from pdf_generator so it shares the exact same visual identity as
# your Public Smoke, SEO, and k6 Performance reports.
#
# ENTRY POINT
# -----------
#   generate_internal_smoke_pdf(generation_data: dict) -> bytes
#
# Expected `generation_data` shape (same conventions as your other reports):
#   {
#       'url': 'https://app.example.com/dashboard',
#       'page_label': 'Dashboard' (optional, human-readable name of the tested page),
#       'framework': 'Playwright',
#       'browser': 'Chromium (headless)',
#       'viewport': '1920×1080',
#       'playwright_version': '1.47.0',
#       'headless': True,
#       'nextest_version': '1.0.0',
#       'authenticated': True,
#       'auth_method': 'Session token' / 'Cookie' / 'Bearer token' / ...,
#       'screenshot': <base64 data-uri | raw base64 | file path | bytes>,
#       'execution_results' or 'test_cases': [ {name, category, type, status,
#                                                 reason, duration, priority}, ... ],
#       'ai': {
#           'summary': str,
#           'recommendations': [ {priority, category, issue, fix}, ... ],
#           'action_plan': [ {priority, category, action, impact, status}, ... ]
#                            OR list[str] (falls back gracefully),
#       },
#       'scraped': { ...optional page profile, e.g. 'sidebar': True, 'forms': [...] }
#   }
#
# Only categories/checks that actually have at least one test in
# `execution_results` are rendered — nothing is assumed about page structure.

from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, Image as RLImage,
)

from pdf_generator import (
    NAVY, GOLD, GREEN, GREEN_BG, RED, RED_BG, ORANGE, ORANGE_BG, BLUE, BLUE_BG,
    LIGHT_BG, BORDER, BORDER_DARK, MUTED, DARK_TEXT, WHITE, PURPLE, PURPLE_BG,
    TEAL, TEAL_BG, INDIGO, INDIGO_BG, PRIORITY_COLORS,
    section_header, sub_section_header, stat_card,
    _grade_from_score, _make_score_gauge, _build_certificate_card, _perf_insight_box,
    build_smoke_certificate_details,
)


# ═════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═════════════════════════════════════════════════════════════════════════════

INTERNAL_ACCENT = HexColor('#0EA5E9')   # same sky-blue family as the public smoke report

# category (as it'll be shown) -> hex color
INTERNAL_CATEGORY_META = {
    'Authentication':  '#6366f1',
    'Navigation':      '#10b981',
    'UI Components':   '#8b5cf6',
    'Forms':           '#f59e0b',
    'Tables':          '#0d9488',
    'Data Rendering':  '#3b82f6',
    'Accessibility':   '#0ea5e9',
    'JavaScript':      '#ef4444',
    'Network':         '#f97316',
    'Visual Elements': '#ec4899',
}
INTERNAL_CATEGORY_ORDER = list(INTERNAL_CATEGORY_META.keys())

# High-weight check types — count 3x toward the Smoke Quality Score, and are
# treated as "critical" for the verdict, because a failure here means the
# tested page itself is fundamentally broken or inaccessible.
INTERNAL_HIGH_TYPES = {
    'auth', 'session', 'http_status', 'page_load', 'body', 'main_content',
    'console_error', 'js_error', 'network_failure', 'api_call',
}


# ═════════════════════════════════════════════════════════════════════════════
# HELPERS — categorization, scoring
# ═════════════════════════════════════════════════════════════════════════════

def _internal_category_label(test: dict) -> tuple:
    """Maps a raw executed check to one of the 10 internal-page categories."""
    cat  = (test.get('category') or '').lower()
    typ  = (test.get('type') or '').lower()
    name = (test.get('name') or '').lower()
    hay = f'{cat} {typ} {name}'

    if any(k in hay for k in ('auth', 'login', 'session', 'token', 'logout', 'unauthorized')):
        return 'Authentication', INTERNAL_CATEGORY_META['Authentication']
    if any(k in hay for k in ('nav', 'sidebar', 'menu', 'breadcrumb', 'header', 'link')):
        return 'Navigation', INTERNAL_CATEGORY_META['Navigation']
    if any(k in hay for k in ('form', 'input', 'field', 'submit', 'validation')):
        return 'Forms', INTERNAL_CATEGORY_META['Forms']
    if any(k in hay for k in ('table', 'grid', 'row', 'column', 'pagination')):
        return 'Tables', INTERNAL_CATEGORY_META['Tables']
    if any(k in hay for k in ('data', 'list', 'empty_state', 'loading', 'placeholder', 'render')):
        return 'Data Rendering', INTERNAL_CATEGORY_META['Data Rendering']
    if any(k in hay for k in ('aria', 'a11y', 'accessib', 'lang_switch', 'contrast')):
        return 'Accessibility', INTERNAL_CATEGORY_META['Accessibility']
    if any(k in hay for k in ('console', 'javascript', 'js_error', 'exception', 'script error')):
        return 'JavaScript', INTERNAL_CATEGORY_META['JavaScript']
    if any(k in hay for k in ('network', 'api', 'fetch', 'xhr', 'http_status', 'timeout', 'request')):
        return 'Network', INTERNAL_CATEGORY_META['Network']
    if any(k in hay for k in ('button', 'card', 'widget', 'icon', 'modal', 'dropdown', 'toast', 'tooltip')):
        return 'UI Components', INTERNAL_CATEGORY_META['UI Components']
    return 'Visual Elements', INTERNAL_CATEGORY_META['Visual Elements']


def _compute_internal_smoke_score(tests: list) -> tuple:
    """Weighted score — HIGH-tier checks (auth, page load, console/network errors)
    count 3x since a failure there means the page itself is fundamentally broken."""
    if not tests:
        return 0, 'Critical', '#ef4444'
    total_weight = 0
    earned_weight = 0
    for t in tests:
        w = 3 if t.get('type') in INTERNAL_HIGH_TYPES else 1
        total_weight += w
        if t.get('status') == 'pass':
            earned_weight += w
    score = round(earned_weight / total_weight * 100) if total_weight else 0
    if score >= 90:
        label, color = 'Excellent', '#10b981'
    elif score >= 75:
        label, color = 'Good', '#22c55e'
    elif score >= 50:
        label, color = 'Acceptable', '#f59e0b'
    else:
        label, color = 'Critical', '#ef4444'
    return score, label, color


def _is_critical_internal_fail(t: dict) -> bool:
    if t.get('status') != 'fail':
        return False
    priority = (t.get('priority') or t.get('severity') or '').lower()
    return priority in ('high', 'critical') or t.get('type') in INTERNAL_HIGH_TYPES


def _page_label(generation_data: dict) -> str:
    return generation_data.get('page_label') or generation_data.get('url', 'this page')


# ═════════════════════════════════════════════════════════════════════════════
# CHART HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def _make_internal_category_chart(tests: list):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np

    cats = {c: {'pass': 0, 'fail': 0} for c in INTERNAL_CATEGORY_ORDER}
    for t in tests:
        label, _ = _internal_category_label(t)
        if t.get('status') == 'pass':
            cats[label]['pass'] += 1
        elif t.get('status') == 'fail':
            cats[label]['fail'] += 1

    labels = [c for c in INTERNAL_CATEGORY_ORDER if cats[c]['pass'] + cats[c]['fail'] > 0]
    if not labels:
        labels = INTERNAL_CATEGORY_ORDER[:3]

    p = [cats[c]['pass'] for c in labels]
    f = [cats[c]['fail'] for c in labels]

    plt.rcParams.update({'font.family': 'DejaVu Sans', 'axes.spines.top': False, 'axes.spines.right': False})
    fig, ax = plt.subplots(figsize=(8, 3.4), facecolor='white')
    ax.set_facecolor('#f8fafc')
    x = np.arange(len(labels))
    ax.bar(x, p, width=0.55, color='#10b981', edgecolor='white', label='Passed', zorder=3)
    ax.bar(x, f, width=0.55, bottom=p, color='#ef4444', edgecolor='white', label='Failed', zorder=3)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=8, color='#475569', fontweight='bold', rotation=20, ha='right')
    ax.set_ylabel('Checks', fontsize=8, color='#64748b')
    ax.grid(axis='y', color='#f1f5f9', linewidth=1, zorder=0)
    ax.legend(fontsize=8, frameon=False, loc='upper right')
    fig.text(0.02, 0.97, 'Category Breakdown Chart', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.85, bottom=0.28, left=0.08, right=0.97)
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=170, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return RLImage(buf, width=155 * mm, height=68 * mm), cats


def _make_internal_status_bar_chart(tests: list):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    pass_c = sum(1 for t in tests if t.get('status') == 'pass')
    fail_c = sum(1 for t in tests if t.get('status') == 'fail')
    skip_c = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))
    total  = pass_c + fail_c + skip_c or 1

    labels = ['Passed', 'Failed', 'Skipped']
    values = [pass_c, fail_c, skip_c]
    colors = ['#10b981', '#ef4444', '#f59e0b']

    plt.rcParams.update({'font.family': 'DejaVu Sans', 'axes.spines.top': False, 'axes.spines.right': False})
    fig, ax = plt.subplots(figsize=(8, 3.0), facecolor='white')
    ax.set_facecolor('#f8fafc')
    y_pos = range(len(labels))
    bars = ax.barh(y_pos, values, color=colors, edgecolor='white', height=0.55, zorder=3)
    max_v = max(values) or 1
    for bar, v in zip(bars, values):
        pct = round(v / total * 100)
        ax.text(bar.get_width() + max_v * 0.02, bar.get_y() + bar.get_height() / 2,
                 f'{v}  ({pct}%)', va='center', fontsize=9.5, fontweight='bold', color='#1e293b')
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=10, color='#475569', fontweight='bold')
    ax.set_xlabel('Checks', fontsize=8, color='#64748b')
    ax.set_xlim(0, max_v * 1.35)
    ax.grid(axis='x', color='#f1f5f9', linewidth=1, zorder=0)
    ax.invert_yaxis()
    fig.text(0.02, 0.95, 'Pass / Fail / Skipped Distribution', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.82, bottom=0.16, left=0.14, right=0.95)
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=170, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return RLImage(buf, width=155 * mm, height=58 * mm)


# ═════════════════════════════════════════════════════════════════════════════
# SECTION BUILDERS
# ═════════════════════════════════════════════════════════════════════════════

def _internal_chapter_header(elements, number: str, title: str):
    num_display = str(number).zfill(2)
    badge = Table([[Paragraph(
        f'<font color="white" size="13"><b>{num_display}</b></font>',
        ParagraphStyle('InChapNum', fontSize=13, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=15))
    ]], colWidths=[14 * mm], rowHeights=[14 * mm])
    badge.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INTERNAL_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    title_block = Table([
        [Paragraph(f'<font color="#94a3b8" size="7"><b>SECTION {num_display}</b></font>',
                   ParagraphStyle('InChapEy', fontSize=7, fontName='Helvetica-Bold', leading=8.5))],
        [Paragraph(f'<font color="#1e293b" size="14"><b>{title}</b></font>',
                   ParagraphStyle('InChapTitle', fontSize=14, fontName='Helvetica-Bold', leading=17))],
    ], colWidths=[148 * mm])
    title_block.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, 0), 0), ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
        ('TOPPADDING', (0, 1), (-1, 1), 0), ('BOTTOMPADDING', (0, 1), (-1, 1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    row = Table([[badge, title_block]], colWidths=[17 * mm, 151 * mm])
    row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 0)]))
    elements.append(Spacer(1, 10))
    elements.append(row)
    elements.append(HRFlowable(width='100%', thickness=2, color=INTERNAL_ACCENT, spaceBefore=6, spaceAfter=12))


def _insight_box(text, color, width=161, label="AI Analysis"):
    tbl = Table([[Paragraph(
        f'<font color="{color}" size="7.5"><b>{label}: </b></font>'
        f'<font color="#475569" size="7.5">{text}</font>',
        ParagraphStyle('InInsight', fontSize=7.5, fontName='Helvetica', leading=11))
    ]], colWidths=[width * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.8, HexColor(color)),
        ('LINEBEFORE', (0, 0), (0, -1), 3, HexColor(color)),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return tbl


# ── SECTION 01 — Test Execution Summary ──────────────────────────────────────

def build_internal_overview_hero(elements, tests, ai_data, score, score_label, score_color,
                                  pass_rate, page_label):
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    critical_fail = any(_is_critical_internal_fail(t) for t in tests)

    if critical_fail:
        overall_status, status_color = 'CRITICAL ISSUES', '#ef4444'
        risk_level, risk_color = 'HIGH', '#ef4444'
        deploy_text = 'NOT READY'
        status_explain = (
            'One or more critical checks failed on this authenticated page (authentication, page load, '
            'console/network errors). These block reliable use of the page — resolve before proceeding.')
    elif fail_count > 0:
        overall_status, status_color = 'PASSED W/ WARNINGS', '#f59e0b'
        risk_level, risk_color = 'MEDIUM', '#f59e0b'
        deploy_text = 'READY W/ CAUTION'
        status_explain = (
            f'Core access to the page is confirmed, but {fail_count} secondary check(s) failed on this page '
            f'(e.g. a UI component, form, or table element). Review the failing checks below.')
    else:
        overall_status, status_color = 'ALL CHECKS PASSED', '#10b981'
        risk_level, risk_color = 'LOW', '#10b981'
        deploy_text = 'READY'
        status_explain = (
            f'Every check executed on {page_label} passed, including authentication and page-load checks. '
            f'This page is stable and ready for deeper functional testing.')

    elements.append(section_header('', 'Test Execution Summary', INTERNAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>{status_explain}</i></font>',
        ParagraphStyle('InStatusExplain', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    def _hero_stat(label, value, color):
        return Table([[Paragraph(
            f'<font color="#94a3b8" size="7"><b>{label}</b></font><br/>'
            f'<font color="{color}" size="12"><b>{value}</b></font>',
            ParagraphStyle('InHeroStat', fontSize=10, fontName='Helvetica', leading=16, alignment=TA_CENTER))
        ]], colWidths=[40 * mm], style=[
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
            ('BOX', (0, 0), (-1, -1), 1, HexColor(color)),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ])

    row = Table([[
        _hero_stat('OVERALL STATUS', overall_status, status_color),
        _hero_stat('QUALITY SCORE', f'{score}/100', score_color),
        _hero_stat('RISK LEVEL', risk_level, risk_color),
        _hero_stat('NEXT STEPS', deploy_text, status_color),
    ]], colWidths=[42 * mm] * 4)
    row.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(row)
    elements.append(Spacer(1, 10))

    ai_summary_text = (ai_data or {}).get('summary', '')
    if not ai_summary_text:
        pass_count = sum(1 for t in tests if t.get('status') == 'pass')
        total = len(tests) or 1
        ai_summary_text = (
            f'This smoke run executed {total} check(s) on the authenticated page <b>{page_label}</b>, '
            f'with {pass_count} passed and {fail_count} failed ({pass_rate}% pass rate). '
            + ('Critical failures were detected on this page.' if critical_fail
               else 'No critical failures were detected on this page.'))
    elements.append(_insight_box(ai_summary_text, '#4f46e5', label='AI Summary'))
    elements.append(Spacer(1, 16))


def build_internal_key_metrics_cards(elements, generation_data, tests):
    elements.append(section_header('', 'Key Metrics', INTERNAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>'
        'Execution footprint for this single-page run — timing, check distribution, and where the '
        'critical checks are concentrated.</i></font>',
        ParagraphStyle('InKMInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    def _parse_ms(d):
        try:
            s = str(d)
            if s.endswith('ms'):
                return float(s.replace('ms', '') or 0)
            if s.endswith('s'):
                return float(s.replace('s', '') or 0) * 1000
        except Exception:
            pass
        return 0

    durations_ms = [_parse_ms(t.get('duration', '0')) for t in tests]
    total_ms = sum(durations_ms)
    avg_ms = (total_ms / len(durations_ms)) if durations_ms else 0
    critical_count = sum(1 for t in tests if _is_critical_internal_fail(t))

    cat_counts = {}
    for t in tests:
        label, _ = _internal_category_label(t)
        cat_counts[label] = cat_counts.get(label, 0) + 1
    top_cats = sorted(cat_counts.items(), key=lambda x: -x[1])[:2]
    top_cat_1 = top_cats[0] if len(top_cats) > 0 else ('—', 0)
    top_cat_2 = top_cats[1] if len(top_cats) > 1 else ('—', 0)

    metrics = [
        ('EXECUTION TIME', f'{total_ms/1000:.2f}s' if total_ms else 'N/A', '#0EA5E9'),
        ('CRITICAL CHECKS', str(critical_count), '#ef4444'),
        (f'{top_cat_1[0].upper()} CHECKS', str(top_cat_1[1]), INTERNAL_CATEGORY_META.get(top_cat_1[0], '#10b981')),
        (f'{top_cat_2[0].upper()} CHECKS', str(top_cat_2[1]), INTERNAL_CATEGORY_META.get(top_cat_2[0], '#8b5cf6')),
        ('TOTAL CHECKS', str(len(tests)), '#f59e0b'),
        ('AVG CHECK DURATION', f'{avg_ms:.0f}ms' if avg_ms else 'N/A', '#ec4899'),
    ]

    def _metric_card(label, value, color):
        cell = Table([[Paragraph(
            f'<font color="{color}" size="7"><b>{label}</b></font><br/>'
            f'<font color="#1e293b" size="11"><b>{value}</b></font>',
            ParagraphStyle('InKeyMetricC', fontSize=9, fontName='Helvetica', leading=15, alignment=TA_CENTER))
        ]], colWidths=[54 * mm])
        cell.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('BOX', (0, 0), (-1, -1), 1, HexColor(color)),
            ('LINEABOVE', (0, 0), (-1, 0), 3, HexColor(color)),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        return cell

    card_rows = []
    for i in range(0, len(metrics), 3):
        chunk = metrics[i:i + 3]
        row_cells = [_metric_card(l, v, c) for l, v, c in chunk]
        while len(row_cells) < 3:
            row_cells.append(Paragraph('', ParagraphStyle('InMetricEmpty')))
        card_rows.append(row_cells)
    outer = Table(card_rows, colWidths=[56 * mm] * 3)
    outer.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(outer)
    elements.append(Spacer(1, 16))

def _decode_screenshot(raw):
    """Decode a screenshot from base64 data-uri, raw base64, file path, or bytes."""
    import base64, os
    if not raw:
        return None
    try:
        if isinstance(raw, str) and raw.startswith('data:image'):
            img_bytes = base64.b64decode(raw.split(',', 1)[1])
            return RLImage(BytesIO(img_bytes), 110 * mm, height=62 * mm, kind='proportional')
        if isinstance(raw, str) and os.path.exists(raw):
            return RLImage(raw, 110 * mm, height=62 * mm, kind='proportional')
        if isinstance(raw, (bytes, bytearray)):
            return RLImage(BytesIO(raw), 110 * mm, height=62 * mm, kind='proportional')
        if isinstance(raw, str) and len(raw) > 200:
            img_bytes = base64.b64decode(raw)
            return RLImage(BytesIO(img_bytes), 110 * mm, height=62 * mm, kind='proportional')
    except Exception:
        return None
    return None
def _screenshot_flowable(raw):
    """Decode a screenshot (data-uri, raw base64, path, or bytes) into an RLImage, or None."""
    import base64, os
    if not raw:
        return None
    try:
        if isinstance(raw, str) and raw.startswith('data:image'):
            img_bytes = base64.b64decode(raw.split(',', 1)[1])
            return RLImage(BytesIO(img_bytes), 95 * mm, height=53 * mm, kind='proportional')
        if isinstance(raw, str) and os.path.exists(raw):
            return RLImage(raw, 95 * mm, height=53 * mm, kind='proportional')
        if isinstance(raw, (bytes, bytearray)):
            return RLImage(BytesIO(raw), 95 * mm, height=53 * mm, kind='proportional')
        if isinstance(raw, str) and len(raw) > 200:
            img_bytes = base64.b64decode(raw)
            return RLImage(BytesIO(img_bytes), 95 * mm, height=53 * mm, kind='proportional')
    except Exception:
        return None
    return None


def _framed_screenshot(img_flowable, caption_text, color=INTERNAL_ACCENT):
    caption = Paragraph(
        f'<font color="#475569" size="7.5"><b>{caption_text}</b></font>',
        ParagraphStyle('ShotCaption', fontSize=7.5, fontName='Helvetica-Bold', leading=10))
    framed = Table([[img_flowable]], colWidths=[161 * mm])
    framed.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, color), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return [caption, Spacer(1, 4), framed, Spacer(1, 8)]


def _screenshot_placeholder(text):
    placeholder = Table([[Paragraph(
        f'<font color="#94a3b8" size="8.5">{text}</font>',
        ParagraphStyle('InShotPH', fontSize=8.5, fontName='Helvetica', alignment=TA_CENTER, leading=12))
    ]], colWidths=[161 * mm])
    placeholder.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_DARK), ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 24), ('BOTTOMPADDING', (0, 0), (-1, -1), 24),
    ]))
    return placeholder


def build_internal_screenshot(elements, generation_data, scraped):
    intro_block = [
        section_header('', 'Page Screenshots', INTERNAL_ACCENT), Spacer(1, 4),
        Paragraph(
            '<font color="#64748b" size="7.5"><i>'
            'Visual snapshots captured by Playwright during execution: the login page (before '
            'authentication) and the target page you requested (after authentication).'
            '</i></font>', ParagraphStyle('InShotInfo', fontSize=7.5, fontName='Helvetica', leading=10)),
        Spacer(1, 8),
    ]
    elements.append(KeepTogether(intro_block))

    result_obj = generation_data.get('result', {}) or {}
    sc = scraped or {}

    raw_login  = generation_data.get('screenshot_login') or result_obj.get('screenshot_login') or sc.get('screenshot_login')
    raw_target = generation_data.get('screenshot') or result_obj.get('screenshot') or sc.get('screenshot')

    img_login  = _screenshot_flowable(raw_login)
    img_target = _screenshot_flowable(raw_target)

    if img_login:
        elements.append(KeepTogether(_framed_screenshot(img_login, '1. Login Page (before authentication)')))
    else:
        placeholder_block = [
            Paragraph('<font color="#94a3b8" size="7.5"><b>1. Login Page</b></font>',
                      ParagraphStyle('InShotCap1', fontSize=7.5, fontName='Helvetica-Bold')),
            Spacer(1, 4),
            _screenshot_placeholder('No login screenshot was captured for this run.'),
            Spacer(1, 12),
        ]
        elements.append(KeepTogether(placeholder_block))

    if img_target:
        elements.append(KeepTogether(_framed_screenshot(img_target, '2. Target Page (after authentication)')))
    else:
        placeholder_block = [
            Paragraph('<font color="#94a3b8" size="7.5"><b>2. Target Page</b></font>',
                      ParagraphStyle('InShotCap2', fontSize=7.5, fontName='Helvetica-Bold')),
            Spacer(1, 4),
            _screenshot_placeholder(
                'No target-page screenshot was captured — authentication may not have succeeded, '
                'so the login page was scraped instead.'),
            Spacer(1, 12),
        ]
        elements.append(KeepTogether(placeholder_block))

    elements.append(Spacer(1, 4))


def _is_evidence_worthy_fail(t: dict) -> bool:
    if t.get('status') != 'fail':
        return False
    if not (t.get('screenshot') or t.get('evidence_screenshot')):
        return False
    typ = (t.get('type') or '').lower()
    cat = (t.get('category') or '').lower()
    name = (t.get('name') or '').lower()
    hay = f'{typ} {cat} {name}'
    if any(k in hay for k in FAILURE_EVIDENCE_TYPES):
        return True
    # 404 / broken page also worth showing even without exact keyword match
    if '404' in hay or 'not found' in hay or 'broken' in hay:
        return True
    return False


def build_internal_failure_evidence(elements, tests):
    """Shows 1-2 proof screenshots, only for failed checks that are visually
    meaningful (broken button, JS error, 404, form error). Skips entirely if
    no test carries a per-check screenshot."""
    candidates = [t for t in tests if _is_evidence_worthy_fail(t)]
    if not candidates:
        return

    # Prioritize critical types first, cap at 2
    candidates.sort(key=lambda t: 0 if _is_critical_internal_fail(t) else 1)
    candidates = candidates[:2]

    imgs = []
    for t in candidates:
        raw = t.get('screenshot') or t.get('evidence_screenshot')
        img = _decode_screenshot(raw)
        if img:
            imgs.append((t, img))

    if not imgs:
        return

    elements.append(section_header('', 'Failure Evidence', RED))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>'
        'Visual proof captured at the moment of failure for the most critical issue(s) detected '
        'on this page.</i></font>',
        ParagraphStyle('InEvidInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    for t, img in imgs:
        cat_label, _ = _internal_category_label(t)
        reason = t.get('reason') or t.get('error') or 'Check failed'
        caption = Paragraph(
            f'<font color="#ef4444" size="8"><b>✗ {t.get("name","")}</b></font>  '
            f'<font color="#94a3b8" size="7">({cat_label})</font><br/>'
            f'<font color="#475569" size="7.5">{str(reason)[:120]}</font>',
            ParagraphStyle('InEvidCap', fontSize=8, fontName='Helvetica', leading=11))
        framed = Table([[img]], colWidths=[161 * mm])
        framed.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, RED), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(KeepTogether([caption, Spacer(1, 4), framed, Spacer(1, 12)]))

    elements.append(Spacer(1, 4))
def build_internal_score_hero(elements, score, score_label, score_color):
    elements.append(section_header('', 'Smoke Quality Score', HexColor(score_color)))
    elements.append(Spacer(1, 10))
    try:
        gauge_img = _make_score_gauge(score, score_color)
    except Exception:
        gauge_img = None

    right_col = [
        Paragraph(f'<font color="{score_color}" size="15"><b>{score_label}</b></font>',
                  ParagraphStyle('InHeroLabel', fontSize=15, fontName='Helvetica-Bold', leading=18)),
        Spacer(1, 6),
        Paragraph(
            '<font color="#475569" size="8.5">The Smoke Quality Score weighs critical checks (authentication, '
            'page load, console/network errors) three times as heavily as secondary UI checks. '
            'Excellent ≥ 90 · Good ≥ 75 · Acceptable ≥ 50 · Critical below.</font>',
            ParagraphStyle('InHeroDesc', fontSize=8.5, fontName='Helvetica', leading=13)),
    ]
    if gauge_img:
        row = Table([[gauge_img, right_col]], colWidths=[56 * mm, 112 * mm])
    else:
        row = Table([[right_col]], colWidths=[168 * mm])
    row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 1.2, HexColor(score_color)), ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('LEFTPADDING', (0, 0), (-1, -1), 14), ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 14), ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
    ]))
    elements.append(row)
    elements.append(Spacer(1, 18))


def build_internal_methodology(elements, tests, generation_data):
    page_label = _page_label(generation_data)
    auth_method = generation_data.get('auth_method', 'authenticated session')

    elements.append(section_header('', 'Smoke Test Methodology', INTERNAL_ACCENT))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f'This report validates the stability of a single <b>authenticated internal page</b> — '
        f'<b>{page_label}</b> — accessed via {auth_method}, before deeper functional or regression '
        f'testing proceeds. NexTest does not test the surrounding application: only the elements '
        f'actually detected on this specific page are analyzed (navigation, UI components, forms, '
        f'tables, or data rendering — whichever are present). Checks are executed automatically using '
        f'Playwright in headless Chromium, verifying element presence, visibility, and console/network '
        f'health against the live authenticated DOM.',
        ParagraphStyle('InMethoTxt', fontSize=8.5, fontName='Helvetica', leading=13,
                       textColor=HexColor('#475569'))))
    elements.append(Spacer(1, 16))
    build_internal_scenarios_table(elements, tests, page_label)


def build_internal_scenarios_table(elements, tests, page_label):
    elements.append(section_header('', 'Smoke Test Scenarios', INTERNAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>'
        f'Planned checks for <b>{page_label}</b> — {len(tests)} scenario(s), scoped to the elements '
        f'actually detected on this authenticated page.</i></font>',
        ParagraphStyle('InScInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('InSH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Scenario</b></font>', ParagraphStyle('InSH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('InSH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('InSH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Expected</b></font>', ParagraphStyle('InSH4', fontSize=8, fontName='Helvetica-Bold')),
    ]
    rows = [hdr]
    row_styles = []
    for i, t in enumerate(tests):
        cat_label, cat_color = _internal_category_label(t)
        priority = (t.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b')
        expected = t.get('reason') or t.get('expected') or t.get('description') or 'Element present and visible'
        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('InSID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<b><font color="#1e293b" size="8">{t.get("name","")}</font></b>', ParagraphStyle('InSN', fontSize=8, fontName='Helvetica', leading=11)),
            Paragraph(f'<font color="{cat_color}"><b>{cat_label.upper()}</b></font>', ParagraphStyle('InSC', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('InSP', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7">{str(expected)[:75]}</font>', ParagraphStyle('InSE', fontSize=7, fontName='Helvetica', leading=10)),
        ])
        if i % 2 == 1:
            row_styles.append(('BACKGROUND', (0, i + 1), (-1, i + 1), LIGHT_BG))

    tbl = Table(rows, colWidths=[8 * mm, 54 * mm, 28 * mm, 20 * mm, 58 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('LINEBEFORE', (2, 1), (2, -1), 1, BORDER), ('LINEBEFORE', (4, 1), (4, -1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


def build_internal_category_summary(elements, tests):
    elements.append(section_header('', 'Results by Category', INTERNAL_ACCENT))
    elements.append(Spacer(1, 8))

    cats = {c: {'pass': 0, 'fail': 0, 'total': 0} for c in INTERNAL_CATEGORY_ORDER}
    for t in tests:
        label, _ = _internal_category_label(t)
        cats[label]['total'] += 1
        if t.get('status') == 'pass':
            cats[label]['pass'] += 1
        elif t.get('status') == 'fail':
            cats[label]['fail'] += 1

    hdr = [
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('InCH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Total</b></font>', ParagraphStyle('InCH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Passed</b></font>', ParagraphStyle('InCH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Failed</b></font>', ParagraphStyle('InCH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Pass Rate</b></font>', ParagraphStyle('InCH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Verdict</b></font>', ParagraphStyle('InCH6', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []
    any_row = False
    for cat in INTERNAL_CATEGORY_ORDER:
        d = cats[cat]
        if d['total'] == 0:
            continue
        any_row = True
        rate = round(d['pass'] / d['total'] * 100)
        rate_color = '#10b981' if rate == 100 else '#f59e0b' if rate >= 60 else '#ef4444'
        verdict = 'PASS' if d['fail'] == 0 else 'FAIL'
        vc = '#10b981' if d['fail'] == 0 else '#ef4444'
        row_bg = HexColor('#f0fdf4') if d['fail'] == 0 else HexColor('#fef2f2')
        rows.append([
            Paragraph(f'<font color="#1e293b"><b>{cat}</b></font>', ParagraphStyle('InCC', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph(f'<font color="#1e293b"><b>{d["total"]}</b></font>', ParagraphStyle('InCT', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#10b981"><b>{d["pass"]}</b></font>', ParagraphStyle('InCP', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#ef4444"><b>{d["fail"]}</b></font>', ParagraphStyle('InCF', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{rate_color}"><b>{rate}%</b></font>', ParagraphStyle('InCR', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{vc}"><b>{verdict}</b></font>', ParagraphStyle('InCV', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
        ri = len(rows) - 1
        row_styles.append(('BACKGROUND', (0, ri), (-1, ri), row_bg))

    if not any_row:
        elements.append(Paragraph('<font color="#94a3b8" size="8">No categorized checks available for this run.</font>',
                                   ParagraphStyle('InCatNone', fontSize=8, fontName='Helvetica')))
        elements.append(Spacer(1, 16))
        return

    tbl = Table(rows, colWidths=[36 * mm, 22 * mm, 22 * mm, 22 * mm, 26 * mm, 40 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (1, 0), (5, -1), 'CENTER'),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ── SECTION 02 — Smoke Analysis ──────────────────────────────────────────────

def build_internal_smoke_analysis_charts(elements, tests):
    _internal_chapter_header(elements, '2', 'Smoke Analysis')

    try:
        chart_img, cats_data = _make_internal_category_chart(tests)
        cat_desc = ('This chart compares passed and failed checks across each category detected on the '
                    'tested page, helping you quickly spot which area needs attention.')
        worst_cat = max(cats_data, key=lambda c: cats_data[c]['fail']) if cats_data else None
        if worst_cat and cats_data[worst_cat]['fail'] > 0:
            cat_insight = (f'{worst_cat} currently has the most failures ({cats_data[worst_cat]["fail"]}) — '
                            f'this is the area to prioritize first on this page.')
        else:
            cat_insight = 'No category shows any failures — coverage on this page is currently clean.'
        framed = Table([[chart_img]], colWidths=[161 * mm])
        framed.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, INTERNAL_ACCENT), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(section_header('', 'Category Breakdown', INTERNAL_ACCENT))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f'<font color="#64748b" size="7.5"><i>{cat_desc}</i></font>',
                                   ParagraphStyle('InCatDesc', fontSize=7.5, fontName='Helvetica', leading=10)))
        elements.append(Spacer(1, 8))
        elements.append(framed)
        elements.append(Spacer(1, 6))
        elements.append(_insight_box(cat_insight, '#0EA5E9'))
        elements.append(Spacer(1, 16))
    except Exception:
        pass

    try:
        dist_img = _make_internal_status_bar_chart(tests)
        pass_c = sum(1 for t in tests if t.get('status') == 'pass')
        fail_c = sum(1 for t in tests if t.get('status') == 'fail')
        skip_c = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))
        total_c = pass_c + fail_c + skip_c or 1
        dist_insight = (f'Out of {total_c} executed checks on this page: {pass_c} passed '
                         f'({round(pass_c/total_c*100)}%), {fail_c} failed ({round(fail_c/total_c*100)}%), '
                         f'and {skip_c} skipped ({round(skip_c/total_c*100)}%).')
        framed_dist = Table([[dist_img]], colWidths=[161 * mm])
        framed_dist.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, INTERNAL_ACCENT), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(section_header('', 'Pass / Fail / Skipped Distribution', INTERNAL_ACCENT))
        elements.append(Spacer(1, 8))
        elements.append(framed_dist)
        elements.append(Spacer(1, 6))
        elements.append(_insight_box(dist_insight, '#0EA5E9'))
        elements.append(Spacer(1, 16))
    except Exception:
        pass


def build_internal_smoke_quality_analysis(elements, tests, ai_data, score, score_label, page_label):
    """Narrative AI analysis: stability, rendering, UI reliability, auth status,
    detected issues, readiness — based only on actual executed results."""
    elements.append(section_header('', 'Smoke Quality Analysis', HexColor('#4f46e5')))
    elements.append(Spacer(1, 6))

    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    total = len(tests) or 1
    pass_rate = round(sum(1 for t in tests if t.get('status') == 'pass') / total * 100)

    auth_tests = [t for t in tests if _internal_category_label(t)[0] == 'Authentication']
    auth_pass = auth_tests and all(t.get('status') == 'pass' for t in auth_tests)
    auth_fail = any(t.get('status') == 'fail' for t in auth_tests)

    nav_tests = [t for t in tests if _internal_category_label(t)[0] == 'Navigation']
    nav_fail = any(t.get('status') == 'fail' for t in nav_tests)

    js_tests = [t for t in tests if _internal_category_label(t)[0] == 'JavaScript']
    js_fail = any(t.get('status') == 'fail' for t in js_tests)

    stability_text = (
        f'{page_label} demonstrates {"critical instability" if fail_count and any(_is_critical_internal_fail(t) for t in tests) else "overall stability"} '
        f'with a {pass_rate}% pass rate across {total} check(s) on this page. '
        + (f'{"Authentication is confirmed working — the session remains valid throughout the run." if auth_pass else "Authentication issues were detected — session validity should be reviewed." if auth_fail else ""} ')
        + (f'{"Navigation elements on this page are reliable." if nav_tests and not nav_fail else "Navigation elements on this page show failures that should be investigated." if nav_fail else ""} ')
        + (f'{"No console or JavaScript errors were captured during rendering." if js_tests and not js_fail else "Console/JavaScript errors were captured during rendering — see details below." if js_fail else ""} ')
        + ('This page is a reasonable candidate for the next testing phase.' if fail_count == 0
           else 'Review the failing checks below before promoting this page to further testing.')
    )
    elements.append(Paragraph(f'<font color="#475569" size="8.5">{stability_text}</font>',
                               ParagraphStyle('InQualStab', fontSize=8.5, fontName='Helvetica', leading=13)))
    elements.append(Spacer(1, 16))


# ── SECTION 03 — Test Details ────────────────────────────────────────────────

def build_internal_environment_info(elements, generation_data, tests):
    total_ms = 0
    try:
        for t in tests:
            d = str(t.get('duration', '0'))
            if d.endswith('ms'):
                total_ms += float(d.replace('ms', '') or 0)
            elif d.endswith('s'):
                total_ms += float(d.replace('s', '') or 0) * 1000
    except Exception:
        pass
    exec_time_disp = f'{total_ms/1000:.2f}s' if total_ms else 'N/A'

    items = [
        ('BROWSER', generation_data.get('browser', 'Chromium (headless)'), '#0EA5E9'),
        ('PLAYWRIGHT VERSION', generation_data.get('playwright_version', 'N/A'), '#6366f1'),
        ('VIEWPORT', generation_data.get('viewport', '1920×1080'), '#f59e0b'),
        ('HEADLESS MODE', 'Yes' if generation_data.get('headless', True) else 'No', '#8b5cf6'),
        ('EXECUTION TIME', exec_time_disp, '#10b981'),
        ('NEXTEST VERSION', generation_data.get('nextest_version', '1.0.0'), '#ec4899'),
    ]

    def _env_card(label, value, color):
        cell = Table([[Paragraph(
            f'<font color="{color}" size="7"><b>{label}</b></font><br/>'
            f'<font color="#1e293b" size="10.5"><b>{value}</b></font>',
            ParagraphStyle('InEnvC', fontSize=9, fontName='Helvetica', leading=15, alignment=TA_CENTER))
        ]], colWidths=[54 * mm])
        cell.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), WHITE), ('BOX', (0, 0), (-1, -1), 1, HexColor(color)),
            ('LINEABOVE', (0, 0), (-1, 0), 3, HexColor(color)),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        return cell

    card_rows = []
    for i in range(0, len(items), 3):
        chunk = items[i:i + 3]
        row_cells = [_env_card(l, v, c) for l, v, c in chunk]
        while len(row_cells) < 3:
            row_cells.append(Paragraph('', ParagraphStyle('InEnvEmpty')))
        card_rows.append(row_cells)
    outer = Table(card_rows, colWidths=[56 * mm] * 3)
    outer.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(KeepTogether([
        section_header('', 'Execution Environment', INTERNAL_ACCENT), Spacer(1, 6),
        Paragraph('<font color="#64748b" size="7.5"><i>Browser and framework used to run this smoke '
                  'audit — for reproducibility of the results below.</i></font>',
                  ParagraphStyle('InEnvInfo', fontSize=7.5, fontName='Helvetica', leading=10)),
        Spacer(1, 6), outer,
    ]))
    elements.append(Spacer(1, 16))


def build_internal_detailed_results(elements, tests):
    elements.append(section_header('', 'Detailed Smoke Results', TEAL))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Real results from Playwright execution on this page. '
        'Every value comes directly from the test runner.</i></font>',
        ParagraphStyle('InDRInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('InDH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Test Name</b></font>', ParagraphStyle('InDH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('InDH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('InDH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Result / Reason</b></font>', ParagraphStyle('InDH4', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Duration</b></font>', ParagraphStyle('InDH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []
    for i, t in enumerate(tests):
        status = t.get('status', 'skip')
        sc = '#10b981' if status == 'pass' else '#ef4444' if status == 'fail' else '#f59e0b'
        s_label = '✓  PASS' if status == 'pass' else '✗  FAIL' if status == 'fail' else '■  SKIP'
        s_bg = HexColor('#f0fdf4') if status == 'pass' else HexColor('#fef2f2') if status == 'fail' else HexColor('#fffbeb')
        cat_label, cat_color = _internal_category_label(t)
        reason = t.get('reason') or t.get('reason_pass') or t.get('suite') or t.get('error') or '—'
        duration = t.get('duration', '—')
        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('InDID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<b><font color="#1e293b" size="8">{t.get("name","")}</font></b>', ParagraphStyle('InDN', fontSize=8, fontName='Helvetica', leading=11)),
            Paragraph(f'<font color="{cat_color}"><b>{cat_label.upper()}</b></font>', ParagraphStyle('InDC', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{sc}"><b>{s_label}</b></font>', ParagraphStyle('InDS', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7">{str(reason)[:90]}</font>', ParagraphStyle('InDR', fontSize=7, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#64748b" size="7"><b>{duration}</b></font>', ParagraphStyle('InDD', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
        row_styles.append(('BACKGROUND', (3, i + 1), (3, i + 1), s_bg))

    tbl = Table(rows, colWidths=[8 * mm, 44 * mm, 26 * mm, 20 * mm, 52 * mm, 18 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 7), ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER),
        ('BOX', (0, 0), (-1, -1), 0.8, TEAL), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'), ('ALIGN', (2, 0), (3, -1), 'CENTER'), ('ALIGN', (5, 0), (5, -1), 'CENTER'),
        ('LINEBEFORE', (4, 1), (4, -1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ── SECTION 04 — AI Insights & Recommendations ───────────────────────────────

def build_internal_ai_recommendations_table(elements, ai_data):
    recs = (ai_data or {}).get('recommendations', []) or []
    elements.append(section_header('', 'AI Recommendations', HexColor('#4f46e5')))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Recommendations generated only for issues detected on '
        'this authenticated page.</i></font>',
        ParagraphStyle('InRSInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    if recs:
        hdr = [
            Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('InRH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('InRH2', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Issue</b></font>', ParagraphStyle('InRH3', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Recommendation</b></font>', ParagraphStyle('InRH4', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Severity</b></font>', ParagraphStyle('InRH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ]
        rows = [hdr]
        row_styles = []
        for i, rec in enumerate(recs):
            priority = (rec.get('priority') or 'medium').lower()
            pc = PRIORITY_COLORS.get(priority, '#f59e0b')
            severity = (rec.get('severity') or priority).upper()
            rows.append([
                Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('InRP', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
                Paragraph(f'<font color="#4f46e5" size="7.5"><b>{(rec.get("category","") or "").upper()}</b></font>', ParagraphStyle('InRC', fontSize=7.5, fontName='Helvetica-Bold')),
                Paragraph(f'<font color="#1e293b" size="7.5">{rec.get("issue","")[:60]}</font>', ParagraphStyle('InRI', fontSize=7.5, fontName='Helvetica', leading=10)),
                Paragraph(f'<font color="#475569" size="7.5">{rec.get("fix", rec.get("recommendation",""))[:70]}</font>', ParagraphStyle('InRF', fontSize=7.5, fontName='Helvetica', leading=10)),
                Paragraph(f'<font color="{pc}"><b>{severity}</b></font>', ParagraphStyle('InRSev', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            ])
            if i % 2 == 1:
                row_styles.append(('BACKGROUND', (0, i + 1), (-1, i + 1), LIGHT_BG))
        tbl = Table(rows, colWidths=[18 * mm, 24 * mm, 46 * mm, 60 * mm, 20 * mm], repeatRows=1)
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 7),
            ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, HexColor('#4f46e5')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (0, 0), (0, -1), 'CENTER'), ('ALIGN', (4, 0), (4, -1), 'CENTER'),
        ] + row_styles))
        elements.append(tbl)
    else:
        elements.append(Paragraph('<font color="#94a3b8" size="8">No issues detected on this page — no '
                                   'recommendations needed for this run.</font>',
                                   ParagraphStyle('InNoRec', fontSize=8, fontName='Helvetica')))
    elements.append(Spacer(1, 16))


def build_internal_ai_focus_sections(elements, tests, ai_data, page_label):
    """Only renders sub-sections relevant to what was actually tested on this page."""
    elements.append(section_header('', 'Focused AI Analysis', HexColor('#4f46e5')))
    elements.append(Spacer(1, 8))

    def _related(cat_name):
        return [t for t in tests if _internal_category_label(t)[0] == cat_name]

    def _narrative(title, cat_name, color, always=False):
        related = _related(cat_name)
        if not related and not always:
            return
        total_n = len(related)
        if total_n == 0:
            return
        fail_n = sum(1 for t in related if t.get('status') == 'fail')
        if fail_n == 0:
            text = f'All {total_n} check(s) passed for {title.split(" Analysis")[0].lower()} on this page — fully operational, no issues detected.'
        else:
            failing = [t.get('name', '') for t in related if t.get('status') == 'fail'][:3]
            text = f'{fail_n} of {total_n} check(s) failed: {", ".join(failing)}. Investigate before further testing.'
        elements.append(sub_section_header(title, color))
        elements.append(Spacer(1, 4))
        elements.append(_insight_box(text, color, label='Summary'))
        elements.append(Spacer(1, 10))

    # Page Stability — always shown, based on all critical checks
    critical = [t for t in tests if t.get('type') in INTERNAL_HIGH_TYPES]
    if critical:
        fail_n = sum(1 for t in critical if t.get('status') == 'fail')
        text = (f'All {len(critical)} critical check(s) passed on {page_label} — the page loads reliably '
                f'and the authenticated session holds.' if fail_n == 0 else
                f'{fail_n} of {len(critical)} critical check(s) failed on {page_label} — this affects the '
                f'core reliability of the page and should be prioritized.')
        elements.append(sub_section_header('Page Stability', '#0EA5E9'))
        elements.append(Spacer(1, 4))
        elements.append(_insight_box(text, '#0EA5E9', label='Summary'))
        elements.append(Spacer(1, 10))

    _narrative('Navigation Analysis', 'Navigation', '#10b981')
    _narrative('UI Components Analysis', 'UI Components', '#8b5cf6')
    _narrative('Forms Analysis', 'Forms', '#f59e0b')
    _narrative('Tables Analysis', 'Tables', '#0d9488')
    _narrative('Rendering Analysis', 'Data Rendering', '#3b82f6')
    _narrative('JavaScript Analysis', 'JavaScript', '#ef4444')

    # Deployment Readiness — always shown
    critical_fail = any(_is_critical_internal_fail(t) for t in tests)
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    if critical_fail:
        depl_text = 'This page is NOT ready for further testing — critical checks (load, auth, console/network) failed.'
        depl_color = '#ef4444'
    elif fail_count > 0:
        depl_text = f'This page is ready with caution — {fail_count} secondary check(s) failed. Review before proceeding.'
        depl_color = '#f59e0b'
    else:
        depl_text = 'This page is ready — all checks passed, stable for the next testing phase.'
        depl_color = '#10b981'
    elements.append(sub_section_header('Deployment Readiness', depl_color))
    elements.append(Spacer(1, 4))
    elements.append(_insight_box(depl_text, depl_color, label='Summary'))
    elements.append(Spacer(1, 16))


def build_internal_action_plan(elements, ai_data):
    action_plan = (ai_data or {}).get('action_plan', []) or []
    if not action_plan:
        return
    elements.append(section_header('', 'AI Action Plan', GOLD))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('InAH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('InAH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Action</b></font>', ParagraphStyle('InAH3', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Expected Impact</b></font>', ParagraphStyle('InAH4', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('InAH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    for i, item in enumerate(action_plan):
        if isinstance(item, str):
            item = {'priority': 'medium', 'category': 'General', 'action': item,
                     'impact': '—', 'status': 'To Do'}
        priority = (item.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b')
        rows.append([
            Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('InAP', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#4f46e5" size="7.5"><b>{(item.get("category","") or "").upper()}</b></font>', ParagraphStyle('InAC', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#1e293b" size="7.5">{item.get("action","")}</font>', ParagraphStyle('InAA', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#475569" size="7.5">{item.get("impact", item.get("expected_impact",""))}</font>', ParagraphStyle('InAI', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#64748b" size="7">⏳ {item.get("status","To Do")}</font>', ParagraphStyle('InASt', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)),
        ])
    tbl = Table(rows, colWidths=[18 * mm, 24 * mm, 54 * mm, 50 * mm, 22 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 7), ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER),
        ('BOX', (0, 0), (-1, -1), 0.8, GOLD), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (1, -1), 'CENTER'), ('ALIGN', (4, 0), (4, -1), 'CENTER'),
    ]))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ═════════════════════════════════════════════════════════════════════════════
# MAIN GENERATOR
# ═════════════════════════════════════════════════════════════════════════════

def _generate_internal_smoke_pdf(generation_data: dict, tests: list, scraped: dict, ai_data: dict) -> bytes:
    buffer = BytesIO()
    page_label = _page_label(generation_data)
    url = generation_data.get('url', '')
    framework = generation_data.get('framework', 'Playwright')

    pass_count = sum(1 for t in tests if t.get('status') == 'pass')
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    skip_count = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))
    total = len(tests) or 1
    pass_rate = round(pass_count / total * 100)
    rate_color = '#10b981' if pass_rate >= 80 else '#f59e0b' if pass_rate >= 50 else '#ef4444'

    score, score_label, score_color = _compute_internal_smoke_score(tests)

    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20 * mm, leftMargin=22 * mm,
                             topMargin=57 * mm, bottomMargin=20 * mm)

    def on_page_internal(canvas, doc):
        W, H = A4
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, H - 52 * mm, W, 52 * mm, fill=1, stroke=0)
        canvas.setFillColor(INTERNAL_ACCENT)
        canvas.rect(0, H - 54 * mm, W, 2 * mm, fill=1, stroke=0)
        canvas.setFillColor(INTERNAL_ACCENT)
        canvas.rect(0, 0, 3, H - 54 * mm, fill=1, stroke=0)
        canvas.setFillColor(LIGHT_BG)
        canvas.rect(0, 0, W, 14 * mm, fill=1, stroke=0)
        canvas.setFillColor(BORDER)
        canvas.rect(0, 14 * mm, W, 0.5, fill=1, stroke=0)
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 5 * mm, 'Generated by NexTest — Internal Smoke Test Report')
        canvas.drawRightString(W - 20 * mm, 5 * mm, f'Page {doc.page}  •  {datetime.now().strftime("%Y-%m-%d")}')
        canvas.restoreState()

    elements = []

    # ── COVER ─────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph('<font color="#0EA5E9"><b>NEX</b></font><font color="#ffffff">TEST</font>',
                  ParagraphStyle('InLogo', fontSize=24, fontName='Helvetica-Bold')),
        Paragraph(f'<font color="#64748b">Generated</font><br/>'
                  f'<font color="#94a3b8">{datetime.now().strftime("%B %d, %Y  •  %H:%M")}</font>',
                  ParagraphStyle('InDate', fontSize=8.5, fontName='Helvetica', alignment=TA_RIGHT, leading=13)),
    ]]
    header_tbl = Table(header_data, colWidths=[90 * mm, 78 * mm])
    header_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(Spacer(1, -38 * mm))
    elements.append(header_tbl)
    elements.append(Spacer(1, 6 * mm))
    elements.append(Paragraph('Internal Smoke Test Report',
                               ParagraphStyle('InTitle', fontSize=22, textColor=WHITE,
                                              fontName='Helvetica-Bold', spaceAfter=2)))
    elements.append(Spacer(1, 14 * mm))

    info_tbl = Table([
        [Paragraph('<font color="#64748b">Tested URL</font>', ParagraphStyle('InIL1', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{url}</font>', ParagraphStyle('InIV1', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Page</font>', ParagraphStyle('InIL2', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#0EA5E9"><b>{page_label}</b></font>', ParagraphStyle('InIV2', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Framework</font>', ParagraphStyle('InIL3', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#0EA5E9"><b>{framework}</b></font>', ParagraphStyle('InIV3', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Test Type</font>', ParagraphStyle('InIL4', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph('<font color="#0EA5E9"><b>Internal Smoke Test (Authenticated)</b></font>', ParagraphStyle('InIV4', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Authentication</font>', ParagraphStyle('InIL5', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{generation_data.get("auth_method", "Authenticated session")}</font>', ParagraphStyle('InIV5', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Generated</font>', ParagraphStyle('InIL6', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{datetime.now().strftime("%Y-%m-%d  %H:%M")}</font>', ParagraphStyle('InIV6', fontSize=8.5, fontName='Helvetica', leading=12))],
    ], colWidths=[32 * mm, 136 * mm])
    info_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_BG), ('PADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -2), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, BORDER_DARK),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [WHITE, LIGHT_BG]), ('LEFTPADDING', (0, 0), (0, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(info_tbl)
    elements.append(Spacer(1, 20))

    # ── KPI cards ─────────────────────────────────────────────────────────
    elements.append(section_header('', 'Test Summary', INTERNAL_ACCENT))
    elements.append(Spacer(1, 8))
    stats_data = [[
        stat_card(pass_count, 'PASSED', '#10b981', GREEN_BG),
        stat_card(fail_count, 'FAILED', '#ef4444', RED_BG),
        stat_card(skip_count, 'SKIPPED', '#f59e0b', ORANGE_BG),
        stat_card(f'{pass_rate}%', 'PASS RATE', rate_color,
                  GREEN_BG if pass_rate >= 80 else ORANGE_BG if pass_rate >= 50 else RED_BG),
        stat_card(total, 'TOTAL', '#3b82f6', BLUE_BG),
    ]]
    outer = Table(stats_data, colWidths=[33.6 * mm] * 5)
    outer.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(outer)
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#94a3b8" size="7"><i>Pass Rate is the raw proportion of checks that succeeded on '
        'this page. The Smoke Quality Score further below is severity-weighted — critical checks '
        '(authentication, page load, console/network errors) count more.</i></font>',
        ParagraphStyle('InRateNote', fontSize=7, fontName='Helvetica', leading=9)))
    elements.append(Spacer(1, 20))

    _internal_chapter_header(elements, '1', 'Test Execution Summary')
    build_internal_overview_hero(elements, tests, ai_data, score, score_label, score_color, pass_rate, page_label)
    build_internal_key_metrics_cards(elements, generation_data, tests)
    build_internal_screenshot(elements, generation_data, scraped)
    build_internal_score_hero(elements, score, score_label, score_color)
    build_internal_methodology(elements, tests, generation_data)
    build_internal_category_summary(elements, tests)

    build_internal_smoke_analysis_charts(elements, tests)
    build_internal_smoke_quality_analysis(elements, tests, ai_data, score, score_label, page_label)

    _internal_chapter_header(elements, '3', 'Test Details')
    build_internal_environment_info(elements, generation_data, tests)
    build_internal_detailed_results(elements, tests)
    build_internal_failure_evidence(elements, tests)

    _internal_chapter_header(elements, '4', 'AI Insights & Recommendations')
    build_internal_ai_recommendations_table(elements, ai_data)
    build_internal_ai_focus_sections(elements, tests, ai_data, page_label)
    build_internal_action_plan(elements, ai_data)

    _internal_chapter_header(elements, '5', 'Report Conclusion')
    elements.append(section_header('', 'Final AI Verdict', INTERNAL_ACCENT))
    elements.append(Spacer(1, 6))

    critical_fail = any(_is_critical_internal_fail(t) for t in tests)
    if critical_fail:
        vc, vb, vbrd, risk_level = '#ef4444', HexColor('#fef2f2'), RED, 'HIGH'
        vt = (f'Internal Smoke Test FAILED — critical checks did not pass on {page_label}. Authentication, '
              f'page load, or console/network issues were detected on this page. This page is NOT ready '
              f'for further testing until resolved.')
    elif fail_count > 0:
        vc, vb, vbrd, risk_level = '#b45309', HexColor('#fffbeb'), ORANGE, 'MEDIUM'
        vt = (f'Internal Smoke Test passed with {fail_count} non-critical issue(s) on {page_label}. '
              f'The page is accessible and stable, but the failing checks should be reviewed before '
              f'proceeding to deeper testing.')
    else:
        vc, vb, vbrd, risk_level = '#059669', HexColor('#f0fdf4'), GREEN, 'LOW'
        vt = (f'Internal Smoke Test PASSED — all {pass_count} check(s) succeeded on {page_label}. '
              f'This authenticated page is stable and ready for deeper functional and regression testing.')

    final_tbl = Table([[Paragraph(
        f'<font color="{vc}" size="9"><b>Final AI Verdict</b></font><br/>'
        f'<font color="{vc}" size="8">{vt}</font><br/><br/>'
        f'<font color="#64748b" size="8"><b>Smoke Quality Score: </b></font>'
        f'<font color="{vc}" size="8"><b>{score}/100</b></font>'
        f'<font color="#94a3b8" size="8">    |    </font>'
        f'<font color="#64748b" size="8"><b>Risk Level: </b></font>'
        f'<font color="{vc}" size="8"><b>{risk_level}</b></font>'
        f'<font color="#94a3b8" size="8">    |    </font>'
        f'<font color="#64748b" size="8"><b>Overall Page Health: </b></font>'
        f'<font color="{vc}" size="8"><b>{score_label}</b></font>',
        ParagraphStyle('InFV', fontSize=8, fontName='Helvetica', leading=13))
    ]], colWidths=[168 * mm])
    final_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), vb), ('BOX', (0, 0), (-1, -1), 2, vbrd),
        ('LEFTPADDING', (0, 0), (-1, -1), 14), ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12), ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(final_tbl)
    elements.append(Spacer(1, 20))

    # ── CERTIFICATE ───────────────────────────────────────────────────────
    elements.append(section_header('', 'Certificate of Internal Smoke Validation', INTERNAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Official validation summary confirming the outcome of this '
        'smoke test run on this single authenticated page — issued automatically by NexTest AI.</i></font>',
        ParagraphStyle('InCertInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))
    cert_data = {'global_score': score, 'score_label': score_label, 'score_color': score_color}
    elements.append(_build_certificate_card(cert_data, url, title="CERTIFICATE OF INTERNAL SMOKE VALIDATION"))
    build_smoke_certificate_details(elements, generation_data, tests, score, url)
    elements.append(Spacer(1, 10))

    doc.build(elements, onFirstPage=on_page_internal, onLaterPages=on_page_internal)
    return buffer.getvalue()


def generate_internal_smoke_pdf(generation_data: dict) -> bytes:
    """Public entry point — pass the same generation_data shape used by your
    other report generators. Only checks actually present in
    `execution_results` / `test_cases` are analyzed and rendered."""
    result = generation_data.get('result', {}) or {}
    tests = (
        generation_data.get('execution_results') or
        generation_data.get('test_cases') or
        result.get('execution_results') or
        result.get('test_cases') or
        []
    )
    scraped = generation_data.get('scraped', result.get('scraped', {})) or {}
    if isinstance(scraped, list):
        scraped = {}
    ai_data = generation_data.get('ai', result.get('ai', {})) or {}

    return _generate_internal_smoke_pdf(generation_data, tests, scraped, ai_data)