/* =========================================================================
   ÉDYSOL NC — Parcours de demande de prestation en 4 étapes
   Étapes : besoin, lieu, détails et date, coordonnées. Chaque étape est
   validée avant de passer à la suivante ; le résumé latéral se met à jour.
   Enregistrement SIMULÉ via Edysol.api (mode démo) : la commande apparaît
   dans l'espace secrétariat de la maquette. Aucun envoi, aucun paiement.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const F = E.formulaireCommande;
  const M = E.mediasChantier;
  const { esc, icone } = E;

  const form = document.getElementById('formulaire-commande');
  const zone = document.getElementById('zone-etape');
  const etapier = document.getElementById('etapier');
  const barre = document.getElementById('progression-barre');
  const precedent = document.getElementById('bouton-precedent');
  const suivant = document.getElementById('bouton-suivant');
  const resumeListe = document.getElementById('resume-liste');
  const resumeVisuel = document.getElementById('resume-visuel');
  const erreurEnvoi = document.getElementById('commande-erreur-envoi');

  // Valeurs saisies, conservées d'une étape à l'autre. Préremplissage possible via ?prestation=vitres.
  const parametre = new URLSearchParams(racine.location.search).get('prestation');
  const valeurs = { prestation: E.prestationParId(parametre) ? parametre : undefined };
  // Les fichiers restent disponibles quand le client revient à une étape précédente.
  const medias = [];
  let occupe = false;
  let etape = 0;

  /** Affiche l'étape courante, l'indicateur d'étapes et les boutons. */
  function afficherEtape(focus = true) {
    const info = F.ETAPES[etape];
    etapier.innerHTML = F.ETAPES.map((e, i) => `
      <li class="etapier__item${i < etape ? ' est-faite' : ''}"${i === etape ? ' aria-current="step"' : ''}>
        <span class="etapier__num">${i < etape ? icone('valide') : i + 1}</span><span class="etapier__titre">${esc(e.titre)}</span>
      </li>`).join('');
    barre.style.width = ((etape + 1) / F.ETAPES.length * 100) + '%';
    zone.innerHTML = `
      <h2 class="etape-formulaire__titre"><span class="visuellement-cache">Étape ${etape + 1} sur ${F.ETAPES.length} : </span>${esc(info.titre)}</h2>
      <p class="etape-formulaire__aide">${esc(info.aide)}</p>
      ${F.champsEtape(etape, valeurs)}
      ${etape === 2 ? M.saisie(medias) : ''}
      ${etape === 3 ? `<div class="recap" id="recap"><h3>Récapitulatif</h3>${recapitulatif()}</div>` : ''}`;
    precedent.hidden = etape === 0;
    erreurEnvoi.textContent = '';
    suivant.innerHTML = etape === 3 ? 'Envoyer<span class="texte-long"> ma demande</span> (simulation)' : 'Continuer';
    majResume();
    if (focus) zone.focus({ preventScroll: true });
    if (focus) zone.closest('.commande__carte').scrollIntoView({ behavior: E.mouvementsReduits() ? 'auto' : 'smooth', block: 'start' });
  }

  /** Construit la liste récapitulative (réutilisée dans le résumé latéral et à la dernière étape). */
  function recapitulatif() {
    const p = E.prestationParId(valeurs.prestation);
    const lignes = [
      ['Prestation', p ? E.libellePrestation(p.id) : 'À choisir'],
      ['Client', valeurs.typeClient || 'Particulier'],
      ['Fréquence', valeurs.frequence || E.FREQUENCES[0]],
      ['Lieu', valeurs.commune ? valeurs.commune : 'À préciser'],
      ['Date souhaitée', valeurs.dateSouhaitee ? E.formaterDate(valeurs.dateSouhaitee) + ' · ' + (valeurs.creneau || 'Indifférent') : 'Non précisée']
    ];
    if (medias.length) lignes.push(['Médias joints', String(medias.length)]);
    return `<dl>${lignes.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
  }

  /** Met à jour le résumé latéral et son visuel. */
  function majResume() {
    resumeListe.innerHTML = recapitulatif().replace(/^<dl>|<\/dl>$/g, '');
    const p = E.prestationParId(valeurs.prestation);
    // Un besoin sans image pertinente affiche son propre emplacement.
    const cle = p?.id || 'aucune';
    if (resumeVisuel.dataset.visuel !== cle) {
      resumeVisuel.dataset.visuel = cle;
      resumeVisuel.innerHTML = E.mediaPrestation(p, { tailles: '(min-width: 1024px) 380px, 100vw' });
    }
  }

  // Mise à jour en direct du résumé pendant la saisie.
  form.addEventListener('input', () => { Object.assign(valeurs, F.lire(form)); majResume(); });
  form.addEventListener('change', () => { Object.assign(valeurs, F.lire(form)); majResume(); });

  /** Met en pause la navigation pendant la lecture des médias ou la sauvegarde. */
  function bloquer(actif) {
    occupe = precedent.disabled = suivant.disabled = actif;
    const groupe = zone.querySelector('.medias-chantier');
    if (groupe) groupe.disabled = actif;
  }

  function majSelection(message) {
    zone.querySelector('#medias-selection').innerHTML = M.liste(medias, true);
    zone.querySelector('#medias-annonce').textContent = message;
    majResume();
  }

  zone.addEventListener('change', async e => {
    if (!e.target.matches('[data-choisir-media]') || occupe || !e.target.files.length) return;
    const choix = Array.from(e.target.files);
    e.target.value = ''; // Autorise la sélection du même fichier après un retrait.
    const retour = zone.querySelector('#medias-erreurs');
    retour.textContent = '';
    zone.querySelector('#medias-annonce').textContent = 'Vérification des fichiers…';
    bloquer(true);
    const erreurs = [];
    try {
      for (const fichier of choix) {
        try { medias.push(await M.preparer(fichier, medias)); }
        catch (erreur) { erreurs.push(`${fichier.name} : ${erreur.message}`); }
      }
      retour.textContent = erreurs.join(' ');
      majSelection(`${medias.length} fichier(s) dans la sélection.`);
    } finally {
      bloquer(false);
    }
  });

  zone.addEventListener('click', e => {
    const capture = e.target.closest('[data-capture-media]');
    if (capture) document.getElementById('media-capture-' + capture.dataset.captureMedia).click();
    const retirer = e.target.closest('[data-retirer-media]');
    if (!retirer) return;
    const index = Number(retirer.dataset.retirerMedia);
    const [media] = medias.splice(index, 1);
    URL.revokeObjectURL(media.url);
    zone.querySelector('#medias-erreurs').textContent = '';
    majSelection(`${media.fichier.name} retiré.`);
    const cible = zone.querySelector(`[data-retirer-media="${Math.min(index, medias.length - 1)}"]`) || zone.querySelector('#medias-fichiers');
    cible.focus();
  });

  precedent.addEventListener('click', () => {
    Object.assign(valeurs, F.lire(form));
    etape = Math.max(0, etape - 1);
    afficherEtape();
  });

  // « Continuer » valide l'étape ; à la dernière étape, enregistre la demande simulée.
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (occupe) return;
    Object.assign(valeurs, F.lire(form));
    const erreurs = E.api.validerCommande(valeurs);
    const champs = F.ETAPES[etape].champs;
    if (!F.afficherErreurs(form, erreurs, champs)) return;
    if (etape < 3) { etape += 1; afficherEtape(); return; }
    erreurEnvoi.textContent = '';
    bloquer(true);
    let commande;
    try {
      const fichiers = medias.map(({ fichier, duree }) => ({ fichier, duree }));
      commande = await E.api.creerCommandeAvecMedias(valeurs, fichiers);
    } catch (erreur) {
      erreurEnvoi.textContent = 'La demande n’a pas pu être enregistrée dans ce navigateur. Les fichiers sélectionnés sont conservés dans le formulaire. Réessayez, ou revenez à l’étape précédente pour les retirer.';
    } finally {
      bloquer(false);
    }
    if (!commande) { suivant.focus(); return; }
    medias.splice(0).forEach(media => URL.revokeObjectURL(media.url));
    afficherConfirmation(commande);
  });

  /** Remplace le formulaire par la confirmation (référence de démonstration). */
  function afficherConfirmation(c) {
    const conf = document.getElementById('confirmation');
    form.hidden = true;
    document.querySelector('.commande__entete').hidden = true;
    conf.hidden = false;
    conf.innerHTML = `
      <div class="confirmation__icone">${icone('valide')}</div>
      <p class="surtitre">Demande reçue · simulation</p>
      <h1>Merci, votre demande est enregistrée.</h1>
      <p class="confirmation__ref">Référence de démonstration : <strong>${esc(c.id)}</strong></p>
      <ol class="confirmation__suite">
        <li><strong>Information interne.</strong> En production, la secrétaire et les deux cogérants seraient informés. Ici, une notification apparaît seulement dans la maquette.</li>
        <li><strong>Confirmation.</strong> L’équipe vous recontacte pour confirmer la date, le tarif et les modalités de règlement.</li>
        <li><strong>Intervention.</strong> L’équipe prévue reçoit les consignes issues de votre demande.</li>
      </ol>
      <p class="notice"><span class="notice__icone">${icone('info')}</span><span>Aucun message n’a été envoyé et aucune donnée n’a quitté votre navigateur.</span></p>
      <div class="confirmation__actions">
        <a class="bouton bouton--bleu" href="index.html">Retour à l’accueil</a>
        <a class="bouton bouton--clair" href="espace.html#/secretariat/commande/${encodeURIComponent(c.id)}">Voir la demande côté secrétariat (démo)</a>
      </div>`;
    conf.focus();
    conf.scrollIntoView({ block: 'start' });
  }

  afficherEtape(false);
})(window);
