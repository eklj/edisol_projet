# Intégration des six visuels existants — 9 novembre 2026

## Version examinée

- Dépôt : https://github.com/eklj/edisol_projet
- Branche distante examinée : `main` (également `origin/HEAD`).
- Commit source : `7398b5f86ee731da8cf8db9e850c5bb3dfbc50b7`, message « po », daté du 9 novembre 2026 à 07:34:36, heure de Nouvelle-Calédonie.
- Branche locale de travail : `maquette/integration-visuels-2026-11-09`.
- Dossier retenu : `maquette_interactive/`. Le dernier commit le met à jour et supprime l'ancienne copie imbriquée. Ce dossier contient le catalogue partagé, les trois pages actuelles, les modules métier et les tests. `Edysol_Site_Interactif/` et `site _web/` sont des versions antérieures distinctes, non modifiées.
- Une seconde interrogation de la référence distante a confirmé le même commit avant livraison. Aucun commit supplémentaire, push ou déploiement n'a été effectué.

## Source des images

Les images proviennent exclusivement des ressources de `EDYSOL_maquette_visuels_integres.zip`, générées le 6 novembre 2026. Aucun fichier HTML, style, routeur, module métier ou test de cette archive n'a remplacé un fichier du dépôt actuel.

| Ressource demandée | Identifiant conservé | Affectation dans la maquette actuelle |
|---|---|---|
| Entretien soigné d'un salon lumineux | `domicile` | Galerie Domicile, carrousel des prestations et présentation de l'entreprise |
| Chariot et binôme dans un couloir | `equipe` | Présentation de l'entreprise, accueil, galerie et résumé de formulaire utilisant ce visuel |
| Monobrosse dans un hall carrelé | `monobrosse` | Carte Lavage mécanisé des sols, carrousel des prestations et galerie Sols |
| Agent d'entretien aspirant un bureau lumineux | `aspiration` | Carte Entretien des sols, accueil, carrousel des prestations et galerie Sols |
| Nettoyage professionnel d'une baie vitrée | `vitres` | Carte Nettoyage des vitres, accueil, carrousel des prestations et galerie Vitres |
| Nettoyage professionnel d'un bureau vitré | `bureaux` | Carte Mobilier et postes de travail, carrousels entreprise/prestations et galerie Bureaux |

Les six SVG provisoires sont conservés comme ressources antérieures. L'image d'ambiance `interieur` et tous les autres fichiers graphiques présents dans le commit source restent identiques. Aucun nouveau service n'est ajouté.

## Modifications

1. `js/commun/visuels.js` : remplacement ciblé des références des six illustrations, ajout des sources WebP responsives, descriptions alternatives et légendes indiquant les personnes et lieux fictifs. Les identifiants, catégories, titres, ordre et fonctions existantes sont conservés.
2. `js/public/accueil.js` : la pastille des cartes reprend le statut du visuel (« Visuel d’illustration ») au lieu du texte fixe « Illustration provisoire ». Les descriptions, liens vers les prestations, accès et autres interactions restent identiques.
3. `assets/images/generees/` : ajout de 18 WebP existants, trois tailles par image (640 × 400, 1 024 × 640, 1 600 × 1 000), soit 1 400 000 octets au total. Les formats optimisés sont réutilisés sans nouvelle génération ni réencodage.
4. `ressources-visuels.json` : correspondances, origine, texte alternatif, dimensions, tailles de fichiers et empreintes SHA-256.
5. Le présent rapport.

Les recadrages utilisent le comportement actuel du site : ratio 16:10, `object-fit: cover` dans les cartes/carrousels et `contain` dans la visionneuse. Les sujets restent centraux. Les attributs `sizes`, le chargement différé, les dimensions déclarées et la priorité de l'image d'accueil restent ceux du code actuel.

## Vérifications réalisées

- `npm test` depuis `maquette_interactive/` : **95 contrôles métier réussis**, sans changement des tests. La comparaison avec une référence V1 absente reste explicitement signalée non vérifiée par la suite existante.
- Syntaxe des deux modules JavaScript modifiés : valide ; `git diff --check` : aucune erreur.
- Catalogue : sept visuels conservés, six nouvelles associations ; les titres, catégories et l'objet du visuel d'ambiance initial sont identiques au commit source.
- Les 22 chemins d'images du catalogue (`src` et `srcset`) existent : 18 nouvelles ressources et quatre ressources d'ambiance déjà présentes.
- Les 18 WebP sont décodables ; dimensions, poids et empreintes correspondent aux ressources récupérées.
- Navigateur : inspection à **1 363 pixels** et dans une vue responsive de **390 pixels** ; aucun débordement horizontal. Images générées chargées, recadrages inspectés, légendes d'illustration visibles.
- Carrousel : suivant/précédent et pause contrôlés ; agrandissement d'une carte ; navigation clavier dans la visionneuse ; fermeture par Échap et retour du focus au bouton d'origine.
- Galerie mobile : filtre Domicile contrôlé, illustration du salon correctement associée.
- Les interactions de balayage et les préférences de mouvement conservent leur code actuel ; aucun essai sur téléphone Android physique n'a été effectué.
- Contrôle Git : seuls les deux modules d'image ci-dessus sont modifiés parmi les fichiers initialement suivis. HTML, CSS, textes de prestations, logo, anciens médias, routes, accès, modules métier et tests restent identiques au commit source. Aucun contenu des autres dossiers du dépôt n'est modifié.

## Contenu de la livraison

Le ZIP contient le dossier `maquette_interactive/` complet mis à jour et `integration-visuels.diff`, un patch Git binaire comprenant également les nouvelles images. Ce patch est à appliquer depuis la racine d'une copie du dépôt au commit source ; il ne remplace pas le dépôt par une ancienne archive.

Pour consulter la maquette, depuis son dossier : `npm start`, puis ouvrir `http://127.0.0.1:8000/`. `npm test` exécute les contrôles métier sans dépendance navigateur. Les captures déjà présentes dans `apercus/` sont celles du dépôt source ; elles n'ont pas été remplacées ni présentées comme des captures de cette intégration.
