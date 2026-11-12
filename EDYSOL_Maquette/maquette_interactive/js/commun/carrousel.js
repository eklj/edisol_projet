/* =========================================================================
   ÉDYSOL NC — Carrousel accessible et léger
   Fonctions : précédent / suivant / pause-lecture, points de navigation,
   flèches du clavier, balayage tactile, défilement automatique discret.
   Le défilement automatique est coupé si l'utilisateur réduit les
   animations, survole ou parcourt le carrousel au clavier, si la page
   est masquée ou si le carrousel sort de l'écran.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};

  /**
   * Crée un carrousel dans un conteneur à partir d'une liste de visuels.
   * Paramètres :
   *  - conteneur : élément HTML vide qui recevra le carrousel ;
   *  - visuels : tableau issu de Edysol.visuelsDe() ;
   *  - options : { libelle, delai (ms), variante ('hero' | 'section'), prioritaire, tailles, surAgrandir(index) }.
   * Retour : objet { aller(index), arreter() } pour piloter le carrousel.
   */
  function creerCarrousel(conteneur, visuels, options = {}) {
    const { esc, icone } = Edysol;
    const o = Object.assign({ libelle: 'Visuels', delai: 7000, variante: 'section', prioritaire: false, tailles: '100vw', surAgrandir: null }, options);
    const total = visuels.length;
    if (!total) { conteneur.innerHTML = '<p class="carrousel__vide">Visuels à fournir.</p>'; return null; }

    const idBase = 'car-' + Math.random().toString(36).slice(2, 8);
    conteneur.classList.add('carrousel', 'carrousel--' + o.variante);
    conteneur.setAttribute('role', 'region');
    conteneur.setAttribute('aria-roledescription', 'carrousel');
    conteneur.setAttribute('aria-label', o.libelle);

    // Construction des diapositives : seule la première est chargée en priorité.
    conteneur.innerHTML = `
      <div class="carrousel__piste" id="${idBase}-piste" aria-live="off">
        ${visuels.map((v, i) => `
          <figure class="carrousel__diapo${i === 0 ? ' est-active' : ''}" role="group" aria-roledescription="diapositive"
                  aria-label="${i + 1} sur ${total} : ${esc(v.titre)}" ${i === 0 ? '' : 'aria-hidden="true"'} data-index="${i}">
            <div class="carrousel__media">
              ${Edysol.baliseImage(v, { prioritaire: o.prioritaire && i === 0, tailles: o.tailles })}
              <span class="pastille-provisoire carrousel__pastille">${esc(Edysol.libelleStatut(v))}</span>
            </div>
            <figcaption class="carrousel__legende"><strong>${esc(v.titre)}</strong><span>${esc(v.legende)}</span></figcaption>
          </figure>`).join('')}
      </div>
      ${total > 1 ? `
      <div class="carrousel__commandes">
        <button type="button" class="bouton-icone carrousel__prec" aria-controls="${idBase}-piste" aria-label="Visuel précédent">${icone('gauche')}</button>
        <button type="button" class="bouton-icone carrousel__pause" aria-controls="${idBase}-piste" aria-label="Mettre en pause le défilement">${icone('pause')}</button>
        <button type="button" class="bouton-icone carrousel__suiv" aria-controls="${idBase}-piste" aria-label="Visuel suivant">${icone('droite')}</button>
        <span class="carrousel__compteur" aria-hidden="true"><b>1</b> / ${total}</span>
        <div class="carrousel__points" role="group" aria-label="Choisir un visuel">
          ${visuels.map((v, i) => `<button type="button" class="carrousel__point" aria-label="Afficher le visuel ${i + 1} : ${esc(v.titre)}" ${i === 0 ? 'aria-current="true"' : ''} data-aller="${i}"></button>`).join('')}
        </div>
      </div>` : ''}
      ${o.surAgrandir ? `<button type="button" class="bouton carrousel__agrandir" aria-label="Agrandir le visuel affiché">${icone('agrandir')}<span>Agrandir</span></button>` : ''}`;

    const piste = conteneur.querySelector('.carrousel__piste');
    const diapos = [...conteneur.querySelectorAll('.carrousel__diapo')];
    const points = [...conteneur.querySelectorAll('.carrousel__point')];
    const boutonPause = conteneur.querySelector('.carrousel__pause');
    const compteur = conteneur.querySelector('.carrousel__compteur b');
    let index = 0;
    let minuterie = null;
    // État de lecture : coupé d'office si l'utilisateur réduit les animations ou économise les données.
    const economie = racine.navigator.connection && racine.navigator.connection.saveData;
    let lectureVoulue = total > 1 && !Edysol.mouvementsReduits() && !economie;
    let suspendu = false; // survol, focus, page masquée ou hors écran

    /** Affiche la diapositive demandée (boucle) et met à jour les commandes. */
    function aller(nouvelIndex, origine = 'auto') {
      index = (nouvelIndex + total) % total;
      diapos.forEach((d, i) => {
        const active = i === index;
        d.classList.toggle('est-active', active);
        d.toggleAttribute('aria-hidden', !active);
        // Les liens éventuels des diapositives masquées ne doivent pas recevoir le focus.
        d.querySelectorAll('a, button').forEach(el => { el.tabIndex = active ? 0 : -1; });
      });
      points.forEach((p, i) => p.toggleAttribute('aria-current', i === index));
      if (compteur) compteur.textContent = index + 1;
      // Préchargement de la diapositive suivante pour un enchaînement fluide.
      const suivante = diapos[(index + 1) % total]?.querySelector('img');
      if (suivante) suivante.loading = 'eager';
      // Une action manuelle est annoncée aux lecteurs d'écran, pas le défilement automatique.
      piste.setAttribute('aria-live', origine === 'manuel' ? 'polite' : 'off');
      if (origine === 'manuel') relancer();
    }

    /** Démarre ou arrête la minuterie selon l'état courant. */
    function relancer() {
      clearInterval(minuterie);
      minuterie = null;
      if (lectureVoulue && !suspendu && total > 1) minuterie = setInterval(() => aller(index + 1), o.delai);
    }

    /** Met à jour le bouton pause/lecture (libellé et icône). */
    function majBoutonPause() {
      if (!boutonPause) return;
      boutonPause.innerHTML = lectureVoulue ? icone('pause') : icone('lecture');
      boutonPause.setAttribute('aria-label', lectureVoulue ? 'Mettre en pause le défilement' : 'Lancer le défilement automatique');
      boutonPause.setAttribute('aria-pressed', String(!lectureVoulue));
      conteneur.classList.toggle('est-en-pause', !lectureVoulue);
    }

    conteneur.addEventListener('click', e => {
      const cible = e.target.closest('button');
      if (!cible) return;
      if (cible.classList.contains('carrousel__prec')) aller(index - 1, 'manuel');
      else if (cible.classList.contains('carrousel__suiv')) aller(index + 1, 'manuel');
      else if (cible.classList.contains('carrousel__pause')) { lectureVoulue = !lectureVoulue; majBoutonPause(); relancer(); }
      else if (cible.dataset.aller) aller(Number(cible.dataset.aller), 'manuel');
      else if (cible.classList.contains('carrousel__agrandir') && o.surAgrandir) o.surAgrandir(index, cible);
    });

    // Flèches gauche/droite lorsque le focus est dans le carrousel.
    conteneur.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); aller(index - 1, 'manuel'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); aller(index + 1, 'manuel'); }
    });

    // Balayage tactile horizontal (seuil de 40 px, sans bloquer le défilement vertical).
    let departX = null, departY = null;
    piste.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { departX = e.clientX; departY = e.clientY; } });
    piste.addEventListener('pointerup', e => {
      if (departX === null) return;
      const dx = e.clientX - departX, dy = e.clientY - departY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) aller(index + (dx < 0 ? 1 : -1), 'manuel');
      departX = null;
    });
    piste.addEventListener('pointercancel', () => { departX = null; });

    // Suspension : survol, focus clavier, page masquée, carrousel hors écran.
    const etats = { survol: false, focus: false, masque: false, horsEcran: false };
    function majSuspension() { suspendu = Object.values(etats).some(Boolean); relancer(); }
    conteneur.addEventListener('mouseenter', () => { etats.survol = true; majSuspension(); });
    conteneur.addEventListener('mouseleave', () => { etats.survol = false; majSuspension(); });
    conteneur.addEventListener('focusin', () => { etats.focus = true; majSuspension(); });
    conteneur.addEventListener('focusout', e => { if (!conteneur.contains(e.relatedTarget)) { etats.focus = false; majSuspension(); } });
    document.addEventListener('visibilitychange', () => { etats.masque = document.hidden; majSuspension(); });
    if ('IntersectionObserver' in racine) {
      new IntersectionObserver(entrees => { etats.horsEcran = !entrees[0].isIntersecting; majSuspension(); }, { threshold: 0.25 }).observe(conteneur);
    }

    majBoutonPause();
    relancer();
    return { aller: i => aller(i, 'manuel'), arreter() { lectureVoulue = false; majBoutonPause(); relancer(); }, get index() { return index; } };
  }

  Edysol.creerCarrousel = creerCarrousel;
})(window);
