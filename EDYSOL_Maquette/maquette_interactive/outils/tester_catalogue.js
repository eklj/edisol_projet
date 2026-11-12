/* Tests EV-017 : couverture sourcée, compatibilité et demandes client/secrétariat.
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
verifier('Aucun identifiant du catalogue en double et quatorze entrées conservées', () => {
  assert.equal(E.PRESTATIONS.length, 14); assert.equal(new Set(E.PRESTATIONS.map(p => p.id)).size, 14);
});
verifier('Anciens identifiants et demande spécifique inchangés', () => {
  for (const [id, titre] of Object.entries({ sols: 'Entretien des sols', lavage: 'Lavage mécanisé des sols', vitres: 'Nettoyage des vitres', mobilier: 'Mobilier et postes de travail', specifique: 'Demande spécifique' })) assert.equal(E.libellePrestation(id), titre);
});
verifier('Types clients indépendants du choix de prestation', () => assert.equal(JSON.stringify(E.TYPES_CLIENTS), '["Particulier","Professionnel"]'));
verifier('Kärcher distinct de la monobrosse : identifiants, nature et absence de faux visuel', () => {
  assert.notEqual(E.prestationParId('karcher').id, E.prestationParId('lavage').id);
  assert.equal(E.prestationParId('karcher').nature, 'activite-technique');
  assert.equal(E.visuelPrestation(E.prestationParId('karcher')), null);
});
verifier('Images pertinentes bureaux/particuliers et emplacements explicites pour les autres', () => {
  assert.equal(E.visuelPrestation(E.prestationParId('bureaux')).id, 'bureaux');
  assert.equal(E.visuelPrestation(E.prestationParId('particuliers')).id, 'domicile');
  for (const id of confirmes.filter(id => !['bureaux', 'particuliers'].includes(id))) {
    const html = E.mediaPrestation(E.prestationParId(id)); assert.match(html, /Illustration à fournir/); assert.doesNotMatch(html, /<img/);
  }
  assert.match(E.mediaPrestation({ titre: '<script>test</script>', visuel: 'absent' }), /&lt;script&gt;/);
});
verifier('Tous les médias et formats responsives référencés existent', () => {
  for (const v of E.VISUELS) for (const fichier of [v.src, ...(v.sources || []).flatMap(s => s.srcset.split(',').map(x => x.trim().split(/\s+/)[0]))]) assert.ok(fs.existsSync(path.resolve(__dirname, '..', fichier)), fichier);
});
verifier('Formulaire partagé : quinze options radio, valeur préremplie et classement distinct', () => {
  const html = E.formulaireCommande.champsEtape(0, { prestation: 'tags' });
  assert.equal((html.match(/name="prestation"/g) || []).length, 15);
  assert.match(html, /value="tags" checked/); assert.doesNotMatch(html, /type="checkbox" name="prestation"/);
  for (const g of E.GROUPES_PRESTATIONS) assert.ok(html.includes(E.esc(g.titre)));
});
const donnees = { nom: 'Client essai EV-017', telephone: '123456', adresse: 'Adresse fictive de test', commune: 'Nouméa', description: 'Besoin fictif pour un essai', consentement: true };
const ids = [];
for (const source of ['client', 'secretaire']) verifier('Création et conservation du libellé pour chaque activité — ' + source, () => {
  for (const prestation of confirmes) {
    const saisie = { ...donnees, prestation, typeClient: 'Professionnel' };
    assert.equal(Object.keys(E.api.validerCommande(saisie)).length, 0);
    const c = E.api.creerCommande(saisie, source); ids.push(c.id);
    assert.equal(c.prestation, prestation); assert.equal(c.client.type, 'Professionnel');
    assert.equal(E.libellePrestation(c.prestation), E.prestationParId(prestation).titre);
  }
});
verifier('Multisélection et identifiant inconnu refusés à la saisie', () => {
  assert.ok(E.api.validerCommande({ ...donnees, prestation: ['tags', 'vitres'] }).prestation);
  assert.ok(E.api.validerCommande({ ...donnees, prestation: 'inconnu' }).prestation);
});
verifier('Rechargement : vingt demandes conservées et anciennes demandes toujours résolues', () => {
  const recharge = charger(); const etat = recharge.api.charger();
  for (const id of ids) assert.ok(etat.commandes.find(c => c.id === id));
  assert.equal(etat.version, 3);
  for (const c of etat.commandes.filter(c => !ids.includes(c.id))) assert.ok(recharge.prestationParId(c.prestation));
  assert.match(recharge.libellePrestation('ancien-identifiant-externe'), /ancien-identifiant-externe/);
});
console.log(`${controles} scénarios EV-017 réussis, dont vingt créations et rechargement local ; aucun serveur testé.`);
