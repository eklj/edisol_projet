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
  const { esc, icone } = E;

  const form = document.getElementById('formulaire-commande');
  const zone = document.getElementById('zone-etape');
  const etapier = document.getElementById('etapier');
  const barre = document.getElementById('progression-barre');
  const precedent = document.getElementById('bouton-precedent');
  const suivant = document.getElementById('bouton-suivant');
  const resumeListe = document.getElementById('resume-liste');
  const resumeVisuel = document.getElementById('resume-visuel');

  // Valeurs saisies, conservées d'une étape à l'autre. Préremplissage possible via ?prestation=vitres.
  const parametre = new URLSearchParams(racine.location.search).get('prestation');
  const valeurs = { prestation: E.prestationParId(parametre) ? parametre : undefined };
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
      ${etape === 3 ? `<div class="recap" id="recap"><h3>Récapitulatif</h3>${recapitulatif()}</div>` : ''}`;
    precedent.hidden = etape === 0;
    suivant.innerHTML = etape === 3 ? 'Envoyer<span class="texte-long"> ma demande</span> (simulation)' : 'Continuer';
    majResume();
    if (focus) zone.focus({ preventScroll: true });
    if (focus) zone.closest('.commande__carte').scrollIntoView({ behavior: E.mouvementsReduits() ? 'auto' : 'smooth', block: 'start' });
  }

  /** Construit la liste récapitulative (réutilisée dans le résumé latéral et à la dernière étape). */
  function recapitulatif() {
    const p = E.prestationParId(valeurs.prestation);
    const lignes = [
      ['Prestation', p ? p.titre : 'À choisir'],
      ['Client', valeurs.typeClient || 'Particulier'],
      ['Fréquence', valeurs.frequence || E.FREQUENCES[0]],
      ['Lieu', valeurs.commune ? valeurs.commune : 'À préciser'],
      ['Date souhaitée', valeurs.dateSouhaitee ? E.formaterDate(valeurs.dateSouhaitee) + ' · ' + (valeurs.creneau || 'Indifférent') : 'Non précisée']
    ];
    return `<dl>${lignes.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
  }

  /** Met à jour le résumé latéral et son visuel. */
  function majResume() {
    resumeListe.innerHTML = recapitulatif().replace(/^<dl>|<\/dl>$/g, '');
    const p = E.prestationParId(valeurs.prestation);
    const v = E.VISUELS.find(x => x.id === (p && p.visuel)) || E.VISUELS.find(x => x.id === 'equipe');
    if (resumeVisuel.dataset.visuel !== v.id) {
      resumeVisuel.dataset.visuel = v.id;
      resumeVisuel.innerHTML = E.baliseImage(v, { tailles: '(min-width: 1024px) 380px, 100vw' }) + `<span class="pastille-provisoire">${esc(E.libelleStatut(v))}</span>`;
    }
  }

  // Mise à jour en direct du résumé pendant la saisie.
  form.addEventListener('input', () => { Object.assign(valeurs, F.lire(form)); majResume(); });
  form.addEventListener('change', () => { Object.assign(valeurs, F.lire(form)); majResume(); });

  precedent.addEventListener('click', () => {
    Object.assign(valeurs, F.lire(form));
    etape = Math.max(0, etape - 1);
    afficherEtape();
  });

  // « Continuer » valide l'étape ; à la dernière étape, enregistre la demande simulée.
  form.addEventListener('submit', e => {
    e.preventDefault();
    Object.assign(valeurs, F.lire(form));
    const erreurs = E.api.validerCommande(valeurs);
    const champs = F.ETAPES[etape].champs;
    if (!F.afficherErreurs(form, erreurs, champs)) return;
    if (etape < 3) { etape += 1; afficherEtape(); return; }
    const commande = E.api.creerCommande(valeurs, 'client');
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
