/* =========================================================================
   ÉDYSOL NC — Boîte de réception et ouverture d'un message (tous les espaces)
   Règles (voir js/metier/notifications.js) :
   - une boîte PAR PERSONNE ; lu / non lu est propre à chaque destinataire ;
   - non lues d'abord, de la plus ancienne à la plus récente ;
   - lues ensuite, dans l'historique (ordre provisoire : réception la plus récente d'abord) ;
   - afficher la liste, défiler ou compter ne marque RIEN comme lu ;
   - une notification devient lue seulement quand son message (vue « notification »)
     ou son détail (commande, intervention…) s'est affiché correctement : c'est le
     routeur (app.js) qui enregistre la lecture, après l'affichage ;
   - lire n'est jamais traiter, accepter, refuser, planifier ou valider une demande.
   Il n'existe volontairement aucun bouton « Marquer comme lue » ni « Tout marquer comme lu ».
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const N = racine.EdysolNotifications;
  const vues = E.vues = E.vues || {};

  /** Nom lisible de la personne courante (pour les titres). */
  const nomCourant = ctx => ctx.personne ? ctx.personne.nom : 'cette personne';

  /** Retourne la commande liée à une notification (« commande/EDY-… »), ou null. */
  function commandeLiee(n) {
    if (!n.lien || !n.lien.startsWith('commande/')) return null;
    return E.api.charger().commandes.find(c => c.id === n.lien.slice('commande/'.length)) || null;
  }

  /** Indique si le détail associé correspond à une vue existante de la maquette. */
  const detailDisponible = n => Boolean(n.lien) && Boolean(vues[n.lien.split('/')[0]]);

  /**
   * Étiquette de lecture, TOUJOURS écrite en toutes lettres (pas seulement une couleur).
   * Elle est distincte de l'état métier de la commande.
   */
  function etiquetteLecture(n, dest) {
    const date = N.luLe(n, dest);
    return date
      ? `<span class="etiquette-lecture etiquette-lecture--lue">${icone('valide')}Lue le ${esc(E.formaterHorodatage(date))}</span>`
      : `<span class="etiquette-lecture etiquette-lecture--non-lue">${icone('cloche')}Non lue</span>`;
  }

  /** État métier de la commande liée, présenté à part de la lecture. */
  function etatMetier(n) {
    const c = commandeLiee(n);
    return c ? `<span class="notification__metier">Commande ${esc(c.id)} : ${ui.badgeStatut(c.statut)}</span>` : '';
  }

  /** Lien d'ouverture : le détail associé (avec « ?lecture ») ou, à défaut, le message seul. */
  function lienOuverture(n, ctx) {
    return detailDisponible(n) ? ctx.lien(`${n.lien}?lecture=${encodeURIComponent(n.id)}`) : ctx.lien('notification/' + encodeURIComponent(n.id));
  }

  /** Une ligne de la boîte de réception. */
  function ligne(n, ctx) {
    const lue = N.estLue(n, ctx.destinataire);
    const action = detailDisponible(n) ? 'Ouvrir le détail' : 'Lire le message';
    return `
      <li class="notification${lue ? ' est-lue' : ' est-non-lue'}" data-id="${esc(n.id)}">
        <span class="notification__point" aria-hidden="true"></span>
        <div class="notification__corps">
          <p class="notification__statut">${etiquetteLecture(n, ctx.destinataire)}</p>
          <h3 class="notification__titre">${esc(n.titre)}</h3>
          <p class="notification__texte">${esc(n.texte)}</p>
          <p class="notification__meta"><span>Reçue le ${ui.temps(n.recueLe)}</span>${etatMetier(n)}</p>
        </div>
        <div class="notification__actions">
          <a class="bouton ${lue ? 'bouton--clair' : 'bouton--bleu'} bouton--petit" href="${esc(lienOuverture(n, ctx))}">${esc(action)}<span class="visuellement-cache"> : ${esc(n.titre)}</span></a>
        </div>
      </li>`;
  }

  /** Liste ou message « vide » d'une section. */
  const listeHtml = (liste, id, ctx, vide) => liste.length
    ? `<ul class="notifications" id="${id}">${liste.map(n => ligne(n, ctx)).join('')}</ul>`
    : `<ul class="notifications" id="${id}"></ul><p class="vide" data-vide="${id}">${esc(vide)}</p>`;

  /* ---------- Boîte de réception ---------- */
  vues.notifications = ctx => {
    const { nonLues, lues } = E.api.boite(ctx.destinataire); // lecture seule : aucun statut modifié
    return {
      titre: 'Notifications',
      html: `
        ${ui.entetePage({ titre: 'Notifications', sousTitre: `Boîte de réception de ${esc(nomCourant(ctx))}. Les messages lus restent dans l’historique.` })}
        ${ui.notice('<strong>Simulation locale.</strong> Notifications et lectures sont enregistrées dans <strong>ce navigateur</strong> uniquement. Elles ne suivent pas la personne sur un autre appareil. Aucun e-mail, SMS, WhatsApp ou notification push n’est envoyé : leur articulation avec cette boîte reste à définir.', 'demo')}
        <p class="visuellement-cache" aria-live="polite" id="annonce-boite"></p>
        <section class="boite__section" aria-labelledby="titre-non-lues">
          <h2 id="titre-non-lues" class="boite__titre">Non lues <span class="boite__nombre" data-nombre="non-lues">(${nonLues.length})</span></h2>
          <p class="aide-bloc boite__aide">De la plus ancienne à la plus récente. Une notification devient lue quand son message ou son détail s’ouvre correctement.</p>
          ${listeHtml(nonLues, 'liste-non-lues', ctx, 'Aucune notification non lue.')}
        </section>
        <section class="boite__section" aria-labelledby="titre-lues">
          <h2 id="titre-lues" class="boite__titre">Historique · lues <span class="boite__nombre" data-nombre="lues">(${lues.length})</span></h2>
          <p class="aide-bloc boite__aide">Ordre provisoire, à valider : réception la plus récente d’abord.</p>
          ${listeHtml(lues, 'liste-lues', ctx, 'Aucune notification lue pour le moment.')}
        </section>
        <div class="boite__outils">
          <button type="button" class="bouton bouton--discret bouton--petit" data-recevoir-demo>${icone('plus')}Recevoir une notification fictive (outil de démo)</button>
        </div>`,
      apres(vue) {
        vue.querySelector('[data-recevoir-demo]').addEventListener('click', () => E.api.recevoirNotificationDemo(ctx.destinataire));
      },

      /**
       * Nouvelles notifications reçues pendant l'affichage (bouton de démo ou autre onglet) :
       * insertion à leur place, APRÈS les non lues plus anciennes, sans réafficher la liste.
       * Le défilement est compensé pour que le contenu regardé ne « saute » pas.
       */
      surDonnees(vue) {
        const liste = vue.querySelector('#liste-non-lues');
        if (!liste) return;
        const { nonLues, lues } = E.api.boite(ctx.destinataire);
        const affichees = new Set([...vue.querySelectorAll('.notification')].map(li => li.dataset.id));
        const nouvelles = nonLues.filter(n => !affichees.has(n.id));
        if (!nouvelles.length) return;

        // Point de repère : premier élément dont le HAUT est visible à l'écran avant l'insertion.
        // (Un élément coupé en haut de l'écran peut être au-dessus du point d'insertion et ne pas bouger.)
        const repere = [...vue.querySelectorAll('.notification, .boite__titre, .boite__aide, .boite__outils')].find(el => el.getBoundingClientRect().top >= 0);
        const hautAvant = repere ? repere.getBoundingClientRect().top : 0;

        for (const n of nouvelles) {
          const gabarit = document.createElement('template');
          gabarit.innerHTML = ligne(n, ctx).trim();
          // Place : avant la première non lue reçue PLUS TARD ; sinon à la fin des non lues.
          const suivante = [...liste.children].find(li => {
            const autre = nonLues.find(x => x.id === li.dataset.id);
            return autre && N.comparerReception(n, autre) < 0;
          });
          liste.insertBefore(gabarit.content.firstElementChild, suivante || null);
        }
        vue.querySelector('[data-vide="liste-non-lues"]')?.remove();
        vue.querySelector('[data-nombre="non-lues"]').textContent = `(${liste.children.length})`;
        vue.querySelector('[data-nombre="lues"]').textContent = `(${lues.length})`;

        // Compensation du défilement (si le navigateur ne l'a pas déjà fait).
        if (repere) {
          const decalage = repere.getBoundingClientRect().top - hautAvant;
          if (decalage) racine.scrollBy(0, decalage);
        }
        vue.querySelector('#annonce-boite').textContent = nouvelles.length === 1
          ? `Nouvelle notification reçue : ${nouvelles[0].titre}. Elle est placée après les non lues plus anciennes.`
          : `${nouvelles.length} nouvelles notifications reçues, placées après les non lues plus anciennes.`;
      }
    };
  };

  /* ---------- Ouverture d'un message (notifications sans détail, ou lecture du texte) ---------- */
  vues.notification = ctx => {
    const n = E.api.charger().notifications.find(x => x.id === ctx.param);
    const retour = { href: ctx.lien('notifications'), texte: 'Notifications' };
    if (!n || !N.estDestinataire(n, ctx.destinataire)) {
      // Introuvable ou adressée à quelqu'un d'autre : rien n'est affiché, rien n'est lu.
      return {
        titre: 'Message indisponible', contenuCharge: false,
        html: ui.entetePage({ titre: 'Message indisponible', retour }) + ui.notice('Ce message n’existe pas ou n’est pas adressé à la personne choisie. Aucune lecture n’est enregistrée. (En production, le serveur devra refuser cet accès.)', 'alerte', 'bouclier')
      };
    }
    return {
      titre: n.titre,
      contenuCharge: true,       // le message est affiché : la lecture peut être enregistrée
      messageOuvert: n.id,       // le routeur enregistre la lecture APRÈS cet affichage
      html: `
        ${ui.entetePage({ titre: 'Message', retour })}
        <article class="message-notification bloc" aria-labelledby="titre-message">
          <p class="notification__statut" id="statut-lecture">${etiquetteLecture(n, ctx.destinataire)}</p>
          <h2 id="titre-message" class="message-notification__titre">${esc(n.titre)}</h2>
          <p class="message-notification__texte">${esc(n.texte)}</p>
          ${ui.definitions([
            ['Reçue le', esc(E.formaterHorodatage(n.recueLe))],
            ['Destinataire', esc(nomCourant(ctx))],
            ...(commandeLiee(n) ? [['État de la commande', `${ui.badgeStatut(commandeLiee(n).statut)} <small class="sous-ligne">Inchangé par la lecture.</small>`]] : [])
          ], true)}
          ${detailDisponible(n) ? `<p class="actions-bloc"><a class="bouton bouton--clair" href="${esc(ctx.lien(n.lien))}">${icone('documents')}Voir le détail associé</a></p>` : '<p class="aide-bloc">Aucun détail associé à ce message.</p>'}
        </article>
        ${ui.notice('Lire une notification signifie seulement qu’elle a été consultée. Elle ne traite, n’accepte, ne refuse, ne planifie ni ne valide aucune demande.', 'info')}`,
      /** Met à jour l'étiquette après l'enregistrement effectif de la lecture. */
      apresLecture(vue, resultat) {
        const zone = vue.querySelector('#statut-lecture');
        const maj = E.api.charger().notifications.find(x => x.id === n.id);
        if (zone && resultat.ok) zone.innerHTML = etiquetteLecture(maj, ctx.destinataire);
        else if (zone) zone.insertAdjacentHTML('beforeend', ` <span class="aide-bloc">${esc(resultat.motif)}</span>`);
      }
    };
  };
})(window);
