# ═════════════════════════════════════════════════════════════════════════════
# INTERNAL API TEST — PDF REPORT
# ═════════════════════════════════════════════════════════════════════════════
#
# HOW TO INTEGRATE
# -----------------
# This module lives in the SAME folder as pdf_generator.py and
# internal_smoke_pdf.py. It reuses the exact same helpers (section_header,
# sub_section_header, stat_card, _grade_from_score, _make_score_gauge,
# _build_certificate_card, the NAVY/GOLD/... palette, PRIORITY_COLORS, etc.)
# so it shares the exact same visual identity, layout, and section
# organization as your Internal Smoke Test Report — only the CONTENT is
# adapted to REST API testing.
#
# ENTRY POINT
# -----------
#   generate_internal_api_pdf(generation_data: dict) -> bytes
#
# Expected generation_data shape (same conventions as your other reports):
#   {
#       'url': 'https://api.example.com',                 # base API URL
#       'framework': 'Pytest' | 'Requests' | 'Playwright API',
#       'auth_method': 'JWT' | 'Bearer Token' | 'Session Token',
#       'api_version': 'v1' (optional),
#       'nextest_version': '1.0.0',
#       'execution_results' or 'test_cases': [
#           {
#               'name': str,
#               'method': 'GET'|'POST'|'PUT'|'DELETE'|'PATCH',
#               'endpoint' or 'path' or 'url': str,
#               'category': str (optional — auto-detected if absent),
#               'status': 'pass'|'fail'|'skip',
#               'http_status': int (actual status code returned),
#               'expected_status': int,
#               'duration': '123ms' | '1.2s',
#               'priority': 'high'|'medium'|'low',
#               'reason': str,
#               'ai_analysis': {'severity':..., 'root_cause':..., 'fix':...} (optional),
#           }, ...
#       ],
#       'ai': {
#           'summary': str,
#           'recommendations': [ {priority, category, issue, fix}, ... ],
#           'action_plan': [ {priority, category, action, impact, status}, ... ]
#                            OR list[str] (falls back gracefully),
#       },
#   }
#
# Only categories/checks that actually have at least one test in
# `execution_results` are rendered — nothing is assumed about API surface.

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
)

from io import BytesIO as _XL_BIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import BarChart, Reference
from openpyxl.drawing.image import Image as XLImage
import math

_XLSX_FONT = "Calibri"
_XLSX_THIN = Side(style="thin", color="E2E8F0")
_XLSX_BORDER = Border(left=_XLSX_THIN, right=_XLSX_THIN, top=_XLSX_THIN, bottom=_XLSX_THIN)


def _api_xlsx_header_row(ws, row, headers, col_start=1):
    for i, h in enumerate(headers, start=col_start):
        c = ws.cell(row=row, column=i, value=h)
        c.font = Font(name=_XLSX_FONT, bold=True, color="FFFFFF", size=10)
        c.fill = PatternFill("solid", fgColor="0A0F1E")
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = _XLSX_BORDER


def _api_xlsx_autofit(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def _api_xlsx_title(ws, title: str, color_hex: str):
    ws.insert_rows(1, 2)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=6)
    c = ws.cell(row=1, column=1, value=title)
    c.font = Font(name=_XLSX_FONT, bold=True, size=13, color=color_hex)
    c.fill = PatternFill("solid", fgColor="0A0F1E")
    for col in range(1, 7):
        ws.cell(row=1, column=col).fill = PatternFill("solid", fgColor="0A0F1E")
    ws.row_dimensions[1].height = 24


def _api_xlsx_wrapped(ws, r, text, font, chars_per_line=95, min_rows=2, fill=None, end_col=6):
    n_rows = max(min_rows, math.ceil(len(text) / chars_per_line) + 1)
    ws.merge_cells(start_row=r, start_column=1, end_row=r + n_rows - 1, end_column=end_col)
    c = ws.cell(row=r, column=1, value=text)
    c.font = font
    c.alignment = Alignment(wrap_text=True, vertical="top", horizontal="left")
    if fill:
        for row_ in range(r, r + n_rows):
            for col_ in range(1, end_col + 1):
                ws.cell(row=row_, column=col_).fill = PatternFill("solid", fgColor=fill)
    return r + n_rows


def _api_xlsx_category_chart_png(tests: list) -> _XL_BIO:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np

    cats = {c: {'pass': 0, 'fail': 0} for c in API_CATEGORY_ORDER}
    for t in tests:
        label, _ = _api_category_label(t)
        if t.get('status') == 'pass':
            cats[label]['pass'] += 1
        elif t.get('status') == 'fail':
            cats[label]['fail'] += 1

    labels = [c for c in API_CATEGORY_ORDER if cats[c]['pass'] + cats[c]['fail'] > 0] or API_CATEGORY_ORDER[:3]
    p = [cats[c]['pass'] for c in labels]
    f = [cats[c]['fail'] for c in labels]

    plt.rcParams.update({'font.family': 'DejaVu Sans', 'axes.spines.top': False, 'axes.spines.right': False})
    fig, ax = plt.subplots(figsize=(8, 3.2), facecolor='white')
    ax.set_facecolor('#f8fafc')
    x = np.arange(len(labels))
    ax.bar(x, p, width=0.55, color='#10b981', edgecolor='white', label='Passed', zorder=3)
    ax.bar(x, f, width=0.55, bottom=p, color='#ef4444', edgecolor='white', label='Failed', zorder=3)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=8.5, color='#475569', fontweight='bold', rotation=15)
    ax.set_ylabel('Requests', fontsize=8, color='#64748b')
    ax.grid(axis='y', color='#f1f5f9', linewidth=1, zorder=0)
    ax.legend(fontsize=8, frameon=False, loc='upper right')
    fig.text(0.02, 0.97, 'API Category Breakdown', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.85, bottom=0.2, left=0.08, right=0.97)
    buf = _XL_BIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return buf


def _api_xlsx_status_chart_png(tests: list) -> _XL_BIO:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    counts = {'2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0}
    for t in tests:
        cls = _status_class(t.get('http_status'))
        if cls in counts:
            counts[cls] += 1

    labels = ['2xx', '3xx', '4xx', '5xx']
    values = [counts[l] for l in labels]
    colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
    total = sum(values) or 1

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
    ax.set_xlabel('Requests', fontsize=8, color='#64748b')
    ax.set_xlim(0, max_v * 1.35)
    ax.grid(axis='x', color='#f1f5f9', linewidth=1, zorder=0)
    ax.invert_yaxis()
    fig.text(0.02, 0.95, 'HTTP Status Code Distribution', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.82, bottom=0.16, left=0.14, right=0.95)
    buf = _XL_BIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return buf


# ═════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═════════════════════════════════════════════════════════════════════════════

# Same sky-blue family as the Internal Smoke Test Report — shared visual identity
INTERNAL_API_ACCENT = HexColor('#f97316')

# HTTP method badge colors — same family used across the public API report
METHOD_COLORS = {
    'GET':    ('#10b981', '#d1fae5'),
    'POST':   ('#3b82f6', '#dbeafe'),
    'PUT':    ('#f59e0b', '#fef3c7'),
    'DELETE': ('#ef4444', '#fee2e2'),
    'PATCH':  ('#8b5cf6', '#ede9fe'),
}

# category (as it'll be shown) -> hex color
API_CATEGORY_META = {
    'Authentication':  '#6366f1',
    'CRUD Operations': '#10b981',
    'Validation':      '#f59e0b',
    'Response Codes':  '#3b82f6',
    'Performance':     '#8b5cf6',
    'Error Handling':  '#ef4444',
}
API_CATEGORY_ORDER = list(API_CATEGORY_META.keys())

# Check types/categories that count 3x toward the API Health Score, and are
# treated as "critical" for the verdict — a failure here means the API
# itself is fundamentally broken (unreachable, unauthenticated, or erroring).
API_HIGH_CATEGORIES = {'Authentication', 'Error Handling'}


# ═════════════════════════════════════════════════════════════════════════════
# HELPERS — extraction, categorization, scoring
# ═════════════════════════════════════════════════════════════════════════════

def _get_endpoint(t: dict) -> str:
    return t.get('endpoint') or t.get('path') or t.get('url') or ''


def _get_method(t: dict) -> str:
    return (t.get('method') or 'GET').upper()


def _status_class(code) -> str:
    try:
        c = int(code)
    except (TypeError, ValueError):
        return '—'
    if 200 <= c < 300:
        return '2xx'
    if 300 <= c < 400:
        return '3xx'
    if 400 <= c < 500:
        return '4xx'
    if c >= 500:
        return '5xx'
    return '—'


def _api_category_label(test: dict) -> tuple:
    """Maps a raw executed API check to one of the 6 API test categories."""
    cat  = (test.get('category') or '').lower()
    name = (test.get('name') or '').lower()
    method = _get_method(test)
    http_status = test.get('http_status')
    hay = f'{cat} {name}'

    # Explicit category from generator, if it already matches
    for label in API_CATEGORY_ORDER:
        if label.lower() in cat:
            return label, API_CATEGORY_META[label]

    if any(k in hay for k in ('auth', 'login', 'token', 'jwt', 'unauthorized', 'forbidden', 'permission', 'logout')):
        return 'Authentication', API_CATEGORY_META['Authentication']
    try:
        if http_status is not None and int(http_status) >= 500:
            return 'Error Handling', API_CATEGORY_META['Error Handling']
    except (TypeError, ValueError):
        pass
    if any(k in hay for k in ('error', 'exception', 'invalid_id', 'not_found', 'timeout', 'crash', 'fail_gracefully')):
        return 'Error Handling', API_CATEGORY_META['Error Handling']
    if any(k in hay for k in ('valid', 'required', 'missing', 'format', 'schema', 'malformed', 'constraint')):
        return 'Validation', API_CATEGORY_META['Validation']
    if any(k in hay for k in ('status code', 'http_status', 'response code', 'status_code')):
        return 'Response Codes', API_CATEGORY_META['Response Codes']
    if any(k in hay for k in ('slow', 'latency', 'response time', 'performance', 'duration', 'throughput')):
        return 'Performance', API_CATEGORY_META['Performance']
    if method in ('POST', 'PUT', 'DELETE', 'PATCH') or any(
        k in hay for k in ('create', 'update', 'delete', 'crud', 'fetch', 'list', 'retrieve')
    ):
        return 'CRUD Operations', API_CATEGORY_META['CRUD Operations']
    return 'Response Codes', API_CATEGORY_META['Response Codes']


def _compute_internal_api_score(tests: list) -> tuple:
    """Weighted score — Authentication and Error Handling checks count 3x
    since a failure there means the API itself is fundamentally broken."""
    if not tests:
        return 0, 'Critical', '#ef4444'
    total_weight = 0
    earned_weight = 0
    for t in tests:
        label, _ = _api_category_label(t)
        w = 3 if label in API_HIGH_CATEGORIES else 1
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


def _is_critical_api_fail(t: dict) -> bool:
    if t.get('status') != 'fail':
        return False
    priority = (t.get('priority') or t.get('severity') or '').lower()
    if priority in ('high', 'critical'):
        return True
    label, _ = _api_category_label(t)
    if label in API_HIGH_CATEGORIES:
        return True
    try:
        if t.get('http_status') is not None and int(t.get('http_status')) >= 500:
            return True
    except (TypeError, ValueError):
        pass
    return False


def _avg_response_ms(tests: list) -> float:
    vals = []
    for t in tests:
        d = str(t.get('duration', '0'))
        try:
            if d.endswith('ms'):
                vals.append(float(d.replace('ms', '') or 0))
            elif d.endswith('s'):
                vals.append(float(d.replace('s', '') or 0) * 1000)
        except Exception:
            pass
    return (sum(vals) / len(vals)) if vals else 0


def _total_response_ms(tests: list) -> float:
    total = 0
    for t in tests:
        d = str(t.get('duration', '0'))
        try:
            if d.endswith('ms'):
                total += float(d.replace('ms', '') or 0)
            elif d.endswith('s'):
                total += float(d.replace('s', '') or 0) * 1000
        except Exception:
            pass
    return total


def _base_api_url(generation_data: dict) -> str:
    return generation_data.get('url') or generation_data.get('base_url', '')


# ═════════════════════════════════════════════════════════════════════════════
# CHART HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def _make_api_category_chart(tests: list):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np

    cats = {c: {'pass': 0, 'fail': 0} for c in API_CATEGORY_ORDER}
    for t in tests:
        label, _ = _api_category_label(t)
        if t.get('status') == 'pass':
            cats[label]['pass'] += 1
        elif t.get('status') == 'fail':
            cats[label]['fail'] += 1

    labels = [c for c in API_CATEGORY_ORDER if cats[c]['pass'] + cats[c]['fail'] > 0]
    if not labels:
        labels = API_CATEGORY_ORDER[:3]

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
    ax.set_ylabel('Requests', fontsize=8, color='#64748b')
    ax.grid(axis='y', color='#f1f5f9', linewidth=1, zorder=0)
    ax.legend(fontsize=8, frameon=False, loc='upper right')
    fig.text(0.02, 0.97, 'API Category Breakdown', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.85, bottom=0.28, left=0.08, right=0.97)
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=170, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return RLImage(buf, width=155 * mm, height=68 * mm), cats


def _make_api_status_code_chart(tests: list):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    counts = {'2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0}
    for t in tests:
        cls = _status_class(t.get('http_status'))
        if cls in counts:
            counts[cls] += 1

    labels = ['2xx', '3xx', '4xx', '5xx']
    values = [counts[l] for l in labels]
    colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
    total = sum(values) or 1

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
    ax.set_xlabel('Requests', fontsize=8, color='#64748b')
    ax.set_xlim(0, max_v * 1.35)
    ax.grid(axis='x', color='#f1f5f9', linewidth=1, zorder=0)
    ax.invert_yaxis()
    fig.text(0.02, 0.95, 'HTTP Status Code Distribution', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.82, bottom=0.16, left=0.14, right=0.95)
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=170, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return RLImage(buf, width=155 * mm, height=58 * mm), counts


# ═════════════════════════════════════════════════════════════════════════════
# SECTION BUILDERS
# ═════════════════════════════════════════════════════════════════════════════

def _api_chapter_header(elements, number: str, title: str):
    num_display = str(number).zfill(2)
    badge = Table([[Paragraph(
        f'<font color="white" size="13"><b>{num_display}</b></font>',
        ParagraphStyle('ApChapNum', fontSize=13, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=15))
    ]], colWidths=[14 * mm], rowHeights=[14 * mm])
    badge.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INTERNAL_API_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    title_block = Table([
        [Paragraph(f'<font color="#94a3b8" size="7"><b>SECTION {num_display}</b></font>',
                   ParagraphStyle('ApChapEy', fontSize=7, fontName='Helvetica-Bold', leading=8.5))],
        [Paragraph(f'<font color="#1e293b" size="14"><b>{title}</b></font>',
                   ParagraphStyle('ApChapTitle', fontSize=14, fontName='Helvetica-Bold', leading=17))],
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
    elements.append(HRFlowable(width='100%', thickness=2, color=INTERNAL_API_ACCENT, spaceBefore=6, spaceAfter=12))


def _insight_box(text, color, width=161, label="AI Analysis"):
    tbl = Table([[Paragraph(
        f'<font color="{color}" size="7.5"><b>{label}: </b></font>'
        f'<font color="#475569" size="7.5">{text}</font>',
        ParagraphStyle('ApInsight', fontSize=7.5, fontName='Helvetica', leading=11))
    ]], colWidths=[width * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.8, HexColor(color)),
        ('LINEBEFORE', (0, 0), (0, -1), 3, HexColor(color)),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return tbl


# ── SECTION 01 — API Test Summary ────────────────────────────────────────────

def build_api_overview_hero(elements, tests, ai_data, score, score_label, score_color,
                             pass_rate, base_url):
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    critical_fail = any(_is_critical_api_fail(t) for t in tests)

    if critical_fail:
        overall_status, status_color = 'CRITICAL ISSUES', '#ef4444'
        risk_level, risk_color = 'HIGH', '#ef4444'
        deploy_text = 'NOT READY'
        status_explain = (
            'One or more critical checks failed on this API (authentication, or a 5xx server error). '
            'These block reliable use of the API — resolve before proceeding.')
    elif fail_count > 0:
        overall_status, status_color = 'PASSED W/ WARNINGS', '#f59e0b'
        risk_level, risk_color = 'MEDIUM', '#f59e0b'
        deploy_text = 'READY W/ CAUTION'
        status_explain = (
            f'Core API access is confirmed, but {fail_count} secondary check(s) failed '
            f'(e.g. a validation rule or CRUD endpoint). Review the failing checks below.')
    else:
        overall_status, status_color = 'ALL CHECKS PASSED', '#10b981'
        risk_level, risk_color = 'LOW', '#10b981'
        deploy_text = 'READY'
        status_explain = (
            f'Every request executed against {base_url} passed, including authentication checks. '
            f'This API is stable and ready for deeper functional testing.')

    elements.append(section_header('', 'API Test Summary', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>{status_explain}</i></font>',
        ParagraphStyle('ApStatusExplain', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    def _hero_stat(label, value, color):
        return Table([[Paragraph(
            f'<font color="#94a3b8" size="7"><b>{label}</b></font><br/>'
            f'<font color="{color}" size="12"><b>{value}</b></font>',
            ParagraphStyle('ApHeroStat', fontSize=10, fontName='Helvetica', leading=16, alignment=TA_CENTER))
        ]], colWidths=[40 * mm], style=[
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
            ('BOX', (0, 0), (-1, -1), 1, HexColor(color)),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ])

    row = Table([[
    _hero_stat('OVERALL STATUS', overall_status, status_color),
    _hero_stat('API HEALTH SCORE', f'{pass_rate}/100', score_color),
    _hero_stat('RISK LEVEL', risk_level, risk_color),
    _hero_stat('DEPLOYMENT', deploy_text, status_color),
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
            f'This API test run executed {total} request(s) against <b>{base_url}</b>, '
            f'with {pass_count} passed and {fail_count} failed ({pass_rate}% pass rate). '
            + ('Critical failures were detected on this API.' if critical_fail
               else 'No critical failures were detected on this API.'))
    elements.append(_insight_box(ai_summary_text, '#4f46e5', label='AI Summary'))
    elements.append(Spacer(1, 16))


def build_api_key_metrics_cards(elements, generation_data, tests):
    elements.append(section_header('', 'Key Metrics', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>'
        'Execution footprint for this API test run — timing, endpoint coverage, and where the '
        'critical checks are concentrated.</i></font>',
        ParagraphStyle('ApKMInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    total_ms = _total_response_ms(tests)
    avg_ms = _avg_response_ms(tests)
    critical_count = sum(1 for t in tests if _is_critical_api_fail(t))
    unique_endpoints = len({(_get_method(t), _get_endpoint(t)) for t in tests})

    metrics = [
        ('TOTAL EXECUTION TIME', f'{total_ms/1000:.2f}s' if total_ms else 'N/A', '#0EA5E9'),
        ('AVERAGE RESPONSE TIME', f'{avg_ms:.0f}ms' if avg_ms else 'N/A', '#10b981'),
        ('TOTAL ENDPOINTS TESTED', str(unique_endpoints), '#8b5cf6'),
        ('CRITICAL API CHECKS', str(critical_count), '#ef4444'),
        ('TOTAL REQUESTS', str(len(tests)), '#f59e0b'),
        ('AVG REQUEST DURATION', f'{avg_ms:.0f}ms' if avg_ms else 'N/A', '#ec4899'),
    ]

    def _metric_card(label, value, color):
        cell = Table([[Paragraph(
            f'<font color="{color}" size="7"><b>{label}</b></font><br/>'
            f'<font color="#1e293b" size="11"><b>{value}</b></font>',
            ParagraphStyle('ApKeyMetricC', fontSize=9, fontName='Helvetica', leading=15, alignment=TA_CENTER))
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
            row_cells.append(Paragraph('', ParagraphStyle('ApMetricEmpty')))
        card_rows.append(row_cells)
    outer = Table(card_rows, colWidths=[56 * mm] * 3)
    outer.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(outer)
    elements.append(Spacer(1, 16))


def build_api_endpoints_covered(elements, tests, base_url):
    """Replaces the 'Page Screenshots' section from the Smoke report — since
    there is nothing visual to capture for an API, we show the list of unique
    endpoints that were actually exercised during this run."""
    elements.append(section_header('', 'API Endpoints Covered', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>'
        f'Unique endpoints exercised against <b>{base_url}</b> during this run — '
        f'one row per distinct method + path combination.</i></font>',
        ParagraphStyle('ApEpInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    seen = {}
    for t in tests:
        key = (_get_method(t), _get_endpoint(t))
        if key not in seen:
            seen[key] = {'pass': 0, 'fail': 0, 'skip': 0}
        seen[key][t.get('status', 'skip') if t.get('status') in ('pass', 'fail') else 'skip'] += 1

    if not seen:
        elements.append(Paragraph('<font color="#94a3b8" size="8">No endpoints recorded for this run.</font>',
                                   ParagraphStyle('ApEpNone', fontSize=8, fontName='Helvetica')))
        elements.append(Spacer(1, 16))
        return

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('ApEH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Method</b></font>', ParagraphStyle('ApEH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Endpoint</b></font>', ParagraphStyle('ApEH2', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Checks</b></font>', ParagraphStyle('ApEH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('ApEH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []
    for i, ((method, path), counts) in enumerate(sorted(seen.items(), key=lambda x: x[0][1])):
        mc, _ = METHOD_COLORS.get(method, ('#64748b', '#f8fafc'))
        total_n = counts['pass'] + counts['fail'] + counts['skip']
        verdict = 'PASS' if counts['fail'] == 0 else 'FAIL'
        vc = '#10b981' if counts['fail'] == 0 else '#ef4444'
        row_bg = HexColor('#f0fdf4') if counts['fail'] == 0 else HexColor('#fef2f2')
        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('ApEID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{mc}"><b>{method}</b></font>', ParagraphStyle('ApEM', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#4f46e5" size="7.5">{path[:70]}</font>', ParagraphStyle('ApEP', fontSize=7.5, fontName='Courier', leading=10)),
            Paragraph(f'<font color="#1e293b">{total_n}</font>', ParagraphStyle('ApEC', fontSize=8, fontName='Helvetica', alignment=TA_CENTER)),
            Paragraph(f'<font color="{vc}"><b>{verdict}</b></font>', ParagraphStyle('ApEV', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
        ri = len(rows) - 1
        row_styles.append(('BACKGROUND', (0, ri), (-1, ri), row_bg))

    tbl = Table(rows, colWidths=[8 * mm, 20 * mm, 90 * mm, 20 * mm, 22 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_API_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


def build_api_score_hero(elements, score, score_label, score_color):
    elements.append(section_header('', 'API Health Score', HexColor(score_color)))
    elements.append(Spacer(1, 10))
    try:
        gauge_img = _make_score_gauge(score, score_color)
    except Exception:
        gauge_img = None

    right_col = [
        Paragraph(f'<font color="{score_color}" size="15"><b>{score_label}</b></font>',
                  ParagraphStyle('ApHeroLabel', fontSize=15, fontName='Helvetica-Bold', leading=18)),
        Spacer(1, 6),
        Paragraph(
            '<font color="#475569" size="8.5">The API Health Score weighs critical checks (authentication, '
            'server errors) three times as heavily as secondary checks (validation, CRUD, minor response '
            'code mismatches). Excellent ≥ 90 · Good ≥ 75 · Acceptable ≥ 50 · Critical below.</font>',
            ParagraphStyle('ApHeroDesc', fontSize=8.5, fontName='Helvetica', leading=13)),
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


# ── SECTION 02 — API Coverage ────────────────────────────────────────────────

def build_api_methodology(elements, tests, generation_data):
    base_url = _base_api_url(generation_data)
    auth_method = generation_data.get('auth_method', 'authenticated token')

    elements.append(section_header('', 'API Test Methodology', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f'This report validates the reliability of the REST API at <b>{base_url}</b>, accessed via '
        f'{auth_method}, before deeper functional or regression testing proceeds. NexTest validates: '
        f'HTTP status codes, authentication, authorization, response body content, response time, '
        f'JSON schema conformance, error handling, and CRUD operations. Only the endpoints actually '
        f'exercised in this run are analyzed. Checks are executed automatically using the configured '
        f'framework, verifying real HTTP responses against expected outcomes.',
        ParagraphStyle('ApMethoTxt', fontSize=8.5, fontName='Helvetica', leading=13,
                       textColor=HexColor('#475569'))))
    elements.append(Spacer(1, 16))
    build_api_scenarios_table(elements, tests, base_url)


def build_api_scenarios_table(elements, tests, base_url):
    elements.append(section_header('', 'API Test Scenarios', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>'
        f'Planned checks for <b>{base_url}</b> — {len(tests)} scenario(s), scoped to the endpoints '
        f'actually exercised in this run.</i></font>',
        ParagraphStyle('ApScInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('ApSH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Scenario</b></font>', ParagraphStyle('ApSH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Method</b></font>', ParagraphStyle('ApSH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('ApSH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('ApSH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Expected</b></font>', ParagraphStyle('ApSH5', fontSize=8, fontName='Helvetica-Bold')),
    ]
    rows = [hdr]
    row_styles = []
    for i, t in enumerate(tests):
        cat_label, cat_color = _api_category_label(t)
        priority = (t.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b')
        method = _get_method(t)
        mc, _ = METHOD_COLORS.get(method, ('#64748b', '#f8fafc'))
        expected = t.get('reason') or t.get('expected') or t.get('description') \
            or f'Returns HTTP {t.get("expected_status", 200)}'
        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('ApSID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<b><font color="#1e293b" size="8">{t.get("name","")}</font></b>', ParagraphStyle('ApSN', fontSize=8, fontName='Helvetica', leading=11)),
            Paragraph(f'<font color="{mc}"><b>{method}</b></font>', ParagraphStyle('ApSM', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{cat_color}"><b>{cat_label.upper()}</b></font>', ParagraphStyle('ApSC', fontSize=6.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('ApSP', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7">{str(expected)[:65]}</font>', ParagraphStyle('ApSE', fontSize=7, fontName='Helvetica', leading=10)),
        ])
        if i % 2 == 1:
            row_styles.append(('BACKGROUND', (0, i + 1), (-1, i + 1), LIGHT_BG))

    tbl = Table(rows, colWidths=[8 * mm, 44 * mm, 16 * mm, 26 * mm, 18 * mm, 56 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_API_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (4, -1), 'CENTER'),
        ('LINEBEFORE', (2, 1), (2, -1), 1, BORDER), ('LINEBEFORE', (5, 1), (5, -1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


def build_api_category_summary(elements, tests):
    elements.append(section_header('', 'Results by Category', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 8))

    cats = {c: {'pass': 0, 'fail': 0, 'total': 0} for c in API_CATEGORY_ORDER}
    for t in tests:
        label, _ = _api_category_label(t)
        cats[label]['total'] += 1
        if t.get('status') == 'pass':
            cats[label]['pass'] += 1
        elif t.get('status') == 'fail':
            cats[label]['fail'] += 1

    hdr = [
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('ApCH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Total</b></font>', ParagraphStyle('ApCH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Passed</b></font>', ParagraphStyle('ApCH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Failed</b></font>', ParagraphStyle('ApCH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Pass Rate</b></font>', ParagraphStyle('ApCH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Verdict</b></font>', ParagraphStyle('ApCH6', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []
    any_row = False
    for cat in API_CATEGORY_ORDER:
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
            Paragraph(f'<font color="#1e293b"><b>{cat}</b></font>', ParagraphStyle('ApCC', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph(f'<font color="#1e293b"><b>{d["total"]}</b></font>', ParagraphStyle('ApCT', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#10b981"><b>{d["pass"]}</b></font>', ParagraphStyle('ApCP', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#ef4444"><b>{d["fail"]}</b></font>', ParagraphStyle('ApCF', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{rate_color}"><b>{rate}%</b></font>', ParagraphStyle('ApCR', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{vc}"><b>{verdict}</b></font>', ParagraphStyle('ApCV', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
        ri = len(rows) - 1
        row_styles.append(('BACKGROUND', (0, ri), (-1, ri), row_bg))

    if not any_row:
        elements.append(Paragraph('<font color="#94a3b8" size="8">No categorized checks available for this run.</font>',
                                   ParagraphStyle('ApCatNone', fontSize=8, fontName='Helvetica')))
        elements.append(Spacer(1, 16))
        return

    tbl = Table(rows, colWidths=[36 * mm, 22 * mm, 22 * mm, 22 * mm, 26 * mm, 40 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_API_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (1, 0), (5, -1), 'CENTER'),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


def build_api_coverage_charts(elements, tests):
    _api_chapter_header(elements, '2', 'API Coverage')

    try:
        chart_img, cats_data = _make_api_category_chart(tests)
        cat_desc = ('This chart compares passed and failed requests across each API category, helping '
                    'you quickly spot which area needs attention.')
        worst_cat = max(cats_data, key=lambda c: cats_data[c]['fail']) if cats_data else None
        if worst_cat and cats_data[worst_cat]['fail'] > 0:
            cat_insight = (f'{worst_cat} currently has the most failures ({cats_data[worst_cat]["fail"]}) — '
                            f'this is the area to prioritize first on this API.')
        else:
            cat_insight = 'No category shows any failures — coverage on this API is currently clean.'
        framed = Table([[chart_img]], colWidths=[161 * mm])
        framed.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, INTERNAL_API_ACCENT), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(section_header('', 'API Category Breakdown', INTERNAL_API_ACCENT))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f'<font color="#64748b" size="7.5"><i>{cat_desc}</i></font>',
                                   ParagraphStyle('ApCatDesc', fontSize=7.5, fontName='Helvetica', leading=10)))
        elements.append(Spacer(1, 8))
        elements.append(framed)
        elements.append(Spacer(1, 6))
        elements.append(_insight_box(cat_insight, '#0EA5E9'))
        elements.append(Spacer(1, 16))
    except Exception:
        pass

    try:
        dist_img, counts = _make_api_status_code_chart(tests)
        total_c = sum(counts.values()) or 1
        worst_class = max(('4xx', '5xx'), key=lambda k: counts.get(k, 0))
        if counts.get('5xx', 0) > 0:
            dist_insight = (f'{counts["5xx"]} request(s) returned a 5xx server error — these indicate '
                             f'backend failures and should be prioritized immediately.')
        elif counts.get('4xx', 0) > 0:
            dist_insight = (f'{counts["4xx"]} request(s) returned a 4xx client error out of {total_c} total — '
                             f'review authentication, validation, or resource IDs used in these requests.')
        else:
            dist_insight = (f'All {total_c} request(s) returned 2xx/3xx status codes — no client or server '
                             f'errors were detected on this API.')
        framed_dist = Table([[dist_img]], colWidths=[161 * mm])
        framed_dist.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, INTERNAL_API_ACCENT), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(section_header('', 'HTTP Status Code Distribution', INTERNAL_API_ACCENT))
        elements.append(Spacer(1, 8))
        elements.append(framed_dist)
        elements.append(Spacer(1, 6))
        elements.append(_insight_box(dist_insight, '#0EA5E9'))
        elements.append(Spacer(1, 16))
    except Exception:
        pass


# ── SECTION 03 — Test Details ────────────────────────────────────────────────

def build_api_environment_info(elements, generation_data, tests):
    total_ms = _total_response_ms(tests)
    exec_time_disp = f'{total_ms/1000:.2f}s' if total_ms else 'N/A'
    base_url = _base_api_url(generation_data)

    items = [
        ('FRAMEWORK', generation_data.get('framework', 'Pytest'), '#0EA5E9'),
        ('AUTHENTICATION METHOD', generation_data.get('auth_method', 'JWT'), '#6366f1'),
        ('BASE URL', base_url, '#f59e0b'),
        ('API VERSION', generation_data.get('api_version', 'N/A'), '#8b5cf6'),
        ('TOTAL REQUESTS', str(len(tests)), '#10b981'),
        ('EXECUTION TIME', exec_time_disp, '#ec4899'),
    ]

    def _env_card(label, value, color):
        cell = Table([[Paragraph(
            f'<font color="{color}" size="7"><b>{label}</b></font><br/>'
            f'<font color="#1e293b" size="10.5"><b>{value}</b></font>',
            ParagraphStyle('ApEnvC', fontSize=9, fontName='Helvetica', leading=15, alignment=TA_CENTER))
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
            row_cells.append(Paragraph('', ParagraphStyle('ApEnvEmpty')))
        card_rows.append(row_cells)
    outer = Table(card_rows, colWidths=[56 * mm] * 3)
    outer.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(KeepTogether([
        section_header('', 'Execution Environment', INTERNAL_API_ACCENT), Spacer(1, 6),
        Paragraph('<font color="#64748b" size="7.5"><i>Framework and authentication method used to run '
                  'this API audit — for reproducibility of the results below.</i></font>',
                  ParagraphStyle('ApEnvInfo', fontSize=7.5, fontName='Helvetica', leading=10)),
        Spacer(1, 6), outer,
    ]))
    elements.append(Spacer(1, 16))


def build_api_detailed_results(elements, tests):
    elements.append(section_header('', 'Detailed API Test Results', TEAL))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Real results from API execution. Every value comes '
        'directly from the test runner.</i></font>',
        ParagraphStyle('ApDRInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('ApDH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Endpoint</b></font>', ParagraphStyle('ApDH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Method</b></font>', ParagraphStyle('ApDH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('ApDH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('ApDH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>HTTP</b></font>', ParagraphStyle('ApDH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Time</b></font>', ParagraphStyle('ApDH6', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Result</b></font>', ParagraphStyle('ApDH7', fontSize=8, fontName='Helvetica-Bold')),
    ]
    rows = [hdr]
    row_styles = []
    for i, t in enumerate(tests):
        status = t.get('status', 'skip')
        sc = '#10b981' if status == 'pass' else '#ef4444' if status == 'fail' else '#f59e0b'
        s_label = '✓ PASS' if status == 'pass' else '✗ FAIL' if status == 'fail' else '■ SKIP'
        s_bg = HexColor('#f0fdf4') if status == 'pass' else HexColor('#fef2f2') if status == 'fail' else HexColor('#fffbeb')
        cat_label, cat_color = _api_category_label(t)
        method = _get_method(t)
        mc, _ = METHOD_COLORS.get(method, ('#64748b', '#f8fafc'))
        endpoint = _get_endpoint(t)
        endpoint_short = endpoint[:38] + '…' if len(endpoint) > 38 else endpoint
        http_status = t.get('http_status', '—')
        expected_status = t.get('expected_status')
        http_disp = f'{http_status}' + (f' / {expected_status}' if expected_status and http_status != expected_status else '')
        reason = t.get('reason') or t.get('reason_pass') or t.get('error') or '—'
        duration = t.get('duration', '—')

        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('ApDID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(
                f'<b><font color="#1e293b" size="7.5">{t.get("name","")[:32]}</font></b><br/>'
                f'<font color="#4f46e5" size="6.5">{endpoint_short}</font>',
                ParagraphStyle('ApDN', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="{mc}"><b>{method}</b></font>', ParagraphStyle('ApDM', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{cat_color}"><b>{cat_label.upper()}</b></font>', ParagraphStyle('ApDC', fontSize=6, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{sc}"><b>{s_label}</b></font>', ParagraphStyle('ApDS', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#1e293b" size="7">{http_disp}</font>', ParagraphStyle('ApDHT', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)),
            Paragraph(f'<font color="#64748b" size="7">{duration}</font>', ParagraphStyle('ApDD', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="6.5">{str(reason)[:60]}</font>', ParagraphStyle('ApDR', fontSize=6.5, fontName='Helvetica', leading=9)),
        ])
        row_styles.append(('BACKGROUND', (4, i + 1), (4, i + 1), s_bg))

    tbl = Table(rows, colWidths=[7*mm, 44*mm, 14*mm, 18*mm, 14*mm, 16*mm, 14*mm, 41*mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 6), ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER),
        ('BOX', (0, 0), (-1, -1), 0.8, TEAL), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'), ('ALIGN', (2, 0), (6, -1), 'CENTER'),
        ('LINEBEFORE', (7, 1), (7, -1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ── SECTION 04 — AI Insights & Recommendations ───────────────────────────────

def build_api_ai_recommendations_table(elements, ai_data):
    recs = (ai_data or {}).get('recommendations', []) or []
    elements.append(section_header('', 'AI Recommendations', HexColor('#4f46e5')))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Recommendations generated only for issues detected on '
        'this API.</i></font>',
        ParagraphStyle('ApRSInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    if recs:
        hdr = [
            Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('ApRH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('ApRH2', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Issue</b></font>', ParagraphStyle('ApRH3', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Recommendation</b></font>', ParagraphStyle('ApRH4', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Severity</b></font>', ParagraphStyle('ApRH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ]
        rows = [hdr]
        row_styles = []
        for i, rec in enumerate(recs):
            priority = (rec.get('priority') or 'medium').lower()
            pc = PRIORITY_COLORS.get(priority, '#f59e0b')
            severity = (rec.get('severity') or priority).upper()
            rows.append([
                Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('ApRP', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
                Paragraph(f'<font color="#4f46e5" size="7.5"><b>{(rec.get("category","") or "").upper()}</b></font>', ParagraphStyle('ApRC', fontSize=7.5, fontName='Helvetica-Bold')),
                Paragraph(f'<font color="#1e293b" size="7.5">{rec.get("issue","")[:60]}</font>', ParagraphStyle('ApRI', fontSize=7.5, fontName='Helvetica', leading=10)),
                Paragraph(f'<font color="#475569" size="7.5">{rec.get("fix", rec.get("recommendation",""))[:70]}</font>', ParagraphStyle('ApRF', fontSize=7.5, fontName='Helvetica', leading=10)),
                Paragraph(f'<font color="{pc}"><b>{severity}</b></font>', ParagraphStyle('ApRSev', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
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
        elements.append(Paragraph('<font color="#94a3b8" size="8">No issues detected on this API — no '
                                   'recommendations needed for this run.</font>',
                                   ParagraphStyle('ApNoRec', fontSize=8, fontName='Helvetica')))
    elements.append(Spacer(1, 16))


def build_api_ai_focus_sections(elements, tests, ai_data, base_url):
    """Only renders sub-sections relevant to what was actually tested on this API."""
    elements.append(section_header('', 'Focused AI Analysis', HexColor('#4f46e5')))
    elements.append(Spacer(1, 8))

    def _related(cat_name):
        return [t for t in tests if _api_category_label(t)[0] == cat_name]

    def _narrative(title, cat_name, color):
        related = _related(cat_name)
        total_n = len(related)
        if total_n == 0:
            return
        fail_n = sum(1 for t in related if t.get('status') == 'fail')
        if fail_n == 0:
            text = f'All {total_n} check(s) passed for {title.split(" Analysis")[0].lower()} on this API — fully operational, no issues detected.'
        else:
            failing = [t.get('name', '') for t in related if t.get('status') == 'fail'][:3]
            text = f'{fail_n} of {total_n} check(s) failed: {", ".join(failing)}. Investigate before further testing.'
        elements.append(sub_section_header(title, color))
        elements.append(Spacer(1, 4))
        elements.append(_insight_box(text, color, label='Summary'))
        elements.append(Spacer(1, 10))

    # API Reliability — always shown, based on all critical checks
    critical = [t for t in tests if _api_category_label(t)[0] in API_HIGH_CATEGORIES]
    if critical:
        fail_n = sum(1 for t in critical if t.get('status') == 'fail')
        text = (f'All {len(critical)} critical check(s) passed on {base_url} — the API responds reliably '
                f'and authentication holds.' if fail_n == 0 else
                f'{fail_n} of {len(critical)} critical check(s) failed on {base_url} — this affects the '
                f'core reliability of the API and should be prioritized.')
        elements.append(sub_section_header('API Reliability', '#0EA5E9'))
        elements.append(Spacer(1, 4))
        elements.append(_insight_box(text, '#0EA5E9', label='Summary'))
        elements.append(Spacer(1, 10))

    _narrative('Authentication Analysis', 'Authentication', '#6366f1')
    _narrative('Validation Analysis', 'Validation', '#f59e0b')
    _narrative('CRUD Analysis', 'CRUD Operations', '#10b981')
    _narrative('Error Handling Analysis', 'Error Handling', '#ef4444')
    _narrative('Performance Analysis', 'Performance', '#8b5cf6')

    # Deployment Readiness — always shown
    critical_fail = any(_is_critical_api_fail(t) for t in tests)
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    if critical_fail:
        depl_text = 'This API is NOT ready for further testing — critical checks (auth, server errors) failed.'
        depl_color = '#ef4444'
    elif fail_count > 0:
        depl_text = f'This API is ready with caution — {fail_count} secondary check(s) failed. Review before proceeding.'
        depl_color = '#f59e0b'
    else:
        depl_text = 'This API is ready — all checks passed, stable for the next testing phase.'
        depl_color = '#10b981'
    elements.append(sub_section_header('Deployment Readiness', depl_color))
    elements.append(Spacer(1, 4))
    elements.append(_insight_box(depl_text, depl_color, label='Summary'))
    elements.append(Spacer(1, 16))


def build_api_action_plan(elements, ai_data):
    action_plan = (ai_data or {}).get('action_plan', []) or []
    if not action_plan:
        return
    elements.append(section_header('', 'AI Action Plan', GOLD))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('ApAH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('ApAH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Action</b></font>', ParagraphStyle('ApAH3', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Expected Impact</b></font>', ParagraphStyle('ApAH4', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('ApAH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    for i, item in enumerate(action_plan):
        if isinstance(item, str):
            item = {'priority': 'medium', 'category': 'General', 'action': item,
                     'impact': '—', 'status': 'To Do'}
        priority = (item.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b')
        category_disp = item.get('category', '') or 'General'
        impact_val = item.get('impact') or item.get('expected_impact') or ''
        if not impact_val:
            impact_val = f'Resolves this {category_disp.lower()} issue and improves overall API reliability'
        rows.append([
            Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('ApAP', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#4f46e5" size="7.5"><b>{(category_disp or "").upper()}</b></font>', ParagraphStyle('ApAC', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#1e293b" size="7.5">{item.get("action","")}</font>', ParagraphStyle('ApAA', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#475569" size="7.5">{impact_val}</font>', ParagraphStyle('ApAI', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#64748b" size="7">⏳ {item.get("status","To Do")}</font>', ParagraphStyle('ApASt', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)),
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


# ── SECTION 05 helper — Certificate details block ────────────────────────────

def build_api_certificate_details(elements, generation_data, tests, score, base_url):
    grade, _ = _grade_from_score(score)
    total_ms = _total_response_ms(tests)
    avg_ms = _avg_response_ms(tests)
    exec_time_disp = f'{total_ms/1000:.2f}s' if total_ms else 'N/A'

    details = [
        ('Validation Date',      datetime.now().strftime('%Y-%m-%d  %H:%M'), '#0EA5E9', HexColor('#f0f9ff')),
        ('Framework',            generation_data.get('framework', 'Pytest'), '#0EA5E9', HexColor('#f0f9ff')),
        ('Authentication',       generation_data.get('auth_method', 'JWT'), '#6366f1', HexColor('#eef2ff')),
        ('Base API URL',         base_url, '#6366f1', HexColor('#eef2ff')),
        ('Execution Time',       exec_time_disp, '#8b5cf6', HexColor('#f5f3ff')),
        ('Avg Response Time',    f'{avg_ms:.0f}ms' if avg_ms else 'N/A', '#8b5cf6', HexColor('#f5f3ff')),
        ('Overall Grade',        grade, '#10b981', HexColor('#f0fdf4')),
        ('AI Validation Status', 'Verified by NexTest AI', '#10b981', HexColor('#f0fdf4')),
    ]

    rows = []
    row_styles = []
    for i in range(0, len(details), 2):
        chunk = details[i:i + 2]
        row = [Paragraph(
            f'<font color="{color}" size="7.5"><b>{lbl}</b></font><br/>'
            f'<font color="#1e293b" size="9">{val}</font>',
            ParagraphStyle('ApCertDet', fontSize=8, fontName='Helvetica', leading=12))
            for lbl, val, color, bg in chunk]
        if len(row) < 2:
            row.append(Paragraph('', ParagraphStyle('ApCertDetEmpty')))
        rows.append(row)
        ri = len(rows) - 1
        left_color = chunk[0][2]
        row_bg = chunk[0][3]
        row_styles.append(('BACKGROUND', (0, ri), (-1, ri), row_bg))
        row_styles.append(('LINEBEFORE', (0, ri), (0, ri), 3, HexColor(left_color)))
        if len(chunk) > 1:
            row_styles.append(('LINEBEFORE', (1, ri), (1, ri), 1, BORDER_DARK))

    det_tbl = Table(rows, colWidths=[84 * mm, 84 * mm])
    det_tbl.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_DARK), ('LINEBELOW', (0, 0), (-1, -2), 0.3, BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ] + row_styles))
    elements.append(KeepTogether([
        Spacer(1, 8),
        Paragraph('<font color="#64748b" size="7.5"><i>Technical details of this validation run — '
                  'environment, timing, and scoring — provided for traceability and audit purposes.'
                  '</i></font>', ParagraphStyle('ApCertDetInfo', fontSize=7.5, fontName='Helvetica', leading=10)),
        Spacer(1, 6),
        det_tbl,
    ]))
    elements.append(Spacer(1, 10))


# ═════════════════════════════════════════════════════════════════════════════
# MAIN PDF GENERATOR
# ═════════════════════════════════════════════════════════════════════════════

def _generate_internal_api_pdf(generation_data: dict, tests: list, ai_data: dict) -> bytes:
    buffer = BytesIO()
    base_url = _base_api_url(generation_data)
    framework = generation_data.get('framework', 'Pytest')
    auth_method = generation_data.get('auth_method', 'JWT')

    pass_count = sum(1 for t in tests if t.get('status') == 'pass')
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    skip_count = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))
    total = len(tests) or 1
    pass_rate = round(pass_count / total * 100)
    rate_color = '#10b981' if pass_rate >= 80 else '#f59e0b' if pass_rate >= 50 else '#ef4444'

    score, score_label, score_color = _compute_internal_api_score(tests)
    
    if pass_rate >= 90:
        pr_label, pr_color = 'Excellent', '#10b981'
    elif pass_rate >= 75:
        pr_label, pr_color = 'Good', '#22c55e'
    elif pass_rate >= 50:
        pr_label, pr_color = 'Acceptable', '#f59e0b'
    else:
        pr_label, pr_color = 'Critical', '#ef4444'

    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20 * mm, leftMargin=22 * mm,
                             topMargin=57 * mm, bottomMargin=20 * mm)

    def on_page_internal_api(canvas, doc):
        W, H = A4
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, H - 52 * mm, W, 52 * mm, fill=1, stroke=0)
        canvas.setFillColor(INTERNAL_API_ACCENT)
        canvas.rect(0, H - 54 * mm, W, 2 * mm, fill=1, stroke=0)
        canvas.setFillColor(INTERNAL_API_ACCENT)
        canvas.rect(0, 0, 3, H - 54 * mm, fill=1, stroke=0)
        canvas.setFillColor(LIGHT_BG)
        canvas.rect(0, 0, W, 14 * mm, fill=1, stroke=0)
        canvas.setFillColor(BORDER)
        canvas.rect(0, 14 * mm, W, 0.5, fill=1, stroke=0)
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 5 * mm, 'Generated by NexTest — Internal API Test Report')
        canvas.drawRightString(W - 20 * mm, 5 * mm, f'Page {doc.page}  •  {datetime.now().strftime("%Y-%m-%d")}')
        canvas.restoreState()

    elements = []

    # ── COVER ─────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph('<font color="#f97316"><b>NEX</b></font><font color="#ffffff">TEST</font>',
                  ParagraphStyle('ApLogo', fontSize=24, fontName='Helvetica-Bold')),
        Paragraph(f'<font color="#64748b">Generated</font><br/>'
                  f'<font color="#94a3b8">{datetime.now().strftime("%B %d, %Y  •  %H:%M")}</font>',
                  ParagraphStyle('ApDate', fontSize=8.5, fontName='Helvetica', alignment=TA_RIGHT, leading=13)),
    ]]
    header_tbl = Table(header_data, colWidths=[90 * mm, 78 * mm])
    header_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(Spacer(1, -38 * mm))
    elements.append(header_tbl)
    elements.append(Spacer(1, 6 * mm))
    elements.append(Paragraph('Internal API Test Report',
                               ParagraphStyle('ApTitle', fontSize=22, textColor=WHITE,
                                              fontName='Helvetica-Bold', spaceAfter=2)))
    elements.append(Spacer(1, 14 * mm))

    info_tbl = Table([
        [Paragraph('<font color="#64748b">Base API URL</font>', ParagraphStyle('ApIL1', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{base_url}</font>', ParagraphStyle('ApIV1', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Framework</font>', ParagraphStyle('ApIL2', fontSize=8, fontName='Helvetica-Bold', leading=12)),
        Paragraph(f'<font color="#f97316"><b>{framework}</b></font>', ParagraphStyle('ApIV2', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Authentication Method</font>', ParagraphStyle('ApIL3', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{auth_method}</font>', ParagraphStyle('ApIV3', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Test Type</font>', ParagraphStyle('ApIL4', fontSize=8, fontName='Helvetica-Bold', leading=12)),
        Paragraph('<font color="#f97316"><b>Internal API Test</b></font>', ParagraphStyle('ApIV4', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">API Version</font>', ParagraphStyle('ApIL5', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{generation_data.get("api_version", "N/A")}</font>', ParagraphStyle('ApIV5', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Generated</font>', ParagraphStyle('ApIL6', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{datetime.now().strftime("%Y-%m-%d  %H:%M")}</font>', ParagraphStyle('ApIV6', fontSize=8.5, fontName='Helvetica', leading=12))],
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
    elements.append(section_header('', 'Test Summary', INTERNAL_API_ACCENT))
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
        '<font color="#94a3b8" size="7"><i>Pass Rate is the raw proportion of requests that succeeded '
        'on this API. The API Health Score further below is severity-weighted — authentication and '
        'server-error checks count more.</i></font>',
        ParagraphStyle('ApRateNote', fontSize=7, fontName='Helvetica', leading=9)))
    elements.append(Spacer(1, 20))

    _api_chapter_header(elements, '1', 'API Test Summary')
    build_api_overview_hero(elements, tests, ai_data, score, score_label, score_color, pass_rate, base_url)
    build_api_key_metrics_cards(elements, generation_data, tests)
    build_api_endpoints_covered(elements, tests, base_url)
    build_api_score_hero(elements, pass_rate, pr_label, pr_color)
    build_api_methodology(elements, tests, generation_data)
    build_api_category_summary(elements, tests)

    build_api_coverage_charts(elements, tests)

    _api_chapter_header(elements, '3', 'Test Details')
    build_api_environment_info(elements, generation_data, tests)
    build_api_detailed_results(elements, tests)

    _api_chapter_header(elements, '4', 'AI Insights & Recommendations')
    build_api_ai_recommendations_table(elements, ai_data)
    build_api_ai_focus_sections(elements, tests, ai_data, base_url)
    build_api_action_plan(elements, ai_data)

    _api_chapter_header(elements, '5', 'Report Conclusion')
    elements.append(section_header('', 'Final AI Verdict', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 6))

    critical_fail = any(_is_critical_api_fail(t) for t in tests)
    if critical_fail:
        vc, vb, vbrd, risk_level = '#ef4444', HexColor('#fef2f2'), RED, 'HIGH'
        vt = (f'Internal API Test FAILED — critical checks did not pass on {base_url}. Authentication or '
              f'server-error issues were detected on this API. This API is NOT ready for further testing '
              f'until resolved.')
    elif fail_count > 0:
        vc, vb, vbrd, risk_level = '#b45309', HexColor('#fffbeb'), ORANGE, 'MEDIUM'
        vt = (f'Internal API Test passed with {fail_count} non-critical issue(s) on {base_url}. '
              f'The API is accessible and stable, but the failing checks should be reviewed before '
              f'proceeding to deeper testing.')
    else:
        vc, vb, vbrd, risk_level = '#059669', HexColor('#f0fdf4'), GREEN, 'LOW'
        vt = (f'Internal API Test PASSED — all {pass_count} check(s) succeeded on {base_url}. '
              f'This API is stable and ready for deeper functional and regression testing.')

    final_tbl = Table([[Paragraph(
    f'<font color="{vc}" size="9"><b>Final API Verdict</b></font><br/>'
    f'<font color="{vc}" size="8">{vt}</font><br/><br/>'
    f'<font color="#64748b" size="8"><b>API Health Score: </b></font>'
    f'<font color="{vc}" size="8"><b>{pass_rate}/100</b></font>'
    f'<font color="#94a3b8" size="8">    |    </font>'
    f'<font color="#64748b" size="8"><b>Risk Level: </b></font>'
    f'<font color="{vc}" size="8"><b>{risk_level}</b></font>'
    f'<font color="#94a3b8" size="8">    |    </font>'
    f'<font color="#64748b" size="8"><b>Deployment Readiness: </b></font>'
    f'<font color="{vc}" size="8"><b>{pr_label}</b></font>',
    ParagraphStyle('ApFV', fontSize=8, fontName='Helvetica', leading=13))
]], colWidths=[168 * mm])
    final_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), vb), ('BOX', (0, 0), (-1, -1), 2, vbrd),
        ('LEFTPADDING', (0, 0), (-1, -1), 14), ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12), ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(final_tbl)
    elements.append(Spacer(1, 20))

    # ── CERTIFICATE ───────────────────────────────────────────────────────
    elements.append(section_header('', 'Certificate of Internal API Validation', INTERNAL_API_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Official validation summary confirming the outcome of this '
        'API test run — issued automatically by NexTest AI.</i></font>',
        ParagraphStyle('ApCertInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))
    cert_data = {'global_score': pass_rate, 'score_label': pr_label, 'score_color': pr_color}
    elements.append(_build_certificate_card(cert_data, base_url, title="CERTIFICATE OF INTERNAL API VALIDATION"))
    build_api_certificate_details(elements, generation_data, tests, pass_rate, base_url)
    elements.append(Spacer(1, 10))

    doc.build(elements, onFirstPage=on_page_internal_api, onLaterPages=on_page_internal_api)
    return buffer.getvalue()


def _extract_internal_api_inputs(generation_data: dict):
    """Shared extraction logic — same conventions as internal_smoke_pdf.py."""
    result = generation_data.get('result', {}) or {}
    tests = (
        generation_data.get('execution_results') or
        generation_data.get('test_cases') or
        result.get('execution_results') or
        result.get('test_cases') or
        []
    )
    ai_data = generation_data.get('ai', result.get('ai', {})) or {}
    return tests, ai_data


def generate_internal_api_pdf(generation_data: dict) -> bytes:
    """Public entry point — pass the same generation_data shape used by your
    other report generators. Only checks actually present in
    `execution_results` / `test_cases` are analyzed and rendered."""
    tests, ai_data = _extract_internal_api_inputs(generation_data)
    return _generate_internal_api_pdf(generation_data, tests, ai_data)


def generate_internal_api_xlsx(generation_data: dict) -> bytes:
    """XLSX version of the Internal API Test Report — same sections/data as
    the PDF and HTML reports, structured as a multi-sheet workbook."""
    tests, ai_data = _extract_internal_api_inputs(generation_data)
    base_url  = _base_api_url(generation_data)
    framework = generation_data.get('framework', 'Pytest')
    auth_method = generation_data.get('auth_method', 'JWT')

    pass_count = sum(1 for t in tests if t.get('status') == 'pass')
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    skip_count = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))
    total = len(tests) or 1
    pass_rate = round(pass_count / total * 100)
    rate_color = "10B981" if pass_rate >= 80 else "F59E0B" if pass_rate >= 50 else "EF4444"

    if pass_rate >= 90:
        pr_label, pr_color = 'Excellent', '10B981'
    elif pass_rate >= 75:
        pr_label, pr_color = 'Good', '22C55E'
    elif pass_rate >= 50:
        pr_label, pr_color = 'Acceptable', 'F59E0B'
    else:
        pr_label, pr_color = 'Critical', 'EF4444'

    grade, _ = _grade_from_score(pass_rate)
    critical_fail = any(_is_critical_api_fail(t) for t in tests)

    wb = Workbook()

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 1 — Overview
    # ═══════════════════════════════════════════════════════════════════
    ws = wb.active
    ws.title = "Overview"
    ws.sheet_view.showGridLines = False

    ws.merge_cells("A1:H3")
    for r_ in range(1, 4):
        for c_ in range(1, 9):
            ws.cell(row=r_, column=c_).fill = PatternFill("solid", fgColor="0A0F1E")
    ws["A1"] = "NEXTEST — Internal API Test Report"
    ws["A1"].font = Font(name=_XLSX_FONT, bold=True, size=20, color="F97316")
    ws["A1"].alignment = Alignment(horizontal="left", vertical="center", indent=1)

    ws.merge_cells("A4:H4")
    ws["A4"] = f"Generated {datetime.now().strftime('%B %d, %Y  •  %H:%M')}"
    ws["A4"].font = Font(name=_XLSX_FONT, italic=True, size=9, color="64748B")

    info_rows = [
        ("Base API URL", base_url),
        ("Framework", framework),
        ("Authentication Method", auth_method),
        ("Test Type", "Internal API Test"),
        ("API Version", generation_data.get('api_version', 'N/A')),
        ("Pass Rate", f"{pass_rate}% — {pr_label}"),
        ("Generated", datetime.now().strftime("%Y-%m-%d %H:%M")),
    ]
    r = 6
    for lbl, val in info_rows:
        lc = ws.cell(row=r, column=1, value=lbl)
        lc.font = Font(name=_XLSX_FONT, bold=True, color="64748B", size=9)
        lc.fill = PatternFill("solid", fgColor="F8FAFC")
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=6)
        vc = ws.cell(row=r, column=2, value=val)
        vc.font = Font(name=_XLSX_FONT, size=10, color="1E293B", bold=(lbl == "Pass Rate"))
        for col in range(1, 7):
            ws.cell(row=r, column=col).border = _XLSX_BORDER
        r += 1

    r += 2
    stats = [
        ("PASSED", pass_count, "10B981", "D1FAE5"),
        ("FAILED", fail_count, "EF4444", "FEE2E2"),
        ("SKIPPED", skip_count, "F59E0B", "FEF3C7"),
        ("PASS RATE", f"{pass_rate}%", rate_color,
         "D1FAE5" if pass_rate >= 80 else "FEF3C7" if pass_rate >= 50 else "FEE2E2"),
        ("TOTAL", total, "3B82F6", "DBEAFE"),
    ]
    col = 1
    for lbl, val, color, bg in stats:
        c1 = ws.cell(row=r, column=col, value=val)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=16, color=color)
        c1.alignment = Alignment(horizontal="center", vertical="center")
        c1.fill = PatternFill("solid", fgColor=bg)
        c1.border = _XLSX_BORDER
        c2 = ws.cell(row=r + 1, column=col, value=lbl)
        c2.font = Font(name=_XLSX_FONT, bold=True, size=8, color="64748B")
        c2.alignment = Alignment(horizontal="center", vertical="center")
        c2.fill = PatternFill("solid", fgColor=bg)
        c2.border = _XLSX_BORDER
        col += 1
    ws.row_dimensions[r].height = 22
    ws.row_dimensions[r + 1].height = 18
    r += 3

    # ── Overall status hero ──
    overall_status = 'CRITICAL ISSUES' if critical_fail else ('PASSED W/ WARNINGS' if fail_count > 0 else 'ALL CHECKS PASSED')
    risk_level = 'HIGH' if critical_fail else ('MEDIUM' if fail_count > 0 else 'LOW')
    deploy_text = 'NOT READY' if critical_fail else ('READY W/ CAUTION' if fail_count > 0 else 'READY')
    status_color = "EF4444" if critical_fail else ("F59E0B" if fail_count > 0 else "10B981")

    ws.cell(row=r, column=1, value="API Test Summary").font = Font(
        name=_XLSX_FONT, bold=True, size=12, color="1E293B")
    r += 1
    hero_items = [
        ("OVERALL STATUS", overall_status, status_color),
        ("PASS RATE", f"{pass_rate}%", rate_color),
        ("RISK LEVEL", risk_level, status_color),
        ("DEPLOYMENT", deploy_text, status_color),
    ]
    col = 1
    for lbl, val, color in hero_items:
        c1 = ws.cell(row=r, column=col, value=val)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=12, color=color)
        c1.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c1.border = _XLSX_BORDER
        c2 = ws.cell(row=r + 1, column=col, value=lbl)
        c2.font = Font(name=_XLSX_FONT, bold=True, size=7.5, color="64748B")
        c2.alignment = Alignment(horizontal="center", vertical="center")
        c2.border = _XLSX_BORDER
        col += 1
    ws.row_dimensions[r].height = 26
    ws.row_dimensions[r + 1].height = 16
    r += 3

    ai_summary_text = (ai_data or {}).get('summary', '')
    if not ai_summary_text:
        ai_summary_text = (
            f'This API test run executed {total} request(s) against {base_url}, with {pass_count} passed '
            f'and {fail_count} failed ({pass_rate}% pass rate). '
            + ('Critical failures were detected on this API.' if critical_fail
               else 'No critical failures were detected on this API.'))
    r = _api_xlsx_wrapped(ws, r, ai_summary_text, Font(name=_XLSX_FONT, size=9, color="475569"),
                           fill="F8FAFC", end_col=8)
    r += 1

    # ── Category Breakdown chart ──
    cat_hdr_row = r
    _api_xlsx_header_row(ws, r, ["Category", "Total", "Passed", "Failed"])
    r += 1
    cats = {c: {'pass': 0, 'fail': 0, 'total': 0} for c in API_CATEGORY_ORDER}
    for t in tests:
        label, _ = _api_category_label(t)
        cats[label]['total'] += 1
        if t.get('status') == 'pass':
            cats[label]['pass'] += 1
        elif t.get('status') == 'fail':
            cats[label]['fail'] += 1
    for cat in API_CATEGORY_ORDER:
        d = cats[cat]
        if d['total'] == 0:
            continue
        cc = API_CATEGORY_META.get(cat, '#64748b').lstrip('#').upper()
        c1 = ws.cell(row=r, column=1, value=cat)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color=cc)
        c1.border = _XLSX_BORDER
        for i, v in enumerate([d['total'], d['pass'], d['fail']], start=2):
            c = ws.cell(row=r, column=i, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
            c.alignment = Alignment(horizontal="center")
            c.border = _XLSX_BORDER
        r += 1
    chart_end = r - 1

    if chart_end >= cat_hdr_row + 1:
        chart = BarChart()
        chart.type = "col"
        chart.title = "Category Breakdown"
        chart.y_axis.title = "Requests"
        cats_ref = Reference(ws, min_col=1, min_row=cat_hdr_row + 1, max_row=chart_end)
        pass_ref = Reference(ws, min_col=3, min_row=cat_hdr_row, max_row=chart_end)
        fail_ref = Reference(ws, min_col=4, min_row=cat_hdr_row, max_row=chart_end)
        chart.add_data(pass_ref, titles_from_data=True)
        chart.add_data(fail_ref, titles_from_data=True)
        chart.set_categories(cats_ref)
        chart.series[0].graphicalProperties.solidFill = "10B981"
        chart.series[1].graphicalProperties.solidFill = "EF4444"
        chart.width = 18
        chart.height = 9
        ws.add_chart(chart, f"A{chart_end + 2}")

    _api_xlsx_autofit(ws, [22, 12, 12, 12, 14, 14, 14, 14])
    ws.freeze_panes = "A6"

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 2 — Endpoints Covered
    # ═══════════════════════════════════════════════════════════════════
    ws2 = wb.create_sheet("Endpoints Covered")
    ws2.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws2, 1, ["#", "Method", "Endpoint", "Checks", "Status"])
    ws2.freeze_panes = "A2"

    METHOD_COLOR = {'GET': '10B981', 'POST': '3B82F6', 'PUT': 'F59E0B', 'DELETE': 'EF4444', 'PATCH': '8B5CF6'}
    seen = {}
    for t in tests:
        key = (_get_method(t), _get_endpoint(t))
        if key not in seen:
            seen[key] = {'pass': 0, 'fail': 0, 'skip': 0}
        seen[key][t.get('status', 'skip') if t.get('status') in ('pass', 'fail') else 'skip'] += 1

    r = 2
    for i, ((method, path), counts) in enumerate(sorted(seen.items(), key=lambda x: x[0][1]), start=1):
        total_n = counts['pass'] + counts['fail'] + counts['skip']
        verdict = 'PASS' if counts['fail'] == 0 else 'FAIL'
        row_bg = "D1FAE5" if counts['fail'] == 0 else "FEE2E2"
        mc = METHOD_COLOR.get(method, '64748B')
        vals = [i, method, path, total_n, verdict]
        for col, v in enumerate(vals, start=1):
            c = ws2.cell(row=r, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (2, 5)),
                          color=(mc if col == 2 else ("EF4444" if verdict == "FAIL" else "10B981") if col == 5 else "1E293B"))
            c.fill = PatternFill("solid", fgColor=row_bg)
            c.alignment = Alignment(horizontal="center" if col in (1, 2, 4, 5) else "left", vertical="center")
            c.border = _XLSX_BORDER
        r += 1
    if not seen:
        ws2.merge_cells("A2:E2")
        c = ws2.cell(row=2, column=1, value="No endpoints recorded for this run.")
        c.font = Font(name=_XLSX_FONT, italic=True, size=9, color="94A3B8")
    _api_xlsx_title(ws2, "API ENDPOINTS COVERED", "F97316")
    _api_xlsx_autofit(ws2, [5, 12, 60, 12, 12])

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 3 — Test Scenarios
    # ═══════════════════════════════════════════════════════════════════
    ws3 = wb.create_sheet("Test Scenarios")
    ws3.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws3, 1, ["#", "Scenario", "Method", "Category", "Priority", "Expected"])
    ws3.freeze_panes = "A2"

    for i, t in enumerate(tests, start=2):
        cat_label, cat_color = _api_category_label(t)
        priority = (t.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b').lstrip('#').upper()
        method = _get_method(t)
        mc = METHOD_COLOR.get(method, '64748B')
        expected = t.get('reason') or t.get('expected') or t.get('description') or f'Returns HTTP {t.get("expected_status", 200)}'
        vals = [i - 1, t.get('name', ''), method, cat_label.upper(), priority.upper(), str(expected)[:120]]
        for col, v in enumerate(vals, start=1):
            c = ws3.cell(row=i, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (3, 4, 5)),
                          color=(mc if col == 3 else cat_color.lstrip('#').upper() if col == 4 else pc if col == 5 else "1E293B"))
            c.alignment = Alignment(horizontal="center" if col in (1, 3, 4, 5) else "left", vertical="top", wrap_text=(col == 6))
            c.border = _XLSX_BORDER
    _api_xlsx_title(ws3, "API TEST SCENARIOS", "F97316")
    _api_xlsx_autofit(ws3, [5, 40, 12, 18, 12, 55])

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 4 — Results by Category
    # ═══════════════════════════════════════════════════════════════════
    ws4 = wb.create_sheet("Results by Category")
    ws4.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws4, 1, ["Category", "Total", "Passed", "Failed", "Pass Rate", "Verdict"])
    ws4.freeze_panes = "A2"

    row = 2
    for cat in API_CATEGORY_ORDER:
        d = cats[cat]
        if d['total'] == 0:
            continue
        rate = round(d['pass'] / d['total'] * 100)
        verdict = 'PASS' if d['fail'] == 0 else 'FAIL'
        bg = "D1FAE5" if d['fail'] == 0 else "FEE2E2"
        cc = API_CATEGORY_META.get(cat, '#64748b').lstrip('#').upper()
        vals = [cat, d['total'], d['pass'], d['fail'], f"{rate}%", verdict]
        for col, v in enumerate(vals, start=1):
            c = ws4.cell(row=row, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (1, 6)),
                          color=(cc if col == 1 else ("EF4444" if verdict == "FAIL" else "10B981") if col == 6 else "1E293B"))
            c.fill = PatternFill("solid", fgColor=bg)
            c.alignment = Alignment(horizontal="center" if col > 1 else "left", vertical="center")
            c.border = _XLSX_BORDER
        row += 1
    _api_xlsx_title(ws4, "RESULTS BY CATEGORY", "F97316")
    _api_xlsx_autofit(ws4, [22, 10, 10, 10, 12, 12])

    # ── Status code distribution chart ──
    dist_hdr_row = 3
    _api_xlsx_header_row(ws4, dist_hdr_row, ["Status Class", "Count"])
    counts_sc = {'2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0}
    for t in tests:
        cls = _status_class(t.get('http_status'))
        if cls in counts_sc:
            counts_sc[cls] += 1
    dr = dist_hdr_row + 1
    for lbl, val in counts_sc.items():
        c1 = ws4.cell(row=dr, column=1, value=lbl)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color="1E293B")
        c1.border = _XLSX_BORDER
        c2 = ws4.cell(row=dr, column=2, value=val)
        c2.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
        c2.alignment = Alignment(horizontal="center")
        c2.border = _XLSX_BORDER
        dr += 1
    dist_chart = BarChart()
    dist_chart.type = "bar"
    dist_chart.title = "HTTP Status Code Distribution"
    dist_chart.y_axis.title = "Requests"
    cats_ref = Reference(ws4, min_col=1, min_row=dist_hdr_row + 1, max_row=dr - 1)
    data_ref = Reference(ws4, min_col=2, min_row=dist_hdr_row, max_row=dr - 1)
    dist_chart.add_data(data_ref, titles_from_data=True)
    dist_chart.set_categories(cats_ref)
    dist_chart.series[0].graphicalProperties.solidFill = "F97316"
    dist_chart.width = 16
    dist_chart.height = 7
    ws4.add_chart(dist_chart, f"D{dist_hdr_row}")

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 5 — Detailed Results
    # ═══════════════════════════════════════════════════════════════════
    ws5 = wb.create_sheet("Detailed Results")
    ws5.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws5, 1, ["#", "Endpoint", "Method", "Category", "Status", "HTTP", "Time", "Result"])
    ws5.freeze_panes = "A2"

    STATUS_COLOR = {"pass": ("10B981", "D1FAE5"), "fail": ("EF4444", "FEE2E2"), "skip": ("F59E0B", "FFFBEB")}
    for i, t in enumerate(tests, start=2):
        status = t.get('status', 'skip')
        s_color, s_bg = STATUS_COLOR.get(status, ("94A3B8", "FFFFFF"))
        cat_label, cat_color = _api_category_label(t)
        method = _get_method(t)
        mc = METHOD_COLOR.get(method, '64748B')
        endpoint = _get_endpoint(t)
        http_status = t.get('http_status', '—')
        expected_status = t.get('expected_status')
        http_disp = f'{http_status}' + (f' / {expected_status}' if expected_status and http_status != expected_status else '')
        reason = t.get('reason') or t.get('reason_pass') or t.get('error') or '—'
        vals = [i - 1, endpoint, method, cat_label.upper(), status.upper(), http_disp, t.get('duration', '—'), str(reason)[:150]]
        for col, v in enumerate(vals, start=1):
            c = ws5.cell(row=i, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (3, 4, 5)),
                          color=(mc if col == 3 else cat_color.lstrip('#').upper() if col == 4 else s_color if col == 5 else "1E293B"))
            c.alignment = Alignment(horizontal="center" if col in (1, 3, 4, 5, 6, 7) else "left", vertical="top", wrap_text=(col == 8))
            c.border = _XLSX_BORDER
            if col == 5:
                c.fill = PatternFill("solid", fgColor=s_bg)
        ws5.row_dimensions[i].height = 20
    _api_xlsx_title(ws5, "DETAILED API TEST RESULTS", "0D9488")
    _api_xlsx_autofit(ws5, [5, 40, 12, 18, 12, 14, 12, 55])

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 6 — AI Recommendations
    # ═══════════════════════════════════════════════════════════════════
    ws6 = wb.create_sheet("AI Recommendations")
    ws6.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws6, 1, ["Priority", "Category", "Issue", "Fix"])

    recs = (ai_data or {}).get('recommendations', []) or []
    PRI_BG = {"high": "FEE2E2", "medium": "FFFBEB", "low": "D1FAE5"}
    PRI_COLOR = {"high": "EF4444", "medium": "F59E0B", "low": "10B981"}
    r = 2
    for rec in recs:
        pri = (rec.get('priority') or 'medium').lower()
        vals = [pri.upper(), (rec.get('category', '—') or '—').upper(), rec.get('issue', ''),
                rec.get('fix', rec.get('recommendation', ''))]
        for col, v in enumerate(vals, start=1):
            c = ws6.cell(row=r, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col == 1),
                          color=PRI_COLOR.get(pri, "F59E0B") if col == 1 else "1E293B")
            c.alignment = Alignment(vertical="top", wrap_text=(col >= 3), horizontal="center" if col == 1 else "left")
            c.fill = PatternFill("solid", fgColor=PRI_BG.get(pri, "FFFBEB"))
            c.border = _XLSX_BORDER
        ws6.row_dimensions[r].height = 30
        r += 1
    if not recs:
        ws6.merge_cells("A2:D2")
        c = ws6.cell(row=2, column=1, value="No issues detected on this API — no recommendations needed for this run.")
        c.font = Font(name=_XLSX_FONT, italic=True, size=9, color="94A3B8")
    _api_xlsx_title(ws6, "AI RECOMMENDATIONS", "4F46E5")
    _api_xlsx_autofit(ws6, [12, 18, 40, 55])

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 7 — Action Plan
    # ═══════════════════════════════════════════════════════════════════
    ws7 = wb.create_sheet("Action Plan")
    ws7.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws7, 1, ["Priority", "Category", "Action", "Expected Impact", "Status"])
    ws7.freeze_panes = "A2"

    action_plan = (ai_data or {}).get('action_plan', []) or []
    r = 2
    for item in action_plan:
        if isinstance(item, str):
            item = {'priority': 'medium', 'category': 'General', 'action': item, 'impact': '—', 'status': 'To Do'}
        priority = (item.get('priority') or 'medium').lower()
        category_disp = item.get('category', '') or 'General'
        impact_val = item.get('impact') or item.get('expected_impact') or \
            f'Resolves this {category_disp.lower()} issue and improves overall API reliability'
        vals = [priority.upper(), category_disp.upper(), item.get('action', ''), impact_val, item.get('status', 'To Do')]
        for col, v in enumerate(vals, start=1):
            c = ws7.cell(row=r, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col == 1),
                          color=PRI_COLOR.get(priority, "F59E0B") if col == 1 else "1E293B")
            c.alignment = Alignment(vertical="top", wrap_text=(col in (3, 4)),
                                     horizontal="center" if col in (1, 5) else "left")
            if col == 1:
                c.fill = PatternFill("solid", fgColor=PRI_BG.get(priority, "FFFBEB"))
            c.border = _XLSX_BORDER
        ws7.row_dimensions[r].height = 32
        r += 1
    if not action_plan:
        ws7.merge_cells("A2:E2")
        c = ws7.cell(row=2, column=1, value="No action plan items for this run.")
        c.font = Font(name=_XLSX_FONT, italic=True, size=9, color="94A3B8")
    _api_xlsx_title(ws7, "AI ACTION PLAN", "C9A227")
    _api_xlsx_autofit(ws7, [12, 18, 40, 40, 12])

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 8 — Environment
    # ═══════════════════════════════════════════════════════════════════
    ws8 = wb.create_sheet("Environment")
    ws8.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws8, 1, ["Property", "Value"])
    ws8.freeze_panes = "A2"

    total_ms = _total_response_ms(tests)
    avg_ms = _avg_response_ms(tests)
    env_items = [
        ("Framework", framework),
        ("Authentication Method", auth_method),
        ("Base URL", base_url),
        ("API Version", generation_data.get('api_version', 'N/A')),
        ("Total Requests", str(len(tests))),
        ("Execution Time", f'{total_ms/1000:.2f}s' if total_ms else 'N/A'),
        ("Avg Response Time", f'{avg_ms:.0f}ms' if avg_ms else 'N/A'),
        ("NexTest Version", generation_data.get('nextest_version', '1.0.0')),
        ("Generated", datetime.now().strftime('%Y-%m-%d %H:%M')),
    ]
    r = 2
    for lbl, val in env_items:
        c1 = ws8.cell(row=r, column=1, value=lbl)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color="F97316")
        c1.fill = PatternFill("solid", fgColor="F8FAFC")
        c1.border = _XLSX_BORDER
        c2 = ws8.cell(row=r, column=2, value=val)
        c2.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
        c2.border = _XLSX_BORDER
        r += 1
    _api_xlsx_title(ws8, "ENVIRONMENT & EXECUTION INFO", "F97316")
    _api_xlsx_autofit(ws8, [24, 40])

    # ═══════════════════════════════════════════════════════════════════
    # SHEET 9 — Certificate
    # ═══════════════════════════════════════════════════════════════════
    ws9 = wb.create_sheet("Certificate")
    ws9.sheet_view.showGridLines = False
    _api_xlsx_header_row(ws9, 1, ["Property", "Value"])
    ws9.freeze_panes = "A2"

    if critical_fail:
        verdict_text = (f'Internal API Test FAILED — critical checks did not pass on {base_url}. '
                         f'This API is NOT ready for further testing until resolved.')
        verdict_color = "EF4444"
        risk_final = "HIGH"
    elif fail_count > 0:
        verdict_text = (f'Internal API Test passed with {fail_count} non-critical issue(s) on {base_url}. '
                         f'Review before proceeding to deeper testing.')
        verdict_color = "F59E0B"
        risk_final = "MEDIUM"
    else:
        verdict_text = f'Internal API Test PASSED — all {pass_count} check(s) succeeded on {base_url}.'
        verdict_color = "10B981"
        risk_final = "LOW"

    ws9.merge_cells("A1:B1")
    c = ws9.cell(row=1, column=1, value="Final API Verdict")
    c.font = Font(name=_XLSX_FONT, bold=True, size=13, color=verdict_color)
    r = 2
    r = _api_xlsx_wrapped(ws9, r, verdict_text, Font(name=_XLSX_FONT, size=9, color=verdict_color),
                           fill=("D1FAE5" if risk_final == "LOW" else "FFFBEB" if risk_final == "MEDIUM" else "FEE2E2"),
                           end_col=2)
    ws9.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
    c = ws9.cell(row=r, column=1,
                 value=f"Pass Rate: {pass_rate}/100  |  Risk Level: {risk_final}  |  Deployment Readiness: {pr_label}")
    c.font = Font(name=_XLSX_FONT, bold=True, size=10, color="1E293B")
    r += 2

    cert_details = [
        ("Validation Date", datetime.now().strftime('%Y-%m-%d  %H:%M')),
        ("Framework", framework),
        ("Authentication", auth_method),
        ("Base API URL", base_url),
        ("Execution Time", f'{total_ms/1000:.2f}s' if total_ms else 'N/A'),
        ("Avg Response Time", f'{avg_ms:.0f}ms' if avg_ms else 'N/A'),
        ("Overall Grade", grade),
        ("AI Validation Status", "Verified by NexTest AI"),
    ]
    for lbl, val in cert_details:
        c1 = ws9.cell(row=r, column=1, value=lbl)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color="F97316")
        c1.fill = PatternFill("solid", fgColor="F8FAFC")
        c1.border = _XLSX_BORDER
        c2 = ws9.cell(row=r, column=2, value=val)
        c2.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
        c2.border = _XLSX_BORDER
        r += 1

    r += 2
    ws9.merge_cells(f"A{r}:B{r}")
    c = ws9.cell(row=r, column=1, value=f"{base_url}  —  {pass_rate}/100  ({pr_label})")
    c.font = Font(name=_XLSX_FONT, bold=True, size=12, color=pr_color)
    c.alignment = Alignment(horizontal="center")
    r += 2
    ws9.merge_cells(f"A{r}:B{r}")
    c = ws9.cell(row=r, column=1,
                 value=f"Validated by NexTest AI  •  {datetime.now().strftime('%Y-%m-%d')}")
    c.font = Font(name=_XLSX_FONT, italic=True, size=8, color="94A3B8")
    c.alignment = Alignment(horizontal="center")

    _api_xlsx_title(ws9, "CERTIFICATE OF INTERNAL API VALIDATION", "F97316")
    _api_xlsx_autofit(ws9, [26, 40])

    # ── Ordre final ──
    order = ["Overview", "Endpoints Covered", "Test Scenarios", "Results by Category",
             "Detailed Results", "AI Recommendations", "Action Plan", "Environment", "Certificate"]
    wb._sheets = [wb[name] for name in order if name in wb.sheetnames]
    wb.active = 0

    buffer = _XL_BIO()
    wb.save(buffer)
    return buffer.getvalue()