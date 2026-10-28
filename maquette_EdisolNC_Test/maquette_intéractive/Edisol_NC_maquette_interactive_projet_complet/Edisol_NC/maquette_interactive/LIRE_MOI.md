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

Tests des règles métier, sans dépendance :

```bash
cd maquette_interactive
npm test
```

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
│   │   └── organisation.js   Binômes fixes, solos, conflits signalés
│   ├── demo/           MODE DÉMONSTRATION, séparé du reste
│   │   ├── donnees-demo.js   Données fictives
│   │   ├── depot-demo.js     Enregistrement local simulé
│   │   └── api.js            Point d'accès unique « Edysol.api »
│   └── espace/         Routeur, composants et vues des espaces internes
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
| Notifications secrétaire, cogérants, employés | Simulées : affichées dans les espaces, aucun e-mail, SMS ou WhatsApp |
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
