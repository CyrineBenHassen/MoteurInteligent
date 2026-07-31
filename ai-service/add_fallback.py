with open('pdf_generator.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

FALLBACK = '''    if not action_plan:
        action_plan = []
        for tk in ('load', 'stress', 'spike', 'soak'):
            if tk not in summary:
                continue
            tk_label = {'load': 'Load Test', 'stress': 'Stress Test', 'spike': 'Spike Test', 'soak': 'Soak Test'}[tk]
            action_plan.append({
                'scenario': f'Continuous Performance Monitoring — {tk_label}',
                'category': 'Monitoring',
                'priority': 'LOW',
                'action': f'Track p95 and error rate for {tk_label} over time to catch regressions early.',
                'responsible': 'DevOps',
                'deadline': 'Next Sprint',
                'status': 'To Do',
            })
'''

targets = [i for i, l in enumerate(lines) if '_call_groq_k6_plan(tests, url, summary)' in l]
print(f"Occurrences trouvees : {len(targets)}")

if len(targets) != 2:
    print("ATTENTION: attendu exactement 2 occurrences, arret sans modification.")
else:
    for idx in sorted(targets, reverse=True):
        lines.insert(idx + 1, FALLBACK)
        print(f"Fallback insere apres la ligne {idx + 1}")

    with open('pdf_generator.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Fichier sauvegarde.")
