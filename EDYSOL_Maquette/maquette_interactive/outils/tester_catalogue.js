/* Vérification du catalogue, de sa compatibilité et des demandes client/secrétariat.
 * Exécution : node outils/tester_catalogue.js ; stockage fictif isolé, aucun serveur.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const stockage = new Map();

/** Charge les véritables modules de la maquette avec un stockage navigateur isolé.
 * @returns {object} Espace Edysol utilisable sans interface ni réseau.
 */
function charger() {
  const contexte = { console, Intl, Date, URLSearchParams,
    localStorage: { getItem: k => stockage.get(k) ?? null, setItem: (k, v) => stockage.set(k, v), removeItem: k => stockage.delete(k) },
    addEventListener() {}, document: { dispatchEvent() {} }, CustomEvent: class {} };
  contexte.window = contexte;
  vm.createContext(contexte);
  for (const fichier of ['commun/utilitaires', 'commun/catalogue', 'commun/visuels', 'commun/formulaire-commande',
    'metier/organisation', 'metier/notifications', 'metier/suivi_metier', 'metier/deplacement', 'demo/donnees-demo', 'demo/depot-demo', 'demo/api']) {
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../js/' + fichier + '.js'), 'utf8'), contexte, { filename: fichier });
  }
  return contexte.Edysol;
}
const E = charger();
let controles = 0;
/** Exécute un scénario nommé ; une erreur interrompt le programme. */
function verifier(nom, action) { action(); controles++; console.log('OK · ' + nom); }
const confirmes = ['parties-communes', 'fin-chantier', 'fin-bail', 'commerces', 'bureaux', 'particuliers', 'encombrants', 'tags', 'espaces-verts', 'karcher'];
verifier('Dix activités citées accessibles, neuf offres Q1 et une activité technique Q27', () => {
  assert.equal(E.OFFRES.length, 9); assert.equal(E.ACTIVITES_TECHNIQUES.length, 1);
  for (const id of confirmes) assert.ok(E.prestationParId(id));
});
verifier('Treize prestations publiques uniques et deux spécialités présentées en premier', () => {
  assert.equal(E.PRESTATIONS.length, 13);
  assert.equal(new Set(E.PRESTATIONS.map(p => p.id)).size, 13);
  assert.deepEqual(Array.from(E.PRESTATIONS.filter(p => p.specialite), p => p.id), ['fin-chantier', 'fin-bail']);
  assert.deepEqual(Array.from(E.PRESTATIONS.slice(0, 2), p => p.id), ['fin-chantier', 'fin-bail']);
});
verifier('Une seule entrée de décapage, résolue depuis les deux anciennes références', () => {
  for (const [id, titre] of Object.entries({ sols: 'Décapage des sols', lavage: 'Décapage des sols', vitres: 'Nettoyage des vitres', mobilier: 'Mobilier et postes de travail', specifique: 'Demande spécifique' })) assert.equal(E.libellePrestation(id), titre);
  assert.equal(E.prestationParId('lavage'), E.prestationParId('sols'));
  assert.equal(E.PRESTATIONS.filter(p => p.titre === 'Décapage des sols').length, 1);
  assert.equal(E.prestationParId('constructor'), null);
});
verifier('Types clients indépendants du choix de prestation', () => assert.equal(JSON.stringify(E.TYPES_CLIENTS), '["Particulier","Professionnel"]'));
verifier('Nettoyage haute pression : nom actualisé, identifiant inchangé et visuel à fournir', () => {
  assert.equal(E.prestationParId('karcher').id, 'karcher');
  assert.equal(E.libellePrestation('karcher'), 'Nettoyage haute pression');
  assert.equal(E.prestationParId('karcher').nature, 'activite-technique');
  assert.equal(E.visuelPrestation(E.prestationParId('karcher')), null);
});
verifier('Détails renseignés pour chaque prestation, avec procédés confirmés pour les sols et les vitres', () => {
  for (const p of E.PRESTATIONS) {
    assert.ok(p.resume && p.details.length > 0, p.id);
    assert.ok(p.details.every(partie => partie.titre && partie.texte), p.id);
  }
  const sols = E.prestationParId('sols');
  const vitres = E.prestationParId('vitres');
  assert.match(sols.resume, /machine spécialisée/);
  assert.match(JSON.stringify(sols.details), /disques/);
  assert.match(JSON.stringify(vitres.details), /eau déminéralisée/);
  assert.match(JSON.stringify(vitres.details), /produits d’entretien spécifiques/);
});
verifier('Images associées conservées et emplacements explicites lorsque le visuel manque', () => {
  assert.equal(E.visuelPrestation(E.prestationParId('bureaux')).id, 'bureaux');
  assert.equal(E.visuelPrestation(E.prestationParId('particuliers')).id, 'domicile');
  assert.equal(E.visuelPrestation(E.prestationParId('sols')).id, 'monobrosse');
  assert.equal(E.visuelPrestation(E.prestationParId('vitres')).id, 'vitres');
  for (const id of confirmes.filter(id => !['bureaux', 'particuliers'].includes(id))) {
    const html = E.mediaPrestation(E.prestationParId(id)); assert.match(html, /Illustration à fournir/); assert.doesNotMatch(html, /<img/);
  }
  assert.match(E.mediaPrestation({ titre: '<script>test</script>', visuel: 'absent' }), /&lt;script&gt;/);
});
verifier('Tous les médias et formats responsives référencés existent', () => {
  for (const v of E.VISUELS) for (const fichier of [v.src, ...(v.sources || []).flatMap(s => s.srcset.split(',').map(x => x.trim().split(/\s+/)[0]))]) assert.ok(fs.existsSync(path.resolve(__dirname, '..', fichier)), fichier);
});
verifier('Formulaire partagé : quatorze options, présélection et groupes conservés', () => {
  const html = E.formulaireCommande.champsEtape(0, { prestation: 'tags' });
  assert.equal((html.match(/name="prestation"/g) || []).length, 14);
  assert.match(html, /value="tags" checked/); assert.doesNotMatch(html, /type="checkbox" name="prestation"/);
  for (const g of E.GROUPES_PRESTATIONS) assert.ok(html.includes(E.esc(g.titre)));
  const ancienLien = E.formulaireCommande.champsEtape(0, { prestation: 'lavage' });
  assert.match(ancienLien, /value="sols" checked/);
  assert.doesNotMatch(ancienLien, /value="lavage"/);
});
verifier('E-mail, horaires et objets partagés correspondent au contact', () => {
  assert.equal(E.CONTACT.email, 'contact@edysol.nc');
  assert.equal(E.CONTACT.horaires, 'Du lundi au vendredi, de 07h30 à 12h00 et de 13h00 à 16h30.');
  assert.deepEqual(Object.entries(E.OBJETS_RAPPEL), [
    ['rendez-vous', 'Prendre rendez-vous'],
    ['question-prestation', 'Question sur une prestation']
  ]);
});
const donnees = { nom: 'Client essai EV-017', telephone: '123456', adresse: 'Adresse fictive de test', commune: 'Nouméa', description: 'Besoin fictif pour un essai', consentement: true };
const ids = [];
for (const source of ['client', 'secretaire']) verifier('Création et conservation du libellé pour chaque activité — ' + source, () => {
  for (const { id: prestation } of [...E.PRESTATIONS, E.DEMANDE_SPECIFIQUE]) {
    const saisie = { ...donnees, prestation, typeClient: 'Professionnel' };
    assert.equal(Object.keys(E.api.validerCommande(saisie)).length, 0);
    const c = E.api.creerCommande(saisie, source); ids.push(c.id);
    assert.equal(c.prestation, prestation); assert.equal(c.client.type, 'Professionnel');
    assert.equal(E.libellePrestation(c.prestation), E.prestationParId(prestation).titre);
  }
});
verifier('Nouvelle demande avec ancien identifiant enregistrée sur la référence canonique', () => {
  const saisie = { ...donnees, prestation: 'lavage' };
  assert.equal(Object.keys(E.api.validerCommande(saisie)).length, 0);
  const commande = E.api.creerCommande(saisie, 'client');
  ids.push(commande.id);
  assert.equal(commande.prestation, 'sols');
});
verifier('Multisélection et identifiant inconnu refusés à la saisie', () => {
  assert.ok(E.api.validerCommande({ ...donnees, prestation: ['tags', 'vitres'] }).prestation);
  assert.ok(E.api.validerCommande({ ...donnees, prestation: 'inconnu' }).prestation);
});
verifier('Rechargement : nouvelles demandes conservées, anciennes références intactes et résolues', () => {
  const recharge = charger(); const etat = recharge.api.charger();
  for (const id of ids) assert.ok(etat.commandes.find(c => c.id === id));
  assert.equal(etat.version, 3);
  for (const c of etat.commandes.filter(c => !ids.includes(c.id))) assert.ok(recharge.prestationParId(c.prestation));
  assert.equal(etat.commandes.find(c => c.id === 'EDY-2026-043').prestation, 'lavage');
  assert.equal(recharge.libellePrestation('lavage'), 'Décapage des sols');
  assert.match(recharge.libellePrestation('ancien-identifiant-externe'), /ancien-identifiant-externe/);
});
console.log(`${controles} scénarios du catalogue réussis, dont ${ids.length} créations avec rechargement local.`);
