# Intitulé officiel du rôle : contrôleuse

Correction explicite de l’utilisateur le 28 octobre 2026 dans la conversation de suivi du projet. L’ancien intitulé féminin est remplacé par « contrôleuse » au singulier et « contrôleuses » au pluriel. Les responsabilités, les autorisations et les règles encore ouvertes ne changent pas. Le terme « superviseur » désignant l’assistant de suivi n’est pas concerné.

## Périmètre corrigé

README, documentation métier, tableau de décisions, inventaire JSON, groupes de navigation, deux copies HTML, quatre écrans SVG concernés et planche SVG d’ensemble. Le lien d’entrée métier affiche désormais « Ouvrir l’espace contrôleuses ». Les descriptions des prestations et de la coordination restent identiques.

Le diagramme cible est disponible dans [DIAGRAMME_FLUX_EDYSOL.md](DIAGRAMME_FLUX_EDYSOL.md), avec le nouvel intitulé. Les images PNG historiques (dont `mermaid-diagram.png` et l’aperçu des couleurs), les PDF et la vidéo restent inchangés ; ils peuvent encore contenir l’ancien libellé. Aucune source éditable du diagramme PNG n’était fournie : le nouveau diagramme Mermaid en reprend le parcours cible, sans remplacer les pixels du PNG. Le fichier Figma en ligne, les autres conversations, les messages déjà envoyés et les services distants ne sont pas modifiés.

## Dépendances techniques et conservation des accès

- Les identifiants `su-accueil` et `su-chantier`, leurs fragments d’URL, leurs liens et les noms de fichiers SVG sont conservés pour préserver les favoris et les dépendances de navigation. Ce sont des identifiants historiques, pas des intitulés à afficher.
- Les groupes et textes visibles sont renommés dans l’inventaire et les interfaces.
- L’identifiant `controleuse` est utilisé dans les tests de référence. Un contrôle conserve volontairement l’ancien identifiant `superviseuse` pour vérifier qu’il n’obtient aucun accès comptable. Cette occurrence historique ne doit pas être interprétée comme un intitulé actif ni effacée par remplacement global.
- La fonction `autoriserComptabilite`, sa liste de rôles autorisés, les permissions et les algorithmes restent strictement inchangés. Les tests ne constituent pas des autorisations serveur.
- Aucun backend, compte, schéma SQL, route ou stockage métier n’est présent dans le commit examiné. Aucune migration de données n’est donc nécessaire dans ce périmètre et aucune migration fictive n’est fournie. Si une base ou un service existe ailleurs, examiner ses rôles, sessions, clés étrangères, permissions et consommateurs avant migration ; cette correction locale ne l’actualise pas.
- Aucun contrôleur MVC n’est renommé. Aucun rôle de contrôleuse ne reçoit de droit supplémentaire ; les permissions ouvertes restent à décider.

## Vérifications de cette correction

La suite comporte désormais 39 contrôles réussis : le contrôle du nouvel identifiant et le contrôle de compatibilité de l’ancien préservent la politique comptable existante. La syntaxe des scripts intégrés aux deux HTML et du fichier de test est vérifiée. Les 41 identifiants, liens de navigation et noms de SVG sont conservés ; les SVG modifiés et la planche restent des XML valides. Les liens locaux des documents livrés et l’application des patchs ont été contrôlés.

Les copies HTML n’ont pas été uniformisées au-delà des occurrences concernées : leurs différences antérieures sont conservées. Aucun test de rendu visuel, de serveur ou d’envoi de notification n’a été effectué. Le changement de texte peut demander une revue visuelle des exports. Aucun push n’a été effectué.
