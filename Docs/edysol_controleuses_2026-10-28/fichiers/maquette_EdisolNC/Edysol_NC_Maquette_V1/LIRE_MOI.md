# Édysol NC — Maquette V1

Cette proposition contient 41 écrans vectoriels et un parcours HTML consultable hors ligne. Aucun service réel n’est connecté. Toutes les personnes, références et valeurs sont fictives.

## Consulter
Ouvrir `Edysol_Maquette.html` dans un navigateur. Le menu donne accès à tous les écrans. Les principaux boutons relient les parcours. Les champs des vues SVG sont dessinés. Une zone de simulation sous le compte rendu permet de saisir le véhicule, le compteur et la date, puis de consulter le suivi sans ressaisie. Les confirmations représentent des états de maquette, sans enregistrement serveur.

## Importer dans Figma
Créer un fichier Figma Design vide. Glisser les fichiers du dossier `ecrans` sur le canevas (ou utiliser File > Place image si nécessaire). Les SVG contiennent des textes, formes et couleurs vectoriels éditables ; ils ne constituent pas un fichier Figma natif. Si nécessaire, déplacer chaque SVG dans un Frame de même taille. Recréer les liens dans l’onglet Prototype : les liens HTML/SVG ne deviennent pas automatiquement des interactions Figma. La police proposée est Inter avec repli Arial ; installer Inter pour une restitution fidèle. Les SVG ne comprennent pas d’Auto Layout, de composants natifs, ni de variantes Figma.

Organiser le fichier en pages : 00 Fondations, 01 Site public, 02 Accès, 03 Cogérance, 04 Secrétariat, 05 Employés, 06 Contrôleuses. Utiliser l’inventaire pour les noms et dimensions. Les noms de fichiers suivent ces groupes : p-, g-, s-, e-, su- ; connexion est une vue commune.

## Direction artistique actuelle

La palette logo/publications décrite dans [PALETTE_EDYSOL.md](PALETTE_EDYSOL.md) remplace l’ancienne palette provisoire : bleu principal `#085895`, vert secondaire `#58AB29`, jaune d’accent `#F4D928`, fonds blancs/gris clairs et texte sombre. Le jaune n’est pas utilisé en texte sur fond blanc. Ne pas se servir des couleurs de l’interface Facebook comme référence. La structure et la typographie sont conservées : Inter avec repli Arial. Le site vitrine autonome conserve actuellement une palette différente ; il n’a pas été recoloré par la mise à jour documentaire du 28 octobre 2026.

## Périmètre et décisions reprises
- Site vitrine : accueil, prestations, entreprise, contact.
- Commande client : coordonnées, localisation, prestation, souhait de date, confirmation. La maquette distingue actuellement souhait et confirmation. La règle métier définitive (préférence ou réservation) reste à décider : voir [le tableau du premier parcours](../../Docs/DECISIONS_PREMIER_PARCOURS.md).
- Secrétaire : tableau de bord, liste et détail des commandes, création au nom d’un client, planning et affectations, clients, notifications.
- Les deux cogérants disposent du même espace de pilotage : vue d’ensemble, commandes, détail, planning, équipe, documents, notifications et aperçu PDF.
- Employés : même environnement mobile pour tous, contenu limité aux interventions affectées. Missions, détail avec binôme fixe ou organisation solo et consignes, compte rendu, notifications. Deux écrans présentent les activités de supervision et la coordination sur chantier.
- Organisation validée : quatre binômes fixes, les autres employés en solo. Deux contrôleuses, également employées de ménage, coordonnent les équipes sous les ordres de la secrétaire et des cogérants. Leur disponibilité pour une prestation est à vérifier séparément. Aucune règle de gestion des absences, de sélection des renforts ou de validation des changements n’est encore validée.
- Nouvelle commande : information au secrétariat et aux deux cogérants, historique conservé. L’interface affiche le suivi ; le canal externe et sa mise en œuvre restent à définir.
- Le PDF récapitule les données enregistrées. Les consignes aux employés proviennent directement de ces données ; aucune extraction du PDF n’est nécessaire dans le parcours cible.
- Paiement laissé à définir avec l’employeur. Aucun prestataire, prix ou moyen de paiement n’est imposé.

## Hypothèses à valider
Les coordonnées, métiers et catalogue exacts d’Édysol n’étant pas fournis, les prestations A/B et les descriptions sont provisoires. Les droits de modification précis, le responsable de validation des affectations, les absences et le canal de notification devront être validés. Les écrans mobiles concernent les employés ; la déclinaison mobile du site public et des espaces administratifs reste à produire après validation de cette V1.

Les états d’erreur, champs invalides, absence de résultat, mot de passe oublié et déconnexion réelle ne sont pas simulés. L’accès cogérance / secrétariat est un sélecteur de démonstration et ne représente pas l’authentification finale. Le prototype affiche plusieurs états fictifs indépendants : il ne synchronise ni planning ni commande réels ; les relevés de démonstration sont partagés en mémoire entre les vues de simulation.

## Comptabilité, stocks et véhicules

Lire `COMPTABILITE_STOCKS_VEHICULES.md` et `MODELE_DONNEES_API.md`. Les scripts commentés et leurs vérifications se trouvent dans `reference/`. La navigation entre rôles du prototype n’est pas une authentification. Aucun backend n’est connecté.

## Couleurs de l’entreprise

Les exports suivent le logo et les publications fournis. Voir `PALETTE_EDYSOL.md` pour les codes, les usages et les contrastes vérifiés. La structure et les fonctions sont conservées.

## Vérifications et limites au 28 octobre 2026

41 SVG et 41 entrées d’inventaire contrôlés ; syntaxe des trois scripts HTML vérifiée ; 39 contrôles de la référence métier réussis. Voir [le relevé détaillé](../../Docs/VERIFICATIONS_2026-10-28.md). Le fichier Figma en ligne et le parcours navigateur complet n’ont pas été revérifiés lors de cette actualisation. Les mentions de livraisons Figma dans les documents historiques ne constituent pas une vérification actuelle de ce fichier.
