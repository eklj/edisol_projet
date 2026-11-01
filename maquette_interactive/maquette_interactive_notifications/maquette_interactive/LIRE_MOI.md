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

`npm test` fonctionne avec l'archive de la maquette seule. Il lance trois séries :

| Fichier | Contenu |
| --- | --- |
| `outils/verifier_metier_reference.js` | Les 39 contrôles de la référence V1 (relevés, stocks, droits), copiés sans modification |
| `outils/tester_organisation.js` | Binômes fixes, solos, conflits signalés |
| `outils/tester_notifications.js` | Ordre de la boîte, lectures par personne, conditions de lecture |

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
│   ├── public/         Gabarit (en-tête, pied), accueil, parcours de commande
│   ├── metier/         Règles métier en fonctions pures
│   │   ├── suivi_metier.js   Copie identique de la référence V1 (relevés, stocks, droits)
│   │   ├── organisation.js   Binômes fixes, solos, conflits signalés
│   │   └── notifications.js  Boîte de réception : tri, lectures par personne
│   ├── demo/           MODE DÉMONSTRATION, séparé du reste
│   │   ├── donnees-demo.js   Données fictives
│   │   ├── depot-demo.js     Enregistrement local simulé
│   │   └── api.js            Point d'accès unique « Edysol.api »
│   └── espace/         Routeur, composants et vues des espaces internes
│       └── vues/notifications.js   Boîte de réception et ouverture d'un message
├── assets/             Logo vectoriel, images WebP, illustrations, polices locales
├── outils/             Serveur local, tests Node et vérification Playwright
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
| Permissions d'écriture comptables | Fermées par défaut ; cases pour les simuler |
| Génération de PDF | Aperçu HTML imprimable ; pas de fichier PDF généré |
| Paiement | Absent : modalités à définir avec l'employeur |

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
- Les polices Outfit et Inter sont incluses (licence OFL, voir `assets/fonts`).
