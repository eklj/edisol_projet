# Édysol NC — Maquette V1

Cette proposition contient 41 écrans vectoriels et un parcours HTML consultable hors ligne. Aucun service réel n’est connecté. Toutes les personnes, références et valeurs sont fictives.

## Consulter
Ouvrir `Edysol_Maquette.html` dans un navigateur. Le menu donne accès à tous les écrans. Les principaux boutons relient les parcours. Les champs des vues SVG sont dessinés. Une zone de simulation sous le compte rendu permet de saisir le véhicule, le compteur et la date, puis de consulter le suivi sans ressaisie. Les confirmations représentent des états de maquette, sans enregistrement serveur.

## Importer dans Figma
Créer un fichier Figma Design vide. Glisser les fichiers du dossier `ecrans` sur le canevas (ou utiliser File > Place image si nécessaire). Les SVG contiennent des textes, formes et couleurs vectoriels éditables ; ils ne constituent pas un fichier Figma natif. Si nécessaire, déplacer chaque SVG dans un Frame de même taille. Recréer les liens dans l’onglet Prototype : les liens HTML/SVG ne deviennent pas automatiquement des interactions Figma. La police proposée est Inter avec repli Arial ; installer Inter pour une restitution fidèle. Les SVG ne comprennent pas d’Auto Layout, de composants natifs, ni de variantes Figma.

Organiser le fichier en pages : 00 Fondations, 01 Site public, 02 Accès, 03 Cogérance, 04 Secrétariat, 05 Employés. Utiliser l’inventaire pour les noms et dimensions. Les noms de fichiers suivent ces groupes : p-, g-, s-, e-.

## Direction artistique proposée
Identité provisoire, sans logo officiel : mot-symbole typographique « édysol ». Bleu nuit #102E38, vert #136B52, vert pâle #E8F4EE, fond #F4F7F6, texte secondaire #657B82, bordure #DCE6E5. Inter : titres 30–62 px, corps 14–18 px, boutons 14 px. Rayons 8–14 px, espacement basé sur 8 px. Boutons primaires verts et secondaires blancs bordés. Ne pas utiliser uniquement la couleur pour exprimer un statut : le libellé est toujours présent.

## Périmètre et décisions reprises
- Site vitrine : accueil, prestations, entreprise, contact.
- Commande client : coordonnées, localisation, prestation, souhait de date, confirmation. La date souhaitée ne vaut pas confirmation d’intervention.
- Secrétaire : tableau de bord, liste et détail des commandes, création au nom d’un client, planning et affectations, clients, notifications.
- Les deux cogérants disposent du même espace de pilotage : vue d’ensemble, commandes, détail, planning, équipe, documents, notifications et aperçu PDF.
- Employés : même environnement mobile pour tous, contenu limité aux interventions affectées. Missions, détail avec binôme fixe ou organisation solo et consignes, compte rendu, notifications. Deux écrans présentent les activités de supervision et la coordination sur chantier.
- Organisation validée : quatre binômes fixes, les autres employés en solo. Deux superviseuses, également employées de ménage, coordonnent les équipes sous les ordres de la secrétaire et des cogérants. Leur disponibilité pour une prestation est à vérifier séparément. Aucune règle de gestion des absences, de sélection des renforts ou de validation des changements n’est encore validée.
- Nouvelle commande : information au secrétariat et aux deux cogérants, historique conservé. L’interface affiche le suivi ; le canal externe et sa mise en œuvre restent à définir.
- Le PDF récapitule les données enregistrées. Les consignes aux employés proviennent directement de ces données ; aucune extraction du PDF n’est nécessaire dans le parcours cible.
- Paiement laissé à définir avec l’employeur. Aucun prestataire, prix ou moyen de paiement n’est imposé.

## Hypothèses à valider
Les coordonnées, métiers et catalogue exacts d’Édysol n’étant pas fournis, les prestations A/B et les descriptions sont provisoires. L’identité visuelle, les droits de modification précis, le responsable de validation des affectations, les absences et le canal de notification devront être validés. Les écrans mobiles concernent les employés ; la déclinaison mobile du site public et des espaces administratifs reste à produire après validation de cette V1.

Les états d’erreur, champs invalides, absence de résultat, mot de passe oublié et déconnexion réelle ne sont pas simulés. L’accès cogérance / secrétariat est un sélecteur de démonstration et ne représente pas l’authentification finale. Le prototype affiche plusieurs états fictifs indépendants : il ne synchronise ni planning ni commande réels ; les relevés de démonstration sont partagés en mémoire entre les vues de simulation.

## Comptabilité, stocks et véhicules

Lire `COMPTABILITE_STOCKS_VEHICULES.md` et `MODELE_DONNEES_API.md`. Les scripts commentés et leurs vérifications se trouvent dans `reference/`. La navigation entre rôles du prototype n’est pas une authentification. Aucun backend n’est connecté.

## Couleurs de l’entreprise

Les exports suivent le logo et les publications fournis. Voir `PALETTE_EDYSOL.md` pour les codes, les usages et les contrastes vérifiés. La structure et les fonctions sont conservées.
