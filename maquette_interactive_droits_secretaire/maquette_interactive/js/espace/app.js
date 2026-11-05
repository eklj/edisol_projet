/* =========================================================================
   ÉDYSOL NC — Application des espaces internes (routeur et mise en page)
   Adresses : espace.html#/<espace>/<vue>/<paramètre>
     espaces : cogerance, secretariat, controleuse, employe
   Les anciens identifiants de la maquette V1 (#g-planning, #su-accueil…)
   restent valables : ils sont redirigés vers les nouvelles vues.
   ATTENTION : le choix d'un espace est un sélecteur de DÉMONSTRATION.
   Ce n'est pas une authentification ; les droits réels devront être
   contrôlés par un serveur (voir COMPTABILITE_STOCKS_VEHICULES.md).
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const vues = E.vues = E.vues || {};

  /** Définition des espaces : libellé, type de mise en page et menu. */
  const ESPACES = {
    cogerance: {
      // Espace commun aux deux cogérants ; chacun garde sa propre boîte de réception (role: 'cogerant').
      libelle: 'Cogérance', type: 'bureau', role: 'cogerant', description: 'Espace commun aux deux cogérants : suivi de l’activité et concertation.',
      menu: [
        { vue: 'tableau', texte: 'Vue d’ensemble', icone: 'accueil' },
        { vue: 'commandes', texte: 'Commandes', icone: 'commandes', actifPour: ['commande', 'pdf'] },
        { vue: 'planning', texte: 'Planning et affectations', icone: 'planning' },
        { vue: 'carte', texte: 'Suivi des véhicules', icone: 'vehicule' },
        { vue: 'equipe', texte: 'Équipe', icone: 'equipe' },
        { vue: 'documents', texte: 'Documents', icone: 'documents' },
        { vue: 'notifications', texte: 'Notifications', icone: 'cloche', compteur: true },
        { vue: 'comptabilite', texte: 'Comptabilité', icone: 'comptabilite', actifPour: ['stocks', 'mouvements', 'inventaire', 'vehicules', 'releves'] }
      ]
    },
    secretariat: {
      libelle: 'Secrétariat', type: 'bureau', role: 'secretaire', description: 'Saisie des commandes, planning et suivi administratif.',
      menu: [
        { vue: 'tableau', texte: 'Tableau de bord', icone: 'accueil' },
        { vue: 'commandes', texte: 'Commandes', icone: 'commandes', actifPour: ['commande', 'pdf'] },
        { vue: 'nouvelle', texte: 'Nouvelle commande', icone: 'plus' },
        { vue: 'planning', texte: 'Planning et affectations', icone: 'planning' },
        { vue: 'carte', texte: 'Suivi des véhicules', icone: 'vehicule' },
        { vue: 'clients', texte: 'Clients', icone: 'utilisateur' },
        { vue: 'notifications', texte: 'Notifications', icone: 'cloche', compteur: true },
        { vue: 'comptabilite', texte: 'Comptabilité', icone: 'comptabilite', actifPour: ['stocks', 'mouvements', 'inventaire', 'vehicules', 'releves'] }
      ]
    },
    controleuse: {
      libelle: 'Contrôleuses', type: 'terrain', role: 'controleuse', description: 'Employées de ménage qui encadrent les équipes.',
      menu: [
        { vue: 'activites', texte: 'Activités', icone: 'accueil' },
        { vue: 'interventions', texte: 'Prestations', icone: 'balai', actifPour: ['intervention', 'compte-rendu'] },
        { vue: 'coordination', texte: 'Coordination', icone: 'equipe' },
        { vue: 'notifications', texte: 'Alertes', icone: 'cloche', compteur: true }
      ]
    },
    employe: {
      libelle: 'Employés', type: 'terrain', role: 'employe', description: 'Interventions affectées, consignes et comptes rendus.',
      menu: [
        { vue: 'interventions', texte: 'Missions', icone: 'planning', actifPour: ['intervention', 'compte-rendu'] },
        { vue: 'notifications', texte: 'Notifications', icone: 'cloche', compteur: true }
      ]
    }
  };

  /** Correspondance des écrans de la maquette V1 vers les nouvelles adresses. */
  const ALIAS_V1 = {
    'connexion': '/', 'g-dashboard': '/cogerance/tableau', 'g-commandes': '/cogerance/commandes', 'g-detail': '/cogerance/commande/EDY-2026-042',
    'g-planning': '/cogerance/planning', 'g-notifications': '/cogerance/notifications', 'g-equipe': '/cogerance/equipe', 'g-documents': '/cogerance/documents',
    'g-pdf': '/cogerance/pdf/EDY-2026-042', 'g-comptabilite': '/cogerance/comptabilite', 'g-stocks': '/cogerance/stocks', 'g-mouvements': '/cogerance/mouvements',
    'g-inventaire': '/cogerance/inventaire', 'g-vehicules': '/cogerance/vehicules', 'g-releves': '/cogerance/releves/V-DÉMO-01',
    's-dashboard': '/secretariat/tableau', 's-commandes': '/secretariat/commandes', 's-detail': '/secretariat/commande/EDY-2026-042', 's-formulaire': '/secretariat/nouvelle',
    's-planning': '/secretariat/planning', 's-clients': '/secretariat/clients', 's-notifications': '/secretariat/notifications', 's-comptabilite': '/secretariat/comptabilite',
    's-stocks': '/secretariat/stocks', 's-mouvements': '/secretariat/mouvements', 's-inventaire': '/secretariat/inventaire', 's-vehicules': '/secretariat/vehicules', 's-releves': '/secretariat/releves/V-DÉMO-01',
    'e-jour': '/employe/interventions', 'e-detail': '/employe/intervention/INT-3', 'e-solo': '/employe/intervention/INT-4', 'e-compterendu': '/employe/compte-rendu/INT-3',
    'e-notifications': '/employe/notifications', 'su-accueil': '/controleuse/activites', 'su-chantier': '/controleuse/coordination/EDY-2026-045'
  };
  const ALIAS_PUBLICS = { 'p-accueil': 'index.html', 'p-prestations': 'index.html#prestations', 'p-entreprise': 'index.html#entreprise', 'p-contact': 'index.html#contact', 'p-commande': 'commande.html', 'p-confirmation': 'commande.html' };
  // Personne à présélectionner pour certains anciens écrans (binôme / solo).
  const PERSONNE_ALIAS = { 'e-detail': 'A', 'e-compterendu': 'A', 'e-jour': 'A', 'e-solo': 'C', 'su-accueil': 'CT1', 'su-chantier': 'CT1' };

  const app = document.getElementById('app');
  let vueCourante = null; // { rendu, ctx } de la vue affichée

  /**
   * Personne fictive consultée dans un espace (mémorisée dans ce navigateur).
   * SÉLECTEUR DE DÉMONSTRATION : en production, l'identité viendra de la session serveur.
   */
  function personnesDe(espace) {
    return E.api.charger().personnes.filter(p => p.role === ESPACES[espace].role);
  }
  function personneCourante(espace) {
    const choix = E.stockage.lire('edysol-personne-' + espace);
    const possibles = personnesDe(espace);
    return possibles.find(p => p.id === choix) || possibles[0];
  }
  function choisirPersonne(espace, id) { E.stockage.ecrire('edysol-personne-' + espace, id); }

  /** Nombre de notifications non lues pour un destinataire (simple lecture : aucun statut modifié). */
  function nonLues(destinataire) {
    return E.api.nonLues(destinataire);
  }

  /** Destinataire des notifications : toujours une personne (plus de boîte partagée par espace). */
  function destinataire(espace, personne) {
    return 'personne:' + personne.id;
  }

  /** Sélecteur de personne (démonstration) ; une seule option si l'espace n'a qu'une personne. */
  function selecteurPersonne(espace, personne, classe) {
    return `<label class="${classe}"><span>Personne (démo)</span>
        <select data-action="changer-personne">${personnesDe(espace).map(p => `<option value="${esc(p.id)}" ${p.id === personne.id ? 'selected' : ''}>${esc(p.nom)}</option>`).join('')}</select>
      </label>`;
  }

  /** Analyse l'adresse courante. Retour : { espace, vue, param } ou null pour l'accueil des espaces. */
  function lireRoute() {
    let hash = decodeURIComponent(racine.location.hash.replace(/^#/, ''));
    if (ALIAS_PUBLICS[hash]) { racine.location.replace(ALIAS_PUBLICS[hash]); return 'redirection'; }
    if (ALIAS_V1[hash] !== undefined) {
      if (PERSONNE_ALIAS[hash]) choisirPersonne(hash.startsWith('su-') ? 'controleuse' : 'employe', PERSONNE_ALIAS[hash]);
      racine.location.replace('#' + ALIAS_V1[hash]);
      return 'redirection';
    }
    // « ?lecture=N-12 » : la vue est ouverte depuis une notification à enregistrer comme lue
    // UNIQUEMENT si la vue se charge correctement (voir afficher()).
    const [chemin, requete = ''] = hash.split('?');
    const lecture = new URLSearchParams(requete).get('lecture');
    const [espace, vue, ...reste] = chemin.replace(/^\//, '').split('/');
    if (!ESPACES[espace]) return null;
    return { espace, vue: vue || ESPACES[espace].menu[0].vue, param: reste.join('/'), lecture };
  }

  /** Page d'accueil des espaces : choix du rôle (sélecteur de démonstration, pas une connexion). */
  function afficherAccueil() {
    if (vueCourante && vueCourante.rendu.detruire) { try { vueCourante.rendu.detruire(); } catch (e) { console.error(e); } }
    vueCourante = null;
    document.title = 'Espaces internes · ÉDYSOL NC (maquette)';
    app.className = 'app app--accueil';
    app.innerHTML = `
      <main class="accueil-espaces" id="contenu">
        <div class="accueil-espaces__marque">
          <a href="index.html" class="plaque-logo accueil-espaces__logo" aria-label="Retour au site public"><img src="assets/logo/edysol-logo.svg" alt="ÉDYSOL Prestige nettoyage" width="819" height="425"></a>
          <h1>Espaces internes</h1>
          <p>Choisissez un espace pour parcourir la maquette.</p>
          ${ui.notice('<strong>Sélecteur de démonstration.</strong> Il remplace l’écran de connexion : aucun compte, aucun mot de passe, aucune vérification des droits. Dans chaque espace, une liste permet de choisir la personne (par exemple Cogérant 1 ou Cogérant 2), chacune avec sa boîte de réception. Toutes les données sont fictives et restent dans ce navigateur.', 'demo', 'bouclier')}
        </div>
        <ul class="choix-espaces">
          ${Object.entries(ESPACES).map(([id, e], i) => `
            <li><a class="choix-espace tuile-${i + 1} choix-espace--${id}" href="#/${id}">
              <span class="choix-espace__icone">${icone({ cogerance: 'etoile', secretariat: 'commandes', controleuse: 'bouclier', employe: 'balai' }[id])}</span>
              <span class="choix-espace__texte"><strong>${esc(e.libelle)}</strong><span>${esc(e.description)}</span></span>
              <span class="choix-espace__type">${e.type === 'terrain' ? 'Mobile' : 'Bureau'}</span>
            </a></li>`).join('')}
        </ul>
        <div class="accueil-espaces__pied">
          <a class="bouton bouton--discret" href="index.html">${icone('gauche')}Retour au site public</a>
          <button type="button" class="bouton bouton--discret" data-action="reinitialiser">${icone('rafraichir')}Réinitialiser les données de démo</button>
        </div>
      </main>`;
    app.querySelector('h1').focus();
  }

  /** Construit le menu d'un espace (barre latérale ou barre d'onglets). */
  function menuHtml(espace, vueActive, personne) {
    const cible = destinataire(espace, personne);
    return ESPACES[espace].menu.map(m => {
      const actif = m.vue === vueActive || (m.actifPour || []).includes(vueActive);
      const n = m.compteur ? nonLues(cible) : 0;
      return `<li><a class="menu__lien" href="#/${espace}/${m.vue}" ${actif ? 'aria-current="page"' : ''}>
          ${icone(m.icone)}<span class="menu__texte">${esc(m.texte)}</span>${n ? `<span class="menu__compteur"><span aria-hidden="true">${n}</span><span class="visuellement-cache">, ${n} non lue${n > 1 ? 's' : ''}</span></span>` : ''}
        </a></li>`;
    }).join('');
  }

  /** Affiche une vue dans la mise en page de son espace. */
  function afficher(route) {
    // La vue précédente libère ses ressources (carte, minuteries, abonnements).
    if (vueCourante && vueCourante.rendu.detruire) {
      try { vueCourante.rendu.detruire(); } catch (e) { console.error(e); }
    }
    vueCourante = null;
    const conf = ESPACES[route.espace];
    const fabrique = vues[route.vue];
    const personne = personneCourante(route.espace);
    const ctx = {
      espace: route.espace, vue: route.vue, param: route.param, conf, personne,
      role: route.espace, destinataire: destinataire(route.espace, personne),
      lien: chemin => `#/${route.espace}/${chemin}`,
      naviguer: chemin => { racine.location.hash = `#/${route.espace}/${chemin}`; },
      rafraichir: () => afficher({ ...route, lecture: null })
    };
    let rendu;
    try {
      rendu = fabrique ? fabrique(ctx) : { titre: 'Écran introuvable', html: ui.entetePage({ titre: 'Écran introuvable' }) + ui.notice('Cet écran n’existe pas dans la maquette.', 'alerte', 'alerte') };
    } catch (erreur) {
      console.error(erreur);
      rendu = { titre: 'Erreur', html: ui.entetePage({ titre: 'Erreur d’affichage' }) + ui.notice(esc(erreur.message), 'erreur', 'alerte') };
    }
    document.title = `${rendu.titre} · ${conf.libelle} · ÉDYSOL NC (maquette)`;
    const autresEspaces = Object.entries(ESPACES).map(([id, e]) => `<option value="${id}" ${id === route.espace ? 'selected' : ''}>${esc(e.libelle)}</option>`).join('');

    if (conf.type === 'bureau') {
      app.className = 'app app--bureau';
      app.innerHTML = `
        <a class="lien-evitement" href="#vue">Aller au contenu</a>
        <aside class="laterale" id="laterale" aria-label="Menu ${esc(conf.libelle)}">
          <div class="laterale__haut">
            <a class="plaque-logo laterale__logo" href="#/" aria-label="Changer d’espace"><img src="assets/logo/edysol-logo.svg" alt="ÉDYSOL" width="819" height="425"></a>
            <button type="button" class="bouton-icone laterale__fermer" data-action="fermer-menu" aria-label="Fermer le menu">${icone('fermer')}</button>
          </div>
          <p class="laterale__espace">${esc(conf.libelle)}</p>
          <nav aria-label="Navigation de l’espace"><ul class="menu">${menuHtml(route.espace, route.vue, personne)}</ul></nav>
          <div class="laterale__bas">
            ${selecteurPersonne(route.espace, personne, 'laterale__changer')}
            <label class="laterale__changer"><span>Espace (démo)</span>
              <select data-action="changer-espace">${autresEspaces}</select>
            </label>
            <button type="button" class="bouton bouton--discret bouton--petit" data-action="reinitialiser">${icone('rafraichir')}Réinitialiser la démo</button>
            <a class="bouton bouton--discret bouton--petit" href="index.html">${icone('sortie')}Site public</a>
          </div>
        </aside>
        <div class="voile" data-action="fermer-menu" hidden></div>
        <div class="app__principal">
          <header class="barre-haute">
            <button type="button" class="bouton-icone barre-haute__menu" data-action="ouvrir-menu" aria-controls="laterale" aria-expanded="false" aria-label="Ouvrir le menu">${icone('menu')}</button>
            <p class="barre-haute__date">${icone('calendrier')}<span>${esc(E.formaterDate(E.aujourdhui()))}</span><span class="barre-haute__fuseau">· heure de Nouvelle-Calédonie</span></p>
            <div class="barre-haute__droite">
              ${ui.badgeDemo('Données fictives')}
              <a class="bouton-icone barre-haute__cloche" id="cloche" href="#/${route.espace}/notifications">${clocheHtml(ctx.destinataire)}</a>
              <span class="compte-demo">${icone('utilisateur')}<span>${esc(personne.nom)} · démo</span></span>
            </div>
          </header>
          <main class="vue" id="vue" tabindex="-1">${rendu.html}</main>
        </div>`;
    } else {
      const possibles = personnesDe(route.espace);
      app.className = 'app app--terrain';
      app.innerHTML = `
        <a class="lien-evitement" href="#vue">Aller au contenu</a>
        <header class="terrain-haut">
          <a class="plaque-logo terrain-haut__logo" href="#/" aria-label="Changer d’espace"><img src="assets/logo/edysol-logo.svg" alt="ÉDYSOL" width="819" height="425"></a>
          <div class="terrain-haut__texte">
            <p class="terrain-haut__espace">Espace ${esc(conf.libelle.toLowerCase().replace(/s$/, ''))}</p>
            <label class="terrain-haut__personne">
              <span class="visuellement-cache">Personne consultée (démonstration)</span>
              <select data-action="changer-personne">${possibles.map(p => `<option value="${esc(p.id)}" ${p.id === personne.id ? 'selected' : ''}>${esc(p.nom)}</option>`).join('')}</select>
            </label>
          </div>
          <a class="bouton-icone terrain-haut__quitter" href="#/" aria-label="Quitter l’espace (retour au choix)">${icone('sortie')}</a>
        </header>
        <p class="terrain-demo">${ui.badgeDemo('Démo')} Personne choisie dans la liste : ce n’est pas une connexion.</p>
        <main class="vue vue--terrain" id="vue" tabindex="-1">${rendu.html}</main>
        <nav class="onglets" aria-label="Navigation de l’espace"><ul class="menu menu--onglets">${menuHtml(route.espace, route.vue, personne)}</ul></nav>`;
    }
    E.injecterIcones && E.injecterIcones(app);
    vueCourante = { rendu, ctx };
    try {
      if (rendu.apres) rendu.apres(app.querySelector('#vue'), ctx);
    } catch (erreur) {
      // Une erreur pendant l'affichage interdit d'enregistrer une lecture.
      console.error(erreur);
      rendu.contenuCharge = false;
    }
    enregistrerLectureSiOuverte(route, rendu, ctx);
  }

  /**
   * Enregistre la lecture d'une notification APRÈS un affichage réussi :
   * - ouverture d'un détail (commande, intervention…) via « ?lecture=ID » ;
   * - ouverture du message lui-même (vue « notification »).
   * Un écran introuvable, une erreur ou un accès refusé laissent contenuCharge à faux :
   * aucune lecture n'est alors enregistrée. La commande associée n'est jamais modifiée.
   */
  function enregistrerLectureSiOuverte(route, rendu, ctx) {
    let resultat = null;
    if (route.lecture) {
      resultat = E.api.enregistrerLecture(route.lecture, ctx.destinataire,
        { type: 'detail', chemin: `${route.vue}/${route.param}`, contenuCharge: rendu.contenuCharge === true });
      // On retire « ?lecture » de l'adresse sans recharger la vue.
      history.replaceState(null, '', `#/${route.espace}/${route.vue}${route.param ? '/' + route.param : ''}`);
    } else if (rendu.messageOuvert) {
      resultat = E.api.enregistrerLecture(rendu.messageOuvert, ctx.destinataire, { type: 'message', contenuCharge: rendu.contenuCharge === true });
    }
    if (resultat && rendu.apresLecture) rendu.apresLecture(app.querySelector('#vue'), resultat);
    majCompteurs();
  }

  /** Contenu de la cloche : icône, pastille et texte accessible avec le nombre de non lues. */
  function clocheHtml(dest) {
    const n = nonLues(dest);
    return `${icone('cloche')}<span class="visuellement-cache">Notifications : ${n} non lue${n > 1 ? 's' : ''}</span>${n ? `<span class="pastille-compteur" aria-hidden="true">${n}</span>` : ''}`;
  }

  /** Met à jour les compteurs (menu et cloche) sans réafficher la vue ni changer le défilement. */
  function majCompteurs() {
    if (!vueCourante) return;
    const { ctx } = vueCourante;
    const menu = app.querySelector('.menu');
    if (menu) menu.innerHTML = menuHtml(ctx.espace, ctx.vue, ctx.personne);
    const cloche = app.querySelector('#cloche');
    if (cloche) cloche.innerHTML = clocheHtml(ctx.destinataire);
  }

  // Données modifiées (cette page ou un autre onglet du même navigateur) :
  // compteurs à jour et, si la vue le prévoit, insertion douce des nouveautés.
  document.addEventListener('edysol:donnees', e => {
    majCompteurs();
    if (vueCourante && vueCourante.rendu.surDonnees) vueCourante.rendu.surDonnees(app.querySelector('#vue'), e.detail || {});
  });

  /** Point d'entrée : lit l'adresse et affiche la vue, puis place le focus sur le titre. */
  function router(focus = true) {
    const route = lireRoute();
    if (route === 'redirection') return;
    if (!route) afficherAccueil(); else afficher(route);
    if (focus && route) {
      const titre = app.querySelector('.page-entete__titre');
      if (titre) titre.focus({ preventScroll: true });
      racine.scrollTo(0, 0);
    }
  }

  // Interactions communes (délégation) : menu mobile, changement d'espace/personne, réinitialisation.
  app.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const laterale = document.getElementById('laterale');
    if (action === 'ouvrir-menu' && laterale) {
      laterale.classList.add('est-ouverte');
      app.querySelector('.voile').hidden = false;
      app.querySelector('.barre-haute__menu').setAttribute('aria-expanded', 'true');
      laterale.querySelector('.menu__lien').focus();
    }
    if (action === 'fermer-menu' && laterale) {
      laterale.classList.remove('est-ouverte');
      app.querySelector('.voile').hidden = true;
      app.querySelector('.barre-haute__menu').setAttribute('aria-expanded', 'false');
      app.querySelector('.barre-haute__menu').focus();
    }
    if (action === 'reinitialiser') {
      E.api.reinitialiser();
      router(false);
      const zone = app.querySelector('#vue') || app.querySelector('main');
      zone.insertAdjacentHTML('afterbegin', ui.notice('Données de démonstration réinitialisées.', 'succes', 'valide'));
    }
    // Clic sur une ligne de tableau : même effet que le lien de la première cellule.
    const ligne = e.target.closest('tr.ligne-cliquable');
    if (ligne && !e.target.closest('a, button, input, select')) racine.location.hash = ligne.dataset.href;
  });
  app.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('laterale')?.classList.contains('est-ouverte')) {
      app.querySelector('[data-action="fermer-menu"]').click();
    }
  });
  app.addEventListener('change', e => {
    const action = e.target.dataset.action;
    if (action === 'changer-espace') racine.location.hash = '#/' + e.target.value;
    if (action === 'changer-personne') {
      const route = lireRoute();
      choisirPersonne(route.espace, e.target.value);
      // Bureau : on reste sur la même vue (sans paramètre). Terrain : retour à la liste,
      // l'intervention ouverte peut ne pas concerner la nouvelle personne.
      const vue = ESPACES[route.espace].type === 'bureau' ? route.vue : ESPACES[route.espace].menu[0].vue;
      history.replaceState(null, '', `#/${route.espace}/${vue}`);
      router(false);
    }
  });

  // Démonstration : suppression des fichiers joints orphelins (transfert interrompu ou commande disparue).
  if (E.piecesJointesLocales) E.piecesJointesLocales.nettoyerOrphelins(E.api.charger().commandes.map(c => c.id)).catch(() => {});

  racine.addEventListener('hashchange', () => router());
  E.espaces = { ESPACES, router, nonLues, majCompteurs };
  router(false);
})(window);
