/** Vérifications locales de la référence métier ; lancer avec node verifier_metier.js. */
'use strict';
const assert = require('node:assert/strict');
const M = require('./suivi_metier.js');
let controles = 0;
/** Exécute un contrôle nommé ; paramètres : libellé et fonction sans retour. */
function verifier(nom, action) { action(); controles++; console.log('OK — ' + nom); }
/** Construit un exemple de commande ; le paramètre remplace les champs utiles au scénario. */
function commande(modifications = {}) {
  return {rapportId:'CR1', employeId:'E1', vehiculeId:'V1', compteur:100,
    dateReleve:'2026-10-24T10:00:00+11:00', dateSaisie:'2026-10-27T10:00:00+11:00',
    cleIdempotence:'R1', auteur:'E1', ...modifications};
}
let h = M.enregistrerReleve([], commande());
h = M.enregistrerReleve(h, commande({rapportId:'CR2', employeId:'E2', compteur:150,
  dateReleve:'2026-10-26T10:00:00+11:00', cleIdempotence:'R2', auteur:'E2'}));
verifier('Deux employés : le compteur est 150, pas 250', () => assert.equal(M.suiviVehicule(h,'V1').dernier.compteur,150));
verifier('Réessai identique sans doublon', () => assert.strictEqual(M.enregistrerReleve(h,commande()),h));
verifier('Clé réutilisée avec autre contenu refusée', () => assert.throws(() => M.enregistrerReleve(h,commande({compteur:101}))));
verifier('Doublon compte rendu/véhicule refusé', () => assert.throws(() => M.enregistrerReleve(h,commande({cleIdempotence:'R3'}))));
const tardif = M.enregistrerReleve(h,commande({rapportId:'CR3', compteur:125, dateReleve:'2026-10-25T10:00:00+11:00', cleIdempotence:'R3'}));
verifier('Saisie tardive ne remplace pas le dernier relevé daté', () => assert.equal(M.suiviVehicule(tardif,'V1').dernier.compteur,150));
verifier('Ordre réel des relevés conservé', () => assert.deepEqual(M.suiviVehicule(tardif,'V1').lignes.map(r=>r.compteur),[100,125,150]));
const anomalieAvant = M.enregistrerReleve(h,commande({rapportId:'CR3', compteur:90,dateReleve:'2026-10-25T10:00:00+11:00',cleIdempotence:'R3'}));
verifier('Relevé inférieur au voisin précédent signalé', () => assert.ok(M.suiviVehicule(anomalieAvant,'V1').anomalies.length));
const anomalieApres = M.enregistrerReleve(h,commande({rapportId:'CR3', compteur:160,dateReleve:'2026-10-25T10:00:00+11:00',cleIdempotence:'R3'}));
verifier('Relevé tardif supérieur au voisin suivant signalé', () => assert.ok(M.suiviVehicule(anomalieApres,'V1').anomalies.length));
const conflitDate = M.enregistrerReleve(h,commande({rapportId:'CR3', compteur:140,dateReleve:'2026-10-26T10:00:00+11:00',cleIdempotence:'R3'}));
verifier('Derniers relevés simultanés contradictoires laissés ambigus', () => assert.equal(M.suiviVehicule(conflitDate,'V1').dernier,null));
const corrige = M.enregistrerReleve(h,commande({compteur:110, corrigeReleveId:'R1', revisionAttendue:1, motif:'Erreur de lecture', cleIdempotence:'COR1'}));
verifier('Correction conserve la version d’origine', () => assert.equal(corrige.find(r=>r.cleIdempotence==='R1').compteur,100));
verifier('Projection applique la nouvelle version', () => assert.equal(M.suiviVehicule(corrige,'V1').lignes[0].compteur,110));
verifier('Correction sans motif refusée', () => assert.throws(()=>M.enregistrerReleve(h,commande({corrigeReleveId:'R1',revisionAttendue:1,cleIdempotence:'COR2'}))));
verifier('Correction concurrente refusée', () => assert.throws(()=>M.enregistrerReleve(corrige,commande({corrigeReleveId:'R1',revisionAttendue:1,motif:'Autre',cleIdempotence:'COR2'}))));
verifier('Aucun véhicule : aucun relevé', () => assert.equal(M.normaliserReleve(commande({vehiculeId:null,compteur:null})),null));
verifier('Aucun véhicule avec compteur résiduel refusé', () => assert.throws(()=>M.normaliserReleve(commande({vehiculeId:null}))));
for (const valeur of [-1,NaN,Infinity,'',null]) verifier('Compteur invalide : '+String(valeur),()=>assert.throws(()=>M.normaliserReleve(commande({compteur:valeur}))));
verifier('Compteur zéro autorisé',()=>assert.equal(M.normaliserReleve(commande({compteur:0})).compteur,0));
verifier('Date sans fuseau refusée',()=>assert.throws(()=>M.normaliserReleve(commande({dateReleve:'2026-10-24T10:00'}))));
verifier('Date civile impossible refusée',()=>assert.throws(()=>M.normaliserReleve(commande({dateReleve:'2026-02-30T10:00:00+11:00'}))));
verifier('Identité employé requise',()=>assert.throws(()=>M.normaliserReleve(commande({employeId:null}))));
verifier('Véhicules indépendants',()=>assert.equal(M.suiviVehicule(h,'V2').dernier,null));
const article={id:'A1',unite:'L',nature:'CONSOMMABLE'};
const entree={id:'M1',articleId:'A1',unite:'L',type:'ENTREE',quantiteMilli:10000,motif:'Livraison',auteur:'S1',date:'2026-10-27T10:00:00+11:00'};
let stock=M.mouvementStock([],article,entree);
stock=M.mouvementStock(stock,article,{...entree,id:'M2',type:'SORTIE',quantiteMilli:2500,motif:'Sortie'});
verifier('Stock = entrées moins sorties',()=>assert.equal(M.stockCourant(stock,'A1').quantite,7.5));
verifier('Quantités décimales sans arrondi flottant',()=>assert.equal(M.quantiteMilli('24,5'),24500));
verifier('Unité incompatible refusée',()=>assert.throws(()=>M.mouvementStock(stock,article,{...entree,id:'M3',unite:'kg'})));
verifier('Mouvement répété sans doublon',()=>assert.strictEqual(M.mouvementStock(stock,article,entree),stock));
verifier('Matériel durable indivisible',()=>assert.throws(()=>M.mouvementStock([],{...article,nature:'DURABLE'},{...entree,quantiteMilli:1500})));
verifier('Écart d’inventaire ne crée pas de mouvement',()=>{assert.equal(M.ecartInventaire(24500,24000),-.5);assert.equal(stock.length,2);});
for(const role of ['employe','superviseuse']) verifier(role+' exclu de la comptabilité',()=>assert.equal(M.autoriserComptabilite({role,permissions:['stocks:ecrire']},'comptabilite:lire'),false));
for(const role of ['secretaire','cogerant']){
 verifier(role+' peut consulter',()=>assert.equal(M.autoriserComptabilite({role},'comptabilite:lire'),true));
 verifier(role+' sans droit explicite ne peut modifier',()=>assert.equal(M.autoriserComptabilite({role},'stocks:ecrire'),false));
}
verifier('Requête anonyme refusée',()=>assert.equal(M.autoriserComptabilite(null,'comptabilite:lire'),false));
console.log(controles+' contrôles réussis. Politique de référence uniquement ; aucun serveur n’est connecté.');
