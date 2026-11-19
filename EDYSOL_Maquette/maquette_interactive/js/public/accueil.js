/* =========================================================================
   EDYSOL NC — Page d'accueil publique
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

  // --- Cartes de prestations, avec lien de détail et actions de zoom et de demande indépendantes ---
  const cartes = document.getElementById('cartes-prestations');
  cartes.innerHTML = E.PRESTATIONS.map(p => {
    const v = E.visuelPrestation(p);
    const id = encodeURIComponent(p.id);
    return `
      <li class="carte-prestation tuile-${p.tuile}${p.tuile % 2 ? '' : ' carte-prestation--verte'}${p.specialite ? ' carte-prestation--specialite' : ''}" data-prestation="${esc(p.id)}">
        <div class="carte-prestation__media">
          ${E.mediaPrestation(p, { tailles: p.specialite ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 1180px) 25vw, (min-width: 640px) 50vw, 100vw' })}
          ${v ? `<button type="button" class="bouton-icone carte-prestation__agrandir" data-visuel="${esc(v.id)}" aria-label="Agrandir l’illustration de la prestation ${esc(p.titre)}">${icone('agrandir')}</button>` : ''}
        </div>
        <div class="carte-prestation__corps">
          <span class="carte-prestation__icone">${icone(p.icone)}</span>
          ${p.specialite ? '<span class="carte-prestation__statut">Spécialité EDYSOL</span>' : ''}
          <h3><a class="carte-prestation__lien" href="prestation.html?prestation=${id}">${esc(p.titre)}${icone('droite')}</a></h3>
          <p>${esc(p.resume)}</p>
          <a class="lien-fleche carte-prestation__demande" href="commande.html?prestation=${id}">Demander cette prestation ${icone('droite')}</a>
        </div>
      </li>`;
  }).join('');
  cartes.addEventListener('click', e => {
    const bouton = e.target.closest('[data-visuel]');
    if (!bouton) return;
    // Ignorer les emplacements sans image et dédupliquer les médias partagés.
    const liste = E.PRESTATIONS.map(E.visuelPrestation).filter(Boolean).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
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
  const { email: emailContact, horaires } = E.CONTACT;
  document.getElementById('contact-email').innerHTML = `<a href="mailto:${esc(emailContact)}">${esc(emailContact)}</a>`;
  document.getElementById('contact-horaires').textContent = horaires;
  form.elements.objet.innerHTML = Object.entries(E.OBJETS_RAPPEL).map(([id, texte]) => `<option value="${esc(id)}">${esc(texte)}</option>`).join('');

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
    retour.replaceChildren();
    const { nom, telephone: tel, email, objet } = form.elements;
    const adresse = email.value.trim();
    const eNom = nom.value.trim().length < 2 ? 'Indiquez votre nom.' : '';
    const eTel = tel.value.replace(/\D/g, '').length < 6 ? 'Indiquez un numéro (6 chiffres au minimum).' : '';
    const eEmail = adresse && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse) ? 'Indiquez une adresse email valide.' : '';
    erreurChamp(nom, eNom);
    erreurChamp(tel, eTel);
    erreurChamp(email, eEmail);
    if (eNom || eTel || eEmail) { (eNom ? nom : eTel ? tel : email).focus(); return; }

    let resultat;
    try {
      resultat = E.api.demanderRappel({ nom: nom.value.trim(), telephone: tel.value.trim(), email: adresse, objet: objet.value });
    } catch {
      resultat = { ok: false, message: 'Le formulaire de rappel est indisponible.' };
    }
    if (!resultat.ok) {
      retour.innerHTML = `<p class="notice notice--erreur">${icone('alerte')}<span>${esc(resultat.message)}</span></p>`;
      return;
    }
    retour.innerHTML = `<p class="notice notice--succes">${icone('valide')}<span><strong>Demande simulée.</strong> Elle est enregistrée dans ce navigateur et apparaît dans les notifications du secrétariat de la maquette.</span></p>`;
    form.reset();
  });
})(window);
