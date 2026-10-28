/* =========================================================================
   ÉDYSOL NC — Gabarit commun des pages publiques
   Rôle : injecter l'en-tête (logo, navigation, menu mobile) et le pied de
   page, remplacer les attributs data-icone par des icônes SVG et gérer la
   barre d'action mobile. Une seule source pour toutes les pages publiques.
   ========================================================================= */
(function (racine) {
  'use strict';
  const { esc, icone, piegerFocus } = racine.Edysol;

  /** Liens de navigation : sur la page de commande, ils pointent vers l'accueil. */
  function liens(page) {
    const base = page === 'accueil' ? '' : 'index.html';
    return [
      { href: base + '#entreprise', texte: 'L’entreprise' },
      { href: base + '#prestations', texte: 'Prestations' },
      { href: base + '#galerie', texte: 'Galerie' },
      { href: base + '#contact', texte: 'Contact' }
    ];
  }

  /** Construit l'en-tête : logo d'origine (couleurs et proportions conservées), menu et appel à l'action. */
  function construireEntete(entete) {
    const page = entete.dataset.page;
    entete.innerHTML = `
      <div class="conteneur entete__barre">
        <a class="entete__logo" href="index.html#accueil" aria-label="ÉDYSOL, retour à l’accueil">
          <img src="assets/logo/edysol-logo.svg" alt="ÉDYSOL Prestige nettoyage" width="819" height="425">
        </a>
        <nav class="entete__nav" aria-label="Navigation principale">
          <ul>${liens(page).map(l => `<li><a href="${esc(l.href)}">${esc(l.texte)}</a></li>`).join('')}</ul>
        </nav>
        <div class="entete__actions">
          <a class="entete__equipe" href="espace.html">${icone('utilisateur')}<span>Espace équipe</span></a>
          <a class="bouton bouton--principal entete__cta" href="commande.html"${page === 'commande' ? ' aria-current="page"' : ''}>Demander une prestation</a>
          <button type="button" class="bouton-icone entete__burger" aria-expanded="false" aria-controls="menu-mobile" aria-label="Ouvrir le menu">${icone('menu')}</button>
        </div>
      </div>
      <div class="menu-mobile" id="menu-mobile" hidden>
        <div class="menu-mobile__haut">
          <span class="plaque-logo menu-mobile__logo"><img src="assets/logo/edysol-logo.svg" alt="" width="819" height="425"></span>
          <button type="button" class="bouton-icone menu-mobile__fermer" aria-label="Fermer le menu">${icone('fermer')}</button>
        </div>
        <nav aria-label="Navigation mobile">
          <ul>${liens(page).map(l => `<li><a href="${esc(l.href)}">${esc(l.texte)}</a></li>`).join('')}</ul>
        </nav>
        <div class="menu-mobile__actions">
          <a class="bouton bouton--principal" href="commande.html">${icone('commandes')}Demander une prestation</a>
          <a class="bouton bouton--contour-clair" href="tel:+687453812">${icone('telephone')}Appeler le 45 38 12</a>
          <a class="bouton bouton--discret menu-mobile__equipe" href="espace.html">${icone('utilisateur')}Espace équipe</a>
        </div>
      </div>`;

    // Menu mobile : ouverture, fermeture par Échap, clic sur un lien, focus piégé.
    const burger = entete.querySelector('.entete__burger');
    const menu = entete.querySelector('#menu-mobile');
    let retirerPiege = null;
    function ouvrir() {
      menu.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('sans-defilement');
      retirerPiege = piegerFocus(menu);
      menu.querySelector('a').focus();
    }
    function fermer(rendreFocus = true) {
      menu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('sans-defilement');
      if (retirerPiege) retirerPiege();
      if (rendreFocus) burger.focus();
    }
    burger.addEventListener('click', ouvrir);
    menu.querySelector('.menu-mobile__fermer').addEventListener('click', () => fermer());
    menu.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
    menu.addEventListener('click', e => { if (e.target.closest('a')) fermer(false); });
    // Si l'écran s'élargit, le menu mobile se ferme.
    racine.matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches && !menu.hidden) fermer(false); });

    // En-tête compact lors du défilement.
    const majOmbre = () => entete.classList.toggle('est-compact', racine.scrollY > 10);
    racine.addEventListener('scroll', majOmbre, { passive: true });
    majOmbre();
  }

  /** Construit le pied de page avec les coordonnées présentes dans l'archive. */
  function construirePied(pied) {
    const c = racine.Edysol.CONTACT;
    pied.innerHTML = `
      <div class="conteneur pied__grille">
        <div class="pied__marque">
          <span class="plaque-logo pied__logo"><img src="assets/logo/edysol-logo.svg" alt="ÉDYSOL Prestige nettoyage" width="819" height="425" loading="lazy"></span>
          <p>Entretien, nettoyage et services en Nouvelle-Calédonie.</p>
        </div>
        <div>
          <h2 class="pied__titre">Nous joindre</h2>
          <p><a href="${c.telephoneLien}">${esc(c.telephoneAffiche)}</a><br>${c.adresse.map(esc).join('<br>')}</p>
        </div>
        <div>
          <h2 class="pied__titre">Navigation</h2>
          <ul class="pied__liens">
            <li><a href="index.html#prestations">Prestations</a></li>
            <li><a href="commande.html">Demander une prestation</a></li>
            <li><a href="espace.html">Espace équipe</a></li>
          </ul>
        </div>
      </div>
      <div class="conteneur pied__bas">
        <span>© ${new Date().getFullYear()} ÉDYSOL NC</span>
        <span>Maquette de démonstration · mentions légales et politique de confidentialité à rédiger</span>
      </div>`;
  }

  /** Remplace chaque attribut data-icone par l'icône SVG correspondante (en tête d'élément). */
  function injecterIcones(racineDom = document) {
    racineDom.querySelectorAll('[data-icone]').forEach(el => {
      el.insertAdjacentHTML('afterbegin', icone(el.dataset.icone));
      el.removeAttribute('data-icone');
    });
  }

  /** Barre d'action mobile : visible une fois l'accueil dépassé, masquée près du pied de page. */
  function activerBarreMobile() {
    const barre = document.getElementById('barre-mobile');
    const hero = document.querySelector('.hero');
    const pied = document.getElementById('pied-site');
    if (!barre || !hero || !('IntersectionObserver' in racine)) return;
    let heroVisible = true, piedVisible = false;
    const maj = () => { barre.hidden = heroVisible || piedVisible; };
    new IntersectionObserver(e => { heroVisible = e[0].isIntersecting; maj(); }, { threshold: 0.05 }).observe(hero);
    new IntersectionObserver(e => { piedVisible = e[0].isIntersecting; maj(); }).observe(pied);
  }

  const entete = document.getElementById('entete-site');
  const pied = document.getElementById('pied-site');
  if (entete) construireEntete(entete);
  if (pied) construirePied(pied);
  injecterIcones();
  activerBarreMobile();
  racine.Edysol.injecterIcones = injecterIcones;
})(window);
