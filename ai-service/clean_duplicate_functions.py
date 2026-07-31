#!/usr/bin/env python3
"""
Nettoie pdf_generator.py en supprimant les définitions de fonctions dupliquées
au niveau module (top-level). Ne garde que la DERNIÈRE définition de chaque nom
de fonction — c'est celle qui s'exécute réellement en Python, donc c'est celle
qui doit rester dans le fichier.

Usage:
    python clean_duplicate_functions.py pdf_generator.py

Ça écrit un fichier pdf_generator.cleaned.py à côté, et affiche un rapport
des fonctions dupliquées trouvées + supprimées. Vérifie le résultat avant
de remplacer ton fichier original.
"""
import ast
import sys
from collections import defaultdict


def clean_duplicates(source_path: str) -> str:
    with open(source_path, "r", encoding="utf-8") as f:
        source = f.read()

    tree = ast.parse(source)
    lines = source.splitlines(keepends=True)

    # 1. Repérer toutes les défs top-level (FunctionDef) par nom
    top_level_funcs = [
        node for node in tree.body
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
    ]

    by_name = defaultdict(list)
    for node in top_level_funcs:
        by_name[node.name].append(node)

    # 2. Identifier les noms dupliqués et les nodes à supprimer (tout sauf le dernier)
    to_delete = []  # liste de (start_line, end_line) 1-indexed inclus
    report = []
    for name, nodes in by_name.items():
        if len(nodes) > 1:
            report.append((name, len(nodes)))
            # garder seulement la DERNIÈRE définition (celle qui s'exécute réellement)
            for node in nodes[:-1]:
                start = node.lineno
                end = node.end_lineno
                to_delete.append((start, end, name))

    if not report:
        print("Aucune fonction dupliquée trouvée au niveau module.")
        return source

    print("Fonctions dupliquées trouvées (nom -> nombre de définitions):")
    for name, count in sorted(report, key=lambda x: -x[1]):
        print(f"  - {name}: {count} définitions -> {count - 1} supprimée(s), garde la dernière")

    # 3. Supprimer les plages de lignes (en partant de la fin pour ne pas décaler les indices)
    to_delete.sort(key=lambda x: x[0], reverse=True)
    for start, end, name in to_delete:
        # start/end sont 1-indexed inclus -> slice lines[start-1:end]
        del lines[start - 1:end]

    cleaned = "".join(lines)

    # 4. Vérifier que le résultat est toujours syntaxiquement valide
    try:
        ast.parse(cleaned)
    except SyntaxError as e:
        print(f"\n⚠️  ATTENTION: le fichier nettoyé a une erreur de syntaxe: {e}")
        print("Le fichier .cleaned.py est quand même écrit pour inspection manuelle.")

    return cleaned


def main():
    if len(sys.argv) != 2:
        print("Usage: python clean_duplicate_functions.py <fichier.py>")
        sys.exit(1)

    source_path = sys.argv[1]
    cleaned = clean_duplicates(source_path)

    out_path = source_path.replace(".py", ".cleaned.py")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(cleaned)

    print(f"\nFichier nettoyé écrit dans: {out_path}")
    print("Vérifie le diff avant de remplacer ton fichier original, par exemple:")
    print(f"  diff {source_path} {out_path}")


if __name__ == "__main__":
    main()