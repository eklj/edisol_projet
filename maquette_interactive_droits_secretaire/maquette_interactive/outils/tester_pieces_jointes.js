/* =========================================================================
   ÉDYSOL NC — Tests des règles de pièces jointes (sans navigateur)
   Lancer depuis maquette_interactive : node outils/tester_pieces_jointes.js
   ========================================================================= */
'use strict';
const assert = require('node:assert/strict');
const P = require('../js/metier/pieces_jointes.js');

let controles = 0;
/** Exécute un contrôle nommé et l'affiche. */
function verifier(nom, action) { action(); controles++; console.log('OK · ' + nom); }

const ascii = s => [...s].map(c => c.charCodeAt(0));
const JPEG = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10];
const PNG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0];
const WEBP = [...ascii('RIFF'), 0x24, 0, 0, 0, ...ascii('WEBPVP8 ')];
const PDF = ascii('%PDF-1.7\n');
const EXE = ascii('MZ\x90\x00');
const MO = 1024 * 1024;

verifier('Signatures reconnues : JPEG, PNG, WebP, PDF', () => {
  assert.equal(P.detecterType(JPEG), 'image/jpeg');
  assert.equal(P.detecterType(PNG), 'image/png');
  assert.equal(P.detecterType(WEBP), 'image/webp');
  assert.equal(P.detecterType(PDF), 'application/pdf');
  assert.equal(P.detecterType(EXE), null);
  assert.equal(P.detecterType(ascii('RIFF....WAVE')), null);
});
verifier('Photo JPEG valide acceptée, type réel retenu', () => {
  const r = P.verifierFichier({ nom: 'cuisine.JPG', taille: 2 * MO, typeDeclare: 'image/jpeg' }, JPEG);
  assert.deepEqual([r.ok, r.type, r.categorie], [true, 'image/jpeg', 'photo']);
});
verifier('PDF valide accepté', () => {
  assert.equal(P.verifierFichier({ nom: 'plan.pdf', taille: 300000 }, PDF).ok, true);
});
verifier('Format interdit refusé avec un message clair', () => {
  const r = P.verifierFichier({ nom: 'devis.docx', taille: 1000 }, ascii('PK\x03\x04'));
  assert.equal(r.ok, false);
  assert.match(r.erreur, /JPEG, PNG, WebP ou PDF/);
});
verifier('Fichier déguisé (exécutable renommé en .jpg) refusé', () => {
  const r = P.verifierFichier({ nom: 'photo.jpg', taille: 5000, typeDeclare: 'image/jpeg' }, EXE);
  assert.equal(r.ok, false);
  assert.match(r.erreur, /contenu n’a pas été reconnu/);
});
verifier('PDF renommé en .png refusé (contenu et extension incohérents)', () => {
  assert.match(P.verifierFichier({ nom: 'x.png', taille: 5000 }, PDF).erreur, /ne correspond pas à son extension/);
});
verifier('HEIC refusé avec conseil pour iPhone', () => {
  assert.match(P.verifierFichier({ nom: 'IMG_0001.HEIC', taille: 5000 }, []).erreur, /Le plus compatible/);
});
verifier('Dépassement de taille refusé, taille et limite indiquées', () => {
  const r = P.verifierFichier({ nom: 'grande.png', taille: 12 * MO }, PNG);
  assert.equal(r.ok, false);
  assert.match(r.erreur, /12 Mo.*10 Mo/);
});
verifier('Fichier vide refusé', () => {
  assert.equal(P.verifierFichier({ nom: 'vide.pdf', taille: 0 }, PDF).ok, false);
});
verifier('Nombre maximal de fichiers respecté', () => {
  const selection = Array.from({ length: 7 }, () => ({ taille: 1000 }));
  const r = P.verifierAjout(selection, [{ nom: 'a.jpg', taille: 1000 }, { nom: 'b.jpg', taille: 1000 }]);
  assert.equal(r.acceptes.length, 1);
  assert.match(r.refuses[0].erreur, /8 fichiers au maximum/);
});
verifier('Total maximal respecté', () => {
  const r = P.verifierAjout([{ taille: 25 * MO }], [{ nom: 'c.pdf', taille: 6 * MO }, { nom: 'd.pdf', taille: 4 * MO }]);
  assert.deepEqual(r.acceptes.map(f => f.nom), ['d.pdf']);
  assert.match(r.refuses[0].erreur, /30 Mo/);
});
verifier('Limites configurables (paramètres à confirmer)', () => {
  const p = { ...P.PARAMETRES, maxFichiers: 2 };
  assert.equal(P.verifierAjout([{ taille: 1 }, { taille: 1 }], [{ nom: 'e.jpg', taille: 1 }], p).acceptes.length, 0);
  assert.equal(P.PARAMETRES.aConfirmer, true);
  assert.match(P.texteLimites(), /8 fichiers au maximum, 10 Mo par fichier et 30 Mo au total/);
});
verifier('Nom de stockage généré : jamais le nom du client', () => {
  assert.equal(P.nomStockage('a1b2c3d4-e5f6', 'image/png'), 'a1b2c3d4-e5f6.png');
  assert.throws(() => P.nomStockage('../../etc', 'image/png'));
  assert.throws(() => P.nomStockage('a1b2c3d4e5', 'text/html'));
  assert.equal(P.nomAffichage('C:\\Users\\x\\<script>photo.jpg'), 'scriptphoto.jpg');
});

const donnees = {
  equipes: [{ id: 'B1', membres: ['A', 'B'] }, { id: 'S-C', membres: ['C'] }, { id: 'M-CT1', membres: ['CT1'] }, { id: 'M-CT2', membres: ['CT2'] }],
  interventions: [{ id: 'I1', commandeId: 'EDY-1', equipeId: 'B1', statut: 'planifiee' }, { id: 'I2', commandeId: 'EDY-2', equipeId: 'M-CT2', statut: 'planifiee' }],
  coordinations: [{ commandeId: 'EDY-1', controleuseId: 'CT1' }]
};
verifier('Accès : direction et secrétaire consultent toutes les commandes', () => {
  assert.equal(P.accesPiecesJointes({ role: 'cogerant', personneId: 'COG1' }, 'EDY-1', donnees).autorise, true);
  assert.equal(P.accesPiecesJointes({ role: 'secretaire', personneId: 'SEC' }, 'EDY-2', donnees).autorise, true);
});
verifier('Accès : employé affecté oui, employé non affecté non', () => {
  assert.equal(P.accesPiecesJointes({ role: 'employe', personneId: 'A' }, 'EDY-1', donnees).autorise, true);
  assert.equal(P.accesPiecesJointes({ role: 'employe', personneId: 'C' }, 'EDY-1', donnees).autorise, false);
  assert.equal(P.accesPiecesJointes({ role: 'employe', personneId: 'A' }, 'EDY-2', donnees).autorise, false);
});
verifier('Accès : contrôleuse selon sa prestation ou sa coordination', () => {
  assert.equal(P.accesPiecesJointes({ role: 'controleuse', personneId: 'CT1' }, 'EDY-1', donnees).motif, 'Coordination de ce chantier.');
  assert.equal(P.accesPiecesJointes({ role: 'controleuse', personneId: 'CT2' }, 'EDY-2', donnees).autorise, true);
  assert.equal(P.accesPiecesJointes({ role: 'controleuse', personneId: 'CT2' }, 'EDY-1', donnees).autorise, false);
});
verifier('Accès : public ou rôle inconnu refusé', () => {
  assert.equal(P.accesPiecesJointes(null, 'EDY-1', donnees).autorise, false);
  assert.equal(P.accesPiecesJointes({ role: 'client' }, 'EDY-1', donnees).autorise, false);
});
verifier('Intervention annulée : plus d’accès pour l’équipe', () => {
  const d = { ...donnees, interventions: [{ commandeId: 'EDY-1', equipeId: 'B1', statut: 'annulee' }] };
  assert.equal(P.accesPiecesJointes({ role: 'employe', personneId: 'A' }, 'EDY-1', d).autorise, false);
});

console.log(`${controles} contrôles réussis (pièces jointes, logique locale).`);
