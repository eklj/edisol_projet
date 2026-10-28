# Flux cible ÉDYSOL — intitulé contrôleuses

Version du 28 octobre 2026. Ce diagramme reprend le parcours proposé dans l’image historique `mermaid-diagram.png` avec le nouvel intitulé. C’est un support de conception, pas la preuve d’une implémentation. La disposition est propre à Mermaid ; l’image PNG historique reste inchangée.

```mermaid
flowchart TD
  Client["Client : consulter les prestations"] --> Formulaire["Saisir une commande"]
  Secretaire["Secrétaire"] --> Formulaire
  Formulaire --> Enregistrer["Enregistrer la commande"]
  Enregistrer --> Base["Base commune"]
  Enregistrer --> Notifier["Notifier secrétaire et deux cogérants"]
  Enregistrer --> PDF["Générer le PDF"]
  Enregistrer --> Planning["Préparer la planification"]
  Base --> Consultation["Consulter commandes et planning"]
  Notifier --> Secretaire
  Notifier --> Cogerants["Deux cogérants"]
  PDF --> Cogerants
  Planning --> Organisation["Tenir compte de l’organisation existante"]
  Organisation --> Binomes["Quatre binômes fixes"]
  Organisation --> Solos["Employés en solo"]
  Binomes --> Affectation["Affectation au chantier"]
  Solos --> Affectation
  Affectation --> Renfort{"Renfort nécessaire ?"}
  Renfort -->|Oui| Decision["Sélection et validation à préciser"]
  Secretaire -->|Directives| Controleuses["Deux contrôleuses : encadrement et coordination"]
  Cogerants -->|Directives| Controleuses
  Secretaire -->|Directives| Menage["Contrôleuses : prestations selon affectation et disponibilité"]
  Cogerants -->|Directives| Menage
  Affectation --> Missions["Consulter les interventions affectées"]
  Missions --> Consignes["Consulter lieu, horaires et consignes"]
  Consignes --> Prestation["Réaliser la prestation"]
  Controleuses -.->|Coordination terrain| Prestation
  Menage --> Prestation
  Prestation --> Fin["Signaler la fin d’intervention"]
  Fin -->|Actualiser le statut| Consultation
```

La responsabilité de coordination ne prouve pas la disponibilité pour une prestation. Absence, binôme incomplet, sélection des renforts et approbation des réaffectations restent à définir ; aucun remplacement automatique ni passage automatique en solo n’est décidé. Les accès précis et les effets de validation d’une commande restent ceux à décider dans [le tableau de référence](DECISIONS_PREMIER_PARCOURS.md).

Ce diagramme ne complète pas silencieusement le schéma historique : les contrôles serveur, le PDF et les notifications du premier parcours devront être détaillés après les décisions indispensables. Le PDF et les notifications utiliseront les données enregistrées ; la validation technique ne vaut pas acceptation métier. Aucun message réel sans autorisation explicite.
