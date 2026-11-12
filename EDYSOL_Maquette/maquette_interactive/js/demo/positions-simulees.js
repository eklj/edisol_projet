/* =========================================================================
   ÉDYSOL NC — SIMULATION de positions GPS (mode démonstration uniquement)
   Démonstration — positions simulées : véhicules et trajets FICTIFS dans le
   Grand Nouméa. Les tracés relient des points approximatifs en ligne droite :
   ils ne suivent pas forcément les routes.
   Aucune position réelle n'est collectée : ce fichier n'utilise ni le GPS
   de l'appareil (navigator.geolocation) ni aucun service externe.

   Scénarios :
   - V-DÉMO-01 : tournée en ville, mesure toutes les 10 s (position actuelle) ;
   - V-DÉMO-02 : stationné au dépôt de Normandie, mesure toutes les 60 s ;
   - V-DÉMO-03 : communication perdue depuis 22 min avant l'ouverture de la page ;
   - V-DÉMO-04 : boîtier qui enregistre toutes les 20 s mais n'envoie que par
     rafales (2 min sur 8) : la position affichée vieillit entre deux envois,
     et l'heure de réception diffère nettement de l'heure de mesure.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const G = racine.EdysolGeo;

  /** Points approximatifs (lat, lng) : repères de démonstration, pas des adresses. */
  const P = {
    normandie: [-22.2395, 166.4735], magenta: [-22.2635, 166.4705], vallee: [-22.2700, 166.4560],
    centre: [-22.2745, 166.4440], latin: [-22.2800, 166.4470], citrons: [-22.2950, 166.4400],
    ansevata: [-22.3010, 166.4455], valplaisance: [-22.2880, 166.4560], ducos: [-22.2480, 166.4470],
    koutio: [-22.2150, 166.4630], dumbea: [-22.1550, 166.4600], paita: [-22.1330, 166.3650],
    montdore: [-22.2650, 166.5610], plum: [-22.2910, 166.6370]
  };
  const pt = nom => ({ lat: P[nom][0], lng: P[nom][1], nom });

  /** Trajets en boucle : arrêt de quelques minutes à chaque étape (chantier). */
  const SCENARIOS = {
    'V-DÉMO-01': { boucle: ['normandie', 'magenta', 'vallee', 'centre', 'latin', 'citrons', 'ansevata', 'valplaisance', 'magenta'], vitesse: 28, arretMin: 2, periodeS: 10, retardS: [1, 3] },
    'V-DÉMO-02': { fixe: 'normandie', periodeS: 60, retardS: [1, 2] },
    'V-DÉMO-03': { boucle: ['normandie', 'magenta', 'montdore', 'plum', 'montdore'], vitesse: 35, arretMin: 6, periodeS: 15, retardS: [1, 4], coupureAvantS: 22 * 60 },
    'V-DÉMO-04': { boucle: ['ducos', 'koutio', 'dumbea', 'paita', 'dumbea', 'koutio'], vitesse: 40, arretMin: 5, periodeS: 20, rafale: { cycleS: 480, ouvertureS: 120 } }
  };

  /** Prépare une boucle : longueurs et durées de chaque tronçon. */
  function preparer(sc) {
    const etapes = sc.boucle.map(pt);
    const troncons = etapes.map((a, i) => {
      const b = etapes[(i + 1) % etapes.length];
      const dureeS = G.distanceM(a, b) / (sc.vitesse / 3.6);
      return { a, b, dureeS, cap: G.cap(a, b) };
    });
    const cycleS = troncons.reduce((s, t) => s + t.dureeS + sc.arretMin * 60, 0);
    return { troncons, cycleS };
  }
  const prepares = {};
  for (const [id, sc] of Object.entries(SCENARIOS)) if (sc.boucle) prepares[id] = preparer(sc);

  /** Position simulée d'un véhicule à l'instant t (ms) : arrêt puis trajet, tronçon par tronçon. */
  function positionA(id, tMs) {
    const sc = SCENARIOS[id];
    if (sc.fixe) return { ...pt(sc.fixe), vitesseKmh: 0, cap: null };
    const { troncons, cycleS } = prepares[id];
    let reste = ((tMs / 1000) % cycleS + cycleS) % cycleS;
    for (const tr of troncons) {
      if (reste < sc.arretMin * 60) return { lat: tr.a.lat, lng: tr.a.lng, vitesseKmh: 0, cap: null };
      reste -= sc.arretMin * 60;
      if (reste < tr.dureeS) {
        const f = reste / tr.dureeS;
        return { lat: tr.a.lat + (tr.b.lat - tr.a.lat) * f, lng: tr.a.lng + (tr.b.lng - tr.a.lng) * f, vitesseKmh: sc.vitesse, cap: Math.round(tr.cap) };
      }
      reste -= tr.dureeS;
    }
    const dernier = troncons[0].a;
    return { lat: dernier.lat, lng: dernier.lng, vitesseKmh: 0, cap: null };
  }

  /** Petit générateur pseudo-aléatoire reproductible (retards de réception). */
  const alea = (graine) => { const x = Math.sin(graine) * 10000; return x - Math.floor(x); };

  /**
   * Fabrique la mesure brute « mesurée » à l'instant t, avec son heure de réception.
   * Retour : null si le boîtier ne transmet pas (coupure).
   */
  function mesureA(id, tMs, ouverture, coupures) {
    const sc = SCENARIOS[id];
    if (sc.coupureAvantS && tMs > ouverture - sc.coupureAvantS * 1000) return null;
    if (coupures.has(id) && tMs >= coupures.get(id)) return null;
    const p = positionA(id, tMs);
    let recu;
    if (sc.rafale) {
      // Réception à la prochaine fenêtre d'envoi : la mesure attend dans le boîtier.
      const cycle = sc.rafale.cycleS * 1000, debutCycle = Math.floor(tMs / cycle) * cycle;
      recu = tMs - debutCycle < sc.rafale.ouvertureS * 1000 ? tMs + 2000 : debutCycle + cycle + 2000;
    } else {
      const [min, max] = sc.retardS;
      recu = tMs + (min + alea(tMs / 1000 + id.length) * (max - min)) * 1000;
    }
    return { vehiculeId: id, lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6), mesureLe: new Date(tMs).toISOString(), recuLe: new Date(Math.round(recu)).toISOString(),
      vitesseKmh: p.vitesseKmh, cap: p.cap, precisionM: 8 };
  }

  /**
   * Source simulée conforme au point d'intégration Edysol.positions.
   * Au démarrage : 4 h d'historique, puis une vérification toutes les secondes.
   * Une mesure n'est transmise qu'une fois son heure de réception atteinte.
   */
  function creerSourceSimulee() {
    const ouverture = Date.now();
    const coupures = new Map();       // coupures manuelles (outil de démo) : id -> instant
    const enAttente = [];             // mesures mesurées mais pas encore reçues
    const dernierInstant = {};
    let minuterie = null, recevoir = null;

    /** Produit les mesures dont l'heure de mesure est passée, dans l'ordre. */
    function produireJusqua(maintenant) {
      for (const [id, sc] of Object.entries(SCENARIOS)) {
        const pas = sc.periodeS * 1000;
        let t = dernierInstant[id] ?? (Math.floor((maintenant - 4 * 3600 * 1000) / pas) * pas);
        while (t + pas <= maintenant) {
          t += pas;
          const m = mesureA(id, t, ouverture, coupures);
          if (m) enAttente.push(m);
        }
        dernierInstant[id] = t;
      }
      // Transmission : seulement les mesures dont l'heure de réception est atteinte.
      enAttente.sort((a, b) => a.recuLe.localeCompare(b.recuLe));
      while (enAttente.length && Date.parse(enAttente[0].recuLe) <= maintenant) recevoir(enAttente.shift());
    }

    return {
      nom: 'Simulation de démonstration', simulee: true,
      demarrer(fonctionRecevoir) {
        recevoir = fonctionRecevoir;
        produireJusqua(Date.now());
        minuterie = setInterval(() => produireJusqua(Date.now()), 1000);
      },
      arreter() { clearInterval(minuterie); minuterie = null; },
      /** Outil de démo : couper ou rétablir la communication d'un véhicule. */
      couper(id) { coupures.set(id, Date.now()); },
      retablir(id) { coupures.delete(id); },
      estCoupe: id => coupures.has(id) || Boolean(SCENARIOS[id]?.coupureAvantS),
      estCoupeManuellement: id => coupures.has(id),
      /** Accélère les tests : force un passage immédiat. */
      avancer() { produireJusqua(Date.now()); }
    };
  }

  E.simulationPositions = { creerSourceSimulee, SCENARIOS, REPERES: P };
})(window);
