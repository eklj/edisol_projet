# Édysol — correction de l’organisation des équipes

État de référence : 27 octobre 2026. Cette correction remplace les hypothèses d’organisation proposées auparavant dans cette conversation.

## Décisions validées par l’utilisateur

- Deux superviseuses encadrent l’ensemble des équipes sous les ordres de la secrétaire et des cogérants.
- Ce sont également des employées de ménage : elles peuvent effectuer les prestations auxquelles elles sont affectées.
- Sur les gros chantiers nécessitant du renfort, elles assurent la coordination des équipes.
- L’entreprise dispose de quatre binômes fixes. Les autres employés travaillent seuls sur leurs chantiers.
- Une responsabilité de coordination ne prouve pas la disponibilité de la superviseuse pour effectuer du ménage. Son planning et ses affectations restent à consulter.

## Changements réalisés ici

- Planning : le choix de deux personnes indépendantes est remplacé, dans la maquette, par le type d’équipe et l’équipe affectée. Les exemples affichent un binôme fixe ou un employé solo.
- Équipe : quatre lignes représentent les quatre binômes fixes, puis les employés solos et les deux superviseuses. Les compositions inconnues restent « à renseigner » ; les noms A/B/C sont fictifs.
- Validation : le bouton de confirmation définitive est remplacé par une consultation de mission de démonstration. Le responsable et la procédure de validation restent à définir.
- Employés : les vues de mission précisent l’organisation fixe ou solo, avec un environnement commun.
- Superviseuses : ajout de « Mes activités » et « Coordination chantier », avec séparation entre prestations et coordination, et indication des règles en attente.
- Ajout d’un exemple d’intervention solo. Total : 29 vues dans le prototype.
- Les anciens exemples de changement de partenaire ont été corrigés. Aucun mécanisme de recomposition ou de bascule individuelle automatique n’est ajouté.
- Le fichier HTML reste mis en forme sur plusieurs lignes. Il s’agit d’un prototype visuel, sans moteur d’affectation ni traitement effectif des formulaires.

## Questions restant à trancher

1. Quelle procédure suivre lorsqu’un membre d’un binôme fixe est absent ?
2. Qui sélectionne les renforts et selon quels critères ?
3. Qui valide les modifications d’affectation, et à quel moment ?
4. Quel est le rattachement habituel des deux superviseuses aux binômes ou aux chantiers solos ? Cette appartenance n’a pas été précisée.
5. Comment saisir leur planning de ménage et leur charge de coordination afin d’évaluer leur disponibilité réelle ?
6. Quels droits de consultation, de proposition et de modification accorder à chaque rôle ? Leur position hiérarchique ne détermine pas automatiquement les permissions du logiciel.

Aucune réponse à ces questions n’est considérée comme une décision validée. Le signalement d’un besoin de renfort dans la maquette ne vaut ni sélection ni affectation automatique.

## Préparation du futur modèle de données — proposition, non implémentée

Distinguer : salarié ; capacité de supervision ; équipe fixe ; appartenance à cette équipe ; intervention ; affectation de ménage ; mission de coordination ; planning et indisponibilités. Une même personne peut avoir une activité de ménage et une responsabilité de coordination, à des moments à vérifier.

Les quatre binômes doivent être représentés comme des équipes stables, et non recalculés lors de chaque commande. Les autres employés peuvent être affectés en solo. Le rattachement des superviseuses à ces organisations reste à renseigner. Les règles de remplacement et d’approbation ne doivent pas être codées avant décision.

Aucun schéma SQL, backend métier ou workflow d’automatisation de production n’a été livré dans cette conversation. Ils n’ont donc pas été modifiés. Les projets ou livrables évoqués dans d’autres conversations ne sont pas couverts par cette mise à jour.

## Vérification

Syntaxe JavaScript du prototype, liens entre vues et retrait des formulations obsolètes contrôlés. Dans Figma, les deux pages existantes sont mises à jour ; la page choisie par l’utilisateur (« Maquette du site ») conserve sa disposition et ses couleurs.
