# Premier parcours de test avec données fictives

Version 1.0 du 19/11/2026. Objectif, vérifier une réception HTTP dans n8n, son contrôle de forme et une réponse adaptée aux destinataires internes ÉDYSOL. L’exemple prépare des notifications fictives. L’enregistrement métier, les droits serveur et l’EV-013 interappareils feront l’objet de tests ultérieurs.

## Préparer le test

Le laboratoire du guide 02 doit démarrer et `workflow_test_local.json` doit être importé. Les trois nœuds sont **Reception locale**, **Controle et simulation**, **Reponse de test**. Le workflow est publié seulement sur le laboratoire afin d’utiliser `/webhook/edysol-test-local`. Le point d’entrée de démonstration n’a pas d’authentification et le serveur reste limité à la machine locale. Les services distants réels sont absents de ce parcours.

Le test utilise `exemples/demande_fictive.json`. Ses identifiants commencent par `EVT-DEMO-` et `DEMO-`. Les trois comptes retournés sont inventés. Le contrôle accepte uniquement `type=demande.recue`, une prestation textuelle, une flexibilité `flexible` ou `imposee` et ces identifiants de démonstration. Ce schéma sert au test technique, les champs métier obligatoires seront définis dans le futur contrat d’API.

### T1 — Demande fictive valide

Depuis `N8N/`, port par défaut 5678.

```bash
# Envoyer le JSON fictif au workflow publié localement et afficher le code HTTP.
curl --include --show-error \
  -X POST http://localhost:5678/webhook/edysol-test-local \
  -H 'Content-Type: application/json' \
  --data-binary @exemples/demande_fictive.json
```

Attendu, HTTP 200 avec `simulation=true`, `id_evenement=EVT-DEMO-001`, `demande_id=DEMO-001`, `etat_demande=recue_non_decidee`, `date_demandee=2026-11-20`, `flexibilite=flexible`. Le tableau `notifications_fictives` comporte exactement trois objets.

```json
[
  {"destinataire": "COMPTE-DEMO-SECRETARIAT", "lue": false},
  {"destinataire": "COMPTE-DEMO-DIRECTION-1", "lue": false},
  {"destinataire": "COMPTE-DEMO-DIRECTION-2", "lue": false}
]
```

Les champs `envoi_externe=false` et `dedoublonnage_durable=false` signalent les limites du laboratoire. Dans **Executions**, retrouver l’exécution, examiner l’entrée du webhook et la sortie des nœuds. Vérifier l’absence de prix, de devis émis, de réservation confirmée et de lecture automatique. Noter version, ID d’exécution et heure locale.

### T2 — Données invalides

Depuis `N8N/`.

```bash
# Le fichier ne contient pas les identifiants ni la prestation obligatoires pour ce test.
curl --include --show-error \
  -X POST http://localhost:5678/webhook/edysol-test-local \
  -H 'Content-Type: application/json' \
  --data-binary @exemples/evenement_invalide.json
```

Attendu, HTTP 422 et `erreur=EVENEMENT_DEMO_INVALIDE`, sans liste de notifications. Le workflow gère cette entrée et répond normalement au niveau technique. n8n peut donc afficher l’exécution comme `success`, alors que la demande HTTP a reçu un refus 422. Contrôler également le résultat métier, pas seulement la couleur de l’exécution.

### T3 — Réessai du même événement

Rejouer exactement T1 avec le même fichier et le même ID. Attendu pour ce laboratoire, une deuxième exécution et une réponse fictive identique. Le JSON montre toujours `dedoublonnage_durable=false`.

Ce résultat démontre le transport et la projection, ainsi que la limite à corriger avant effets réels. Le futur test d’intégration devra soumettre deux fois, y compris simultanément et après redémarrage, le même événement et vérifier une seule réception persistée par destinataire et un seul effet externe attendu. Cette garantie dépend du backend/journal et du fournisseur, voir 04.

### T4 — Redémarrage et restauration

Conserver la base de test, arrêter et redémarrer n8n avec le même dossier/volume. Vérifier les exécutions et le workflow. Reproduire ensuite la restauration isolée du guide 04, dépublier les workflows restaurés avant de démarrer leurs déclencheurs, puis vérifier HTTP et présence des données. La copie restaurée non publiée doit renvoyer 404 à la route webhook. Une copie complète du dossier SQLite a été vérifiée pendant la rédaction, voir 07, tandis que les commandes Docker restent à exécuter.

## Preuves à conserver

| Contrôle | Preuve |
| --- | --- |
| Version | `n8n --version`, image/digest si Docker, date et système |
| T1 et T2 | Code HTTP, JSON de réponse, ID d’exécution et entrée/sortie des trois nœuds |
| T3 | Même ID métier, deux tentatives visibles, résultat de dédoublonnage explicitement absent du laboratoire |
| Persistance | Workflow et exécutions retrouvés après redémarrage/recopie selon procédure |
| Limites | Absence d’appel Microsoft/WhatsApp, absence de base métier et de comptes réels, données fictives |

Les preuves textuelles obtenues ici sont [parcours_http.json](../preuves/parcours_http.json), [restauration_locale.json](../preuves/restauration_locale.json) et [verification.json](../preuves/verification.json). Elles sont produites avec le moteur n8n local, sans revue indépendante Expert. Les essais d’interface navigateur, d’OAuth, des messages réellement livrés, de sauvegarde de credentials réels et d’entreprise restent à organiser.
