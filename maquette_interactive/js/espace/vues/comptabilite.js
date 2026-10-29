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
    { vue: 'comptabilite', texte: 'Accueil' }, { vue: 'stocks', texte: 'Stocks' }, { vue: 'mouvements', texte: 'Mouvements' },
    { vue: 'inventaire', texte: 'Inventaire' }, { vue: 'vehicules', texte: 'Véhicules' }, { vue: 'releves', texte: 'Relevés' }
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

  /** En-tête commun aux vues comptables : titre + onglets. */
  function entete(ctx, titre, sousTitre) {
    return `${ui.entetePage({ titre, sousTitre })}
      <nav class="onglets-internes" aria-label="Rubriques de la comptabilité"><ul>
        ${ONGLETS.map(o => `<li><a href="${ctx.lien(o.vue)}" ${o.vue === ctx.vue ? 'aria-current="page"' : ''}>${esc(o.texte)}</a></li>`).join('')}
      </ul></nav>`;
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
    vue.querySelectorAll('[data-permission]').forEach(c => c.addEventListener('change', () => { E.api.basculerPermission(c.dataset.permission, c.checked); ctx.rafraichir(); }));
  }

  /* ---------- Accueil comptabilité ---------- */
  vues.comptabilite = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès réservé à la secrétaire et aux cogérants.', 'erreur', 'alerte') };
    const s = etat();
    const alertesVehicules = s.vehicules.reduce((n, v) => n + M.suiviVehicule(s.releves, v.id).anomalies.length, 0);
    return {
      titre: 'Comptabilité',
      html: `${entete(ctx, 'Comptabilité', 'Accessible à la secrétaire et aux cogérants.')}
        ${ui.notice('<strong>Périmètre comptable à définir.</strong> Facturation, fiscalité et écritures comptables ne sont pas modélisées. Cet espace regroupe les stocks, l’inventaire et le suivi des véhicules de service.', 'alerte', 'alerte')}
        <div class="indicateurs">
          ${ui.carteIndicateur({ libelle: 'Articles suivis', valeur: s.articles.length, icone: 'stock', href: ctx.lien('stocks') })}
          ${ui.carteIndicateur({ libelle: 'Mouvements enregistrés', valeur: s.mouvements.length, icone: 'commandes', href: ctx.lien('mouvements'), ton: 'vert' })}
          ${ui.carteIndicateur({ libelle: 'Véhicules de service', valeur: s.vehicules.length, icone: 'vehicule', href: ctx.lien('vehicules'), ton: 'bleu-clair' })}
          ${ui.carteIndicateur({ libelle: 'Alertes de relevés', valeur: alertesVehicules, icone: 'alerte', href: ctx.lien('vehicules'), ton: alertesVehicules ? 'jaune' : 'vert' })}
        </div>
        <div class="grille-2">
          ${ui.bloc('Stocks et inventaire', `<p>Consommables et matériel durable, mouvements datés et motivés, comptage physique.</p><p class="actions-bloc"><a class="bouton bouton--bleu bouton--petit" href="${ctx.lien('stocks')}">Consulter les stocks</a><a class="bouton bouton--clair bouton--petit" href="${ctx.lien('inventaire')}">Inventaire</a></p>`)}
          ${ui.bloc('Véhicules de service', `<p>Relevés de compteur repris automatiquement des comptes rendus des employés, sans nouvelle saisie.</p><p class="actions-bloc"><a class="bouton bouton--bleu bouton--petit" href="${ctx.lien('vehicules')}">Consulter les véhicules</a></p>`)}
        </div>
        ${blocPermissions()}
        ${ui.notice('Les employés et les contrôleuses n’ont pas accès à cet espace : ils restent dans leur compte rendu. En production, ce contrôle devra être fait par le serveur.', 'info', 'bouclier')}`,
      apres: (vue) => brancherPermissions(vue, ctx)
    };
  };

  /* ---------- Stocks ---------- */
  vues.stocks = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès refusé.', 'erreur', 'alerte') };
    return {
      titre: 'Stocks',
      html: `${entete(ctx, 'Stocks et inventaire', 'Quantités calculées à partir de l’historique des mouvements.')}
        ${ui.tableau([
          { titre: 'Article', rendu: a => `<strong>${esc(a.libelle)}</strong>` },
          { titre: 'Nature', rendu: a => a.nature === 'DURABLE' ? 'Matériel durable' : 'Consommable' },
          { titre: 'Quantité', rendu: a => `<span class="nombre">${esc(E.formaterNombre(stock(a).quantite))}</span>`, classe: 'nombre' },
          { titre: 'Unité', cle: 'unite' },
          { titre: 'Alerte', rendu: a => stock(a).alerte ? '<span class="badge badge--a-reprogrammer">Stock négatif à examiner</span>' : '—' }
        ], etat().articles, { legende: 'Stocks' })}
        <p class="actions-bloc"><a class="bouton bouton--bleu" href="${ctx.lien('mouvements')}">Mouvements de stock</a><a class="bouton bouton--clair" href="${ctx.lien('inventaire')}">Inventaire physique</a></p>
        ${ui.notice('Lieux de stockage, personnes autorisées et déclaration des consommations par les employés : à confirmer. Le matériel durable est distingué des produits consommés.', 'alerte', 'alerte')}`
    };
  };

  /* ---------- Mouvements ---------- */
  vues.mouvements = ctx => {
    if (accesRefuse(ctx)) return { titre: 'Accès refusé', html: ui.notice('Accès refusé.', 'erreur', 'alerte') };
    const s = etat();
    const preremplir = new URLSearchParams(ctx.param || '');
    const autorise = M.autoriserComptabilite(E.api.acteur(roleActeur(ctx)), 'stocks:ecrire');
    const lignes = [...s.mouvements].sort((a, b) => b.date.localeCompare(a.date));
    return {
      titre: 'Mouvements',
      html: `${entete(ctx, 'Mouvements de stock', 'Historique non modifiable : une correction ajoute un nouveau mouvement.')}
        <div class="grille-detail">
          ${ui.bloc('Historique', ui.tableau([
            { titre: 'Date', rendu: m => ui.temps(m.date) },
            { titre: 'Article', rendu: m => esc(s.articles.find(a => a.id === m.articleId)?.libelle) },
            { titre: 'Mouvement', rendu: m => ({ ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Ajustement motivé' }[m.type]) },
            { titre: 'Quantité', rendu: m => `<span class="nombre">${esc(qte(m.type === 'SORTIE' ? -m.quantiteMilli : m.quantiteMilli, m.unite, m.type !== 'SORTIE' && m.quantiteMilli > 0 ? '+' : ''))}</span>`, classe: 'nombre' },
            { titre: 'Motif et auteur', rendu: m => `${esc(m.motif)}<small class="sous-ligne">${esc(m.auteur)}</small>` }
          ], lignes, { legende: 'Mouvements de stock' }))}
          <div class="pile">
            <form class="bloc bloc--formulaire" id="form-mouvement" novalidate>
              <h2 class="bloc__titre">Saisir un mouvement</h2>
              ${autorise ? '' : ui.notice('Permission « stocks:ecrire » non attribuée : l’enregistrement sera refusé. Simulez-la ci-dessous pour tester.', 'alerte', 'bouclier')}
              <div class="champ"><label for="mvt-article">Article</label><select id="mvt-article" name="article">${s.articles.map(a => `<option value="${a.id}" ${preremplir.get('article') === a.id ? 'selected' : ''}>${esc(a.libelle)} (${esc(a.unite)})</option>`).join('')}</select></div>
              <div class="champ"><label for="mvt-type">Type</label><select id="mvt-type" name="type">
                ${[['ENTREE', 'Entrée'], ['SORTIE', 'Sortie'], ['AJUSTEMENT', 'Ajustement motivé (+ ou −)']].map(([k, t]) => `<option value="${k}" ${preremplir.get('type') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
              <div class="champ"><label for="mvt-qte">Quantité <span class="facultatif">(unité de référence, 3 décimales max.)</span></label><input id="mvt-qte" name="quantite" inputmode="decimal" value="${esc(preremplir.get('quantite') || '')}" placeholder="ex. 2,5"></div>
              <div class="champ"><label for="mvt-motif">Motif</label><input id="mvt-motif" name="motif" value="${esc(preremplir.get('motif') || '')}" placeholder="Livraison, sortie chantier, écart d’inventaire…"></div>
              <button type="submit" class="bouton bouton--principal">Enregistrer (simulation)</button>
              <div id="mvt-retour" role="status"></div>
            </form>
            ${blocPermissions(['stocks:ecrire'])}
          </div>
        </div>`,
      apres(vue) {
        brancherPermissions(vue, ctx);
        vue.querySelector('#form-mouvement').addEventListener('submit', e => {
          e.preventDefault();
          const f = e.target.elements;
          const r = E.api.ajouterMouvement(roleActeur(ctx), { articleId: f.article.value, type: f.type.value, quantite: f.quantite.value.trim(), motif: f.motif.value.trim() });
          if (!r.ok) { vue.querySelector('#mvt-retour').innerHTML = ui.notice(esc(r.message), 'erreur', 'alerte'); return; }
          // Retire le préremplissage de l'adresse sans déclencher de nouvel affichage.
          history.replaceState(null, '', ctx.lien('mouvements'));
          E.espaces.router(false);
          document.querySelector('#vue #mvt-retour').innerHTML = ui.notice(esc(r.message), 'succes', 'valide');
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
      html: `${entete(ctx, 'Inventaire physique', 'Le comptage est comparé à une situation de stock datée.')}
        <form id="form-inventaire" class="bloc" novalidate>
          <p class="aide-bloc">Situation théorique figée le ${ui.temps(reference)}. Saisissez les quantités comptées : l’écart est calculé, <strong>sans modifier le stock</strong>.</p>
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
      html: `${entete(ctx, 'Véhicules de service', 'Dernier compteur daté, repris des comptes rendus.')}
        ${ui.tableau([
          { titre: 'Véhicule', rendu: x => `<strong>${esc(x.v.libelle)}</strong>` },
          { titre: 'Dernier compteur', rendu: x => x.suivi.ambigu ? '<span class="badge badge--a-reprogrammer">Contradiction à examiner</span>' : x.suivi.dernier ? `<span class="nombre">${esc(E.formaterNombre(x.suivi.dernier.compteur))} km</span>` : 'Aucun relevé', classe: 'nombre' },
          { titre: 'Date du relevé', rendu: x => x.suivi.dernier ? ui.temps(x.suivi.dernier.dateReleve) : '—' },
          { titre: 'Relevés', rendu: x => String(x.suivi.lignes.length) },
          { titre: 'Alertes', rendu: x => x.suivi.anomalies.length ? `<span class="badge badge--a-confirmer">${x.suivi.anomalies.length} à examiner</span>` : '<span class="badge badge--terminee">Aucune</span>' }
        ], suivis, { lien: x => ctx.lien('releves/' + x.v.id), legende: 'Véhicules de service' })}
        <div class="grille-2">
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
    const suivi = M.suiviVehicule(s.releves, v.id);
    const lignes = [...suivi.lignes].reverse();
    const enAnomalie = new Set(suivi.anomalies.flatMap(a => a.ids));
    const autorise = M.autoriserComptabilite(E.api.acteur(roleActeur(ctx)), 'releves:corriger');
    const historiqueComplet = s.releves.filter(r => r.vehiculeId === v.id && r.revision > 1);
    return {
      titre: 'Relevés ' + v.id,
      html: `${entete(ctx, 'Historique des relevés', esc(v.libelle))}
        <div class="barre-filtres"><div class="champ"><label for="choix-vehicule">Véhicule</label><select id="choix-vehicule">${s.vehicules.map(x => `<option value="${x.id}" ${x.id === v.id ? 'selected' : ''}>${esc(x.libelle)}</option>`).join('')}</select></div></div>
        ${suivi.ambigu ? ui.notice('Les derniers relevés datés se contredisent : aucun compteur n’est retenu arbitrairement.', 'alerte', 'alerte') : ''}
        ${suivi.anomalies.map(a => ui.notice(`À examiner : ${a.type === 'COMPTEUR_INFERIEUR' ? 'compteur inférieur au relevé précédent' : 'deux relevés à la même date avec des compteurs différents'} (${esc(a.ids.join(', '))}).`, 'alerte', 'alerte')).join('')}
        <div class="grille-detail">
          ${ui.bloc('Relevés effectifs (du plus récent au plus ancien)', ui.tableau([
            { titre: 'Date réelle', rendu: r => ui.temps(r.dateReleve) },
            { titre: 'Compteur total', rendu: r => `<span class="nombre">${esc(E.formaterNombre(r.compteur))} km</span>`, classe: 'nombre' },
            { titre: 'Origine', rendu: r => `${esc(r.rapportId)}<small class="sous-ligne">${esc(r.employeId)}</small>` },
            { titre: 'État', rendu: r => enAnomalie.has(r.releveId) ? '<span class="badge badge--a-confirmer">À examiner</span>' : suivi.dernier && r.releveId === suivi.dernier.releveId ? '<span class="badge badge--terminee">Dernier daté</span>' : r.revision > 1 ? `<span class="badge">Corrigé (v${r.revision})</span>` : `Saisi le ${esc(E.formaterHorodatage(r.dateSaisie))}` }
          ], lignes, { vide: 'Aucun relevé pour ce véhicule.', legende: 'Relevés' })
            + (historiqueComplet.length ? `<p class="aide-bloc">${historiqueComplet.length} correction(s) enregistrée(s) : les valeurs d’origine restent conservées dans l’historique.</p>` : ''))}
          <div class="pile">
            ${lignes.length ? `<form class="bloc bloc--formulaire" id="form-correction" novalidate>
              <h2 class="bloc__titre">Corriger un relevé</h2>
              ${autorise ? '' : ui.notice('Permission « releves:corriger » non attribuée : la correction sera refusée.', 'alerte', 'bouclier')}
              <div class="champ"><label for="cor-releve">Relevé</label><select id="cor-releve" name="releve">${lignes.map(r => `<option value="${esc(r.releveId)}">${esc(r.rapportId)} · ${esc(E.formaterNombre(r.compteur))} km</option>`).join('')}</select></div>
              <div class="champ"><label for="cor-compteur">Nouveau compteur total (km)</label><input id="cor-compteur" name="compteur" type="number" min="0" step="1" inputmode="numeric"></div>
              <div class="champ"><label for="cor-motif">Motif de la correction</label><input id="cor-motif" name="motif" placeholder="Erreur de lecture…"></div>
              <button type="submit" class="bouton bouton--principal">Enregistrer la correction (simulation)</button>
              <div id="cor-retour" role="status"></div>
            </form>` : ''}
            ${blocPermissions(['releves:corriger'])}
          </div>
        </div>`,
      apres(vue) {
        brancherPermissions(vue, ctx);
        vue.querySelector('#choix-vehicule').addEventListener('change', e => ctx.naviguer('releves/' + e.target.value));
        const form = vue.querySelector('#form-correction');
        if (!form) return;
        form.addEventListener('submit', e => {
          e.preventDefault();
          const r = lignes.find(x => x.releveId === form.elements.releve.value);
          const res = E.api.corrigerReleve(roleActeur(ctx), r, form.elements.compteur.value, form.elements.motif.value.trim());
          if (!res.ok) { form.querySelector('#cor-retour').innerHTML = ui.notice(esc(res.message), 'erreur', 'alerte'); return; }
          ctx.rafraichir();
          document.querySelector('#vue #cor-retour').innerHTML = ui.notice(esc(res.message), 'succes', 'valide');
        });
      }
    };
  };
})(window);
