/* ÉDYSOL NC — Règles de démonstration et aperçu des médias du chantier. */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc } = E;
  const MIO = 1024 * 1024;
  // Valeurs ajustables avant la mise en production, communes aux indications et aux contrôles.
  const limites = Object.freeze({
    nombre: 6, total: 60 * MIO, duree: 30,
    photo: { max: 8 * MIO, formats: ['image/jpeg', 'image/png', 'image/webp'], noms: 'JPG, PNG, WebP' },
    video: { max: 25 * MIO, formats: ['video/mp4', 'video/webm', 'video/quicktime'], noms: 'MP4, WebM, MOV' }
  });
  const titre = 'Photos et vidéos du chantier';
  const taille = octets => octets >= MIO
    ? `${E.formaterNombre(Math.round(octets / MIO * 10) / 10)} Mo`
    : `${Math.max(1, Math.ceil(octets / 1024))} Ko`;
  const type = fichier => Object.keys(limites).find(cle => limites[cle].formats?.includes(fichier.type));

  /** Vérifie que le navigateur sait ouvrir le média et lit la durée réelle de la vidéo. */
  function lireMedia(url, categorie) {
    return new Promise((resolve, reject) => {
      const video = categorie === 'video';
      const element = document.createElement(video ? 'video' : 'img');
      function terminer(erreur) {
        clearTimeout(minuterie);
        const duree = video ? element.duration : null;
        element.onloadedmetadata = element.onload = element.onerror = null;
        element.removeAttribute('src');
        if (video) element.load();
        if (erreur) reject(new Error('Ce fichier ne peut pas être lu par ce navigateur.'));
        else resolve(duree);
      }
      const minuterie = setTimeout(() => terminer(true), 5000);
      element.onerror = () => terminer(true);
      if (video) {
        element.preload = 'metadata';
        element.onloadedmetadata = () => terminer(false);
      } else element.onload = () => terminer(false);
      element.src = url;
    });
  }

  /** Retourne un aperçu contrôlé ou libère son URL et explique le refus. */
  async function preparer(fichier, selection) {
    const categorie = type(fichier);
    if (!categorie) throw new Error('Format non accepté.');
    if (!fichier.size) throw new Error('Le fichier est vide.');
    if (selection.length >= limites.nombre) throw new Error(`Maximum ${limites.nombre} fichiers par demande.`);
    if (fichier.size > limites[categorie].max) throw new Error(`Ce fichier dépasse ${taille(limites[categorie].max)}.`);
    const total = selection.reduce((somme, media) => somme + media.fichier.size, 0) + fichier.size;
    if (total > limites.total) throw new Error(`La sélection dépasse ${taille(limites.total)} au total.`);
    const url = URL.createObjectURL(fichier);
    try {
      const duree = await lireMedia(url, categorie);
      if (categorie === 'video' && (!Number.isFinite(duree) || duree <= 0 || duree > limites.duree)) {
        throw new Error(`La vidéo doit durer au maximum ${limites.duree} secondes.`);
      }
      return { fichier, url, duree };
    } catch (erreur) {
      URL.revokeObjectURL(url);
      throw erreur;
    }
  }

  /** Même aperçu dans la saisie et dans le dossier interne, avec retrait seulement avant envoi. */
  function liste(medias, modifiable = false) {
    if (!medias.length) return '<p class="aide">Aucun média joint.</p>';
    return `<ul class="medias-chantier__liste">${medias.map(({ fichier, url, duree }, index) => `
      <li class="medias-chantier__carte">
        ${type(fichier) === 'video'
          ? `<video controls playsinline preload="metadata" src="${esc(url)}" aria-label="${esc(fichier.name)}"></video>`
          : `<img src="${esc(url)}" alt="Photo du chantier : ${esc(fichier.name)}">`}
        <span class="medias-chantier__nom">${esc(fichier.name)}</span>
        <small>${taille(fichier.size)}${duree ? ` · ${Math.ceil(duree)} s` : ''}</small>
        ${modifiable ? `<button type="button" class="bouton bouton--clair bouton--petit" data-retirer-media="${index}" aria-label="Retirer ${esc(fichier.name)}">Retirer</button>` : ''}
      </li>`).join('')}</ul>`;
  }

  /** Le sélecteur multiple reste disponible à côté des raccourcis de capture mobile. */
  function saisie(medias) {
    const accept = [...limites.photo.formats, ...limites.video.formats].join(',');
    return `<fieldset class="medias-chantier">
      <legend>${titre} <span class="facultatif">(facultatif)</span></legend>
      <label for="medias-fichiers" class="libelle">Choisir des photos ou des vidéos</label>
      <input type="file" id="medias-fichiers" multiple accept="${accept}" aria-describedby="medias-aide medias-limites" data-choisir-media>
      <p class="aide" id="medias-aide">Montrez-nous le lieu ou les objets à nettoyer pour aider l’équipe à préparer son intervention.</p>
      <p class="aide" id="medias-limites">Photos ${limites.photo.noms} (${taille(limites.photo.max)} chacune). Vidéos ${limites.video.noms} (${taille(limites.video.max)} et ${limites.duree} s chacune). Jusqu’à ${limites.nombre} fichiers, ${taille(limites.total)} au total. La lecture dépend des formats pris en charge par le navigateur.</p>
      <div class="medias-chantier__capture">
        <button type="button" class="bouton bouton--clair bouton--petit" data-capture-media="photo">Prendre une photo</button>
        <input type="file" id="media-capture-photo" accept="image/*" capture="environment" data-choisir-media hidden>
        <button type="button" class="bouton bouton--clair bouton--petit" data-capture-media="video">Filmer une vidéo</button>
        <input type="file" id="media-capture-video" accept="video/*" capture="environment" data-choisir-media hidden>
      </div>
      <p class="aide">Simulation locale. Utilisez des fichiers d’essai, sans information personnelle.</p>
      <p class="champ__erreur" id="medias-erreurs" role="alert"></p>
      <p class="visuellement-cache" id="medias-annonce" role="status"></p>
      <div id="medias-selection">${liste(medias, true)}</div>
    </fieldset>`;
  }

  /** Lit uniquement le dossier autorisé et libère les aperçus en quittant l’écran. */
  function monterDossier(vue, commandeId, personneId) {
    const zone = vue.querySelector('[data-medias-dossier]');
    if (!zone) return;
    let actif = true;
    let medias = [];
    E.api.lireMediasCommande(commandeId, personneId).then(fichiers => {
      if (!actif) return;
      medias = fichiers.map(media => ({ ...media, url: URL.createObjectURL(media.fichier) }));
      zone.innerHTML = liste(medias);
    }).catch(() => {
      if (actif) zone.textContent = 'Ces fichiers ne sont pas disponibles dans ce navigateur.';
    });
    return () => {
      actif = false;
      medias.forEach(media => URL.revokeObjectURL(media.url));
    };
  }

  /** Relie le bloc au cycle de vie des fiches internes. */
  function dossier(commandeId, ctx) {
    let nettoyer;
    return {
      html: E.ui.bloc(titre, '<div data-medias-dossier><p class="vide">Chargement des fichiers…</p></div>'),
      monter(vue) { nettoyer = monterDossier(vue, commandeId, ctx.personne.id); },
      detruire() { nettoyer?.(); },
      // Un changement depuis un autre onglet peut modifier l’affectation ou la coordination.
      surDonnees(vue, detail) { if (detail.externe) ctx.rafraichir(); }
    };
  }

  E.mediasChantier = { preparer, liste, saisie, dossier };
})(window);
