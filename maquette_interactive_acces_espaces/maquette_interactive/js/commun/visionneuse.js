/* =========================================================================
   ÉDYSOL NC — Visionneuse plein écran (agrandissement des visuels)
   Utilise l'élément natif <dialog> : focus contenu dans la fenêtre,
   fermeture par Échap, puis retour du focus sur le bouton d'origine.
   Navigation : boutons, flèches du clavier et balayage tactile.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};
  let dialogue = null, liste = [], index = 0, origine = null;

  /** Crée une seule fois la fenêtre de visionneuse dans la page. */
  function construire() {
    const { icone } = Edysol;
    dialogue = document.createElement('dialog');
    dialogue.className = 'visionneuse';
    dialogue.setAttribute('aria-labelledby', 'visionneuse-titre');
    dialogue.innerHTML = `
      <div class="visionneuse__entete">
        <p class="visionneuse__compteur" aria-live="polite"></p>
        <button type="button" class="bouton-icone visionneuse__fermer" aria-label="Fermer la visionneuse">${icone('fermer')}</button>
      </div>
      <figure class="visionneuse__figure">
        <div class="visionneuse__media"></div>
        <figcaption><h2 id="visionneuse-titre" class="visionneuse__titre"></h2><p class="visionneuse__legende"></p></figcaption>
      </figure>
      <button type="button" class="bouton-icone visionneuse__nav visionneuse__nav--prec" aria-label="Visuel précédent">${icone('gauche')}</button>
      <button type="button" class="bouton-icone visionneuse__nav visionneuse__nav--suiv" aria-label="Visuel suivant">${icone('droite')}</button>`;
    document.body.append(dialogue);

    dialogue.querySelector('.visionneuse__fermer').addEventListener('click', fermer);
    dialogue.querySelector('.visionneuse__nav--prec').addEventListener('click', () => afficher(index - 1));
    dialogue.querySelector('.visionneuse__nav--suiv').addEventListener('click', () => afficher(index + 1));
    // Clic sur le fond (en dehors du contenu) : fermeture.
    dialogue.addEventListener('click', e => { if (e.target === dialogue) fermer(); });
    dialogue.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); afficher(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); afficher(index + 1); }
    });
    // Échap déclenche l'événement « close » natif : on restaure le focus ici.
    dialogue.addEventListener('close', () => {
      document.documentElement.classList.remove('sans-defilement');
      if (origine && document.contains(origine)) origine.focus();
    });
    let x0 = null;
    dialogue.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    dialogue.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 50) afficher(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /** Affiche le visuel d'indice donné (boucle sur la liste). */
  function afficher(i) {
    const { esc } = Edysol;
    index = (i + liste.length) % liste.length;
    const v = liste[index];
    dialogue.querySelector('.visionneuse__media').innerHTML =
      Edysol.baliseImage(v, { prioritaire: true, tailles: '100vw' }) + `<span class="pastille-provisoire">${esc(Edysol.libelleStatut(v))}</span>`;
    dialogue.querySelector('.visionneuse__titre').textContent = v.titre;
    dialogue.querySelector('.visionneuse__legende').textContent = v.legende;
    dialogue.querySelector('.visionneuse__compteur').textContent = `Visuel ${index + 1} sur ${liste.length}`;
    const plusieurs = liste.length > 1;
    dialogue.querySelectorAll('.visionneuse__nav').forEach(b => { b.hidden = !plusieurs; });
  }

  /**
   * Ouvre la visionneuse.
   * Paramètres : liste de visuels, indice de départ, élément à refocaliser à la fermeture.
   */
  function ouvrir(visuels, depart = 0, elementOrigine = null) {
    if (!dialogue) construire();
    liste = visuels;
    origine = elementOrigine || document.activeElement;
    afficher(depart);
    document.documentElement.classList.add('sans-defilement');
    dialogue.showModal();
    dialogue.querySelector('.visionneuse__fermer').focus();
  }

  /** Ferme la visionneuse (le focus revient via l'événement « close »). */
  function fermer() { if (dialogue && dialogue.open) dialogue.close(); }

  Edysol.visionneuse = { ouvrir, fermer };
})(window);
