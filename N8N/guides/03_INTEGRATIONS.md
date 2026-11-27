# Connecter les services et respecter les décisions métier

Version 1.0 du 19/11/2026. Aucun accès Microsoft, session WhatsApp, endpoint métier ou serveur Evolution API de l’entreprise n’a été configuré pendant cette rédaction. Les procédures suivantes sont préparatoires, hors parcours local du guide 06.

## Contrat d’événement avec le futur backend

Proposition de contenu minimal transmis par le backend après enregistrement durable.

```json
{
  "schema": "edysol.evenement.v1",
  "event_id": "EVT-FICTIF-20261119-001",
  "type": "compte_rendu.transmis",
  "resource_id": "CR-FICTIF-001",
  "resource_version": 3,
  "occurred_at": "2026-11-19T09:30:00+11:00",
  "actor_id": "COMPTE-FICTIF-EMPLOYE"
}
```

L’API authentifie l’émetteur, récupère les données à jour et vérifie ses droits. L’identité d’auteur reçue comme simple texte n’est pas une preuve d’autorisation. Les pièces jointes et photos doivent rester derrière un accès contrôlé, avec identifiant ou lien temporaire approprié. Le webhook évite de copier une vidéo entière dans chaque notification.

Le journal métier garde `event_id`, état de traitement, essais, destinataire et référence fournisseur. Une contrainte d’unicité sur événement/type/destinataire empêche une seconde création de la même réception interne. n8n conserve ses propres identifiants d’exécution, qui servent au diagnostic. Deux tentatives n8n peuvent porter le même événement métier.

Pour les nouvelles demandes, informer séparément Orélie et chacun des deux cogérants. CR transmis, problème et fin d’intervention informent également direction et secrétaire. Les destinataires et habilitations viennent du backend, pas d’un annuaire modifiable librement par l’événement entrant. Yohan n’est pas ajouté au trio par la seule possession de droits temporaires de secrétariat.

## Demandes, devis, comptes rendus et PDF

| Cas | Automatisation envisageable | Décision ou dépendance |
| --- | --- | --- |
| Demande saisie | Mise en forme, diffusion d’un événement de réception, suivi des erreurs | Backend durable et champs obligatoires à stabiliser |
| Demande PDF externe | Extraction déterministe, validation, proposition d’import avec rejets | Reprise décidée, source fiable, absence de doublons et contrôle humain |
| Devis | Préparer une tâche technique ou envoyer une version autorisée par le compte habilité | JC/Mélanie gardent prix/établissement/envoi. Logiciel, modèle et canal à préciser |
| Compte rendu | Notifier sa transmission, signaler un problème, relayer l’événement de fin | Participation équipe/contrôleuse et droits précis à stabiliser |
| Photos / vidéos | Référencer les fichiers privés déjà enregistrés, suivre transfert ou traitement nécessaire | Limites, autorisations et conservation à fixer avant données réelles |
| Planning / renfort | Transmettre une proposition ou une décision déjà prise par l’acteur habilité | Aucun choix automatique de remplaçant. Mélanie valide le renfort |

Les réponses client et décisions direction sont deux événements. Un « oui » WhatsApp, une coche de lecture ou un message livré ne suffit pas à produire une acceptation commerciale sans règle et preuve d’identité décidées. Les automatisations de relance, d’envoi de devis et de confirmation doivent préciser acteur, déclenchement et canal avant activation.

## Excel et SharePoint

Le PDF cite un catalogue en tableur sans définir le fichier ÉDYSOL. Le classeur de pilotage évoqué dans le projet fournit une source possible pour un import à cadrer. Aucune connexion SharePoint effective n’a été obtenue ici et aucune synchronisation continue n’est présente dans le dossier N8N.

### Choisir l’opération avant les permissions

| Méthode | Utilité | Point de vigilance |
| --- | --- | --- |
| Copie `.xlsx` fictive locale | Tester colonnes, types et correspondances sans compte Microsoft | Une modification locale ne prouve pas l’accès SharePoint |
| Microsoft SharePoint, fichier téléchargé puis extraction locale | Lire une copie du classeur autorisé, contrôler puis proposer un import | Permissions sur le site/fichier, format et version du fichier |
| Nœud Microsoft Excel (OneDrive) / endpoint Graph `workbook` | Accéder aux tables et lignes via l’API concernée | Les permissions dépendent de l’opération. L’endpoint classique List tables documente l’accès délégué professionnel et ne prend pas en charge les permissions applicatives |
| Microsoft Excel (SharePoint) actuel | Opérations de lecture/écriture sur classeurs SharePoint selon le nœud disponible | Documentation n8n actuelle annonçant OAuth Graph ou principal de service. Vérifier nœud/version et méthode employée, sans extrapoler au support de tous les endpoints Graph |

Le nouveau nœud et l’API classique `workbook` peuvent avoir des mécanismes différents. Valider le couple opération/authentification avec un classeur fictif du tenant avant généralisation. Sources S07 à S11.

### Préparer une connexion Microsoft

1. Faire identifier par le responsable Microsoft 365 le tenant, le site, la bibliothèque et le fichier de test. Vérifier que le compte dispose réellement de l’accès. Une URL transmise par quelqu’un ne crée pas une autorisation.
2. Choisir avec l’administrateur une authentification déléguée à un compte professionnel, ou un principal de service compatible avec l’opération. L’usage sans utilisateur requiert des permissions applicatives acceptées par l’API ciblée.
3. En auto-hébergement, créer l’application Entra ID autorisée pour l’organisation. Relever son client ID et le tenant. Copier depuis le credential n8n l’URL de callback exacte et l’enregistrer comme URI de redirection Web. Une instance locale utilise une adresse locale, une instance HTTPS possède une autre callback.
4. Créer le secret ou certificat avec sa date d’expiration et son responsable de rotation. Saisir la valeur dans le credential n8n. Ne pas confondre valeur du secret et identifiant du secret. Ne rien copier dans le JSON Git.
5. Accorder les permissions de l’opération. Le nœud SharePoint récent propose `Sites.Read.All`, `Sites.ReadWrite.All` ou `Sites.Selected` selon le besoin. Le dernier nécessite en plus une attribution au site. Limiter l’accès aux sites nécessaires lorsque possible. Les opérations Graph `workbook` requièrent leurs permissions propres, telles que `Files.Read` pour List tables.
6. Obtenir le consentement administrateur si exigé. En délégué, connecter le compte autorisé et vérifier le renouvellement avec `offline_access` lorsque requis. S’assurer que la politique MFA/accès conditionnel est compatible avec le service prévu.
7. Tester d’abord une lecture de métadonnées et d’une table fictive. Un test de connexion réussi peut seulement confirmer l’obtention d’un jeton. Vérifier ensuite l’opération sur le fichier.

Sur les versions récentes, le nœud SharePoint v2 utilise Graph et des credentials différents du v1 historique. Avec `Sites.Selected`, la recherche de sites peut être indisponible, même quand un site précis est autorisé. Sélectionner le site par URL ou ID dans ce cas. Les noms et écrans de consentement doivent correspondre à la version installée. Source S08.

### Préparer l’import sans perte de données

Workflow proposé, à construire après choix du système maître.

1. Déclencheur horaire raisonnable ou événement de modification compatible avec la version des services.
2. Relever identifiant stable du fichier, version/eTag et date de modification, puis télécharger une copie stable.
3. Lire un tableau structuré ou une plage nommée, vérifier colonnes obligatoires, unités, dates, références et erreurs de formule. Ne pas utiliser le numéro de ligne comme identité métier.
4. Produire aperçu, nombre de lignes valides et liste des rejets. Vérifier le mapping avant écriture.
5. Importer par une API ou procédure autorisée avec clé stable et version. Avancer le marqueur de reprise après validation durable de l’import, pas après le seul téléchargement.
6. Si le fichier change pendant la lecture, recommencer depuis une copie cohérente. Une ligne supprimée ne doit pas supprimer automatiquement l’objet métier sans règle explicite.

Import initial, synchronisation périodique et écriture dans les deux outils sont trois périmètres différents. Choisir le système qui fait autorité et les règles de correction avant synchronisation continue. Les conflits ne sont pas résolus par dernière écriture gagnante générale. Aucun intervalle de sondage ne garantit une mise à jour instantanée, surtout en cas de coupure. Pour une hypothèse de sondage toutes les cinq minutes, prévoir jusqu’à cinq minutes d’attente nominale plus le traitement, avec une reprise après panne. Ce délai est une hypothèse pédagogique, pas un objectif validé.

## WhatsApp et Evolution API

Le PDF distingue connexion WhatsApp Web/Baileys et API officielle Meta. Le choix du canal reste ouvert pour ÉDYSOL. Le guide local fonctionne sans compte WhatsApp. WAHA n’est pas fourni dans le dossier examiné et n’a pas été installé ou comparé ici.

### Préparation conditionnelle d’Evolution API

Le dépôt officiel et sa documentation de déploiement ont été consultés. Les anciennes URL du site documentaire en anglais renvoyaient une erreur 404 pendant la recherche, les sources correspondantes du dépôt officiel restent lisibles. Elles mentionnent notamment PostgreSQL et Redis. Leur exemple utilise encore une ancienne image, qui ne suffit pas à recommander cette version pour un nouveau déploiement. Source S17.

Procédure préparatoire pour un laboratoire distinct, depuis un répertoire de test choisi, après décision d’évaluer cette passerelle.

```bash
# Récupérer les sources officielles et examiner les versions disponibles.
git clone https://github.com/evolution-foundation/evolution-api.git evolution-test
cd evolution-test
git tag --sort=-version:refname
# Remplacer TAG_VALIDE par une version examinée, après lecture de sa documentation et licence.
git switch --detach TAG_VALIDE
git rev-parse HEAD
```

Examiner la composition, les variables et la licence de ce tag. Configurer la base et Redis avec des comptes propres au test, la clé `AUTHENTICATION_API_KEY`, l’URL du service et la persistance des sessions selon ce tag. Fixer les images et limiter les ports exposés. Exécuter `docker compose config --quiet`, puis `docker compose up -d` depuis le dossier contenant la composition réellement retenue. Relever la version servie et tester son endpoint d’état selon cette version. Cette procédure conditionnelle n’est pas exécutée ici, aucun tag Evolution API n’est retenu par le présent guide.

Le texte de licence officiel examiné présente Apache 2.0 avec conditions supplémentaires de marque et de signalement de l’usage. Vérifier le texte au tag choisi et le modèle d’exploitation avant engagement. Le mode Baileys est une connexion indirecte qui dépend du fonctionnement de WhatsApp Web. Le PDF identifie notamment reconnexions et risques pour le numéro. Le coût nul de licence ou de message dans un cas ne donne pas une garantie de continuité.

### Relier n8n à la passerelle retenue

Créer dans n8n un credential Header Auth pour la clé attendue par la passerelle. Le nœud HTTP Request doit appeler l’URL et le format documentés pour la version choisie. L’API Evolution documente l’envoi texte via sa famille `message/sendText` et les webhooks par instance. Relever le nom d’instance, la référence du message retournée et l’ID métier dans le journal. Les chemins et champs doivent être validés contre la version choisie avant copie d’un exemple.

Configurer un callback HTTPS de statut vers n8n, filtrer les événements utiles et contrôler son authentification ou sa signature selon le fournisseur. Distinguer acceptation par l’API, envoi, livraison, lecture du canal et décision métier. Un retour de lecture externe ne marque pas la boîte EV-013 comme lue. Si le résultat de l’envoi est inconnu après timeout, rechercher le message par la corrélation fournisseur avant réessai. L’API peut avoir envoyé le message malgré la coupure.

Dans l’API officielle Meta, prévoir le compte professionnel, l’actif WhatsApp, un numéro autorisé, les jetons, modèles et consentements/permissions applicables, puis tester avec les moyens de test du fournisseur. Les tarifs varient selon catégorie et marché du destinataire, voir 08. Le mode direct Meta peut aussi être étudié sans ajouter Evolution API. Aucune session réelle ni autorisation d’envoi n’est déduite de ce guide.
