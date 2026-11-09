# EV-017 — Prestations corrigées et correspondances

Livraison du 9 novembre 2026, depuis le dépôt actuel https://github.com/eklj/edisol_projet, branche `main`, commit `ae63a8a4962170f1d0249d8f0b5d556b87ebf57c`, dossier `maquette_interactive/`.

Branche locale de correction : `maquette/prestations-ev017-2026-11-09`. Aucun push, publication ou déploiement. Le dépôt source et les anciennes livraisons restent conservés.

## Sources et limites

- **S1 : instruction actuelle d'Ethan**, reprenant les activités déclarées et autorisant la correction de la maquette.
- **S2 : EV-017**, registre `EDYSOL_Registre_Evolutions_V1.md`, version 5, modifié le 9 novembre 2026, lu pour cette correction : [registre](https://chatgpt.com/library?file_id=libfile_7ce783ddb8ac8191ac7d8b01deb6bf9f&account_id=personal). EV-017 transcrit les réponses originales Q1, Q8 et Q27 lues par l'Assistant 2. Le formulaire n'a pas été rouvert ni modifié dans cette passe.
- **S3 : questionnaire d'origine**, référencé par EV-017 : [Google Forms — réponses](https://docs.google.com/forms/d/1-pASmy4n9dEAC6ybJ5bbdv4mfTFbewFHf_epue48P8U/edit#responses).
- **S4 : code du commit source**, notamment `js/commun/catalogue.js`, ses quatre entrées antérieures et `js/commun/visuels.js`.
- **S5 : dernière livraison des visuels**, `EDYSOL_Maquette_Actuelle_Visuels_2026-11-09.zip` : comparaison binaire des 18 WebP avec ceux du dépôt actuel, tous identiques. Aucune réintégration nécessaire ; aucun ancien code d'archive n'a remplacé les sources actuelles.

Q1 citée dans EV-017 : « Nettoyage des parties communes / fin de chantier / fin de bail / commerces / bureaux / particuliers / enlèvement encombrants / enlèvement tags / espaces verts... ». Les points de suspension interdisent de présenter la liste comme définitivement exhaustive. Q27 cite aussi « karcher ». Aucun contenu détaillé, surface, méthode précise, déchet accepté, tarif, délai ou engagement n'est déduit de ces intitulés.

## Tableau de correspondance

Chaque identifiant se retrouve dans le catalogue partagé, la carte publique et les deux formulaires. Le lien prérempli est `commande.html?prestation=IDENTIFIANT`. Le même identifiant et le même titre alimentent récapitulatif, détail interne, document imprimable, planning et terrain.

| Activité / entrée conservée | Identifiant | Nature / classement | Source | Illustration utilisée |
|---|---|---|---|---|
| Nettoyage des parties communes | `parties-communes` | Offre citée | S1/S2, Q1 | Emplacement explicite |
| Nettoyage de fin de chantier | `fin-chantier` | Offre citée | S1/S2, Q1 | Emplacement explicite |
| Nettoyage de fin de bail | `fin-bail` | Offre citée | S1/S2, Q1 | Emplacement explicite |
| Nettoyage de commerces | `commerces` | Offre citée | S1/S2, Q1 | Emplacement explicite |
| Nettoyage de bureaux | `bureaux` | Offre citée ; ne définit pas les tâches incluses | S1/S2, Q1 | `bureaux`, illustration existante d'un geste d'entretien |
| Nettoyage chez les particuliers | `particuliers` | Offre/contexte cité, distinct du type de client | S1/S2, Q1 | `domicile`, illustration existante d'un salon |
| Enlèvement d'encombrants | `encombrants` | Offre citée | S1/S2, Q1 ; corroborations Q8/Q27 | Emplacement explicite ; déchets et filières non définis |
| Enlèvement de tags | `tags` | Offre citée | S1/S2, Q1 ; corroborations Q8/Q27 | Emplacement explicite ; supports et méthodes non définis |
| Espaces verts | `espaces-verts` | Offre citée | S1/S2, Q1 ; corroborations Q8/Q27 | Emplacement explicite ; aucun détail de tâches inventé |
| Nettoyage au Kärcher | `karcher` | Activité technique citée, périmètre et libellé public à préciser | S1/S2, Q27 | Emplacement explicite ; jamais la monobrosse |
| Entretien des sols | `sols` | Ancienne entrée : offre ou tâche à préciser | S4, pictogrammes du logo ; non réfutée par Q1 | `aspiration`, conservée |
| Lavage mécanisé des sols | `lavage` | Ancienne entrée : offre ou technique à préciser | S4, pictogrammes du logo ; non réfutée par Q1 | `monobrosse`, conservée, distincte de Kärcher |
| Nettoyage des vitres | `vitres` | Ancienne entrée : offre ou tâche à préciser | S4, pictogrammes du logo ; non réfutée par Q1 | `vitres`, conservée |
| Mobilier et postes de travail | `mobilier` | Ancienne entrée : offre ou tâche à préciser | S4, pictogrammes du logo ; non réfutée par Q1 | `bureaux`, conservée |
| Demande spécifique | `specifique` | Besoin non listé ; ne remplace aucune offre déclarée | S4, parcours existant | Emplacement explicite dans le résumé |

Les images ne prouvent pas un contenu contractuel de prestation. Les six images générées restent identifiées comme illustrations de personnes et lieux fictifs. L'image d'ambiance initiale, le logo, les autres ressources et les anciens SVG sont également conservés.

## Structure partagée et compatibilité

`OFFRES` contient les neuf activités Q1, `ACTIVITES_TECHNIQUES` l'activité Q27 et `ENTREES_HISTORIQUES` les quatre entrées conservées. Chaque entrée porte sa nature, son groupe et sa source. Aucun rattachement de tâche à une offre n'est inventé. Les anciennes descriptions déduites du logo restent archivées dans `resumeHistorique` ; le texte visible indique désormais le classement et le contenu encore à préciser.

`PRESTATIONS` réunit ces quatorze entrées pour les consommateurs existants. `GROUPES_PRESTATIONS` organise leur présentation. `TYPES_CLIENTS` demeure une liste indépendante contenant les deux types déjà présents : Particulier et Professionnel. Choisir une prestation ne modifie pas automatiquement le type du client.

La demande garde le champ scalaire `prestation` et les boutons radio ; aucune multisélection n'est introduite. Le formulaire partagé affiche quinze choix avec la demande spécifique, répartis en groupes accessibles. Toutes les anciennes URL préremplies restent reconnues. Aucun identifiant existant n'est renommé, fusionné ou supprimé. La version 3 du stockage et les anciennes demandes restent inchangées ; aucune migration n'est nécessaire.

`prestationParId` reste compatible. `libellePrestation` sert aux consommateurs internes ; un identifiant historique extérieur au catalogue est affiché explicitement au lieu d'être effacé ou réassigné. Une nouvelle saisie doit néanmoins utiliser une entrée connue et une seule chaîne d'identifiant.

`visuelPrestation` et `mediaPrestation` protègent le rendu contre un visuel absent. Huit activités citées n'ont pas d'image pertinente et affichent « Illustration à fournir ». Aucun appel à `v.id` sur une valeur absente, aucune source vide et aucun remplacement automatique par l'image d'une autre activité. La visionneuse des cartes ne contient que les images disponibles, sans doublon. La galerie d'images existante demeure une galerie de médias, pas une liste exhaustive d'offres.

## Fichiers modifiés ou ajoutés

| Fichier | Changement ciblé |
|---|---|
| `js/commun/catalogue.js` | Dix activités citées, quatre entrées historiques conservées, sources/natures/groupes et libellé partagé |
| `js/commun/formulaire-commande.js` | Groupes de choix communs client/secrétariat ; types clients séparés ; choix unique maintenu |
| `js/commun/visuels.js` | Résolution défensive du visuel et emplacement partagé sans image |
| `js/public/accueil.js` | Quatorze cartes, variante de tuile de 1 à 4, image facultative et galerie dédupliquée |
| `js/public/commande.js` | Récapitulatif commun et résumé sans image hors sujet |
| `js/espace/vues/bureau.js` | Source commune pour listes, détails, recherche et document imprimable |
| `js/espace/vues/planning.js` | Titre dans le choix de demande et description accessible des interventions |
| `js/espace/vues/terrain.js` | Catalogue commun explicité ; prestation dans l'en-tête du compte rendu |
| `js/demo/depot-demo.js` | Validation du champ scalaire ; aucune réécriture des commandes existantes |
| `index.html` | Présentation ne réduisant plus les prestations aux quatre pictogrammes |
| `css/base.css`, `css/public.css` | Styles limités au nouvel emplacement et à la catégorie de carte ; grille responsive existante conservée |
| `outils/tester_catalogue.js`, `package.json` | Douze scénarios EV-017 ajoutés à la commande de tests |
| `LIRE_MOI.md`, présent tableau | Référence courante et précisions restantes |

## Vérifications exécutées

- `npm test` : **95 contrôles existants et 12 scénarios EV-017 réussis**. Ces scénarios comprennent vingt créations de demandes (dix activités, deux sources), leur rechargement local, les anciens identifiants, les médias facultatifs, la distinction Kärcher/monobrosse, les groupes de radios et le refus d'une multisélection.
- Les chemins `src` et `srcset` du catalogue visuel existent ; les 18 WebP sont identiques au dépôt source et à la dernière livraison.
- Vérification de syntaxe Node des modules modifiés ; `git diff --check`.
- Navigateur, largeur 1 363 px : 14 cartes, quatre colonnes, huit emplacements sans photo ; aucun débordement horizontal.
- Vue responsive à 390 px : 14 cartes, une colonne ; formulaire sans débordement, lien Kärcher prérempli, passage au clavier de Kärcher vers l'entrée historique Sols avec une seule radio cochée.
- Parcours client complet de démonstration : parties communes → récapitulatif → enregistrement → détail du secrétariat → affectation locale → mission employé. Le même titre est conservé dans ces étapes. Aucune donnée réelle utilisée ou envoyée.
- Formulaire secrétariat : quinze choix affichés et sélection de Kärcher. Ancien lien client `?prestation=vitres` : toujours sélectionné correctement.
- Carte Bureaux : agrandissement, navigation clavier vers l'image suivante, fermeture Échap ; bouton suivant du carrousel des prestations toujours fonctionnel.
- Les accès, notifications, modèles d'équipes et règles de planning existants ne sont pas modifiés par ce correctif. Aucune donnée fictive de test de navigateur n'est incluse dans les fichiers livrés.

La suite navigateur historique `npm run verifier` n'a pas été exécutée dans cette passe ; les essais ci-dessus ont été effectués dans le navigateur de vérification. Aucun essai Android physique, contrôle serveur ni recette indépendante n'est revendiqué. La comparaison V1 externe absente reste explicitement non vérifiée dans les tests métier existants.

## Questions restantes

1. Q1 se termine par « ... » : quelles autres activités, le cas échéant, doivent être ajoutées ?
2. Quel contenu exact et quelles limites définir pour chaque offre, sans les déduire des images ?
3. Sols, lavage mécanisé, vitres et mobilier sont-ils des offres autonomes, des tâches/options ou des techniques rattachées ?
4. Quel libellé public définitif et quel périmètre retenir pour l'activité Kärcher ?
5. Une demande pourra-t-elle regrouper plusieurs prestations ? Le champ actuel reste unique en attendant cette décision.
6. Fournir des photos/illustrations pertinentes pour les huit activités sans média, si souhaité. Le manque d'image n'empêche pas la demande.

## Livraison et transmission

L'archive unique contient `maquette_interactive/` complet avec toutes les images actuelles, les prestations corrigées, ce tableau, les tests et `correctif-prestations-ev017.diff`. Ce diff s'applique depuis la racine du dépôt au commit source ; il ne contient pas de remplacement par une ancienne archive.

À Production : utiliser les identifiants et natures du tableau, garder les types clients séparés, arbitrer les questions restantes et le choix multiple avant toute migration. À l'Expert : vérifier la couverture des dix activités, les anciens liens et demandes, l'absence de contenu inventé, les emplacements manquants et les deux saisies. La réalisation décrite reste une maquette locale sans nouveau serveur.

Aucun registre d'une autre conversation, formulaire Google, dépôt distant ou déploiement n'a été modifié.
