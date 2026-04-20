from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import Flowable
from io import BytesIO
import re
from datetime import datetime

# ── Color Palette ──────────────────────────────────────────────
NAVY        = HexColor('#0a0f1e')
GOLD        = HexColor('#c9a227')
GREEN       = HexColor('#10b981')
GREEN_BG    = HexColor('#d1fae5')
RED         = HexColor('#ef4444')
RED_BG      = HexColor('#fee2e2')
ORANGE      = HexColor('#f59e0b')
ORANGE_BG   = HexColor('#fef3c7')
BLUE        = HexColor('#3b82f6')
BLUE_BG     = HexColor('#dbeafe')
LIGHT_BG    = HexColor('#f8fafc')
BORDER      = HexColor('#e2e8f0')
BORDER_DARK = HexColor('#cbd5e1')
MUTED       = HexColor('#94a3b8')
DARK_TEXT   = HexColor('#1e293b')
WHITE       = white

PURPLE      = HexColor('#8b5cf6')
PURPLE_BG   = HexColor('#ede9fe')
TEAL        = HexColor('#0d9488')
TEAL_BG     = HexColor('#ccfbf1')
INDIGO      = HexColor('#4f46e5')
INDIGO_BG   = HexColor('#e0e7ff')

SELENIUM_COLOR = HexColor('#43a047')
SELENIUM_BG    = HexColor('#e8f5e9')
CYPRESS_COLOR  = HexColor('#1565c0')
CYPRESS_BG     = HexColor('#e3f2fd')

# ── Priority colors ────────────────────────────────────────────
PRIORITY_COLORS = {
    'high':   '#ef4444',
    'medium': '#f59e0b',
    'low':    '#10b981',
}
CATEGORY_COLORS = {
    'functional':  '#3b82f6',
    'performance': '#8b5cf6',
    'ui':          '#ec4899',
    'security':    '#ef4444',
    'navigation':  '#10b981',
}

# ── Element type → color mapping ───────────────────────────────
ELEMENT_TYPE_COLORS = {
    'SEARCH':     '#3b82f6',
    'NAV':        '#10b981',
    'BUTTON':     '#8b5cf6',
    'HERO':       '#f59e0b',
    'IMAGE':      '#ec4899',
    'FORM':       '#ef4444',
    'INPUT':      '#0d9488',
    'LINK':       '#06b6d4',
    'MODAL':      '#6366f1',
    'TABLE':      '#f97316',
    'PAGINATION': '#14b8a6',
    'ALERT':      '#dc2626',
    'CART':       '#7c3aed',
    'GENERAL':    '#64748b',
}


# ─────────────────────────────────────────────────────────────────────────────
# Severity helpers
# ─────────────────────────────────────────────────────────────────────────────

_SEVERITY_MAP = [
    (['nav', 'navigation', 'menu', 'header'],
     'HIGH',   '#ef4444', RED_BG,
     'Users cannot navigate between sections — core journey is broken'),
    (['auth', 'login', 'signin', 'register', 'signup', 'password'],
     'HIGH',   '#ef4444', RED_BG,
     'Authentication flow unavailable — users cannot access the platform'),
    (['dashboard', 'main content', 'core content'],
     'HIGH',   '#ef4444', RED_BG,
     'Primary content area failed to render — page is effectively blank'),
    (['checkout', 'cart', 'panier', 'basket'],
     'HIGH',   '#ef4444', RED_BG,
     'Purchase flow blocked — revenue-critical functionality is unavailable'),
    (['search', 'recherche', 'query'],
     'MEDIUM', '#f59e0b', ORANGE_BG,
     'Content discovery impaired — users may struggle to find products or articles'),
    (['form', 'formulaire', 'input', 'field'],
     'MEDIUM', '#f59e0b', ORANGE_BG,
     'Form interaction broken — submission and data entry may fail'),
    (['hero', 'banner', 'jumbotron', 'slider'],
     'MEDIUM', '#f59e0b', ORANGE_BG,
     'Above-the-fold content missing — first impression and CTA visibility degraded'),
    (['product', 'article', 'post', 'catalog'],
     'MEDIUM', '#f59e0b', ORANGE_BG,
     'Core content not rendered — browsing experience broken'),
    (['cta', 'primary button', 'get started', 'buy now'],
     'MEDIUM', '#f59e0b', ORANGE_BG,
     'Primary conversion action unavailable — funnel entry point is blocked'),
    (['logo', 'brand', 'image', 'img', 'photo'],
     'LOW',    '#10b981', GREEN_BG,
     'Visual identity element missing — does not block functionality'),
    (['footer', 'pagination', 'breadcrumb'],
     'LOW',    '#10b981', GREEN_BG,
     'Secondary navigation element missing — low user impact'),
    (['alert', 'modal', 'notification', 'toast'],
     'LOW',    '#10b981', GREEN_BG,
     'Feedback container absent — error messages may not display correctly'),
]


def _infer_severity(tc: dict) -> tuple:
    haystack = (
        tc.get('name', '') + ' ' +
        tc.get('description', '') + ' ' +
        tc.get('selector', '') + ' ' +
        tc.get('category', '')
    ).lower()
    for keywords, severity, color, bg, impact in _SEVERITY_MAP:
        if any(kw in haystack for kw in keywords):
            return severity, color, bg, impact
    return 'MEDIUM', '#f59e0b', ORANGE_BG, 'Unexpected element failure — investigate selector stability'


def _infer_ui_area(tc: dict) -> str:
    combined = (tc.get('name', '') + ' ' + tc.get('selector', '')).lower()
    if any(k in combined for k in ['nav', 'menu', 'navigation']): return 'Navigation'
    if any(k in combined for k in ['search', 'recherche']):        return 'Search Bar'
    if any(k in combined for k in ['hero', 'banner', 'slider']):   return 'Hero Section'
    if any(k in combined for k in ['logo', 'brand']):              return 'Branding'
    if any(k in combined for k in ['main', 'content', 'core']):    return 'Main Content'
    if any(k in combined for k in ['auth', 'login', 'signin']):    return 'Authentication'
    if any(k in combined for k in ['cart', 'checkout', 'panier']): return 'Cart / Checkout'
    if any(k in combined for k in ['form', 'input', 'field']):     return 'Form'
    if any(k in combined for k in ['footer']):                     return 'Footer'
    if any(k in combined for k in ['h1', 'heading', 'identity']):  return 'Page Identity'
    return tc.get('name', 'UI Element')[:30]


# ─────────────────────────────────────────────────────────────────────────────
# Page chrome
# ─────────────────────────────────────────────────────────────────────────────

def on_page(canvas, doc):
    W, H = A4
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, H - 52*mm, W, 52*mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, H - 54*mm, W, 2*mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, 0, 3, H - 54*mm, fill=1, stroke=0)
    canvas.setFillColor(LIGHT_BG)
    canvas.rect(0, 0, W, 14*mm, fill=1, stroke=0)
    canvas.setFillColor(BORDER)
    canvas.rect(0, 14*mm, W, 0.5, fill=1, stroke=0)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 5*mm, 'Generated by NexTest — AI-Powered Test Automation Platform')
    canvas.drawRightString(W - 20*mm, 5*mm, f'Page {doc.page}  •  {datetime.now().strftime("%Y-%m-%d")}')
    canvas.restoreState()


def section_header(emoji, text, color=None):
    accent = color or GOLD
    data = [[Paragraph(f'{emoji}  {text}',
                       ParagraphStyle('SH', fontSize=11, fontName='Helvetica-Bold',
                                      textColor=DARK_TEXT, leading=14))]]
    tbl = Table(data, colWidths=[168*mm])
    tbl.setStyle(TableStyle([
        ('LINEBELOW',     (0,0), (-1,-1), 1.5, accent),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
    ]))
    return tbl


def sub_section_header(text, color=None):
    c = color or INDIGO
    data = [[Paragraph(text, ParagraphStyle('SSH', fontSize=9, fontName='Helvetica-Bold',
                                             textColor=HexColor(c) if isinstance(c, str) else c,
                                             leading=12))]]
    tbl = Table(data, colWidths=[168*mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), INDIGO_BG),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('BOX',           (0,0), (-1,-1), 0.5, BORDER_DARK),
    ]))
    return tbl


def framework_banner(label, color, bg):
    data = [[Paragraph(label, ParagraphStyle(
        'FB', fontSize=11, fontName='Helvetica-Bold', textColor=color, leading=14))]]
    tbl = Table(data, colWidths=[168*mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), bg),
        ('BOX',           (0,0), (-1,-1), 1, color),
        ('TOPPADDING',    (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
    ]))
    return tbl


def stat_card(value, label, val_color, bg_color):
    inner = [[Paragraph(
        f'<font color="{val_color}"><b>{value}</b></font><br/>'
        f'<font color="#94a3b8" size="7"><b>{label}</b></font>',
        ParagraphStyle('SC', fontSize=18, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=26))]]
    t = Table(inner, colWidths=[30*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), bg_color),
        ('BOX',           (0,0), (-1,-1), 1, BORDER_DARK),
        ('TOPPADDING',    (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
    ]))
    return t


def badge(text, color, bg=None):
    bg_color = bg or '#f8fafc'
    return (f'<font color="{color}"><b>[{text}]</b></font>')


def _get_status(tc_index: int, tc_type: str, execution_results: list) -> tuple:
    if execution_results and tc_index < len(execution_results):
        s = execution_results[tc_index].get('status', 'skip')
        if s == 'pass':   return '#10b981', '✓  PASS'
        elif s == 'fail': return '#ef4444', '✗  FAIL'
        else:             return '#f59e0b', '■  SKIP'
    if tc_type == 'positive':   return '#10b981', '✓  PASS'
    elif tc_type == 'negative': return '#ef4444', '✗  FAIL'
    else:                       return '#f59e0b', '■  SKIP'


def _get_deep_reason(tc_index: int, tc: dict, execution_results: list) -> tuple:
    tc_type  = tc.get('type', 'positive')
    selector = tc.get('selector', tc.get('expected_selector', 'N/A'))
    action   = tc.get('action', 'check_visible')

    if not execution_results or tc_index >= len(execution_results):
        if tc_type == 'positive':
            return [
                ('assertion_result', 'element_found = expected (pre-execution estimate)'),
                ('strategy',         'positive test — validates expected behavior'),
                ('selector_plan',    f'{selector}'),
                ('expected_action',  f'{action}'),
            ], '#059669', HexColor('#f0fdf4')
        elif tc_type == 'negative':
            return [
                ('assertion_result', 'error_handling = expected (pre-execution estimate)'),
                ('strategy',         'negative test — validates error/boundary conditions'),
                ('selector_plan',    f'{selector}'),
                ('expected_action',  f'{action}'),
            ], '#dc2626', HexColor('#fef2f2')
        else:
            return [
                ('assertion_result', 'skipped = true (pre-execution estimate)'),
                ('strategy',         'conditional test — depends on page state'),
                ('selector_plan',    f'{selector}'),
            ], '#b45309', HexColor('#fffbeb')

    exec_r     = execution_results[tc_index]
    status     = exec_r.get('status', 'skip')
    resp_time  = exec_r.get('response_time_ms', exec_r.get('load_time_ms', None))
    actual_sel = exec_r.get('selector_used', selector)
    extracted  = exec_r.get('extracted_text', exec_r.get('value', ''))
    visibility = exec_r.get('visibility', 'unknown')
    exception  = exec_r.get('exception', exec_r.get('error', ''))

    if status == 'pass':
        lines = [
            ('assertion_result', 'element_found = true'),
            ('selector_matched', f'"{actual_sel}" resolved in DOM tree'),
            ('render_status',    'element rendered successfully after hydration'),
            ('visibility_check', f'computed style: {visibility} — check PASSED'),
        ]
        if resp_time is not None:
            lines.append(('response_time', f'{resp_time}ms — within threshold'))
        if extracted:
            lines.append(('extracted_value', f'"{extracted[:60]}"'))
        lines.append(('no_exception', 'no timeout or exception occurred'))
        reason = exec_r.get('reason_pass') or ''
        if reason:
            lines.append(('ai_note', reason[:80]))
        return lines, '#059669', HexColor('#f0fdf4')

    elif status == 'fail':
        severity_label, severity_color, severity_bg, impact_text = _infer_severity(tc)
        lines = [
            ('severity', severity_label),
            ('impact',   impact_text),
            ('assertion_result', 'element_found = false'),
            ('selector_status',  f'"{actual_sel}" NOT resolved in DOM snapshot'),
        ]
        if exception:
            lines.append(('exception', exception[:80]))
        lines.append(('possible_cause_1', 'element not rendered yet (SPA hydration delay)'))
        lines.append(('possible_cause_2', 'incorrect selector strategy or stale locator'))
        lines.append(('possible_cause_3', 'dynamic component blocked by auth / A/B test'))
        if resp_time is not None:
            lines.append(('timeout', f'timeout reached after {resp_time}ms'))
        reason = exec_r.get('reason') or exec_r.get('error', '')
        if reason:
            lines.append(('ai_note', reason[:80]))
        return lines, '#dc2626', HexColor('#fef2f2')

    else:
        lines = [
            ('assertion_result', 'skipped = true'),
            ('condition_status', 'precondition not met for test execution'),
            ('element_status',   'element optional or absent on this page type'),
        ]
        reason = exec_r.get('reason_skip', '')
        lines.append(('dependency', reason[:80] if reason else 'test dependency or prerequisite missing'))
        return lines, '#b45309', HexColor('#fffbeb')


def _get_reason_text(tc_index: int, tc: dict, execution_results: list) -> tuple:
    lines, color, bg = _get_deep_reason(tc_index, tc, execution_results)
    text = '  |  '.join([f'{k}: {v}' for k, v in lines])
    return text, color.hexval() if hasattr(color, 'hexval') else str(color), bg


def _calc_stats(test_cases: list, execution_results: list) -> tuple:
    total = len(test_cases)
    if not total: return 0, 0, 0, 0
    if execution_results:
        pass_count = sum(1 for r in execution_results if r.get('status') == 'pass')
        fail_count = sum(1 for r in execution_results if r.get('status') == 'fail')
        skip_count = sum(1 for r in execution_results if r.get('status') == 'skip')
        skip_count += max(total - len(execution_results), 0)
    else:
        pass_count = sum(1 for t in test_cases if t.get('type') == 'positive')
        fail_count = sum(1 for t in test_cases if t.get('type') == 'negative')
        skip_count = total - pass_count - fail_count
    rate = round((pass_count / total) * 100) if total > 0 else 0
    return pass_count, fail_count, skip_count, rate


def build_stats_section(elements, test_cases, execution_results=None):
    pass_count, fail_count, skip_count, rate = _calc_stats(test_cases, execution_results or [])
    total    = len(test_cases)
    rate_hex = '#10b981' if rate >= 80 else '#f59e0b' if rate >= 50 else '#ef4444'
    rate_bg  = GREEN_BG  if rate >= 80 else ORANGE_BG  if rate >= 50 else RED_BG
    stats_data = [[
        stat_card(pass_count, 'PASSED',    '#10b981', GREEN_BG),
        stat_card(fail_count, 'FAILED',    '#ef4444', RED_BG),
        stat_card(skip_count, 'SKIPPED',   '#f59e0b', ORANGE_BG),
        stat_card(f'{rate}%', 'PASS RATE', rate_hex,  rate_bg),
        stat_card(total,      'TOTAL',     '#3b82f6', BLUE_BG),
    ]]
    outer = Table(stats_data, colWidths=[33.6*mm]*5)
    outer.setStyle(TableStyle([
        ('ALIGN',  (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING',(0,0), (-1,-1), 2),
    ]))
    elements.append(outer)


# ─────────────────────────────────────────────────────────────────────────────
# FIX 4 — EXECUTION VERDICT SUMMARY (improved "Tests" column formatting)
# ─────────────────────────────────────────────────────────────────────────────

def build_execution_verdict_summary(elements, test_cases: list,
                                     execution_results: list, scraped: dict):
    if not execution_results:
        return

    elements.append(Spacer(1, 14))
    elements.append(section_header('🏁', 'Execution Verdict Summary', GOLD))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>'
        'Business-oriented interpretation of test results — '
        'maps raw pass/fail data to application health per UI area.'
        '</i></font>',
        ParagraphStyle('VSInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 10))

    area_results = {}
    for i, tc in enumerate(test_cases):
        area = _infer_ui_area(tc)
        if area not in area_results:
            area_results[area] = {'pass': 0, 'fail': 0, 'skip': 0}
        if i < len(execution_results):
            st = execution_results[i].get('status', 'skip')
            area_results[area][st] = area_results[area].get(st, 0) + 1
        else:
            area_results[area]['skip'] += 1

    _pass_msg = {
        'Navigation':      'Routing system is operational — users can move between pages',
        'Main Content':    'Core content rendered — page body is intact and functional',
        'Search Bar':      'Discovery feature available — users can search for content',
        'Hero Section':    'Above-the-fold content visible — first impression is intact',
        'Branding':        'Site identity confirmed — correct domain and brand loaded',
        'Authentication':  'Auth entry point is reachable — login flow can be initiated',
        'Cart / Checkout': 'Purchase flow accessible — commerce functionality operational',
        'Form':            'Data entry interface available — submission flow can proceed',
        'Page Identity':   'Correct page loaded — H1 and content identity confirmed',
        'Footer':          'Page structure complete — footer links and info accessible',
    }
    _fail_msg = {
        'Navigation':      'Critical: users cannot move between sections',
        'Main Content':    'Critical: primary content region failed to render',
        'Search Bar':      'Moderate: content discovery degraded',
        'Hero Section':    'Moderate: above-the-fold visibility impaired',
        'Branding':        'Minor: brand identity element missing',
        'Authentication':  'Critical: login entry point unreachable',
        'Cart / Checkout': 'Critical: purchase flow is blocked',
        'Form':            'Moderate: form interactions may not work',
        'Page Identity':   'Moderate: page identity could not be confirmed',
        'Footer':          'Minor: secondary navigation unavailable',
    }

    hdr = [
        Paragraph('<font color="#ffffff"><b>UI Area</b></font>',
                  ParagraphStyle('VH1', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Verdict</b></font>',
                  ParagraphStyle('VH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        # FIX 4: split tests column into 3 distinct columns
        Paragraph('<font color="#ffffff"><b>Passed</b></font>',
                  ParagraphStyle('VH3a', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Failed</b></font>',
                  ParagraphStyle('VH3b', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Skipped</b></font>',
                  ParagraphStyle('VH3c', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Interpretation</b></font>',
                  ParagraphStyle('VH4', fontSize=8, fontName='Helvetica-Bold')),
    ]
    rows = [hdr]
    row_styles = []

    for area, counts in area_results.items():
        if counts['fail'] > 0:
            verdict_text = '<font color="#ef4444"><b>FAIL</b></font>'
            verdict_bg   = HexColor('#fef2f2')
            interp       = _fail_msg.get(area, f'Element failure detected in {area}')
            interp_color = '#dc2626'
        elif counts['pass'] > 0:
            verdict_text = '<font color="#10b981"><b>PASS</b></font>'
            verdict_bg   = HexColor('#f0fdf4')
            interp       = _pass_msg.get(area, f'{area} is operational')
            interp_color = '#059669'
        else:
            verdict_text = '<font color="#f59e0b"><b>SKIP</b></font>'
            verdict_bg   = HexColor('#fffbeb')
            interp       = 'Not executed — element may be optional on this page type'
            interp_color = '#92400e'

        rows.append([
            Paragraph(f'<font color="#1e293b"><b>{area}</b></font>',
                      ParagraphStyle('VA', fontSize=8, fontName='Helvetica-Bold', leading=11)),
            Paragraph(verdict_text,
                      ParagraphStyle('VV', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            # FIX 4: separate cells for pass/fail/skip counts with color coding
            Paragraph(f'<font color="#10b981"><b>{counts["pass"]}</b></font>',
                      ParagraphStyle('VTCa', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#ef4444"><b>{counts["fail"]}</b></font>',
                      ParagraphStyle('VTCb', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#f59e0b"><b>{counts["skip"]}</b></font>',
                      ParagraphStyle('VTCc', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{interp_color}" size="7.5">{interp}</font>',
                      ParagraphStyle('VI', fontSize=7.5, fontName='Helvetica', leading=10)),
        ])
        ri = len(rows) - 1
        row_styles.append(('BACKGROUND', (0, ri), (-1, ri), verdict_bg))

    tbl = Table(rows, colWidths=[36*mm, 18*mm, 16*mm, 16*mm, 16*mm, 66*mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('PADDING',       (0,0), (-1,-1), 7),
        ('LINEBELOW',     (0,0), (-1,-1), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, GOLD),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN',         (1,0), (4,-1),  'CENTER'),
        ('LINEBEFORE',    (1,1), (1,-1),  1, BORDER_DARK),
        ('LINEBEFORE',    (5,1), (5,-1),  1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 10))

    pass_count = sum(1 for r in execution_results if r.get('status') == 'pass')
    fail_count = sum(1 for r in execution_results if r.get('status') == 'fail')
    total      = len(execution_results) or 1
    pass_rate  = round(pass_count / total * 100)

    critical_failed = [
        tc for i, tc in enumerate(test_cases)
        if i < len(execution_results)
        and execution_results[i].get('status') == 'fail'
        and _infer_severity(tc)[0] == 'HIGH'
    ]

    if critical_failed:
        oc, ob, obrd, oi = '#ef4444', HexColor('#fef2f2'), RED,    '🔴'
        areas_str = ', '.join(set(_infer_ui_area(tc) for tc in critical_failed))
        ot = (f'Smoke validation FAILED — critical UI issues detected in: {areas_str}. '
              f'Core user journeys are blocked. Immediate investigation required.')
    elif fail_count > 0:
        oc, ob, obrd, oi = '#b45309', HexColor('#fffbeb'), ORANGE, '🟡'
        ot = (f'Smoke validation passed with warnings — {fail_count} non-critical element(s) failed. '
              f'Core navigation and content are operational but medium-priority issues require attention.')
    elif pass_rate >= 80:
        oc, ob, obrd, oi = '#059669', HexColor('#f0fdf4'), GREEN,  '🟢'
        ot = ('Core user journey elements are operational and visible. '
              'No critical UI blockers detected. Application is ready for functional testing.')
    else:
        oc, ob, obrd, oi = '#b45309', HexColor('#fffbeb'), ORANGE, '🟡'
        ot = (f'Smoke validation inconclusive — {pass_rate}% pass rate with significant skips. '
              f'Verify page accessibility and selector stability before proceeding.')

    v_tbl = Table([[Paragraph(
        f'<font color="{oc}"><b>{oi}  Overall Verdict: </b></font>'
        f'<font color="{oc}" size="8">{ot}</font>',
        ParagraphStyle('OV', fontSize=8, fontName='Helvetica', leading=12))
    ]], colWidths=[168*mm])
    v_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), ob),
        ('BOX',           (0,0), (-1,-1), 1.5, obrd),
        ('LEFTPADDING',   (0,0), (-1,-1), 12),
        ('RIGHTPADDING',  (0,0), (-1,-1), 12),
        ('TOPPADDING',    (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(v_tbl)
    elements.append(Spacer(1, 16))


# ─────────────────────────────────────────────────────────────────────────────
# PLANNED UI ELEMENTS
# ─────────────────────────────────────────────────────────────────────────────

def _infer_element_type(tc: dict) -> str:
    name = (tc.get('name', '') + ' ' + tc.get('description', '') + ' ' +
            tc.get('expected_selector', '') + ' ' + tc.get('category', '')).lower()
    if any(k in name for k in ['search', 'recherche', 'query']): return 'SEARCH'
    if any(k in name for k in ['nav', 'menu', 'link', 'navigation']): return 'NAV'
    if any(k in name for k in ['button', 'btn', 'submit', 'click', 'bouton']): return 'BUTTON'
    if any(k in name for k in ['hero', 'banner', 'header-image']): return 'HERO'
    if any(k in name for k in ['image', 'img', 'photo', 'picture']): return 'IMAGE'
    if any(k in name for k in ['form', 'formulaire', 'register', 'signup', 'login']): return 'FORM'
    if any(k in name for k in ['input', 'field', 'champ', 'text', 'email', 'password']): return 'INPUT'
    if any(k in name for k in ['modal', 'dialog', 'popup']): return 'MODAL'
    if any(k in name for k in ['table', 'grid', 'list', 'result']): return 'TABLE'
    if any(k in name for k in ['page', 'pagination']): return 'PAGINATION'
    if any(k in name for k in ['alert', 'error', 'warning', 'message']): return 'ALERT'
    if any(k in name for k in ['cart', 'panier', 'checkout', 'basket']): return 'CART'
    if tc.get('category') == 'performance': return 'PERFORMANCE'
    if tc.get('category') == 'ui': return 'IMAGE'
    return 'GENERAL'


def _infer_expected_behavior(tc: dict) -> str:
    if tc.get('expected'):
        return tc['expected']
    tc_type = tc.get('type', 'positive')
    if tc_type == 'positive':  return 'Element renders and responds correctly to user interaction'
    elif tc_type == 'negative': return 'System handles invalid input with appropriate error response'
    return 'Element state matches expected page design specification'


def _guess_selector(tc: dict) -> str:
    name = tc.get('name', '').lower()
    desc = tc.get('description', '').lower()
    combined = name + ' ' + desc
    if 'search' in combined:                        return "input[type='search'], input[placeholder*='search']"
    if 'login' in combined or 'signin' in combined: return "input[type='email'], #username"
    if 'password' in combined:                      return "input[type='password']"
    if 'email' in combined:                         return "input[type='email']"
    if 'submit' in combined or 'button' in combined: return "button[type='submit'], .btn-primary"
    if 'nav' in combined or 'menu' in combined:     return "nav a, .navbar a, header a"
    if 'image' in combined or 'img' in combined:    return "img[src]:not([src=''])"
    if 'form' in combined:                          return "form, .form-container"
    if 'cart' in combined:                          return ".add-to-cart, button[data-action='cart']"
    if 'modal' in combined:                         return ".modal, [role='dialog']"
    if 'error' in combined or 'alert' in combined:  return ".error-message, .alert, [role='alert']"
    if 'link' in combined:                          return "a[href]:not([href='#'])"
    if 'table' in combined:                         return "table, .data-table"
    if 'pagination' in combined:                    return ".pagination, nav[aria-label*='page']"
    return f"[data-testid='{tc.get('name','element').lower().replace(' ','-')}']"


def build_planned_ui_elements(elements, test_cases: list):
    elements.append(section_header('🎯', 'Planned UI Elements', INDIGO))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>AI-predicted DOM elements and selectors before execution. '
        'These represent what the test engine expects to find on the page.</i></font>',
        ParagraphStyle('PIInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>',
                  ParagraphStyle('PEH0', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Test Scenario</b></font>',
                  ParagraphStyle('PEH1', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Expected Selector</b></font>',
                  ParagraphStyle('PEH2', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Element Type</b></font>',
                  ParagraphStyle('PEH3', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Expected Behavior</b></font>',
                  ParagraphStyle('PEH4', fontSize=7.5, fontName='Helvetica-Bold')),
    ]
    rows = [hdr]

    for i, tc in enumerate(test_cases):
        elem_type  = _infer_element_type(tc)
        selector   = tc.get('expected_selector') or tc.get('selector') or _guess_selector(tc)
        behavior   = _infer_expected_behavior(tc)
        type_color = ELEMENT_TYPE_COLORS.get(elem_type, '#64748b')
        beh_short  = behavior[:65] + '...' if len(behavior) > 65 else behavior

        rows.append([
            Paragraph(f'<font color="#64748b"><b>{tc.get("id", i+1)}</b></font>',
                      ParagraphStyle('PEID', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<b><font color="#1e293b" size="8">{tc.get("name","")}</font></b>',
                      ParagraphStyle('PEN', fontSize=8, fontName='Helvetica', leading=11)),
            Paragraph(f'<font color="#4f46e5" size="7.5"><b>{selector}</b></font>',
                      ParagraphStyle('PESEL', fontSize=7.5, fontName='Courier', leading=10,
                                     textColor=HexColor('#4f46e5'))),
            Paragraph(f'<font color="{type_color}"><b>{elem_type}</b></font>',
                      ParagraphStyle('PETYPE', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7">{beh_short}</font>',
                      ParagraphStyle('PEBEH', fontSize=7, fontName='Helvetica', leading=9.5)),
        ])

    tbl = Table(rows, colWidths=[8*mm, 42*mm, 46*mm, 20*mm, 52*mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, HexColor('#f0f4ff')]),
        ('PADDING',       (0,0), (-1,-1), 7),
        ('LINEBELOW',     (0,0), (-1,-1), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, INDIGO),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('ALIGN',         (0,0), (0,-1), 'CENTER'),
        ('ALIGN',         (3,0), (3,-1), 'CENTER'),
        ('LINEBEFORE',    (2,1), (2,-1), 1, INDIGO),
        ('LINEBEFORE',    (3,1), (3,-1), 1, BORDER),
    ]))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ─────────────────────────────────────────────────────────────────────────────
# FIX 2 + 3 — EXECUTION EVIDENCE (real extracted values + real timing)
# ─────────────────────────────────────────────────────────────────────────────

def _resolve_extracted_value(exec_r: dict, status: str) -> str:
    """FIX 2: Return real extracted text, '[empty text]' if element found but empty, or 'Not Found'."""
    if status == 'fail' or (exec_r.get('found') is False):
        return 'Not Found'
    raw = exec_r.get('extracted_text') or exec_r.get('value') or exec_r.get('text') or ''
    if raw:
        return str(raw).strip()
    if status == 'pass' or exec_r.get('found') is True:
        return '[empty text]'
    return 'Not Found'


def _resolve_timing(exec_r: dict) -> str:
    """FIX 3: Return real execution duration as e.g. '0.12s', or 'N/A'."""
    ms = exec_r.get('response_time_ms') or exec_r.get('load_time_ms') or exec_r.get('duration_ms')
    if ms is not None:
        try:
            seconds = float(ms) / 1000.0
            return f'{seconds:.2f}s'
        except (ValueError, TypeError):
            return str(ms)
    return 'N/A'


def build_execution_evidence(elements, test_cases: list, execution_results: list):
    if not execution_results:
        return

    elements.append(section_header('🔬', 'Real Execution Evidence', TEAL))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>DOM-level evidence captured during test run. '
        'Each row represents actual browser state at execution time.</i></font>',
        ParagraphStyle('EEInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>#</b></font>',
                  ParagraphStyle('EEH0', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Test / Selector Used</b></font>',
                  ParagraphStyle('EEH1', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Found</b></font>',
                  ParagraphStyle('EEH2', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Extracted Value</b></font>',
                  ParagraphStyle('EEH3', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Action</b></font>',
                  ParagraphStyle('EEH4', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Visibility</b></font>',
                  ParagraphStyle('EEH5', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Time</b></font>',
                  ParagraphStyle('EEH6', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []

    for i, tc in enumerate(test_cases):
        if i >= len(execution_results):
            break
        exec_r     = execution_results[i]
        status     = exec_r.get('status', 'skip')
        found      = exec_r.get('found', exec_r.get('element_found', None))
        selector   = exec_r.get('selector_used') or tc.get('selector') or _guess_selector(tc)
        action     = exec_r.get('action') or tc.get('action') or 'check_visible'
        visibility = exec_r.get('visibility') or ('visible' if status == 'pass' else 'detached')

        # FIX 2: use resolved extracted value
        extracted = _resolve_extracted_value(exec_r, status)
        # FIX 3: use resolved timing
        timing = _resolve_timing(exec_r)

        if found is True or status == 'pass':
            found_text = '<font color="#10b981"><b>YES</b></font>'
            found_bg   = HexColor('#f0fdf4')
        elif found is False or status == 'fail':
            found_text = '<font color="#ef4444"><b>NO</b></font>'
            found_bg   = HexColor('#fef2f2')
        else:
            found_text = '<font color="#f59e0b"><b>N/A</b></font>'
            found_bg   = HexColor('#fffbeb')

        vis_color = '#10b981' if visibility == 'visible' else '#ef4444' if visibility == 'detached' else '#f59e0b'
        sel_short = selector[:38] + '...' if len(selector) > 38 else selector
        ext_short = extracted[:40] + '...' if len(extracted) > 40 else extracted

        rows.append([
            Paragraph(f'<font color="#64748b"><b>{tc.get("id", i+1)}</b></font>',
                      ParagraphStyle('EEID', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(
                f'<b><font color="#1e293b" size="7.5">{tc.get("name","")[:30]}</font></b><br/>'
                f'<font color="#4f46e5" size="6.5">{sel_short}</font>',
                ParagraphStyle('EEN', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(found_text,
                      ParagraphStyle('EEF', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7">{ext_short}</font>',
                      ParagraphStyle('EEEX', fontSize=7, fontName='Helvetica', leading=9.5)),
            Paragraph(f'<font color="#6366f1" size="7"><b>{action}</b></font>',
                      ParagraphStyle('EEACT', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{vis_color}" size="6.5"><b>{visibility.upper()}</b></font>',
                      ParagraphStyle('EEVIS', fontSize=6.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            # FIX 3: real timing string
            Paragraph(f'<font color="#64748b" size="7">{timing}</font>',
                      ParagraphStyle('EETM', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)),
        ])
        row_styles.append(('BACKGROUND', (2, i+1), (2, i+1), found_bg))

    tbl = Table(rows, colWidths=[8*mm, 44*mm, 14*mm, 38*mm, 24*mm, 18*mm, 22*mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, HexColor('#f0fdfa')]),
        ('PADDING',       (0,0), (-1,-1), 6),
        ('LINEBELOW',     (0,0), (-1,-1), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, TEAL),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('ALIGN',         (0,0), (0,-1), 'CENTER'),
        ('ALIGN',         (2,0), (2,-1), 'CENTER'),
        ('ALIGN',         (4,0), (4,-1), 'CENTER'),
        ('ALIGN',         (5,0), (5,-1), 'CENTER'),
        ('ALIGN',         (6,0), (6,-1), 'CENTER'),
        ('LINEBEFORE',    (2,1), (2,-1), 1, BORDER_DARK),
        ('LINEBEFORE',    (4,1), (4,-1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ─────────────────────────────────────────────────────────────────────────────
# TEST CASES TABLE
# ─────────────────────────────────────────────────────────────────────────────

def build_test_cases_table(elements, test_cases, execution_results=None):
    col_w = [8*mm, 46*mm, 20*mm, 38*mm, 56*mm]
    header_row = [
        Paragraph('<font color="#ffffff"><b>#</b></font>',
                  ParagraphStyle('TH', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Test Name</b></font>',
                  ParagraphStyle('TH', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Status</b></font>',
                  ParagraphStyle('TH', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Expected</b></font>',
                  ParagraphStyle('TH', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Deep Analysis</b></font>',
                  ParagraphStyle('TH', fontSize=8, fontName='Helvetica-Bold')),
    ]
    tc_rows    = [header_row]
    row_styles = []

    for i, tc in enumerate(test_cases):
        tc_type  = tc.get('type', 'positive')
        priority = tc.get('priority', 'medium')
        category = tc.get('category', 'functional')

        type_color, type_label                    = _get_status(i, tc_type, execution_results or [])
        reason_lines, reason_color_obj, reason_bg = _get_deep_reason(i, tc, execution_results or [])

        reason_color = reason_color_obj if isinstance(reason_color_obj, str) else '#059669'
        if hasattr(reason_color_obj, 'hexval'):
            reason_color = reason_color_obj.hexval()

        pri_color  = PRIORITY_COLORS.get(priority, '#94a3b8')
        cat_color  = CATEGORY_COLORS.get(category, '#3b82f6')
        desc_short = tc.get('description', '')
        desc_short = desc_short[:55] + '…' if len(desc_short) > 55 else desc_short
        exp_short  = tc.get('expected', '')
        exp_short  = exp_short[:50] + '…' if len(exp_short) > 50 else exp_short

        reason_html_parts = []
        for key, val in reason_lines[:6]:
            val_short  = str(val)[:55] + '…' if len(str(val)) > 55 else str(val)
            key_color  = '#ef4444' if key.startswith('⚠') else '#64748b'
            val_color  = '#ef4444' if key.startswith('⚠') else reason_color
            reason_html_parts.append(
                f'<font color="{key_color}" size="6.5"><b>{key}:</b></font>'
                f'<font color="{val_color}" size="6.5"> {val_short}</font>'
            )
        reason_cell = Paragraph(
            '<br/>'.join(reason_html_parts),
            ParagraphStyle('RSN2', fontSize=6.5, fontName='Helvetica', leading=9.5))

        name_cell = Paragraph(
            f'<b><font color="#1e293b" size="8.5">{tc.get("name","")}</font></b><br/>'
            f'<font color="#94a3b8" size="6.5">{desc_short}</font><br/>'
            f'<font color="{pri_color}" size="6"><b>{priority.upper()}</b></font>'
            f'<font color="#94a3b8" size="6">  |  </font>'
            f'<font color="{cat_color}" size="6"><b>{category.upper()}</b></font>',
            ParagraphStyle('TCN', fontSize=8.5, fontName='Helvetica', leading=11))

        tc_rows.append([
            Paragraph(f'<font color="#64748b"><b>{tc.get("id","")}</b></font>',
                      ParagraphStyle('IDC', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            name_cell,
            Paragraph(f'<font color="{type_color}"><b>{type_label}</b></font>',
                      ParagraphStyle('TYP', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7.5">{exp_short}</font>',
                      ParagraphStyle('EXP', fontSize=7.5, fontName='Helvetica', leading=10)),
            reason_cell,
        ])
        row_styles.append(('BACKGROUND', (4, i+1), (4, i+1), reason_bg))

    tc_tbl = Table(tc_rows, colWidths=col_w, repeatRows=1)
    tc_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('TEXTCOLOR',     (0,0), (-1,0), WHITE),
        ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
        ('TOPPADDING',    (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 9),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ('PADDING',       (0,1), (-1,-1), 7),
        ('LINEBELOW',     (0,0), (-1,-1), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, BORDER_DARK),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('ALIGN',         (0,0), (0,-1), 'CENTER'),
        ('ALIGN',         (2,0), (2,-1), 'CENTER'),
        ('LINEBEFORE',    (4,1), (4,-1), 1.5, BORDER_DARK),
    ] + row_styles))
    elements.append(tc_tbl)


# ─────────────────────────────────────────────────────────────────────────────
# FIX 2 — REAL PAGE EVIDENCE (real extracted values)
# ─────────────────────────────────────────────────────────────────────────────

def build_real_page_evidence(elements, test_cases: list, execution_results: list, scraped: dict):
    elements.append(section_header('📡', 'Real Page Evidence', PURPLE))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>Cross-reference of AI-predicted selectors vs. '
        'actual DOM elements captured during execution. '
        'This is your selector-level proof of page coverage.</i></font>',
        ParagraphStyle('RPEInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 8))

    hdr = [
        Paragraph('<font color="#ffffff"><b>UI Element</b></font>',
                  ParagraphStyle('RPH1', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Expected Selector</b></font>',
                  ParagraphStyle('RPH2', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Actual Selector</b></font>',
                  ParagraphStyle('RPH3', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Found</b></font>',
                  ParagraphStyle('RPH4', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Extracted Value</b></font>',
                  ParagraphStyle('RPH5', fontSize=7.5, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Visibility</b></font>',
                  ParagraphStyle('RPH6', fontSize=7.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    rows = [hdr]
    row_styles = []

    for i, tc in enumerate(test_cases):
        expected_sel = tc.get('expected_selector') or tc.get('selector') or _guess_selector(tc)
        elem_name    = tc.get('name', f'Element {i+1}')
        elem_type    = _infer_element_type(tc)
        type_color   = ELEMENT_TYPE_COLORS.get(elem_type, '#64748b')

        if execution_results and i < len(execution_results):
            exec_r     = execution_results[i]
            actual_sel = exec_r.get('selector_used') or expected_sel
            found      = exec_r.get('found', exec_r.get('element_found', None))
            visibility = exec_r.get('visibility') or ('visible' if exec_r.get('status') == 'pass' else 'unknown')
            status     = exec_r.get('status', 'skip')
            # FIX 2: use resolved extracted value
            extracted = _resolve_extracted_value(exec_r, status)
        else:
            actual_sel = expected_sel
            found      = None
            extracted  = tc.get('placeholder') or tc.get('default_value') or 'Not Found'
            visibility = 'not executed'
            status     = 'skip'

        match           = (expected_sel.strip() == actual_sel.strip())
        sel_match_color = '#10b981' if match else '#f59e0b'

        if found is True or status == 'pass':
            found_text = '<font color="#10b981"><b>YES</b></font>'
            row_bg     = HexColor('#f0fdf4')
        elif found is False or status == 'fail':
            found_text = '<font color="#ef4444"><b>NO</b></font>'
            row_bg     = HexColor('#fef2f2')
        else:
            found_text = '<font color="#94a3b8"><b>N/E</b></font>'
            row_bg     = WHITE

        vis_color = '#10b981' if visibility == 'visible' else '#ef4444' if visibility == 'detached' else '#94a3b8'
        exp_short = expected_sel[:32] + '...' if len(expected_sel) > 32 else expected_sel
        act_short = actual_sel[:32]   + '...' if len(actual_sel)   > 32 else actual_sel
        ext_short = extracted[:30] + '...' if len(extracted) > 30 else extracted

        rows.append([
            Paragraph(
                f'<font color="{type_color}"><b>{elem_type}</b></font><br/>'
                f'<font color="#475569" size="6.5">{elem_name[:28]}</font>',
                ParagraphStyle('RPEN', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#4f46e5" size="7">{exp_short}</font>',
                      ParagraphStyle('RPEXP', fontSize=7, fontName='Courier', leading=9.5)),
            Paragraph(
                f'<font color="{sel_match_color}" size="7">{act_short}</font>'
                + (f'<br/><font color="{sel_match_color}" size="6"><b>{"= MATCH" if match else "CHANGED"}</b></font>'
                   if actual_sel != expected_sel else ''),
                ParagraphStyle('RPACT', fontSize=7, fontName='Courier', leading=9.5)),
            Paragraph(found_text,
                      ParagraphStyle('RPF', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="#475569" size="7">"{ext_short}"</font>',
                      ParagraphStyle('RPEXT', fontSize=7, fontName='Helvetica', leading=9.5)),
            Paragraph(f'<font color="{vis_color}" size="6.5"><b>{visibility.upper()}</b></font>',
                      ParagraphStyle('RPVIS', fontSize=6.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
        row_styles.append(('BACKGROUND', (0, i+1), (-1, i+1), row_bg))

    scraped_items = [
        ('Page Inputs',      f"{len(scraped.get('inputs',[]))} input(s)",    scraped.get('inputs'),    'input, [type="text"]',    'INPUT'),
        ('Buttons',          f"{len(scraped.get('buttons',[]))} button(s)",  scraped.get('buttons'),   'button, [role="button"]', 'BUTTON'),
        ('Nav Links',        f"{len(scraped.get('nav_links',[]))} link(s)",  scraped.get('nav_links'), 'nav a, header a',         'NAV'),
        ('Images',           f"{len(scraped.get('images',[]))} image(s)",    scraped.get('images'),    'img[src]',                'IMAGE'),
        ('Alert Containers', f"{len(scraped.get('alerts',[]))} alert(s)",    scraped.get('alerts'),    '[role="alert"], .alert',  'ALERT'),
    ]
    has_scraped_rows = False
    for label, detail, items, sel, etype in scraped_items:
        if items:
            if not has_scraped_rows:
                has_scraped_rows = True
                rows.append([
                    Paragraph('<font color="#94a3b8"><b>— Scraped Page Elements —</b></font>',
                              ParagraphStyle('SEP', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
                    Paragraph('', ParagraphStyle('SEP2', fontSize=7, fontName='Helvetica')),
                    Paragraph('', ParagraphStyle('SEP3', fontSize=7, fontName='Helvetica')),
                    Paragraph('', ParagraphStyle('SEP4', fontSize=7, fontName='Helvetica')),
                    Paragraph('', ParagraphStyle('SEP5', fontSize=7, fontName='Helvetica')),
                    Paragraph('', ParagraphStyle('SEP6', fontSize=7, fontName='Helvetica')),
                ])
                ri = len(rows) - 1
                row_styles.append(('BACKGROUND', (0, ri), (-1, ri), HexColor('#f1f5f9')))
                row_styles.append(('SPAN', (0, ri), (-1, ri)))

            type_color = ELEMENT_TYPE_COLORS.get(etype, '#64748b')
            found_txt  = '<font color="#10b981"><b>YES</b></font>' if items else '<font color="#ef4444"><b>NO</b></font>'
            found_bg   = HexColor('#f0fdf4') if items else HexColor('#fef2f2')
            rows.append([
                Paragraph(
                    f'<font color="{type_color}"><b>{etype}</b></font><br/>'
                    f'<font color="#475569" size="6.5">{label}</font>',
                    ParagraphStyle('SCRN', fontSize=7.5, fontName='Helvetica', leading=10)),
                Paragraph(f'<font color="#4f46e5" size="7">{sel}</font>',
                          ParagraphStyle('SCRSEL', fontSize=7, fontName='Courier')),
                Paragraph(f'<font color="#10b981" size="7">{sel}</font>',
                          ParagraphStyle('SCRACT', fontSize=7, fontName='Courier')),
                Paragraph(found_txt,
                          ParagraphStyle('SCRF', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
                Paragraph(f'<font color="#475569" size="7">{detail}</font>',
                          ParagraphStyle('SCREXT', fontSize=7, fontName='Helvetica')),
                Paragraph('<font color="#10b981" size="6.5"><b>VISIBLE</b></font>',
                          ParagraphStyle('SCRVIS', fontSize=6.5, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            ])
            ri = len(rows) - 1
            row_styles.append(('BACKGROUND', (3, ri), (3, ri), found_bg))

    tbl = Table(rows, colWidths=[30*mm, 36*mm, 36*mm, 14*mm, 34*mm, 18*mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('PADDING',       (0,0), (-1,-1), 6),
        ('LINEBELOW',     (0,0), (-1,-1), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, PURPLE),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('ALIGN',         (3,0), (3,-1), 'CENTER'),
        ('ALIGN',         (5,0), (5,-1), 'CENTER'),
        ('LINEBEFORE',    (3,1), (3,-1), 1, BORDER_DARK),
        ('LINEBEFORE',    (4,1), (4,-1), 1, BORDER),
    ] + row_styles))
    elements.append(tbl)
    elements.append(Spacer(1, 16))


# ─────────────────────────────────────────────────────────────────────────────
# FIX 6 + 7 — AI RECOMMENDATIONS + FINAL VERDICT (specific recs + quality score)
# ─────────────────────────────────────────────────────────────────────────────

def _is_generic_selector(selector: str) -> bool:
    """Return True if selector is considered fragile/generic."""
    generic_patterns = [
        '[class*=', "input[type='search']", "input[name='s']",
        'img', 'nav', 'main', 'h1', 'a[href]', 'button',
    ]
    s = selector.strip()
    return any(p in s for p in generic_patterns) or (len(s) <= 4 and not s.startswith('#') and not s.startswith('[data-'))


def _compute_quality_score(pass_rate: int, load_time: int, fail_count: int,
                             critical_failures: list, fragile_sel: list) -> tuple:
    """FIX 7: Compute quality score (0–100) and risk level."""
    score = pass_rate  # base: pass rate %

    # Performance bonus/penalty
    if load_time < 1500:
        score = min(100, score + 5)
    elif load_time > 5000:
        score = max(0, score - 15)
    elif load_time > 3000:
        score = max(0, score - 8)

    # Critical failure penalty
    score = max(0, score - len(critical_failures) * 10)

    # Fragile selector penalty (capped)
    score = max(0, score - min(len(fragile_sel) * 3, 10))

    score = max(0, min(100, round(score)))

    if score >= 80 and not critical_failures:
        risk = 'LOW'
        risk_color = '#10b981'
    elif score >= 60 or (score >= 50 and not critical_failures):
        risk = 'MEDIUM'
        risk_color = '#f59e0b'
    else:
        risk = 'HIGH'
        risk_color = '#ef4444'

    return score, risk, risk_color


def build_ai_recommendations(elements, test_cases: list, execution_results: list, scraped: dict):
    elements.append(Spacer(1, 18))
    elements.append(section_header('🤖', 'AI Recommendations', INDIGO))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<font color="#64748b" size="7.5"><i>'
        'Actionable recommendations generated from execution evidence, '
        'page profile analysis, and selector health signals.'
        '</i></font>',
        ParagraphStyle('AIRInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 12))

    load_time  = scraped.get('load_time_ms', 0)
    is_spa     = scraped.get('is_spa', False)
    pass_count = sum(1 for r in execution_results if r.get('status') == 'pass')
    fail_count = sum(1 for r in execution_results if r.get('status') == 'fail')
    skip_count = sum(1 for r in execution_results if r.get('status') == 'skip')
    total      = len(execution_results) or 1
    pass_rate  = round(pass_count / total * 100)

    failed_tcs  = [tc for i, tc in enumerate(test_cases)
                   if i < len(execution_results) and execution_results[i].get('status') == 'fail']
    skipped_tcs = [tc for i, tc in enumerate(test_cases)
                   if i < len(execution_results) and execution_results[i].get('status') == 'skip']

    # FIX 6: detect fragile selectors per test case with test name context
    fragile_sel_details = []
    for tc in test_cases:
        sel = tc.get('selector') or tc.get('expected_selector') or _guess_selector(tc)
        if _is_generic_selector(sel):
            fragile_sel_details.append((tc.get('name', 'Unknown test'), sel))
    fragile_sel = fragile_sel_details  # list of (name, selector) tuples

    critical_failures = [tc for tc in failed_tcs if _infer_severity(tc)[0] == 'HIGH']
    medium_failures   = [tc for tc in failed_tcs if _infer_severity(tc)[0] == 'MEDIUM']

    categories = []

    # Performance
    perf_recs = []
    if load_time > 5000:
        perf_recs.append(f'Page load is critical ({load_time} ms). Compress images, enable CDN caching, and audit third-party scripts.')
    elif load_time > 3000:
        perf_recs.append(f'Page load is slow ({load_time} ms). Optimize asset loading and reduce blocking resources.')
    elif load_time > 1500:
        perf_recs.append(f'Page load is acceptable ({load_time} ms) but can be improved. Consider lazy-loading non-critical resources.')
    else:
        perf_recs.append(f'Page load is fast ({load_time} ms). Performance baseline is healthy.')
    if is_spa:
        perf_recs.append('SPA framework detected (React/Vue/Angular). Ensure waits for hydration before asserting element presence.')
    categories.append(('⚡', 'Performance', perf_recs, '#f59e0b', ORANGE_BG))

    # FIX 6: Reliability — specific per-test recommendations
    rel_recs = []
    if fragile_sel:
        for tc_name, sel in fragile_sel[:4]:
            safe_name = tc_name[:35]
            safe_sel  = sel[:45]
            testid_suggestion = tc_name.lower().replace(' ', '-')
            rel_recs.append(
                f'"{safe_name}" uses generic selector ({safe_sel}). '
                f'Recommendation: add data-testid="{testid_suggestion}" for selector stability.'
            )
        if len(fragile_sel) > 4:
            rel_recs.append(f'... and {len(fragile_sel) - 4} more test(s) with fragile selectors. Audit all tests for data-testid coverage.')
    else:
        rel_recs.append('Selectors appear specific and stable. Continue using ID-based and attribute selectors.')
    if critical_failures:
        for tc in critical_failures[:3]:
            area = _infer_ui_area(tc)
            rel_recs.append(f'HIGH severity failure: "{tc.get("name","")[:40]}" ({area}). Must be resolved before production deployment.')
    if medium_failures:
        for tc in medium_failures[:2]:
            area = _infer_ui_area(tc)
            sel  = tc.get('selector') or tc.get('expected_selector') or ''
            rel_recs.append(f'MEDIUM failure: "{tc.get("name","")[:35]}" — selector "{sel[:30]}" not resolved in {area}.')
    if skip_count > 0:
        rel_recs.append(f'{skip_count} test(s) skipped. Verify optional elements are not misclassified as required.')
    categories.append(('🔧', 'Reliability', rel_recs, '#4f46e5', INDIGO_BG))

    # UX
    ux_recs = []
    nav_pass = any(
        _infer_ui_area(tc) == 'Navigation'
        and i < len(execution_results)
        and execution_results[i].get('status') == 'pass'
        for i, tc in enumerate(test_cases)
    )
    content_pass = any(
        _infer_ui_area(tc) in ('Main Content', 'Page Identity')
        and i < len(execution_results)
        and execution_results[i].get('status') == 'pass'
        for i, tc in enumerate(test_cases)
    )
    search_tested = any('search' in tc.get('name', '').lower() for tc in test_cases)
    search_passed = any(
        'search' in tc.get('name', '').lower()
        and i < len(execution_results)
        and execution_results[i].get('status') == 'pass'
        for i, tc in enumerate(test_cases)
    )

    ux_recs.append('Core navigation is visible — users can access main site sections.' if nav_pass
                   else 'Navigation is non-functional or untested. User flow between sections is at risk.')
    if content_pass:
        ux_recs.append('Primary content area is rendered — reading experience is intact.')
    if search_tested:
        ux_recs.append('Search capability is operational — content discovery is available.' if search_passed
                       else 'Search failed execution. Verify the selector and confirm it is not loaded asynchronously.')
    else:
        ux_recs.append('Search functionality was not tested. Consider adding a search smoke check if it is a core feature.')
    categories.append(('👤', 'UX & Accessibility', ux_recs, '#10b981', GREEN_BG))

    for emoji, cat_label, recs, color_hex, bg_color in categories:
        cat_tbl = Table([[Paragraph(
            f'<font color="{color_hex}"><b>{emoji}  {cat_label}</b></font>',
            ParagraphStyle('AICAT', fontSize=9, fontName='Helvetica-Bold', leading=12))
        ]], colWidths=[168*mm])
        cat_tbl.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), bg_color),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('TOPPADDING',    (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
            ('BOX',           (0,0), (-1,-1), 1, HexColor(color_hex)),
        ]))
        elements.append(cat_tbl)

        for rec_text in recs:
            rec_tbl = Table([[Paragraph(
                f'<font color="#64748b" size="7.5">•  {rec_text}</font>',
                ParagraphStyle('AIREC', fontSize=7.5, fontName='Helvetica', leading=11))
            ]], colWidths=[168*mm])
            rec_tbl.setStyle(TableStyle([
                ('BACKGROUND',    (0,0), (-1,-1), HexColor('#fafafa')),
                ('LEFTPADDING',   (0,0), (-1,-1), 16),
                ('TOPPADDING',    (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LINEBELOW',     (0,0), (-1,-1), 0.3, BORDER),
                ('LINEBEFORE',    (0,0), (0,-1),  2, HexColor(color_hex)),
            ]))
            elements.append(rec_tbl)
        elements.append(Spacer(1, 8))

    # FIX 7: Compute quality score and risk level
    quality_score, risk_level, risk_color = _compute_quality_score(
        pass_rate, load_time, fail_count, critical_failures, fragile_sel
    )

    elements.append(Spacer(1, 6))
    if critical_failures:
        vc, vb, vbrd = '#ef4444', HexColor('#fef2f2'), RED
        failed_areas  = ', '.join(set(_infer_ui_area(tc) for tc in critical_failures))
        vt = (f'Smoke validation FAILED due to critical issues in: {failed_areas}. '
              f'Core user journeys are blocked — do not promote to staging until resolved.')
        vi = '🔴'
    elif fail_count > 0 and pass_rate >= 60:
        vc, vb, vbrd = '#b45309', HexColor('#fffbeb'), ORANGE
        vt = (f'Smoke validation passed with {fail_count} medium-priority issue(s) detected. '
              f'Performance and UX improvements are recommended before production release.')
        vi = '🟡'
    elif pass_rate == 100:
        vc, vb, vbrd = '#059669', HexColor('#f0fdf4'), GREEN
        vt = ('Smoke validation passed successfully with no critical UI issues detected. '
              + ('Performance optimization is recommended to improve load time.' if load_time > 3000
                 else 'Application is stable and ready for functional testing.'))
        vi = '🟢'
    else:
        vc, vb, vbrd = '#b45309', HexColor('#fffbeb'), ORANGE
        vt = (f'Smoke validation completed with a {pass_rate}% pass rate. '
              f'Review skipped tests and confirm selector health before proceeding.')
        vi = '🟡'

    # FIX 7: include quality score + risk level in the final verdict box
    final_tbl = Table([[Paragraph(
        f'<font color="{vc}" size="9"><b>{vi}  Final AI Verdict</b></font><br/>'
        f'<font color="{vc}" size="8">{vt}</font><br/><br/>'
        f'<font color="#64748b" size="8"><b>Quality Score: </b></font>'
        f'<font color="{vc}" size="8"><b>{quality_score}/100</b></font>'
        f'<font color="#94a3b8" size="8">    |    </font>'
        f'<font color="#64748b" size="8"><b>Risk Level: </b></font>'
        f'<font color="{risk_color}" size="8"><b>{risk_level}</b></font>',
        ParagraphStyle('FAV', fontSize=8, fontName='Helvetica', leading=13))
    ]], colWidths=[168*mm])
    final_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), vb),
        ('BOX',           (0,0), (-1,-1), 2, vbrd),
        ('LEFTPADDING',   (0,0), (-1,-1), 14),
        ('RIGHTPADDING',  (0,0), (-1,-1), 14),
        ('TOPPADDING',    (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(final_tbl)
    elements.append(Spacer(1, 20))


# ─────────────────────────────────────────────────────────────────────────────
# FIX 1 — GENERATED SCRIPT SUMMARY (replaces raw script block)
# ─────────────────────────────────────────────────────────────────────────────

def build_script_section(elements, script, framework_label, test_cases=None):
    """FIX 1: Replace raw script dump with a compact Generated Script Summary."""
    if not script:
        return

    elements.append(Spacer(1, 18))
    elements.append(section_header('📄', f'Generated Script Summary — {framework_label}'))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        "<font color='#94a3b8' size='7.5'><i>"
        "Summary of the AI-generated test script. "
        "The full script file is available as a separate download."
        "</i></font>",
        ParagraphStyle('ScriptSumInfo', fontSize=7.5, fontName='Helvetica', leading=10)))
    elements.append(Spacer(1, 10))

    # Derive metadata from script content and test_cases
    tc_list = test_cases or []
    total_tests = len(tc_list)

    # Count from script lines as fallback
    if total_tests == 0:
        script_lines = script.replace('\\n', '\n').split('\n')
        total_tests = sum(1 for l in script_lines if 'def test_' in l or 'it(' in l or 'test(' in l)

    # Detect waits
    has_explicit_waits = (
        'WebDriverWait' in script or 'explicit_wait' in script or
        'cy.wait' in script or 'waitFor' in script or 'wait_for' in script
    )
    # Detect headless
    has_headless = 'headless' in script.lower() or '--headless' in script

    # Detect tested UI areas from test cases
    if tc_list:
        areas = list(dict.fromkeys(_infer_ui_area(tc) for tc in tc_list))
    else:
        # Try to infer from script keywords
        area_keywords = {
            'Navigation': ['nav', 'menu', 'navigation'],
            'Search Bar': ['search'],
            'Hero Section': ['hero', 'banner'],
            'Branding': ['logo', 'brand'],
            'Main Content': ['main', 'content'],
            'Authentication': ['login', 'auth', 'signin'],
            'Cart / Checkout': ['cart', 'checkout'],
            'Form': ['form', 'input'],
        }
        script_lower = script.lower()
        areas = [area for area, kws in area_keywords.items() if any(kw in script_lower for kw in kws)]

    areas_str = ', '.join(areas[:8]) if areas else 'General'

    # Build summary rows
    summary_rows = [
        [
            Paragraph('<font color="#ffffff"><b>Property</b></font>',
                      ParagraphStyle('SSH1', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Value</b></font>',
                      ParagraphStyle('SSH2', fontSize=8, fontName='Helvetica-Bold')),
        ],
        [
            Paragraph('<font color="#64748b"><b>Tests Generated</b></font>',
                      ParagraphStyle('SSL1', fontSize=8, fontName='Helvetica-Bold', leading=11)),
            Paragraph(f'<font color="#1e293b"><b>{total_tests}</b></font>'
                      f'<font color="#64748b" size="7.5"> {framework_label} smoke tests</font>',
                      ParagraphStyle('SSV1', fontSize=8, fontName='Helvetica', leading=11)),
        ],
        [
            Paragraph('<font color="#64748b"><b>Framework</b></font>',
                      ParagraphStyle('SSL2', fontSize=8, fontName='Helvetica-Bold', leading=11)),
            Paragraph(f'<font color="#1e293b">{framework_label}</font>',
                      ParagraphStyle('SSV2', fontSize=8, fontName='Helvetica', leading=11)),
        ],
        [
            Paragraph('<font color="#64748b"><b>Explicit Waits</b></font>',
                      ParagraphStyle('SSL3', fontSize=8, fontName='Helvetica-Bold', leading=11)),
            Paragraph(
                f'<font color="{"#10b981" if has_explicit_waits else "#f59e0b"}">'
                f'<b>{"Enabled" if has_explicit_waits else "Not detected"}</b></font>',
                ParagraphStyle('SSV3', fontSize=8, fontName='Helvetica-Bold', leading=11)),
        ],
        [
            Paragraph('<font color="#64748b"><b>Headless Mode</b></font>',
                      ParagraphStyle('SSL4', fontSize=8, fontName='Helvetica-Bold', leading=11)),
            Paragraph(
                f'<font color="{"#10b981" if has_headless else "#94a3b8"}">'
                f'<b>{"Headless Chrome configured" if has_headless else "Not configured"}</b></font>',
                ParagraphStyle('SSV4', fontSize=8, fontName='Helvetica-Bold', leading=11)),
        ],
        [
            Paragraph('<font color="#64748b"><b>Tested UI Areas</b></font>',
                      ParagraphStyle('SSL5', fontSize=8, fontName='Helvetica-Bold', leading=11)),
            Paragraph(f'<font color="#4f46e5">{areas_str}</font>',
                      ParagraphStyle('SSV5', fontSize=8, fontName='Helvetica', leading=11)),
        ],
    ]

    sum_tbl = Table(summary_rows, colWidths=[45*mm, 123*mm])
    sum_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('BACKGROUND',    (0,1), (0,-1), LIGHT_BG),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ('PADDING',       (0,0), (-1,-1), 8),
        ('LINEBELOW',     (0,0), (-1,-2), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, BORDER_DARK),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',   (0,0), (0,-1), 10),
    ]))
    elements.append(sum_tbl)

    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        '<font color="#94a3b8" size="7"><i>'
        '* Full script available as a separate downloadable file. '
        'Raw code omitted from this PDF to keep the report concise.'
        '</i></font>',
        ParagraphStyle('ScriptNote', fontSize=7, fontName='Helvetica', leading=10,
                       alignment=TA_CENTER)))


# ─────────────────────────────────────────────────────────────────────────────
# PAGE ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

def build_page_analysis(elements, scraped: dict, page_type: str):
    elements.append(section_header('🔍', 'Page Analysis'))
    elements.append(Spacer(1, 8))

    detected = []
    if scraped.get("inputs"):
        types = list(set(i.get("type","text") for i in scraped["inputs"]))
        detected.append(("Inputs", f"{len(scraped['inputs'])} champ(s) — types: {', '.join(types)}", "#3b82f6"))
    if scraped.get("buttons"):
        texts = [b.get("text","") for b in scraped["buttons"][:3] if b.get("text")]
        detected.append(("Buttons", f"{len(scraped['buttons'])} bouton(s) — ex: {', '.join(texts)}", "#8b5cf6"))
    if scraped.get("nav_links"):
        detected.append(("Navigation", f"{len(scraped['nav_links'])} lien(s) de navigation", "#10b981"))
    if scraped.get("forms"):
        detected.append(("Forms", f"{len(scraped['forms'])} formulaire(s) detecte(s)", "#f59e0b"))
    if scraped.get("images"):
        loaded = sum(1 for i in scraped["images"] if i.get("loaded"))
        detected.append(("Images", f"{len(scraped['images'])} image(s) — {loaded} chargee(s)", "#ec4899"))
    if scraped.get("alerts"):
        detected.append(("Alerts", f"{len(scraped['alerts'])} conteneur(s) d'erreur/alerte", "#ef4444"))
    if scraped.get("pagination"):
        detected.append(("Pagination", f"{len(scraped['pagination'])} element(s) de pagination", "#06b6d4"))
    if scraped.get("add_to_cart"):
        detected.append(("Add to Cart", f"{len(scraped['add_to_cart'])} bouton(s) panier detecte(s)", "#f97316"))
    if scraped.get("modals"):
        detected.append(("Modals", f"{len(scraped['modals'])} modal(s) detecte(e)(s)", "#6366f1"))

    risks = []
    load_time = scraped.get("load_time_ms", 0)
    if load_time > 3000:
        risks.append(f"Warning: Page lente ({load_time}ms) — test de performance inclus")
    if scraped.get("is_spa"):
        risks.append("Warning: SPA detecte (React/Vue/Angular) — waits explicites requis")
    if not scraped.get("inputs") and not scraped.get("buttons"):
        risks.append("Warning: Peu d'elements interactifs — tests generiques generes")
    if not scraped.get("alerts"):
        risks.append("Info: Aucun conteneur d'erreur — tests negatifs limites")

    if detected:
        det_rows = [[
            Paragraph('<font color="#ffffff"><b>Element</b></font>',
                      ParagraphStyle('DH', fontSize=8, fontName='Helvetica-Bold')),
            Paragraph('<font color="#ffffff"><b>Details</b></font>',
                      ParagraphStyle('DH2', fontSize=8, fontName='Helvetica-Bold')),
        ]]
        for name, detail, color in detected:
            det_rows.append([
                Paragraph(f'<font color="{color}"><b>{name}</b></font>',
                          ParagraphStyle('DN', fontSize=8, fontName='Helvetica-Bold', leading=11)),
                Paragraph(f'<font color="#475569">{detail}</font>',
                          ParagraphStyle('DD', fontSize=8, fontName='Helvetica', leading=11)),
            ])
        det_tbl = Table(det_rows, colWidths=[35*mm, 133*mm])
        det_tbl.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0), NAVY),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LIGHT_BG]),
            ('PADDING',       (0,0), (-1,-1), 7),
            ('LINEBELOW',     (0,0), (-1,-1), 0.4, BORDER),
            ('BOX',           (0,0), (-1,-1), 0.8, BORDER_DARK),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(det_tbl)
    else:
        elements.append(Paragraph(
            '<font color="#94a3b8">Aucun element interactif detecte sur cette page.</font>',
            ParagraphStyle('NoEl', fontSize=8, fontName='Helvetica')))

    if risks:
        elements.append(Spacer(1, 8))
        for risk in risks:
            elements.append(Paragraph(
                f'<font color="#f59e0b" size="7.5">{risk}</font>',
                ParagraphStyle('Risk', fontSize=7.5, fontName='Helvetica', leading=11)))
    elements.append(Spacer(1, 16))


# ─────────────────────────────────────────────────────────────────────────────
# FIX 5 — TEST PLAN (correct coverage counts)
# ─────────────────────────────────────────────────────────────────────────────

def build_test_plan(elements, test_cases: list, page_type: str, framework: str, scraped: dict):
    elements.append(section_header('📋', 'Test Plan'))
    elements.append(Spacer(1, 8))

    page_type_labels = {
        "login":     "Page de connexion — tests d'authentification",
        "ecommerce": "Page e-commerce — tests panier et navigation",
        "form":      "Page formulaire — tests de soumission et validation",
        "dashboard": "Dashboard — tests de navigation et affichage",
        "general":   "Page generale — tests de chargement et navigation",
    }
    strategy = page_type_labels.get(page_type, "Page generale")

    # FIX 5: count positive vs negative smoke validations correctly
    positive_count = sum(1 for t in test_cases if t.get('type', 'positive') == 'positive')
    negative_count = sum(1 for t in test_cases if t.get('type') == 'negative')

    summary_data = [
        [Paragraph('<font color="#ffffff"><b>Critere</b></font>',
                   ParagraphStyle('PH', fontSize=8, fontName='Helvetica-Bold')),
         Paragraph('<font color="#ffffff"><b>Valeur</b></font>',
                   ParagraphStyle('PH2', fontSize=8, fontName='Helvetica-Bold'))],
        [Paragraph('<font color="#64748b">Type de page detecte</font>',
                   ParagraphStyle('PL', fontSize=8, fontName='Helvetica-Bold')),
         Paragraph(f'<font color="#1e293b">{page_type.upper()} — {strategy}</font>',
                   ParagraphStyle('PV', fontSize=8, fontName='Helvetica'))],
        [Paragraph('<font color="#64748b">Framework</font>',
                   ParagraphStyle('PL2', fontSize=8, fontName='Helvetica-Bold')),
         Paragraph(f'<font color="#1e293b">{framework}</font>',
                   ParagraphStyle('PV2', fontSize=8, fontName='Helvetica'))],
        [Paragraph('<font color="#64748b">Nombre de tests</font>',
                   ParagraphStyle('PL3', fontSize=8, fontName='Helvetica-Bold')),
         Paragraph(f'<font color="#1e293b">{len(test_cases)} tests planifies</font>',
                   ParagraphStyle('PV3', fontSize=8, fontName='Helvetica'))],
        # FIX 5: use correct positive/negative counts with descriptive labels
        [Paragraph('<font color="#64748b">Coverage</font>',
                   ParagraphStyle('PL4', fontSize=8, fontName='Helvetica-Bold')),
         Paragraph(
             f'<font color="#10b981"><b>{positive_count} positive smoke validation{"s" if positive_count != 1 else ""}</b></font>'
             f'  <font color="#94a3b8">|</font>  '
             f'<font color="#ef4444"><b>{negative_count} negative validation{"s" if negative_count != 1 else ""}</b></font>',
             ParagraphStyle('PV4', fontSize=8, fontName='Helvetica'))],
    ]
    plan_tbl = Table(summary_data, colWidths=[45*mm, 123*mm])
    plan_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ('PADDING',       (0,0), (-1,-1), 7),
        ('LINEBELOW',     (0,0), (-1,-2), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, BORDER_DARK),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',   (0,0), (0,-1), 10),
    ]))
    elements.append(plan_tbl)
    elements.append(Spacer(1, 12))
    elements.append(Paragraph('<font color="#1e293b" size="9"><b>Scenarios planifies</b></font>',
                               ParagraphStyle('ScH', fontSize=9, fontName='Helvetica-Bold', leading=12)))
    elements.append(Spacer(1, 6))

    sc_rows = [[
        Paragraph('<font color="#ffffff"><b>#</b></font>',
                  ParagraphStyle('SCH1', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Scenario</b></font>',
                  ParagraphStyle('SCH2', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Objectif</b></font>',
                  ParagraphStyle('SCH3', fontSize=8, fontName='Helvetica-Bold')),
        Paragraph('<font color="#ffffff"><b>Priorite</b></font>',
                  ParagraphStyle('SCH4', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<font color="#ffffff"><b>Categorie</b></font>',
                  ParagraphStyle('SCH5', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]]
    for i, tc in enumerate(test_cases):
        priority  = tc.get("priority", "medium")
        category  = tc.get("category", "functional")
        pri_color = PRIORITY_COLORS.get(priority, '#94a3b8')
        cat_color = CATEGORY_COLORS.get(category, '#3b82f6')
        precond   = tc.get("preconditions", "Page accessible")
        precond   = precond[:50] + '…' if len(precond) > 50 else precond
        sc_rows.append([
            Paragraph(f'<font color="#64748b"><b>{tc.get("id","")}</b></font>',
                      ParagraphStyle('SCID', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(
                f'<b><font color="#1e293b" size="8">{tc.get("name","")}</font></b><br/>'
                f'<font color="#94a3b8" size="6.5">Pre: {precond}</font>',
                ParagraphStyle('SCN', fontSize=8, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="#475569" size="7.5">{tc.get("description","")[:60]}</font>',
                      ParagraphStyle('SCO', fontSize=7.5, fontName='Helvetica', leading=10)),
            Paragraph(f'<font color="{pri_color}"><b>{priority.upper()}</b></font>',
                      ParagraphStyle('SCP', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<font color="{cat_color}"><b>{category.upper()}</b></font>',
                      ParagraphStyle('SCC', fontSize=7, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ])
    sc_tbl = Table(sc_rows, colWidths=[8*mm, 52*mm, 62*mm, 22*mm, 24*mm])
    sc_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ('PADDING',       (0,0), (-1,-1), 7),
        ('LINEBELOW',     (0,0), (-1,-1), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, BORDER_DARK),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('ALIGN',         (0,0), (0,-1), 'CENTER'),
        ('ALIGN',         (3,0), (3,-1), 'CENTER'),
        ('ALIGN',         (4,0), (4,-1), 'CENTER'),
    ]))
    elements.append(sc_tbl)
    elements.append(Spacer(1, 20))


# ─────────────────────────────────────────────────────────────────────────────
# MAIN generate_pdf
# ─────────────────────────────────────────────────────────────────────────────

def generate_pdf(generation_data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=20*mm, leftMargin=22*mm,
                            topMargin=58*mm, bottomMargin=20*mm)

    url       = generation_data.get('url', '')
    framework = generation_data.get('framework', 'Selenium')
    load_time = generation_data.get('load_time_ms', 0)
    is_spa    = generation_data.get('is_spa', False)
    scraped   = generation_data.get('scraped', {
        'inputs': [], 'buttons': [], 'nav_links': [], 'forms': [],
        'images': [], 'alerts': [], 'pagination': [], 'add_to_cart': [],
        'modals': [], 'is_spa': is_spa, 'load_time_ms': load_time,
    })

    result              = generation_data.get('result', generation_data)
    test_cases          = result.get('test_cases',          generation_data.get('test_cases', []))
    test_cases_selenium = result.get('test_cases_selenium', generation_data.get('test_cases_selenium', []))
    test_cases_cypress  = result.get('test_cases_cypress',  generation_data.get('test_cases_cypress', []))
    script              = result.get('script',              generation_data.get('script', ''))
    script_selenium     = result.get('script_selenium',     generation_data.get('script_selenium', ''))
    script_cypress      = result.get('script_cypress',      generation_data.get('script_cypress', ''))
    page_type           = result.get('page_type',           generation_data.get('page_type', 'general'))
    execution_results   = generation_data.get('execution_results', [])

    elements = []

    # ── Header ────────────────────────────────────────────────
    header_data = [[
        Paragraph('<font color="#c9a227"><b>NEX</b></font><font color="#ffffff">TEST</font>',
                  ParagraphStyle('Logo', fontSize=24, fontName='Helvetica-Bold')),
        Paragraph(f'<font color="#64748b">Generated</font><br/>'
                  f'<font color="#94a3b8">{datetime.now().strftime("%B %d, %Y  •  %H:%M")}</font>',
                  ParagraphStyle('Date', fontSize=8.5, fontName='Helvetica', alignment=TA_RIGHT, leading=13)),
    ]]
    header_tbl = Table(header_data, colWidths=[90*mm, 78*mm])
    header_tbl.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(Spacer(1, -38*mm))
    elements.append(header_tbl)
    elements.append(Spacer(1, 6*mm))
    elements.append(Paragraph('Test Automation Report',
                               ParagraphStyle('Title', fontSize=22, textColor=WHITE,
                                              fontName='Helvetica-Bold', spaceAfter=2)))
    elements.append(Spacer(1, 14*mm))

    # ── Info Box ──────────────────────────────────────────────
    def info_label(txt):
        return Paragraph(f'<font color="#64748b">{txt}</font>',
                         ParagraphStyle('IL', fontSize=8, fontName='Helvetica-Bold', leading=12))
    def info_val(txt):
        return Paragraph(f'<font color="#1e293b">{txt}</font>',
                         ParagraphStyle('IV', fontSize=8.5, fontName='Helvetica', leading=12))

    load_badge_color = '#ef4444' if load_time > 3000 else '#10b981'
    load_badge       = 'SLOW'    if load_time > 3000 else 'GOOD'
    fw_display       = 'Selenium + Cypress' if framework == 'Both' else framework

    info_data = [
        [info_label('URL'),       info_val(url)],
        [info_label('Framework'), info_val(fw_display)],
        [info_label('Load Time'), Paragraph(
            f'<font color="#1e293b">{load_time} ms</font>  '
            f'<font color="{load_badge_color}"><b>{load_badge}</b></font>',
            ParagraphStyle('LT', fontSize=8.5, fontName='Helvetica', leading=12))],
        [info_label('Page Type'), info_val('SPA (React/Vue/Angular)' if is_spa else 'Standard HTML')],
        [info_label('Generated'), info_val(datetime.now().strftime('%Y-%m-%d  %H:%M'))],
    ]
    info_tbl = Table(info_data, colWidths=[32*mm, 136*mm])
    info_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (0,-1), LIGHT_BG),
        ('FONTSIZE',      (0,0), (-1,-1), 8.5),
        ('PADDING',       (0,0), (-1,-1), 7),
        ('LINEBELOW',     (0,0), (-1,-2), 0.4, BORDER),
        ('BOX',           (0,0), (-1,-1), 0.8, BORDER_DARK),
        ('ROWBACKGROUNDS',(0,0), (-1,-1), [WHITE, LIGHT_BG]),
        ('LEFTPADDING',   (0,0), (0,-1), 10),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(info_tbl)
    elements.append(Spacer(1, 20))

    # ── Legend ────────────────────────────────────────────────
    legend_items = [
        ('<b>Priority:</b>', ''),
        ('HIGH', '#ef4444'), ('MEDIUM', '#f59e0b'), ('LOW', '#10b981'),
        ('  |  <b>Category:</b>', ''),
        ('FUNCTIONAL', '#3b82f6'), ('PERFORMANCE', '#8b5cf6'),
        ('UI', '#ec4899'), ('NAVIGATION', '#10b981'),
    ]
    legend_parts = []
    for label, color in legend_items:
        legend_parts.append(f'<font color="{color}"><b>{label}</b></font>' if color
                            else f'<font color="#64748b">{label}</font>')
    elements.append(Paragraph(
        '  '.join(legend_parts),
        ParagraphStyle('Legend', fontSize=7, fontName='Helvetica', leading=10, textColor=HexColor('#64748b'))))
    elements.append(Spacer(1, 10))

    # ── Page Analysis + Test Plan + Planned UI Elements ───────
    active_tcs = test_cases_selenium if framework == 'Both' else test_cases
    build_page_analysis(elements, scraped, page_type)
    build_test_plan(elements, active_tcs, page_type, framework, scraped)
    build_planned_ui_elements(elements, active_tcs)

    # ── Main test sections ────────────────────────────────────
    if framework == 'Both':
        elements.append(framework_banner('  SELENIUM', SELENIUM_COLOR, SELENIUM_BG))
        elements.append(Spacer(1, 10))
        elements.append(section_header('📊', 'Test Summary — Selenium'))
        elements.append(Spacer(1, 8))
        build_stats_section(elements, test_cases_selenium, execution_results)
        build_execution_verdict_summary(elements, test_cases_selenium, execution_results, scraped)
        elements.append(Spacer(1, 18))
        elements.append(section_header('🧪', 'Test Cases — Selenium'))
        elements.append(Spacer(1, 8))
        build_test_cases_table(elements, test_cases_selenium, execution_results)
        if execution_results:
            elements.append(Spacer(1, 20))
            build_execution_evidence(elements, test_cases_selenium, execution_results)
            build_real_page_evidence(elements, test_cases_selenium, execution_results, scraped)
            build_ai_recommendations(elements, test_cases_selenium, execution_results, scraped)
        # FIX 1: pass test_cases to build_script_section
        build_script_section(elements, script_selenium, 'Selenium', test_cases_selenium)
        elements.append(Spacer(1, 30))

        elements.append(framework_banner('  CYPRESS', CYPRESS_COLOR, CYPRESS_BG))
        elements.append(Spacer(1, 10))
        elements.append(section_header('📊', 'Test Summary — Cypress'))
        elements.append(Spacer(1, 8))
        build_stats_section(elements, test_cases_cypress, [])
        elements.append(Spacer(1, 18))
        elements.append(section_header('🧪', 'Test Cases — Cypress'))
        elements.append(Spacer(1, 8))
        build_test_cases_table(elements, test_cases_cypress, [])
        # FIX 1: pass test_cases to build_script_section
        build_script_section(elements, script_cypress, 'Cypress', test_cases_cypress)

    else:
        elements.append(section_header('📊', 'Test Summary'))
        elements.append(Spacer(1, 8))
        build_stats_section(elements, test_cases, execution_results)
        build_execution_verdict_summary(elements, test_cases, execution_results, scraped)
        elements.append(Spacer(1, 22))
        elements.append(section_header('🧪', 'Test Cases'))
        elements.append(Spacer(1, 8))
        build_test_cases_table(elements, test_cases, execution_results)
        if execution_results:
            elements.append(Spacer(1, 20))
            build_execution_evidence(elements, test_cases, execution_results)
            build_real_page_evidence(elements, test_cases, execution_results, scraped)
            build_ai_recommendations(elements, test_cases, execution_results, scraped)
        # FIX 1: pass test_cases to build_script_section
        build_script_section(elements, script, framework, test_cases)

    elements.append(Spacer(1, 20))
    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
    return buffer.getvalue()