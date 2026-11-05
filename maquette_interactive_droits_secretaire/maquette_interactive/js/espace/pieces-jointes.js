/* =========================================================================
   ÉDYSOL NC — Consultation interne des photos et documents du chantier
   Utilisé par :
   - le détail de commande (direction/cogérants et secrétaire) ;
   - le détail d'une mission affectée (employé ou contrôleuse) ;
   - la coordination d'un chantier (contrôleuse chargée de la coordination).
   Chaque fichier est demandé à Edysol.api.ouvrirPieceJointe, qui contrôle
   le droit À CHAQUE ouverture (et refuse un fichier d'une autre commande).
   Miniatures, agrandissement des photos (fenêtre <dialog>) et ouverture
   des PDF dans un nouvel onglet. Adresses « blob: » libérées en quittant
   l'écran. Démonstration : les fichiers viennent de la copie locale de CE
   navigateur ; ils ne sont pas transmis aux téléphones des employés.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const P = racine.EdysolPiecesJointes;
  const { esc, icone, ui } = E;

  /** Acteur de la consultation (rôle et identité de la personne choisie dans la démo). */
  const acteurDe = ctx => ({ role: ctx.personne.role, personneId: ctx.personne.id });

  /**
   * HTML du bloc « Photos et documents du chantier » d'une commande.
   * Paramètres : commande, contexte de vue, options { compact } (mission sur téléphone).
   * Sans droit : seul un refus est affiché, sans les noms de fichiers.
   */
  function bloc(commande, ctx, { compact = false } = {}) {
    const r = E.api.piecesJointesDe(commande.id, acteurDe(ctx));
    const titre = `${icone('trombone')}Photos et documents du chantier`;
    let corps;
    if (!r.autorise) {
      corps = ui.notice(`Accès refusé : ${esc(r.motif)} (En production, le serveur devra refuser cet accès.)`, 'alerte', 'bouclier');
    } else if (!r.liste.length) {
      corps = '<p class="vide">Aucune photo ni document joint par le client.</p>';
    } else {
      const photos = r.liste.filter(p => P.FORMATS[p.type]?.categorie === 'photo');
      const docs = r.liste.filter(p => P.FORMATS[p.type]?.categorie === 'document');
      corps = `
        <p class="pj-interne__resume">${photos.length} photo${photos.length > 1 ? 's' : ''} · ${docs.length} document${docs.length > 1 ? 's' : ''} PDF · joints par le client à la demande.</p>
        ${photos.length ? `<ul class="pj-galerie" aria-label="Photos du chantier">${photos.map((p, i) => `
          <li><button type="button" class="pj-vignette" data-pj-photo="${esc(p.id)}" data-index="${i}" aria-label="Agrandir la photo ${esc(p.nom)}" disabled>
            <span class="pj-vignette__image"><img data-pj-img="${esc(p.id)}" alt="" hidden><span class="pj-vignette__attente">Chargement…</span></span>
            <span class="pj-vignette__nom">${esc(p.nom)}</span></button></li>`).join('')}</ul>` : ''}
        ${docs.length ? `<ul class="pj-documents" aria-label="Documents du chantier">${docs.map(p => `
          <li><a class="pj-document" data-pj-pdf="${esc(p.id)}" target="_blank" rel="noopener" aria-disabled="true">
            ${icone('documents')}<span class="pj-document__texte"><strong>${esc(p.nom)}</strong><small>PDF · ${esc(P.formaterTaille(p.taille))}</small></span>
            <span class="pj-document__action">Ouvrir</span></a></li>`).join('')}</ul>` : ''}`;
    }
    const note = `<p class="aide-bloc pj-interne__demo"><strong>Démonstration :</strong> fichiers lus dans la copie locale de ce navigateur. Ils ne sont pas transmis aux employés ni synchronisés entre appareils. Durée de conservation et droits de suppression : à définir.</p>`;
    return compact
      ? `<section class="consigne pj-interne" data-pj-commande="${esc(commande.id)}"><h2>${titre}</h2>${corps}${note}</section>`
      : `<section class="bloc pj-interne" data-pj-commande="${esc(commande.id)}"><h2 class="bloc__titre">${titre}</h2>${corps}${note}</section>`;
  }

  /**
   * Charge les fichiers du bloc (contrôle du droit à chaque fichier) et branche les interactions.
   * Retour : fonction de libération à appeler en quittant l'écran.
   */
  function activer(vue, ctx) {
    const zone = vue.querySelector('[data-pj-commande]');
    if (!zone) return () => {};
    const commandeId = zone.dataset.pjCommande;
    const adresses = [];       // adresses blob: à libérer
    const photos = [];         // { src, nom } pour l'agrandissement
    let dialogue = null, index = 0, origine = null, libere = false;

    /** Affiche un fichier indisponible ou refusé à la place de son aperçu. */
    const indisponible = (el, motif) => {
      el.classList.add('est-indisponible');
      el.querySelector('.pj-vignette__attente, .pj-document__action').textContent = 'Indisponible';
      el.title = motif;
      el.insertAdjacentHTML('beforeend', `<small class="pj-motif">${esc(motif)}</small>`);
    };

    zone.querySelectorAll('[data-pj-photo]').forEach(async bouton => {
      const id = bouton.dataset.pjPhoto;
      const r = await E.api.ouvrirPieceJointe(commandeId, id, acteurDe(ctx));
      if (libere) return;
      if (!r.ok) { indisponible(bouton, r.motif); return; }
      const url = URL.createObjectURL(r.blob);
      adresses.push(url);
      const img = bouton.querySelector('img');
      img.src = url; img.hidden = false;
      bouton.querySelector('.pj-vignette__attente').remove();
      photos[Number(bouton.dataset.index)] = { src: url, nom: bouton.querySelector('.pj-vignette__nom').textContent };
      bouton.disabled = false;
    });
    zone.querySelectorAll('[data-pj-pdf]').forEach(async lien => {
      const r = await E.api.ouvrirPieceJointe(commandeId, lien.dataset.pjPdf, acteurDe(ctx));
      if (libere) return;
      if (!r.ok) { indisponible(lien, r.motif); return; }
      // Le type est forcé à PDF : le navigateur l'affiche avec sa visionneuse intégrée.
      const url = URL.createObjectURL(new Blob([r.blob], { type: 'application/pdf' }));
      adresses.push(url);
      lien.href = url;
      lien.removeAttribute('aria-disabled');
    });

    /** Fenêtre d'agrandissement : Échap ferme, flèches pour naviguer, le focus revient à la vignette. */
    function construire() {
      dialogue = document.createElement('dialog');
      dialogue.className = 'pj-visionneuse';
      dialogue.setAttribute('aria-labelledby', 'pj-visionneuse-titre');
      dialogue.innerHTML = `
        <div class="pj-visionneuse__haut"><p id="pj-visionneuse-titre" class="pj-visionneuse__titre"></p>
          <button type="button" class="bouton-icone pj-visionneuse__fermer" aria-label="Fermer">${icone('fermer')}</button></div>
        <img class="pj-visionneuse__image" alt="">
        <div class="pj-visionneuse__nav"><button type="button" class="bouton bouton--clair bouton--petit" data-sens="-1">${icone('gauche')}Précédente</button>
          <span class="pj-visionneuse__compteur" aria-live="polite"></span>
          <button type="button" class="bouton bouton--clair bouton--petit" data-sens="1">Suivante${icone('droite')}</button></div>`;
      document.body.append(dialogue);
      dialogue.querySelector('.pj-visionneuse__fermer').addEventListener('click', () => dialogue.close());
      dialogue.querySelectorAll('[data-sens]').forEach(b => b.addEventListener('click', () => montrer(index, Number(b.dataset.sens))));
      dialogue.addEventListener('click', e => { if (e.target === dialogue) dialogue.close(); });
      dialogue.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') montrer(index, -1);
        if (e.key === 'ArrowRight') montrer(index, 1);
      });
      dialogue.addEventListener('close', () => { if (origine && document.contains(origine)) origine.focus(); });
    }
    /** Montre une photo : cible = indice de départ, decalage = -1 ou +1 pour naviguer (photos chargées seulement). */
    function montrer(cible, decalage = 0) {
      const dispo = photos.map((p, k) => (p ? k : -1)).filter(k => k >= 0);
      if (!dispo.length) return;
      let pos = Math.max(0, dispo.indexOf(cible));
      pos = (pos + decalage + dispo.length) % dispo.length;
      index = dispo[pos];
      const p = photos[index];
      const img = dialogue.querySelector('.pj-visionneuse__image');
      img.src = p.src; img.alt = `Photo du chantier : ${p.nom}`;
      dialogue.querySelector('.pj-visionneuse__titre').textContent = p.nom;
      dialogue.querySelector('.pj-visionneuse__compteur').textContent = `Photo ${pos + 1} sur ${dispo.length}`;
      dialogue.querySelector('.pj-visionneuse__nav').hidden = dispo.length < 2;
    }
    zone.addEventListener('click', e => {
      const b = e.target.closest('[data-pj-photo]');
      if (b && !b.disabled) {
        if (!dialogue) construire();
        origine = b; index = Number(b.dataset.index);
        montrer(index);
        dialogue.showModal();
        dialogue.querySelector('.pj-visionneuse__fermer').focus();
      }
      // Un PDF pas encore chargé (ou indisponible) ne doit pas ouvrir une page vide.
      const lien = e.target.closest('[data-pj-pdf]');
      if (lien && !lien.getAttribute('href')) e.preventDefault();
    });

    return () => {
      libere = true;
      adresses.forEach(u => URL.revokeObjectURL(u));
      if (dialogue) { if (dialogue.open) dialogue.close(); dialogue.remove(); }
    };
  }

  E.piecesJointesInternes = { bloc, activer };
})(window);
