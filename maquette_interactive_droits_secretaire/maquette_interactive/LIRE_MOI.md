# ÉDYSOL NC : maquette interactive

Maquette navigable du site public et des espaces internes d'ÉDYSOL. Elle remplace un passage par Figma : tout se parcourt dans le navigateur.

> **Mode démonstration.** Les données sont fictives et restent dans le navigateur. Aucun message n'est envoyé. Aucun paiement n'est déclenché. Rien n'est publié.

## Lancer la maquette

Aucune installation n'est nécessaire pour consulter la maquette.

**Méthode 1 : ouvrir le fichier.** Double-cliquer sur `maquette_interactive/index.html`. Les scripts sont classiques : ils fonctionnent sans serveur.

**Méthode 2 : serveur local Node.js** (recommandé, Node 18 ou plus) :

```bash
cd maquette_interactive
node outils/serveur.js 8000
```

**Méthode 3 : serveur Python**, depuis la racine du dépôt :

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory maquette_interactive
```

Ouvrir ensuite <http://127.0.0.1:8000/>. Arrêter avec `Ctrl+C`.

| Page | Adresse |
| --- | --- |
| Site public | `index.html` |
| Demande de prestation | `commande.html` |
| Espaces internes | `espace.html` |

## Lancer les vérifications

Tests des règles métier, sans dépendance (Node 18 ou plus) :

```bash
cd maquette_interactive
npm test
```

`npm test` fonctionne avec l'archive de la maquette seule. Il lance six séries :

| Fichier | Contenu |
| --- | --- |
| `outils/verifier_metier_reference.js` | Les 39 contrôles de la référence V1 (relevés, stocks, droits), copiés sans modification |
| `outils/tester_organisation.js` | Binômes fixes, solos, conflits signalés |
| `outils/tester_notifications.js` | Ordre de la boîte, lectures par personne, conditions de lecture |
| `outils/tester_deplacement.js` | Déplacement d'intervention : durée conservée, binôme complet, conflits bloquants |
| `outils/tester_geolocalisation.js` | Mesures GPS, état de communication, trajets avec interruptions, accès à la carte |
| `outils/tester_pieces_jointes.js` | Pièces jointes : type réel, taille, nombre, nom de stockage, droit de consultation |

La comparaison entre `js/metier/suivi_metier.js` et l'original V1 n'est possible que dans le dépôt complet. Hors du dépôt, le test affiche « NON VÉRIFIÉ » au lieu de l'ignorer.

Vérification complète dans un navigateur (Playwright) :

```bash
cd maquette_interactive
npm install
npx playwright install chromium
npm run verifier
```

`npm run apercus` refait les captures du dossier `apercus/`.

## Parcours conseillé

1. Sur l'accueil, faire défiler les carrousels, mettre en pause, agrandir une image. Filtrer la galerie.
2. Cliquer sur « Demander une prestation ». Remplir les quatre étapes. Noter la référence obtenue.
3. Suivre le lien « Voir la demande côté secrétariat ». La commande et sa notification interne apparaissent.
4. Dans le planning, affecter la commande à un binôme fixe. Essayer un créneau déjà pris : le conflit est signalé.
5. Ouvrir l'espace Employés, choisir l'agent affecté et rédiger le compte rendu avec un véhicule.
6. Revenir en Cogérance, Comptabilité, Véhicules : le relevé apparaît sans nouvelle saisie.
7. En Cogérance, ouvrir Notifications avec « Cogérant 1 ». Ouvrir une notification non lue. Changer la personne pour « Cogérant 2 » : elle y est toujours non lue.
8. En Cogérance, ouvrir « Planning et affectations », vue « Jour par ressource », jour de demain. Glisser EDY-044 (binôme fixe 2) d'une heure plus tôt, puis cliquer « Annuler le déplacement ».
9. Passer en Secrétariat, même écran : le changement y est visible (mêmes données). La secrétaire peut à son tour glisser l'intervention, ou l'ouvrir pour changer sa date, son horaire ou son binôme. L'historique de la commande garde l'auteur, la date, l'avant et l'après.
10. Ouvrir « Suivi des véhicules » (menu ou raccourci du tableau de bord), dans l'un ou l'autre espace. Choisir V-DÉMO-01 et suivre son déplacement. Déplacer la carte : le suivi se met en pause.
11. Faire une nouvelle demande. À l'étape « Détails et date », joindre des photos et un PDF (exemples fictifs dans `outils/fichiers_test/`). En retirer un, essayer un fichier `.txt`.
12. Ouvrir la demande en Secrétariat : photos en miniature, agrandissement, PDF. La planifier sur le binôme fixe 1. En Employés, choisir Agent A : la mission montre les mêmes fichiers. Choisir Agent C : l'accès est refusé.

Le bouton « Réinitialiser la démo » remet toutes les données fictives à zéro.

## Organisation du code

```text
maquette_interactive/
├── index.html, commande.html, espace.html   Pages
├── css/
│   ├── base.css        Couleurs, polices, boutons, champs, badges (commun)
│   ├── public.css      Site public, carrousels, galerie, visionneuse
│   ├── commande.css    Parcours de commande
│   └── espace.css      Espaces internes (bureau et terrain)
├── js/
│   ├── commun/         Utilitaires, catalogue, visuels, carrousel, visionneuse, champs de commande
│   │   └── positions.js      Point d'intégration des positions GPS (« Edysol.positions »)
│   ├── public/         Gabarit (en-tête, pied), accueil, parcours de commande
│   │   └── pieces-jointes-client.js  Rubrique « Photos et documents du chantier »
│   ├── metier/         Règles métier en fonctions pures
│   │   ├── suivi_metier.js   Copie identique de la référence V1 (relevés, stocks, droits)
│   │   ├── organisation.js   Binômes fixes, solos, conflits signalés
│   │   ├── notifications.js  Boîte de réception : tri, lectures par personne
│   │   ├── deplacement.js    Déplacement d'intervention : durée, équipe, conflits
│   │   ├── geolocalisation.js  Mesures GPS, état de communication, trajets
│   │   └── pieces_jointes.js  Pièces jointes : formats, limites, droit de consultation
│   ├── demo/           MODE DÉMONSTRATION, séparé du reste
│   │   ├── donnees-demo.js   Données fictives
│   │   ├── depot-demo.js     Enregistrement local simulé
│   │   ├── api.js            Point d'accès unique « Edysol.api »
│   │   ├── positions-simulees.js  SIMULATION des positions GPS (véhicules fictifs)
│   │   └── pieces-jointes-locales.js  Copie LOCALE des fichiers joints (IndexedDB)
│   └── espace/         Routeur, composants et vues des espaces internes
│       ├── glisser-deposer.js      Moteur de glisser-déposer (souris, doigt, stylet)
│       ├── pieces-jointes.js       Consultation interne des photos et documents
│       └── vues/                   Vues ; notamment planning.js, carte-vehicules.js, notifications.js
├── assets/             Logo vectoriel, images WebP, illustrations, polices locales
│   └── vendor/leaflet-1.9.4/   Bibliothèque de carte Leaflet (licence BSD-2)
├── outils/             Serveur local, tests Node et vérification Playwright
│   └── fichiers_test/  Photos et PDF fictifs pour tester les pièces jointes
└── apercus/            Captures d'écran (ordinateur et téléphone)
```

Les écrans n'appellent que `Edysol.api`. Pour brancher un futur serveur, il suffit de remplacer ce point d'accès. En mode `serveur`, chaque appel échoue volontairement avec un message clair : aucun succès n'est simulé.

## Simulé ou réel

| Élément | État dans la maquette |
| --- | --- |
| Liens téléphone `tel:` | Réels : ils ouvrent l'application téléphone de l'appareil |
| Impression du récapitulatif | Réelle mais locale (fenêtre d'impression du navigateur) |
| Demande de prestation, demande de rappel | Simulées : enregistrées dans le navigateur uniquement |
| Notifications secrétaire, cogérants, employés | Simulées : affichées dans les espaces, aucun e-mail, SMS, WhatsApp ou push |
| Lectures des notifications | Simulées par personne, enregistrées dans ce navigateur uniquement |
| Choix de l'espace et de la personne | Sélecteur de démonstration, pas une connexion |
| Planification, compte rendu, renfort | Simulés avec les règles métier de référence |
| Déplacement d'intervention (glisser-déposer, fenêtre) | Simulé, enregistré dans ce navigateur ; retour arrière si l'enregistrement échoue |
| Positions des véhicules | **Simulées** : véhicules et trajets fictifs, aucune position réelle collectée |
| Fond de carte | Réel si Internet est disponible (tuiles OpenStreetMap) ; sinon fond schématique local |
| Permissions d'écriture comptables | Fermées par défaut ; cases pour les simuler |
| Droits de la secrétaire sur le planning | Accordés (décision du 5 novembre 2026), contrôlés dans le navigateur seulement |
| Photos et documents joints par le client | **Simulés** : copiés dans ce navigateur (IndexedDB), ni transmis ni synchronisés |
| Génération de PDF | Aperçu HTML imprimable ; pas de fichier PDF généré |
| Paiement | Absent : modalités à définir avec l'employeur |

## Photos et documents du chantier (pièces jointes)

Le client peut joindre des fichiers à sa demande, pour que les intervenants découvrent le chantier et préparent leur matériel.

### Formulaire client

- Rubrique facultative « Photos et documents du chantier », à l'étape « Détails et date ». Une demande sans fichier reste possible.
- Bouton « Ajouter des fichiers » (choix multiple). Sur ordinateur, on peut aussi glisser les fichiers sur la rubrique.
- Bouton « Prendre une photo » sur écran tactile. Il ouvre l'appareil photo arrière quand le navigateur le permet (`capture="environment"`). Sinon, le choix de fichier habituel s'ouvre.
- Aperçu de chaque photo, liste des PDF, bouton « Retirer » pour chaque fichier avant l'envoi.
- Une courte consigne invite à montrer surfaces, accès et contraintes, et à éviter les visages et les documents personnels inutiles.
- Messages clairs pour un format refusé, un fichier trop lourd, un fichier déguisé, un doublon, ou un nombre ou un total dépassé. Une photo HEIC d'iPhone reçoit un conseil de réglage.
- Le résumé latéral et le récapitulatif indiquent le nombre de fichiers.

### Formats et limites (paramètres à confirmer)

| Paramètre | Valeur proposée |
| --- | --- |
| Formats | Photos JPEG, PNG, WebP ; documents PDF |
| Taille d'un fichier | 10 Mo |
| Nombre de fichiers | 8 par demande |
| Total | 30 Mo par demande |

Ces valeurs sont réunies dans `PARAMETRES` de `js/metier/pieces_jointes.js`. Elles s'affichent avec la mention « Limites à confirmer ».

Le type est contrôlé sur le **contenu réel** du fichier (ses premiers octets), pas sur son nom. Un exécutable renommé en `.jpg` est donc refusé. L'attribut `accept` du champ n'est qu'une aide de sélection.

### Envoi

1. Les fichiers sont d'abord « transférés ». Dans la maquette, cela veut dire copiés dans le navigateur, en une seule opération : tous ou aucun.
2. Si le transfert échoue, la demande n'est pas créée. Un message explique quoi faire. Aucune confirmation n'apparaît.
3. La commande est ensuite créée. Elle garde seulement les références des fichiers (identifiant, nom affiché, type, taille), jamais leur contenu.
4. Les fichiers sont enfin associés à la commande. La confirmation indique leur nombre seulement après cette réussite.

### Consultation interne

| Où | Qui |
| --- | --- |
| Détail de commande | Direction (cogérants) et secrétaire |
| Détail d'une mission | Employé dont l'équipe est affectée à cette commande |
| Prestation ou coordination | Contrôleuse, selon ses droits de mission déjà en place : prestation de ménage affectée, ou coordination de ce chantier |

- Miniatures des photos, agrandissement dans une fenêtre (flèches, Échap, retour du focus), ouverture des PDF dans un nouvel onglet.
- Affichage adapté au téléphone : les fichiers sont consultables depuis la mission, avant l'intervention.
- Le droit est contrôlé **à chaque ouverture de fichier** (`Edysol.api.ouvrirPieceJointe`). Un fichier d'une autre commande est refusé, même pour le secrétariat. Une personne sans droit ne voit pas même les noms des fichiers.
- Les pièces jointes ne sont jamais publiques. Elles n'alimentent pas la galerie du site : aucune page publique ne les lit.

### Portée de la simulation

- Les fichiers sont copiés dans la base IndexedDB de **ce navigateur**. Ils ne sont transmis ni à ÉDYSOL ni aux employés. Ils ne sont pas synchronisés entre appareils : un téléphone d'employé ne les verrait pas.
- Conservation locale : jusqu'à « Réinitialiser la démo », ou jusqu'à l'effacement des données du site par le navigateur. Ce n'est pas une durée de conservation décidée.
- Si IndexedDB est indisponible (navigation privée, réglage), le formulaire le signale : les fichiers ne survivront pas au changement de page.
- Les fichiers provisoires de plus d'une heure (envoi abandonné) et ceux d'une commande disparue sont supprimés à l'ouverture des espaces internes.
- Le contrôle des droits est fait dans le navigateur. Il illustre la règle, il ne protège rien. Aucun backend n'existe dans l'archive : le refus d'accès n'a donc pas pu être vérifié côté serveur.

### Ce que le serveur devra faire en production

- Stocker les fichiers dans un espace **privé**, hors du dossier public du site. Pas d'adresse publique permanente : chaque consultation passe par le serveur, qui contrôle le droit (règle de `accesPiecesJointes`), puis sert le fichier ou un lien signé de courte durée.
- Refaire tous les contrôles : taille, nombre, total et type réel (signature, avec `detecterType`). Rejeter tout le reste.
- Générer le nom de stockage (`nomStockage` : identifiant aléatoire et extension du type réel). Ne jamais réutiliser le nom du client.
- Empêcher l'exécution : servir les fichiers avec le bon `Content-Type`, `X-Content-Type-Options: nosniff`, `Content-Disposition` adapté, et aucun droit d'exécution sur le stockage.
- Gérer les transferts interrompus (reprise ou abandon propre) et supprimer régulièrement les fichiers orphelins.
- Ne confirmer le transfert au client qu'après l'enregistrement réel de tous les fichiers.
- Réfléchir à l'effacement des métadonnées de localisation (EXIF) des photos.

### Décisions restant à confirmer

- Durée de conservation des photos et documents.
- Personnes autorisées à supprimer une pièce jointe.
- Limites de taille et de nombre.
- Accès après la fin de l'intervention.

## Carte des véhicules

Emplacement : entrée « Suivi des véhicules » du menu, dans l'espace Cogérance (`#/cogerance/carte`) comme dans l'espace Secrétariat (`#/secretariat/carte`). Un raccourci figure aussi sur le tableau de bord de chaque espace, et un bouton dans Comptabilité, onglet Véhicules.

### Ce que fait la maquette

- Quatre véhicules fictifs, avec des marqueurs qui portent leur code (V1 à V4) et leur état écrit (« route », « arrêt », « ancien », « perdu »). La couleur n'est qu'un appui.
- Clic sur un marqueur ou sur la liste : fiche avec identification, statut, dernière position, heure de mesure GPS et heure de réception.
- Suivi du véhicule choisi. La carte ne recentre que si le véhicule sort de la zone centrale. Si l'utilisateur déplace ou zoome la carte, le suivi se met en pause et le bouton « Reprendre le suivi » apparaît.
- Trajet sur une période (30 min, 1 h, 3 h ou personnalisée) : trait plein pour les données continues, pointillés pour une interruption, flèches de sens, début et dernière mesure étiquetés, tableau des horaires de mesure et de réception.
- Filtres par état et recherche par nom.
- Une position ancienne (2 à 15 min) ou une communication perdue (plus de 15 min) est écrite comme telle : « Ce n'est pas la position actuelle ». La vitesse n'est pas affichée pour une position non actuelle.
- Animation fluide seulement entre deux mesures réelles proches. Après un trou de données, le marqueur saute à la nouvelle position, sans trajet inventé. Les mouvements sont coupés si l'utilisateur réduit les animations.
- Outil de démo : « Couper la communication » sur un véhicule, pour voir son état vieillir.

Seuils de 2 et 15 minutes : valeurs de démonstration, à valider.

### Scénarios simulés (`js/demo/positions-simulees.js`)

| Véhicule | Scénario |
| --- | --- |
| V-DÉMO-01 | Tournée en ville, une mesure toutes les 10 s |
| V-DÉMO-02 | Stationné à Normandie, une mesure par minute |
| V-DÉMO-03 | Communication perdue 22 min avant l'ouverture de la page |
| V-DÉMO-04 | Le boîtier mesure toutes les 20 s mais n'envoie que par rafales : réception parfois plusieurs minutes après la mesure |

Les trajets relient des repères approximatifs en ligne droite. Ils ne suivent pas forcément les routes. La simulation n'utilise ni le GPS de l'appareil ni aucun service externe.

### Accès

Accès confirmé le 5 novembre 2026 pour la direction (cogérants) et la secrétaire. Le suivi reste refusé aux employés et aux contrôleuses. Consulter la carte ne donne aucun pouvoir de décision. En production, ce contrôle devra être fait par le serveur.

### Dépendances, connexion et licences

- **Leaflet 1.9.4**, licence BSD-2 (`assets/vendor/leaflet-1.9.4/LICENCE-Leaflet-BSD-2.txt`). Copié localement : aucune clé, aucun compte.
- **Fond de carte** : tuiles OpenStreetMap chargées depuis `tile.openstreetmap.org` si Internet est disponible. Il faut ouvrir la maquette par le serveur local (`npm start`, puis `http://localhost:8000/espace.html`). Ouverte comme fichier (`file://`), la page n'envoie pas l'en-tête Referer exigé par OpenStreetMap. Les tuiles seraient alors refusées (« Access blocked »). La maquette ne les demande donc pas et affiche directement le fond schématique, avec un message. L'attribution « contributeurs OpenStreetMap » est obligatoire et affichée. La politique d'usage d'OpenStreetMap n'autorise pas un usage intensif. Pour la production, il faudra choisir un fournisseur de tuiles. Il peut demander une clé ou une licence ; elle devra être gardée côté serveur ou dans une configuration non versionnée, jamais dans le code.
- **Sans connexion** : un fond schématique local (quadrillage et repères approximatifs) prend le relais après 3,5 s, avec un message visible.

### Pour brancher de vrais véhicules

Le point d'intégration est `js/commun/positions.js`. Une source réelle doit appeler `Edysol.positions.recevoir(mesure)` avec ce format :

```json
{ "vehiculeId": "V-12", "lat": -22.27, "lng": 166.45,
  "mesureLe": "2026-11-05T10:00:00+11:00", "recuLe": "2026-11-05T10:00:03+11:00",
  "vitesseKmh": 28, "cap": 135, "precisionM": 8 }
```

Chaque mesure est vérifiée par `EdysolGeo.normaliserMesure`. Aucune API de fournisseur n'est supposée. Restera nécessaire :

- choisir les boîtiers GPS et leur fournisseur, avec les autorisations et les règles d'utilisation (information des salariés, horaires de suivi, durée de conservation) ;
- un serveur qui reçoit les positions du fournisseur, les enregistre et les transmet à la page (WebSocket ou SSE authentifiés) ;
- un contrôle d'accès côté serveur pour la carte et pour l'historique des trajets ;
- les seuils réels de position ancienne et de perte de communication ;
- un fond de carte de production et sa licence.

En configurant `EDYSOL_CONFIG = { sourcePositions: 'reelle' }` avant les scripts, la carte utilise la source réelle. Elle n'est pas configurée : la page affiche alors une erreur claire au lieu de faire semblant.

## Planning dynamique (glisser-déposer)

Emplacement : entrée « Planning et affectations » du menu, et raccourci du tableau de bord, dans l'espace Cogérance comme dans l'espace Secrétariat. Les deux espaces lisent et modifient les **mêmes données** : une intervention n'existe qu'une fois. Un déplacement fait dans un espace est visible dans l'autre.

Chaque modification ajoute une ligne à l'historique de la commande. Elle indique l'auteur et son rôle, la date, l'ancienne position et la nouvelle (date, horaire, équipe). Exemple : « Intervention INT-9 modifiée par Secrétaire (secrétaire). Avant : 2026-11-10 10:00-12:00, Binôme fixe 2. Après : 2026-11-10 09:00-11:00, Binôme fixe 2. » Les mêmes valeurs sont gardées sous forme structurée (`changement : { auteur, role, avant, apres }`).

- **Vue « Jour par ressource »** : une ligne par équipe, de 07:00 à 19:00. Glisser une intervention change son heure et, si on la lâche sur une autre ligne, son équipe.
- **Vue « Semaine »** : glisser une intervention vers un autre jour ou une autre équipe. L'heure est conservée.
- La **durée est toujours conservée**. La grille s'aligne sur un pas réglable (15, 30 ou 60 min), mémorisé dans ce navigateur.
- Pendant le geste, un **aperçu** montre le créneau cible, les nouvelles heures de début et de fin, l'équipe et « Créneau possible » ou « Impossible : raison ».
- Après un déplacement réussi : message avec l'ancien et le nouveau créneau, et bouton **« Annuler le déplacement »**.
- **Souris** : le geste commence après 4 px de mouvement. **Téléphone** : appui long (350 ms), puis glisser. Un geste rapide reste un défilement normal.
- **Alternative sans glisser-déposer** : clic ou Entrée sur une intervention ouvre une fenêtre pour changer la date, l'heure de début ou l'équipe. La fin est recalculée et affichée.
- Une intervention en cours ou terminée n'est pas déplaçable. Elle s'ouvre en consultation.

### Contrôles

| Contrôle | Effet |
| --- | --- |
| Chevauchement d'une personne de l'équipe cible | Bloquant. L'intervention reste à sa place. Aucun moyen de forcer |
| Binôme fixe vers employé seul | Bloquant : pas de passage en solo |
| Changement de type d'équipe | Bloquant : règle non validée |
| Hors de la plage 07:00 à 19:00 | Bloquant (paramètre d'affichage de la maquette, à confirmer) |
| Créneau confirmé au client | Avertissement. Le créneau passe « à reconfirmer ». Autorisation et information du client à définir. Aucun message envoyé |
| Indisponibilités, véhicules, temps de trajet, horaires de coordination | **Non vérifiables** : aucune donnée dans la maquette. Signalé après chaque déplacement |

Les personnes concernées reçoivent une notification interne simulée.

### Droits sur le planning (décision du 5 novembre 2026)

| Rôle | Consulter | Avancer, retarder, changer date et horaire | Changer l'équipe | Valider commercialement une commande |
| --- | --- | --- | --- | --- |
| Direction (cogérants) | Oui | Oui | Oui (même type d'équipe) | Oui |
| Secrétaire | Oui | Oui | Oui (même type d'équipe) | **Non** |
| Employés, contrôleuses | Non | Non | Non | Non |

- La secrétaire modifie le planning depuis son espace : glisser-déposer, fenêtre de détail d'une intervention, formulaire « Planifier une commande ».
- Ces modifications ordinaires ne demandent pas de validation de la direction.
- Les contrôles s'appliquent à tout le monde, direction comprise : chevauchements bloquants, binômes fixes toujours entiers, pas de passage en solo, pas de remplacement automatique.
- Ce droit porte sur le planning seulement. Il ne donne pas la validation commerciale d'une commande (prix, conditions), ni les autres décisions réservées à la direction. La maquette n'a d'ailleurs aucune action de validation commerciale.
- Les anciennes permissions simulées `planning:deplacer` et `planning:reaffecter` ont été retirées.
- La règle est codée dans `EdysolDeplacement.droitsPlanning`. Elle est vérifiée dans l'interface et dans le dépôt de démonstration (`deplacerIntervention`, `annulerDeplacement`, `planifier`).
- **Aucun backend n'existe dans l'archive.** En production, le serveur devra appliquer la même règle à chaque modification, à partir du rôle de la session et non d'une valeur envoyée par le navigateur. Il devra aussi refaire les contrôles de conflits et écrire l'historique lui-même.

### Enregistrement et retour arrière

Le déplacement est enregistré dans le `localStorage` de ce navigateur. Si l'écriture échoue, la position, l'historique et les notifications d'avant sont rétablis, et un message l'explique. Une case « Faire échouer l'enregistrement du prochain déplacement » permet de le vérifier. Ce n'est pas une synchronisation entre appareils.

### Point à décider

Le formulaire « Planifier une commande », antérieur à cette version, permet encore d'enregistrer une affectation malgré un conflit, après un second clic. Cela vaut pour la secrétaire comme pour la direction. Le glisser-déposer et la fenêtre de détail, eux, ne le permettent pas. Il faudra choisir une seule règle. La maquette n'a rien changé sur ce point sans décision.

## Règles métier respectées

- Deux contrôleuses, également employées de ménage, encadrent les équipes sous les ordres de la secrétaire et des cogérants.
- Quatre binômes fixes, toujours affectés en entier. Les autres employés travaillent seuls.
- Aucun remplacement automatique ni passage automatique en solo. Un conflit est signalé, puis arbitré par une personne.
- Le kilométrage saisi est le total affiché au compteur. Les compteurs ne sont jamais additionnés.
- Un signalement de renfort informe la secrétaire et les cogérants. Il n'affecte personne.
- Un écart d'inventaire ne modifie jamais le stock automatiquement.

## Boîte de réception des notifications

### Fonctionnement simulé dans la maquette

- Chaque notification est adressée à des **personnes** : la secrétaire, le cogérant 1, le cogérant 2, un employé ou une contrôleuse. Une commande informe toujours la secrétaire et chacun des deux cogérants.
- Le statut « Lue » ou « Non lue » est propre à chaque personne. La lecture du cogérant 1 ne change rien pour le cogérant 2 ni pour la secrétaire.
- Les non lues s'affichent d'abord, de la plus ancienne à la plus récente. Les lues suivent, dans l'historique.
- Une notification reçue pendant l'affichage s'insère après les non lues plus anciennes. Le défilement est compensé : le contenu regardé ne bouge pas. L'arrivée est annoncée aux lecteurs d'écran.
- L'ordre est calculé par `js/metier/notifications.js`. Il ne dépend pas de la position dans le tableau des données.
- Afficher la liste, la faire défiler ou afficher un compteur ne marque rien comme lu.
- Une notification devient lue seulement quand son message ou son détail associé s'est affiché correctement. Le routeur (`js/espace/app.js`) enregistre la lecture après l'affichage. Un écran introuvable, une erreur, un accès refusé ou un détail qui ne correspond pas à la notification n'enregistrent rien.
- Les commandes « Marquer comme lue » et « Tout marquer comme lu » ont été retirées.
- Un message sans détail associé s'ouvre dans la vue « Message » (`#/<espace>/notification/<id>`).
- L'état de lecture est écrit en toutes lettres. Il est séparé de l'état de la commande. Lire ne traite, n'accepte, ne refuse, ne planifie et ne valide rien.
- Un bouton « Recevoir une notification fictive (outil de démo) » permet de tester l'arrivée d'un message.

### Limites de la simulation

- Les notifications et les lectures sont dans le `localStorage` de **ce navigateur**. Elles survivent à un rechargement de la page.
- Elles ne suivent pas la personne sur un autre appareil ni dans un autre navigateur. Effacer les données du site les supprime.
- Deux onglets du même navigateur se tiennent à jour grâce à l'événement `storage`. Ce n'est pas une synchronisation entre appareils. Deux onglets qui écrivent en même temps peuvent s'écraser.
- Le choix de la personne n'est pas une authentification. N'importe qui peut choisir n'importe quelle personne.
- Le cloisonnement (message d'autrui refusé, intervention non affectée refusée) est fait dans le navigateur. Ce n'est pas une protection.
- Lors de cette mise à jour, les données de démo enregistrées par l'ancienne version sont recréées automatiquement.

### Ce que le produit réel devra fournir côté serveur

Aucun serveur ni aucune authentification n'existent dans cette version. Ils n'ont pas été ajoutés. Pour retrouver messages et lectures après déconnexion ou changement d'appareil, il faudra :

| Besoin | Proposition à valider |
| --- | --- |
| Notification | Table `notification` : identifiant, type, titre, texte, ressource liée, date de création |
| Destinataires individuels | Table `notification_destinataire` : notification, personne, date de réception, date de lecture (vide si non lue). Une ligne par personne |
| Liste personnelle | `GET /api/moi/notifications` : seulement les lignes de la personne de la session, triées selon les règles ci-dessus |
| Compteur | `GET /api/moi/notifications/non-lues` : calculé par le serveur |
| Lecture | `POST /api/moi/notifications/{id}/lecture` : appelé après chargement réussi du contenu. Le serveur vérifie la session, que la personne est destinataire et qu'elle a le droit de voir la ressource liée. Première date de lecture conservée |
| Contrôles d'accès | La personne vient de la session, jamais d'un identifiant envoyé par le navigateur. Les routes ET les objets retournés sont protégés |
| Création | Dans la même transaction que la commande, l'affectation ou le compte rendu. Un mécanisme de type « outbox » est conseillé pour les canaux externes |
| Canaux externes | WhatsApp, e-mail et notifications push restent à articuler avec la boîte interne. Ils ne sont ni supprimés ni simulés comme réels |
| Tests | Accès refusé sans session, accès refusé à la notification d'autrui, lecture indépendante par personne, absence de doublon en cas de nouvel essai |

### Décisions encore nécessaires

Aucune règle n'a été inventée pour les points suivants :

- durée de conservation des notifications ;
- archivage manuel ou automatique ;
- suppression ou purge ;
- consultation des lectures d'autres personnes ;
- rappels, escalades ou remise en non lu ;
- ordre définitif des notifications lues. Choix provisoire : réception la plus récente d'abord, comme dans la version précédente.

## Rôles et décisions

- L'espace Cogérance est commun aux deux cogérants. Il sert à suivre l'activité et à se concerter. Chaque cogérant garde sa propre boîte de réception.
- Être informé, consulter ou saisir ne donne pas le pouvoir de décider. Les décisions de l'entreprise restent à la direction. La maquette ne désigne aucun décideur.
- L'intitulé affiché est toujours « contrôleuse ». Les identifiants techniques historiques (`su-accueil`, `su-chantier`) sont conservés pour les anciens liens. Le mot « superviseuse » ne subsiste que dans un contrôle de compatibilité de la référence V1.

## Photos et contenus à compléter

- **Photos de chantiers.** Aucune photo autorisée n'était fournie. Les visuels sont des illustrations vectorielles créées pour la maquette. Chacune porte la pastille « Illustration provisoire ». L'image `edysol-interieur` vient du site existant. Elle porte la mention « Visuel d'ambiance · à remplacer ».
- **Ajouter une vraie photo.** Renseigner `js/commun/visuels.js` avec le type `photo-chantier`. Passer `publicationAutorisee` et `confidentialiteVerifiee` à `true` après accord écrit.
- **Catalogue des prestations.** Les quatre intitulés sont déduits des pictogrammes du logo. Ils restent à valider.
- **Présentation de l'entreprise.** Histoire et valeurs à rédiger avec les cogérants.
- **Coordonnées.** Téléphone et adresse viennent du site existant. E-mail et horaires sont à compléter.
- **Textes légaux.** Consentement, mentions légales et politique de confidentialité à rédiger.
- **Zone d'intervention.** La liste des communes est complète ; la zone réellement couverte est à confirmer.

Aucun témoignage, certification, tarif ou chiffre commercial n'a été inventé.

## Anciennes adresses de la maquette V1

Les identifiants V1 restent valables dans `espace.html`. Exemples : `#g-planning`, `#s-formulaire`, `#e-compterendu`, `#su-chantier`. Ils sont redirigés vers les nouvelles vues. Les identifiants `p-…` renvoient vers le site public.

## Limites connues

- Pas de backend, pas de base de données, pas d'authentification.
- Les contrôles du navigateur ne remplacent pas des contrôles serveur.
- Les données de démo sont propres à chaque navigateur et à chaque appareil.
- Le rendu a été vérifié avec Chromium. Safari et Firefox n'ont pas été testés.
- Le glisser-déposer tactile a été vérifié avec des événements tactiles simulés dans Chromium, pas sur un vrai téléphone.
- Le fond OpenStreetMap n'a pas pu être vérifié : l'environnement de test n'a pas accès à Internet. Seul le fond schématique a été vu.
- Les polices Outfit et Inter sont incluses (licence OFL, voir `assets/fonts`).
