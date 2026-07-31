with open('pdf_generator.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

patches = [
    ("ws5.add_image(xl_img, f\"D{p95_hdr_row}\")\n",
     "    r = max(r, p95_hdr_row + 14)  # clear space below the p95 chart image\n"),
    ("ws5.add_image(xl_img, f\"D{thr_hdr_row}\")\n",
     "    r = max(r, thr_hdr_row + 14)  # clear space below the throughput chart image\n"),
    ("ws5.add_image(xl_img, f\"F{pf_hdr_row}\")\n",
     "    r = max(r, pf_hdr_row + 14)  # clear space below the breakdown chart image\n"),
]

count = 0
new_lines = []
for line in lines:
    new_lines.append(line)
    for marker, insert_line in patches:
        if line.strip() == marker.strip():
            new_lines.append(insert_line)
            count += 1

print(f"Patches appliques : {count} / 3")

if count == 3:
    with open('pdf_generator.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Fichier sauvegarde.")
else:
    print("ATTENTION: pas 3 correspondances trouvees, rien sauvegarde. Verifie les marqueurs.")
