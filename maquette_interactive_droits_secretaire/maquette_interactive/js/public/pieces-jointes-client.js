/* =========================================================================
   ÉDYSOL NC — Rubrique « Photos et documents du chantier » (formulaire client)
   Facultative. Permet de choisir plusieurs fichiers, de prendre une photo
   sur téléphone, de voir les aperçus et de retirer un fichier avant l'envoi.
   Chaque fichier est contrôlé dans le navigateur (format réel, taille,
   nombre) par js/metier/pieces_jointes.js. En production, le serveur devra
   refaire TOUS ces contrôles : ceux du navigateur ne protègent de rien.
   La sélection est gardée en mémoire tant que la page est ouverte, pour
   pouvoir passer d'une étape à l'autre sans la perdre.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const P = racine.EdysolPiecesJointes;
  const { esc, icone } = E;

  /** Sélection courante : [{ cle, fichier, nom, type, categorie, taille, url }]. */
  const selection = [];
  let messages = [];  // erreurs du dernier ajout, affichées jusqu'au suivant
  let compteur = 0;

  /** Le bouton « Prendre une photo » n'est proposé que sur écran tactile (appareil photo probable). */
  const tactile = () => racine.matchMedia && racine.matchMedia('(pointer: coarse)').matches;

  /** HTML de la rubrique (insérée à l'étape « Détails et date »). */
  function html() {
    return `
      <fieldset class="pj" id="pj" aria-describedby="pj-conseil pj-limites">
        <legend class="libelle">${icone('trombone')}Photos et documents du chantier <span class="facultatif">(facultatif)</span></legend>
        <p class="aide" id="pj-conseil">Montrez les surfaces à nettoyer, les accès et les contraintes utiles (escalier, stationnement, matériaux fragiles…). Évitez les visages et les documents personnels inutiles.</p>
        <p class="aide pj__limites" id="pj-limites">${esc(P.texteLimites())} <span class="a-completer a-completer--inline"><span>Limites à confirmer</span></span></p>
        <div class="pj__actions">
          <label class="bouton bouton--clair pj__bouton">${icone('plus')}<span>Ajouter des fichiers</span>
            <input type="file" id="pj-fichiers" class="visuellement-cache" multiple accept="${esc(P.ACCEPT)}"></label>
          ${tactile() ? `<label class="bouton bouton--clair pj__bouton">${icone('photo')}<span>Prendre une photo</span>
            <input type="file" id="pj-photo" class="visuellement-cache" accept="image/jpeg,image/png,image/webp" capture="environment"></label>` : ''}
        </div>
        ${tactile() ? '' : '<p class="pj__depot" aria-hidden="true">Vous pouvez aussi glisser les fichiers ici.</p>'}
        <div id="pj-erreurs" class="pj__erreurs" role="alert"></div>
        <p id="pj-statut" class="pj__statut" role="status"></p>
        <ul class="pj__liste" id="pj-liste" aria-label="Fichiers sélectionnés"></ul>
        <p id="pj-persistance" class="notice notice--alerte" hidden></p>
        <p class="pj__demo">${icone('info')}<span><strong>Simulation.</strong> Les fichiers sont copiés dans ce navigateur seulement, jusqu’à « Réinitialiser la démo » ou l’effacement des données du site. Ils ne sont ni transmis à ÉDYSOL ni aux employés, ni synchronisés entre appareils. Durée de conservation réelle : à définir.</span></p>
      </fieldset>`;
  }

  /** Lit les premiers octets d'un fichier (signature du format réel). */
  async function debut(fichier) {
    const tampon = await fichier.slice(0, P.OCTETS_SIGNATURE).arrayBuffer();
    return new Uint8Array(tampon);
  }

  /**
   * Ajoute des fichiers après contrôle : format réel, taille, doublon, puis nombre et total.
   * Les fichiers refusés ne sont pas ajoutés ; chaque refus produit un message clair.
   */
  async function ajouter(liste, zone) {
    messages = [];
    const valides = [];
    for (const fichier of liste) {
      const nom = P.nomAffichage(fichier.name);
      if (selection.some(s => s.nom === nom && s.taille === fichier.size && s.modifie === fichier.lastModified)) {
        messages.push(`« ${nom} » est déjà dans la liste.`); continue;
      }
      let octets = [];
      try { octets = await debut(fichier); } catch (e) { messages.push(`« ${nom} » n’a pas pu être lu.`); continue; }
      const r = P.verifierFichier({ nom, taille: fichier.size, typeDeclare: fichier.type }, octets);
      if (!r.ok) { messages.push(r.erreur); continue; }
      valides.push({ fichier, nom, type: r.type, categorie: r.categorie, taille: fichier.size, modifie: fichier.lastModified });
    }
    const { acceptes, refuses } = P.verifierAjout(selection, valides);
    refuses.forEach(x => messages.push(x.erreur));
    for (const f of acceptes) {
      compteur += 1;
      // Aperçu local : adresse temporaire « blob: », libérée au retrait du fichier.
      selection.push({ ...f, cle: 'pj' + compteur, url: f.categorie === 'photo' ? URL.createObjectURL(f.fichier) : '' });
    }
    rendre(zone, acceptes.length ? `${acceptes.length} fichier${acceptes.length > 1 ? 's' : ''} ajouté${acceptes.length > 1 ? 's' : ''}.` : '');
  }

  /** Retire un fichier de la sélection (avant l'envoi) et libère son aperçu. */
  function retirer(cle, zone) {
    const i = selection.findIndex(s => s.cle === cle);
    if (i < 0) return;
    const [f] = selection.splice(i, 1);
    if (f.url) URL.revokeObjectURL(f.url);
    messages = [];
    rendre(zone, `« ${f.nom} » retiré.`);
    // Le focus revient sur un élément stable pour ne pas se perdre au clavier.
    (zone.querySelector('.pj__retirer') || zone.querySelector('#pj-fichiers')).focus();
  }

  /** Met à jour la liste, le statut et les erreurs. */
  function rendre(zone, annonce = '') {
    if (!zone.querySelector('#pj')) return;
    const total = selection.reduce((s, f) => s + f.taille, 0);
    zone.querySelector('#pj-erreurs').innerHTML = messages.length
      ? `<ul class="pj__messages">${messages.map(m => `<li>${icone('alerte')}<span>${esc(m)}</span></li>`).join('')}</ul>` : '';
    zone.querySelector('#pj-statut').textContent = selection.length
      ? `${annonce ? annonce + ' ' : ''}${selection.length} fichier${selection.length > 1 ? 's' : ''} sur ${P.PARAMETRES.maxFichiers} · ${P.formaterTaille(total)} sur ${P.formaterTaille(P.PARAMETRES.maxOctetsTotal)}.`
      : (annonce ? annonce + ' ' : '') + 'Aucun fichier joint : la demande peut être envoyée sans.';
    zone.querySelector('#pj-liste').innerHTML = selection.map(f => `
      <li class="pj__item" data-cle="${esc(f.cle)}">
        <span class="pj__apercu">${f.url ? `<img src="${esc(f.url)}" alt="Aperçu de ${esc(f.nom)}">` : `${icone('documents')}<span>PDF</span>`}</span>
        <span class="pj__texte"><strong>${esc(f.nom)}</strong><small>${esc(P.FORMATS[f.type].libelle)} · ${esc(P.formaterTaille(f.taille))}</small></span>
        <button type="button" class="bouton-icone pj__retirer" data-retirer="${esc(f.cle)}" aria-label="Retirer ${esc(f.nom)}">${icone('corbeille')}</button>
      </li>`).join('');
    // Prévient le parcours (résumé latéral « Photos et documents »).
    zone.dispatchEvent(new CustomEvent('pj:modifie'));
  }

  /** Branche les événements de la rubrique après son insertion dans la page. */
  function activer(zone) {
    if (!zone.querySelector('#pj')) return;
    const surChoix = e => { const liste = [...e.target.files]; e.target.value = ''; ajouter(liste, zone); };
    zone.querySelector('#pj-fichiers').addEventListener('change', surChoix);
    zone.querySelector('#pj-photo')?.addEventListener('change', surChoix);
    zone.querySelector('#pj-liste').addEventListener('click', e => {
      const b = e.target.closest('[data-retirer]');
      if (b) retirer(b.dataset.retirer, zone);
    });
    // Glisser-déposer de fichiers sur ordinateur (facultatif, le bouton suffit).
    const cadre = zone.querySelector('#pj');
    cadre.addEventListener('dragover', e => { e.preventDefault(); cadre.classList.add('est-survole'); });
    cadre.addEventListener('dragleave', () => cadre.classList.remove('est-survole'));
    cadre.addEventListener('drop', e => { e.preventDefault(); cadre.classList.remove('est-survole'); ajouter([...e.dataTransfer.files], zone); });
    // Sans IndexedDB, les fichiers ne survivraient pas au changement de page : on le dit.
    E.piecesJointesLocales.estPersistant().then(ok => {
      const note = zone.querySelector('#pj-persistance');
      if (!ok && note) { note.hidden = false; note.textContent = 'Ce navigateur ne permet pas de conserver les fichiers (navigation privée ou réglage). Ils ne seront pas visibles dans les espaces internes de la maquette. La demande peut être envoyée sans eux.'; }
    });
    rendre(zone);
  }

  /**
   * « Transfère » la sélection (simulation locale) AVANT de créer la commande.
   * Retour : promesse des métadonnées. En cas d'échec, rien n'est gardé et l'erreur remonte :
   * aucune confirmation n'est affichée tant que le transfert n'a pas réussi.
   */
  async function transferer() {
    if (!selection.length) return [];
    return E.piecesJointesLocales.enregistrerProvisoires(selection.map(f => ({ fichier: f.fichier, nom: f.nom, type: f.type, taille: f.taille })));
  }

  /** Vide la sélection après un envoi réussi (libère les aperçus). */
  function vider() { selection.splice(0).forEach(f => f.url && URL.revokeObjectURL(f.url)); messages = []; }

  E.piecesJointesClient = { html, activer, transferer, vider, nombre: () => selection.length };
})(window);
