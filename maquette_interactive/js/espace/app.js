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
      libelle: 'Cogérance', type: 'bureau', destinataire: 'cogerance', description: 'Pilotage de l’activité par les deux cogérants.',
      menu: [
        { vue: 'tableau', texte: 'Vue d’ensemble', icone: 'accueil' },
        { vue: 'commandes', texte: 'Commandes', icone: 'commandes', actifPour: ['commande', 'pdf'] },
        { vue: 'planning', texte: 'Planning', icone: 'planning' },
        { vue: 'equipe', texte: 'Équipe', icone: 'equipe' },
        { vue: 'documents', texte: 'Documents', icone: 'documents' },
        { vue: 'notifications', texte: 'Notifications', icone: 'cloche', compteur: true },
        { vue: 'comptabilite', texte: 'Comptabilité', icone: 'comptabilite', actifPour: ['stocks', 'mouvements', 'inventaire', 'vehicules', 'releves'] }
      ]
    },
    secretariat: {
      libelle: 'Secrétariat', type: 'bureau', destinataire: 'secretariat', description: 'Saisie des commandes, planning et suivi administratif.',
      menu: [
        { vue: 'tableau', texte: 'Tableau de bord', icone: 'accueil' },
        { vue: 'commandes', texte: 'Commandes', icone: 'commandes', actifPour: ['commande', 'pdf'] },
        { vue: 'nouvelle', texte: 'Nouvelle commande', icone: 'plus' },
        { vue: 'planning', texte: 'Planning', icone: 'planning' },
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

  /** Personne fictive consultée dans les espaces terrain (mémorisée pour la session de démo). */
  function personneCourante(espace) {
    const cle = 'edysol-personne-' + espace;
    const etat = E.api.charger();
    const role = ESPACES[espace].role;
    const choix = E.stockage.lire(cle);
    const possibles = etat.personnes.filter(p => p.role === role || (role === 'employe' && p.role === 'employe'));
    return possibles.find(p => p.id === choix) || possibles[0];
  }
  function choisirPersonne(espace, id) { E.stockage.ecrire('edysol-personne-' + espace, id); }

  /** Nombre de notifications non lues pour un destinataire. */
  function nonLues(destinataire) {
    return E.api.charger().notifications.filter(n => n.pour.includes(destinataire) && !n.lu.includes(destinataire)).length;
  }

  /** Destinataire des notifications pour le contexte courant (espace ou personne). */
  function destinataire(espace, personne) {
    return ESPACES[espace].destinataire || ('personne:' + personne.id);
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
    const [espace, vue, ...reste] = hash.replace(/^\//, '').split('/');
    if (!ESPACES[espace]) return null;
    return { espace, vue: vue || ESPACES[espace].menu[0].vue, param: reste.join('/') };
  }

  /** Page d'accueil des espaces : choix du rôle (sélecteur de démonstration, pas une connexion). */
  function afficherAccueil() {
    document.title = 'Espaces internes · ÉDYSOL NC (maquette)';
    app.className = 'app app--accueil';
    app.innerHTML = `
      <main class="accueil-espaces" id="contenu">
        <div class="accueil-espaces__marque">
          <a href="index.html" class="plaque-logo accueil-espaces__logo" aria-label="Retour au site public"><img src="assets/logo/edysol-logo.svg" alt="ÉDYSOL Prestige nettoyage" width="819" height="425"></a>
          <h1>Espaces internes</h1>
          <p>Choisissez un espace pour parcourir la maquette.</p>
          ${ui.notice('<strong>Sélecteur de démonstration.</strong> Il remplace l’écran de connexion : aucun compte, aucun mot de passe, aucune vérification des droits. Toutes les données sont fictives et restent dans ce navigateur.', 'demo', 'bouclier')}
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
          ${icone(m.icone)}<span class="menu__texte">${esc(m.texte)}</span>${n ? `<span class="menu__compteur" aria-label="${n} non lue${n > 1 ? 's' : ''}">${n}</span>` : ''}
        </a></li>`;
    }).join('');
  }

  /** Affiche une vue dans la mise en page de son espace. */
  function afficher(route) {
    const conf = ESPACES[route.espace];
    const fabrique = vues[route.vue];
    const personne = conf.type === 'terrain' ? personneCourante(route.espace) : null;
    const ctx = {
      espace: route.espace, vue: route.vue, param: route.param, conf, personne,
      role: route.espace, destinataire: destinataire(route.espace, personne),
      lien: chemin => `#/${route.espace}/${chemin}`,
      naviguer: chemin => { racine.location.hash = `#/${route.espace}/${chemin}`; },
      rafraichir: () => afficher(route)
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
              <a class="bouton-icone barre-haute__cloche" href="#/${route.espace}/notifications" aria-label="Notifications (${nonLues(ctx.destinataire)} non lues)">${icone('cloche')}${nonLues(ctx.destinataire) ? `<span class="pastille-compteur">${nonLues(ctx.destinataire)}</span>` : ''}</a>
              <span class="compte-demo">${icone('utilisateur')}<span>Compte de démonstration</span></span>
            </div>
          </header>
          <main class="vue" id="vue" tabindex="-1">${rendu.html}</main>
        </div>`;
    } else {
      const etat = E.api.charger();
      const possibles = etat.personnes.filter(p => p.role === conf.role);
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
    if (rendu.apres) rendu.apres(app.querySelector('#vue'), ctx);
  }

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
      // Retour à la liste : l'intervention ouverte peut ne pas concerner la nouvelle personne.
      racine.location.hash = `#/${route.espace}/${ESPACES[route.espace].menu[0].vue}`;
      router(false);
    }
  });

  racine.addEventListener('hashchange', () => router());
  E.espaces = { ESPACES, router, nonLues };
  router(false);
})(window);
