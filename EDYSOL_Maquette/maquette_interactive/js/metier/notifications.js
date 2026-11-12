/* =========================================================================
   ÉDYSOL NC — Règles de la boîte de réception (fonctions pures)
   Ces fonctions ne touchent ni au stockage ni à l'affichage : elles sont
   testées avec Node (outils/tester_notifications.js) et réutilisables
   côté serveur. Modèle d'une notification :
     { id, pour: ['personne:COG1', ...], titre, texte, lien,
       recueLe: date ISO de réception,
       lectures: { 'personne:COG1': date ISO de lecture } }
   Règles :
   - le statut lu / non lu est PROPRE à chaque destinataire ;
   - non lues d'abord, de la plus ANCIENNE à la plus récente ;
   - puis les lues (historique). Ordre provisoire, non décidé par
     l'entreprise : de la plus récente à la plus ancienne réception,
     comme dans la version précédente de la maquette ;
   - l'ordre ne dépend jamais de la position dans le tableau ;
   - une lecture n'est enregistrée qu'après ouverture RÉUSSIE du contenu
     ou du détail associé, par un destinataire réel de la notification.
   Non décidé (donc non programmé) : durée de conservation, archivage,
   suppression, consultation des lectures d'autrui, rappels, remise en non lu.
   ========================================================================= */
(function (racine) {
  'use strict';

  /** Indique si la notification est adressée à ce destinataire. */
  function estDestinataire(n, destinataire) {
    return Array.isArray(n.pour) && n.pour.includes(destinataire);
  }

  /** Indique si ce destinataire a lu la notification (sa lecture à lui seul). */
  function estLue(n, destinataire) {
    return Boolean(n.lectures && n.lectures[destinataire]);
  }

  /** Date de lecture pour ce destinataire, ou null. */
  function luLe(n, destinataire) {
    return (n.lectures && n.lectures[destinataire]) || null;
  }

  /**
   * Compare deux dates de réception, puis les identifiants pour départager
   * deux notifications reçues au même instant (ordre stable et prévisible).
   */
  function comparerReception(a, b) {
    const ecart = Date.parse(a.recueLe) - Date.parse(b.recueLe);
    if (ecart) return ecart;
    return String(a.id).localeCompare(String(b.id), 'fr', { numeric: true });
  }

  /**
   * Construit la boîte de réception d'un destinataire.
   * Paramètres : toutes les notifications, destinataire (ex. 'personne:COG1').
   * Retour : { nonLues, lues } déjà triées selon les règles ci-dessus.
   */
  function boiteDe(notifications, destinataire) {
    const miennes = notifications.filter(n => estDestinataire(n, destinataire));
    const nonLues = miennes.filter(n => !estLue(n, destinataire)).sort(comparerReception);
    const lues = miennes.filter(n => estLue(n, destinataire)).sort((a, b) => comparerReception(b, a));
    return { nonLues, lues };
  }

  /** Nombre de notifications non lues pour un destinataire (compteurs de l'interface). */
  function compterNonLues(notifications, destinataire) {
    return notifications.filter(n => estDestinataire(n, destinataire) && !estLue(n, destinataire)).length;
  }

  /**
   * Décide si une lecture peut être enregistrée.
   * Paramètres :
   *  - n : la notification (ou undefined si introuvable) ;
   *  - destinataire : personne qui consulte (en production : issue de la session serveur) ;
   *  - ouverture : { type: 'message' | 'detail', chemin, contenuCharge } décrivant ce qui a été affiché.
   * Retour : { ok, motif }. Un clic seul, une erreur ou un accès refusé ne suffisent jamais.
   */
  function lecturePossible(n, destinataire, ouverture) {
    if (!n) return { ok: false, motif: 'Notification introuvable.' };
    if (!estDestinataire(n, destinataire)) return { ok: false, motif: 'Cette notification n’est pas adressée à cette personne.' };
    if (!ouverture || ouverture.contenuCharge !== true) return { ok: false, motif: 'Contenu non affiché : aucune lecture enregistrée.' };
    if (ouverture.type === 'detail' && (!n.lien || ouverture.chemin !== n.lien)) return { ok: false, motif: 'Le détail ouvert ne correspond pas à la notification.' };
    if (ouverture.type !== 'detail' && ouverture.type !== 'message') return { ok: false, motif: 'Type d’ouverture inconnu.' };
    return { ok: true, motif: '' };
  }

  /**
   * Enregistre la lecture d'UN destinataire, sans toucher aux autres.
   * Retour : nouvelle notification (l'original n'est pas modifié). Une première
   * lecture n'est jamais écrasée : relire ne change pas la date de lecture.
   */
  function avecLecture(n, destinataire, dateIso) {
    if (estLue(n, destinataire)) return n;
    return { ...n, lectures: { ...(n.lectures || {}), [destinataire]: dateIso } };
  }

  const api = { estDestinataire, estLue, luLe, comparerReception, boiteDe, compterNonLues, lecturePossible, avecLecture };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.EdysolNotifications = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
