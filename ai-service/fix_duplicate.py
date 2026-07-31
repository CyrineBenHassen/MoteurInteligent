import re

with open('pdf_generator.py', 'r', encoding='utf-8') as f:
    content = f.read()

def_start = content.find('def generate_k6_xlsx(')
if def_start == -1:
    print("ERREUR: def generate_k6_xlsx introuvable.")
else:
    # Cherche toutes les occurrences du bloc de reorder des sheets
    marker = "wb._sheets = [wb[name] for name in pdf_order if name in wb.sheetnames]"
    marker_positions = [m.start() for m in re.finditer(re.escape(marker), content) if m.start() > def_start]

    print(f"Occurrences du marker trouvees apres def_start : {len(marker_positions)}")

    if len(marker_positions) < 1:
        print("ERREUR: marker introuvable, arret.")
    else:
        first_marker = marker_positions[0]
        # Cherche le "return buffer.getvalue()" juste apres ce marker
        return_match = re.search(r'return buffer\.getvalue\(\)', content[first_marker:first_marker+500])
        if not return_match:
            print("ERREUR: return buffer.getvalue() introuvable apres le marker.")
        else:
            cut_start = first_marker + return_match.end()

            pdf_def_match = re.search(r'^def generate_pdf\(', content[cut_start:], re.MULTILINE)
            if not pdf_def_match:
                print("ERREUR: def generate_pdf introuvable apres cut_start.")
            else:
                cut_end = cut_start + pdf_def_match.start()
                removed = content[cut_start:cut_end]
                new_content = content[:cut_start] + "\n\n\n" + content[cut_end:]

                with open('pdf_generator.py', 'w', encoding='utf-8') as f:
                    f.write(new_content)

                print(f"Supprime {len(removed)} caracteres ({removed.count(chr(10))} lignes).")
                print("Fichier corrige et sauvegarde.")