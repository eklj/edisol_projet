/* =========================================================================
   ÉDYSOL NC — Tests de la boîte de réception (sans navigateur)
   Lancer depuis maquette_interactive : node outils/tester_notifications.js
   Scénario A (non lue ancienne), B (non lue récente), C (lue), D (nouvelle).
   ========================================================================= */
'use strict';
const assert = require('node:assert/strict');
const N = require('../js/metier/notifications.js');

let controles = 0;
/** Exécute un contrôle nommé et l'affiche. */
function verifier(nom, action) { action(); controles++; console.log('OK · ' + nom); }

const COG1 = 'personne:COG1', COG2 = 'personne:COG2', SEC = 'personne:SEC';
const direction = [SEC, COG1, COG2];
// Ordre physique volontairement mélangé : le tri ne doit pas en dépendre.
let notifs = [
  { id: 'C', pour: direction, titre: 'C', recueLe: '2026-10-30T09:00:00+11:00', lectures: { [COG1]: '2026-10-30T10:00:00+11:00' }, lien: 'commande/X' },
  { id: 'B', pour: direction, titre: 'B', recueLe: '2026-11-01T09:00:00+11:00', lectures: {}, lien: 'commande/Y' },
  { id: 'A', pour: direction, titre: 'A', recueLe: '2026-10-31T09:00:00+11:00', lectures: {}, lien: '' }
];
const ids = liste => liste.map(n => n.id);

verifier('1. A (ancienne) puis B (récente) avant C (lue)', () => {
  const b = N.boiteDe(notifs, COG1);
  assert.deepEqual(ids(b.nonLues), ['A', 'B']);
  assert.deepEqual(ids(b.lues), ['C']);
});
verifier('2. Nouvelle D placée après A et B, avant les lues', () => {
  notifs = [{ id: 'D', pour: direction, titre: 'D', recueLe: '2026-11-02T09:00:00+11:00', lectures: {}, lien: '' }, ...notifs];
  const b = N.boiteDe(notifs, COG1);
  assert.deepEqual([...ids(b.nonLues), ...ids(b.lues)], ['A', 'B', 'D', 'C']);
});
verifier('3. Construire la boîte ne change aucun statut', () => {
  const avant = JSON.stringify(notifs);
  N.boiteDe(notifs, COG1); N.compterNonLues(notifs, COG1);
  assert.equal(JSON.stringify(notifs), avant);
});
verifier('Clic sans contenu chargé : lecture refusée', () => {
  assert.equal(N.lecturePossible(notifs.find(n => n.id === 'B'), COG1, { type: 'detail', chemin: 'commande/Y', contenuCharge: false }).ok, false);
});
verifier('Détail différent de la notification : lecture refusée', () => {
  assert.equal(N.lecturePossible(notifs.find(n => n.id === 'B'), COG1, { type: 'detail', chemin: 'commande/Z', contenuCharge: true }).ok, false);
});
verifier('Personne non destinataire : lecture refusée', () => {
  assert.equal(N.lecturePossible(notifs.find(n => n.id === 'B'), 'personne:A', { type: 'message', contenuCharge: true }).ok, false);
});
verifier('Notification introuvable : lecture refusée', () => assert.equal(N.lecturePossible(undefined, COG1, { type: 'message', contenuCharge: true }).ok, false));
verifier('4. Ouvrir B marque seulement B et la garde dans l’historique', () => {
  const b = notifs.find(n => n.id === 'B');
  assert.equal(N.lecturePossible(b, COG1, { type: 'detail', chemin: 'commande/Y', contenuCharge: true }).ok, true);
  notifs = notifs.map(n => n.id === 'B' ? N.avecLecture(n, COG1, '2026-11-02T10:00:00+11:00') : n);
  const boite = N.boiteDe(notifs, COG1);
  assert.deepEqual(ids(boite.nonLues), ['A', 'D']);
  assert.deepEqual(ids(boite.lues), ['B', 'C']); // lues : plus récente réception d'abord (ordre provisoire)
});
verifier('5. Lecture du cogérant 1 : toujours non lue pour le cogérant 2 et la secrétaire', () => {
  assert.equal(N.estLue(notifs.find(n => n.id === 'B'), COG2), false);
  assert.equal(N.estLue(notifs.find(n => n.id === 'B'), SEC), false);
  // C n'a été lue que par le cogérant 1 : pour le cogérant 2, elle est non lue et la plus ancienne.
  assert.deepEqual(ids(N.boiteDe(notifs, COG2).nonLues), ['C', 'A', 'B', 'D']);
});
verifier('Relire ne change pas la date de première lecture', () => {
  const b = notifs.find(n => n.id === 'B');
  assert.equal(N.avecLecture(b, COG1, '2026-11-03T00:00:00+11:00').lectures[COG1], '2026-11-02T10:00:00+11:00');
});
verifier('8. Compteur = non lues du destinataire courant', () => {
  assert.equal(N.compterNonLues(notifs, COG1), 2);
  assert.equal(N.compterNonLues(notifs, COG2), 4); // C, A, B, D
  assert.equal(N.compterNonLues(notifs, 'personne:A'), 0);
});
verifier('Réception simultanée : ordre stable par identifiant', () => {
  const memes = [{ id: 'N-10', pour: [SEC], recueLe: '2026-11-02T09:00:00Z' }, { id: 'N-9', pour: [SEC], recueLe: '2026-11-02T09:00:00Z' }];
  assert.deepEqual(ids(N.boiteDe(memes, SEC).nonLues), ['N-9', 'N-10']);
});

console.log(`${controles} contrôles réussis (boîte de réception, logique locale).`);
