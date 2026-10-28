#!/usr/bin/env python3
"""Démonstration locale : PDF texte -> champs d'une commande -> JSON/CSV."""
import argparse
import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("Dépendance absente : python -m pip install -r requirements.txt")

# Adapter ces libellés lorsque le modèle de commande change.
LIBELLES = {
    "numero_commande": ["Commande", "Numéro de commande", "Référence"],
    "client": ["Client", "Nom du client"],
    "adresse": ["Adresse", "Adresse d'intervention", "Localisation"],
    "telephone": ["Téléphone", "Tel"],
    "date_intervention": ["Date d'intervention", "Date intervention"],
    "horaire": ["Horaire", "Horaire d'intervention"],
    "prestation": ["Prestation", "Intervention"],
    "consignes": ["Consignes", "Remarques"],
}


def normaliser(texte):
    """Ignorer les accents, la casse et les apostrophes typographiques."""
    texte = unicodedata.normalize("NFKD", texte.replace("’", "'"))
    return " ".join("".join(c for c in texte if not unicodedata.combining(c)).lower().split())


def extraire_champs(texte):
    # Aucun champ manquant n'est inventé : il conserve la valeur None (null).
    donnees = dict.fromkeys(LIBELLES)
    correspondances = {normaliser(label): cle
                       for cle, labels in LIBELLES.items() for label in labels}
    doublons = set()
    for ligne in texte.splitlines():
        # Cette démo attend une ligne « Libellé : valeur » par information.
        morceaux = re.split(r"\s*:\s*", ligne.strip(), maxsplit=1)
        if len(morceaux) != 2:
            continue
        cle = correspondances.get(normaliser(morceaux[0]))
        if cle and morceaux[1].strip():
            if donnees[cle] is not None:
                doublons.add(cle)
            else:
                donnees[cle] = morceaux[1].strip()
    if doublons:
        raise ValueError("Plusieurs valeurs pour : " + ", ".join(sorted(doublons))
                         + ". Utiliser un seul bon de commande par PDF.")
    return donnees


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", nargs="?", type=Path,
                        default=Path(__file__).with_name("commande_exemple.pdf"))
    parser.add_argument("--sortie", type=Path, default=Path("resultats"))
    args = parser.parse_args()
    if not args.pdf.is_file():
        parser.error(f"Fichier introuvable : {args.pdf}")
    try:
        with pdfplumber.open(args.pdf) as document:
            pages = [page.extract_text() or "" for page in document.pages]
        texte = "\n\n".join(pages)
        if not texte.strip():
            raise ValueError("Aucun texte détecté. Ce PDF est peut-être un scan : OCR nécessaire.")
        if any(not page.strip() for page in pages):
            print("Attention : une page ne contient aucun texte lisible (page vide ou scan).", file=sys.stderr)
        donnees = extraire_champs(texte)
        if not any(donnees.values()):
            raise ValueError("Aucun libellé reconnu. Adapter LIBELLES et la mise en page attendue.")
        # Empêcher l'écrasement du PDF d'entrée, même avec --sortie personnalisé.
        fichiers = [args.sortie / nom for nom in ("texte_extrait.txt", "commande.json", "commande.csv")]
        if args.pdf.resolve() in [f.resolve() for f in fichiers]:
            raise ValueError("Le dossier de sortie écraserait le PDF d'entrée.")
        args.sortie.mkdir(parents=True, exist_ok=True)
        fichiers[0].write_text(texte, encoding="utf-8")
        fichiers[1].write_text(json.dumps(donnees, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        with fichiers[2].open("w", newline="", encoding="utf-8-sig") as fichier:
            ecrivain = csv.DictWriter(fichier, fieldnames=list(donnees), delimiter=";")
            ecrivain.writeheader()
            # Neutraliser les formules lors de l'ouverture du CSV dans un tableur.
            ecrivain.writerow({k: "'" + v if v and v.lstrip().startswith(("=", "+", "-", "@")) else v
                              for k, v in donnees.items()})
        print(json.dumps(donnees, ensure_ascii=False, indent=2))
        manquants = [cle for cle, valeur in donnees.items() if valeur is None]
        if manquants:
            print("Champs non trouvés : " + ", ".join(manquants), file=sys.stderr)
        print(f"\nRésultats enregistrés dans : {args.sortie.resolve()}")
    except Exception as erreur:
        print(f"Extraction impossible : {erreur}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
