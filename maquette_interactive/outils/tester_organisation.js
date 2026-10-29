/* =========================================================================
   ÉDYSOL NC — Tests des règles d'organisation (sans navigateur)
   Lancer depuis maquette_interactive : node outils/tester_organisation.js
   Vérifie : 4 binômes fixes, solos à une personne, conflits SIGNALÉS mais
   jamais résolus automatiquement (aucun remplacement, aucun passage en solo).
   ========================================================================= */
'use strict';
const assert = require('node:assert/strict');
const O = require('../js/metier/organisation.js');

let controles = 0;
/** Exécute un contrôle nommé et l'affiche. */
function verifier(nom, action) { action(); controles++; console.log('OK · ' + nom); }

const equipes = [
  { id: 'B1', type: 'binome', nom: 'Binôme fixe 1', membres: ['A', 'B'] },
  { id: 'B2', type: 'binome', nom: 'Binôme fixe 2', membres: ['D', 'E'] },
  { id: 'B3', type: 'binome', nom: 'Binôme fixe 3', membres: ['F', 'G'] },
  { id: 'B4', type: 'binome', nom: 'Binôme fixe 4', membres: ['H', 'K'] },
  { id: 'S-C', type: 'solo', nom: 'Agent C (solo)', membres: ['C'] },
  { id: 'M-CT1', type: 'controleuse', nom: 'Contrôleuse 1 (ménage)', membres: ['CT1'] }
];
const personnes = [{ id: 'A', nom: 'Agent A' }, { id: 'B', nom: 'Agent B' }, { id: 'C', nom: 'Agent C' }, { id: 'CT1', nom: 'Contrôleuse 1' }];

verifier('Composition de référence conforme', () => assert.deepEqual(O.verifierComposition(equipes), []));
verifier('Trois binômes seulement : erreur', () => assert.ok(O.verifierComposition(equipes.filter(e => e.id !== 'B4')).length));
verifier('Binôme à trois personnes refusé', () => assert.ok(O.verifierComposition(equipes.map(e => e.id === 'B1' ? { ...e, membres: ['A', 'B', 'C2'] } : e)).length));
verifier('Solo à deux personnes refusé', () => assert.ok(O.verifierComposition(equipes.map(e => e.id === 'S-C' ? { ...e, membres: ['C', 'Z'] } : e)).length));
verifier('Personne dans deux équipes refusée', () => assert.ok(O.verifierComposition([...equipes, { id: 'S-A', type: 'solo', nom: 'Agent A (solo)', membres: ['A'] }]).length));

const existantes = [{ id: 'I1', date: '2026-11-02', debut: '08:00', fin: '10:00', equipeId: 'B1' }];
verifier('Chevauchement du même binôme signalé', () => {
  const r = O.controlerAffectation({ date: '2026-11-02', debut: '09:00', fin: '11:00', equipeId: 'B1' }, equipes, existantes);
  assert.equal(r.conflits.length, 1);
});
verifier('Créneaux qui se touchent sans chevauchement acceptés', () => {
  assert.equal(O.controlerAffectation({ date: '2026-11-02', debut: '10:00', fin: '12:00', equipeId: 'B1' }, equipes, existantes).conflits.length, 0);
});
verifier('Autre équipe au même moment acceptée', () => {
  assert.equal(O.controlerAffectation({ date: '2026-11-02', debut: '08:00', fin: '10:00', equipeId: 'B2' }, equipes, existantes).conflits.length, 0);
});
verifier('Conflit signalé sans proposition de remplacement', () => {
  const r = O.controlerAffectation({ date: '2026-11-02', debut: '08:30', fin: '09:30', equipeId: 'B1' }, equipes, existantes);
  assert.deepEqual(Object.keys(r).sort(), ['conflits', 'erreurs']); // aucune clé « remplacement » ni « solo »
});
verifier('Fin avant début refusée', () => assert.ok(O.controlerAffectation({ date: '2026-11-02', debut: '10:00', fin: '09:00', equipeId: 'B1' }, equipes, []).erreurs.length));
verifier('Équipe inconnue refusée', () => assert.ok(O.controlerAffectation({ date: '2026-11-02', debut: '08:00', fin: '09:00', equipeId: 'X' }, equipes, []).erreurs.length));
verifier('Le partenaire de binôme est nommé', () => assert.equal(O.decrireOrganisation(equipes[0], 'A', personnes), 'Binôme fixe 1 · avec Agent B'));
verifier('Le solo est décrit comme tel', () => assert.equal(O.decrireOrganisation(equipes[4], 'C', personnes), 'Agent C · solo'));
verifier('Équipes de la contrôleuse : ménage uniquement', () => assert.deepEqual(O.equipesDe('CT1', equipes).map(e => e.type), ['controleuse']));
verifier('Règles d’absence et de renfort laissées à décider', () => assert.ok(O.REGLES_EN_ATTENTE.some(r => r.includes('Absence'))));

console.log(`${controles} contrôles réussis (règles d'organisation de la maquette).`);

// La copie de la référence métier utilisée par la maquette doit rester identique à l'original V1.
const fs = require('node:fs');
const path = require('node:path');
const original = path.resolve(__dirname, '../../maquette_EdisolNC/Edysol_NC_Maquette_V1/reference/suivi_metier.js');
if (fs.existsSync(original)) {
  assert.equal(fs.readFileSync(path.resolve(__dirname, '../js/metier/suivi_metier.js'), 'utf8'), fs.readFileSync(original, 'utf8'));
  console.log('OK · js/metier/suivi_metier.js identique à la référence V1');
}
