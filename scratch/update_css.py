import re
import os

css_path = r'c:\Users\syrin\Desktop\TestPFE\frontend\src\pages\dashboard\Dashboard.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Fonts
content = re.sub(
    r"@import url\('https://fonts.googleapis.com/css2\?family=Cormorant\+Garamond.*?'\);",
    "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');",
    content
)

# 2. Update CSS Variables (Light Theme)
new_vars = """
  --white: #ffffff;
  --bg: #f2f4f8;
  --bg2: #eef0f7;
  --navy: #091223;
  --navy2: #12203b;
  --gold: #d4af37;
  --gold2: #f3d45c;
  --gold3: #fce895;
  --goldbg: rgba(212, 175, 55, 0.08);
  --goldborder: rgba(212, 175, 55, 0.2);
  --sgold: 0 0 30px rgba(212, 175, 55, 0.3), 0 8px 24px rgba(212, 175, 55, 0.15);
  --text: #1a1f36;
  --sub: #636b7c;
  --muted: #8d97aa;
  --border: rgba(229, 231, 240, 0.8);
  --border2: rgba(239, 240, 246, 0.8);
  --card: rgba(255, 255, 255, 0.75);
  --sw: 268px; --sc: 76px; --hh: 76px;
  --ease: cubic-bezier(.22,1,.36,1);
  --ease2: cubic-bezier(.34,1.56,.64,1);
  --shadow: 0 8px 32px rgba(9, 18, 35, 0.04);
  --shadow2: 0 16px 48px rgba(9, 18, 35, 0.08);
  --glass: blur(16px);
  --C: 'Outfit', sans-serif;
  --D: 'DM Sans', sans-serif;
"""
content = re.sub(r'--white:#ffffff;.*?--D:\'DM Sans\',sans-serif;', new_vars.strip(), content, flags=re.DOTALL)

# Add background gradient to root
content = content.replace(
    'background: var(--bg);',
    'background: var(--bg);\n  background-image: radial-gradient(circle at 15% 50%, rgba(212,175,55,0.03), transparent 30%), radial-gradient(circle at 85% 30%, rgba(18,32,59,0.03), transparent 30%);'
)

# 3. Add Glassmorphism to Sidebar
content = content.replace(
    'background: var(--white);',
    'background: rgba(255, 255, 255, 0.85);\n  backdrop-filter: var(--glass); -webkit-backdrop-filter: var(--glass);'
)

# 4. Add Glassmorphism to Panels and Cards
content = content.replace(
    'background: var(--card);',
    'background: var(--card);\n  backdrop-filter: var(--glass); -webkit-backdrop-filter: var(--glass);'
)

# Fix header background
content = content.replace(
    'background: var(--white); border-bottom: 1px solid var(--border);',
    'background: rgba(255, 255, 255, 0.75); backdrop-filter: var(--glass); -webkit-backdrop-filter: var(--glass); border-bottom: 1px solid var(--border);'
)

# Fix corner radiuses for a more modern look
content = content.replace('border-radius: 16px;', 'border-radius: 24px;')
content = content.replace('border-radius: 18px;', 'border-radius: 24px;')
content = content.replace('border-radius: 14px;', 'border-radius: 20px;')
content = content.replace('border-radius: 10px;', 'border-radius: 14px;')

# Enhance stat-card animation
content = content.replace(
    'transform: translateY(-5px);',
    'transform: translateY(-6px) scale(1.02);'
)

# Update Typography - Remove uppercase from some titles for modern feel
content = content.replace('text-transform: uppercase;', 'text-transform: uppercase; letter-spacing: 1.5px;')

# 5. Update Dark Theme Variables
dark_vars = """
  --white:   rgba(15, 25, 41, 0.6);
  --bg:      #050a14;
  --bg2:     #0a1426;
  --card:    rgba(15, 25, 41, 0.65);
  --navy:    #ffffff;
  --navy2:   #e2e8f0;
  --text:    #f8fafc;
  --sub:     #94a3b8;
  --muted:   #64748b;
  --border:  rgba(255, 255, 255, 0.06);
  --border2: rgba(255, 255, 255, 0.03);
  --goldbg:  rgba(212, 175, 55, 0.12);
  --goldborder: rgba(212, 175, 55, 0.25);
"""
content = re.sub(r'\[data-theme="dark"\] \.dash-root \{.*?\n\}', f'[data-theme="dark"] .dash-root {{\n{dark_vars}\n}}', content, flags=re.DOTALL)

# Add rich dark background
content = content.replace(
    '[data-theme="dark"] .dash-root .content { background: #080f1d; }',
    '[data-theme="dark"] .dash-root .content { background: transparent; }'
)
content = content.replace(
    '[data-theme="dark"] .dash-root .sidebar {\n  background: #060e1e;',
    '[data-theme="dark"] .dash-root .sidebar {\n  background: rgba(6, 14, 30, 0.6);\n  backdrop-filter: var(--glass); -webkit-backdrop-filter: var(--glass);'
)
content = content.replace(
    '[data-theme="dark"] .dash-root .header {\n  background: #060e1e;',
    '[data-theme="dark"] .dash-root .header {\n  background: rgba(6, 14, 30, 0.6);\n  backdrop-filter: var(--glass); -webkit-backdrop-filter: var(--glass);'
)

# Inject dark mode mesh background into root
dark_root = """
[data-theme="dark"] .dash-root {
  background: #050a14;
  background-image: 
    radial-gradient(circle at 20% 0%, rgba(212, 175, 55, 0.08), transparent 40%),
    radial-gradient(circle at 80% 100%, rgba(18, 32, 59, 0.4), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(6, 14, 30, 0.8), transparent 60%);
}
"""
content += dark_root

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("CSS Refactored Successfully!")
