/* =========================================================================
   ÉDYSOL NC — Carte des véhicules (cogérance et secrétariat)
   Dépendance : Leaflet 1.9.4 (licence BSD-2), copié dans assets/vendor :
   aucune clé, aucun compte. Fond de carte : tuiles OpenStreetMap si Internet
   est disponible (attribution obligatoire) ; sinon fond schématique local.
   Les positions viennent UNIQUEMENT de Edysol.positions (point d'intégration).
   Dans la maquette, la source est une SIMULATION (js/demo/positions-simulees.js).
   Principes :
   - une position ancienne n'est jamais présentée comme actuelle ;
   - l'heure de mesure GPS et l'heure de réception sont affichées séparément ;
   - animation seulement entre deux mesures réelles proches ; sinon saut net ;
   - pas de recentrage forcé : si l'utilisateur déplace la carte, le suivi
     se met en pause et un bouton « Reprendre le suivi » apparaît.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const G = racine.EdysolGeo;
  const vues = E.vues = E.vues || {};

  // Préférences d'affichage de cette page (mémoire de la session de démo, pas de stockage).
  const memo = { selection: null, filtre: '', recherche: '', periode: '60' };
  let sourceSimulee = null;

  /** Démarre une seule fois la source de positions (simulation dans la maquette). */
  function assurerSource() {
    if (E.config.sourcePositions === 'reelle') {
      E.positions.utiliser(E.positions.sourceReelleNonConfiguree);
    } else if (!sourceSimulee) {
      sourceSimulee = E.simulationPositions.creerSourceSimulee();
      E.positions.utiliser(sourceSimulee);
    }
    return E.positions.demarrer();
  }

  /** Code court affiché dans le marqueur (V1, V2…). */
  const codeCourt = id => 'V' + Number(id.replace(/\D/g, ''));
  const heureNC = iso => new Intl.DateTimeFormat('fr-FR', { timeZone: E.FUSEAU, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
  const LIBELLES_FILTRE = { '': 'Tous', mouvement: 'En mouvement', arret: 'À l’arrêt', ancienne: 'Position ancienne', perdue: 'Communication perdue' };

  /** Indique si un véhicule passe le filtre d'état. */
  function passeFiltre(etat, filtre) {
    if (!filtre) return true;
    if (filtre === 'mouvement') return etat.code === 'actuelle' && etat.enMouvement;
    if (filtre === 'arret') return etat.code === 'actuelle' && !etat.enMouvement;
    return etat.code === filtre;
  }

  /** Texte d'état complet, explicite sur l'ancienneté (jamais « actuelle » à tort). */
  function texteEtat(etat) {
    if (etat.ageS === null) return 'Aucune position reçue.';
    if (etat.code === 'perdue') return `Communication perdue : dernière position mesurée il y a ${G.dureeLisible(etat.ageS)}. Ce n’est pas la position actuelle.`;
    if (etat.code === 'ancienne') return `Position ancienne : mesurée il y a ${G.dureeLisible(etat.ageS)}. Le véhicule a pu se déplacer depuis.`;
    return `${etat.libelle} · position mesurée il y a ${G.dureeLisible(etat.ageS)}.`;
  }

  /** Icône de marqueur : code, état écrit en abrégé et flèche de direction si en mouvement. */
  function iconeMarqueur(id, etat, derniere, selectionne) {
    const fleche = etat.enMouvement && derniere && derniere.cap !== null
      ? `<span class="marqueur__fleche" style="transform: rotate(${derniere.cap}deg)" aria-hidden="true"></span>` : '';
    const abrege = { actuelle: etat.enMouvement ? 'route' : 'arrêt', ancienne: 'ancien', perdue: 'perdu' }[etat.code];
    return L.divIcon({
      className: '',
      html: `<div class="marqueur marqueur--${etat.code}${selectionne ? ' est-selectionne' : ''}">${fleche}<span class="marqueur__code">${esc(codeCourt(id))}</span><span class="marqueur__etat">${esc(abrege)}</span></div>`,
      iconSize: [54, 46], iconAnchor: [27, 23]
    });
  }

  vues.carte = ctx => {
    const acces = G.accesCarte({ role: ctx.personne && ctx.personne.role });
    const titre = 'Suivi des véhicules';
    if (!acces.autorise) {
      return { titre, contenuCharge: false, html: ui.entetePage({ titre }) + ui.notice('Accès réservé à la direction (cogérants) et à la secrétaire. Aucune règle n’ouvre le suivi des véhicules aux employés ni aux contrôleuses.', 'erreur', 'bouclier') };
    }
    const etatData = E.api.charger();
    const vehicules = etatData.vehicules;
    const demarree = assurerSource();
    let carte = null, minuterie = null, desabonner = null, suiviActif = true, deplacementProgramme = false;
    const marqueurs = new Map(), affiche = new Map(); // id -> marqueur Leaflet, id -> position affichée
    let coucheTrajet = null;
    let detruite = false; // vrai dès qu'on quitte la vue : plus aucune animation ni mise à jour

    return {
      titre,
      contenuCharge: true,
      html: `
        ${ui.entetePage({ titre, sousTitre: `Carte, positions, déplacements et historique des trajets · mêmes données pour la direction et le secrétariat · ${esc(ctx.personne.nom)}.`,
          actions: `<a class="bouton bouton--clair" href="${ctx.lien('vehicules')}">${icone('vehicule')}Relevés kilométriques</a>` })}
        ${E.positions.source && E.positions.source.simulee
          ? `<p class="bandeau-simulation" role="note">${icone('alerte')}<strong>Démonstration — positions simulées</strong><span>Véhicules et trajets fictifs. Aucune position réelle n’est collectée.</span></p>`
          : `<p class="bandeau-simulation" role="note">${icone('alerte')}<strong>${esc(E.positions.source ? E.positions.source.nom : 'Aucune source')}</strong><span>Aucune position affichée tant qu’une source réelle n’est pas branchée.</span></p>`}
        ${demarree ? '' : ui.notice(esc(E.positions.erreur), 'erreur', 'alerte')}
        ${ui.notice('<strong>Accès confirmé</strong> pour la direction (cogérants) et la secrétaire. Le suivi reste fermé aux employés et aux contrôleuses. Consulter le suivi ne donne aucun pouvoir de décision.', 'info', 'bouclier')}
        <div class="carte-outils">
          <div class="filtres" role="group" aria-label="Filtrer par état">
            ${Object.entries(LIBELLES_FILTRE).map(([k, t]) => `<button type="button" class="filtre" data-filtre="${k}" aria-pressed="${memo.filtre === k}">${esc(t)}</button>`).join('')}
          </div>
          <div class="champ champ--recherche carte-recherche"><label for="carte-recherche" class="visuellement-cache">Rechercher un véhicule</label>
            <input id="carte-recherche" type="search" placeholder="Rechercher un véhicule…" value="${esc(memo.recherche)}"></div>
        </div>
        <div class="carte-grille">
          <div class="carte-zone">
            <div id="carte" class="carte" role="region" aria-label="Carte des véhicules (démonstration)"></div>
            <button type="button" class="bouton bouton--bleu carte-reprendre" id="carte-reprendre" hidden>${icone('lieu')}Reprendre le suivi</button>
            <p class="carte-fond" id="carte-fond" hidden></p>
          </div>
          <aside class="carte-panneau" aria-label="Véhicules">
            <ul class="liste-vehicules" id="liste-vehicules"></ul>
            <section class="bloc fiche-vehicule" id="fiche-vehicule" aria-live="polite"></section>
            <section class="bloc trajet-vehicule" id="trajet-vehicule"></section>
          </aside>
        </div>
        <div class="legende-carte" aria-label="Légende">
          <span><i class="pastille-etat pastille-etat--actuelle"></i>Position actuelle (moins de ${G.SEUILS.actuelleMax / 60} min)</span>
          <span><i class="pastille-etat pastille-etat--ancienne"></i>Position ancienne (${G.SEUILS.actuelleMax / 60} à ${G.SEUILS.ancienneMax / 60} min)</span>
          <span><i class="pastille-etat pastille-etat--perdue"></i>Communication perdue (plus de ${G.SEUILS.ancienneMax / 60} min)</span>
          <span class="legende-carte__note">Seuils de démonstration, à valider.</span>
        </div>`,

      apres(vue) {
        const zone = vue.querySelector('#carte');
        // Carte centrée sur le Grand Nouméa ; aucun suivi de l'appareil de l'utilisateur.
        carte = L.map(zone, { zoomControl: true, attributionControl: true }).setView([-22.235, 166.47], 11);
        ajouterFond(carte, vue);

        // Toute action de l'utilisateur sur la carte met le suivi en pause.
        const pause = () => { if (!deplacementProgramme && suiviActif && memo.selection) { suiviActif = false; vue.querySelector('#carte-reprendre').hidden = false; } };
        carte.on('dragstart', pause);
        carte.on('zoomstart', pause);
        vue.querySelector('#carte-reprendre').addEventListener('click', () => { suiviActif = true; vue.querySelector('#carte-reprendre').hidden = true; centrer(true); });

        for (const v of vehicules) {
          const m = L.marker([-22.25, 166.45], { keyboard: true, title: v.libelle, alt: v.libelle, riseOnHover: true });
          m.on('click', () => selectionner(v.id));
          marqueurs.set(v.id, m);
        }
        desabonner = E.positions.abonner(mesure => surMesure(mesure, vue));
        minuterie = setInterval(() => majTout(vue), 5000); // l'ancienneté évolue même sans nouvelle mesure

        vue.querySelector('.carte-outils').addEventListener('click', e => {
          const b = e.target.closest('[data-filtre]');
          if (!b) return;
          memo.filtre = b.dataset.filtre;
          vue.querySelectorAll('[data-filtre]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          majTout(vue);
        });
        vue.querySelector('#carte-recherche').addEventListener('input', e => { memo.recherche = e.target.value; majTout(vue); });
        vue.querySelector('#liste-vehicules').addEventListener('click', e => { const b = e.target.closest('[data-vehicule]'); if (b) selectionner(b.dataset.vehicule); });

        majTout(vue);
        // Vue initiale : tous les véhicules visibles (une seule fois, sans recentrage ensuite).
        const positions = vehicules.map(v => E.positions.derniere(v.id)).filter(Boolean).map(d => [d.lat, d.lng]);
        if (positions.length > 1) carte.fitBounds(positions, { padding: [50, 50], maxZoom: 13, animate: false });
        if (memo.selection) selectionner(memo.selection, false);

        /** Sélectionne un véhicule : fiche, trajet et suivi. */
        function selectionner(id, focusFiche = true) {
          memo.selection = id;
          suiviActif = true;
          vue.querySelector('#carte-reprendre').hidden = true;
          majTout(vue);
          dessinerTrajet(vue);
          centrer(true);
          if (focusFiche) vue.querySelector('#fiche-vehicule h2')?.focus();
        }

        /** Recentre sur le véhicule suivi, seulement s'il sort de la zone centrale (pas de recentrage permanent). */
        function centrer(force = false) {
          const d = memo.selection && E.positions.derniere(memo.selection);
          if (!d || !suiviActif) return;
          const pos = L.latLng(d.lat, d.lng);
          if (detruite || (!force && carte.getBounds().pad(-0.25).contains(pos))) return;
          deplacementProgramme = true;
          if (force && carte.getZoom() < 13) carte.setView(pos, 13, { animate: !E.mouvementsReduits() });
          else carte.panTo(pos, { animate: !E.mouvementsReduits() });
          setTimeout(() => { deplacementProgramme = false; }, 700);
        }

        /** Nouvelle mesure reçue : animation fluide si permise, sinon saut sans trajet inventé. */
        function surMesure(mesure) {
          if (detruite) return;
          const m = marqueurs.get(mesure.vehiculeId);
          if (!m) return;
          const toutes = E.positions.mesures(mesure.vehiculeId);
          const derniere = toutes[toutes.length - 1];
          if (derniere !== mesure) { majTout(vue); return; } // mesure en retard : rangée dans l'historique, pas d'animation
          const precedente = toutes[toutes.length - 2];
          if (G.animationAutorisee(precedente, mesure) && affiche.has(mesure.vehiculeId) && !E.mouvementsReduits()) animer(m, mesure);
          else { m.setLatLng([mesure.lat, mesure.lng]); affiche.set(mesure.vehiculeId, [mesure.lat, mesure.lng]); }
          if (mesure.vehiculeId === memo.selection) { centrer(); majFiche(vue); majTrajetSiDirect(vue); }
          majMarqueur(mesure.vehiculeId);
          majListe(vue);
        }

        /** Interpolation visuelle ENTRE deux positions mesurées (jamais au-delà de la dernière). */
        function animer(m, mesure) {
          const depart = m.getLatLng(), arrivee = L.latLng(mesure.lat, mesure.lng), debut = performance.now(), dureeMs = 900;
          affiche.set(mesure.vehiculeId, [mesure.lat, mesure.lng]);
          const etape = maintenant => {
            if (detruite) return; // la carte a été libérée : on arrête l'animation
            const f = Math.min(1, (maintenant - debut) / dureeMs);
            m.setLatLng([depart.lat + (arrivee.lat - depart.lat) * f, depart.lng + (arrivee.lng - depart.lng) * f]);
            if (f < 1) requestAnimationFrame(etape);
          };
          requestAnimationFrame(etape);
        }

        /** Met à jour le marqueur d'un véhicule (icône, visibilité selon les filtres). */
        function majMarqueur(id) {
          const v = vehicules.find(x => x.id === id), m = marqueurs.get(id);
          const d = E.positions.derniere(id), etat = G.etatCommunication(d, Date.now());
          const visible = d && passeFiltre(etat, memo.filtre) && (!memo.recherche || v.libelle.toLowerCase().includes(memo.recherche.toLowerCase()));
          if (!visible) { if (carte.hasLayer(m)) m.remove(); return; }
          if (!affiche.has(id)) { m.setLatLng([d.lat, d.lng]); affiche.set(id, [d.lat, d.lng]); }
          // L'icône n'est remplacée que si son contenu change : moins de travail, focus clavier conservé.
          const cle = [etat.code, etat.enMouvement, d.cap, id === memo.selection].join('|');
          if (m._cleIcone !== cle) { m._cleIcone = cle; m.setIcon(iconeMarqueur(id, etat, d, id === memo.selection)); }
          m.options.title = `${v.libelle} : ${etat.libelle}`;
          if (!carte.hasLayer(m)) m.addTo(carte);
        }

        /** Rafraîchit marqueurs, liste et fiche (l'ancienneté change avec le temps). */
        function majTout() {
          if (detruite) return;
          vehicules.forEach(v => majMarqueur(v.id));
          majListe(vue);
          majFiche(vue);
        }

        // Fonctions exposées aux fonctions d'affichage ci-dessous.
        vue._carte = { selectionner, centrer };
      },

      /** Libère la carte, la minuterie et l'abonnement quand on quitte la vue. */
      detruire() {
        detruite = true;
        clearInterval(minuterie);
        if (desabonner) desabonner();
        if (carte) {
          // Arrêt des animations en cours avant de libérer la carte (évite des erreurs Leaflet différées).
          carte.stop();
          // Leaflet 1.9 : retirer la carte pendant une animation de zoom provoque une erreur différée
          // (_onZoomTransitionEnd). On termine donc l'animation avant de libérer la carte.
          if (carte._animatingZoom && typeof carte._onZoomTransitionEnd === 'function') carte._onZoomTransitionEnd();
          carte.off();
          carte.remove();
          carte = null;
        }
      }
    };

    /** Liste des véhicules (boutons accessibles au clavier), filtrée. */
    function majListe(vue) {
      const ul = vue.querySelector('#liste-vehicules');
      if (!ul) return;
      const lignes = vehicules.map(v => ({ v, d: E.positions.derniere(v.id), etat: G.etatCommunication(E.positions.derniere(v.id), Date.now()) }))
        .filter(x => passeFiltre(x.etat, memo.filtre) && (!memo.recherche || x.v.libelle.toLowerCase().includes(memo.recherche.toLowerCase())));
      ul.innerHTML = lignes.length ? lignes.map(({ v, etat }) => `
        <li><button type="button" class="vehicule-ligne vehicule-ligne--${etat.code}" data-vehicule="${esc(v.id)}" aria-pressed="${v.id === memo.selection}">
          <span class="vehicule-ligne__code">${esc(codeCourt(v.id))}</span>
          <span class="vehicule-ligne__texte"><strong>${esc(v.libelle)}</strong><span>${esc(etat.libelle)} · ${etat.ageS === null ? 'jamais reçue' : 'mesurée il y a ' + esc(G.dureeLisible(etat.ageS))}</span></span>
        </button></li>`).join('') : '<li class="vide">Aucun véhicule ne correspond au filtre.</li>';
    }

    /** Fiche du véhicule sélectionné. */
    function majFiche(vue) {
      const zone = vue.querySelector('#fiche-vehicule');
      if (!zone) return;
      const v = vehicules.find(x => x.id === memo.selection);
      if (!v) { zone.innerHTML = '<h2 class="bloc__titre" tabindex="-1">Fiche du véhicule</h2><p class="vide">Sélectionnez un véhicule sur la carte ou dans la liste.</p>'; return; }
      const d = E.positions.derniere(v.id), etat = G.etatCommunication(d, Date.now());
      const sim = E.positions.source && E.positions.source.simulee ? E.positions.source : null;
      zone.innerHTML = `
        <h2 class="bloc__titre" tabindex="-1">${esc(v.libelle)}</h2>
        <p class="etat-communication etat-communication--${etat.code}"><span class="pastille-etat pastille-etat--${etat.code}"></span>${esc(texteEtat(etat))}</p>
        ${ui.definitions([
          ['Identification', `${esc(v.id)} <small class="sous-ligne">Immatriculation fictive</small>`],
          ['Statut', esc(etat.libelle)],
          ['Dernière position', d ? `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}` : '—'],
          ['Mesure GPS', d ? `${esc(heureNC(d.mesureLe))} <small class="sous-ligne">Heure de mesure par le boîtier</small>` : '—'],
          ['Réception', d ? `${esc(heureNC(d.recuLe))} <small class="sous-ligne">Reçue ${etat.retardReceptionS > 5 ? esc(G.dureeLisible(etat.retardReceptionS)) + ' après la mesure' : 'quasi immédiatement'}</small>` : '—'],
          ['Vitesse mesurée', d && etat.code === 'actuelle' ? `${d.vitesseKmh ?? '—'} km/h` : 'Non pertinente (position non actuelle)']
        ], true)}
        <div class="actions-bloc">
          <button type="button" class="bouton bouton--clair bouton--petit" data-centrer>${icone('lieu')}Centrer sur ce véhicule</button>
          ${sim && !E.simulationPositions.SCENARIOS[v.id].coupureAvantS ? `<button type="button" class="bouton bouton--discret bouton--petit" data-coupure>${sim.estCoupeManuellement(v.id) ? 'Rétablir la communication (démo)' : 'Couper la communication (démo)'}</button>` : ''}
        </div>`;
      zone.querySelector('[data-centrer]').addEventListener('click', () => vue._carte.selectionner(v.id, false));
      zone.querySelector('[data-coupure]')?.addEventListener('click', () => {
        if (sim.estCoupeManuellement(v.id)) sim.retablir(v.id); else sim.couper(v.id);
        majFiche(vue);
      });
    }

    /** Si la période se termine « maintenant », le trajet est prolongé à chaque mesure. */
    function majTrajetSiDirect(vue) { if (memo.periode !== 'perso') dessinerTrajet(vue); }

    /** Calcule la période choisie (en ms). */
    function periode(vue) {
      const fin = Date.now();
      if (memo.periode !== 'perso') return { debut: fin - Number(memo.periode) * 60000, fin };
      const de = vue.querySelector('#trajet-de')?.value, a = vue.querySelector('#trajet-a')?.value;
      const jour = E.aujourdhui();
      const ms = h => Date.parse(`${jour}T${h}:00+11:00`);
      return { debut: de ? ms(de) : fin - 3600000, fin: a ? Math.min(ms(a), fin) : fin };
    }

    /** Trajet sur la période : segments continus, interruptions en pointillés, flèches de sens, horaires. */
    function dessinerTrajet(vue) {
      const zone = vue.querySelector('#trajet-vehicule');
      if (!zone || !carte || detruite) return;
      if (coucheTrajet) { coucheTrajet.remove(); coucheTrajet = null; }
      const v = vehicules.find(x => x.id === memo.selection);
      if (!v) { zone.innerHTML = ''; return; }
      const { debut, fin } = periode(vue);
      const tr = G.trajet(E.positions.mesures(v.id), debut, fin);
      coucheTrajet = L.layerGroup().addTo(carte);
      for (const seg of tr.segments) {
        if (seg.length > 1) L.polyline(seg.map(p => [p.lat, p.lng]), { color: '#1956a7', weight: 4, opacity: 0.85 }).addTo(coucheTrajet);
      }
      for (const it of tr.interruptions) {
        L.polyline([[it.de.lat, it.de.lng], [it.a.lat, it.a.lng]], { color: '#5d6d7a', weight: 3, dashArray: '6 8', opacity: 0.9 })
          .bindTooltip(`Interruption de ${G.dureeLisible(it.dureeS)} : aucune donnée`).addTo(coucheTrajet);
      }
      // Flèches de sens : une flèche environ tous les 400 m, orientée selon le déplacement.
      let cumul = 0;
      for (const seg of tr.segments) for (let k = 1; k < seg.length; k++) {
        cumul += G.distanceM(seg[k - 1], seg[k]);
        if (cumul >= 400) {
          cumul = 0;
          L.marker([seg[k].lat, seg[k].lng], { interactive: false, keyboard: false, icon: L.divIcon({ className: '', html: `<span class="trajet-fleche" style="transform: rotate(${G.cap(seg[k - 1], seg[k])}deg)"></span>`, iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(coucheTrajet);
        }
      }
      if (tr.points.length) {
        const a = tr.points[0], z = tr.points[tr.points.length - 1];
        L.circleMarker([a.lat, a.lng], { radius: 6, color: '#2a7a30', fillColor: '#4fb748', fillOpacity: 1 }).bindTooltip(`Début ${heureNC(a.mesureLe)}`, { permanent: true, direction: 'top', className: 'etiquette-trajet' }).addTo(coucheTrajet);
        L.circleMarker([z.lat, z.lng], { radius: 6, color: '#0b3a66', fillColor: '#f9dd18', fillOpacity: 1 }).bindTooltip(`Dernière mesure ${heureNC(z.mesureLe)}`, { permanent: true, direction: 'bottom', className: 'etiquette-trajet' }).addTo(coucheTrajet);
      }
      // Horaires disponibles : un relevé par minute au plus, et chaque interruption.
      const lignes = [];
      let derniereMinute = '';
      tr.points.forEach((p, i) => {
        const coupure = tr.interruptions.find(x => x.a === p);
        if (coupure) lignes.push(`<tr class="ligne-interruption"><td colspan="3">Interruption de ${esc(G.dureeLisible(coupure.dureeS))} : aucune donnée</td></tr>`);
        const minute = p.mesureLe.slice(0, 16);
        if (minute === derniereMinute && i !== tr.points.length - 1) return;
        derniereMinute = minute;
        const retard = Math.round((Date.parse(p.recuLe) - Date.parse(p.mesureLe)) / 1000);
        lignes.push(`<tr><td>${esc(heureNC(p.mesureLe))}</td><td>${esc(heureNC(p.recuLe))}</td><td>${retard > 5 ? esc(G.dureeLisible(retard)) : '—'}</td></tr>`);
      });
      // Les commandes de période sont construites une seule fois (le focus clavier n'est pas perdu
      // quand le trajet se prolonge) ; seuls le résumé et le tableau sont remplacés.
      if (!zone.querySelector('#trajet-periode')) {
        zone.innerHTML = `
          <h2 class="bloc__titre">Trajet</h2>
          <div class="trajet-periode">
            <label for="trajet-periode">Période</label>
            <select id="trajet-periode">
              ${[['30', '30 dernières minutes'], ['60', 'Dernière heure'], ['180', '3 dernières heures'], ['perso', 'Personnalisée (aujourd’hui)']].map(([k, t]) => `<option value="${k}" ${memo.periode === k ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
            <span class="trajet-perso" ${memo.periode === 'perso' ? '' : 'hidden'}>
              <label for="trajet-de">De</label><input id="trajet-de" type="time">
              <label for="trajet-a">À</label><input id="trajet-a" type="time">
            </span>
          </div>
          <p class="aide-bloc" id="trajet-resume"></p>
          <div id="trajet-horaires"></div>`;
        zone.querySelector('#trajet-periode').addEventListener('change', e => {
          memo.periode = e.target.value;
          zone.querySelector('.trajet-perso').hidden = memo.periode !== 'perso';
          dessinerTrajet(vue);
        });
        zone.querySelectorAll('#trajet-de, #trajet-a').forEach(x => x.addEventListener('change', () => dessinerTrajet(vue)));
      }
      zone.querySelector('#trajet-resume').textContent = `${v.libelle} : ${tr.points.length} mesure(s) sur la période, ${tr.interruptions.length} interruption(s). Trait plein : données continues. Pointillés : aucune donnée, aucun trajet n’est déduit. Les flèches indiquent le sens.`;
      zone.querySelector('#trajet-horaires').innerHTML = lignes.length
        ? `<div class="tableau-horaires"><table class="tableau"><caption class="visuellement-cache">Horaires des mesures</caption><thead><tr><th scope="col">Mesure GPS</th><th scope="col">Réception</th><th scope="col">Écart</th></tr></thead><tbody>${lignes.reverse().join('')}</tbody></table></div>`
        : '<p class="vide">Aucune mesure sur cette période.</p>';
    }
  };

  /**
   * Fond de carte : tuiles OpenStreetMap (en ligne, attribution obligatoire).
   * OpenStreetMap exige l'en-tête Referer. Une page ouverte en file:// n'en
   * envoie pas : les serveurs renvoient alors une image « Access blocked ».
   * Dans ce cas, aucune tuile n'est demandée et le fond schématique local
   * est affiché tout de suite. Il prend aussi le relais si aucune tuile ne
   * se charge (pas de connexion).
   */
  function ajouterFond(carte, vue) {
    if (location.protocol === 'file:') {
      fondSchematique(carte, vue, 'Fond OpenStreetMap non chargé : la page est ouverte comme fichier (file://), et OpenStreetMap refuse ces demandes. Pour l’afficher, lancez « npm start » dans le dossier maquette_interactive, puis ouvrez http://localhost:8000/espace.html. Fond schématique avec repères approximatifs en attendant.');
      return;
    }
    let chargees = 0;
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; contributeurs OpenStreetMap',
      referrerPolicy: 'strict-origin-when-cross-origin' // envoie l'origine de la page, exigée par OpenStreetMap
    }).addTo(carte);
    osm.on('tileload', () => { chargees++; });
    setTimeout(() => {
      if (chargees || !vue.isConnected || !carte._container || !carte._loaded) return;
      osm.remove();
      fondSchematique(carte, vue, 'Fond OpenStreetMap indisponible (pas de connexion) : fond schématique avec repères approximatifs.');
    }, 3500);
  }

  /** Fond local : quadrillage et repères approximatifs, signalé comme tel. */
  function fondSchematique(carte, vue, message) {
    const schema = L.layerGroup().addTo(carte);
    for (let lat = -22.40; lat <= -22.05; lat += 0.05) L.polyline([[lat, 166.25], [lat, 166.75]], { color: '#b9cfe0', weight: 1, interactive: false }).addTo(schema);
    for (let lng = 166.25; lng <= 166.75; lng += 0.05) L.polyline([[-22.40, lng], [-22.05, lng]], { color: '#b9cfe0', weight: 1, interactive: false }).addTo(schema);
    const reperes = E.simulationPositions.REPERES;
    const noms = { normandie: 'Normandie', magenta: 'Magenta', centre: 'Centre-ville', ansevata: 'Anse Vata', ducos: 'Ducos', koutio: 'Koutio', dumbea: 'Dumbéa', paita: 'Païta', montdore: 'Mont-Dore', plum: 'Plum' };
    for (const [cle, nom] of Object.entries(noms)) {
      L.circleMarker(reperes[cle], { radius: 3, color: '#5d6d7a', fillOpacity: 1, interactive: false }).bindTooltip(nom, { permanent: true, direction: 'right', className: 'etiquette-repere' }).addTo(schema);
    }
    carte.attributionControl.addAttribution('Fond schématique ÉDYSOL (repères approximatifs)');
    const note = vue.querySelector('#carte-fond');
    if (note) { note.hidden = false; note.textContent = message; }
  }
})(window);
