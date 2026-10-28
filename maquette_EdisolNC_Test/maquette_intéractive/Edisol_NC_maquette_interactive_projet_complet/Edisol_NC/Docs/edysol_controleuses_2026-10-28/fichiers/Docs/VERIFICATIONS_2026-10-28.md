# Vérifications documentaires et techniques — 28 octobre 2026

## Base examinée

Dépôt : https://github.com/eklj/edisol_projet ; branche par défaut `main` ; commit `88365040cb0f7df057e1f9edde10d30d7272f6cb`. La référence distante a été interrogée avant les corrections et correspond à la copie locale. Aucun push ni changement distant n’a été effectué. Les corrections portent uniquement sur des fichiers Markdown.

## Contrôles exécutés

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| Suite `reference/verifier_metier.js` | 38 contrôles réussis, Node.js 24.22.1 | Référence métier locale, pas un contrôle d’accès HTTP |
| Inventaire, SVG et identifiants des vues HTML principales | 41 entrées uniques, 41 SVG, 41 vues ; ensembles identiques | Présence et correspondances ; pas une revue graphique |
| Trois scripts intégrés à `Edysol_Maquette.html` | `node --check` réussi pour chacun | Syntaxe uniquement, pas une exécution du DOM |
| `commande_exemple.pdf`, `_2.pdf`, `_3.pdf` | Code de sortie 0 pour chacun ; huit champs JSON non nuls ; CSV et texte présents | Python 3.12.14, pdfplumber 0.11.9 ; sorties temporaires distinctes, exemples versionnés préservés |
| Liens locaux Markdown des fichiers livrés | Cibles existantes contrôlées hors ancres | Ne vérifie pas les URL externes ni les ancres de section |
| Patch documentaire | Application contrôlée sur la base examinée, puis comparaison des fichiers | Ne garantit pas l’application sur une autre version du dépôt |

## Reproduire la suite existante

Depuis la racine du dépôt, avec Node.js installé :

```bash
# Vérifier les règles illustrées par la référence JavaScript
node maquette_EdisolNC/Edysol_NC_Maquette_V1/reference/verifier_metier.js
```

Pour un PDF, avec les dépendances Python disponibles :

```bash
# Utiliser une sortie distincte, sans remplacer les exports suivis
python3 API/demo_pdf_edysol/extraire_pdf.py API/demo_pdf_edysol/commande_exemple.pdf --sortie /tmp/edysol_verification_pdf_1
```

## Limites et suites

Aucun backend, aucune migration SQL ni CI de tests n’est identifié dans cette base. Les tests actuels ne prouvent ni authentification, ni autorisation sur des routes/objets, ni persistance, ni fonctionnement d’une commande complète. Les formats PDF génériques, l’exactitude métier des huit valeurs et les PDF scannés ne sont pas validés par ces essais.

Le fichier Figma en ligne, les pages déployées, la vidéo et le contenu des PDF d’automatisation n’ont pas été réexaminés. Les rapports de contraste dans `PALETTE_EDYSOL.md` sont des relevés historiques, sans nouveau calcul dans cette étape. Aucun parcours navigateur complet ni audit visuel/accessibilité n’a été exécuté.

L’étape suivante consiste à recueillir les décisions métier une question à la fois. Les choix d’architecture et le développement attendent les règles indispensables. Une affectation manuelle pour la première livraison reste une option à discuter ; aucun automatisme de remplacement ou de passage en solo n’est décidé. Les notifications réelles nécessiteront une autorisation explicite.

## Complément : correction de l’intitulé métier

Les 38 contrôles ci-dessus décrivent la vérification documentaire initiale. Après la correction officielle du rôle, la suite comporte 39 contrôles réussis. Voir [le relevé de correction](CHANGEMENT_INTITULE_ROLE.md) pour les fichiers, la compatibilité et les limites.
