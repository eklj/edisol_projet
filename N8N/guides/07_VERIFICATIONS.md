# Vérifications réalisées et limites

Version 1.0 du 19/11/2026. Vérifications de rédaction par Production, sans avis indépendant Expert obtenu. Toutes les données du parcours sont fictives. Aucune mise en service d’entreprise.

## Résultats de l’examen et des essais

| Contrôle | Résultat réellement obtenu | Portée / preuve |
| --- | --- | --- |
| Branche et commit du dépôt | `main`, `c487ed1bb86886b17b48fc8c4e30264b92c685cb` | Métadonnées GitHub, clone complet et référence distante concordants au début de l’examen |
| Contenu original `N8N` | PDF de neuf pages et vidéo ; aucun workflow ou configuration suivi | `git ls-tree -r HEAD N8N`, inventaire dans `verification.json` |
| PDF | Texte des neuf pages lu, page 3 rendue et examinée | Source conservée, empreinte dans le relevé |
| Vidéo | Métadonnées et cinq images examinées | 74,8 secondes, son non transcrit ; aucun fonctionnement logiciel réel certifié par cette vidéo |
| Version n8n | npm `2.48.5`, moteur Node `>=24.0.0` | `npm view`, paquet installé et `n8n --version` |
| Installation npm isolée | Réussie, 2 258 paquets ajoutés, environ deux minutes annoncées par npm | Répertoire temporaire hors dépendances du produit ; environ 2,7 Go constatés, nombreux avertissements de dépendances. Aucun audit de vulnérabilité exhaustif effectué |
| Import du workflow fictif | Sortie 0, un workflow importé | CLI `import:workflow` sur une base locale neuve |
| Publication du workflow fictif | Sortie 0 | CLI `publish:workflow --id=EdysolTestLocal01`, puis démarrage |
| Démarrage moteur | Réussi avec Node `v24.22.3`, Python de supervision `3.12.14` | n8n 2.48.5, task runner JavaScript interne démarré |
| État HTTP | `/healthz/readiness` répond 200 dans l’instance locale | Vérifié depuis le même processus de supervision que le serveur |
| T1 — JSON valide | HTTP 200, demande reçue/non décidée et trois notifications fictives non lues | `parcours_http.json` |
| T2 — JSON invalide | HTTP 422, code `EVENEMENT_DEMO_INVALIDE` | Réponse de validation, exécution n8n techniquement réussie |
| T3 — Réessai identique | HTTP 200 et réponse identique | Deux exécutions distinctes pour l’événement valide, sans effet externe. Dédoublonnage durable absent et explicitement signalé |
| Persistance après arrêt | Trois exécutions initiales enregistrées avec état technique `success` | Base SQLite de test consultée après arrêt, aucune donnée d’entreprise |
| Copie/restauration SQLite | Copie à froid dans un autre dossier et un autre port ; workflow et exécutions retrouvés | `restauration_locale.json`. Même clé de test conservée. Aucun credential externe à restaurer |
| Dépublication de la copie | CLI réussie, état stocké inactif | Un premier appel a encore reçu 422. Après nouvelle dépublication ciblée, redémarrage et attente de fin d’initialisation, la route répond 404 |
| Docker / Compose | Docker absent | Démarrage, téléchargement d’image, `compose config`, sauvegarde et restauration Docker **non exécutés** |
| Microsoft / SharePoint / Excel d’entreprise | Aucun compte/service configuré | Procédures vérifiées dans les sources, accès tenant et fichiers réels **non testés** |
| Evolution API / Meta / envoi WhatsApp | Aucun service ou numéro connecté | Lecture des sources et licence seulement, aucun message envoyé |
| Backend ÉDYSOL / EV-013 | Aucun endpoint métier branché par ce guide | Droits serveur, journal durable, historique interappareils, photos et synchronisation restent à construire et tester |
| Interface navigateur | Non testée pendant cette rédaction | Import UI et contrôles visuels restent à exécuter ; import CLI et moteur HTTP vérifiés |

## Difficultés rencontrées et corrections de la procédure

La première tentative HTTP effectuée depuis un autre contexte d’exécution renvoyait une connexion refusée. Le test a été repris en lançant et contrôlant n8n dans le même processus superviseur. Les trois scénarios HTTP ont ensuite réussi selon leurs attentes. Cette difficulté décrit l’environnement de rédaction.

Lors de la restauration, le premier contrôle attendait une route 404 après dépublication et a obtenu 422. La base affichait ensuite le workflow inactif. Une nouvelle dépublication ciblée suivie d’un redémarrage et d’une attente de la fin d’indexation a donné 404. La cause exacte de l’état transitoire initial n’est pas établie. Le guide conserve ce résultat et isole la restauration Docker par `network_mode: none`, sans port publié, pour limiter les effets avant contrôle complet des déclencheurs. L’isolation Docker elle-même reste à tester.

La base restaurée possède quatre exécutions après ces essais, contre les trois initiales de la source. La quatrième correspond au premier contrôle HTTP encore exécuté, pas à une preuve de perte ou duplication des trois précédentes. Le contrôle final n’a pas créé de nouvelle exécution. Une restauration réelle doit vérifier aussi les credentials, fichiers binaires, éventuelle base PostgreSQL et réconciliation avec les services externes.

Les logs n8n indiquent la dépréciation future de l’installation hors conteneur et du runner interne. Le laboratoire Docker reste la méthode proposée et le montage d’un runner externe doit être réévalué pour l’exploitation de la version choisie. Aucune dépendance n8n n’a été ajoutée à la maquette ÉDYSOL.

## Contrôles encore attendus avant usage réel

L’Exécuteur devra reproduire le laboratoire Compose, confirmer l’image/digest et les permissions des volumes, puis les sauvegardes/restaurations isolées. Expert doit rejouer les contrôles sur le même état livré. Exploitation doit prouver une alerte d’échec, une reprise après coupure et un retour arrière compatible.

Chaque intégration externe exige ensuite compte de test autorisé, permissions minimales, procédure de rotation, gestion du 429/timeouts et preuve de non-duplication à la cible. Les fonctions métier impliquent leurs droits et décisions validés. La Direction nomme les responsables et autorise la mise en service sur la base de ces preuves.

Preuves livrées, [relevé principal](../preuves/verification.json), [réponses HTTP](../preuves/parcours_http.json), [restauration locale](../preuves/restauration_locale.json). Les journaux complets d’installation et les bases contenant les secrets de test restent hors du paquet et de Git.
