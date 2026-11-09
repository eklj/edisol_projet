/* =========================================================================
   ÉDYSOL NC — Tests du suivi des véhicules (sans navigateur)
   Lancer depuis maquette_interactive : node outils/tester_geolocalisation.js
   ========================================================================= */
'use strict';
const assert = require('node:assert/strict');
const G = require('../js/metier/geolocalisation.js');

let controles = 0;
/** Exécute un contrôle nommé et l'affiche. */
function verifier(nom, action) { action(); controles++; console.log('OK · ' + nom); }

const t0 = Date.parse('2026-11-05T10:00:00+11:00');
const iso = ms => new Date(ms).toISOString();
const m = (secondes, extra = {}) => ({ vehiculeId: 'V1', lat: -22.27, lng: 166.45, mesureLe: iso(t0 + secondes * 1000), recuLe: iso(t0 + secondes * 1000 + 2000), vitesseKmh: 30, ...extra });

verifier('Mesure valide normalisée', () => assert.equal(G.normaliserMesure(m(0)).ok, true));
verifier('Mesure sans heure GPS refusée', () => assert.equal(G.normaliserMesure({ ...m(0), mesureLe: undefined }).ok, false));
verifier('Coordonnées hors limites refusées', () => assert.equal(G.normaliserMesure({ ...m(0), lat: 120 }).ok, false));
verifier('Réception avant la mesure refusée (horloges)', () => assert.equal(G.normaliserMesure({ ...m(0), recuLe: iso(t0 - 60000) }).ok, false));
verifier('Position actuelle si mesurée il y a moins de 2 min', () => assert.equal(G.etatCommunication(m(0), t0 + 60000).code, 'actuelle'));
verifier('Position ancienne entre 2 et 15 min, jamais présentée comme actuelle', () => {
  const e = G.etatCommunication(m(0), t0 + 6 * 60000);
  assert.equal(e.code, 'ancienne');
  assert.equal(e.enMouvement, false); // une vitesse ancienne ne dit rien du présent
});
verifier('Communication perdue au-delà de 15 min', () => assert.equal(G.etatCommunication(m(0), t0 + 20 * 60000).code, 'perdue'));
verifier('L’âge se calcule sur l’heure GPS, pas sur l’heure de réception', () => {
  const tardive = m(0, { recuLe: iso(t0 + 5 * 60000) });
  const e = G.etatCommunication(tardive, t0 + 5 * 60000);
  assert.equal(e.code, 'ancienne');
  assert.equal(e.retardReceptionS, 300);
});
verifier('Trajet : un trou de plus de 3 min devient une interruption, sans point inventé', () => {
  const tr = G.trajet([m(0), m(30), m(60), m(600), m(630)], t0, t0 + 3600 * 1000);
  assert.equal(tr.points.length, 5);
  assert.equal(tr.segments.length, 2);
  assert.equal(tr.interruptions[0].dureeS, 540);
});
verifier('Trajet limité à la période choisie et trié par heure GPS', () => {
  const tr = G.trajet([m(60), m(0), m(4000)], t0, t0 + 3600 * 1000);
  assert.deepEqual(tr.points.map(p => p.mesureLe), [iso(t0), iso(t0 + 60000)]);
});
verifier('Animation seulement entre deux mesures proches', () => {
  assert.equal(G.animationAutorisee(m(0), m(10)), true);
  assert.equal(G.animationAutorisee(m(0), m(900)), false);
});
verifier('Cap : vers l’est = 90°', () => assert.equal(Math.round(G.cap({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })), 90));
verifier('Accès carte : direction et secrétaire confirmés ; employé et contrôleuse refusés', () => {
  assert.deepEqual(G.accesCarte({ role: 'cogerant' }), { autorise: true, confirme: true });
  assert.deepEqual(G.accesCarte({ role: 'secretaire' }), { autorise: true, confirme: true });
  assert.equal(G.accesCarte({ role: 'employe' }).autorise, false);
  assert.equal(G.accesCarte({ role: 'controleuse' }).autorise, false);
});

console.log(`${controles} contrôles réussis (suivi des véhicules, logique locale).`);
