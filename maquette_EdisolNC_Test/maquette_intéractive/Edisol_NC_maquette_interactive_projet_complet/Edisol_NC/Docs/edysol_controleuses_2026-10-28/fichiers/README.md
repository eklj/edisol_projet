# ÉDYSOL NC

Site vitrine et projet de gestion des commandes et des interventions d’une entreprise de nettoyage en Nouvelle-Calédonie.

> **État du dépôt : prototype et démonstration locale.** Le site vitrine est statique ; les interfaces de gestion sont des maquettes. Le script Python extrait les informations de PDF de démonstration. Aucun parcours complet de commande, serveur métier, stockage en base ou envoi de notification n’est implémenté dans la version analysée.

État documentaire actualisé le **28 octobre 2026** à partir du [dépôt en ligne](https://github.com/eklj/edisol_projet), branche par défaut **`main`**, commit de référence **`88365040cb0f7df057e1f9edde10d30d7272f6cb`** (27 octobre 2026, 13 h 33, heure de Nouvelle-Calédonie). Ce commit est la base examinée, avant les présentes corrections documentaires. Les permissions GitHub, la protection des branches, le déploiement et le fichier Figma en ligne n’ont pas été vérifiés. Pour un nouveau bilan, comparer d’abord la référence distante à cette base.

## Table des matières

- [1. Présentation et avancement](#1-présentation-et-avancement)
- [2. Organisation et règles métier](#2-organisation-et-règles-métier)
- [3. Parcours et fonctionnalités cibles](#3-parcours-et-fonctionnalités-cibles)
- [4. Architecture et installation](#4-architecture-et-installation)
- [5. Guide Git pour les collaborateurs](#5-guide-git-pour-les-collaborateurs)
- [6. Règles de contribution](#6-règles-de-contribution)
- [7. Limites et feuille de route](#7-limites-et-feuille-de-route)
- [8. Auteurs et licence](#8-auteurs-et-licence)

## 1. Présentation et avancement

Le projet vise à présenter l’entreprise, centraliser les demandes des clients et faciliter le suivi des prestations. La cible comprend un site public, des espaces internes pour les cogérants, la secrétaire et les contrôleuses, ainsi qu’un environnement commun aux employés, adapté à leurs interventions.

Les besoins recensés comprennent aussi un emploi du temps annuel, une planification mensuelle, un suivi journalier et des contrats pour particuliers et professionnels. Ils ne constituent pas encore des fonctionnalités opérationnelles.

| Fonctionnalité | État observé | Preuve et limite actuelle |
| --- | --- | --- |
| Site vitrine | Développé, statique ; code inspecté | `site _web/dist/index.html` : HTML/CSS et liens téléphoniques, sans commande connectée ; rendu navigateur non revérifié le 28/10 |
| Navigation de maquette | Développée pour la démonstration | 41 SVG, 41 entrées d’inventaire et 41 vues HTML ; syntaxe des scripts vérifiée, parcours navigateur complet non revérifié |
| Commande client ou secrétaire | Représentée en maquette ; saisie réelle prévue | Champs SVG dessinés, sans validation serveur ni enregistrement |
| Espaces cogérance, secrétariat, contrôleuses et employés | Maquettés | Navigation de démonstration, sans authentification ni autorisation serveur |
| Planning et affectations | Maquettés | Organisation fixe/solo représentée ; aucun moteur ni sauvegarde de planning |
| Compte rendu et kilométrage | Maquette et simulation en mémoire développées | Véhicule, compteur total et date alimentent le suivi de démonstration ; aucune persistance après rechargement |
| Extraction PDF texte vers JSON/CSV | Développée et vérifiée sur les 3 exemples | Script local ; huit champs renseignés par exemple, sans OCR ni validation métier des valeurs |
| Enregistrement des commandes en base | Prévu | Aucun schéma SQL exécutable, migration ou connecteur identifié ; un contrat partiel est proposé pour véhicules/stocks |
| Génération PDF des commandes | Prévue ; aperçu maquetté | Les PDF fournis sont des entrées d’extraction, pas des sorties d’un générateur |
| Notifications | Prévues ; écrans fictifs | Aucun envoi réel ni service configuré identifié ; canal à décider ; aucun message réel sans autorisation |
| Deux contrôleuses et quatre binômes fixes | Représentés dans la maquette et la documentation | Règles d’absence, de renfort et d’approbation encore ouvertes |
| Comptabilité | Écrans développés pour secrétaire/cogérants | Périmètre comptable détaillé et permissions d’écriture à définir ; aucun module serveur |
| Stocks et inventaires | Écrans et fonctions métier de référence développés | Tests locaux sur mouvements/unités/écarts ; aucun stockage partagé ni API réelle |
| Véhicules et relevés | Simulation et fonctions métier de référence développées | Historique, corrections et projection chronologique testés localement ; politique serveur à construire |
| Paiement | À définir | Aucun prestataire intégré |

« Développé » concerne uniquement le périmètre indiqué. « Vérifié » désigne un contrôle réellement exécuté, avec les limites décrites dans [le relevé de vérifications](Docs/VERIFICATIONS_2026-10-28.md). Aucun parcours complet de gestion en production n’est livré.

## 2. Organisation et règles métier

Les règles ci-dessous sont les règles métier actuelles à prendre en compte pour les développements.

| Rôle | Responsabilités attendues | État dans le dépôt |
| --- | --- | --- |
| Deux cogérants | Pilotage de l’activité, suivi des commandes et interventions, réception des notifications, accès Comptabilité | Pilotage et Comptabilité maquettés ; traitements serveur à développer |
| Secrétaire | Saisie pour les clients, suivi administratif, planification, notifications et accès Comptabilité | Écrans de démonstration ; traitements à développer |
| Deux contrôleuses | Employées de ménage participant aux prestations ; encadrement des équipes sous les ordres de la secrétaire et des cogérants ; coordination des gros chantiers nécessitant du renfort | Deux vues dédiées présentes ; droits détaillés et traitements à définir |
| Employés | Réalisation des prestations, consultation des interventions affectées, comptes rendus et relevé du kilométrage des véhicules de service utilisés | Environnement mobile et simulation véhicule présents ; persistance à développer |

L’entreprise dispose de **quatre binômes fixes**. Les autres employés travaillent seuls sur leurs chantiers. Les règles de gestion de l’absence d’un membre d’un binôme, de sélection des renforts et de validation des réaffectations restent à préciser. Aucun remplacement ou passage en solo automatique n’est décidé.

**Organisation déjà reprise :** la maquette et [CORRECTION_ORGANISATION.md](maquette_EdisolNC/Edysol_NC_Maquette_V1/CORRECTION_ORGANISATION.md) représentent les quatre binômes fixes, les employés solos et les deux contrôleuses. Les compositions inconnues restent à renseigner. Aucun automatisme d’affectation n’est implémenté. Voir aussi le [tableau de décisions du premier parcours](Docs/DECISIONS_PREMIER_PARCOURS.md).

La matrice précise des droits de lecture, de modification et de validation reste à établir. Une navigation de maquette ne constitue pas un contrôle d’accès.

## 3. Parcours et fonctionnalités cibles

Cette section décrit le **fonctionnement prévu**, sauf mention explicite de la démonstration existante.

1. **Saisie de la commande.** Le client remplit le formulaire du site, ou la secrétaire le remplit en son nom. Les écrans correspondants existent en maquette uniquement. La maquette présente actuellement une date souhaitée, sans confirmation d’intervention. Le choix métier définitif entre préférence et réservation reste à valider dans le premier parcours.
2. **Enregistrement.** Le serveur devra contrôler les données et les enregistrer dans une base. Cette validation technique (formats, champs requis et cohérence) ne vaut pas validation métier : l’acceptation de la commande et du créneau dépendra des responsables et règles à décider. La cible ne prévoit pas un passage obligatoire par un fichier JSON avant la base. Les exports JSON actuels appartiennent à la démonstration PDF, pas à un stockage métier partagé.
3. **Documents et traçabilité.** Les données enregistrées devront permettre de générer un PDF récapitulatif pour la direction et d’informer la secrétaire ainsi que les deux cogérants, avec conservation de l’historique. Ces traitements ne sont pas implémentés.
4. **Planification et affectation.** Les commandes devront être planifiées et attribuées en respectant les quatre binômes fixes, les interventions individuelles et l’encadrement par les contrôleuses. Les validations et exceptions restent à définir ; aucune affectation automatique n’est opérationnelle.
5. **Information des employés.** Les consignes devront provenir directement des données enregistrées. Il n’est pas nécessaire de produire un PDF puis de le relire pour envoyer ces mêmes informations. Le choix du canal de notification reste à valider.
6. **Compte rendu.** L’employé devra renseigner le déroulement de l’intervention et le kilométrage au compteur du véhicule de service utilisé. Le prototype permet déjà une saisie du véhicule, du compteur et de la date dans une simulation en mémoire. La persistance et les contrôles serveur restent à développer.
7. **Centralisation du kilométrage.** Les relevés des comptes rendus devront alimenter le suivi des véhicules sans double saisie. Une référence locale illustre déjà véhicule, employé, compte rendu, date réelle, contrôles chronologiques et corrections historisées. Son intégration serveur, les permissions de correction et le traitement final des anomalies restent à définir. Un kilométrage au compteur est une valeur cumulée, distincte de la distance d’une intervention.
8. **Comptabilité, stocks et inventaires.** Un espace Comptabilité est prévu pour la secrétaire et les cogérants, avec gestion des stocks, inventaires et suivi des véhicules. Les mouvements de stock, validations et fonctionnalités comptables détaillées restent à définir. Des écrans et fonctions de référence existent ; aucun module serveur ni stockage durable n’est présent.
9. **Paiement.** Les modalités doivent être discutées avec l’employeur. Le paiement en ligne et le rendez-vous avec la secrétaire sont des options envisagées, sans décision technique ou commerciale définitive.

Le dossier nommé `API` contient actuellement un script en ligne de commande, **pas une API HTTP**. Le document sur n8n et EvolutionAPI est une piste documentaire : aucun workflow exécutable ou service WhatsApp configuré n’a été identifié dans le dépôt examiné.

## 4. Architecture et installation

### Technologies identifiées

| Élément | Technologie ou version constatée |
| --- | --- |
| Site vitrine | HTML5, CSS intégré ; aucun framework ou outil de compilation identifié |
| Maquette | HTML, CSS, JavaScript navigateur et SVG ; version V1 |
| Extraction PDF | Python **3.10 ou supérieur**, selon le README de la démonstration |
| Dépendance Python déclarée | `pdfplumber>=0.11,<0.12` dans `requirements.txt` |
| Typographie proposée | Inter avec repli Arial ; les fichiers de police ne sont pas fournis |
| Gestion de versions | Git, remote GitHub ; aucune version minimale de Git déclarée |
| Serveur métier, moteur de base et authentification | Non implémentés ; technologies et versions à choisir |

Les dépendances Python ne sont pas figées à une version exacte par un fichier de verrouillage. Aucun `package.json`, projet PHP, configuration Docker, migration SQL ou chaîne CI de tests n’a été identifié dans cette version.

### Arborescence du dépôt analysé

Les chemins contenant un espace doivent être entourés de guillemets dans le terminal.

```text
.
├── README.md
├── Edysol fonctionnement.txt          # Notes métier suivies par Git
├── Docs/
│   ├── mermaid-diagram.png            # Diagramme cible, pas une implémentation
│   ├── DECISIONS_PREMIER_PARCOURS.md   # Décisions confirmées et questions ouvertes
│   └── VERIFICATIONS_2026-10-28.md     # Contrôles exécutés et limites
├── N8N/
│   ├── Projet_Automatisation_Commandes_WhatsApp_n8n_EvolutionAPI.pdf
│   └── Comment_l_automatisation_route_vos_commandes.mp4
├── site _web/
│   ├── dist/
│   │   ├── index.html
│   │   └── edysol-interieur.png
│   └── js/hosting.json                # Indication d’hébergement statique
├── API/demo_pdf_edysol/
│   ├── README.md
│   ├── extraire_pdf.py
│   ├── requirements.txt
│   ├── commande_exemple.pdf
│   ├── commande_exemple_2.pdf
│   ├── commande_exemple_3.pdf
│   ├── resultats/
│   └── resultats_demo2/
└── maquette_EdisolNC/
    ├── code_formate.html              # Autre copie HTML à maintenir en cohérence
    ├── logoedysol/                    # Logo et visuel de l’entreprise
    └── Edysol_NC_Maquette_V1/
        ├── LIRE_MOI.md
        ├── CORRECTION_ORGANISATION.md
        ├── COMPTABILITE_STOCKS_VEHICULES.md
        ├── MODELE_DONNEES_API.md        # Contrat proposé, non implémenté
        ├── PALETTE_EDYSOL.md
        ├── Edysol_Maquette.html        # 41 vues et simulation intégrée
        ├── Planche_ensemble.svg
        ├── Edysol_Apercu_Couleurs.png
        ├── inventaire.json            # 41 entrées
        ├── ecrans/                    # 41 SVG
        └── reference/
            ├── suivi_metier.js
            ├── simulation_navigateur.js
            └── verifier_metier.js     # 39 contrôles locaux
```

### Palette et cohérence des livrables

La référence de la maquette est [PALETTE_EDYSOL.md](maquette_EdisolNC/Edysol_NC_Maquette_V1/PALETTE_EDYSOL.md) : bleu `#085895`, vert `#58AB29`, jaune `#F4D928`, fonds blancs/gris clairs et texte sombre. Elle remplace l’ancienne palette provisoire. Les couleurs proviennent des références logo/publications, pas de l’interface Facebook ; les échantillons ne constituent pas une charte officielle. La structure et la typographie de la maquette sont conservées. Le site vitrine utilise encore sa palette antérieure ; aucun changement HTML/CSS n’est inclus dans cette mise à jour documentaire.

### Prérequis

- Git pour récupérer le projet et contribuer.
- Un navigateur récent pour le site et la maquette.
- Python 3.10 ou supérieur, `venv` et `pip` pour la démonstration PDF et le serveur statique proposé ci-dessous.
- Une connexion Internet pour installer les dépendances Python.

Vérifier les outils disponibles :

```bash
# Afficher les versions installées
git --version
python3 --version
```

Si `venv` manque sous Ubuntu, installer le paquet adapté à la version de Python utilisée ; le README de la démonstration propose `sudo apt install python3-venv`.

### Consulter le site vitrine

Depuis la racine du dépôt, servir directement le dossier contenant `index.html` :

```bash
# Serveur de consultation locale, lié uniquement à cette machine
python3 -m http.server 8000 --bind 127.0.0.1 --directory "site _web/dist"
```

Ouvrir [http://127.0.0.1:8000](http://127.0.0.1:8000). Arrêter le serveur avec `Ctrl+C`. Cette commande utilise le serveur standard de Python pour consulter les fichiers ; ce n’est pas un serveur métier ni un mode de déploiement en production.

L’image utilise un chemin absolu `/edysol-interieur.png` : servir `site _web/dist` comme racine évite de casser ce lien. `site _web/js/hosting.json` ne fournit pas de commande de déploiement et son chemin `dist` doit être interprété selon l’outil d’hébergement choisi ; cet outil n’est pas identifié.

### Consulter la maquette

Ouvrir directement dans le navigateur le fichier [Edysol_Maquette.html](maquette_EdisolNC/Edysol_NC_Maquette_V1/Edysol_Maquette.html) présent dans la copie locale. Le menu change les écrans affichés. Les champs SVG et confirmations sont dessinés ; aucune commande n’est enregistrée. Sous le compte rendu, un formulaire HTML simule la saisie du véhicule, du compteur et de la date ; les relevés apparaissent ensuite dans les vues véhicules/historique de la simulation, jusqu’au rechargement.

Voir le [guide de la maquette](maquette_EdisolNC/Edysol_NC_Maquette_V1/LIRE_MOI.md) pour l’import des SVG dans Figma. Les SVG ne sont pas des composants Figma natifs avec Auto Layout. L’organisation corrigée y est décrite. La navigation entre rôles ne sécurise aucune donnée.

### Installer et lancer la démonstration PDF

Depuis la racine du dépôt, sous Bash/Linux :

```bash
# Isoler les dépendances de cette démonstration
cd API/demo_pdf_edysol
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

```bash
# Lire le PDF par défaut ; les exports sont écrits dans resultats/
python extraire_pdf.py

# Utiliser le troisième exemple dans un dossier de sortie distinct
python extraire_pdf.py commande_exemple_3.pdf --sortie resultats_demo3
```

Chaque exécution réussie produit `commande.json`, `commande.csv` et `texte_extrait.txt`. Les fichiers du même dossier de sortie sont remplacés : choisir un dossier différent pour conserver plusieurs extractions. Le CSV utilise le séparateur point-virgule.

```bash
# Quitter l’environnement virtuel, puis revenir à la racine du dépôt
deactivate
cd ../..
```

Le script attend un seul bon de commande par PDF et des lignes `Libellé : valeur`. Il refuse les libellés répétés, laisse les champs absents à `null` et ne réalise pas d’OCR. Dates, adresses et téléphones doivent encore être validés avant tout usage métier. Il ne génère pas de PDF et n’envoie aucun message.

### Configuration, environnement et base de données

Aucun fichier `.env`, modèle `.env.example`, chargement de variables d’environnement ou schéma de base n’a été identifié. La démonstration se configure par ses arguments de ligne de commande (`pdf`, `--sortie`) et sa constante `LIBELLES`.

**Aucune variable d’environnement n’est actuellement requise par le code fourni.** Ne pas créer un fichier `.env` en pensant activer une base ou les notifications.

Exemples de variables **futures, proposés uniquement pour la conception** : leurs noms et valeurs devront être adaptés au backend retenu ; aucun code actuel ne les lit.

| Nom proposé | Valeur fictive | Usage envisagé |
| --- | --- | --- |
| `APP_ENV` | `development` | Environnement d’exécution |
| `DB_HOST` | `127.0.0.1` | Adresse du futur serveur de base |
| `DB_NAME` | `edysol_demo` | Base de démonstration |
| `DB_USER` | `utilisateur_demo` | Compte fictif pour la base |
| `DB_PASSWORD` | `VALEUR_FICTIVE_A_REMPLACER` | Secret local à ne jamais versionner |

Il n’existe donc pas encore de commande d’initialisation de base, de migration ou de lancement de l’application complète à documenter. Ajouter ces instructions avec l’implémentation réelle.

### Vérifications disponibles

Une suite de **39 contrôles locaux** existe pour la référence métier JavaScript. Elle vérifie notamment les compteurs chronologiques, les corrections, les doublons, les mouvements de stock, les écarts d’inventaire et la politique d’autorisation de référence. Depuis la racine, avec Node.js installé :

```bash
# Exécuter les assertions locales ; aucune dépendance npm à installer
node maquette_EdisolNC/Edysol_NC_Maquette_V1/reference/verifier_metier.js
```

Ces contrôles ont réussi le **28 octobre 2026**, sous Node.js 24.22.1. Aucune version minimale de Node.js n’est déclarée par le projet. Le contrôle ajouté pour le changement d’intitulé est décrit dans [CHANGEMENT_INTITULE_ROLE.md](Docs/CHANGEMENT_INTITULE_ROLE.md). Ils ne testent pas des sessions ou routes HTTP et ne prouvent pas la sécurité d’une application serveur. Aucune configuration CI n’a été identifiée.

Les trois scripts intégrés à `Edysol_Maquette.html` ont passé `node --check`. Les 41 fichiers SVG et les 41 entrées d’inventaire ont été comptés et leurs correspondances contrôlées. Ces vérifications ne remplacent pas une revue visuelle ou un parcours navigateur.

Les trois PDF fournis ont été réexécutés dans des dossiers temporaires distincts : code de sortie nul, JSON valide avec huit champs non nuls, CSV et texte produits pour chaque exemple. Cela ne valide pas tous les formats PDF ni l’exactitude métier de chaque valeur. Voir [les conditions et limites de vérification](Docs/VERIFICATIONS_2026-10-28.md).

Exemple de contrôle manuel depuis `API/demo_pdf_edysol`, avec l’environnement virtuel actif :

```bash
# Séparer les sorties pour ne pas écraser les exemples suivis par Git
python extraire_pdf.py commande_exemple.pdf --sortie /tmp/edysol_verification_pdf_1
python -m json.tool /tmp/edysol_verification_pdf_1/commande.json
```

Restent à réaliser : parcours navigateur complet, contrôles de mise en page et d’accessibilité, tests HTTP et droits sur les objets, intégration base/PDF/notifications, doublons et erreurs du futur parcours. Aucun envoi réel n’est réalisé par les vérifications actuelles.

### Documentation existante

- [Correction officielle de l’intitulé contrôleuse](Docs/CHANGEMENT_INTITULE_ROLE.md).
- [Diagramme cible actualisé](Docs/DIAGRAMME_FLUX_EDYSOL.md) ; l’image PNG historique reste inchangée.

- [Démonstration PDF : installation et limites](API/demo_pdf_edysol/README.md).
- [Maquette V1 : utilisation et hypothèses historiques](maquette_EdisolNC/Edysol_NC_Maquette_V1/LIRE_MOI.md).
- [Décisions du premier parcours](Docs/DECISIONS_PREMIER_PARCOURS.md).
- [Organisation des équipes](maquette_EdisolNC/Edysol_NC_Maquette_V1/CORRECTION_ORGANISATION.md).
- [Comptabilité et véhicules](maquette_EdisolNC/Edysol_NC_Maquette_V1/COMPTABILITE_STOCKS_VEHICULES.md).
- [Modèle de données et API proposés](maquette_EdisolNC/Edysol_NC_Maquette_V1/MODELE_DONNEES_API.md).
- [Inventaire des écrans](maquette_EdisolNC/Edysol_NC_Maquette_V1/inventaire.json).
- [Planche d’ensemble](maquette_EdisolNC/Edysol_NC_Maquette_V1/Planche_ensemble.svg).
- [Proposition d’automatisation WhatsApp](N8N/Projet_Automatisation_Commandes_WhatsApp_n8n_EvolutionAPI.pdf) : document à évaluer, sans intégration opérationnelle identifiée dans le dépôt.

## 5. Guide Git pour les collaborateurs

### Comprendre les termes

| Terme | Explication simple |
| --- | --- |
| Dépôt distant | Copie du projet sur GitHub, utilisée pour échanger les modifications |
| Copie locale | Dépôt présent sur votre ordinateur, dans lequel vous travaillez |
| Fork | Copie du dépôt créée sur votre propre compte GitHub ; elle reste sur GitHub |
| Clone | Téléchargement d’un dépôt et de son historique sur votre ordinateur |
| Branche | Ligne de travail séparée permettant de préparer une modification |
| Commit | Enregistrement local d’un ensemble de modifications avec un message |
| Push | Envoi de commits locaux vers un dépôt distant |
| Fetch | Récupération des informations et commits distants sans modifier votre branche de travail |
| Pull | Récupération puis intégration des changements distants dans la branche courante |
| Pull request (PR) | Proposition de fusion d’une branche, à relire et discuter sur GitHub |
| `origin` | Nom donné par défaut au dépôt cloné : dépôt du projet dans le parcours A, votre fork dans le parcours B |
| `upstream` | Nom ajouté dans le parcours B pour désigner le dépôt original du projet |

**Un commit enregistre les modifications localement ; un push les envoie sur le dépôt distant.** Faire un commit ne publie donc pas automatiquement le travail sur GitHub.

Les parcours ci-dessous utilisent `main`, branche par défaut vérifiée sur le dépôt distant le 28 octobre 2026. Les noms `docs/readme` sont des exemples de branches de travail ; choisissez un nom décrivant votre tâche.

### Première configuration

Remplacer les valeurs fictives avant d’exécuter ces commandes :

```bash
# Définir l’identité des futurs commits sur cette machine
git config --global user.name "Votre nom"
git config --global user.email "votre-adresse@example.invalid"
```

Cette configuration **ne connecte pas à GitHub**. Pour limiter l’identité au dépôt courant, retirer `--global` et exécuter les commandes depuis le dépôt. Vous pouvez utiliser l’adresse de confidentialité fournie par GitHub dans les paramètres de votre compte.

Un push nécessite une authentification GitHub et l’autorisation d’écrire sur le dépôt de destination. Utiliser un gestionnaire d’identifiants pour HTTPS ou une clé SSH configurée pour votre compte. Ne placer aucun mot de passe ou jeton dans une commande, une URL de remote ou un fichier du dépôt.

### A. Collaborateur avec accès en écriture

Dans ce parcours, `origin` désigne **le dépôt du projet**. Le travail sur branche et les PR sont le fonctionnement recommandé ; la protection de `main` n’a pas été vérifiée.

**1. Cloner et entrer dans la copie locale**

```bash
# Récupérer le dépôt du projet dans un dossier local explicite
git clone https://github.com/eklj/edisol_projet.git edysol-nc
cd edysol-nc
```

**2. Vérifier le dépôt et la branche**

```bash
# Contrôler origin, la branche courante et les modifications locales
git remote -v
git branch --show-current
git status
```

**3. Actualiser la branche principale**

Faire cette étape avec un répertoire de travail propre. Voir les situations fréquentes si des modifications sont en cours.

```bash
# Mettre main à jour depuis le dépôt du projet, sans fusion implicite
git switch main
git pull --ff-only origin main
```

**4. Créer une branche de travail**

```bash
# Exemple : préparer une amélioration de documentation
git switch -c docs/readme
```

**5. Modifier, vérifier et sélectionner les fichiers**

Modifier les fichiers nécessaires dans votre éditeur, effectuer les vérifications adaptées, puis :

```bash
# Examiner les fichiers modifiés et le contenu des changements
git status
git diff

# Exemple : sélectionner uniquement le README modifié
git add README.md
git diff --cached
```

Pour un autre fichier, utiliser son chemin exact. Éviter `git add .` sans examen préalable, notamment en présence d’environnements virtuels ou d’exports.

**6. Enregistrer et envoyer la branche**

```bash
# Enregistrer localement puis envoyer la branche au dépôt du projet
git commit -m "Documenter l’installation et la contribution"
git push -u origin docs/readme
```

La forme générale est `git push -u origin NOM_BRANCHE` : remplacer `NOM_BRANCHE` par votre branche courante, sans saisir ce paramètre littéralement. `-u` associe la branche locale à sa branche distante pour les prochains échanges.

**7. Ouvrir une pull request**

Sur GitHub, ouvrir une PR dans `eklj/edisol_projet`, avec **base : `main`** et **compare : `docs/readme`** (ou votre branche). Décrire la modification et les vérifications réalisées. Attendre la relecture selon l’organisation de l’équipe.

### B. Contribuer depuis un fork

Dans ce parcours, `origin` désigne **votre fork** et `upstream` désigne **le dépôt original**. Les push vont vers `origin`, pas vers `upstream`.

**1. Créer le fork sur GitHub**

Ouvrir [le dépôt du projet](https://github.com/eklj/edisol_projet), cliquer sur **Fork** et créer la copie dans votre compte. Un fork n’est pas créé par `git clone`.

**2. Cloner votre fork**

Le bloc suivant est un **modèle à adapter avant exécution**. Remplacer `VOTRE_COMPTE` par votre identifiant GitHub et `NOM_DU_FORK` par le nom réel du dépôt forké, visible sur votre page GitHub.

```bash
# MODÈLE : remplacer les deux paramètres avant d’exécuter
git clone https://github.com/VOTRE_COMPTE/NOM_DU_FORK.git edysol-nc-fork
cd edysol-nc-fork
```

**3. Ajouter et vérifier le dépôt original**

```bash
# Ajouter upstream une seule fois dans cette copie locale
git remote add upstream https://github.com/eklj/edisol_projet.git
git remote -v
git branch --show-current
git status
```

Vérifier que `origin` pointe vers votre compte et `upstream` vers `eklj/edisol_projet`. Si `upstream` existe déjà, vérifier son URL avant toute modification au lieu de répéter `remote add`.

**4. Synchroniser main avec le dépôt original**

Commencer avec un répertoire de travail propre. Si votre `main` contient des commits personnels divergents, arrêter et demander une relecture de l’historique plutôt que de forcer la synchronisation.

```bash
# Récupérer les changements du projet original
git fetch upstream
git switch main
git merge --ff-only upstream/main

# Actualiser la branche main de votre fork
git push origin main
```

**5. Créer une branche et préparer les modifications**

```bash
# Partir de la branche principale synchronisée
git switch -c docs/readme

# Après modification dans votre éditeur : examiner puis sélectionner
git status
git diff
git add README.md
git diff --cached
```

**6. Enregistrer et pousser vers votre fork**

```bash
# Le commit est local ; origin est ici votre fork
git commit -m "Documenter l’installation et la contribution"
git push -u origin docs/readme
```

**7. Proposer la contribution au projet original**

Sur GitHub, ouvrir une PR avec **dépôt de base : `eklj/edisol_projet`, branche de base : `main`**, et **dépôt source : votre fork, branche source : `docs/readme`**. Utiliser l’option de comparaison entre forks si nécessaire. Pousser sur votre fork ne fusionne pas votre travail dans le projet original.

### Fiche de commandes courantes

Les mots en majuscules sont des paramètres à remplacer, pas des valeurs à recopier littéralement.

| Commande | Rôle |
| --- | --- |
| `git status` | Voir la branche, les fichiers modifiés et ceux sélectionnés pour le commit |
| `git branch` | Lister les branches locales ; l’astérisque indique la branche courante |
| `git switch NOM_BRANCHE` | Passer sur une branche existante |
| `git switch -c NOM_BRANCHE` | Créer une branche et s’y placer |
| `git remote -v` | Vérifier les dépôts distants et les destinations des échanges |
| `git diff` | Lire les modifications non encore sélectionnées |
| `git diff --cached` | Lire les modifications sélectionnées pour le prochain commit |
| `git add CHEMIN_FICHIER` | Sélectionner un fichier précis pour le prochain commit |
| `git commit -m "Description de la modification"` | Enregistrer localement les changements sélectionnés |
| `git fetch` | Actualiser les références distantes sans intégrer les changements ; préciser le remote en cas de doute |
| `git pull --ff-only` | Actualiser la branche depuis son suivi distant uniquement si une avance simple est possible |
| `git push` | Envoyer vers la destination configurée ; vérifier le suivi et les remotes avant de l’utiliser |
| `git log --oneline -5` | Afficher les cinq derniers commits de la branche |

Dans un fork, préciser `git fetch upstream` pour récupérer le projet original. `git pull --ff-only` sans argument utilise le suivi de la branche : il ne synchronise pas automatiquement votre fork avec `upstream`.

### Situations fréquentes

**Des modifications locales avant de changer de branche ou de synchroniser**

Commencer par `git status` et `git diff`. Si le travail est prêt, faire un commit sur sa branche dédiée. S’il est inachevé, on peut le mettre temporairement de côté :

```bash
# Mettre de côté le travail, y compris les nouveaux fichiers non ignorés
git stash push -u -m "Travail temporaire avant synchronisation"

# Après l’opération, revenir sur la branche de travail puis réappliquer
git stash list
git stash apply
```

`stash apply` conserve la sauvegarde ; vérifier les fichiers et résoudre les éventuels conflits avant de poursuivre. Le stash reste local et ne remplace pas une sauvegarde distante. Ne pas y inclure volontairement de données confidentielles.

**Un conflit de fusion**

`git status` indique les fichiers concernés et l’opération en cours. Ouvrir chaque fichier, comprendre les deux versions et remplacer les marqueurs `<<<<<<<`, `=======`, `>>>>>>>` par le contenu correct. Vérifier le résultat, exécuter les contrôles utiles, puis sélectionner chaque fichier résolu avec `git add CHEMIN_FICHIER`.

Terminer ensuite l’opération indiquée par Git : `git merge --continue` pour une fusion en cours, ou `git rebase --continue` si vous étiez déjà dans un rebase. Ne pas lancer ces commandes au hasard. Les parcours proposés utilisent `--ff-only` : en cas de divergence, ils s’arrêtent sans créer automatiquement une fusion.

**Un push refusé**

Vérifier `git status`, `git branch --show-current` et `git remote -v`. Si le message concerne l’authentification ou les droits, corriger l’accès au bon dépôt ; un collaborateur sans accès en écriture doit utiliser son fork.

Si le message indique des commits distants absents localement, récupérer d’abord les changements. Pour une branche ayant un suivi vers `origin` :

```bash
# Examiner les changements distants avant de réessayer
git fetch origin
git log --oneline --graph --decorate -10 --all
git pull --ff-only
```

Si l’avance simple réussit, vérifier puis réessayer `git push`. Si elle échoue pour divergence, conserver le travail et coordonner une fusion relue avec l’équipe avant de pousser. Pour un fork, vérifier également `upstream` si la mise à jour du projet original est nécessaire. Ne pas utiliser un push forcé ou `git reset --hard` comme solution par défaut.

## 6. Règles de contribution

- Travailler sur une branche dédiée et proposer une pull request vers `main`.
- Décrire le problème résolu, le comportement obtenu et les vérifications effectuées. Signaler les limites et les points restant à valider.
- Respecter la structure, la syntaxe et les conventions existantes. Proposer les changements d’architecture avant une réorganisation importante.
- Commenter le code **en français**, avec des explications adaptées à un étudiant en BTS SIO : rôle du fichier en introduction lorsque le format le permet, objectif de chaque fonction ou méthode, paramètres et retour lorsqu’ils existent.
- Expliquer les traitements importants : accès aux données, sécurité, règles métier, affectations, PDF et notifications. Documenter les choix complexes sans commenter chaque instruction évidente.
- Mettre les commentaires et la documentation à jour après une modification. Pour le JSON strict, placer les explications dans une documentation associée, sans ajouter de commentaires invalides.
- Ne jamais committer de secrets, clés API, mots de passe, fichiers `.env` réels, données clients ou employés, ni PDF confidentiels. Les commentaires ne doivent pas non plus contenir de secrets.
- Utiliser uniquement des données fictives pour les démonstrations et les captures destinées au dépôt.
- Vérifier les changements sélectionnés avec `git diff --cached` et les nouveaux fichiers avec `git status` avant chaque commit.

Aucun `.gitignore` n’est présent dans le commit examiné. Avant d’ajouter des fichiers, prévoir une exclusion adaptée pour `.venv/`, `__pycache__/`, les `.env` réels et les sorties locales de vérification. Les exports de démonstration déjà suivis doivent rester fictifs. Ajouter une règle d’exclusion ne retire pas un fichier déjà suivi de l’historique : demander de l’aide si un secret a déjà été publié.

## 7. Limites et feuille de route

Cette liste propose l’ordre des prochaines étapes ; elle n’annonce pas des fonctionnalités déjà livrées.

1. **Maintenir la conception à jour.** L’organisation corrigée et la palette logo/publications sont déjà reprises dans la maquette. Compléter les parcours, états d’erreur et adaptations mobiles ; vérifier séparément le fichier Figma en ligne. Le site vitrine conserve ses anciennes couleurs : son harmonisation n’est pas réalisée par cette correction documentaire.
2. **Valider les règles ouvertes.** Absences, renforts, réaffectations, droits détaillés, confirmation des dates, contrats et modalités de paiement avec l’employeur.
3. **Choisir l’architecture.** Backend, moteur de base, hébergement, authentification, gestion des secrets et versions prises en charge. Décrire le modèle de données, les migrations et les sauvegardes.
4. **Construire le parcours commande.** Saisie client et secrétaire, validation serveur, enregistrement, historique, génération PDF et notifications aux trois destinataires internes attendus : secrétaire et deux cogérants.
5. **Développer le suivi opérationnel.** Planification, affectations validées, espace contrôleuses, environnement employé, notifications et comptes rendus.
6. **Ajouter les modules de gestion.** Comptabilité, stocks, inventaires et suivi des véhicules ; centraliser les relevés kilométriques issus des comptes rendus sans nouvelle saisie.
7. **Fiabiliser avant mise en service.** Contrôles d’accès côté serveur, validation des entrées, protection des données, journalisation, tests métier et sécurité, restauration des sauvegardes et documentation d’exploitation.

Restent aussi à confirmer : catalogue réel des prestations, périmètre comptable, canal de notification, éventuelle reprise de commandes PDF externes, conservation des données et statut des documents historiques. L’extraction PDF reste utile comme démonstration ou piste de reprise de documents, mais elle n’est pas une étape obligatoire du futur parcours de commande sur le site.

## 8. Auteurs et licence

La documentation existante attribue le projet à **`eklj`**. L’historique complet des auteurs n’a pas été audité dans cette copie superficielle du dépôt. La liste complète des auteurs et leurs rôles est à compléter par l’équipe ; aucun autre auteur technique n’est attribué ici sans preuve dans le dépôt.

**Licence à définir.** Aucun fichier de licence n’a été identifié dans la version analysée. Les conditions de réutilisation du code, des visuels et des documents doivent être précisées par les responsables du projet.
