from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime

# Colors
NAVY      = HexColor('#060e1e')
GOLD      = HexColor('#c9a227')
GREEN     = HexColor('#10b981')
RED       = HexColor('#ef4444')
ORANGE    = HexColor('#f59e0b')
LIGHT_BG  = HexColor('#f5f6fa')
BORDER    = HexColor('#e5e7f0')
MUTED     = HexColor('#9ca3af')
WHITE     = white

def get_status_color(rate):
    if rate >= 80: return GREEN
    if rate >= 50: return ORANGE
    return RED

def generate_pdf(generation_data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # ── Custom styles ──────────────────────────────────────────
    title_style = ParagraphStyle('Title', fontSize=28, textColor=NAVY,
                                  fontName='Helvetica-Bold', spaceAfter=4,
                                  alignment=TA_LEFT)
    subtitle_style = ParagraphStyle('Subtitle', fontSize=12, textColor=MUTED,
                                     fontName='Helvetica', spaceAfter=0,
                                     alignment=TA_LEFT)
    section_style = ParagraphStyle('Section', fontSize=13, textColor=NAVY,
                                    fontName='Helvetica-Bold', spaceBefore=16,
                                    spaceAfter=8)
    body_style = ParagraphStyle('Body', fontSize=10, textColor=NAVY,
                                  fontName='Helvetica', spaceAfter=4,
                                  leading=16)
    small_style = ParagraphStyle('Small', fontSize=9, textColor=MUTED,
                                   fontName='Helvetica', spaceAfter=2)
    code_style = ParagraphStyle('Code', fontSize=8, textColor=HexColor('#334155'),
                                  fontName='Courier', spaceAfter=2,
                                  backColor=LIGHT_BG, leading=14,
                                  leftIndent=8, rightIndent=8)

    # ── Extract data ────────────────────────────────────────────
    url         = generation_data.get('url', '')
    framework   = generation_data.get('framework', 'Selenium')
    test_cases  = generation_data.get('test_cases', [])
    script      = generation_data.get('script', '')
    load_time   = generation_data.get('load_time_ms', 0)
    is_spa      = generation_data.get('is_spa', False)
    created_at  = generation_data.get('created_at', datetime.now().isoformat())

    # Stats
    pass_count  = sum(1 for t in test_cases if t.get('type') == 'positive')
    fail_count  = sum(1 for t in test_cases if t.get('type') == 'negative')
    skip_count  = len(test_cases) - pass_count - fail_count
    total       = len(test_cases)
    rate        = round((pass_count / total) * 100) if total > 0 else 0
    status_color = get_status_color(rate)

    # ── HEADER ──────────────────────────────────────────────────
    header_data = [[
        Paragraph('<font color="#c9a227"><b>NEX</b></font><font color="#060e1e">TEST</font>', ParagraphStyle('Logo', fontSize=22, fontName='Helvetica-Bold')),
        Paragraph(f'<font color="#9ca3af">Generated: {datetime.now().strftime("%B %d, %Y at %H:%M")}</font>',
                  ParagraphStyle('Date', fontSize=9, fontName='Helvetica', alignment=TA_RIGHT))
    ]]
    header_table = Table(header_data, colWidths=[90*mm, 80*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=16))

    # ── TITLE ───────────────────────────────────────────────────
    elements.append(Paragraph('Test Automation Report', title_style))
    elements.append(Paragraph(f'AI-Generated {framework} Test Suite', subtitle_style))
    elements.append(Spacer(1, 16))

    # ── INFO BOX ────────────────────────────────────────────────
    info_data = [
        ['🔗 URL', url],
        ['⚙️ Framework', framework],
        ['⏱ Load Time', f'{load_time}ms {"(slow)" if load_time > 3000 else "(good)"}'],
        ['🏗 Page Type', 'SPA (React/Vue/Angular)' if is_spa else 'Standard HTML'],
        ['📅 Generated', datetime.now().strftime('%Y-%m-%d %H:%M')],
    ]
    info_table = Table(info_data, colWidths=[40*mm, 130*mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), LIGHT_BG),
        ('TEXTCOLOR',  (0,0), (0,-1), MUTED),
        ('TEXTCOLOR',  (1,0), (1,-1), NAVY),
        ('FONTNAME',   (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME',   (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 8),
        ('GRID',       (0,0), (-1,-1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, LIGHT_BG]),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # ── STATS ────────────────────────────────────────────────────
    elements.append(Paragraph('📊 Test Summary', section_style))

    stats_data = [[
        Paragraph(f'<font color="#10b981"><b>{pass_count}</b></font><br/><font color="#9ca3af" size="8">PASSED</font>', ParagraphStyle('S', fontSize=20, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<font color="#ef4444"><b>{fail_count}</b></font><br/><font color="#9ca3af" size="8">FAILED</font>', ParagraphStyle('S', fontSize=20, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<font color="#f59e0b"><b>{skip_count}</b></font><br/><font color="#9ca3af" size="8">SKIPPED</font>', ParagraphStyle('S', fontSize=20, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<font color="#{("10b981" if rate>=80 else "f59e0b" if rate>=50 else "ef4444")}"><b>{rate}%</b></font><br/><font color="#9ca3af" size="8">PASS RATE</font>', ParagraphStyle('S', fontSize=20, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<font color="#060e1e"><b>{total}</b></font><br/><font color="#9ca3af" size="8">TOTAL</font>', ParagraphStyle('S', fontSize=20, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]]
    stats_table = Table(stats_data, colWidths=[34*mm]*5)
    stats_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,-1), WHITE),
        ('GRID',         (0,0), (-1,-1), 1, BORDER),
        ('ROUNDEDCORNERS', (0,0), (-1,-1), 8),
        ('PADDING',      (0,0), (-1,-1), 16),
        ('ALIGN',        (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(stats_table)
    elements.append(Spacer(1, 20))

    # ── TEST CASES ──────────────────────────────────────────────
    elements.append(Paragraph('🧪 Test Cases', section_style))

    tc_header = [['#', 'Test Name', 'Type', 'Expected Result']]
    tc_rows = []
    for tc in test_cases:
        tc_type  = tc.get('type', 'positive')
        type_color = '#10b981' if tc_type == 'positive' else '#ef4444' if tc_type == 'negative' else '#f59e0b'
        type_label = '✓ PASS' if tc_type == 'positive' else '✗ FAIL' if tc_type == 'negative' else '⚠ SKIP'
        tc_rows.append([
            str(tc.get('id', '')),
            Paragraph(f"<b>{tc.get('name','')}</b><br/><font color='#9ca3af' size='8'>{tc.get('description','')[:60]}...</font>",
                      ParagraphStyle('TC', fontSize=9, fontName='Helvetica', leading=14)),
            Paragraph(f'<font color="{type_color}"><b>{type_label}</b></font>',
                      ParagraphStyle('Type', fontSize=9, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(tc.get('expected','')[:60],
                      ParagraphStyle('Exp', fontSize=8, fontName='Helvetica', textColor=MUTED)),
        ])

    tc_table = Table(tc_header + tc_rows, colWidths=[10*mm, 80*mm, 25*mm, 55*mm])
    tc_table.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), NAVY),
        ('TEXTCOLOR',   (0,0), (-1,0), WHITE),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,0), 9),
        ('PADDING',     (0,0), (-1,-1), 8),
        ('GRID',        (0,0), (-1,-1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ('VALIGN',      (0,0), (-1,-1), 'TOP'),
        ('ALIGN',       (2,0), (2,-1), 'CENTER'),
    ]))
    elements.append(tc_table)
    elements.append(Spacer(1, 20))

    # ── SCRIPT ──────────────────────────────────────────────────
    if script:
        elements.append(Paragraph(f'📄 Generated {framework} Script', section_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=8))

        # Split script en lignes
        lines = script.replace('\\n', '\n').split('\n')[:60]  # max 60 lignes
        for line in lines:
            safe_line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            elements.append(Paragraph(safe_line or ' ', code_style))

        if len(script.split('\n')) > 60:
            elements.append(Paragraph('... (script truncated, download full version)', small_style))

    # ── FOOTER ──────────────────────────────────────────────────
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=8))
    elements.append(Paragraph(
        '<font color="#9ca3af">Generated by <b>NexTest</b> — AI-Powered Test Automation Platform</font>',
        ParagraphStyle('Footer', fontSize=8, fontName='Helvetica', alignment=TA_CENTER)
    ))

    doc.build(elements)
    return buffer.getvalue()