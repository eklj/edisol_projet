/* =========================================================================
   ÉDYSOL NC — Tests du déplacement d'intervention (sans navigateur)
   Lancer depuis maquette_interactive : node outils/tester_deplacement.js
   ========================================================================= */
'use strict';
const assert = require('node:assert/strict');
const D = require('../js/metier/deplacement.js');

let controles = 0;
/** Exécute un contrôle nommé et l'affiche. */
function verifier(nom, action) { action(); controles++; console.log('OK · ' + nom); }

const equipes = [
  { id: 'B1', type: 'binome', nom: 'Binôme fixe 1', membres: ['A', 'B'] },
  { id: 'B2', type: 'binome', nom: 'Binôme fixe 2', membres: ['D', 'E'] },
  { id: 'S-C', type: 'solo', nom: 'Agent C (solo)', membres: ['C'] },
  { id: 'S-J', type: 'solo', nom: 'Agent J (solo)', membres: ['J'] },
  { id: 'M-CT1', type: 'controleuse', nom: 'Contrôleuse 1 (ménage)', membres: ['CT1'] }
];
const it = { id: 'I1', commandeId: 'EDY-1', date: '2026-11-09', debut: '10:00', fin: '12:00', equipeId: 'B1', statut: 'planifiee', creneauClient: 'non-confirme' };
const autres = [it, { id: 'I2', commandeId: 'EDY-2', date: '2026-11-09', debut: '13:00', fin: '15:00', equipeId: 'B2', statut: 'planifiee' }];
const donnees = { equipes, interventions: autres, aujourdhui: '2026-11-05' };

verifier('Avancer de 10 h à 9 h : durée conservée (2 h)', () => {
  const p = D.nouvellePosition(it, { date: it.date, debut: '09:00', equipeId: 'B1' });
  assert.deepEqual([p.debut, p.fin], ['09:00', '11:00']);
  assert.equal(D.controlerDeplacement(it, p, donnees).bloquants.length, 0);
});
verifier('Retarder de deux heures depuis 9 h : 11 h à 13 h', () => {
  const avance = { ...it, debut: '09:00', fin: '11:00' };
  const p = D.nouvellePosition(avance, { date: it.date, debut: '11:00' });
  assert.deepEqual([p.debut, p.fin], ['11:00', '13:00']);
});
verifier('Alignement sur la grille (30 min et 15 min)', () => {
  assert.equal(D.aligner(9 * 60 + 14, 30), 9 * 60);
  assert.equal(D.aligner(9 * 60 + 16, 30), 9 * 60 + 30);
  assert.equal(D.aligner(9 * 60 + 8, 15), 9 * 60 + 15);
});
verifier('Autre jour : autorisé et durée conservée', () => {
  const p = D.nouvellePosition(it, { date: '2026-11-10', debut: '10:00' });
  assert.equal(p.fin, '12:00');
  assert.equal(D.controlerDeplacement(it, p, donnees).bloquants.length, 0);
});
verifier('Vers un autre binôme complet : autorisé si libre', () => {
  const p = D.nouvellePosition(it, { date: it.date, debut: '08:00', equipeId: 'B2' });
  assert.equal(D.controlerDeplacement(it, p, donnees).bloquants.length, 0);
});
verifier('Chevauchement avec le binôme cible : bloquant, sans forçage possible', () => {
  const p = D.nouvellePosition(it, { date: it.date, debut: '12:00', equipeId: 'B2' });
  const r = D.controlerDeplacement(it, p, donnees);
  assert.equal(r.conflits.length, 1);
  assert.match(r.bloquants.join(' '), /Chevauchement avec EDY-2/);
  assert.equal(Object.keys(r).includes('forcer'), false);
});
verifier('Binôme vers employé seul : refusé (pas de passage en solo)', () => {
  const r = D.controlerDeplacement(it, D.nouvellePosition(it, { date: it.date, debut: '10:00', equipeId: 'S-C' }), donnees);
  assert.match(r.bloquants.join(' '), /passage en solo/);
});
verifier('Solo vers solo : autorisé ; solo vers binôme : refusé', () => {
  const solo = { ...it, id: 'I3', equipeId: 'S-C' };
  assert.equal(D.controlerDeplacement(solo, D.nouvellePosition(solo, { date: it.date, debut: '10:00', equipeId: 'S-J' }), donnees).bloquants.length, 0);
  assert.match(D.controlerDeplacement(solo, D.nouvellePosition(solo, { date: it.date, debut: '10:00', equipeId: 'B2' }), donnees).bloquants.join(' '), /type d’équipe/);
});
verifier('Hors plage de la grille : refusé', () => {
  assert.ok(D.controlerDeplacement(it, D.nouvellePosition(it, { date: it.date, debut: '18:00' }), donnees).bloquants.length);
});
verifier('Intervention en cours ou terminée : non déplaçable', () => {
  assert.ok(D.controlerDeplacement({ ...it, statut: 'terminee' }, D.nouvellePosition(it, { date: it.date, debut: '09:00' }), donnees).bloquants.length);
});
verifier('Créneau confirmé au client : avertissement, règles à définir', () => {
  const r = D.controlerDeplacement({ ...it, creneauClient: 'confirme' }, D.nouvellePosition(it, { date: it.date, debut: '09:00' }), donnees);
  assert.equal(r.bloquants.length, 0);
  assert.match(r.avertissements.join(' '), /règles à définir/);
});
verifier('Contrôles impossibles signalés (indisponibilités, véhicules, trajets)', () => {
  const r = D.controlerDeplacement(it, D.nouvellePosition(it, { date: it.date, debut: '09:00' }), donnees);
  assert.equal(r.impossibles.length, 3);
  assert.match(r.impossibles.join(' '), /Temps de trajet/);
});

verifier('Droits : la direction déplace et réaffecte', () => {
  const d = D.droitsPlanning({ role: 'cogerant' });
  assert.deepEqual([d.consulter, d.deplacer, d.reaffecter], [true, true, true]);
});
verifier('Droits : la secrétaire déplace et réaffecte (décision du 05/11/2026), sans validation commerciale', () => {
  const d = D.droitsPlanning({ role: 'secretaire' });
  assert.deepEqual([d.consulter, d.deplacer, d.reaffecter, d.validationCommerciale], [true, true, true, false]);
  assert.equal(D.controlerDeplacement(it, D.nouvellePosition(it, { date: '2026-11-10', debut: '09:00', equipeId: 'B2' }), { ...donnees, droits: d }).bloquants.length, 0);
});
verifier('Droits : les contrôles restent bloquants pour la secrétaire (conflit, passage en solo)', () => {
  const d = D.droitsPlanning({ role: 'secretaire' });
  assert.match(D.controlerDeplacement(it, D.nouvellePosition(it, { date: it.date, debut: '12:00', equipeId: 'B2' }), { ...donnees, droits: d }).bloquants.join(' '), /Chevauchement/);
  assert.match(D.controlerDeplacement(it, D.nouvellePosition(it, { date: it.date, debut: '10:00', equipeId: 'S-C' }), { ...donnees, droits: d }).bloquants.join(' '), /passage en solo/);
});
verifier('Droits : employé et contrôleuse sans accès au planning de gestion', () => {
  assert.equal(D.droitsPlanning({ role: 'employe' }).consulter, false);
  assert.equal(D.droitsPlanning({ role: 'controleuse' }).consulter, false);
  const r = D.controlerDeplacement(it, D.nouvellePosition(it, { date: it.date, debut: '09:00' }), { ...donnees, droits: D.droitsPlanning({ role: 'employe' }) });
  assert.match(r.bloquants.join(' '), /Droit de modifier le planning non attribué/);
});

console.log(`${controles} contrôles réussis (déplacement d'intervention).`);
