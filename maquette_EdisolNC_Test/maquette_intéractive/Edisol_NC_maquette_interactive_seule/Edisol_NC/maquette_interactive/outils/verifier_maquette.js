/* =========================================================================
   ÉDYSOL NC — Vérification automatique de la maquette dans un navigateur
   Prérequis : Playwright (npm install, puis npx playwright install chromium).
   Lancer : npm run verifier   (ou node outils/verifier_maquette.js [--captures])
   Contrôles : erreurs JavaScript, débordement horizontal (téléphone et
   ordinateur), carrousels, visionneuse (Échap + retour du focus), menu
   mobile, parcours de commande complet, planification avec conflit,
   compte rendu avec relevé kilométrique, stocks, correction de relevé,
   signalement de renfort. Tout se passe en mode démonstration local.
   ========================================================================= */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { demarrer } = require('./serveur.js');

const CAPTURES = process.argv.includes('--captures');
const DOSSIER_CAPTURES = path.resolve(__dirname, '..', 'apercus');
let controles = 0;

/** Exécute un contrôle asynchrone nommé. */
async function verifier(nom, action) { await action(); controles++; console.log('OK · ' + nom); }

(async () => {
  const serveur = await demarrer(0);
  const base = `http://127.0.0.1:${serveur.address().port}/`;
  const navigateur = await chromium.launch();
  const erreurs = [];
  if (CAPTURES) fs.mkdirSync(DOSSIER_CAPTURES, { recursive: true });

  /** Ouvre une page avec un format d'écran et collecte les erreurs JavaScript. */
  async function page(largeur, hauteur, options = {}) {
    const contexte = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, ...options });
    const p = await contexte.newPage();
    p.on('pageerror', e => erreurs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
    return p;
  }
  /** Mesure le débordement horizontal de la page (0 attendu). */
  const debordement = p => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  async function capture(p, nom, complete = true) { if (CAPTURES) await p.screenshot({ path: path.join(DOSSIER_CAPTURES, nom + '.png'), fullPage: complete }); }

  try {
    // ---------- Site public ----------
    for (const [nom, l, h] of [['telephone', 390, 844], ['ordinateur', 1440, 900]]) {
      const p = await page(l, h);
      await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
      await verifier(`Accueil sans débordement (${nom})`, async () => assert.equal(await debordement(p), 0));
      await capture(p, `public-accueil-${nom}`);
      for (const pg of ['commande.html', 'espace.html', 'espace.html#/cogerance/tableau', 'espace.html#/cogerance/commandes', 'espace.html#/cogerance/commande/EDY-2026-045',
        'espace.html#/cogerance/planning', 'espace.html#/cogerance/equipe', 'espace.html#/cogerance/vehicules', 'espace.html#/cogerance/releves/V-DÉMO-01',
        'espace.html#/cogerance/mouvements', 'espace.html#/secretariat/nouvelle', 'espace.html#/employe/interventions', 'espace.html#/employe/compte-rendu/INT-3',
        'espace.html#/controleuse/coordination/EDY-2026-045']) {
        await p.goto(base + pg, { waitUntil: 'networkidle' });
        await verifier(`${pg} sans débordement (${nom})`, async () => assert.equal(await debordement(p), 0));
      }
      await p.context().close();
    }

    const p = await page(1280, 860);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await verifier('Carrousel : bouton suivant', async () => {
      await p.click('#carrousel-entreprise .carrousel__suiv');
      assert.equal(await p.textContent('#carrousel-entreprise .carrousel__compteur b'), '2');
    });
    await verifier('Carrousel : pause puis lecture', async () => {
      const b = p.locator('#carrousel-accueil .carrousel__pause');
      await b.click();
      assert.equal(await b.getAttribute('aria-pressed'), 'true');
      await b.click();
      assert.equal(await b.getAttribute('aria-pressed'), 'false');
    });
    await verifier('Carrousel : flèches du clavier', async () => {
      await p.focus('#carrousel-prestations .carrousel__suiv');
      await p.keyboard.press('ArrowRight');
      assert.equal(await p.textContent('#carrousel-prestations .carrousel__compteur b'), '2');
    });
    await verifier('Galerie : filtre « Vitres »', async () => {
      await p.click('[data-filtre="vitres"]');
      assert.equal(await p.locator('#galerie-grille li').count(), 1);
      await p.click('[data-filtre=""]');
    });
    await verifier('Visionneuse : ouverture, flèche, Échap et retour du focus', async () => {
      const vignette = p.locator('#galerie-grille [data-index="2"]');
      await vignette.click();
      assert.ok(await p.locator('dialog.visionneuse[open]').count());
      await p.keyboard.press('ArrowRight');
      assert.match(await p.textContent('.visionneuse__compteur'), /Visuel 4 sur/);
      await p.keyboard.press('Escape');
      assert.equal(await p.locator('dialog.visionneuse[open]').count(), 0);
      assert.equal(await p.evaluate(() => document.activeElement.dataset.index), '2');
    });
    await verifier('Formulaire de rappel simulé', async () => {
      await p.fill('#rappel-nom', 'Test Rappel');
      await p.fill('#rappel-tel', '00 00 00');
      await p.click('#formulaire-rappel button[type=submit]');
      assert.match(await p.textContent('.formulaire-rappel__retour'), /simulée/);
    });

    // Réduction des animations : aucun défilement automatique.
    const pr = await page(1280, 860, { reducedMotion: 'reduce' });
    await pr.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await verifier('Mouvements réduits : défilement automatique coupé', async () => {
      assert.equal(await pr.getAttribute('#carrousel-accueil .carrousel__pause', 'aria-pressed'), 'true');
    });
    await pr.context().close();

    // Menu mobile.
    const pm = await page(390, 844);
    await pm.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await verifier('Menu mobile : ouverture et fermeture par Échap', async () => {
      await pm.click('.entete__burger');
      assert.equal(await pm.isVisible('#menu-mobile'), true);
      await pm.keyboard.press('Escape');
      assert.equal(await pm.isVisible('#menu-mobile'), false);
      assert.equal(await pm.evaluate(() => document.activeElement.classList.contains('entete__burger')), true);
    });

    // ---------- Parcours de commande (téléphone) ----------
    await pm.goto(base + 'commande.html?prestation=vitres', { waitUntil: 'networkidle' });
    let reference = '';
    await verifier('Commande : étape 2 bloquée sans commune ni adresse', async () => {
      await pm.click('#bouton-suivant');
      await pm.click('#bouton-suivant');
      assert.equal(await pm.isVisible('#cmd-commune-erreur'), true);
    });
    await verifier('Commande : parcours complet jusqu’à la confirmation', async () => {
      await pm.selectOption('select[name=commune]', 'Nouméa');
      await pm.fill('textarea[name=adresse]', '12 rue Fictive, quartier test');
      await pm.click('#bouton-suivant');
      await pm.fill('textarea[name=description]', 'Nettoyage de baies vitrées (test automatique).');
      await pm.click('#bouton-suivant');
      await pm.fill('input[name=nom]', 'Client Test');
      await pm.fill('input[name=telephone]', '00 00 00');
      await pm.click('#bouton-suivant');
      assert.equal(await pm.isVisible('#cmd-consentement-erreur'), true);
      await pm.check('input[name=consentement]');
      await pm.click('#bouton-suivant');
      reference = (await pm.textContent('.confirmation__ref strong')).trim();
      assert.match(reference, /^EDY-2026-\d{3}$/);
    });
    await capture(pm, 'public-commande-confirmation-telephone');
    await verifier('Commande visible côté secrétariat avec notification interne', async () => {
      await pm.goto(base + 'espace.html#/secretariat/commandes', { waitUntil: 'networkidle' });
      assert.ok((await pm.textContent('#liste-commandes')).includes(reference));
      await pm.goto(base + 'espace.html#/secretariat/notifications');
      assert.ok((await pm.textContent('.notifications')).includes(reference));
    });
    await pm.context().close();

    // ---------- Espaces internes (ordinateur) ----------
    const pi = await page(1440, 900);
    await pi.goto(base + 'espace.html', { waitUntil: 'networkidle' });
    await pi.evaluate(() => localStorage.clear());
    await pi.goto(base + 'espace.html#/secretariat/planning/EDY-2026-042', { waitUntil: 'networkidle' });
    await verifier('Planning : binôme fixe affecté en entier', async () => {
      assert.match(await pi.textContent('#aff-membres'), /Agent A \+ Agent B/);
    });
    await verifier('Planning : conflit signalé, rien n’est enregistré', async () => {
      const date = await pi.evaluate(() => Edysol.api.charger().interventions.find(i => i.id === 'INT-3').date);
      await pi.fill('#aff-date', date);
      await pi.fill('#aff-debut', '09:00');
      await pi.fill('#aff-fin', '11:00');
      const avant = await pi.evaluate(() => Edysol.api.charger().interventions.length);
      await pi.click('#form-affectation button[type=submit]');
      assert.match(await pi.textContent('#aff-retour'), /Conflit de créneau/);
      assert.equal(await pi.evaluate(() => Edysol.api.charger().interventions.length), avant);
    });
    await verifier('Planning : affectation sans conflit enregistrée et notifiée', async () => {
      await pi.check('input[name=type][value=solo]');
      await pi.selectOption('#aff-equipe', 'S-J');
      await pi.click('#form-affectation button[type=submit]');
      const etat = await pi.evaluate(() => Edysol.api.charger());
      assert.equal(etat.commandes.find(c => c.id === 'EDY-2026-042').statut, 'planifiee');
      assert.ok(etat.notifications.some(n => n.pour.includes('personne:J')));
    });
    await capture(pi, 'interne-planning-ordinateur', false);

    await verifier('Comptabilité : écriture refusée sans permission', async () => {
      await pi.goto(base + 'espace.html#/cogerance/mouvements');
      await pi.fill('#mvt-qte', '2');
      await pi.fill('#mvt-motif', 'Test');
      await pi.click('#form-mouvement button[type=submit]');
      assert.match(await pi.textContent('#mvt-retour'), /non attribuée/);
    });
    await verifier('Comptabilité : mouvement accepté avec permission simulée', async () => {
      await pi.check('[data-permission="stocks:ecrire"]');
      await pi.fill('#mvt-qte', '2,5');
      await pi.fill('#mvt-motif', 'Livraison test');
      await pi.click('#form-mouvement button[type=submit]');
      assert.match(await pi.textContent('#mvt-retour'), /Stock : 27 L/);
    });
    await verifier('Inventaire : écart calculé sans modifier le stock', async () => {
      await pi.goto(base + 'espace.html#/cogerance/inventaire');
      const avant = await pi.evaluate(() => Edysol.api.charger().mouvements.length);
      await pi.fill('#cpt-A2', '78');
      assert.match(await pi.textContent('#ecart-A2'), /-2/);
      assert.equal(await pi.evaluate(() => Edysol.api.charger().mouvements.length), avant);
    });

    // ---------- Terrain : compte rendu et relevé kilométrique ----------
    const pt = await page(390, 844);
    await pt.goto(base + 'espace.html#e-compterendu', { waitUntil: 'networkidle' });
    await pt.waitForSelector('#form-cr');
    await verifier('Compte rendu : champs compteur désactivés sans véhicule', async () => {
      assert.equal(await pt.isDisabled('#cr-compteur'), true);
    });
    await verifier('Compte rendu : relevé repris dans le suivi du véhicule', async () => {
      await pt.selectOption('#cr-vehicule', 'V-DÉMO-01');
      await pt.fill('#cr-compteur', '123600');
      await pt.click('#form-cr button[type=submit]');
      assert.match(await pt.textContent('#vue'), /repris automatiquement/);
      const suivi = await pt.evaluate(() => EdysolMetier.suiviVehicule(Edysol.api.charger().releves, 'V-DÉMO-01'));
      assert.equal(suivi.dernier.compteur, 123600); // compteur total, jamais additionné
    });
    await capture(pt, 'terrain-compte-rendu-telephone', false);
    await verifier('Contrôleuse : besoin de renfort signalé sans affectation', async () => {
      await pt.goto(base + 'espace.html#su-chantier');
      await pt.waitForSelector('#form-renfort');
      const avant = await pt.evaluate(() => Edysol.api.charger().interventions.length);
      await pt.fill('#renfort-texte', 'Surface plus grande que prévu (test).');
      await pt.click('#form-renfort button[type=submit]');
      assert.equal(await pt.evaluate(() => Edysol.api.charger().interventions.length), avant);
      assert.equal(await pt.evaluate(() => Edysol.api.charger().renforts.length), 1);
    });

    await verifier('Relevés : correction refusée sans permission puis conservée en révision', async () => {
      await pi.goto(base + 'espace.html#/cogerance/releves/V-DÉMO-01');
      await pi.fill('#cor-compteur', '123610');
      await pi.fill('#cor-motif', 'Erreur de lecture (test)');
      await pi.click('#form-correction button[type=submit]');
      assert.match(await pi.textContent('#cor-retour'), /non attribuée/);
      await pi.check('[data-permission="releves:corriger"]');
      await pi.fill('#cor-compteur', '123610');
      await pi.fill('#cor-motif', 'Erreur de lecture (test)');
      await pi.click('#form-correction button[type=submit]');
      // La révision 2 porte la correction ; la révision 1 (valeur d'origine) reste dans l'historique.
      const versions = await pi.evaluate(() => {
        const releves = Edysol.api.charger().releves;
        const corrige = releves.find(r => r.revision === 2 && r.compteur === 123610);
        return releves.filter(r => r.releveId === corrige.releveId).map(r => [r.revision, r.compteur]);
      });
      assert.equal(versions.length, 2);
      assert.notEqual(versions.find(v => v[0] === 1)[1], 123610);
    });
    await verifier('Anciennes adresses V1 redirigées', async () => {
      await pi.goto(base + 'espace.html#g-vehicules');
      await pi.waitForTimeout(200);
      assert.equal(await pi.evaluate(() => location.hash), '#/cogerance/vehicules');
    });

    await verifier('Aucune erreur JavaScript pendant les parcours', async () => assert.deepEqual(erreurs, []));
    console.log(`\n${controles} contrôles réussis dans le navigateur (mode démonstration).`);
  } catch (e) {
    console.error('\nÉCHEC :', e.message);
    if (erreurs.length) console.error('Erreurs JavaScript :', erreurs);
    process.exitCode = 1;
  } finally {
    await navigateur.close();
    serveur.close();
  }
})();
