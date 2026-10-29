/* =========================================================================
   ÉDYSOL NC — Vues « bureau » : cogérance et secrétariat
   Tableau de bord, commandes (liste, détail, nouvelle), clients, équipe,
   documents, aperçu du récapitulatif PDF et notifications.
   Chaque vue est une fonction (ctx) qui retourne { titre, html, apres }.
   Données lues via Edysol.api (mode démonstration).
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const O = racine.EdysolOrganisation;
  const vues = E.vues = E.vues || {};

  /* ---------- Fonctions d'accès aux données (lecture seule) ---------- */
  const etat = () => E.api.charger();
  const equipe = id => etat().equipes.find(e => e.id === id);
  const prestation = id => E.prestationParId(id)?.titre || 'À confirmer';
  const interventionsDe = commandeId => etat().interventions.filter(i => i.commandeId === commandeId).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut));

  /** Date affichée dans les listes : première intervention planifiée, sinon date souhaitée. */
  function dateCommande(c) {
    const i = interventionsDe(c.id)[0];
    if (i) return `${E.formaterDate(i.date, 'court')} · ${i.debut}`;
    return c.dateSouhaitee ? `Souhait : ${E.formaterDate(c.dateSouhaitee, 'court')}` : 'Date à convenir';
  }

  /** Décrit l'équipe d'une intervention avec ses membres. */
  function libelleEquipe(id) {
    const eq = equipe(id);
    return eq ? O.decrireOrganisation(eq, null, etat().personnes) : 'Équipe à confirmer';
  }

  /* ---------- Tableau de bord ---------- */
  vues.tableau = ctx => {
    const s = etat();
    const lundi = E.lundiDe(E.aujourdhui());
    const semaine = s.interventions.filter(i => i.date >= lundi && i.date <= E.ajouterJours(lundi, 6));
    const mobilises = new Set(semaine.flatMap(i => equipe(i.equipeId)?.membres || []));
    const aConfirmer = s.commandes.filter(c => c.statut === 'a-confirmer');
    const duJour = s.interventions.filter(i => i.date === E.aujourdhui()).sort((a, b) => a.debut.localeCompare(b.debut));
    const enCours = s.commandes.filter(c => c.statut !== 'terminee').slice(0, 6);
    const titre = ctx.espace === 'cogerance' ? 'Vue d’ensemble' : 'Tableau de bord';
    return {
      titre,
      html: `
        ${ui.entetePage({ titre, sousTitre: ctx.espace === 'cogerance' ? 'Pilotage partagé par les deux cogérants.' : 'Suivi des demandes et du planning.',
          actions: ctx.espace === 'secretariat' ? `<a class="bouton bouton--principal" href="${ctx.lien('nouvelle')}">${icone('plus')}Nouvelle commande</a>` : `<a class="bouton bouton--bleu" href="${ctx.lien('planning')}">${icone('planning')}Ouvrir le planning</a>` })}
        <div class="indicateurs">
          ${ui.carteIndicateur({ libelle: 'Demandes à confirmer', valeur: aConfirmer.length, icone: 'commandes', href: ctx.lien('commandes/a-confirmer'), ton: 'jaune' })}
          ${ui.carteIndicateur({ libelle: 'Interventions cette semaine', valeur: semaine.length, icone: 'planning', href: ctx.lien('planning'), ton: 'bleu' })}
          ${ui.carteIndicateur({ libelle: 'Personnes mobilisées', valeur: mobilises.size, icone: 'equipe', ton: 'vert', note: 'Cette semaine' })}
          ${ui.carteIndicateur({ libelle: 'Notifications non lues', valeur: E.espaces.nonLues(ctx.destinataire), icone: 'cloche', href: ctx.lien('notifications'), ton: 'bleu-clair' })}
        </div>
        <div class="grille-2">
          ${ui.bloc('Demandes à traiter', ui.tableau([
            { titre: 'Référence', rendu: c => `<strong>${esc(c.id)}</strong>` },
            { titre: 'Client', rendu: c => esc(c.client.nom) },
            { titre: 'État', rendu: c => ui.badgeStatut(c.statut) },
            { titre: 'Date', rendu: c => esc(dateCommande(c)) }
          ], enCours, { lien: c => ctx.lien('commande/' + c.id), legende: 'Demandes à traiter' }),
          { actions: `<a class="lien-simple" href="${ctx.lien('commandes')}">Toutes les commandes</a>` })}
          ${ui.bloc('Aujourd’hui', duJour.length ? `<ul class="chronologie">${duJour.map(i => `
              <li class="chronologie__item">
                <span class="chronologie__heure">${esc(i.debut)}<br><small>${esc(i.fin)}</small></span>
                <a class="chronologie__carte" href="${ctx.lien('commande/' + i.commandeId)}">
                  <strong>${esc(i.commandeId)}</strong> ${ui.badgeStatut(i.statut)}
                  <span>${esc(etat().commandes.find(c => c.id === i.commandeId)?.commune || '')} · ${esc(libelleEquipe(i.equipeId))}</span>
                </a>
              </li>`).join('')}</ul>` : '<p class="vide">Aucune intervention aujourd’hui.</p>')}
        </div>
        ${s.renforts.length ? ui.bloc('Besoins de renfort signalés', ui.tableau([
          { titre: 'Commande', rendu: r => esc(r.commandeId) }, { titre: 'Signalé par', rendu: r => esc(E.api.nomPersonne(r.controleuseId)) },
          { titre: 'Besoin', rendu: r => esc(r.texte) }, { titre: 'État', rendu: r => `<span class="badge badge--a-confirmer">${esc(r.etat)}</span>` }
        ], s.renforts, { lien: r => ctx.lien('commande/' + r.commandeId) }) + ui.notice('Sélection des renforts et validation des changements : règles à définir. Aucune affectation automatique.', 'alerte', 'alerte')) : ''}
        ${ui.notice('Chaque nouvelle commande est signalée à la secrétaire et aux deux cogérants. <strong>Dans cette maquette</strong>, il s’agit d’une notification interne simulée : aucun e-mail, SMS ou message WhatsApp n’est envoyé.', 'demo')}`
    };
  };

  /* ---------- Liste des commandes ---------- */
  vues.commandes = ctx => {
    const filtreInitial = ctx.param || '';
    const titre = 'Commandes';
    const rendreListe = (texte, statut) => {
      const t = texte.trim().toLowerCase();
      const lignes = etat().commandes.filter(c => (!statut || c.statut === statut)
        && (!t || [c.id, c.client.nom, c.commune, prestation(c.prestation)].join(' ').toLowerCase().includes(t)));
      return `<p class="compte-resultats" role="status">${lignes.length} commande${lignes.length > 1 ? 's' : ''} · données fictives</p>` + ui.tableau([
        { titre: 'Référence', rendu: c => `<strong>${esc(c.id)}</strong>` },
        { titre: 'Client', rendu: c => `${esc(c.client.nom)}<small class="sous-ligne">${esc(c.client.type)}</small>` },
        { titre: 'Commune', cle: 'commune' },
        { titre: 'Prestation', rendu: c => esc(prestation(c.prestation)) },
        { titre: 'État', rendu: c => ui.badgeStatut(c.statut) },
        { titre: 'Date', rendu: c => esc(dateCommande(c)) },
        { titre: 'Origine', rendu: c => c.source === 'secretaire' ? 'Secrétaire' : 'Site' }
      ], lignes, { lien: c => ctx.lien('commande/' + c.id), vide: 'Aucune commande ne correspond à la recherche.', legende: 'Liste des commandes' });
    };
    return {
      titre,
      html: `
        ${ui.entetePage({ titre, sousTitre: 'Une même référence suit la commande de la demande au compte rendu.',
          actions: ctx.espace === 'secretariat' ? `<a class="bouton bouton--principal" href="${ctx.lien('nouvelle')}">${icone('plus')}Nouvelle commande</a>` : '' })}
        <form class="barre-filtres" role="search" onsubmit="return false">
          <div class="champ champ--recherche">
            <label for="recherche-commande">Rechercher</label>
            <input id="recherche-commande" type="search" placeholder="Référence, client, commune…" autocomplete="off">
          </div>
          <div class="champ">
            <label for="filtre-statut">État</label>
            <select id="filtre-statut">
              <option value="">Tous les états</option>
              ${Object.entries(ui.STATUTS).map(([k, v]) => `<option value="${k}" ${k === filtreInitial ? 'selected' : ''}>${esc(v)}</option>`).join('')}
            </select>
          </div>
        </form>
        <div id="liste-commandes">${rendreListe('', filtreInitial)}</div>`,
      apres(vue) {
        const r = vue.querySelector('#recherche-commande'), s = vue.querySelector('#filtre-statut');
        const maj = () => { vue.querySelector('#liste-commandes').innerHTML = rendreListe(r.value, s.value); };
        r.addEventListener('input', maj);
        s.addEventListener('change', maj);
      }
    };
  };

  /* ---------- Détail d'une commande ---------- */
  vues.commande = ctx => {
    const c = etat().commandes.find(x => x.id === ctx.param);
    if (!c) return { titre: 'Commande introuvable', html: ui.entetePage({ titre: 'Commande introuvable', retour: { href: ctx.lien('commandes'), texte: 'Commandes' } }) };
    const ints = interventionsDe(c.id);
    const crs = etat().comptesRendus.filter(cr => ints.some(i => i.id === cr.interventionId));
    const coord = etat().coordinations.filter(x => x.commandeId === c.id);
    const renforts = etat().renforts.filter(r => r.commandeId === c.id);
    return {
      titre: c.id,
      html: `
        ${ui.entetePage({ titre: `Commande ${c.id}`, retour: { href: ctx.lien('commandes'), texte: 'Commandes' },
          sousTitre: `${ui.badgeStatut(c.statut)} <span class="separateur">·</span> Créée le ${ui.temps(c.creeLe)} <span class="separateur">·</span> ${c.source === 'secretaire' ? 'Saisie par la secrétaire' : 'Demande depuis le site'}`,
          actions: `<a class="bouton bouton--principal" href="${ctx.lien('planning/' + c.id)}">${icone('planning')}${ints.length ? 'Ajouter une affectation' : 'Planifier et affecter'}</a>
                    <a class="bouton bouton--clair" href="${ctx.lien('pdf/' + c.id)}">${icone('documents')}Récapitulatif</a>` })}
        <div class="grille-detail">
          <div class="pile">
            ${ui.bloc('Client et lieu', ui.definitions([
              ['Client', `${esc(c.client.nom)} <small class="sous-ligne">${esc(c.client.type)}</small>`],
              ['Téléphone', esc(c.client.telephone)], ['E-mail', esc(c.client.email || 'Non renseigné')],
              ['Commune', esc(c.commune)], ['Adresse', esc(c.adresse)], ['Accès', esc(c.acces || 'Non précisé')]
            ], true))}
            ${ui.bloc('Demande', ui.definitions([
              ['Prestation', esc(prestation(c.prestation))], ['Description', esc(c.description)],
              ['Date souhaitée', esc(c.dateSouhaitee ? E.formaterDate(c.dateSouhaitee) : 'Non précisée') + ` · ${esc(c.creneau)}<small class="sous-ligne">Souhait du client, pas une confirmation.</small>`],
              ['Fréquence', esc(c.frequence)]
            ], true))}
            ${ui.bloc('Documents et règlement', ui.definitions([
              ['Récapitulatif', `<a class="lien-simple" href="${ctx.lien('pdf/' + c.id)}">Aperçu du récapitulatif (simulation)</a>`],
              ['Montant', ui.aDefinir('À confirmer avec le client')],
              ['Paiement', ui.aDefinir('Modalités à définir avec l’employeur · aucun paiement en ligne')]
            ], true))}
          </div>
          <div class="pile">
            ${ui.bloc('Affectations', (ints.length ? `<ul class="liste-affectations">${ints.map(i => `
              <li><span class="liste-affectations__date">${icone('calendrier')}${esc(E.formaterDate(i.date, 'court'))} · ${esc(i.debut)} à ${esc(i.fin)}</span>
                <strong>${esc(libelleEquipe(i.equipeId))}</strong> ${ui.badgeStatut(i.statut)}</li>`).join('')}</ul>`
              : '<p class="vide">Aucune affectation pour le moment. Les employés recevront les consignes après la planification.</p>'
              ) + (coord.length ? `<p class="coordination-ligne">${icone('bouclier')}Coordination : <strong>${esc(coord.map(x => E.api.nomPersonne(x.controleuseId)).join(', '))}</strong></p>` : '')
              + (renforts.length ? ui.notice(`Renfort signalé : ${esc(renforts[0].texte)} · sélection et validation à définir.`, 'alerte', 'alerte') : '')
              + `<p class="aide-bloc">Validation des affectations, absences et renforts : règles à préciser.</p>`)}
            ${ui.bloc('Comptes rendus', crs.length ? `<ul class="liste-simple">${crs.map(cr => `<li><strong>${esc(cr.id)}</strong> · ${esc(E.api.nomPersonne(cr.employeId))} · ${esc(cr.etat)}<small class="sous-ligne">${esc(cr.observations || '')} ${cr.vehiculeId ? '· Véhicule ' + esc(cr.vehiculeId) : '· Aucun véhicule'}</small></li>`).join('')}</ul>` : '<p class="vide">Aucun compte rendu.</p>')}
            ${ui.bloc('Historique', `<ol class="historique">${[...c.historique].reverse().map(h => `<li>${ui.temps(h.date)}<span>${esc(h.texte)}</span></li>`).join('')}</ol>`)}
          </div>
        </div>`
    };
  };

  /* ---------- Nouvelle commande (secrétaire) : mêmes champs que le site ---------- */
  vues.nouvelle = ctx => {
    const F = E.formulaireCommande;
    return {
      titre: 'Nouvelle commande',
      html: `
        ${ui.entetePage({ titre: 'Créer une commande', sousTitre: 'Saisie au nom d’un client (téléphone ou rendez-vous). Mêmes champs que le formulaire du site.', retour: { href: ctx.lien('commandes'), texte: 'Commandes' } })}
        <form class="formulaire-interne" id="form-nouvelle" novalidate>
          ${F.ETAPES.map((e, i) => `<fieldset class="bloc bloc--formulaire"><legend class="bloc__titre">${i + 1}. ${esc(e.titre)}</legend>${F.champsEtape(i, i === 3 ? { consentement: false } : {}, 'sec')}</fieldset>`).join('')}
          <div class="formulaire-interne__actions">
            <button type="submit" class="bouton bouton--principal">${icone('valide')}Enregistrer la commande (simulation)</button>
            <a class="bouton bouton--clair" href="${ctx.lien('commandes')}">Annuler</a>
          </div>
          <div id="retour-nouvelle" role="alert"></div>
        </form>`,
      apres(vue) {
        const form = vue.querySelector('#form-nouvelle');
        form.addEventListener('submit', e => {
          e.preventDefault();
          const d = F.lire(form);
          const erreurs = E.api.validerCommande(d);
          const tous = F.ETAPES.flatMap(x => x.champs);
          if (!F.afficherErreurs(form, erreurs, tous, 'sec')) {
            vue.querySelector('#retour-nouvelle').innerHTML = ui.notice(`${Object.keys(erreurs).length} champ(s) à corriger.`, 'erreur', 'alerte');
            return;
          }
          const c = E.api.creerCommande(d, 'secretaire');
          ctx.naviguer('commande/' + c.id);
        });
      }
    };
  };

  /* ---------- Clients (déduits des commandes) ---------- */
  vues.clients = ctx => {
    const parClient = new Map();
    for (const c of etat().commandes) {
      const cle = c.client.nom.toLowerCase();
      const fiche = parClient.get(cle) || { nom: c.client.nom, type: c.client.type, commune: c.commune, telephone: c.client.telephone, commandes: [] };
      fiche.commandes.push(c);
      parClient.set(cle, fiche);
    }
    const fiches = [...parClient.values()];
    const rendre = t => ui.tableau([
      { titre: 'Nom', rendu: f => `<strong>${esc(f.nom)}</strong><small class="sous-ligne">${esc(f.type)}</small>` },
      { titre: 'Commune', cle: 'commune' },
      { titre: 'Dernière commande', rendu: f => esc(f.commandes[0].id) },
      { titre: 'Commandes', rendu: f => String(f.commandes.length) },
      { titre: 'Contact', rendu: f => esc(f.telephone) }
    ], fiches.filter(f => !t || (f.nom + ' ' + f.commune).toLowerCase().includes(t.toLowerCase())), { lien: f => ctx.lien('commande/' + f.commandes[0].id), vide: 'Aucun client trouvé.' });
    return {
      titre: 'Clients',
      html: `${ui.entetePage({ titre: 'Clients', sousTitre: 'Liste déduite des commandes (pas de fichier clients séparé dans la maquette).',
          actions: `<a class="bouton bouton--principal" href="${ctx.lien('nouvelle')}">${icone('plus')}Créer une commande client</a>` })}
        <div class="barre-filtres"><div class="champ champ--recherche"><label for="recherche-client">Rechercher un client</label><input id="recherche-client" type="search" placeholder="Nom ou commune…"></div></div>
        <div id="liste-clients">${rendre('')}</div>`,
      apres(vue) { vue.querySelector('#recherche-client').addEventListener('input', e => { vue.querySelector('#liste-clients').innerHTML = rendre(e.target.value); }); }
    };
  };

  /* ---------- Équipe : 4 binômes fixes, solos, 2 contrôleuses ---------- */
  vues.equipe = () => {
    const s = etat();
    const nom = id => E.api.nomPersonne(id);
    const erreurs = O.verifierComposition(s.equipes.filter(e => e.type !== 'controleuse'));
    const binomes = s.equipes.filter(e => e.type === 'binome');
    const solos = s.equipes.filter(e => e.type === 'solo');
    const ctrl = s.personnes.filter(p => p.role === 'controleuse');
    return {
      titre: 'Équipe',
      html: `
        ${ui.entetePage({ titre: 'Équipe', sousTitre: 'Organisation de référence. Noms fictifs.' })}
        ${erreurs.length ? ui.notice(erreurs.map(esc).join('<br>'), 'erreur', 'alerte') : ui.notice('Composition conforme : quatre binômes fixes de deux personnes, employés solos, aucune personne dans deux équipes.', 'succes', 'valide')}
        <h2 class="sous-titre-section">Binômes fixes</h2>
        <ul class="cartes-equipe">${binomes.map((b, i) => `
          <li class="carte-equipe tuile-${i + 1}"><span class="carte-equipe__type">${icone('equipe')}Binôme fixe</span><strong>${esc(b.nom)}</strong>
            <span>${b.membres.map(nom).map(esc).join(' + ')}</span><small>Toujours affectés ensemble.</small></li>`).join('')}</ul>
        <div class="grille-2">
          ${ui.bloc('Employés solos', `<ul class="liste-simple">${solos.map(e => `<li><strong>${esc(nom(e.membres[0]))}</strong><small class="sous-ligne">Ménage sur son chantier, seul.</small></li>`).join('')}</ul>`)}
          ${ui.bloc('Deux contrôleuses', `<ul class="liste-simple">${ctrl.map(p => `<li><strong>${esc(p.nom)}</strong><small class="sous-ligne">Employée de ménage · encadrement des équipes</small></li>`).join('')}</ul>
            <p class="aide-bloc">Elles encadrent les équipes sous les ordres de la secrétaire et des cogérants, et coordonnent les gros chantiers. Coordonner ne signifie pas être disponible pour du ménage : leur planning est vérifié séparément.</p>`)}
        </div>
        ${ui.bloc('Règles en attente de décision', `<ul class="liste-regles">${O.REGLES_EN_ATTENTE.map(r => `<li>${ui.aDefinir(r)}</li>`).join('')}</ul>
          <p class="aide-bloc">Aucun remplacement automatique ni passage automatique en solo n’est programmé.</p>`)}`
    };
  };

  /* ---------- Documents ---------- */
  vues.documents = ctx => {
    const s = etat();
    const docs = [
      ...s.commandes.map(c => ({ type: 'Récapitulatif de commande', ref: c.id, date: c.creeLe, href: ctx.lien('pdf/' + c.id) })),
      ...s.comptesRendus.map(cr => ({ type: 'Compte rendu d’intervention', ref: cr.id, date: cr.creeLe, href: ctx.lien('commande/' + s.interventions.find(i => i.id === cr.interventionId)?.commandeId) }))
    ].sort((a, b) => b.date.localeCompare(a.date));
    return {
      titre: 'Documents',
      html: `${ui.entetePage({ titre: 'Documents', sousTitre: 'Chaque document est une restitution des données enregistrées.' })}
        ${ui.tableau([
          { titre: 'Document', rendu: d => `<strong>${esc(d.type)}</strong>` }, { titre: 'Référence', cle: 'ref' },
          { titre: 'Création', rendu: d => ui.temps(d.date) }, { titre: 'Format', rendu: () => 'Aperçu HTML' }
        ], docs, { lien: d => d.href, legende: 'Documents' })}
        ${ui.notice('La commande est la source des données. Le PDF n’en est qu’une restitution ; les consignes aux employés proviennent directement de la commande, sans relire le PDF. La génération réelle de PDF reste à développer.', 'info')}`
    };
  };

  /* ---------- Aperçu du récapitulatif (simulation de PDF) ---------- */
  vues.pdf = ctx => {
    const c = etat().commandes.find(x => x.id === ctx.param);
    if (!c) return { titre: 'Introuvable', html: ui.entetePage({ titre: 'Commande introuvable' }) };
    return {
      titre: 'Récapitulatif ' + c.id,
      html: `${ui.entetePage({ titre: 'Récapitulatif de commande', retour: { href: ctx.lien('commande/' + c.id), texte: c.id },
          actions: `<button type="button" class="bouton bouton--clair" data-imprimer>${icone('imprimer')}Imprimer l’aperçu</button>` })}
        ${ui.notice('Aperçu généré dans le navigateur à partir des données fictives. L’impression est locale : aucun fichier n’est envoyé.', 'demo')}
        <article class="document-pdf" aria-label="Aperçu du récapitulatif">
          <header class="document-pdf__entete"><img src="assets/logo/edysol-logo.svg" alt="ÉDYSOL" width="819" height="425"><div><p class="document-pdf__type">Récapitulatif de commande</p><p class="document-pdf__ref">${esc(c.id)} · ${esc(ui.STATUTS[c.statut])}</p></div></header>
          ${ui.definitions([
            ['Client', c.client.nom + ' (' + c.client.type + ')'], ['Téléphone', c.client.telephone], ['Commune', c.commune], ['Adresse', c.adresse],
            ['Prestation', prestation(c.prestation)], ['Description', c.description],
            ['Date souhaitée', (c.dateSouhaitee ? E.formaterDate(c.dateSouhaitee) : 'Non précisée') + ', ' + c.creneau.toLowerCase()],
            ['Prix et règlement', 'À confirmer']
          ])}
          <footer class="document-pdf__pied">Ce document récapitule une demande. Il ne constitue pas une facture. Exemple fictif · ÉDYSOL NC · ${esc(E.formaterHorodatage(new Date().toISOString()))}</footer>
        </article>`,
      apres(vue) { vue.querySelector('[data-imprimer]').addEventListener('click', () => racine.print()); }
    };
  };

  /* ---------- Notifications (tous les espaces) ---------- */
  vues.notifications = ctx => {
    const liste = etat().notifications.filter(n => n.pour.includes(ctx.destinataire));
    return {
      titre: 'Notifications',
      html: `${ui.entetePage({ titre: 'Notifications', sousTitre: 'Historique conservé dans cet espace.',
          actions: liste.some(n => !n.lu.includes(ctx.destinataire)) ? '<button type="button" class="bouton bouton--clair bouton--petit" data-tout-lire>Tout marquer comme lu</button>' : '' })}
        ${ui.notice('Notifications internes <strong>simulées</strong> : elles s’affichent uniquement dans la maquette. Aucun e-mail, SMS ou WhatsApp n’est envoyé. Le canal réel reste à valider.', 'demo')}
        ${liste.length ? `<ul class="notifications">${liste.map(n => {
          const lue = n.lu.includes(ctx.destinataire);
          return `<li class="notification${lue ? '' : ' est-non-lue'}">
            <span class="notification__point" aria-hidden="true"></span>
            <div class="notification__corps"><strong>${esc(n.titre)}</strong><span>${esc(n.texte)}</span>${ui.temps(n.date)}${lue ? '' : '<span class="visuellement-cache">(non lue)</span>'}</div>
            <div class="notification__actions">
              ${n.lien && E.vues[n.lien.split('/')[0]] ? `<a class="bouton bouton--clair bouton--petit" href="${ctx.lien(n.lien)}" data-lire="${esc(n.id)}">Consulter</a>` : ''}
              ${lue ? '' : `<button type="button" class="bouton bouton--discret bouton--petit" data-lire="${esc(n.id)}">Marquer comme lue</button>`}
            </div></li>`;
        }).join('')}</ul>` : '<p class="vide">Aucune notification.</p>'}`,
      apres(vue) {
        vue.addEventListener('click', e => {
          const id = e.target.closest('[data-lire]')?.dataset.lire;
          if (id) { E.api.marquerLue(id, ctx.destinataire); if (e.target.tagName === 'BUTTON') ctx.rafraichir(); }
          if (e.target.closest('[data-tout-lire]')) { liste.forEach(n => E.api.marquerLue(n.id, ctx.destinataire)); ctx.rafraichir(); }
        });
      }
    };
  };

  E.donneesVues = { etat, equipe, prestation, interventionsDe, libelleEquipe, dateCommande };
})(window);
