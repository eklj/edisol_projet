# ÉDYSOL — Site public avec galeries

Ouvrir Edysol_Bleue.html, Edysol_Verte.html ou Edysol_Mixte.html dans un navigateur. Chaque fichier est autonome et conserve la maquette interne et ses simulations locales. Aucun site n'a été publié.

## Modifications réalisées

Les vues Accueil, Entreprise et Prestations sont désormais adaptables au téléphone et intègrent des galeries indépendantes avec légendes, précédent/suivant, pause/reprise, clavier, balayage et agrandissement. Échap ferme la galerie et rend le focus au bouton d'origine. Le logo conserve ses couleurs. Les fonds restent bleus et verts, le jaune sert aux accents.

Les interfaces internes, les commandes, les comptes rendus et la comptabilité conservent leur contenu. Cette livraison est une maquette HTML, pas un backend de production.

## Photos encore nécessaires

Aucune série de photos réelles de chantiers dont la publication est autorisée n'était disponible. Les emplacements sont explicitement identifiés ; aucune image fictive n'est présentée comme un chantier ÉDYSOL. Les intitulés Prestation A/B sont ceux de la maquette et restent à confirmer.

Fournir les photos par prestation avec une courte légende, une description alternative et la confirmation des autorisations et de l'absence d'informations confidentielles visibles. Le catalogue src/photos.js regroupe les emplacements. src/public.js filtre les photos selon ces validations.

## Comportement et performances

Le défilement doux intervient toutes les sept secondes uniquement avec plusieurs photos autorisées. Il est suspendu hors écran, au survol, lorsque la page est masquée, après une action manuelle, en économie de données et avec les animations réduites. Une galerie vide ou à une seule photo reste utilisable sans lecture automatique.

Les médias ont un espace réservé, des dimensions déclarées, un chargement différé et un repli en cas d'erreur. Les variantes responsives srcset sont prises en charge. La compression des futures photos reste à réaliser lors de leur réception ; aucune photo réelle absente n'a pu être optimisée.

## Vérifications

Rendus ordinateur et téléphone inspectés. Navigation manuelle et clavier, galerie, fermeture Échap, retour du focus et lien vers le formulaire contrôlés. Avance automatique, pause/reprise, réduction des animations et balayage simulé contrôlés avec deux images techniques distinctes, exclues de cette archive.

Les originaux avant évolution sont conservés dans references/. Les sources ajoutées sont commentées en français. Figma n'a pas été modifié.
