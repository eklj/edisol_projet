/* =========================================================================
   ÉDYSOL NC — Champs du formulaire de commande (composant réutilisable)
   Utilisé par :
   - le parcours client en 4 étapes (commande.html) ;
   - l'écran « Nouvelle commande » de la secrétaire (espace.html).
   Les mêmes champs et la même validation garantissent des données
   identiques, quelle que soit la personne qui saisit la commande.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;

  /** Définition des étapes : titre, explication et champs validés à chaque étape. */
  const ETAPES = [
    { id: 'besoin', titre: 'Votre besoin', aide: 'Choisissez la prestation qui correspond le mieux.', champs: ['prestation'] },
    { id: 'lieu', titre: 'Le lieu', aide: 'Où l’équipe doit-elle intervenir ?', champs: ['commune', 'adresse'] },
    { id: 'details', titre: 'Détails et date', aide: 'La date reste un souhait jusqu’à confirmation.', champs: ['description', 'dateSouhaitee'] },
    { id: 'coordonnees', titre: 'Vos coordonnées', aide: 'Pour vous recontacter et confirmer la demande.', champs: ['nom', 'telephone', 'email', 'consentement'] }
  ];

  /**
   * Retourne le HTML des champs d'une étape.
   * Paramètres : indice d'étape (0 à 3), valeurs déjà saisies, préfixe d'identifiants (unicité dans la page).
   */
  function champsEtape(n, v = {}, p = 'cmd') {
    const { esc, icone } = E;
    const coche = (a, b) => (a === b ? 'checked' : '');
    const erreur = nom => `<p class="message-erreur" id="${p}-${nom}-erreur" hidden></p>`;
    if (n === 0) {
      const options = [...E.PRESTATIONS, E.DEMANDE_SPECIFIQUE];
      return `
        <fieldset class="groupe-choix" aria-describedby="${p}-prestation-erreur">
          <legend class="libelle">Prestation souhaitée <span class="obligatoire" aria-hidden="true">*</span></legend>
          <div class="choix-cartes">
            ${options.map(o => `
              <label class="choix-carte">
                <input type="radio" name="prestation" value="${esc(o.id)}" ${coche(v.prestation, o.id)} required>
                <span class="choix-carte__icone">${icone(o.icone)}</span>
                <span class="choix-carte__texte"><strong>${esc(o.titre)}</strong><small>${esc(o.resume)}</small></span>
              </label>`).join('')}
          </div>
          ${erreur('prestation')}
        </fieldset>
        <fieldset class="groupe-choix">
          <legend class="libelle">Vous êtes</legend>
          <div class="segments">
            ${['Particulier', 'Professionnel'].map(t => `<label class="segment"><input type="radio" name="typeClient" value="${t}" ${coche(v.typeClient || 'Particulier', t)}><span>${t}</span></label>`).join('')}
          </div>
        </fieldset>
        <fieldset class="groupe-choix">
          <legend class="libelle">Fréquence</legend>
          <div class="segments segments--colonne">
            ${E.FREQUENCES.map(f => `<label class="segment"><input type="radio" name="frequence" value="${esc(f)}" ${coche(v.frequence || E.FREQUENCES[0], f)}><span>${esc(f)}</span></label>`).join('')}
          </div>
        </fieldset>`;
    }
    if (n === 1) {
      return `
        <div class="champ">
          <label for="${p}-commune">Commune <span class="obligatoire" aria-hidden="true">*</span></label>
          <select id="${p}-commune" name="commune" required autocomplete="address-level2">
            <option value="">Choisir une commune</option>
            ${E.COMMUNES.map(c => `<option ${v.commune === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
          <p class="aide">Zone d’intervention à confirmer avec ÉDYSOL.</p>
          ${erreur('commune')}
        </div>
        <div class="champ">
          <label for="${p}-adresse">Adresse et repères <span class="obligatoire" aria-hidden="true">*</span></label>
          <textarea id="${p}-adresse" name="adresse" rows="3" required autocomplete="street-address" placeholder="Numéro, rue, quartier, bâtiment…">${esc(v.adresse || '')}</textarea>
          ${erreur('adresse')}
        </div>
        <div class="champ">
          <label for="${p}-acces">Conditions d’accès <span class="facultatif">(facultatif)</span></label>
          <input id="${p}-acces" name="acces" value="${esc(v.acces || '')}" placeholder="Code, étage, stationnement, animaux…">
        </div>`;
    }
    if (n === 2) {
      return `
        <div class="champ">
          <label for="${p}-description">Description du besoin <span class="obligatoire" aria-hidden="true">*</span></label>
          <textarea id="${p}-description" name="description" rows="5" required placeholder="Type d’espace, surface approximative, tâches attendues, contraintes sur place…">${esc(v.description || '')}</textarea>
          ${erreur('description')}
        </div>
        <div class="champ">
          <label for="${p}-date">Date souhaitée <span class="facultatif">(facultatif)</span></label>
          <input id="${p}-date" name="dateSouhaitee" type="date" min="${E.aujourdhui()}" value="${esc(v.dateSouhaitee || '')}">
          <p class="aide">Sous réserve de confirmation : ce n’est pas une réservation.</p>
          ${erreur('dateSouhaitee')}
        </div>
        <fieldset class="groupe-choix">
          <legend class="libelle">Créneau préféré</legend>
          <div class="segments">
            ${E.CRENEAUX.map(c => `<label class="segment"><input type="radio" name="creneau" value="${esc(c)}" ${coche(v.creneau || 'Indifférent', c)}><span>${esc(c)}</span></label>`).join('')}
          </div>
        </fieldset>`;
    }
    return `
      <div class="grille-champs">
        <div class="champ champ--large">
          <label for="${p}-nom">Nom et prénom <span class="obligatoire" aria-hidden="true">*</span></label>
          <input id="${p}-nom" name="nom" required autocomplete="name" value="${esc(v.nom || '')}">
          ${erreur('nom')}
        </div>
        <div class="champ">
          <label for="${p}-telephone">Téléphone <span class="obligatoire" aria-hidden="true">*</span></label>
          <input id="${p}-telephone" name="telephone" type="tel" inputmode="tel" required autocomplete="tel" value="${esc(v.telephone || '')}">
          ${erreur('telephone')}
        </div>
        <div class="champ">
          <label for="${p}-email">E-mail <span class="facultatif">(facultatif)</span></label>
          <input id="${p}-email" name="email" type="email" inputmode="email" autocomplete="email" value="${esc(v.email || '')}">
          ${erreur('email')}
        </div>
      </div>
      <div class="champ">
        <label class="case" for="${p}-consentement">
          <input id="${p}-consentement" type="checkbox" name="consentement" ${v.consentement ? 'checked' : ''}>
          <span>J’accepte que mes données soient utilisées pour traiter cette demande. <span class="a-completer a-completer--inline"><span>Texte à valider</span></span></span>
        </label>
        ${erreur('consentement')}
      </div>
      <p class="notice notice--info"><span class="notice__icone">${icone('info')}</span><span>Le prix, le rendez-vous et les modalités de règlement sont confirmés avec ÉDYSOL. Aucun paiement n’est demandé en ligne.</span></p>`;
  }

  /** Lit toutes les valeurs présentes dans le formulaire (les étapes non affichées sont conservées à part). */
  function lire(form) {
    const d = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'radio') { if (el.checked) d[el.name] = el.value; }
      else if (el.type === 'checkbox') d[el.name] = el.checked;
      else d[el.name] = el.value;
    }
    return d;
  }

  /**
   * Affiche les erreurs d'une liste de champs, relie chaque message à son champ
   * (aria-describedby) et place le focus sur le premier champ en erreur.
   * Retour : vrai si aucune erreur.
   */
  function afficherErreurs(form, erreurs, champs, p = 'cmd') {
    let premier = null;
    for (const nom of champs) {
      const zone = form.querySelector(`#${p}-${nom}-erreur`);
      const entree = form.querySelector(`[name="${nom}"]`);
      const message = erreurs[nom] || '';
      if (zone) { zone.textContent = message; zone.hidden = !message; }
      form.querySelectorAll(`[name="${nom}"]`).forEach(el => {
        el.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (message && zone && el.type !== 'radio') el.setAttribute('aria-describedby', zone.id);
        else if (el.type !== 'radio') el.removeAttribute('aria-describedby');
      });
      if (message && !premier) premier = entree;
    }
    if (premier) premier.focus();
    return !premier;
  }

  E.formulaireCommande = { ETAPES, champsEtape, lire, afficherErreurs };
})(window);
