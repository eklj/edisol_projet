/* =========================================================================
   ÉDYSOL NC — Point d'intégration des positions GPS (« Edysol.positions »)
   La carte ne lit QUE ce module. Une source (simulée aujourd'hui, réelle
   demain) lui transmet des mesures brutes par recevoir() ; chaque mesure
   est vérifiée par EdysolGeo.normaliserMesure avant d'être gardée.

   Format attendu d'une mesure brute (indépendant de tout fournisseur) :
     { vehiculeId: 'V-DÉMO-01', lat: -22.27, lng: 166.45,
       mesureLe: '2026-11-05T10:00:00+11:00',   heure de mesure du GPS
       recuLe:   '2026-11-05T10:00:03+11:00',   heure de réception
       vitesseKmh: 28, cap: 135, precisionM: 8 }   (facultatifs)

   Pour brancher de vraies positions : écrire une source { nom, simulee: false,
   demarrer(recevoir), arreter() } qui reçoit les mesures de VOTRE serveur
   (par exemple par WebSocket ou SSE authentifié) et appelle recevoir(mesure).
   Aucune API de fournisseur n'est supposée ici. Les mesures restent en
   mémoire : rien n'est stocké dans le navigateur.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol = racine.Edysol || {};
  const CONSERVATION_MS = 6 * 3600 * 1000; // historique gardé en mémoire pour l'affichage (6 h)

  const parVehicule = new Map();   // vehiculeId -> mesures triées par heure GPS
  const abonnes = new Set();
  let source = null, active = false, derniereErreur = '';

  /**
   * Reçoit une mesure brute, la valide puis la range à sa place chronologique.
   * Une mesure arrivée en retard est insérée selon son heure GPS, pas selon son arrivée.
   * Retour : { ok, erreur }.
   */
  function recevoir(brute) {
    const r = racine.EdysolGeo.normaliserMesure(brute);
    if (!r.ok) { derniereErreur = r.erreur; return r; }
    const m = r.mesure;
    const liste = parVehicule.get(m.vehiculeId) || [];
    if (liste.some(x => x.mesureLe === m.mesureLe)) return { ok: true, doublon: true };
    let i = liste.length;
    while (i > 0 && liste[i - 1].mesureLe > m.mesureLe) i--;
    liste.splice(i, 0, m);
    const limite = Date.now() - CONSERVATION_MS;
    while (liste.length && Date.parse(liste[0].mesureLe) < limite) liste.shift();
    parVehicule.set(m.vehiculeId, liste);
    abonnes.forEach(f => f(m));
    return { ok: true };
  }

  /** Choisit la source (simulation ou réelle) ; arrête la précédente. */
  function utiliser(nouvelle) {
    arreter();
    source = nouvelle;
  }

  /** Démarre la source choisie. Une source réelle non configurée renvoie une erreur claire. */
  function demarrer() {
    if (!source) { derniereErreur = 'Aucune source de positions configurée.'; return false; }
    if (active) return true;
    try { source.demarrer(recevoir); active = true; derniereErreur = ''; return true; }
    catch (e) { derniereErreur = e.message; return false; }
  }

  function arreter() {
    if (source && active) source.arreter();
    active = false;
  }

  /** Abonnement aux nouvelles mesures ; retour : fonction de désabonnement. */
  function abonner(fonction) { abonnes.add(fonction); return () => abonnes.delete(fonction); }

  const mesures = vehiculeId => parVehicule.get(vehiculeId) || [];
  const derniere = vehiculeId => { const l = mesures(vehiculeId); return l.length ? l[l.length - 1] : null; };

  /**
   * Source réelle : volontairement NON configurée dans la maquette.
   * Elle échoue au démarrage au lieu de faire semblant de fonctionner.
   */
  const sourceReelleNonConfiguree = {
    nom: 'Source GPS réelle (non configurée)', simulee: false,
    demarrer() { throw new Error('Aucune source GPS réelle n’est configurée : fournisseur, autorisations et règles d’utilisation restent à choisir.'); },
    arreter() {}
  };

  E.positions = {
    recevoir, utiliser, demarrer, arreter, abonner, mesures, derniere, sourceReelleNonConfiguree,
    get source() { return source; }, get active() { return active; }, get erreur() { return derniereErreur; },
    /** Vide la mémoire (utilisé par les tests). */
    vider() { parVehicule.clear(); }
  };
})(window);
