# Récapitulatif de l’actualisation N8N

Version 1.0 du 19/11/2026. Comparaison au dossier `N8N` de `main@c487ed1bb86886b17b48fc8c4e30264b92c685cb`. La source PDF est datée d’octobre 2026 et ne désigne pas son commit de référence. Comparaison directe avec son contenu et l’inventaire Git courant.

## Éléments conservés

`Projet_Automatisation_Commandes_WhatsApp_n8n_EvolutionAPI.pdf` et `Comment_l_automatisation_route_vos_commandes.mp4` restent inchangés. Leurs tailles, empreintes et blobs Git figurent dans `preuves/verification.json`. Aucune source ni archive supprimée.

## Fichiers ajoutés

| Fichier / groupe | Usage |
| --- | --- |
| `README.md` | Nouveau point d’entrée documentaire, référence Git et ordre de lecture |
| `guides/01_FONCTIONNEMENT.md` | Inventaire, explication n8n et adaptation ÉDYSOL |
| `guides/02_INSTALLATION.md` | Installation locale, versions fixées, import, connexions et webhooks |
| `guides/03_INTEGRATIONS.md` | Données/API proposées, devis/CR/PDF, Microsoft et WhatsApp/Evolution |
| `guides/04_EXPLOITATION.md` | Surveillance, erreurs, doublons, sauvegarde/restauration et mise à jour |
| `guides/05_DEPANNAGE.md` | Tableau symptôme, cause, diagnostic, correction, vérification |
| `guides/06_TEST_BOUT_EN_BOUT.md` | Parcours fictif reproductible et preuves attendues |
| `guides/07_VERIFICATIONS.md` | Résultats réellement obtenus et limites |
| `guides/08_COUTS_SOURCES_DECISIONS.md` | Tarifs, sources datées et questions restantes |
| `compose.yaml`, `.env.example`, `.gitignore` | Laboratoire local proposé et exclusion des secrets/données |
| `compose.restauration.yaml` | Copie de restauration proposée, réseau isolé et sans port publié |
| `exemples/workflow_test_local.json` | Nouveau workflow pédagogique, indépendant du produit |
| `exemples/demande_fictive.json`, `exemples/evenement_invalide.json` | Jeux d’essai sans données personnelles |
| `preuves/parcours_http.json`, `restauration_locale.json`, `verification.json` | Preuves textuelles synthétiques sans secret |
| Le présent `MISES_A_JOUR.md` | Trace documentaire des changements |

## Évolutions de contenu

Le scénario générique d’attribution à un prestataire externe est replacé dans le contexte des équipes ÉDYSOL. Les demandes, devis, décisions direction, comptes rendus et notifications individuelles sont distingués, avec leurs validations et dépendances. L’usage de n8n pour les orchestrer reste proposé.

L’installation décrit un environnement local à version fixée. Les noms actuels des paramètres webhook, le modèle de publication, les différences de credentials Microsoft et les limites des endpoints Excel sont documentés. Les procédures ne reprennent pas une ancienne image Evolution API comme version de production retenue.

Les coûts fictifs du PDF restent identifiés comme exercice. Les tarifs n8n affichés, conversions F CFP et postes inconnus sont documentés, avec les limites d’édition et l’absence de tarif WhatsApp NC confirmé. Le guide ajoute les conséquences d’une connexion instable et du fuseau `Pacific/Noumea`.

Le parcours local HTTP et la recopie SQLite ont été exécutés avec n8n 2.48.5. Docker, Microsoft et WhatsApp restent non testés. Le contrôle de route après dépublication a connu un résultat transitoire inattendu, conservé dans 07, puis une réponse finale 404. La procédure de restauration proposée isole le réseau.

## Statut de transmission

Les fichiers sont préparés sur la branche locale `docs/guide-n8n-edysol`. Aucun commit, push, publication, workflow d’entreprise ou message externe effectué. Aucun avis Expert ou accord Direction obtenu par cette rédaction. Le README racine et les fichiers produit restent hors du périmètre de modification de cette livraison. L’intégration au dépôt et la revue indépendante restent à organiser par l’utilisateur.
