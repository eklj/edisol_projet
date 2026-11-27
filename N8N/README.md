# n8n pour ÉDYSOL NC

Guide v1.0 du 19 novembre 2026, Pacific/Noumea. Rédaction Production, pour un étudiant en BTS SIO et le futur exploitant.

## Référence examinée

| Élément | Référence |
| --- | --- |
| Dépôt | https://github.com/eklj/edisol_projet |
| Branche distante de référence | `main`, confirmée par GitHub et `origin/HEAD` |
| Commit examiné | `c487ed1bb86886b17b48fc8c4e30264b92c685cb` |
| Date du commit | 18/11/2026 à 12:33:49 +11 |
| Consultation | 19/11/2026, Pacific/Noumea |
| Branche locale des documents préparés | `docs/guide-n8n-edysol` |
| État de livraison | Fichiers préparés localement, sans commit ni push. Revue Expert et mise en service à venir |

## Ce que contient le dossier

Le dépôt examiné fournit un PDF de présentation de neuf pages et une vidéo pédagogique de 74,8 secondes. Aucun export de workflow n8n, configuration de service, identifiant de connexion ou instance opérationnelle n’y est fourni. Le PDF décrit une entreprise fictive distribuant des interventions à des prestataires externes. Son architecture sert de point de comparaison à l’adaptation ÉDYSOL.

Cette actualisation ajoute un laboratoire local proposé et un workflow pédagogique de réception fictive. Les intégrations métier restent à construire et à valider. Les statuts et preuves détaillés figurent dans [le relevé de vérification](guides/07_VERIFICATIONS.md).

| Lire dans cet ordre | Contenu |
| --- | --- |
| [État des sources et fonctionnement](guides/01_FONCTIONNEMENT.md) | Inventaire, vocabulaire, adaptation aux équipes et workflows envisagés |
| [Installer et configurer](guides/02_INSTALLATION.md) | Docker Compose local, versions, identifiants, import et webhooks |
| [Connecter les services](guides/03_INTEGRATIONS.md) | Backend, PDF, Excel/SharePoint, WhatsApp et limites d’autorisation |
| [Exploiter au quotidien](guides/04_EXPLOITATION.md) | Arrêt, redémarrage, mises à jour, sauvegardes, restauration et doublons |
| [Dépanner](guides/05_DEPANNAGE.md) | Symptômes, diagnostic, correction et contrôle |
| [Premier test de bout en bout](guides/06_TEST_BOUT_EN_BOUT.md) | Données fictives, résultat attendu et preuves |
| [Vérifications réalisées](guides/07_VERIFICATIONS.md) | Résultats obtenus, limites et procédures encore à tester |
| [Coûts, sources et questions](guides/08_COUTS_SOURCES_DECISIONS.md) | Tarifs datés, limites, sources officielles et arbitrages restants |
| [Récapitulatif des changements](MISES_A_JOUR.md) | Fichiers ajoutés et différences avec la présentation d’origine |

## Démarrage du laboratoire

Depuis la racine du dépôt, lire puis appliquer le guide d’installation. Les commandes suivantes s’exécutent dans `N8N/`, une fois Docker Engine et Compose disponibles et la clé locale générée.

```bash
cd N8N
# Vérifier le projet sans afficher la configuration et ses secrets.
docker compose config --quiet
# Télécharger la version indiquée dans .env, puis lancer le laboratoire.
docker compose pull
docker compose up -d
docker compose ps
```

L’éditeur local est accessible sur `http://localhost:5678/`. Le workflow JSON se trouve dans `exemples/workflow_test_local.json`. Il prépare trois notifications fictives et répond à la requête. Son test ne crée aucune demande dans une base ÉDYSOL. La démonstration des droits et de la persistance réelle nécessitera le futur backend et ses tests.

Le PDF et la vidéo historiques sont conservés dans leur état initial. L’usage de n8n comme orchestrateur, le choix de WhatsApp/Evolution API, les accès Microsoft et l’import du classeur relèvent des propositions expliquées dans les guides. La Direction garde les décisions métier. L’Exécuteur construit les workflows, l’Expert vérifie, Exploitation prépare la maintenance et la Direction autorise la mise en service.
