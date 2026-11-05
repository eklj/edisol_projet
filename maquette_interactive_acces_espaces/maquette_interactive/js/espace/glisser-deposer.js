/* =========================================================================
   ÉDYSOL NC — Moteur de glisser-déposer du planning (souris, doigt, stylet)
   Utilise les « pointer events » : un seul code pour la souris et le tactile.
   - Souris : le déplacement commence après 4 px de mouvement.
   - Doigt ou stylet : il faut un APPUI LONG (350 ms) sans bouger. Un geste
     rapide reste un défilement normal de la page : pas de confusion.
   - Échap pendant le geste : abandon, l'intervention reste à sa place.
   - Un simple clic (sans déplacement) ouvre la fenêtre de modification,
     alternative accessible au clavier.
   Le moteur ne connaît pas les règles métier : il calcule une cible et
   délègue l'aperçu et le dépôt à la vue (js/espace/vues/planning.js).
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const SEUIL_SOURIS = 4, SEUIL_TACTILE = 8, APPUI_LONG_MS = 350;

  /**
   * Active le glisser-déposer dans un conteneur.
   * Options : selecteur (éléments déplaçables), cible(x, y, element, prise) -> cible ou null,
   * apercu(cible | null, element), deposer(element, cible), cliquer(element), annonce(texte).
   * Retour : fonction qui désactive le moteur.
   */
  function activer(conteneur, options) {
    let geste = null; // { element, pointeurId, x0, y0, type, actif, minuterie, prise, cible }

    function terminer(abandon) {
      if (!geste) return;
      clearTimeout(geste.minuterie);
      const { element, actif, cible } = geste;
      element.classList.remove('est-saisi');
      document.documentElement.classList.remove('glisser-en-cours');
      options.apercu(null, element);
      geste = null;
      if (actif && !abandon) options.deposer(element, cible);
      else if (actif) options.annonce('Déplacement abandonné : l’intervention reste à sa place.');
    }

    function demarrer() {
      geste.actif = true;
      geste.element.classList.add('est-saisi');
      document.documentElement.classList.add('glisser-en-cours');
      if (geste.type !== 'mouse' && racine.navigator.vibrate) racine.navigator.vibrate(15);
      options.annonce('Déplacement commencé. Relâchez sur le créneau voulu, ou appuyez sur Échap pour abandonner.');
    }

    conteneur.addEventListener('pointerdown', e => {
      const element = e.target.closest(options.selecteur);
      if (!element || !conteneur.contains(element) || e.button > 0) return;
      const r = element.getBoundingClientRect();
      geste = { element, pointeurId: e.pointerId, x0: e.clientX, y0: e.clientY, type: e.pointerType, actif: false, cible: null,
        prise: { dx: e.clientX - r.left, dy: e.clientY - r.top } };
      if (e.pointerType !== 'mouse') {
        // Appui long : si le doigt bouge avant, c'est un défilement et rien ne se passe.
        geste.minuterie = setTimeout(() => { if (geste && !geste.actif) { demarrer(); try { element.setPointerCapture(geste.pointeurId); } catch (_) { /* déjà relâché */ } } }, APPUI_LONG_MS);
      }
    });

    conteneur.addEventListener('pointermove', e => {
      if (!geste || e.pointerId !== geste.pointeurId) return;
      const distance = Math.hypot(e.clientX - geste.x0, e.clientY - geste.y0);
      if (!geste.actif) {
        if (geste.type === 'mouse' && distance > SEUIL_SOURIS) { demarrer(); try { geste.element.setPointerCapture(e.pointerId); } catch (_) { /* rien */ } }
        else if (geste.type !== 'mouse' && distance > SEUIL_TACTILE) { clearTimeout(geste.minuterie); geste = null; return; }
        else return;
      }
      e.preventDefault();
      geste.cible = options.cible(e.clientX, e.clientY, geste.element, geste.prise);
      options.apercu(geste.cible, geste.element);
    });

    conteneur.addEventListener('pointerup', e => { if (geste && e.pointerId === geste.pointeurId) { geste.supprimerClic = geste.actif; const sup = geste.actif; terminer(false); if (sup) supprimerProchainClic(); } });
    conteneur.addEventListener('pointercancel', e => { if (geste && e.pointerId === geste.pointeurId) terminer(true); });

    // Une fois le geste actif, le défilement tactile est bloqué pour ne pas confondre les deux.
    const bloquerDefilement = e => { if (geste && geste.actif) e.preventDefault(); };
    conteneur.addEventListener('touchmove', bloquerDefilement, { passive: false });

    const echap = e => { if (e.key === 'Escape' && geste && geste.actif) { e.preventDefault(); terminer(true); } };
    document.addEventListener('keydown', echap);

    // Clic simple (souris, toucher bref, Entrée ou Espace) : ouverture de la fenêtre de modification.
    let ignorerClic = false;
    function supprimerProchainClic() { ignorerClic = true; setTimeout(() => { ignorerClic = false; }, 0); }
    conteneur.addEventListener('click', e => {
      const element = e.target.closest(options.selecteurClic || options.selecteur);
      if (!element) return;
      if (ignorerClic) { e.preventDefault(); return; }
      options.cliquer(element);
    });
    // Empêche le menu contextuel pendant l'appui long sur téléphone.
    conteneur.addEventListener('contextmenu', e => { if (e.target.closest(options.selecteur)) e.preventDefault(); });

    return () => { document.removeEventListener('keydown', echap); };
  }

  E.glisserDeposer = { activer, APPUI_LONG_MS };
})(window);
