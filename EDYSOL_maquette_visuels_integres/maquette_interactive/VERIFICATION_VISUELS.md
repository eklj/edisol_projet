# Vérification du lot visuels — 6 novembre 2026

## Résultats obtenus

- Six images réellement générées avec image_gen, chacune avec la photo existante comme référence visuelle.
- Revue visuelle de la série : rendu photographique cohérent, gestes et matériel visibles, absence de logo ou texte ajouté.
- 18 variantes WebP : 640×400, 1024×640 et 1600×1000 ; 33 282 à 163 704 octets par fichier.
- Catalogue exécuté dans une machine virtuelle JavaScript : 28 références vers des fichiers présents ; 7 visuels dotés de textes alternatifs, dont 6 générés.
- `npm test` : 95 contrôles réussis (39 droits de référence, 15 organisation, 12 notifications, 16 déplacements, 13 géolocalisation). Simulations locales uniquement.
- Photo existante, logo, SVG historiques, couleurs, structure et fonctions internes conservés.
- Images responsives via srcset/sizes ; chargement différé existant conservé, première image d’accueil prioritaire.

## Vérifications non effectuées

`npm run verifier` n’a pas pu démarrer : navigateur Playwright absent. Le navigateur Chromium installé échoue au démarrage avec « socket() failed: Operation not permitted ». Le téléchargement du navigateur Playwright a échoué (archive vide/tronquée).

Par conséquent : pas de nouvelles captures de la maquette sur ordinateur ou téléphone ; recadrages dans la mise en page, lisibilité des superpositions, interactions clavier/tactiles, galeries, carrousels et respect de la préférence de mouvement non vérifiés en navigateur pour ce lot. Aucune capture historique n’est présentée comme preuve de cette intégration.

L’aperçu `apercus/serie-visuels-generes.jpg` montre les six nouveaux visuels avec leur sujet ; ce n’est pas une capture de la maquette.

## Emplacements restants

Les six emplacements explicitement provisoires du catalogue ont une nouvelle image. Aucun visuel authentique de chantier ou de salarié n’est fourni : de telles photos restent à fournir si l’entreprise souhaite montrer ses réalisations réelles. L’image d’ambiance d’origine est conservée avec son statut antérieur.

## Reproduire les contrôles visuels

Depuis le dossier maquette_interactive : `npm install`, `npx playwright install chromium`, puis `npm run verifier` ou `npm run apercus`. Pour consulter : `npm start`, puis http://127.0.0.1:8000. Les anciens aperçus sont historiques.

Aucune publication ni aucun push effectué.
