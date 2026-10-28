# Démonstration d'extraction PDF - Édysol

Exemple fictif, sans données réelles. Python 3.10 ou supérieur.

## Lancer sous Ubuntu

Depuis le dossier décompressé :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python extraire_pdf.py
```

Si la création de l'environnement échoue faute de venv :
`sudo apt install python3-venv`, puis reprendre les commandes.

Le script utilise par défaut le PDF fourni. Il affiche les informations et crée
`resultats/commande.json`, `resultats/commande.csv` et `resultats/texte_extrait.txt`.
Le CSV utilise le séparateur point-virgule. Des résultats de démonstration sont inclus.

## Essayer avec un autre PDF

```bash
python extraire_pdf.py "/chemin/vers/ma_commande.pdf" --sortie resultats_perso
```

Le script attend un seul bon de commande par PDF et une ligne `Libellé : valeur`
pour chaque champ. Exemple : `Client : Jean Exemple`.
Il lit toutes les pages et reconnaît les libellés de la constante `LIBELLES`.
Les champs absents valent `null` dans le JSON. Les champs répétés sont refusés
pour éviter de fusionner deux commandes par erreur. Les sorties existantes du
même dossier sont remplacées à chaque exécution réussie.

## Comment cela fonctionne

1. `pdfplumber` récupère le texte présent dans les pages.
2. `extraire_champs` cherche les libellés et récupère les valeurs après les deux-points.
3. Python enregistre le texte brut, un objet JSON et un tableau CSV.

## Limites

Ce script est une démonstration adaptée au PDF fourni, pas un lecteur universel.
Les scans et photos demandent un OCR préalable. Les tableaux, adresses sur plusieurs
lignes et mises en page différentes demandent une adaptation après examen d'un vrai
exemple. Les valeurs extraites ne sont pas validées (date, téléphone, adresse) :
les vérifier avant usage opérationnel. Aucun message WhatsApp n'est envoyé et aucun
service externe n'est appelé par le script. L'installation des dépendances nécessite
une connexion Internet. Le CSV préfixe les valeurs pouvant être interprétées comme
des formules par une apostrophe ; le JSON garde les valeurs originales.
