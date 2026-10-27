# Modèle de données et API proposés — non déployés

Ce contrat accompagne la maquette. Aucun schéma de base existant ni backend métier n’était disponible dans les fichiers examinés. Les noms ci-dessous sont indicatifs et doivent être rapprochés de la future base ; aucune migration SQL n’a été exécutée.

## Entités et relations

| Entité | Champs et relations principaux | Contraintes proposées |
|---|---|---|
| Véhicule | id, immatriculation, identifiant interne | Identification unique dans le périmètre de l’entreprise ; immatriculation à normaliser |
| Compte rendu | id, intervention_id, employe_id, utilise_vehicule, version | Employé identifié au serveur ; option aucun véhicule explicite |
| Relevé logique | id, compte_rendu_id, véhicule_id courant | Une origine active par compte rendu/véhicule ; un changement de véhicule reste traçable |
| Révision du relevé | relevé_id, version, véhicule_id, employe_id, date_releve, compteur, date_saisie, auteur, motif, retiré | Unicité relevé/version ; référence précédente conservée ; compteur >= 0 ; date avec fuseau |
| Idempotence | acteur_id, clé, opération, empreinte, résultat | Clé unique par acteur/opération ; même clé avec autre contenu : conflit |
| Article | id, libellé, nature, unité de référence, précision | Nature consommable ou durable ; quantité décimale exacte |
| Mouvement stock | id, article_id, type, quantité, unité, date_effective, auteur, motif, origine | Entrée, sortie ou ajustement ; historique immuable ; idempotence |
| Inventaire | id, date_reference, date_comptage, auteur, état, éventuel périmètre | Lieux et validation encore à définir ; situation théorique de référence figée |
| Ligne inventaire | inventaire_id, article_id, quantité_théorique, quantité_comptée, écart | Même unité ; comptage >= 0 ; lien de tout ajustement ultérieur |

Les tables employés, interventions, équipes fixes, disponibilités et coordination restent celles à définir pour l’organisation déjà validée. Une contrôleuse conserve une activité de ménage distincte de ses missions de coordination.

La projection du dernier compteur n’est pas une somme ni une valeur maximale : c’est le ou les relevés effectifs de date la plus récente. En cas de contradiction sur cette date, afficher le conflit. Une correction de date ou de véhicule invalide les projections concernées. Une vue de lecture peut calculer cette projection à la demande ; si elle est matérialisée, elle doit être reconstruisible depuis l’historique.

## Écriture et centralisation proposées

1. Authentifier la requête ; vérifier l’accès au compte rendu et à l’intervention.
2. Contrôler le choix Aucun véhicule, le véhicule reconnu, le compteur numérique et la date réelle.
3. Vérifier l’idempotence, l’origine logique et la version attendue.
4. Dans une même transaction, enregistrer le compte rendu et sa révision de relevé. Ne pas rendre le suivi dépendant d’une seconde saisie manuelle ou d’une extraction du PDF.
5. Relire les voisins chronologiques du véhicule et signaler les incohérences.
6. Exposer la projection à Comptabilité via une route distincte, soumise à son autorisation propre.

Si une file ou un événement est ajouté plus tard, le consommateur devra être idempotent et la publication liée à la transaction (outbox ou mécanisme équivalent). Aucune automatisation n8n/WhatsApp n’est créée par cette proposition.

## Routes indicatives — pas des endpoints implémentés

| Méthode / chemin | Usage | Contrôle requis |
|---|---|---|
| GET /api/employe/vehicules-selection | Identifiants et immatriculations pour la saisie | Session employé ; réponse minimale sans relevés ni données comptables |
| PUT /api/comptes-rendus/{id} | Enregistrer son compte rendu et la rubrique véhicule | Session, propriétaire/intervention autorisée, version et idempotence ; identité employé côté serveur |
| GET /api/comptabilite | Accès à l’espace défini | Secrétaire ou cogérant ; pas d’accès implicite employé |
| GET /api/comptabilite/vehicules | Derniers compteurs datés et alertes | Autorisation Comptabilité |
| GET /api/comptabilite/vehicules/{id}/releves | Historique et références des comptes rendus sources | Autorisation Comptabilité + contrôle du périmètre des objets |
| POST /api/comptabilite/releves/{id}/corrections | Ajouter une révision motivée | Permission de correction à définir ; refus par défaut ; version attendue |
| GET /api/comptabilite/articles | Articles, nature, quantité et unité | Autorisation Comptabilité |
| GET /api/comptabilite/mouvements | Historique des entrées, sorties et ajustements | Autorisation Comptabilité |
| POST /api/comptabilite/mouvements | Ajouter un mouvement | Permission d’écriture à définir ; transaction et idempotence |
| POST /api/comptabilite/inventaires | Préparer un comptage et sa référence | Permission à définir ; périmètre de stockage non décidé |
| POST /api/comptabilite/inventaires/{id}/comptages | Enregistrer le comptage physique | Permission à définir ; ne pas convertir l’écart en ajustement silencieux |

Pour le compte rendu, le corps peut contenir `vehicule_utilise`, `vehicule_id`, `kilometrage_compteur_km` et `releve_le`. Aucun `employe_id` fourni par le client ne doit déterminer l’auteur effectif. Si `vehicule_utilise=false`, le véhicule et le compteur doivent être absents ou nuls ; une suppression de relevé existant doit conserver sa trace de correction.

Une proposition de réponse peut distinguer erreurs de validation, conflit d’idempotence ou de version, accès refusé et alertes métier. Le traitement final des anomalies et les droits de correction restent à définir ; ne pas transformer ces propositions de codes ou de permissions en décisions déjà approuvées.

## Vérifications serveur à effectuer dès qu’un backend sera disponible

- Sans session, accès refusé aux comptes rendus et à Comptabilité.
- Avec une session employé ou contrôleuse, accès refusé à toutes les routes comptables, même en appel direct ou en modifiant un identifiant.
- Un employé ne peut pas lire ou modifier le compte rendu d’un autre ni injecter un autre auteur.
- La liste de sélection des véhicules ne retourne pas les historiques, stocks ou informations comptables.
- Secrétaire/cogérant : consultation prévue, mais toute modification reste refusée sans permission d’écriture définie.
- Les corrections conservent l’historique ; les courses concurrentes ne perdent pas de versions et les réessais ne créent pas de doublons.
- Contrôler au serveur la validation numérique, les unités et les dates, indépendamment des champs HTML.

Les tests JavaScript locaux couvrent la politique de référence et les règles métier ; ils ne prouvent pas ces protections HTTP, faute de serveur présent.
