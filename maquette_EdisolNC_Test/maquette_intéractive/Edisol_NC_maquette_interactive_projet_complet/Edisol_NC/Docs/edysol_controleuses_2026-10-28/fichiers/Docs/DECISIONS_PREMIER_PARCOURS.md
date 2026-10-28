# Décisions du premier parcours ÉDYSOL

Référence du 28 octobre 2026. Ce document sera complété après chaque réponse explicite de l’utilisateur. Un affichage dans la maquette, une proposition technique ou un test local ne valide pas une règle métier.

## Décisions confirmées

| Sujet | Décision | Source |
| --- | --- | --- |
| Saisie | Client et secrétaire peuvent saisir une commande | Message utilisateur de cadrage du 28/10/2026 dans la conversation de supervision |
| Intitulé du rôle | Contrôleuse / contrôleuses ; responsabilités et autorisations inchangées | Correction officielle explicite de l’utilisateur, 28/10/2026 |
| Organisation | Deux contrôleuses également employées de ménage, sous la secrétaire et les cogérants ; quatre binômes fixes ; autres employés solos | Organisation confirmée et réaffirmée dans le message utilisateur du 28/10/2026 |
| Exceptions | Aucun remplacement automatique ni passage automatique en solo décidé | Même message ; règles d’absence et de renfort encore ouvertes |
| Parcours cible | Saisie → validation technique serveur → base → consultation autorisée → génération PDF → notification | Même message ; non implémenté |
| Données communes | PDF et notifications réutilisent les données enregistrées | Même message |
| Envois réels | Aucun message réel sans autorisation explicite ; distinguer simulation et envoi réel | Même message |
| Code | Commentaires français et documentation à jour | Même message et règles du README |

## Décisions en attente

| Sujet | Statut | Limite actuelle |
| --- | --- | --- |
| Consultation des commandes | À décider | Rôles, périmètres et données visibles à préciser ; détails d’intervention à distinguer du dossier administratif |
| Modification | À décider | Qui modifie, à quels états, avec quel historique et quelle nouvelle validation |
| Validation métier | À décider | Responsable de l’acceptation ou du refus de la commande |
| Date demandée | À décider | Préférence ou réservation ; la maquette illustre actuellement un souhait |
| Créneau définitif | À décider | Responsable de confirmation et information du client |
| Modification, refus, annulation | À décider | États, acteurs, motifs et notifications |
| Affectation et exceptions | À décider | Décideurs, absences, binôme incomplet et renforts |
| Affectation manuelle pour première livraison | Option à discuter | Aucune acceptation enregistrée ; objectif d’automatisation conservé |
| Architecture | À recommander puis décider | Aucun backend/base/authentification retenu par cette mise à jour |

## Validation technique et validation métier

La validation technique contrôle les champs, formats, cohérences et droits côté serveur. Elle n’accepte pas à elle seule la commande et ne réserve aucun créneau. La validation métier désigne l’acceptation de la demande selon les capacités et décisions de l’entreprise ; ses acteurs et effets restent à définir.

Les prochaines questions sont posées une à une. Les options proposées restent en attente jusqu’à réponse explicite. Aucun choix d’accès, statut métier, remplacement ou technologie n’est ajouté silencieusement.
