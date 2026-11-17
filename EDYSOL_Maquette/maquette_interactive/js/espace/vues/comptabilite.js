/* =========================================================================
   ÉDYSOL NC — Vues Comptabilité : stocks, mouvements, inventaire,
   véhicules de service et historique des relevés kilométriques.
   Accès prévu : secrétaire et cogérants (jamais employés ni contrôleuses).
   Les règles viennent de js/metier/suivi_metier.js (référence testée) :
   - le kilométrage saisi est le TOTAL affiché au compteur ;
   - les compteurs ne sont jamais additionnés entre employés ;
   - une correction crée une révision, l'original est conservé ;
   - un écart d'inventaire ne modifie jamais le stock automatiquement.
   Les permissions d'écriture sont fermées par défaut ; la maquette permet
   de les SIMULER pour tester les écrans.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const M = racine.EdysolMetier;
  const vues = E.vues = E.vues || {};
  const etat = () => E.api.charger();

  const ONGLETS = [
    { vue: 'comptabilite', texte: 'Vue d’ensemble' },
    { vue: 'stocks', texte: 'Stocks', ic: 'stock', description: 'Retrouver un article et consulter sa quantité disponible.' },
    { vue: 'mouvements', texte: 'Mouvements', ic: 'horloge', description: 'Retrouver les entrées, sorties et ajustements de stock.' },
    { vue: 'inventaire', texte: 'Inventaire', ic: 'commandes', description: 'Comparer le comptage physique aux quantités enregistrées.' },
    { vue: 'vehicules', texte: 'Véhicules' },
    { vue: 'releves', texte: 'Relevés kilométriques', ic: 'vehicule', description: 'Choisir un véhicule de service et consulter ses relevés de compteur.' }
  ];
  const PERMISSIONS = [
    ['stocks:ecrire', 'Saisir des mouvements de stock'],
    ['inventaire:ecrire', 'Préparer un ajustement d’inventaire'],
    ['releves:corriger', 'Corriger un relevé kilométrique']
  ];

  /** Vérifie l'accès en lecture selon la politique de référence (contrôle à refaire côté serveur). */
  function accesRefuse(ctx) {
    return !M.autoriserComptabilite(E.api.acteur(ctx.role === 'secretariat' ? 'secretaire' : ctx.role === 'cogerance' ? 'cogerant' : ctx.role), 'comptabilite:lire');
  }

  /** En-tête commun avec un retour explicite pour les écrans de détail. */
  function entete(ctx, titre, sousTitre, { actions = '', retourVue = 'comptabilite' } = {}) {
    const accueil = ctx.vue === 'comptabilite';
    const retour = accueil ? null : {
      href: ctx.lien(retourVue),
      texte: {
        comptabilite: 'Retour à la comptabilité',
        inventaire: 'Retour à l’inventaire',
        vehicules: 'Retour aux véhicules'
      }[retourVue]
    };
    return `<header class="compta-entete${accueil ? ' compta-entete--accueil' : ''}">
      ${ui.entetePage({ titre, sousTitre, retour, actions })}
      ${accueil ? '' : `<nav class="onglets-internes" aria-label="Rubriques de la comptabilité"><ul>
        ${ONGLETS.map(o => `<li><a href="${ctx.lien(o.vue)}" ${o.vue === ctx.vue ? 'aria-current="page"' : ''}>${esc(o.texte)}</a></li>`).join('')}
      </ul></nav>`}
    </header>`;
  }

  // Conserve le point d'entrée de l'en-tête comptable partagé.
  E.enteteComptabilite = entete;

  function raccourci(ctx, { vue, texte, ic, description }, info) {
    return `<li><a class="compta-raccourci" href="${ctx.lien(vue)}">
      <span class="compta-raccourci__icone">${icone(ic)}</span>
      <h2>${esc(texte)}</h2>
      <p>${esc(description)}</p>
      <span class="compta-raccourci__suite">${esc(info)}${icone('droite')}</span>
    </a></li>`;
  }

  /** Filtre les lignes affichées sans toucher aux données ni à leur ordre. */
  function brancherFiltre(vue, selecteur, lignes, correspond) {
    const champ = vue.querySelector(selecteur);
    const tableau = vue.querySelector('.compta-resultats');
    const elements = tableau.querySelectorAll('tbody tr');
    const vide = tableau.querySelector('.compta-filtre-vide');
    function filtrer() {
      let total = 0;
      elements.forEach((ligne, i) => {
        const visible = correspond(lignes[i], champ.value);
        ligne.hidden = !visible;
        if (visible) total += 1;
      });
      vide.hidden = !elements.length || total > 0;
    }
    champ.addEventListener('input', filtrer);
    filtrer();
  }

  // Le fragment d'URL appartient au routeur : le raccourci place le focus sans changer de vue.
  function brancherRaccourcis(vue) {
    vue.querySelectorAll('[data-compta-cible]').forEach(bouton => {
      bouton.addEventListener('click', () => vue.querySelector('#' + bouton.dataset.comptaCible).focus());
    });
  }

  function boutonRaccourci(cible, texte, ic, style = 'principal') {
    return `<button type="button" class="bouton bouton--${style}" data-compta-cible="${cible}">${icone(ic)}${esc(texte)}</button>`;
  }

  /** Quantité affichée en unité de référence avec son signe. */
  const qte = (milli, unite, signe = '') => `${signe}${E.formaterNombre(milli / 1000)} ${unite}`;
  const stock = a => M.stockCourant(etat().mouvements, a.id);
  const roleActeur = ctx => (ctx.role === 'secretariat' ? 'secretaire' : 'cogerant');

  /** Bloc des permissions simulées (cases à cocher) avec un avertissement clair. */
  function blocPermissions(filtre = null) {
    const p = etat().permissionsSimulees;
    return ui.bloc('Permissions d’écriture (simulation)', `
      <p class="aide-bloc">Par défaut, aucun rôle ne peut modifier les stocks ni corriger un relevé : les droits restent à définir. Cochez une case pour <strong>simuler</strong> une permission et tester l’écran.</p>
      <div class="liste-permissions">${PERMISSIONS.filter(([k]) => !filtre || filtre.includes(k)).map(([k, t]) => `
        <label class="case"><input type="checkbox" data-permission="${k}" ${p[k] ? 'checked' : ''}><span>${esc(t)} <code>${k}</code></span></label>`).join('')}</div>`, { classe: 'bloc--permissions' });
  }
  function brancherPermissions(vue, ctx) {
    vue.querySelectorAll('[data-permission]').forEach(c => c.addEventListener('change', () => {
      const permission = c.dataset.permission;
      E.api.basculerPermission(permission, c.checked);
      ctx.rafraichir();
      // Le routeur recrée la vue après un changement de permission. Restaure le focus clavier.
      document.querySelector(`#vue [data-permission="${permission}"]`)?.focus();
    }));
  }

  function afficherRetour(id, resultat) {
    const zone = document.getElementById(id);
    zone.innerHTML = ui.notice(esc(resultat.message), resultat.ok ? 'succes' : 'erreur', resultat.ok ? 'valide' : 'alerte');
    // La confirmation garde un point de reprise quand la vue vient d'être recréée.
    zone.focus();
  }

  /* ---------- Accueil comptabilité ---------- */
  vues.comptabilite = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès réservé à la secrétaire et aux cogérants.', 'erreur', 'alerte') };
    const s = etat();
    const alertesVehicules = s.vehicules.reduce((n, v) => n + M.suiviVehicule(s.releves, v.id).anomalies.length, 0);
    const infos = {
      stocks: `${s.articles.length} articles suivis`,
      mouvements: `${s.mouvements.length} mouvements enregistrés`,
      inventaire: 'Comptage et écarts',
      releves: `${s.vehicules.length} véhicules de service`
    };
    return {
      titre: 'Comptabilité',
      html: `${entete(ctx, 'Comptabilité', 'Gérez les stocks et le comptage physique, puis retrouvez les relevés des véhicules de service.')}
        <nav aria-label="Accès rapides de la comptabilité"><ul class="compta-raccourcis">
          ${ONGLETS.filter(o => o.ic).map(o => raccourci(ctx, o, infos[o.vue])).join('')}
        </ul></nav>
        <p class="actions-bloc"><a class="bouton bouton--clair" href="${ctx.lien('vehicules')}">${icone('vehicule')}Véhicules et alertes</a>
          <span class="aide-bloc">${alertesVehicules ? `${alertesVehicules} ${alertesVehicules === 1 ? 'alerte' : 'alertes'} à examiner` : 'Aucune alerte de relevé'}</span></p>
        ${blocPermissions()}
        ${ui.notice('Facturation, fiscalité et écritures comptables restent à définir.', 'info')}`,
      apres: (vue) => brancherPermissions(vue, ctx)
    };
  };

  /* ---------- Stocks ---------- */
  vues.stocks = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès refusé.', 'erreur', 'alerte') };
    const articles = etat().articles.map(a => ({ ...a, stock: stock(a) }));
    return {
      titre: 'Stocks',
      html: `${entete(ctx, 'Stocks', 'Quantités disponibles, calculées à partir des mouvements.', {
          actions: `<a class="bouton bouton--principal" href="${ctx.lien('inventaire')}">${icone('commandes')}Ouvrir l’inventaire</a>`
        })}
        <section class="bloc compta-resultats" aria-labelledby="compta-articles">
          <div class="compta-outils">
            <h2 class="bloc__titre" id="compta-articles">Articles en stock</h2>
            <div class="champ"><label for="filtre-stock">Rechercher un article</label><input id="filtre-stock" type="search" placeholder="Nom de l’article"></div>
          </div>
          ${ui.tableau([
          { titre: 'Article', rendu: a => `<strong>${esc(a.libelle)}</strong>` },
          { titre: 'Nature', rendu: a => a.nature === 'DURABLE' ? 'Matériel durable' : 'Consommable' },
          { titre: 'Quantité', rendu: a => `<span class="nombre">${esc(E.formaterNombre(a.stock.quantite))}</span>`, classe: 'nombre' },
          { titre: 'Unité', cle: 'unite' },
          { titre: 'Alerte', rendu: a => a.stock.alerte ? '<span class="badge badge--a-reprogrammer">Stock négatif à examiner</span>' : '—' },
          { titre: 'Historique', rendu: a => `<a class="compta-lien-tableau" href="${ctx.lien('mouvements/' + new URLSearchParams({ filtre: a.id }))}" aria-label="Voir les mouvements : ${esc(a.libelle)}">Voir les mouvements</a>` }
        ], articles, { legende: 'Stocks' })}
          <p class="vide compta-filtre-vide" role="status" hidden>Aucun article ne correspond à votre recherche.</p>
        </section>
        ${ui.notice('Lieux de stockage, personnes autorisées et déclaration des consommations par les employés : à confirmer. Le matériel durable est distingué des produits consommés.', 'alerte', 'alerte')}`,
      apres: vue => brancherFiltre(vue, '#filtre-stock', articles, (a, valeur) => {
        const recherche = texte => texte.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/\p{M}/gu, '');
        return recherche(a.libelle).includes(recherche(valeur));
      })
    };
  };

  /* ---------- Mouvements ---------- */
  vues.mouvements = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès refusé.', 'erreur', 'alerte') };
    const s = etat();
    const preremplir = new URLSearchParams(ctx.param || '');
    const autorise = M.autoriserComptabilite(E.api.acteur(roleActeur(ctx)), 'stocks:ecrire');
    const lignes = [...s.mouvements].sort((a, b) => b.date.localeCompare(a.date));
    const articleChoisi = preremplir.get('article') || preremplir.get('filtre');
    const ajustement = preremplir.get('type') === 'AJUSTEMENT' && s.articles.some(a => a.id === articleChoisi);
    const historique = `<section class="bloc compta-resultats" aria-labelledby="historique-mouvements">
          <div class="compta-outils">
            <h2 class="bloc__titre" id="historique-mouvements" tabindex="-1">Historique des mouvements</h2>
            <div class="champ"><label for="filtre-mouvement">Filtrer par article</label>
              <select id="filtre-mouvement"><option value="">Tous les articles</option>
                ${s.articles.map(a => `<option value="${esc(a.id)}" ${preremplir.get('filtre') === a.id ? 'selected' : ''}>${esc(a.libelle)}</option>`).join('')}
              </select></div>
          </div>
          ${ui.tableau([
            { titre: 'Date', rendu: m => ui.temps(m.date) },
            { titre: 'Article', rendu: m => esc(s.articles.find(a => a.id === m.articleId)?.libelle) },
            { titre: 'Mouvement', rendu: m => ({ ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Ajustement motivé' }[m.type]) },
            { titre: 'Quantité', rendu: m => `<span class="nombre">${esc(qte(m.type === 'SORTIE' ? -m.quantiteMilli : m.quantiteMilli, m.unite, m.type !== 'SORTIE' && m.quantiteMilli > 0 ? '+' : ''))}</span>`, classe: 'nombre' },
            { titre: 'Motif et auteur', rendu: m => `${esc(m.motif)}<small class="sous-ligne">${esc(m.auteur)}</small>` }
          ], lignes, { legende: 'Mouvements de stock' })}
          <p class="vide compta-filtre-vide" role="status" hidden>Aucun mouvement enregistré pour cet article.</p>
        </section>`;
    const saisie = `<div class="compta-saisie">
            <form class="bloc bloc--formulaire compta-formulaire" id="form-mouvement" novalidate>
              <div class="compta-outils"><h2 class="bloc__titre">Saisir un mouvement</h2>
                ${boutonRaccourci('historique-mouvements', 'Retour à l’historique', 'gauche', 'clair')}</div>
              <p class="aide-bloc">Chaque saisie ajoute un mouvement daté avec son motif. Les mouvements précédents restent dans l’historique.</p>
              ${autorise ? '' : ui.notice('Permission « stocks:ecrire » non attribuée : l’enregistrement sera refusé. Activez la simulation dans les permissions pour tester.', 'alerte', 'bouclier')}
              <div class="champ"><label for="mvt-article">Article</label><select id="mvt-article" name="article">${s.articles.map(a => `<option value="${esc(a.id)}" ${articleChoisi === a.id ? 'selected' : ''}>${esc(a.libelle)} (${esc(a.unite)})</option>`).join('')}</select></div>
              <div class="champ"><label for="mvt-type">Type</label><select id="mvt-type" name="type">
                ${[['ENTREE', 'Entrée'], ['SORTIE', 'Sortie'], ['AJUSTEMENT', 'Ajustement motivé (+ ou −)']].map(([k, t]) => `<option value="${k}" ${preremplir.get('type') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
              <div class="champ"><label for="mvt-qte">Quantité <span class="facultatif">(unité de référence, 3 décimales max.)</span></label><input id="mvt-qte" name="quantite" inputmode="decimal" value="${esc(preremplir.get('quantite') || '')}" placeholder="ex. 2,5"></div>
              <div class="champ"><label for="mvt-motif">Motif</label><input id="mvt-motif" name="motif" value="${esc(preremplir.get('motif') || '')}" placeholder="Livraison, sortie chantier, écart d’inventaire…"></div>
              <button type="submit" class="bouton bouton--principal">Enregistrer (simulation)</button>
              <div id="mvt-retour" role="status" tabindex="-1"></div>
            </form>
            ${blocPermissions(['stocks:ecrire'])}
        </div>`;
    return {
      titre: 'Mouvements',
      html: `${entete(ctx, 'Mouvements de stock',
        ajustement ? 'Vérifiez l’ajustement prérempli depuis le comptage physique.' : 'Consultez les entrées, sorties et ajustements, du plus récent au plus ancien.', {
          actions: boutonRaccourci('mvt-article', 'Saisir un mouvement', 'plus'),
          retourVue: ajustement ? 'inventaire' : 'comptabilite'
        })}
        ${ajustement ? saisie + historique : historique + saisie}`,
      apres(vue) {
        brancherPermissions(vue, ctx);
        brancherRaccourcis(vue);
        brancherFiltre(vue, '#filtre-mouvement', lignes, (m, article) => !article || m.articleId === article);
        vue.querySelector('#form-mouvement').addEventListener('submit', e => {
          e.preventDefault();
          const f = e.target.elements;
          const r = E.api.ajouterMouvement(roleActeur(ctx), { articleId: f.article.value, type: f.type.value, quantite: f.quantite.value.trim(), motif: f.motif.value.trim() });
          if (r.ok) {
            // Retire le préremplissage de l'adresse sans déclencher de nouvel affichage.
            history.replaceState(null, '', ctx.lien('mouvements'));
            E.espaces.router(false);
          }
          afficherRetour('mvt-retour', r);
        });
      }
    };
  };

  /* ---------- Inventaire physique ---------- */
  vues.inventaire = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès refusé.', 'erreur', 'alerte') };
    const s = etat();
    const reference = new Date().toISOString();
    return {
      titre: 'Inventaire',
      html: `${entete(ctx, 'Inventaire physique', 'Comparez vos quantités comptées au stock enregistré.', {
          actions: `<a class="bouton bouton--clair" href="${ctx.lien('stocks')}">${icone('stock')}Consulter les stocks</a>`
        })}
        <form id="form-inventaire" class="bloc compta-resultats" novalidate>
          <h2 class="bloc__titre">Comptage des articles</h2>
          <p class="compta-aide aide-bloc">Stock de référence au ${ui.temps(reference)}. Renseignez les quantités comptées pour afficher les écarts.</p>
          ${ui.tableau([
            { titre: 'Article', rendu: a => `<strong>${esc(a.libelle)}</strong>` },
            { titre: 'Enregistré', rendu: a => `<span class="nombre">${esc(E.formaterNombre(stock(a).quantite))} ${esc(a.unite)}</span>`, classe: 'nombre' },
            { titre: 'Compté', rendu: a => `<label class="visuellement-cache" for="cpt-${a.id}">Quantité comptée : ${esc(a.libelle)}</label><input class="saisie saisie--compacte" id="cpt-${a.id}" data-article="${a.id}" inputmode="decimal" placeholder="—">` },
            { titre: 'Écart', rendu: a => `<span class="ecart" id="ecart-${a.id}" aria-live="polite">—</span>`, classe: 'nombre' },
            { titre: 'Suite', rendu: a => `<a class="bouton bouton--clair bouton--petit" id="ajuster-${a.id}" hidden href="#">Préparer un ajustement</a>` }
          ], s.articles, { legende: 'Comptage d’inventaire' })}
        </form>
        ${ui.notice('Un écart est identifié ; il ne modifie jamais silencieusement le stock. Un ajustement éventuel doit être motivé et autorisé (droits à définir).', 'info')}`,
      apres(vue) {
        vue.querySelectorAll('[data-article]').forEach(input => input.addEventListener('input', () => {
          const a = s.articles.find(x => x.id === input.dataset.article);
          const zone = vue.querySelector('#ecart-' + a.id);
          const lien = vue.querySelector('#ajuster-' + a.id);
          if (!input.value.trim()) { zone.textContent = '—'; lien.hidden = true; input.removeAttribute('aria-invalid'); return; }
          try {
            const compte = M.quantiteMilli(input.value.trim());
            const theorique = Math.round(stock(a).quantite * 1000);
            if (a.nature === 'DURABLE' && compte % 1000) throw new Error('Matériel durable : nombre entier attendu.');
            const ecart = M.ecartInventaire(theorique, compte);
            zone.textContent = ecart === 0 ? '0' : `${ecart > 0 ? '+' : ''}${E.formaterNombre(ecart)} ${a.unite}`;
            zone.className = 'ecart' + (ecart ? ' ecart--alerte' : ' ecart--ok');
            input.removeAttribute('aria-invalid');
            lien.hidden = ecart === 0;
            const motif = `Écart d’inventaire du ${E.formaterDate(E.aujourdhui(), 'court')}`;
            lien.href = ctx.lien('mouvements/' + new URLSearchParams({ article: a.id, type: 'AJUSTEMENT', quantite: String(ecart).replace('.', ','), motif }).toString());
          } catch (err) { zone.textContent = err.message; zone.className = 'ecart ecart--alerte'; input.setAttribute('aria-invalid', 'true'); lien.hidden = true; }
        }));
      }
    };
  };

  /* ---------- Véhicules de service ---------- */
  vues.vehicules = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès refusé.', 'erreur', 'alerte') };
    const s = etat();
    const suivis = s.vehicules.map(v => ({ v, suivi: M.suiviVehicule(s.releves, v.id) }));
    return {
      titre: 'Véhicules',
      html: `${entete(ctx, 'Véhicules de service', 'Consultez les derniers compteurs issus des comptes rendus.', {
          actions: `<a class="bouton bouton--principal" href="${ctx.lien('releves')}">${icone('horloge')}Consulter les relevés</a>`
        })}
        ${ui.bloc('Derniers compteurs par véhicule', ui.tableau([
          { titre: 'Véhicule', rendu: x => `<strong>${esc(x.v.libelle)}</strong>` },
          { titre: 'Dernier compteur', rendu: x => x.suivi.ambigu ? '<span class="badge badge--a-reprogrammer">Contradiction à examiner</span>' : x.suivi.dernier ? `<span class="nombre">${esc(E.formaterNombre(x.suivi.dernier.compteur))} km</span>` : 'Aucun relevé', classe: 'nombre' },
          { titre: 'Date du relevé', rendu: x => x.suivi.dernier ? ui.temps(x.suivi.dernier.dateReleve) : '—' },
          { titre: 'Nombre de relevés', rendu: x => String(x.suivi.lignes.length) },
          { titre: 'Alertes', rendu: x => x.suivi.anomalies.length ? `<span class="badge badge--a-confirmer">${x.suivi.anomalies.length} à examiner</span>` : '<span class="badge badge--terminee">Aucune</span>' }
        ], suivis, { lien: x => ctx.lien('releves/' + x.v.id), legende: 'Véhicules de service' }), { classe: 'compta-resultats' })}
        <div class="grille-2">
          ${ui.bloc('Suivi des véhicules', `<p>Carte, positions, déplacements et historique des trajets. Démonstration : positions simulées.</p><p class="actions-bloc"><a class="bouton bouton--bleu bouton--petit" href="${ctx.lien('carte')}">${icone('lieu')}Ouvrir le suivi des véhicules</a></p>`)}
          ${ui.bloc('Alimentation depuis les comptes rendus', `<ul class="liste-puces">
            <li>Le kilométrage saisi est le <strong>total affiché au compteur</strong>, pas la distance de la mission.</li>
            <li>Le dernier relevé est choisi selon sa date réelle, même si la saisie arrive plus tard.</li>
            <li>Les compteurs des employés ne sont jamais additionnés.</li>
            <li>Anomalies, doublons et corrections restent identifiables.</li></ul>`)}
          ${ui.bloc('À préciser', `<ul class="liste-regles"><li>${ui.aDefinir('Véhicules partagés : qui relève le compteur et quand.')}</li><li>${ui.aDefinir('Traitement des alertes et remises à zéro du compteur.')}</li></ul>`)}
        </div>`
    };
  };

  /* ---------- Historique des relevés d'un véhicule + correction motivée ---------- */
  vues.releves = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès refusé.', 'erreur', 'alerte') };
    const s = etat();
    const v = s.vehicules.find(x => x.id === ctx.param) || s.vehicules[0];
    if (!v) return {
      titre: 'Relevés kilométriques',
      html: entete(ctx, 'Relevés kilométriques', '', { retourVue: 'vehicules' }) + ui.notice('Aucun véhicule de service enregistré.')
    };
    const suivi = M.suiviVehicule(s.releves, v.id);
    const lignes = [...suivi.lignes].reverse();
    const enAnomalie = new Set(suivi.anomalies.flatMap(a => a.ids));
    const autorise = M.autoriserComptabilite(E.api.acteur(roleActeur(ctx)), 'releves:corriger');
    const historiqueComplet = s.releves.filter(r => r.vehiculeId === v.id && r.revision > 1);
    return {
      titre: 'Relevés ' + v.id,
      html: `${entete(ctx, 'Relevés kilométriques', esc(v.libelle), {
          retourVue: 'vehicules',
          actions: lignes.length ? boutonRaccourci('cor-releve', 'Corriger un relevé', 'crayon') : ''
        })}
        <div class="bloc compta-outils"><div class="champ"><label for="choix-vehicule">Choisir un véhicule de service</label><select id="choix-vehicule">${s.vehicules.map(x => `<option value="${esc(x.id)}" ${x.id === v.id ? 'selected' : ''}>${esc(x.libelle)}</option>`).join('')}</select></div></div>
        ${suivi.ambigu ? ui.notice('Les derniers relevés datés se contredisent : aucun compteur n’est retenu arbitrairement.', 'alerte', 'alerte') : ''}
        ${suivi.anomalies.map(a => ui.notice(`À examiner : ${a.type === 'COMPTEUR_INFERIEUR' ? 'compteur inférieur au relevé précédent' : 'deux relevés à la même date avec des compteurs différents'} (${esc(a.ids.join(', '))}).`, 'alerte', 'alerte')).join('')}
        <section class="bloc compta-resultats" aria-labelledby="historique-releves">
          <h2 class="bloc__titre" id="historique-releves" tabindex="-1">Historique des compteurs</h2>
          <p class="compta-aide aide-bloc">Relevés effectifs, du plus récent au plus ancien.</p>
          ${ui.tableau([
            { titre: 'Date réelle', rendu: r => ui.temps(r.dateReleve) },
            { titre: 'Compteur total', rendu: r => `<span class="nombre">${esc(E.formaterNombre(r.compteur))} km</span>`, classe: 'nombre' },
            { titre: 'Origine', rendu: r => `${esc(r.rapportId)}<small class="sous-ligne">${esc(r.employeId)}</small>` },
            { titre: 'État', rendu: r => enAnomalie.has(r.releveId) ? '<span class="badge badge--a-confirmer">À examiner</span>' : suivi.dernier && r.releveId === suivi.dernier.releveId ? '<span class="badge badge--terminee">Dernier daté</span>' : r.revision > 1 ? `<span class="badge">Corrigé (v${r.revision})</span>` : `Saisi le ${esc(E.formaterHorodatage(r.dateSaisie))}` }
          ], lignes, { vide: 'Aucun relevé pour ce véhicule.', legende: 'Relevés' })}
          ${historiqueComplet.length ? `<p class="compta-aide aide-bloc">${historiqueComplet.length} correction(s) enregistrée(s) : les valeurs d’origine restent conservées dans l’historique.</p>` : ''}
        </section>
        <div class="compta-saisie">
            ${lignes.length ? `<form class="bloc bloc--formulaire compta-formulaire" id="form-correction" novalidate>
              <div class="compta-outils"><h2 class="bloc__titre">Corriger un relevé</h2>
                ${boutonRaccourci('historique-releves', 'Retour à l’historique', 'gauche', 'clair')}</div>
              ${autorise ? '' : ui.notice('Permission « releves:corriger » non attribuée : la correction sera refusée.', 'alerte', 'bouclier')}
              <div class="champ"><label for="cor-releve">Relevé</label><select id="cor-releve" name="releve">${lignes.map(r => `<option value="${esc(r.releveId)}">${esc(r.rapportId)} · ${esc(E.formaterNombre(r.compteur))} km</option>`).join('')}</select></div>
              <div class="champ"><label for="cor-compteur">Nouveau compteur total (km)</label><input id="cor-compteur" name="compteur" type="number" min="0" step="1" inputmode="numeric"></div>
              <div class="champ"><label for="cor-motif">Motif de la correction</label><input id="cor-motif" name="motif" placeholder="Erreur de lecture…"></div>
              <button type="submit" class="bouton bouton--principal">Enregistrer la correction (simulation)</button>
              <div id="cor-retour" role="status" tabindex="-1"></div>
            </form>` : ''}
            ${blocPermissions(['releves:corriger'])}
        </div>`,
      apres(vue) {
        brancherPermissions(vue, ctx);
        brancherRaccourcis(vue);
        vue.querySelector('#choix-vehicule').addEventListener('change', e => ctx.naviguer('releves/' + e.target.value));
        const form = vue.querySelector('#form-correction');
        if (!form) return;
        form.addEventListener('submit', e => {
          e.preventDefault();
          const r = lignes.find(x => x.releveId === form.elements.releve.value);
          const res = E.api.corrigerReleve(roleActeur(ctx), r, form.elements.compteur.value, form.elements.motif.value.trim());
          if (res.ok) ctx.rafraichir();
          afficherRetour('cor-retour', res);
        });
      }
    };
  };
})(window);
