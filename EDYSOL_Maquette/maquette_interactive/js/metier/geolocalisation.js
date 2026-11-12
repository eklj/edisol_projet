/* =========================================================================
   ÉDYSOL NC — Règles de suivi des véhicules (fonctions pures)
   Aucune dépendance au navigateur ni à la carte : testé avec Node
   (outils/tester_geolocalisation.js) et réutilisable côté serveur.

   Une MESURE est une position transmise par un boîtier GPS :
     { vehiculeId, lat, lng, mesureLe, recuLe, vitesseKmh?, cap?, precisionM? }
   - mesureLe : heure à laquelle le GPS a mesuré la position ;
   - recuLe   : heure à laquelle le système l'a reçue.
   Les deux heures sont DISTINCTES : une mesure peut arriver en retard.

   État de communication (calculé sur l'heure de MESURE, jamais sur l'heure
   d'affichage) : 'actuelle', 'ancienne' ou 'perdue'. Les seuils sont des
   paramètres de démonstration à valider avec l'entreprise.
   Aucune position n'est inventée : pas d'extrapolation au-delà de la
   dernière mesure, et un trou dans les données reste un trou.
   ========================================================================= */
(function (racine) {
  'use strict';

  /** Seuils proposés (en secondes) : À VALIDER. */
  const SEUILS = { actuelleMax: 120, ancienneMax: 15 * 60, trouTrajet: 3 * 60, vitesseArret: 3 };

  /**
   * Vérifie et normalise une mesure reçue d'une source (simulée ou réelle).
   * Paramètre : objet brut. Retour : { ok, mesure, erreur }.
   * C'est le point de passage obligé de toute future source GPS réelle.
   */
  function normaliserMesure(brute) {
    if (!brute || typeof brute !== 'object') return { ok: false, erreur: 'Mesure absente.' };
    const lat = Number(brute.lat), lng = Number(brute.lng);
    if (!brute.vehiculeId) return { ok: false, erreur: 'Véhicule non identifié.' };
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return { ok: false, erreur: 'Coordonnées invalides.' };
    const mesure = Date.parse(brute.mesureLe), recu = Date.parse(brute.recuLe);
    if (!Number.isFinite(mesure)) return { ok: false, erreur: 'Heure de mesure GPS absente ou invalide.' };
    if (!Number.isFinite(recu)) return { ok: false, erreur: 'Heure de réception absente ou invalide.' };
    if (recu < mesure - 5000) return { ok: false, erreur: 'Reçue avant d’avoir été mesurée : horloges à vérifier.' };
    const facultatif = v => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
    return { ok: true, mesure: {
      vehiculeId: String(brute.vehiculeId), lat, lng,
      mesureLe: new Date(mesure).toISOString(), recuLe: new Date(recu).toISOString(),
      vitesseKmh: facultatif(brute.vitesseKmh), cap: facultatif(brute.cap), precisionM: facultatif(brute.precisionM)
    } };
  }

  /**
   * État de communication d'un véhicule à un instant donné.
   * Paramètres : dernière mesure (ou null), instant en ms, seuils.
   * Retour : { code, libelle, ageS, retardReceptionS, enMouvement }.
   */
  function etatCommunication(derniere, maintenantMs, seuils = SEUILS) {
    if (!derniere) return { code: 'perdue', libelle: 'Aucune position reçue', ageS: null, retardReceptionS: null, enMouvement: false };
    const ageS = Math.max(0, Math.round((maintenantMs - Date.parse(derniere.mesureLe)) / 1000));
    const retardReceptionS = Math.max(0, Math.round((Date.parse(derniere.recuLe) - Date.parse(derniere.mesureLe)) / 1000));
    let code = 'actuelle';
    if (ageS > seuils.ancienneMax) code = 'perdue';
    else if (ageS > seuils.actuelleMax) code = 'ancienne';
    // Mouvement : seulement si la position est actuelle (une vitesse ancienne ne dit rien du présent).
    const enMouvement = code === 'actuelle' && (derniere.vitesseKmh ?? 0) > seuils.vitesseArret;
    const libelle = code === 'perdue' ? 'Communication perdue' : code === 'ancienne' ? 'Position ancienne' : enMouvement ? 'En mouvement' : 'À l’arrêt';
    return { code, libelle, ageS, retardReceptionS, enMouvement };
  }

  /** Durée lisible en français (« 45 s », « 7 min », « 1 h 05 »). */
  function dureeLisible(secondes) {
    if (secondes === null || secondes === undefined) return '—';
    if (secondes < 60) return `${secondes} s`;
    const min = Math.floor(secondes / 60);
    if (min < 60) return `${min} min`;
    return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
  }

  /** Cap en degrés (0 = nord, 90 = est) entre deux points. Sert à orienter les flèches du trajet. */
  function cap(a, b) {
    const rad = x => x * Math.PI / 180;
    const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  /** Distance en mètres entre deux points (formule de haversine). */
  function distanceM(a, b) {
    const R = 6371000, rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /**
   * Prépare le trajet d'une période : mesures triées par heure GPS puis découpées
   * en segments continus. Un écart supérieur au seuil devient une INTERRUPTION
   * (affichée en pointillés) : aucun point n'est inventé dans le trou.
   * Retour : { points, segments: [[mesures]], interruptions: [{ de, a, dureeS }] }.
   */
  function trajet(mesures, debutMs, finMs, seuils = SEUILS) {
    const points = mesures.filter(m => { const t = Date.parse(m.mesureLe); return t >= debutMs && t <= finMs; })
      .sort((a, b) => Date.parse(a.mesureLe) - Date.parse(b.mesureLe));
    const segments = [], interruptions = [];
    let courant = [];
    for (let i = 0; i < points.length; i++) {
      if (i > 0) {
        const ecart = (Date.parse(points[i].mesureLe) - Date.parse(points[i - 1].mesureLe)) / 1000;
        if (ecart > seuils.trouTrajet) {
          segments.push(courant);
          interruptions.push({ de: points[i - 1], a: points[i], dureeS: Math.round(ecart) });
          courant = [];
        }
      }
      courant.push(points[i]);
    }
    if (courant.length) segments.push(courant);
    return { points, segments, interruptions };
  }

  /**
   * Indique si l'affichage peut animer le passage d'une mesure à la suivante.
   * Animation autorisée seulement entre deux mesures RÉELLES proches dans le temps ;
   * après une interruption, le marqueur saute à la nouvelle position, sans trajet inventé.
   */
  function animationAutorisee(precedente, suivante, seuils = SEUILS) {
    if (!precedente || !suivante) return false;
    const ecart = (Date.parse(suivante.mesureLe) - Date.parse(precedente.mesureLe)) / 1000;
    return ecart > 0 && ecart <= seuils.actuelleMax;
  }

  /**
   * Politique d'accès à la carte (à exécuter côté serveur en production).
   * Accès CONFIRMÉ (05/11/2026) pour la direction (cogérants) et la secrétaire.
   * Employés et contrôleuses : refusé, aucune règle ne leur ouvre la carte.
   * Consulter la carte ne donne aucun pouvoir de décision.
   */
  function accesCarte(acteur) {
    if (!acteur || !['secretaire', 'cogerant'].includes(acteur.role)) return { autorise: false, confirme: false };
    return { autorise: true, confirme: true };
  }

  const api = { SEUILS, normaliserMesure, etatCommunication, dureeLisible, cap, distanceM, trajet, animationAutorisee, accesCarte };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.EdysolGeo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
