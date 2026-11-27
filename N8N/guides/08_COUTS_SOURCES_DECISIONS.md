# Coûts, limites, références et décisions restantes

Version 1.0 du 19/11/2026, Pacific/Noumea. Les tarifs ci-dessous sont ceux affichés lors de la consultation. Les prix exacts, taxes, conditions locales et modalités de paiement doivent être recontrôlés lors de l’engagement. Aucun abonnement ou service payant souscrit.

## Coûts et limites utiles à ÉDYSOL

| Poste | Information officielle ou hypothèse | Incidence pour ÉDYSOL |
| --- | --- | --- |
| n8n Community auto-hébergée | Édition gratuite, usage interne admissible selon licence. S03 et S18 | Logiciel à 0 € de licence dans ce cadre, mais machine, sauvegardes et maintenance à financer |
| n8n Cloud Starter | 20 €/mois, facturé annuellement, 2 500 exécutions mensuelles. S15 | Environ 2 387 F CFP/mois équivalent, engagement annuel de 240 € ≈ 28 640 F CFP, hors taxes/frais |
| n8n Cloud Pro | 50 €/mois, facturé annuellement, 10 000 exécutions mensuelles. S15 | Environ 5 967 F CFP/mois équivalent, 600 € ≈ 71 599 F CFP/an, hors taxes/frais |
| Hébergement auto-hébergé | Aucun hébergeur/forfait retenu | Demander prix machine, stockage, trafic, sauvegarde et support. Le coût total ne peut pas être chiffré sans dimensionnement |
| Microsoft 365 / SharePoint | Nécessite les services et accès du contrat de l’entreprise. S07 à S11 | Vérifier licence existante, accès administrateur, permissions API et éventuels besoins additionnels. Aucun tarif de licence ajouté faute de plan identifié |
| Evolution API | Licence officielle avec conditions additionnelles. S17 | Coût logiciel/contractuel à confirmer pour le tag et l’usage, plus base/Redis, sessions, serveur, sauvegarde et maintenance |
| WhatsApp Business Platform | Tarification par message livré, catégorie et marché du destinataire. S19 | Établir la catégorie et le tarif effectif pour les destinataires concernés, notamment +687. Aucun prix NC par message confirmé dans cette passe |
| Extraction/OCR | Extraction déterministe envisageable ; OCR seulement si besoin de scans | Évaluer qualité/temps. Aucun service IA/OCR payant nécessaire au laboratoire |
| Domaine/HTTPS/administration | Infrastructure à choisir | Renouvellements, suivi des certificats, temps d’astreinte et incidents à budgéter |

Conversion utilisée, 1 000 F CFP = 8,38 €, donc euro × 1 000 / 8,38, arrondi au franc. Source IEOM S20. Les montants mensuels n8n cités sont des équivalents d’offres facturées à l’année, pas une promesse de prélèvement mensuel local.

La Community ne fournit pas tous les outils de partage, SSO, projets ou gestion avancée des accès. L’édition doit être confrontée au nombre de personnes qui administreront les workflows. Les rôles des employés dans l’application ÉDYSOL restent gérés par l’application. S03 décrit les différences d’édition, S15 fait autorité pour les fonctions et prix actuels.

Le PDF d’origine illustre 600 commandes et 690 messages avec un tarif inventé de 0,01 €. Conserver ces nombres uniquement comme exercice. Budget réel de messagerie = somme des messages livrés facturables par catégorie/marché × tarif applicable + coûts de passerelle/hébergement/taxes. Certaines conditions de gratuité Meta existent, mais elles ne doivent pas être appliquées automatiquement aux notifications sortantes ÉDYSOL.

Un déclencheur **Schedule Trigger** toutes les cinq minutes représente 8 640 démarrages sur 30 jours si le workflow s’exécute à chaque échéance. Cette hypothèse peut dépasser Starter à elle seule. Mesurer les exécutions du mécanisme réellement retenu et distinguer les déclencheurs qui ne lancent le workflow que lorsqu’un changement existe. Définir volume d’événements, fréquence et relances avant de choisir l’offre.

Le laboratoire livre `EXECUTIONS_DATA_PRUNE=false` pour des essais fictifs courts et documentés. Une entreprise doit choisir conservation et dimensionnement, avec surveillance du disque. La conservation du journal technique n8n et celle de la boîte de réception métier EV-013 ont des finalités différentes. Une purge de preuves techniques ne doit pas effacer les notifications métier conservées dans leur système.

## Sources officielles consultées le 19/11/2026

| ID | Source et usage |
| --- | --- |
| S01 | [Installation Docker](https://docs.n8n.io/deploy/host-n8n/install-options/install-with-docker.md) et [Compose actuel](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose.md), version stable affichée et conteneur/persistance. La page Compose inclut aussi une stack IA, plus large que notre laboratoire |
| S02 | [Installation npm](https://docs.n8n.io/deploy/host-n8n/install-options/install-with-npm.md), plage générale Node et dépréciation annoncée en 3.0. Métadonnées npm 2.48.5 contrôlées séparément, `engines.node >=24.0.0` |
| S03 | [Comparaison des éditions](https://docs.n8n.io/deploy/host-n8n/community-edition-features.md), Community, partage et fonctions avancées |
| S04 | [Reverse proxy et URL webhook](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/configure-webhook-urls-with-reverse-proxy.md), nom `N8N_WEBHOOK_URL`, proxies et headers |
| S05 | [Nœud Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook.md) et [types d’exécutions](https://docs.n8n.io/build/understand-workflows/understand-executions/types-of-executions.md), test, publication et réponses |
| S06 | [Server CLI](https://docs.n8n.io/deploy/host-n8n/configure-n8n/use-the-command-line.md) et [import/export](https://docs.n8n.io/build/manage-workflows/export-and-import.md), import JSON, publication et données exportées |
| S07 | [Credentials Microsoft](https://docs.n8n.io/integrations/builtin/credentials/microsoft.md), Entra/OAuth, callback, secret et types de connexion |
| S08 | [Microsoft SharePoint](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftsharepoint.md), différence V1/V2, Graph et accès par site |
| S09 | [Microsoft Excel SharePoint](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftexcelsharepoint.md) et [Excel OneDrive](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftexcel.md), opérations et types d’authentification selon nœud |
| S10 | [Microsoft Graph List tables](https://learn.microsoft.com/en-us/graph/api/workbook-list-tables?view=graph-rest-1.0), permissions déléguées et absence de permission applicative pour cet endpoint |
| S11 | [Limitation des appels Graph](https://learn.microsoft.com/en-us/graph/throttling), 429 et `Retry-After` |
| S12 | [Gestion des erreurs](https://docs.n8n.io/flow-logic/error-handling/) et [HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest.md), erreurs, diagnostic et appels HTTP |
| S13 | [Clé de chiffrement](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/set-a-custom-encryption-key.md), rôle de la clé et dossier persistant |
| S14 | [Variables d’exécution](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/executions.md), enregistrement et purge des preuves |
| S15 | [Tarifs n8n](https://n8n.io/pricing/), offres et quotas affichés |
| S16 | [Docker sur Ubuntu](https://docs.docker.com/engine/install/ubuntu/), distributions et paquets d’installation |
| S17 | [Evolution API](https://github.com/evolution-foundation/evolution-api), [licence](https://github.com/evolution-foundation/evolution-api/blob/main/LICENSE), [source Docker](https://github.com/evolution-foundation/docs-evolution/blob/main/v2/en/install/docker.mdx) et [source webhooks](https://github.com/evolution-foundation/docs-evolution/blob/main/v2/en/configuration/webhooks.mdx). Les pages web historiques en anglais renvoyaient 404, leurs sources officielles ont été lues via GitHub |
| S18 | [FAQ licence n8n](https://support.n8n.io/article/can-i-use-your-license-for-my-use-case) et [texte de licence](https://github.com/n8n-io/n8n/blob/master/LICENSE.md), conditions pour usage interne et modèles commerciaux |
| S19 | [Tarification officielle WhatsApp](https://whatsappbusiness.com/products/platform-pricing/), facturation selon catégorie et marché, conditions de gratuité. Grille spécifique NC non confirmée |
| S20 | [IEOM, rapport annuel 2023](https://www.ieom.fr/IMG/pdf/241191_ieom_ra_23_bd_web_pap.pdf), parité franc CFP/euro |

Les documents consultés peuvent évoluer. Relever leur date/version au moment d’une installation ou mise à jour. Les exigences `engines` du paquet fixé ont priorité pour la commande npm proposée. Aucun exemple ancien d’une passerelle n’est automatiquement compatible avec une version récente.

## Questions restantes pour adapter complètement ÉDYSOL

1. Quel premier processus la Direction souhaite-t-elle confier à n8n, avec quel volume, quels événements et quels critères de réussite ? Réception demande et notifications sont des besoins connus, leur orchestration par n8n reste une proposition.
2. Quel backend, API authentifiée et journal durable feront autorité pour demandes, droits, notifications, conflits et réessais ? Où se placera la décision interne direction dans le parcours ?
3. Quels canaux externes sont retenus pour clients et équipes, avec quel compte/numéro, quels destinataires et quel budget ? Faut-il Evolution API, une API officielle directe ou un autre service ?
4. Quel logiciel établit les devis/factures, quels modèles et quelle preuve d’autorisation/envoi doivent être utilisés ? Les pouvoirs JC/Mélanie restent acquis.
5. Pour Excel/SharePoint, quel site et fichier autorisés, quel administrateur et quel responsable métier ? Import initial ou synchronisation, quel système maître, quelles colonnes/identités, quelles corrections et suppressions autorisées ?
6. Quels droits précis s’appliquent à la transmission/correction des CR et aux médias ? Quelles durées de conservation distinguer pour données métier, exécutions n8n, fichiers et sauvegardes ?
7. Qui exploite, reçoit les alertes, renouvelle les secrets et intervient après le stage ? Qui participe à la recette, qui accepte et qui autorise la mise en service ? Quels délais de reprise et pertes maximales sont acceptables ?
8. Quel hébergement et quelle édition n8n répondent à ces exigences, avec quelles garanties de sauvegarde/restauration et de protection des accès ? Ces choix restent à arbitrer avant engagement.

Ces questions complètent les décisions acquises sur direction, secrétaire, contrôleuses, équipes et EV-013. Elles ne demandent pas une nouvelle validation du design ou du besoin Android hors ligne.
