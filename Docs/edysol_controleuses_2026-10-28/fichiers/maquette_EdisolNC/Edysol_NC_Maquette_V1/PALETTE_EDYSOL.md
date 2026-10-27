# Identité visuelle ÉDYSOL

Les sources historiques nommées `image.png` et `image(1).png` ne sont pas présentes sous ces noms dans le dépôt ; aucun nouvel échantillonnage n’a été réalisé le 28 octobre 2026. Le dossier voisin `logoedysol/` contient également des visuels de l’entreprise.

Selon le relevé de création de la palette, les couleurs de marque sont prélevées dans le logo fourni (`image.png`).
Les publications d’ÉDYSOL dans `image(1).png` confirment cette direction ;
les éléments de l’interface Facebook sont exclus des références.
Les images étant compressées, les pixels voisins présentent des variations :
les codes retenus sont des échantillons de l’image, pas une charte officielle.

| Usage | Code |
| --- | --- |
| Bleu du logo : navigation, titres, actions principales | #085895 |
| Vert du logo : petits badges et accents complémentaires | #58AB29 |
| Jaune du logo : touches de mise en évidence sur bleu | #F4D928 |
| Cartes | #FFFFFF |
| Fond gris très clair | #F5F7F8 |
| Fond secondaire | #F0F3F5 |
| Texte courant sombre | #202B33 |
| Texte secondaire | #52616B |
| Vert foncé de lisibilité et confirmations | #36751C |
| Avertissements | #8A4B00 |
| Erreurs | #B42318 |

Le vert foncé est une adaptation pour les textes, distincte du vert exact
prélevé dans le logo. Les neutres et les couleurs d’erreur/avertissement
sont des couleurs fonctionnelles choisies pour la lecture.
Le jaune n’est pas utilisé comme texte sur fond blanc.
Les libellés des statuts restent présents : leur sens ne dépend pas uniquement
de leur couleur.

Le relevé historique annonce une harmonisation des deux pages Figma. Leur état en ligne n’a pas été revérifié le 28 octobre 2026. Le dépôt contient les 41 SVG, la planche d’ensemble et la maquette HTML avec cette palette. Le site vitrine `site _web/dist/index.html` conserve sa palette antérieure. Le périmètre
comprend le site public et les espaces des cogérants, de la secrétaire,
des contrôleuses et des employés, avec comptabilité, stocks et véhicules.

La structure, les dimensions, les textes, la typographie, les liens et
les fonctionnalités existantes sont conservés. Aucune règle métier n’est modifiée.

## Vérification de lisibilité

| Association | Rapport de contraste |
| --- | --- |
| Blanc sur bleu principal | 7,39:1 |
| Texte sombre sur blanc | 14,44:1 |
| Texte secondaire sur fond gris très clair | 5,96:1 |
| Texte sombre sur vert du logo | 5,00:1 |
| Vert foncé sur gris secondaire | 5,07:1 |
| Jaune sur bleu secondaire | 6,80:1 |
| Avertissement sur blanc | 6,80:1 |
| Erreur sur blanc | 6,57:1 |

Ces rapports sont ceux consignés lors de la création de la palette, sans nouveau calcul le 28 octobre 2026. Ils concernent les associations définies ci-dessus. Selon ce relevé historique, des captures
des écrans d’accueil, de comptabilité, de supervision et de compte rendu
ont également été inspectées. Ils ne constituent pas un audit complet
d’accessibilité d’une application en production.

Figma : https://www.figma.com/design/ZcnFBw29yE79JlSMuxTpTJ
