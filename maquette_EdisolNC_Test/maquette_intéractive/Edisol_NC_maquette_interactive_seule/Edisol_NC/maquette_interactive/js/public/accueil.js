/* =========================================================================
   ÉDYSOL NC — Page d'accueil publique
   Rôle : monter les trois carrousels (accueil, entreprise, prestations),
   les cartes de prestations, la galerie filtrable avec visionneuse et le
   formulaire de rappel (simulé : rien n'est transmis).
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone } = E;

  // --- Carrousels : chaque section a sa propre sélection de visuels ---
  const visuelsAccueil = E.visuelsDe('accueil');
  E.creerCarrousel(document.getElementById('carrousel-accueil'), visuelsAccueil, {
    libelle: 'Visuels d’accueil', variante: 'hero', prioritaire: true, delai: 7000, tailles: '100vw',
    surAgrandir: (i, bouton) => E.visionneuse.ouvrir(visuelsAccueil, i, bouton)
  });
  // L'équipe en premier : évite de répéter la première image de l'accueil.
  const visuelsEntreprise = E.visuelsDe('entreprise').sort((a, b) => (b.id === 'equipe') - (a.id === 'equipe'));
  E.creerCarrousel(document.getElementById('carrousel-entreprise'), visuelsEntreprise, {
    libelle: 'L’entreprise en images', delai: 8000, tailles: '(min-width: 1024px) 50vw, 100vw',
    surAgrandir: (i, bouton) => E.visionneuse.ouvrir(visuelsEntreprise, i, bouton)
  });
  const visuelsPrestations = E.visuelsDe('prestations');
  E.creerCarrousel(document.getElementById('carrousel-prestations'), visuelsPrestations, {
    libelle: 'Les prestations en images', delai: 8000, tailles: '(min-width: 1024px) 45vw, 100vw',
    surAgrandir: (i, bouton) => E.visionneuse.ouvrir(visuelsPrestations, i, bouton)
  });

  // --- Cartes de prestations : forme de tuile du logo, illustration, lien vers le formulaire prérempli ---
  const cartes = document.getElementById('cartes-prestations');
  cartes.innerHTML = E.PRESTATIONS.map(p => {
    const v = E.VISUELS.find(x => x.id === p.visuel);
    return `
      <li class="carte-prestation tuile-${p.tuile} ${p.tuile % 2 ? 'carte-prestation--bleue' : 'carte-prestation--verte'}">
        <button type="button" class="carte-prestation__media" data-visuel="${esc(v.id)}" aria-label="Agrandir l’illustration : ${esc(p.titre)}">
          ${E.baliseImage(v, { tailles: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw' })}
          <span class="pastille-provisoire">Illustration provisoire</span>
        </button>
        <div class="carte-prestation__corps">
          <span class="carte-prestation__icone">${icone(p.icone)}</span>
          <h3>${esc(p.titre)}</h3>
          <p>${esc(p.resume)}</p>
          <a class="lien-fleche" href="commande.html?prestation=${esc(p.id)}">Demander cette prestation ${icone('droite')}</a>
        </div>
      </li>`;
  }).join('');
  cartes.addEventListener('click', e => {
    const bouton = e.target.closest('[data-visuel]');
    if (!bouton) return;
    const liste = E.PRESTATIONS.map(p => E.VISUELS.find(v => v.id === p.visuel));
    E.visionneuse.ouvrir(liste, liste.findIndex(v => v.id === bouton.dataset.visuel), bouton);
  });

  // --- Galerie filtrable : chaque vignette ouvre la visionneuse sur la sélection courante ---
  const grille = document.getElementById('galerie-grille');
  const filtres = document.getElementById('filtres-galerie');
  let selection = [];

  /** Affiche les vignettes correspondant au filtre (chaîne vide = tout). */
  function afficherGalerie(filtre) {
    selection = E.visuelsDe(filtre || null);
    grille.innerHTML = selection.map((v, i) => `
      <li class="galerie__item${i === 0 ? ' galerie__item--grand' : ''}${i === 3 || i === 6 ? ' galerie__item--large' : ''}">
        <button type="button" class="galerie__bouton" data-index="${i}" aria-label="Agrandir : ${esc(v.titre)}">
          ${E.baliseImage(v, { tailles: '(min-width: 1024px) 33vw, 50vw' })}
          <span class="galerie__legende"><strong>${esc(v.titre)}</strong><span>${esc(E.libelleStatut(v))}</span></span>
          <span class="galerie__loupe">${icone('agrandir')}</span>
        </button>
      </li>`).join('');
  }
  filtres.addEventListener('click', e => {
    const bouton = e.target.closest('[data-filtre]');
    if (!bouton) return;
    filtres.querySelectorAll('[data-filtre]').forEach(b => b.setAttribute('aria-pressed', String(b === bouton)));
    afficherGalerie(bouton.dataset.filtre);
  });
  grille.addEventListener('click', e => {
    const bouton = e.target.closest('[data-index]');
    if (bouton) E.visionneuse.ouvrir(selection, Number(bouton.dataset.index), bouton);
  });
  afficherGalerie('');

  // --- Formulaire de rappel : validation locale puis enregistrement SIMULÉ ---
  const form = document.getElementById('formulaire-rappel');
  const retour = form.querySelector('.formulaire-rappel__retour');

  /** Affiche ou efface l'erreur d'un champ (texte relié par aria-describedby). */
  function erreurChamp(input, message) {
    const zone = document.getElementById(input.id + '-erreur');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) input.setAttribute('aria-describedby', zone.id); else input.removeAttribute('aria-describedby');
    zone.textContent = message || '';
    zone.hidden = !message;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nom = form.elements.nom, tel = form.elements.telephone;
    const eNom = nom.value.trim().length < 2 ? 'Indiquez votre nom.' : '';
    const eTel = tel.value.replace(/\D/g, '').length < 6 ? 'Indiquez un numéro (6 chiffres au minimum).' : '';
    erreurChamp(nom, eNom);
    erreurChamp(tel, eTel);
    if (eNom || eTel) { (eNom ? nom : tel).focus(); return; }
    E.api.demanderRappel({ nom: nom.value.trim(), telephone: tel.value.trim(), objet: form.elements.objet.value });
    retour.innerHTML = `<p class="notice notice--succes">${icone('valide')}<span><strong>Demande simulée.</strong> Elle apparaît dans les notifications de l’espace secrétariat de cette maquette. Aucun message n’a été envoyé.</span></p>`;
    form.reset();
  });
})(window);
