
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
from openpyxl.chart import BarChart, PieChart, DoughnutChart, Reference
from openpyxl.chart.series import DataPoint
from openpyxl.chart.label import DataLabelList
import math

_XLSX_FONT = "Calibri"
_XLSX_THIN = Side(style="thin", color="E2E8F0")
_XLSX_BORDER = Border(left=_XLSX_THIN, right=_XLSX_THIN, top=_XLSX_THIN, bottom=_XLSX_THIN)


def _fn_xlsx_header_row(ws, row, headers, col_start=1):
    for i, h in enumerate(headers, start=col_start):
        c = ws.cell(row=row, column=i, value=h)
        c.font = Font(name=_XLSX_FONT, bold=True, color="FFFFFF", size=10)
        c.fill = PatternFill("solid", fgColor="0A0F1E")
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = _XLSX_BORDER


def _fn_xlsx_autofit(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def _fn_xlsx_title(ws, title: str, color_hex: str):
    ws.insert_rows(1, 2)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=6)
    c = ws.cell(row=1, column=1, value=title)
    c.font = Font(name=_XLSX_FONT, bold=True, size=13, color=color_hex)
    c.fill = PatternFill("solid", fgColor="0A0F1E")
    for col in range(1, 7):
        ws.cell(row=1, column=col).fill = PatternFill("solid", fgColor="0A0F1E")
    ws.row_dimensions[1].height = 24


def _fn_xlsx_wrapped(ws, r, text, font, chars_per_line=95, min_rows=2, fill=None, end_col=6):
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


# ═════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═════════════════════════════════════════════════════════════════════════════

# Indigo accent — matches NexTest's own "Functional" hue used elsewhere in the app
INTERNAL_FUNCTIONAL_ACCENT = HexColor('#ec4899')

# module (as it'll be shown) -> hex color
FUNCTIONAL_MODULE_META = {
    'Authentication':      '#6366f1',
    'Dashboard':           '#0ea5e9',
    'Project Management':  '#10b981',
    'Test Generation':     '#f59e0b',
    'Test Execution':      '#8b5cf6',
    'Reports':             '#ec4899',
    'User Management':     '#14b8a6',
    'Settings':            '#64748b',
}
FUNCTIONAL_MODULE_ORDER = list(FUNCTIONAL_MODULE_META.keys())

# Modules that count 3x toward the Functional Health Score, and are treated
# as "critical" for the verdict — a failure here means core user journeys
# are broken (cannot log in, cannot manage projects).
FUNCTIONAL_HIGH_MODULES = {'Authentication', 'Project Management'}


# ═════════════════════════════════════════════════════════════════════════════
# HELPERS — extraction, categorization, scoring
# ═════════════════════════════════════════════════════════════════════════════

def _get_action(t: dict) -> str:
    return t.get('action') or (t.get('step_meta') or {}).get('action') or 'check_visible'


def _functional_module_label(test: dict) -> tuple:
    """Maps a raw executed functional check to one of the 8 functional modules."""
    cat  = (test.get('category') or '').lower()
    name = (test.get('name') or '').lower()
    hay = f'{cat} {name}'

    if any(k in hay for k in ('auth', 'login', 'logout', 'token', 'session', 'signin')):
        return 'Authentication', FUNCTIONAL_MODULE_META['Authentication']
    if any(k in hay for k in ('dashboard', 'home', 'overview')):
        return 'Dashboard', FUNCTIONAL_MODULE_META['Dashboard']
    if any(k in hay for k in ('project', 'create project', 'edit project', 'delete project')):
        return 'Project Management', FUNCTIONAL_MODULE_META['Project Management']
    if any(k in hay for k in ('generate test', 'test generation', 'generate case')):
        return 'Test Generation', FUNCTIONAL_MODULE_META['Test Generation']
    if any(k in hay for k in ('execute', 'execution', 'run test')):
        return 'Test Execution', FUNCTIONAL_MODULE_META['Test Execution']
    if any(k in hay for k in ('report', 'download report', 'pdf', 'xlsx', 'export')):
        return 'Reports', FUNCTIONAL_MODULE_META['Reports']
    if any(k in hay for k in ('user management', 'manage user', 'profile', 'account')):
        return 'User Management', FUNCTIONAL_MODULE_META['User Management']
    if any(k in hay for k in ('setting', 'config', 'preference')):
        return 'Settings', FUNCTIONAL_MODULE_META['Settings']
    return 'Dashboard', FUNCTIONAL_MODULE_META['Dashboard']


def _compute_internal_functional_score(tests: list) -> tuple:
    """Weighted score — Authentication and Project Management checks count 3x
    since a failure there means core user journeys are broken."""
    if not tests:
        return 0, 'Critical', '#ef4444'
    total_weight = 0
    earned_weight = 0
    for t in tests:
        label, _ = _functional_module_label(t)
        priority = (t.get('priority') or t.get('severity') or 'medium').lower()
        w = 3 if (label in FUNCTIONAL_HIGH_MODULES or priority in ('high', 'critical')) else 1
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


def _is_critical_functional_fail(t: dict) -> bool:
    if t.get('status') != 'fail':
        return False
    priority = (t.get('priority') or t.get('severity') or '').lower()
    if priority in ('high', 'critical'):
        return True
    label, _ = _functional_module_label(t)
    if label in FUNCTIONAL_HIGH_MODULES:
        return True
    return False


def _avg_duration_ms(tests: list) -> float:
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


def _total_duration_ms(tests: list) -> float:
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


def _app_name(generation_data: dict) -> str:
    return (generation_data.get('app_name') or generation_data.get('project_name')
            or generation_data.get('url') or 'NexTest Application')


def _environment(generation_data: dict) -> str:
    return generation_data.get('environment', 'Internal / Staging')


# ═════════════════════════════════════════════════════════════════════════════
# CHART HELPERS — Bar (by module) + Donut (pass/fail/skip)
# ═════════════════════════════════════════════════════════════════════════════

def _make_functional_module_chart(tests: list):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np

    mods = {m: {'pass': 0, 'fail': 0} for m in FUNCTIONAL_MODULE_ORDER}
    for t in tests:
        label, _ = _functional_module_label(t)
        if t.get('status') == 'pass':
            mods[label]['pass'] += 1
        elif t.get('status') == 'fail':
            mods[label]['fail'] += 1

    labels = [m for m in FUNCTIONAL_MODULE_ORDER if mods[m]['pass'] + mods[m]['fail'] > 0]
    if not labels:
        labels = FUNCTIONAL_MODULE_ORDER[:3]

    p = [mods[m]['pass'] for m in labels]
    f = [mods[m]['fail'] for m in labels]

    plt.rcParams.update({'font.family': 'DejaVu Sans', 'axes.spines.top': False, 'axes.spines.right': False})
    fig, ax = plt.subplots(figsize=(8, 3.4), facecolor='white')
    ax.set_facecolor('#f8fafc')
    x = np.arange(len(labels))

    # colonnes fines et fixes (façon xlsx), même avec 1 seul module
    bar_width = 0.4
    ax.bar(x, p, width=bar_width, color='#10b981', edgecolor='white', label='Passed', zorder=3)
    ax.bar(x, f, width=bar_width, bottom=p, color='#ef4444', edgecolor='white', label='Failed', zorder=3)

    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=8, color='#475569', fontweight='bold', rotation=20, ha='right')

    # empêche l'axe de se coller aux bords de la barre quand il y a peu de catégories
    ax.set_xlim(-0.6, len(labels) - 0.4)

    ax.set_ylabel('Checks', fontsize=8, color='#64748b')
    ax.grid(axis='y', color='#f1f5f9', linewidth=1, zorder=0)
    ax.legend(fontsize=8, frameon=False, loc='upper right')
    fig.text(0.02, 0.97, 'Functional Results by Module', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.85, bottom=0.28, left=0.08, right=0.97)
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=170, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return RLImage(buf, width=155 * mm, height=68 * mm), mods
def _make_functional_distribution_donut(tests: list):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    pass_count = sum(1 for t in tests if t.get('status') == 'pass')
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    skip_count = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))

    labels = ['Passed', 'Failed', 'Skipped']
    values = [pass_count, fail_count, skip_count]
    colors = ['#10b981', '#ef4444', '#f59e0b']
    total = sum(values) or 1

    plt.rcParams.update({'font.family': 'DejaVu Sans'})
    fig, ax = plt.subplots(figsize=(6.4, 3.4), facecolor='white')
    nonzero = [(l, v, c) for l, v, c in zip(labels, values, colors) if v > 0]
    if not nonzero:
        nonzero = [('No data', 1, '#cbd5e1')]
    lbls  = [n[0] for n in nonzero]
    vals  = [n[1] for n in nonzero]
    cols  = [n[2] for n in nonzero]

    wedges, _ = ax.pie(
        vals, colors=cols, startangle=90, counterclock=False,
        wedgeprops=dict(width=0.42, edgecolor='white', linewidth=2),
    )
    ax.text(0, 0.06, f'{total}', ha='center', va='center', fontsize=20, fontweight='bold', color='#1e293b')
    ax.text(0, -0.14, 'checks', ha='center', va='center', fontsize=9, color='#94a3b8')

    legend_labels = [f'{l}  —  {v} ({round(v/total*100)}%)' for l, v in zip(lbls, vals)]
    ax.legend(wedges, legend_labels, loc='center left', bbox_to_anchor=(1.02, 0.5),
              frameon=False, fontsize=9, labelcolor='#475569')
    fig.text(0.02, 0.95, 'Functional Test Result Distribution', fontsize=11, fontweight='bold',
              color='#1e293b', va='top')
    ax.set_aspect('equal')
    plt.subplots_adjust(top=0.82, bottom=0.05, left=0.02, right=0.62)
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=170, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return RLImage(buf, width=155 * mm, height=68 * mm), {'pass': pass_count, 'fail': fail_count, 'skip': skip_count}


def _fn_xlsx_donut_png(tests: list) -> _XL_BIO:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    pass_count = sum(1 for t in tests if t.get('status') == 'pass')
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    skip_count = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))
    labels, values, colors = ['Passed', 'Failed', 'Skipped'], [pass_count, fail_count, skip_count], ['#10b981', '#ef4444', '#f59e0b']
    total = sum(values) or 1

    plt.rcParams.update({'font.family': 'DejaVu Sans'})
    fig, ax = plt.subplots(figsize=(6, 3.2), facecolor='white')
    nonzero = [(l, v, c) for l, v, c in zip(labels, values, colors) if v > 0] or [('No data', 1, '#cbd5e1')]
    wedges, _ = ax.pie([n[1] for n in nonzero], colors=[n[2] for n in nonzero], startangle=90,
                        counterclock=False, wedgeprops=dict(width=0.42, edgecolor='white', linewidth=2))
    ax.legend(wedges, [f'{n[0]} — {n[1]} ({round(n[1]/total*100)}%)' for n in nonzero],
              loc='center left', bbox_to_anchor=(1.0, 0.5), frameon=False, fontsize=9)
    fig.text(0.02, 0.95, 'Functional Test Result Distribution', fontsize=11, fontweight='bold', color='#1e293b', va='top')
    plt.subplots_adjust(top=0.82, bottom=0.05, left=0.02, right=0.62)
    buf = _XL_BIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return buf


# ═════════════════════════════════════════════════════════════════════════════
# SECTION BUILDERS
# ═════════════════════════════════════════════════════════════════════════════

def _fn_chapter_header(elements, number: str, title: str):
    num_display = str(number).zfill(2)
    badge = Table([[Paragraph(
        f'<font color="white" size="13"><b>{num_display}</b></font>',
        ParagraphStyle('FnChapNum', fontSize=13, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=15))
    ]], colWidths=[14 * mm], rowHeights=[14 * mm])
    badge.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INTERNAL_FUNCTIONAL_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    title_block = Table([
        [Paragraph(f'<font color="#94a3b8" size="7"><b>SECTION {num_display}</b></font>',
                   ParagraphStyle('FnChapEy', fontSize=7, fontName='Helvetica-Bold', leading=8.5))],
        [Paragraph(f'<font color="#1e293b" size="14"><b>{title}</b></font>',
                   ParagraphStyle('FnChapTitle', fontSize=14, fontName='Helvetica-Bold', leading=17))],
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
    elements.append(HRFlowable(width='100%', thickness=2, color=INTERNAL_FUNCTIONAL_ACCENT, spaceBefore=6, spaceAfter=12))


def _insight_box(text, color, width=161, label="AI Analysis"):
    tbl = Table([[Paragraph(
        f'<font color="{color}" size="7.5"><b>{label}: </b></font>'
        f'<font color="#475569" size="7.5">{text}</font>',
        ParagraphStyle('FnInsight', fontSize=7.5, fontName='Helvetica', leading=11))
    ]], colWidths=[width * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.8, HexColor(color)),
        ('LINEBEFORE', (0, 0), (0, -1), 3, HexColor(color)),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return tbl


# ── SECTION 01 — Functional Test Summary ─────────────────────────────────────

def build_functional_overview_hero(elements, tests, ai_data, score, score_label, score_color,
                                    pass_rate, app_name):
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    critical_fail = any(_is_critical_functional_fail(t) for t in tests)

    if critical_fail:
        overall_status, status_color = 'CRITICAL ISSUES', '#ef4444'
        risk_level, risk_color = 'HIGH', '#ef4444'
        deploy_text = 'NOT READY'
        status_explain = (
            'One or more critical functional checks failed (Authentication or Project Management '
            'workflows). These block core user journeys — resolve before the next deployment.')
    elif fail_count > 0:
        overall_status, status_color = 'PASSED W/ WARNINGS', '#f59e0b'
        risk_level, risk_color = 'MEDIUM', '#f59e0b'
        deploy_text = 'READY W/ CAUTION'
        status_explain = (
            f'Core workflows are confirmed, but {fail_count} secondary check(s) failed. '
            f'Review the failing modules below.')
    else:
        overall_status, status_color = 'ALL CHECKS PASSED', '#10b981'
        risk_level, risk_color = 'LOW', '#10b981'
        deploy_text = 'READY'
        status_explain = (
            f"Every functional scenario executed against {app_name} passed. The application's core "
            f'workflows are stable and ready for the next testing phase.')

    elements.append(section_header('', 'Functional Test Summary', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>{status_explain}</i></font>',
        ParagraphStyle('FnStatusExplain', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    def _hero_stat(label, value, color):
        return Table([[Paragraph(
            f'<font color="#94a3b8" size="7"><b>{label}</b></font><br/>'
            f'<font color="{color}" size="12"><b>{value}</b></font>',
            ParagraphStyle('FnHeroStat', fontSize=10, fontName='Helvetica', leading=16, alignment=TA_CENTER))
        ]], colWidths=[40 * mm], style=[
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
            ('BOX', (0, 0), (-1, -1), 1, HexColor(color)),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ])

    row = Table([[
        _hero_stat('OVERALL STATUS', overall_status, status_color),
        _hero_stat('FUNCTIONAL HEALTH SCORE', f'{score}/100', score_color),
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
            f'This functional test run executed {total} scenario(s) against <b>{app_name}</b>, '
            f'with {pass_count} passed and {fail_count} failed ({pass_rate}% pass rate). '
            + ('Critical workflow failures were detected.' if critical_fail
               else 'No critical workflow failures were detected.'))
    elements.append(_insight_box(ai_summary_text, '#818cf8', label='AI Summary'))
    elements.append(Spacer(1, 16))


def build_functional_key_metrics_cards(elements, generation_data, tests):
    elements.append(section_header('', 'Key Metrics', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>'
        'Execution footprint for this functional run — timing, module coverage, and where the '
        'critical checks are concentrated.</i></font>',
        ParagraphStyle('FnKMInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    total_ms = _total_duration_ms(tests)
    avg_ms = _avg_duration_ms(tests)
    critical_count = sum(1 for t in tests if _is_critical_functional_fail(t))
    unique_modules = len({_functional_module_label(t)[0] for t in tests})
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    stability = 'Stable' if fail_count == 0 else ('Unstable' if any(_is_critical_functional_fail(t) for t in tests) else 'Mostly Stable')
    stability_color = '#10b981' if stability == 'Stable' else '#ef4444' if stability == 'Unstable' else '#f59e0b'

    metrics = [
        ('TOTAL EXECUTION TIME', f'{total_ms/1000:.2f}s' if total_ms else 'N/A', '#0EA5E9'),
        ('AVERAGE TEST DURATION', f'{avg_ms:.0f}ms' if avg_ms else 'N/A', '#10b981'),
        ('FUNCTIONAL MODULES TESTED', str(unique_modules), '#8b5cf6'),
        ('CRITICAL FUNCTIONAL CHECKS', str(critical_count), '#ef4444'),
        ('OVERALL STABILITY', stability, stability_color),
    ]

    def _metric_card(label, value, color):
        cell = Table([[Paragraph(
            f'<font color="{color}" size="7"><b>{label}</b></font><br/>'
            f'<font color="#1e293b" size="11"><b>{value}</b></font>',
            ParagraphStyle('FnKeyMetricC', fontSize=9, fontName='Helvetica', leading=15, alignment=TA_CENTER))
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
            row_cells.append(Paragraph('', ParagraphStyle('FnMetricEmpty')))
        card_rows.append(row_cells)
    outer = Table(card_rows, colWidths=[56 * mm] * 3)
    outer.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(outer)
    elements.append(Spacer(1, 16))


def build_functional_modules_covered(elements, tests, app_name):
    """Replaces 'API Endpoints Covered' — lists application modules actually
    exercised during this run. No screenshots."""
    elements.append(section_header('', 'Functional Modules Covered', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>'
        f'Application modules exercised against <b>{app_name}</b> during this run.</i></font>',
        ParagraphStyle('FnModInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    seen = {}
    for t in tests:
        m, _ = _functional_module_label(t)
        if m not in seen:
            seen[m] = {'pass': 0, 'fail': 0, 'skip': 0}
        seen[m][t.get('status', 'skip') if t.get('status') in ('pass', 'fail') else 'skip'] += 1

    if not seen:
        elements.append(Paragraph('<font color="#94a3b8" size="8">No modules recorded for this run.</font>',
                                   ParagraphStyle('FnModNone', fontSize=8, fontName='Helvetica')))
        elements.append(Spacer(1, 16))
        return

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('FnMH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Module</b></font>', ParagraphStyle('FnMH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Checks</b></font>', ParagraphStyle('FnMH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Passed</b></font>', ParagraphStyle('FnMH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Failed</b></font>', ParagraphStyle('FnMH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('FnMH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []
    for i, m in enumerate([m for m in FUNCTIONAL_MODULE_ORDER if m in seen]):
        counts = seen[m]
        mc = FUNCTIONAL_MODULE_META.get(m, '#64748b')
        total_n = counts['pass'] + counts['fail'] + counts['skip']
        verdict = 'PASS' if counts['fail'] == 0 else 'FAIL'
        vc = '#10b981' if counts['fail'] == 0 else '#ef4444'
        row_bg = HexColor('#f0fdf4') if counts['fail'] == 0 else HexColor('#fef2f2')
        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('FnMID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{mc}"><b>{m}</b></font>', ParagraphStyle('FnMN', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#1e293b">{total_n}</font>', ParagraphStyle('FnMC', fontSize=8, fontName='Helvetica', alignment=TA_CENTER)),
            Paragraph(f'<font color="#10b981"><b>{counts["pass"]}</b></font>', ParagraphStyle('FnMP', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#ef4444"><b>{counts["fail"]}</b></font>', ParagraphStyle('FnMF', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{vc}"><b>{verdict}</b></font>', ParagraphStyle('FnMV', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
        ri = len(rows) - 1
        row_styles.append(('BACKGROUND', (0, ri), (-1, ri), row_bg))

    tbl = Table(rows, colWidths=[8 * mm, 46 * mm, 22 * mm, 24 * mm, 24 * mm, 36 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_FUNCTIONAL_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


def build_functional_score_hero(elements, score, score_label, score_color):
    elements.append(section_header('', 'Functional Health Score', HexColor(score_color)))
    elements.append(Spacer(1, 10))
    try:
        gauge_img = _make_score_gauge(score, score_color)
    except Exception:
        gauge_img = None

    right_col = [
        Paragraph(f'<font color="{score_color}" size="15"><b>{score_label}</b></font>',
                  ParagraphStyle('FnHeroLabel', fontSize=15, fontName='Helvetica-Bold', leading=18)),
        Spacer(1, 6),
        Paragraph(
            '<font color="#475569" size="8.5">The Functional Health Score weighs Authentication and '
            'Project Management checks three times as heavily as secondary modules (Reports, Settings, '
            'User Management). Excellent ≥ 90 · Good ≥ 75 · Acceptable ≥ 50 · Critical below.</font>',
            ParagraphStyle('FnHeroDesc', fontSize=8.5, fontName='Helvetica', leading=13)),
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


# ── SECTION 02 — Functional Coverage ─────────────────────────────────────────

def build_functional_methodology(elements, tests, generation_data):
    app_name = _app_name(generation_data)

    elements.append(section_header('', 'Functional Test Methodology', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f'This report validates the core business workflows and application features of '
        f'<b>{app_name}</b> by executing automated functional test scenarios — user login/logout, '
        f'project management (create/edit/delete), test case generation, test execution, report '
        f'generation and download, user settings, and dashboard loading. NexTest drives the application '
        f'end-to-end with Playwright, exercising real user journeys rather than isolated component checks. '
        f'Only the modules actually exercised in this run are analyzed.',
        ParagraphStyle('FnMethoTxt', fontSize=8.5, fontName='Helvetica', leading=13,
                       textColor=HexColor('#475569'))))
    elements.append(Spacer(1, 16))
    build_functional_scenarios_table(elements, tests, app_name)


def build_functional_scenarios_table(elements, tests, app_name):
    elements.append(section_header('', 'Functional Test Scenarios', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f'<font color="#64748b" size="7.5"><i>'
        f'Planned functional scenarios for <b>{app_name}</b> — {len(tests)} scenario(s), scoped to the '
        f'workflows actually exercised in this run.</i></font>',
        ParagraphStyle('FnScInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('FnSH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Scenario</b></font>', ParagraphStyle('FnSH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Module</b></font>', ParagraphStyle('FnSH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('FnSH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Expected</b></font>', ParagraphStyle('FnSH4', fontSize=8, fontName='Helvetica-Bold')),
    ]
    rows = [hdr]
    row_styles = []
    for i, t in enumerate(tests):
        mod_label, mod_color = _functional_module_label(t)
        priority = (t.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b')
        expected = t.get('suite') or t.get('expected') or t.get('description') \
            or 'Workflow completes without error'
        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('FnSID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<b><font color="#1e293b" size="8">{t.get("name","")}</font></b>', ParagraphStyle('FnSN', fontSize=8, fontName='Helvetica', leading=11)),
            Paragraph(f'<font color="{mod_color}"><b>{mod_label.upper()}</b></font>', ParagraphStyle('FnSC', fontSize=6.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('FnSP', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7">{str(expected)[:70]}</font>', ParagraphStyle('FnSE', fontSize=7, fontName='Helvetica', leading=10)),
        ])
        if i % 2 == 1:
            row_styles.append(('BACKGROUND', (0, i + 1), (-1, i + 1), LIGHT_BG))

    tbl = Table(rows, colWidths=[8 * mm, 46 * mm, 30 * mm, 18 * mm, 66 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_FUNCTIONAL_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('LINEBEFORE', (2, 1), (2, -1), 1, BORDER), ('LINEBEFORE', (4, 1), (4, -1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


def build_functional_category_summary(elements, tests):
    elements.append(section_header('', 'Results by Category', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 8))

    cats = {c: {'pass': 0, 'fail': 0, 'total': 0} for c in FUNCTIONAL_MODULE_ORDER}
    for t in tests:
        label, _ = _functional_module_label(t)
        cats[label]['total'] += 1
        if t.get('status') == 'pass':
            cats[label]['pass'] += 1
        elif t.get('status') == 'fail':
            cats[label]['fail'] += 1

    hdr = [
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('FnCH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Total</b></font>', ParagraphStyle('FnCH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Passed</b></font>', ParagraphStyle('FnCH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Failed</b></font>', ParagraphStyle('FnCH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Pass Rate</b></font>', ParagraphStyle('FnCH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Verdict</b></font>', ParagraphStyle('FnCH6', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []
    any_row = False
    for cat in FUNCTIONAL_MODULE_ORDER:
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
            Paragraph(f'<font color="#1e293b"><b>{cat}</b></font>', ParagraphStyle('FnCC', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph(f'<font color="#1e293b"><b>{d["total"]}</b></font>', ParagraphStyle('FnCT', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#10b981"><b>{d["pass"]}</b></font>', ParagraphStyle('FnCP', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#ef4444"><b>{d["fail"]}</b></font>', ParagraphStyle('FnCF', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{rate_color}"><b>{rate}%</b></font>', ParagraphStyle('FnCR', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{vc}"><b>{verdict}</b></font>', ParagraphStyle('FnCV', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
        ri = len(rows) - 1
        row_styles.append(('BACKGROUND', (0, ri), (-1, ri), row_bg))

    if not any_row:
        elements.append(Paragraph('<font color="#94a3b8" size="8">No categorized checks available for this run.</font>',
                                   ParagraphStyle('FnCatNone', fontSize=8, fontName='Helvetica')))
        elements.append(Spacer(1, 16))
        return

    tbl = Table(rows, colWidths=[36 * mm, 22 * mm, 22 * mm, 22 * mm, 26 * mm, 40 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('PADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER), ('BOX', (0, 0), (-1, -1), 0.8, INTERNAL_FUNCTIONAL_ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (1, 0), (5, -1), 'CENTER'),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


def build_functional_coverage_charts(elements, tests):
    _fn_chapter_header(elements, '2', 'Functional Coverage')

    try:
        chart_img, mods_data = _make_functional_module_chart(tests)
        cat_desc = ('This chart compares passed and failed checks across each functional module, '
                    'helping you quickly spot which area needs attention.')
        worst_mod = max(mods_data, key=lambda c: mods_data[c]['fail']) if mods_data else None
        if worst_mod and mods_data[worst_mod]['fail'] > 0:
            cat_insight = (f'{worst_mod} currently has the most failures ({mods_data[worst_mod]["fail"]}) — '
                            f'this is the module to prioritize first.')
        else:
            cat_insight = 'No module shows any failures — coverage is currently clean across the board.'
        framed = Table([[chart_img]], colWidths=[161 * mm])
        framed.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, INTERNAL_FUNCTIONAL_ACCENT), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(section_header('', 'Functional Results by Module', INTERNAL_FUNCTIONAL_ACCENT))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f'<font color="#64748b" size="7.5"><i>{cat_desc}</i></font>',
                                   ParagraphStyle('FnCatDesc', fontSize=7.5, fontName='Helvetica', leading=10)))
        elements.append(Spacer(1, 8))
        elements.append(framed)
        elements.append(Spacer(1, 6))
        elements.append(_insight_box(cat_insight, '#0EA5E9'))
        elements.append(Spacer(1, 16))
    except Exception:
        pass

    try:
        donut_img, counts = _make_functional_distribution_donut(tests)
        total_c = sum(counts.values()) or 1
        dist_insight = (
            f'Out of {total_c} executed checks: {counts["pass"]} passed '
            f'({round(counts["pass"]/total_c*100)}%), {counts["fail"]} failed '
            f'({round(counts["fail"]/total_c*100)}%), and {counts["skip"]} skipped '
            f'({round(counts["skip"]/total_c*100)}%).')
        framed_dist = Table([[donut_img]], colWidths=[161 * mm])
        framed_dist.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, INTERNAL_FUNCTIONAL_ACCENT), ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(section_header('', 'Functional Test Result Distribution', INTERNAL_FUNCTIONAL_ACCENT))
        elements.append(Spacer(1, 8))
        elements.append(framed_dist)
        elements.append(Spacer(1, 6))
        elements.append(_insight_box(dist_insight, '#0EA5E9'))
        elements.append(Spacer(1, 16))
    except Exception:
        pass


# ── SECTION 03 — Test Details ────────────────────────────────────────────────

def build_functional_environment_info(elements, generation_data, tests):
    total_ms = _total_duration_ms(tests)
    exec_time_disp = f'{total_ms/1000:.2f}s' if total_ms else 'N/A'
    app_name = _app_name(generation_data)

    items = [
        ('APPLICATION', app_name, '#0EA5E9'),
        ('ENVIRONMENT', _environment(generation_data), '#6366f1'),
        ('FRAMEWORK', generation_data.get('framework', 'Playwright'), '#f59e0b'),
        ('TEST TYPE', 'Functional Testing', '#8b5cf6'),
        ('TOTAL SCENARIOS', str(len(tests)), '#10b981'),
        ('EXECUTION TIME', exec_time_disp, '#ec4899'),
    ]

    def _env_card(label, value, color):
        cell = Table([[Paragraph(
            f'<font color="{color}" size="7"><b>{label}</b></font><br/>'
            f'<font color="#1e293b" size="10.5"><b>{value}</b></font>',
            ParagraphStyle('FnEnvC', fontSize=9, fontName='Helvetica', leading=15, alignment=TA_CENTER))
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
            row_cells.append(Paragraph('', ParagraphStyle('FnEnvEmpty')))
        card_rows.append(row_cells)
    outer = Table(card_rows, colWidths=[56 * mm] * 3)
    outer.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(KeepTogether([
        section_header('', 'Execution Environment', INTERNAL_FUNCTIONAL_ACCENT), Spacer(1, 6),
        Paragraph('<font color="#64748b" size="7.5"><i>Application and framework details used to run '
                  'this functional audit — for reproducibility of the results below.</i></font>',
                  ParagraphStyle('FnEnvInfo', fontSize=7.5, fontName='Helvetica', leading=10)),
        Spacer(1, 6), outer,
    ]))
    elements.append(Spacer(1, 16))


def build_functional_detailed_results(elements, tests):
    elements.append(section_header('', 'Detailed Functional Test Results', TEAL))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Real results from Playwright execution against the live '
        'application. Every value comes directly from the test runner.</i></font>',
        ParagraphStyle('FnDRInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>', ParagraphStyle('FnDH0', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Test Case</b></font>', ParagraphStyle('FnDH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Module</b></font>', ParagraphStyle('FnDH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('FnDH3', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('FnDH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Time</b></font>', ParagraphStyle('FnDH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Result</b></font>', ParagraphStyle('FnDH6', fontSize=8, fontName='Helvetica-Bold')),
    ]
    rows = [hdr]
    row_styles = []
    for i, t in enumerate(tests):
        status = t.get('status', 'skip')
        sc = '#10b981' if status == 'pass' else '#ef4444' if status == 'fail' else '#f59e0b'
        s_label = '✓ PASS' if status == 'pass' else '✗ FAIL' if status == 'fail' else '■ SKIP'
        s_bg = HexColor('#f0fdf4') if status == 'pass' else HexColor('#fef2f2') if status == 'fail' else HexColor('#fffbeb')
        mod_label, mod_color = _functional_module_label(t)
        priority = (t.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b')
        action = _get_action(t)
        reason = t.get('reason') or t.get('reason_pass') or t.get('suite') or t.get('error') or '—'
        duration = t.get('duration', '—')

        rows.append([
            Paragraph(f'<font color="#64748b"><b>{i+1}</b></font>', ParagraphStyle('FnDID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(
                f'<b><font color="#1e293b" size="7.5">{t.get("name","")[:32]}</font></b><br/>'
                f'<font color="#4f46e5" size="6.5">{action}</font>',
                ParagraphStyle('FnDN', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="{mod_color}"><b>{mod_label.upper()}</b></font>', ParagraphStyle('FnDC', fontSize=6, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('FnDP', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{sc}"><b>{s_label}</b></font>', ParagraphStyle('FnDS', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#64748b" size="7">{duration}</font>', ParagraphStyle('FnDD', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="6.5">{str(reason)[:60]}</font>', ParagraphStyle('FnDR', fontSize=6.5, fontName='Helvetica', leading=9)),
        ])
        row_styles.append(('BACKGROUND', (4, i + 1), (4, i + 1), s_bg))

    tbl = Table(rows, colWidths=[7*mm, 44*mm, 22*mm, 16*mm, 16*mm, 14*mm, 42*mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 6), ('LINEBELOW', (0, 0), (-1, -1), 0.4, BORDER),
        ('BOX', (0, 0), (-1, -1), 0.8, TEAL), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'), ('ALIGN', (2, 0), (5, -1), 'CENTER'),
        ('LINEBEFORE', (6, 1), (6, -1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ── SECTION 04 — AI Insights & Recommendations ───────────────────────────────

def build_functional_ai_recommendations_table(elements, tests, ai_data):
    recs = (ai_data or {}).get('recommendations', []) or []
    elements.append(section_header('', 'AI Recommendations', HexColor('#4f46e5')))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Recommendations generated only for issues detected on '
        'this application.</i></font>',
        ParagraphStyle('FnRSInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    if recs:
        hdr = [
            Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('FnRH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('FnRH2', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Issue</b></font>', ParagraphStyle('FnRH3', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Recommendation</b></font>', ParagraphStyle('FnRH4', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Severity</b></font>', ParagraphStyle('FnRH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ]
        rows = [hdr]
        row_styles = []
        for i, rec in enumerate(recs):
            priority = (rec.get('priority') or 'medium').lower()
            pc = PRIORITY_COLORS.get(priority, '#f59e0b')
            severity = (rec.get('severity') or priority).upper()
            rows.append([
                Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('FnRP', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
                Paragraph(f'<font color="#4f46e5" size="7.5"><b>{(rec.get("category","") or "").upper()}</b></font>', ParagraphStyle('FnRC', fontSize=7.5, fontName='Helvetica-Bold')),
                Paragraph(f'<font color="#1e293b" size="7.5">{rec.get("issue","")[:60]}</font>', ParagraphStyle('FnRI', fontSize=7.5, fontName='Helvetica', leading=10)),
                Paragraph(f'<font color="#475569" size="7.5">{rec.get("fix", rec.get("recommendation",""))[:70]}</font>', ParagraphStyle('FnRF', fontSize=7.5, fontName='Helvetica', leading=10)),
                Paragraph(f'<font color="{pc}"><b>{severity}</b></font>', ParagraphStyle('FnRSev', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
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
        elements.append(Paragraph('<font color="#94a3b8" size="8">No issues detected on this application — '
                                   'no recommendations needed for this run.</font>',
                                   ParagraphStyle('FnNoRec', fontSize=8, fontName='Helvetica')))
        
    # ── Deployment Readiness (was missing — present in the API report) ──
    critical_fail = any(_is_critical_functional_fail(t) for t in tests)
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    if critical_fail:
        depl_text = 'This application is NOT ready for the next deployment — critical checks failed.'
        depl_color = '#ef4444'
    elif fail_count > 0:
        depl_text = f'This application is ready with caution — {fail_count} secondary check(s) failed. Review before proceeding.'
        depl_color = '#f59e0b'
    else:
        depl_text = 'This application is ready — all checks passed, stable for the next deployment.'
        depl_color = '#10b981'
    elements.append(sub_section_header('Deployment Readiness', depl_color))
    elements.append(Spacer(1, 4))
    elements.append(_insight_box(depl_text, depl_color, label='Summary'))
    elements.append(Spacer(1, 16))
    
    

def build_functional_ai_focus_sections(elements, tests, ai_data, app_name):
    """Functional Analysis, Failed Functionalities Analysis, Stability Analysis —
    only renders sub-sections relevant to what was actually tested."""
    elements.append(section_header('', 'Functional Analysis', HexColor('#4f46e5')))
    elements.append(Spacer(1, 8))

    def _related(mod_name):
        return [t for t in tests if _functional_module_label(t)[0] == mod_name]

    def _narrative(title, mod_name, color):
        related = _related(mod_name)
        total_n = len(related)
        if total_n == 0:
            return
        fail_n = sum(1 for t in related if t.get('status') == 'fail')
        if fail_n == 0:
            text = f'All {total_n} check(s) passed for {title.split(" Analysis")[0].lower()} — fully operational, no issues detected.'
        else:
            failing = [t.get('name', '') for t in related if t.get('status') == 'fail'][:3]
            text = f'{fail_n} of {total_n} check(s) failed: {", ".join(failing)}. Investigate before further testing.'
        elements.append(sub_section_header(title, color))
        elements.append(Spacer(1, 4))
        elements.append(_insight_box(text, color, label='Summary'))
        elements.append(Spacer(1, 10))

    _narrative('Authentication Analysis', 'Authentication', '#6366f1')
    _narrative('Dashboard Analysis', 'Dashboard', '#0ea5e9')
    _narrative('Project Management Analysis', 'Project Management', '#10b981')
    _narrative('Test Generation Analysis', 'Test Generation', '#f59e0b')
    _narrative('Test Execution Analysis', 'Test Execution', '#8b5cf6')
    _narrative('Reports Analysis', 'Reports', '#ec4899')
    _narrative('User Management Analysis', 'User Management', '#14b8a6')
    _narrative('Settings Analysis', 'Settings', '#64748b')

    # ── Failed Functionalities Analysis ──
    failed = [t for t in tests if t.get('status') == 'fail']
    if failed:
        text = (f'{len(failed)} functionality/functionalities failed: '
                f'{", ".join(t.get("name","") for t in failed[:5])}'
                f'{"…" if len(failed) > 5 else ""}. These should be triaged before the next release.')
    else:
        text = 'No functional failures were detected in this run — every tested workflow completed successfully.'
    elements.append(sub_section_header('Failed Functionalities Analysis', '#ef4444'))
    elements.append(Spacer(1, 4))
    elements.append(_insight_box(text, '#ef4444', label='Summary'))
    elements.append(Spacer(1, 10))

    # ── Stability Analysis ──
    critical_fail = any(_is_critical_functional_fail(t) for t in tests)
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    if critical_fail:
        affected = sorted({_functional_module_label(t)[0] for t in tests if _is_critical_functional_fail(t)})
        stab_text = (f'Application stability is at risk — critical workflows ({", ".join(affected)}) show '
                     f'failures that affect core user journeys.')
        stab_color = '#ef4444'
    elif fail_count > 0:
        stab_text = (f'Application is mostly stable — {fail_count} non-critical issue(s) were detected, '
                     f'but core workflows remain functional.')
        stab_color = '#f59e0b'
    else:
        stab_text = 'Application is stable — all functional checks passed with no regressions detected in this run.'
        stab_color = '#10b981'
    elements.append(sub_section_header('Stability Analysis', stab_color))
    elements.append(Spacer(1, 4))
    elements.append(_insight_box(stab_text, stab_color, label='Summary'))
    elements.append(Spacer(1, 16))


def build_functional_action_plan(elements, ai_data):
    action_plan = (ai_data or {}).get('action_plan', []) or []
    if not action_plan:
        return
    elements.append(section_header('', 'AI Action Plan', GOLD))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>Priority</b></font>', ParagraphStyle('FnAH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Category</b></font>', ParagraphStyle('FnAH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Action</b></font>', ParagraphStyle('FnAH3', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Expected Impact</b></font>', ParagraphStyle('FnAH4', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Status</b></font>', ParagraphStyle('FnAH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    for i, item in enumerate(action_plan):
        if isinstance(item, str):
            item = {'priority': 'medium', 'category': 'General', 'action': item,
                     'impact': None, 'status': 'To Do'}
        priority = (item.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b')
        category_disp = item.get('category', '') or 'General'
        impact_val = item.get('impact') or item.get('expected_impact') or ''
        if not impact_val:
            impact_val = f'Resolves this {category_disp.lower()} issue and improves overall functional stability'
        rows.append([
            Paragraph(f'<font color="{pc}"><b>{priority.upper()}</b></font>', ParagraphStyle('FnAP', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#4f46e5" size="7.5"><b>{(category_disp or "").upper()}</b></font>', ParagraphStyle('FnAC', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#1e293b" size="7.5">{item.get("action","")}</font>', ParagraphStyle('FnAA', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#475569" size="7.5">{impact_val}</font>', ParagraphStyle('FnAI', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#64748b" size="7">⏳ {item.get("status","To Do")}</font>', ParagraphStyle('FnASt', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)),
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

def build_functional_certificate_details(elements, generation_data, tests, score, app_name):
    grade, _ = _grade_from_score(score)
    total_ms = _total_duration_ms(tests)
    avg_ms = _avg_duration_ms(tests)
    exec_time_disp = f'{total_ms/1000:.2f}s' if total_ms else 'N/A'

    details = [
        ('Validation Date',      datetime.now().strftime('%Y-%m-%d  %H:%M'), '#0EA5E9', HexColor('#f0f9ff')),
        ('Framework',            generation_data.get('framework', 'Playwright'), '#0EA5E9', HexColor('#f0f9ff')),
        ('Environment',          _environment(generation_data), '#6366f1', HexColor('#eef2ff')),
        ('Application',          app_name, '#6366f1', HexColor('#eef2ff')),
        ('Execution Time',       exec_time_disp, '#8b5cf6', HexColor('#f5f3ff')),
        ('Avg Test Duration',    f'{avg_ms:.0f}ms' if avg_ms else 'N/A', '#8b5cf6', HexColor('#f5f3ff')),
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
            ParagraphStyle('FnCertDet', fontSize=8, fontName='Helvetica', leading=12))
            for lbl, val, color, bg in chunk]
        if len(row) < 2:
            row.append(Paragraph('', ParagraphStyle('FnCertDetEmpty')))
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
                  '</i></font>', ParagraphStyle('FnCertDetInfo', fontSize=7.5, fontName='Helvetica', leading=10)),
        Spacer(1, 6),
        det_tbl,
    ]))
    elements.append(Spacer(1, 10))


# ═════════════════════════════════════════════════════════════════════════════
# MAIN PDF GENERATOR
# ═════════════════════════════════════════════════════════════════════════════

def _generate_internal_functional_pdf(generation_data: dict, tests: list, ai_data: dict) -> bytes:
    buffer = BytesIO()
    app_name = _app_name(generation_data)
    environment = _environment(generation_data)
    framework = generation_data.get('framework', 'Playwright')

    pass_count = sum(1 for t in tests if t.get('status') == 'pass')
    fail_count = sum(1 for t in tests if t.get('status') == 'fail')
    skip_count = sum(1 for t in tests if t.get('status') not in ('pass', 'fail'))
    total = len(tests) or 1
    pass_rate = round(pass_count / total * 100)
    rate_color = '#10b981' if pass_rate >= 80 else '#f59e0b' if pass_rate >= 50 else '#ef4444'

    score, score_label, score_color = _compute_internal_functional_score(tests)

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

    def on_page_internal_functional(canvas, doc):
        W, H = A4
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, H - 52 * mm, W, 52 * mm, fill=1, stroke=0)
        canvas.setFillColor(INTERNAL_FUNCTIONAL_ACCENT)
        canvas.rect(0, H - 54 * mm, W, 2 * mm, fill=1, stroke=0)
        canvas.setFillColor(INTERNAL_FUNCTIONAL_ACCENT)
        canvas.rect(0, 0, 3, H - 54 * mm, fill=1, stroke=0)
        canvas.setFillColor(LIGHT_BG)
        canvas.rect(0, 0, W, 14 * mm, fill=1, stroke=0)
        canvas.setFillColor(BORDER)
        canvas.rect(0, 14 * mm, W, 0.5, fill=1, stroke=0)
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 5 * mm, 'Generated by NexTest — Internal Functional Test Report')
        canvas.drawRightString(W - 20 * mm, 5 * mm, f'Page {doc.page}  •  {datetime.now().strftime("%Y-%m-%d")}')
        canvas.restoreState()

    elements = []

    # ── COVER ─────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph('<font color="#ec4899"><b>NEX</b></font><font color="#ffffff">TEST</font>',
                  ParagraphStyle('FnLogo', fontSize=24, fontName='Helvetica-Bold')),
        Paragraph(f'<font color="#64748b">Generated</font><br/>'
                  f'<font color="#94a3b8">{datetime.now().strftime("%B %d, %Y  •  %H:%M")}</font>',
                  ParagraphStyle('FnDate', fontSize=8.5, fontName='Helvetica', alignment=TA_RIGHT, leading=13)),
    ]]
    header_tbl = Table(header_data, colWidths=[90 * mm, 78 * mm])
    header_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(Spacer(1, -38 * mm))
    elements.append(header_tbl)
    elements.append(Spacer(1, 6 * mm))
    elements.append(Paragraph('Internal Functional Test Report',
                               ParagraphStyle('FnTitle', fontSize=22, textColor=WHITE,
                                              fontName='Helvetica-Bold', spaceAfter=2)))
    elements.append(Spacer(1, 14 * mm))

    info_tbl = Table([
        [Paragraph('<font color="#64748b">Application Name</font>', ParagraphStyle('FnIL1', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{app_name}</font>', ParagraphStyle('FnIV1', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Environment</font>', ParagraphStyle('FnIL2', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{environment}</font>', ParagraphStyle('FnIV2', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Test Framework</font>', ParagraphStyle('FnIL3', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#6366f1"><b>{framework}</b></font>', ParagraphStyle('FnIV3', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Test Type</font>', ParagraphStyle('FnIL4', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph('<font color="#6366f1"><b>Functional Testing</b></font>', ParagraphStyle('FnIV4', fontSize=8.5, fontName='Helvetica', leading=12))],
        [Paragraph('<font color="#64748b">Generated</font>', ParagraphStyle('FnIL5', fontSize=8, fontName='Helvetica-Bold', leading=12)),
         Paragraph(f'<font color="#1e293b">{datetime.now().strftime("%Y-%m-%d  %H:%M")}</font>', ParagraphStyle('FnIV5', fontSize=8.5, fontName='Helvetica', leading=12))],
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
    elements.append(section_header('', 'Test Summary', INTERNAL_FUNCTIONAL_ACCENT))
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
        '<font color="#94a3b8" size="7"><i>Pass Rate is the raw proportion of scenarios that succeeded '
        'on this application. The Functional Health Score further below is severity-weighted — '
        'Authentication and Project Management checks count more.</i></font>',
        ParagraphStyle('FnRateNote', fontSize=7, fontName='Helvetica', leading=9)))
    elements.append(Spacer(1, 20))

    _fn_chapter_header(elements, '1', 'Functional Test Summary')
    build_functional_overview_hero(elements, tests, ai_data, score, score_label, score_color, pass_rate, app_name)
    build_functional_key_metrics_cards(elements, generation_data, tests)
    build_functional_modules_covered(elements, tests, app_name)
    build_functional_score_hero(elements, score, score_label, score_color)
    build_functional_methodology(elements, tests, generation_data)
    build_functional_category_summary(elements, tests)

    build_functional_coverage_charts(elements, tests)

    _fn_chapter_header(elements, '3', 'Test Details')
    build_functional_environment_info(elements, generation_data, tests)
    build_functional_detailed_results(elements, tests)

    _fn_chapter_header(elements, '4', 'AI Insights & Recommendations')
    build_functional_ai_recommendations_table(elements, tests, ai_data)
    build_functional_ai_focus_sections(elements, tests, ai_data, app_name)
    build_functional_action_plan(elements, ai_data)

    _fn_chapter_header(elements, '5', 'Report Conclusion')
    elements.append(section_header('', 'Final AI Verdict', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 6))

    critical_fail = any(_is_critical_functional_fail(t) for t in tests)
    if critical_fail:
        vc, vb, vbrd, risk_level = '#ef4444', HexColor('#fef2f2'), RED, 'HIGH'
        vt = (f'Internal Functional Test FAILED — critical checks did not pass on {app_name}. '
              f'Authentication or Project Management workflow issues were detected. This application '
              f'is NOT ready for further testing until resolved.')
    elif fail_count > 0:
        vc, vb, vbrd, risk_level = '#b45309', HexColor('#fffbeb'), ORANGE, 'MEDIUM'
        vt = (f'Internal Functional Test passed with {fail_count} non-critical issue(s) on {app_name}. '
              f'Core workflows are accessible and stable, but the failing checks should be reviewed '
              f'before proceeding to deeper testing.')
    else:
        vc, vb, vbrd, risk_level = '#059669', HexColor('#f0fdf4'), GREEN, 'LOW'
        vt = (f'Internal Functional Test PASSED — all {pass_count} check(s) succeeded on {app_name}. '
              f'This application is stable and ready for deeper regression testing.')

    final_tbl = Table([[Paragraph(
    f'<font color="{vc}" size="9"><b>Final Functional Verdict</b></font><br/>'
    f'<font color="{vc}" size="8">{vt}</font><br/><br/>'
    f'<font color="#64748b" size="8"><b>Functional Health Score: </b></font>'
    f'<font color="{vc}" size="8"><b>{score}/100</b></font>'
    f'<font color="#94a3b8" size="8">    |    </font>'
    f'<font color="#64748b" size="8"><b>Risk Level: </b></font>'
    f'<font color="{vc}" size="8"><b>{risk_level}</b></font>'
    f'<font color="#94a3b8" size="8">    |    </font>'
    f'<font color="#64748b" size="8"><b>Deployment Readiness: </b></font>'
    f'<font color="{vc}" size="8"><b>{score_label}</b></font>',
    ParagraphStyle('FnFV', fontSize=8, fontName='Helvetica', leading=13))
]], colWidths=[168 * mm])
    final_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), vb), ('BOX', (0, 0), (-1, -1), 2, vbrd),
        ('LEFTPADDING', (0, 0), (-1, -1), 14), ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12), ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(final_tbl)
    elements.append(Spacer(1, 20))

    # ── CERTIFICATE ───────────────────────────────────────────────────────
    elements.append(section_header('', 'Certificate of Internal Functional Validation', INTERNAL_FUNCTIONAL_ACCENT))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Official validation summary confirming the outcome of this '
        'functional test run — issued automatically by NexTest AI.</i></font>',
        ParagraphStyle('FnCertInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))
    cert_data = {'global_score': score, 'score_label': score_label, 'score_color': score_color}
    elements.append(_build_certificate_card(cert_data, app_name, title="CERTIFICATE OF INTERNAL FUNCTIONAL VALIDATION"))
    build_functional_certificate_details(elements, generation_data, tests, score, app_name)
    elements.append(Spacer(1, 10))

    doc.build(elements, onFirstPage=on_page_internal_functional, onLaterPages=on_page_internal_functional)
    return buffer.getvalue()


def _extract_internal_functional_inputs(generation_data: dict):
    """Shared extraction logic — same conventions as internal_api_pdf.py."""
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


def generate_internal_functional_pdf(generation_data: dict) -> bytes:
    """Public entry point — pass the same generation_data shape used by your
    other report generators. Only modules actually present in
    `execution_results` / `test_cases` are analyzed and rendered. No
    screenshots are included."""
    tests, ai_data = _extract_internal_functional_inputs(generation_data)
    return _generate_internal_functional_pdf(generation_data, tests, ai_data)


def generate_internal_functional_xlsx(generation_data: dict) -> bytes:
    """XLSX version of the Internal Functional Test Report — same sections/data
    as the PDF report, structured as a multi-sheet workbook."""
    tests, ai_data = _extract_internal_functional_inputs(generation_data)
    app_name = _app_name(generation_data)
    environment = _environment(generation_data)
    framework = generation_data.get('framework', 'Playwright')

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
    critical_fail = any(_is_critical_functional_fail(t) for t in tests)

    wb = Workbook()

    # ═══ SHEET 1 — Overview ═══
    ws = wb.active
    ws.title = "Overview"
    ws.sheet_view.showGridLines = False

    ws.merge_cells("A1:H3")
    for r_ in range(1, 4):
        for c_ in range(1, 9):
            ws.cell(row=r_, column=c_).fill = PatternFill("solid", fgColor="0A0F1E")
    ws["A1"] = "NEXTEST — Internal Functional Test Report"
    ws["A1"].font = Font(name=_XLSX_FONT, bold=True, size=20, color="EC4899")
    ws["A1"].alignment = Alignment(horizontal="left", vertical="center", indent=1)

    ws.merge_cells("A4:H4")
    ws["A4"] = f"Generated {datetime.now().strftime('%B %d, %Y  •  %H:%M')}"
    ws["A4"].font = Font(name=_XLSX_FONT, italic=True, size=9, color="64748B")

    info_rows = [
        ("Application Name", app_name),
        ("Environment", environment),
        ("Test Framework", framework),
        ("Test Type", "Functional Testing"),
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

    overall_status = 'CRITICAL ISSUES' if critical_fail else ('PASSED W/ WARNINGS' if fail_count > 0 else 'ALL CHECKS PASSED')
    risk_level = 'HIGH' if critical_fail else ('MEDIUM' if fail_count > 0 else 'LOW')
    deploy_text = 'NOT READY' if critical_fail else ('READY W/ CAUTION' if fail_count > 0 else 'READY')
    status_color = "EF4444" if critical_fail else ("F59E0B" if fail_count > 0 else "10B981")

    ws.cell(row=r, column=1, value="Functional Test Summary").font = Font(
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
            f'This functional test run executed {total} scenario(s) against {app_name}, with '
            f'{pass_count} passed and {fail_count} failed ({pass_rate}% pass rate). '
            + ('Critical workflow failures were detected.' if critical_fail
               else 'No critical workflow failures were detected.'))
    r = _fn_xlsx_wrapped(ws, r, ai_summary_text, Font(name=_XLSX_FONT, size=9, color="475569"),
                          fill="F8FAFC", end_col=8)
    r += 1

    # ── Module Breakdown chart ──
    mod_hdr_row = r
    _fn_xlsx_header_row(ws, r, ["Module", "Total", "Passed", "Failed"])
    r += 1
    mods = {m: {'pass': 0, 'fail': 0, 'total': 0} for m in FUNCTIONAL_MODULE_ORDER}
    for t in tests:
        label, _ = _functional_module_label(t)
        mods[label]['total'] += 1
        if t.get('status') == 'pass':
            mods[label]['pass'] += 1
        elif t.get('status') == 'fail':
            mods[label]['fail'] += 1
    for m in FUNCTIONAL_MODULE_ORDER:
        d = mods[m]
        if d['total'] == 0:
            continue
        mc = FUNCTIONAL_MODULE_META.get(m, '#64748b').lstrip('#').upper()
        c1 = ws.cell(row=r, column=1, value=m)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color=mc)
        c1.border = _XLSX_BORDER
        for i, v in enumerate([d['total'], d['pass'], d['fail']], start=2):
            c = ws.cell(row=r, column=i, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
            c.alignment = Alignment(horizontal="center")
            c.border = _XLSX_BORDER
        r += 1
    chart_end = r - 1

    if chart_end >= mod_hdr_row + 1:
        chart = BarChart()
        chart.type = "col"
        chart.title = "Functional Results by Module"
        chart.y_axis.title = "Checks"
        cats_ref = Reference(ws, min_col=1, min_row=mod_hdr_row + 1, max_row=chart_end)
        pass_ref = Reference(ws, min_col=3, min_row=mod_hdr_row, max_row=chart_end)
        fail_ref = Reference(ws, min_col=4, min_row=mod_hdr_row, max_row=chart_end)
        chart.add_data(pass_ref, titles_from_data=True)
        chart.add_data(fail_ref, titles_from_data=True)
        chart.set_categories(cats_ref)
        chart.series[0].graphicalProperties.solidFill = "10B981"
        chart.series[1].graphicalProperties.solidFill = "EF4444"
        chart.width = 18
        chart.height = 9
        ws.add_chart(chart, f"A{chart_end + 2}")

        # ── Donut distribution chart ──
        dist_hdr_row = chart_end + 21
        _fn_xlsx_header_row(ws, dist_hdr_row, ["Outcome", "Count"])
        dist_vals = [("Passed", pass_count), ("Failed", fail_count), ("Skipped", skip_count)]
        dr = dist_hdr_row + 1
        for lbl, val in dist_vals:
            c1 = ws.cell(row=dr, column=1, value=lbl)
            c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color="1E293B")
            c1.border = _XLSX_BORDER
            c2 = ws.cell(row=dr, column=2, value=val)
            c2.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
            c2.alignment = Alignment(horizontal="center")
            c2.border = _XLSX_BORDER
            dr += 1
        doughnut = DoughnutChart()
        doughnut.title = "Functional Test Result Distribution"
        data_ref = Reference(ws, min_col=2, min_row=dist_hdr_row, max_row=dr - 1)
        cats_ref2 = Reference(ws, min_col=1, min_row=dist_hdr_row + 1, max_row=dr - 1)
        doughnut.add_data(data_ref, titles_from_data=True)
        doughnut.set_categories(cats_ref2)
        doughnut.width = 14
        doughnut.height = 9
        doughnut.firstSliceAng = 0
        doughnut.holeSize = 55

        dist_colors = ["10B981", "EF4444", "F59E0B"]  # Passed, Failed, Skipped
        series = doughnut.series[0]
        for i, color in enumerate(dist_colors):
            pt = DataPoint(idx=i)
            pt.graphicalProperties.solidFill = color
            series.data_points.append(pt)

        doughnut.dataLabels = DataLabelList()
        doughnut.dataLabels.showPercent = True
        doughnut.dataLabels.showCatName = False
        doughnut.dataLabels.showVal = False

        # Placé SOUS le tableau (au lieu d'à côté)
        ws.add_chart(doughnut, f"A{dr + 2}")

    _fn_xlsx_autofit(ws, [24, 12, 12, 12, 14, 14, 14, 14])
    ws.freeze_panes = "A6"

    # ═══ SHEET 2 — Modules Covered ═══
    ws2 = wb.create_sheet("Modules Covered")
    ws2.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws2, 1, ["#", "Module", "Checks", "Passed", "Failed", "Status"])
    ws2.freeze_panes = "A2"

    r = 2
    for i, m in enumerate([m for m in FUNCTIONAL_MODULE_ORDER if mods[m]['total'] > 0], start=1):
        d = mods[m]
        verdict = 'PASS' if d['fail'] == 0 else 'FAIL'
        row_bg = "D1FAE5" if d['fail'] == 0 else "FEE2E2"
        mc = FUNCTIONAL_MODULE_META.get(m, '#64748b').lstrip('#').upper()
        vals = [i, m, d['total'], d['pass'], d['fail'], verdict]
        for col, v in enumerate(vals, start=1):
            c = ws2.cell(row=r, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (2, 6)),
                          color=(mc if col == 2 else ("EF4444" if verdict == "FAIL" else "10B981") if col == 6 else "1E293B"))
            c.fill = PatternFill("solid", fgColor=row_bg)
            c.alignment = Alignment(horizontal="center" if col != 2 else "left", vertical="center")
            c.border = _XLSX_BORDER
        r += 1
    if not any(mods[m]['total'] > 0 for m in FUNCTIONAL_MODULE_ORDER):
        ws2.merge_cells("A2:F2")
        c = ws2.cell(row=2, column=1, value="No modules recorded for this run.")
        c.font = Font(name=_XLSX_FONT, italic=True, size=9, color="94A3B8")
    _fn_xlsx_title(ws2, "FUNCTIONAL MODULES COVERED", "EC4899")
    _fn_xlsx_autofit(ws2, [5, 24, 12, 12, 12, 12])

    # ═══ SHEET 3 — Test Scenarios ═══
    ws3 = wb.create_sheet("Test Scenarios")
    ws3.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws3, 1, ["#", "Scenario", "Module", "Priority", "Expected"])
    ws3.freeze_panes = "A2"

    for i, t in enumerate(tests, start=2):
        mod_label, mod_color = _functional_module_label(t)
        priority = (t.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b').lstrip('#').upper()
        expected = t.get('suite') or t.get('expected') or t.get('description') or 'Workflow completes without error'
        vals = [i - 1, t.get('name', ''), mod_label.upper(), priority.upper(), str(expected)[:120]]
        for col, v in enumerate(vals, start=1):
            c = ws3.cell(row=i, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (3, 4)),
                          color=(mod_color.lstrip('#').upper() if col == 3 else pc if col == 4 else "1E293B"))
            c.alignment = Alignment(horizontal="center" if col in (1, 3, 4) else "left", vertical="top", wrap_text=(col == 5))
            c.border = _XLSX_BORDER
    _fn_xlsx_title(ws3, "FUNCTIONAL TEST SCENARIOS", "EC4899")
    _fn_xlsx_autofit(ws3, [5, 42, 22, 12, 55])

    # ═══ SHEET 4 — Results by Category ═══
    ws4 = wb.create_sheet("Results by Category")
    ws4.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws4, 1, ["Category", "Total", "Passed", "Failed", "Pass Rate", "Verdict"])
    ws4.freeze_panes = "A2"

    row = 2
    for m in FUNCTIONAL_MODULE_ORDER:
        d = mods[m]
        if d['total'] == 0:
            continue
        rate = round(d['pass'] / d['total'] * 100)
        verdict = 'PASS' if d['fail'] == 0 else 'FAIL'
        bg = "D1FAE5" if d['fail'] == 0 else "FEE2E2"
        mc = FUNCTIONAL_MODULE_META.get(m, '#64748b').lstrip('#').upper()
        vals = [m, d['total'], d['pass'], d['fail'], f"{rate}%", verdict]
        for col, v in enumerate(vals, start=1):
            c = ws4.cell(row=row, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (1, 6)),
                          color=(mc if col == 1 else ("EF4444" if verdict == "FAIL" else "10B981") if col == 6 else "1E293B"))
            c.fill = PatternFill("solid", fgColor=bg)
            c.alignment = Alignment(horizontal="center" if col > 1 else "left", vertical="center")
            c.border = _XLSX_BORDER
        row += 1
    _fn_xlsx_title(ws4, "RESULTS BY CATEGORY", "EC4899")
    _fn_xlsx_autofit(ws4, [24, 10, 10, 10, 12, 12])

    # ═══ SHEET 5 — Detailed Results ═══
    ws5 = wb.create_sheet("Detailed Results")
    ws5.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws5, 1, ["#", "Test Case", "Module", "Priority", "Status", "Execution Time", "Result"])
    ws5.freeze_panes = "A2"

    STATUS_COLOR = {"pass": ("10B981", "D1FAE5"), "fail": ("EF4444", "FEE2E2"), "skip": ("F59E0B", "FFFBEB")}
    for i, t in enumerate(tests, start=2):
        status = t.get('status', 'skip')
        s_color, s_bg = STATUS_COLOR.get(status, ("94A3B8", "FFFFFF"))
        mod_label, mod_color = _functional_module_label(t)
        priority = (t.get('priority') or 'medium').lower()
        pc = PRIORITY_COLORS.get(priority, '#f59e0b').lstrip('#').upper()
        reason = t.get('reason') or t.get('reason_pass') or t.get('suite') or t.get('error') or '—'
        vals = [i - 1, t.get('name', ''), mod_label.upper(), priority.upper(), status.upper(),
                t.get('duration', '—'), str(reason)[:150]]
        for col, v in enumerate(vals, start=1):
            c = ws5.cell(row=i, column=col, value=v)
            c.font = Font(name=_XLSX_FONT, size=9, bold=(col in (3, 4, 5)),
                          color=(mod_color.lstrip('#').upper() if col == 3 else pc if col == 4 else s_color if col == 5 else "1E293B"))
            c.alignment = Alignment(horizontal="center" if col in (1, 3, 4, 5, 6) else "left", vertical="top", wrap_text=(col == 7))
            c.border = _XLSX_BORDER
            if col == 5:
                c.fill = PatternFill("solid", fgColor=s_bg)
        ws5.row_dimensions[i].height = 20
    _fn_xlsx_title(ws5, "DETAILED FUNCTIONAL TEST RESULTS", "0D9488")
    _fn_xlsx_autofit(ws5, [5, 42, 22, 12, 12, 14, 55])

    # ═══ SHEET 6 — AI Recommendations ═══
    ws6 = wb.create_sheet("AI Recommendations")
    ws6.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws6, 1, ["Priority", "Category", "Issue", "Fix"])

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
        c = ws6.cell(row=2, column=1, value="No issues detected on this application — no recommendations needed for this run.")
        c.font = Font(name=_XLSX_FONT, italic=True, size=9, color="94A3B8")
    _fn_xlsx_title(ws6, "AI RECOMMENDATIONS", "4F46E5")
    _fn_xlsx_autofit(ws6, [12, 18, 40, 55])

    # ═══ SHEET 7 — Action Plan ═══
    ws7 = wb.create_sheet("Action Plan")
    ws7.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws7, 1, ["Priority", "Category", "Action", "Expected Impact", "Status"])
    ws7.freeze_panes = "A2"

    action_plan = (ai_data or {}).get('action_plan', []) or []
    r = 2
    for item in action_plan:
        if isinstance(item, str):
            item = {'priority': 'medium', 'category': 'General', 'action': item, 'impact': None, 'status': 'To Do'}
        priority = (item.get('priority') or 'medium').lower()
        category_disp = item.get('category', '') or 'General'
        impact_val = item.get('impact') or item.get('expected_impact') or \
            f'Resolves this {category_disp.lower()} issue and improves overall functional stability'
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
    _fn_xlsx_title(ws7, "AI ACTION PLAN", "C9A227")
    _fn_xlsx_autofit(ws7, [12, 18, 40, 40, 12])

    # ═══ SHEET 8 — Environment ═══
    ws8 = wb.create_sheet("Environment")
    ws8.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws8, 1, ["Property", "Value"])
    ws8.freeze_panes = "A2"

    total_ms = _total_duration_ms(tests)
    avg_ms = _avg_duration_ms(tests)
    env_items = [
        ("Application", app_name),
        ("Environment", environment),
        ("Framework", framework),
        ("Test Type", "Functional Testing"),
        ("Total Scenarios", str(len(tests))),
        ("Execution Time", f'{total_ms/1000:.2f}s' if total_ms else 'N/A'),
        ("Avg Test Duration", f'{avg_ms:.0f}ms' if avg_ms else 'N/A'),
        ("NexTest Version", generation_data.get('nextest_version', '1.0.0')),
        ("Generated", datetime.now().strftime('%Y-%m-%d %H:%M')),
    ]
    r = 2
    for lbl, val in env_items:
        c1 = ws8.cell(row=r, column=1, value=lbl)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color="6366F1")
        c1.fill = PatternFill("solid", fgColor="F8FAFC")
        c1.border = _XLSX_BORDER
        c2 = ws8.cell(row=r, column=2, value=val)
        c2.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
        c2.border = _XLSX_BORDER
        r += 1
    _fn_xlsx_title(ws8, "ENVIRONMENT & EXECUTION INFO", "EC4899")
    _fn_xlsx_autofit(ws8, [24, 40])

    # ═══ SHEET 9 — Certificate ═══
    ws9 = wb.create_sheet("Certificate")
    ws9.sheet_view.showGridLines = False
    _fn_xlsx_header_row(ws9, 1, ["Property", "Value"])
    ws9.freeze_panes = "A2"

    if critical_fail:
        verdict_text = (f'Internal Functional Test FAILED — critical checks did not pass on {app_name}. '
                         f'This application is NOT ready for further testing until resolved.')
        verdict_color = "EF4444"
        risk_final = "HIGH"
    elif fail_count > 0:
        verdict_text = (f'Internal Functional Test passed with {fail_count} non-critical issue(s) on '
                         f'{app_name}. Review before proceeding to deeper testing.')
        verdict_color = "F59E0B"
        risk_final = "MEDIUM"
    else:
        verdict_text = f'Internal Functional Test PASSED — all {pass_count} check(s) succeeded on {app_name}.'
        verdict_color = "10B981"
        risk_final = "LOW"

    ws9.merge_cells("A1:B1")
    c = ws9.cell(row=1, column=1, value="Final Functional Verdict")
    c.font = Font(name=_XLSX_FONT, bold=True, size=13, color=verdict_color)
    r = 2
    r = _fn_xlsx_wrapped(ws9, r, verdict_text, Font(name=_XLSX_FONT, size=9, color=verdict_color),
                          fill=("D1FAE5" if risk_final == "LOW" else "FFFBEB" if risk_final == "MEDIUM" else "FEE2E2"),
                          end_col=2)
    ws9.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
    c = ws9.cell(row=r, column=1,
                 value=f"Functional Health Score: {pass_rate}/100  |  Risk Level: {risk_final}  |  Deployment Readiness: {pr_label}")
    c.font = Font(name=_XLSX_FONT, bold=True, size=10, color="1E293B")
    r += 2

    cert_details = [
        ("Validation Date", datetime.now().strftime('%Y-%m-%d  %H:%M')),
        ("Framework", framework),
        ("Environment", environment),
        ("Application", app_name),
        ("Execution Time", f'{total_ms/1000:.2f}s' if total_ms else 'N/A'),
        ("Avg Test Duration", f'{avg_ms:.0f}ms' if avg_ms else 'N/A'),
        ("Overall Grade", grade),
        ("AI Validation Status", "Verified by NexTest AI"),
    ]
    for lbl, val in cert_details:
        c1 = ws9.cell(row=r, column=1, value=lbl)
        c1.font = Font(name=_XLSX_FONT, bold=True, size=9, color="6366F1")
        c1.fill = PatternFill("solid", fgColor="F8FAFC")
        c1.border = _XLSX_BORDER
        c2 = ws9.cell(row=r, column=2, value=val)
        c2.font = Font(name=_XLSX_FONT, size=9, color="1E293B")
        c2.border = _XLSX_BORDER
        r += 1

    r += 2
    ws9.merge_cells(f"A{r}:B{r}")
    c = ws9.cell(row=r, column=1, value=f"{app_name}  —  {pass_rate}/100  ({pr_label})")
    c.font = Font(name=_XLSX_FONT, bold=True, size=12, color=pr_color)
    c.alignment = Alignment(horizontal="center")
    r += 2
    ws9.merge_cells(f"A{r}:B{r}")
    c = ws9.cell(row=r, column=1,
                 value=f"Validated by NexTest AI  •  {datetime.now().strftime('%Y-%m-%d')}")
    c.font = Font(name=_XLSX_FONT, italic=True, size=8, color="94A3B8")
    c.alignment = Alignment(horizontal="center")

    _fn_xlsx_title(ws9, "CERTIFICATE OF INTERNAL FUNCTIONAL VALIDATION", "EC4899")
    _fn_xlsx_autofit(ws9, [26, 40])

    # ── Ordre final ──
    order = ["Overview", "Modules Covered", "Test Scenarios", "Results by Category",
             "Detailed Results", "AI Recommendations", "Action Plan", "Environment", "Certificate"]
    wb._sheets = [wb[name] for name in order if name in wb.sheetnames]
    wb.active = 0

    buffer = _XL_BIO()
    wb.save(buffer)
    return buffer.getvalue()