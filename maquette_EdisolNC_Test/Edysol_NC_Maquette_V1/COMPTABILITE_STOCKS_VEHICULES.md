# Édysol — Comptabilité, stocks et véhicules

Version du 27 octobre 2026. Ce document complète les décisions d’organisation : deux superviseuses également employées de ménage, quatre binômes fixes et autres employés solos. La coordination ne vaut pas disponibilité pour une prestation. Les règles d’absence, de renfort et de validation des affectations restent ouvertes.

## Périmètre validé

L’espace Comptabilité est accessible à la secrétaire et aux cogérants. Il regroupe Stocks et inventaire et Véhicules de service. Les fonctions comptables détaillées et les droits de modification ne sont pas définis : aucune facturation, fiscalité, écriture comptable ou fonction supplémentaire n’est annoncée comme validée.

Le compte rendu employé contient le véhicule utilisé, un nombre « Kilométrage au compteur (km) » et la date/heure réelle du relevé. Le compteur représente le total affiché, jamais la distance parcourue pendant l’intervention. L’option Aucun véhicule ne crée pas de relevé et ne conserve pas de compteur résiduel.

## Livrables réalisés dans cette conversation

- Deux pages Figma existantes mises à jour, avec 41 vues chacune : ajout de 6 vues par rôle (Comptabilité, Stocks, Mouvements, Inventaire, Véhicules, Historique) et remplacement du compte rendu mobile par une version comprenant la rubrique véhicule.
- Entrée Comptabilité dans les menus du secrétariat et des cogérants, sans ajout de cet accès dans les menus employés ou superviseuses.
- Prototype HTML autonome et mis en forme sur plusieurs lignes. Il contient les mêmes 41 vues et une simulation interactive en mémoire sous le compte rendu et les vues de suivi des véhicules.
- Référence JavaScript commentée en français : relevés, corrections, projection chronologique, stocks, écarts et politique d’autorisation à intégrer côté serveur.
- Vérifications locales : 38 contrôles métier réussis. Ce sont des tests de la référence, pas des tests d’un serveur déployé.

## Parcours de démonstration

1. Ouvrir `Edysol_Maquette.html` dans un navigateur, puis Compte rendu dans le menu Employés.
2. Sous la vue dessinée, utiliser le formulaire de démonstration. L’identité Agent A est fictive ; le compte rendu proposé est CR-DÉMO-043.
3. Choisir Aucun véhicule, ou un véhicule fictif avec un compteur numérique et une date/heure réelle (heure de Nouvelle-Calédonie).
4. Enregistrer dans la simulation, puis consulter Véhicules ou Historique des relevés côté secrétaire ou cogérant.
5. Le relevé y apparaît sans nouvelle saisie. Un relevé plus ancien ne remplace pas le dernier relevé daté ; les contradictions sont signalées.

Cette simulation ne communique avec aucun serveur. Elle conserve les données en mémoire jusqu’au rechargement. La navigation entre rôles sert à présenter les maquettes ; elle n’authentifie personne et ne sécurise pas de données réelles.

## Kilométrage : règles de traitement

- Associer chaque relevé au véhicule, à l’employé, au compte rendu et à la date réelle du relevé. Conserver séparément la date de saisie et l’auteur de l’opération.
- L’employé associé et les accès autorisés doivent provenir de la session et de la base serveur, non d’un identifiant libre fourni par le navigateur.
- Accepter un compteur numérique fini, positif ou nul ; exiger une date valide et un véhicule reconnu. Le serveur doit aussi vérifier que l’intervention et le compte rendu sont accessibles à l’employé.
- Trier les versions courantes selon la date réelle du relevé. Une saisie tardive est insérée à sa place chronologique, puis comparée au relevé précédent ET au suivant.
- Signaler les diminutions et les dates identiques avec compteurs contradictoires. Si les derniers relevés datés se contredisent, afficher une ambiguïté plutôt que choisir arbitrairement le plus grand compteur.
- Une alerte ne doit pas être cachée. La décision finale de blocage, de traitement ou de validation d’une anomalie reste à préciser ; le prototype signale sans inventer un circuit d’approbation.
- Utiliser une clé d’idempotence par commande et une origine logique unique compte rendu/véhicule. Une correction crée une révision avec auteur, horodatage et motif, sans écraser l’original ; vérifier la révision attendue pour éviter les corrections concurrentes.
- Si un relevé est retiré ou si le véhicule ou la date sont corrigés, conserver la trace et recalculer les projections des véhicules concernés à partir des versions effectives.

Le suivi ne somme jamais les compteurs des différents employés. Deux relevés égaux provenant de comptes rendus distincts peuvent être légitimes et restent traçables. Aucun total de kilomètres parcourus ni comptage de trajets n’est produit : ces relevés ne permettent pas de dédupliquer des trajets sans règle supplémentaire. Les règles de saisie pour un véhicule partagé restent à décider.

## Stocks et inventaire

Chaque article distingue consommable ou matériel durable, avec quantité et unité de référence. Les exemples utilisent des litres, pièces et unités. La référence technique propose trois décimales maximum pour certaines unités et des unités entières pour le matériel durable ; ces conventions devront être adaptées aux articles réels.

Les entrées, sorties et ajustements créent des mouvements datés, motivés et attribués à un auteur. Les unités incompatibles sont refusées ; aucune conversion implicite n’est faite. Une correction utilise un mouvement supplémentaire traçable, sans réécriture de l’historique. La référence signale un stock négatif ; sa gestion finale reste à définir.

Le matériel durable n’est pas assimilé à une consommation. Son déplacement ou son affectation peut nécessiter un suivi distinct à préciser ; aucune règle d’amortissement, de prêt ou de réforme n’est ajoutée comme décision validée.

Un inventaire physique conserve une situation théorique datée et les quantités comptées. Les écarts sont identifiés sans modifier automatiquement le stock. Un ajustement éventuel doit être motivé, autorisé et lié à l’inventaire. Le serveur devra figer la référence de comptage ou gérer explicitement les mouvements intervenus pendant l’inventaire.

## Autorisations côté serveur : constat et cible

L’archive accessible `Edisol_NC.zip` a été inspectée : 49 fichiers hors dépendances, un site HTML statique, la maquette et une démonstration Python d’extraction PDF. Aucun serveur applicatif, route métier d’authentification, modèle SQL ou middleware d’autorisation n’y a été trouvé. Aucun test HTTP d’accès protégé n’a donc pu être effectué, et aucun contrôle serveur existant n’est déclaré conforme.

Politique cible à intégrer et tester sur le futur backend :

| Action | Employé / superviseuse | Secrétaire / cogérant |
|---|---|---|
| Lire ou saisir son compte rendu autorisé | Vérification de session, propriétaire et intervention affectée | Périmètre de gestion à confirmer |
| Choisir un véhicule pour son compte rendu | Liste minimale d’identification, sans historique comptable | Liste selon accès Comptabilité |
| Consulter Comptabilité, stocks, inventaires et historique véhicules | Refusé | Accès prévu |
| Modifier les stocks ou valider un inventaire | Refusé par défaut | Droits encore à définir ; refus par défaut sans permission explicite |
| Corriger un relevé kilométrique | Droit de correction à définir ; aucun accès comptable implicite | Droits encore à définir ; correction auditée |

Ne pas déduire un rôle comptable de la capacité de supervision. Protéger les routes ET les objets retournés : un accès au compte rendu ne doit jamais inclure l’historique complet du véhicule, des stocks, ni les relevés d’autres employés.

La référence `autoriserComptabilite` modélise cette séparation. Elle doit être appelée au serveur, après authentification, avec des droits issus d’une source fiable. Son exécution dans un navigateur ne constitue pas une sécurité. Les permissions d’écriture ne sont attribuées à aucun rôle par cette livraison.

## Décisions encore nécessaires

- Fonctions comptables précises ; droits de modification de chaque rôle et possibilité de corriger ses propres comptes rendus.
- Qui effectue un relevé lorsque plusieurs employés partagent un véhicule, à quel moment, et avec quelle précision ? Comment gérer deux valeurs simultanées contradictoires ?
- Qui traite les alertes, autorise les corrections et examine les éventuelles remises à zéro ou changements de compteur ?
- Lieux de stockage, personnes autorisées à modifier les stocks, éventuelle déclaration des consommations par les employés.
- Unités, précision, conversions éventuelles, gestion des stocks négatifs et procédure de validation des ajustements d’inventaire.
- Les questions précédentes d’absence dans un binôme fixe, de choix des renforts et de validation des réaffectations restent ouvertes.

## Limites de la livraison

Le backend métier, la base SQL déployée et les automatisations de production ne sont pas présents dans les sources accessibles examinées. Ils n’ont pas été inventés ni prétendus modifiés. Le modèle de données et l’API ci-joints sont des propositions de contrats à intégrer lorsque ces sources seront disponibles. La démonstration PDF et le site vitrine de l’archive d’origine n’ont pas été modifiés.
