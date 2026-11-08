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
  let tuilesIndisponibles = 0;
  if (CAPTURES) fs.mkdirSync(DOSSIER_CAPTURES, { recursive: true });

  /** Ouvre une page avec un format d'écran et collecte les erreurs JavaScript. */
  async function page(largeur, hauteur, options = {}) {
    const contexte = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, ...options });
    const p = await contexte.newPage();
    p.on('pageerror', e => erreurs.push(e.message));
    p.on('console', m => {
      if (m.type() !== 'error') return;
      // Hors connexion, les tuiles OpenStreetMap échouent : c'est prévu (fond schématique de repli).
      if (m.text().startsWith('Failed to load resource') && (m.location().url || '').includes('tile.openstreetmap.org')) { tuilesIndisponibles++; return; }
      erreurs.push(m.text());
    });
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
        'espace.html#/controleuse/coordination/EDY-2026-045', 'espace.html#/cogerance/notifications', 'espace.html#/secretariat/notification/N-7', 'espace.html#/cogerance/carte', 'espace.html#/secretariat/planning', 'espace.html#/cogerance/planning', 'espace.html#/secretariat/carte']) {
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
    // ---------- Boîte de réception (scénarios 1 à 9 de la demande) ----------
    const pn = await page(1280, 720);
    await pn.goto(base + 'espace.html', { waitUntil: 'networkidle' });
    await pn.evaluate(() => { localStorage.clear(); localStorage.setItem('edysol-personne-cogerance', JSON.stringify('COG1')); });
    await pn.goto(base + 'espace.html#/cogerance/notifications', { waitUntil: 'networkidle' });
    const idsListe = sel => pn.$$eval(sel + ' > li', lis => lis.map(li => li.dataset.id));
    const lectures = () => pn.evaluate(() => JSON.stringify(Edysol.api.charger().notifications.map(n => [n.id, n.lectures])));
    const metier = () => pn.evaluate(() => { const s = Edysol.api.charger(); return JSON.stringify([s.commandes, s.interventions, s.coordinations, s.renforts]); });

    await verifier('Boîte 1. A (N-1, ancienne) puis B (N-6, récente) avant C (N-2, lue)', async () => {
      assert.deepEqual(await idsListe('#liste-non-lues'), ['N-1', 'N-6']);
      assert.deepEqual((await idsListe('#liste-lues')).slice(0, 1), ['N-2']);
    });
    await verifier('Boîte : plus aucune commande « Marquer comme lue »', async () => {
      assert.equal(/marquer comme lu/i.test(await pn.textContent('#vue')), false);
    });
    await verifier('Boîte 3. Afficher et faire défiler la liste ne change aucun statut', async () => {
      const avant = await lectures();
      await pn.mouse.wheel(0, 2000); await pn.waitForTimeout(150);
      await pn.goto(base + 'espace.html#/cogerance/tableau'); await pn.goto(base + 'espace.html#/cogerance/notifications');
      assert.equal(await lectures(), avant);
    });
    await verifier('Boîte 2. Nouvelle D placée après A et B, avant les lues, sans saut de défilement', async () => {
      // Écran bas : l'historique peut être amené en haut de l'écran (situation de lecture réelle).
      await pn.setViewportSize({ width: 1280, height: 420 });
      await pn.evaluate(() => document.querySelector('#titre-lues').scrollIntoView());
      const repere = () => pn.evaluate(() => document.querySelector('#liste-lues > li').getBoundingClientRect().top);
      const avant = await repere();
      assert.ok(await pn.evaluate(() => document.querySelector('#liste-non-lues').getBoundingClientRect().bottom < 0), 'les non lues doivent être hors écran');
      const idD = await pn.evaluate(() => Edysol.api.recevoirNotificationDemo('personne:COG1').id);
      await pn.waitForTimeout(150);
      assert.deepEqual(await idsListe('#liste-non-lues'), ['N-1', 'N-6', idD]);
      assert.ok(Math.abs((await repere()) - avant) <= 1, 'le contenu regardé ne doit pas bouger');
      assert.match(await pn.textContent('#annonce-boite'), /Nouvelle notification reçue/);
      await pn.setViewportSize({ width: 1280, height: 720 });
    });
    await verifier('Boîte 8. Compteurs = non lues de la personne courante', async () => {
      const n = await pn.evaluate(() => Edysol.api.nonLues('personne:COG1'));
      assert.equal(n, 3);
      assert.match(await pn.textContent('#cloche'), /3 non lues/);
      assert.equal((await idsListe('#liste-non-lues')).length, n);
    });
    await verifier('Lecture refusée : détail introuvable, détail différent, message d’autrui', async () => {
      const avant = await lectures();
      await pn.goto(base + 'espace.html#/cogerance/commande/EDY-2026-999?lecture=N-1'); await pn.waitForTimeout(150);
      await pn.goto(base + 'espace.html#/cogerance/commande/EDY-2026-041?lecture=N-1'); await pn.waitForTimeout(150);
      await pn.goto(base + 'espace.html#/cogerance/notification/N-5'); await pn.waitForTimeout(150);
      assert.match(await pn.textContent('#vue'), /Message indisponible/);
      assert.equal(await lectures(), avant);
    });
    let metierAvant;
    await verifier('Boîte 4 et 9. Ouvrir B au clavier marque seulement B, qui reste dans l’historique', async () => {
      await pn.goto(base + 'espace.html#/cogerance/notifications');
      metierAvant = await metier();
      await pn.focus('#liste-non-lues li[data-id="N-6"] a');
      await pn.keyboard.press('Enter');
      await pn.waitForSelector('h1.page-entete__titre:text-is("Commande EDY-2026-043")'); // titre du détail, pas la liste
      const etat = await pn.evaluate(() => Object.fromEntries(Edysol.api.charger().notifications.map(n => [n.id, n.lectures])));
      assert.ok(etat['N-6']['personne:COG1']);
      assert.equal(etat['N-1']['personne:COG1'], undefined);
      assert.equal(await pn.evaluate(() => location.hash), '#/cogerance/commande/EDY-2026-043'); // « ?lecture » retiré
      await pn.goto(base + 'espace.html#/cogerance/notifications');
      assert.ok((await idsListe('#liste-lues')).includes('N-6'));
      assert.equal(await pn.textContent('#liste-lues li[data-id="N-6"] .etiquette-lecture').then(t => /Lue le/.test(t)), true);
      assert.equal(await pn.textContent('#liste-non-lues li[data-id="N-1"] .etiquette-lecture').then(t => t.trim()), 'Non lue');
    });
    await verifier('Boîte 6. Lire ne modifie ni commande, ni affectation, ni coordination', async () => {
      assert.equal(await metier(), metierAvant);
    });
    await verifier('Boîte 5. Toujours non lue pour le cogérant 2 et la secrétaire', async () => {
      await pn.selectOption('.laterale [data-action="changer-personne"]', 'COG2');
      await pn.waitForTimeout(200);
      assert.match(await pn.textContent('.page-entete__sous-titre'), /Cogérant 2/);
      assert.ok((await idsListe('#liste-non-lues')).includes('N-6'));
      assert.equal(await pn.evaluate(() => Edysol.api.nonLues('personne:SEC') > 0 && !Edysol.api.charger().notifications.find(n => n.id === 'N-6').lectures['personne:SEC']), true);
    });
    await verifier('Boîte 7. Après rechargement, les lectures sont conservées (stockage de ce navigateur)', async () => {
      const avant = await lectures();
      await pn.reload({ waitUntil: 'networkidle' });
      assert.equal(await lectures(), avant);
    });
    await verifier('Message sans détail : lu seulement après affichage dans la vue « message »', async () => {
      await pn.goto(base + 'espace.html#/secretariat/notifications');
      assert.equal(await pn.evaluate(() => !Edysol.api.charger().notifications.find(n => n.id === 'N-7').lectures['personne:SEC']), true);
      await pn.click('#liste-non-lues li[data-id="N-7"] a');
      await pn.waitForSelector('#titre-message');
      assert.match(await pn.textContent('#statut-lecture'), /Lue le/);
    });
    await verifier('Une nouvelle commande informe la secrétaire et chacun des deux cogérants', async () => {
      const pour = await pn.evaluate(() => Edysol.api.notifier(['secretariat', 'cogerance'], 'Test', 'Test', '').pour);
      assert.deepEqual(pour, ['personne:SEC', 'personne:COG1', 'personne:COG2']);
    });
    await pn.context().close();
    const pmn = await page(390, 844);
    await pmn.goto(base + 'espace.html#/cogerance/notifications', { waitUntil: 'networkidle' });
    await verifier('Boîte 9. Utilisable sur téléphone (pas de débordement, états écrits)', async () => {
      assert.equal(await debordement(pmn), 0);
      assert.ok((await pmn.textContent('#vue')).includes('Non lue'));
    });
    await capture(pmn, 'interne-notifications-telephone');
    await pmn.context().close();

    // ---------- Planning dynamique (glisser-déposer) ----------
    const pp = await page(1440, 1000);
    await pp.goto(base + 'espace.html', { waitUntil: 'networkidle' });
    await pp.evaluate(() => localStorage.clear());
    // Glisser-déposer testé côté direction (cogérants), qui garde le pouvoir de déplacer.
    await pp.goto(base + 'espace.html#/cogerance/planning', { waitUntil: 'networkidle' });
    // Données de test : INT-9 (binôme 2, 10:00 à 12:00) placée le mardi de la semaine prochaine.
    const mardi = await pp.evaluate(() => {
      const d = Edysol.ajouterJours(Edysol.lundiDe(Edysol.aujourdhui()), 8);
      const i = Edysol.api.charger().interventions.find(x => x.id === 'INT-9');
      Object.assign(i, { date: d, debut: '10:00', fin: '12:00', equipeId: 'B2', creneauClient: 'non-confirme' });
      Edysol.api.sauver();
      return d;
    });
    const inter = id => pp.evaluate(x => { const i = Edysol.api.charger().interventions.find(y => y.id === x); return { date: i.date, debut: i.debut, fin: i.fin, equipeId: i.equipeId }; }, id);
    const metierPlanning = () => pp.evaluate(() => JSON.stringify(Edysol.api.charger().interventions.map(i => [i.id, i.date, i.debut, i.fin, i.equipeId])));
    await pp.click('[data-semaine="1"]');
    await pp.click(`[data-jour="${mardi}"]`);
    /** Glisse un bloc à la souris : décalage horizontal en minutes et piste d'arrivée. */
    async function glisser(id, minutes, equipeCible) {
      const bloc = await pp.$(`.bloc-inter[data-intervention="${id}"]`);
      await bloc.scrollIntoViewIfNeeded();
      const b = await bloc.boundingBox();
      const piste = await (await pp.$(`.chrono__piste[data-equipe="${equipeCible}"]`)).boundingBox();
      const dx = minutes / 720 * piste.width;
      await pp.mouse.move(b.x + 12, b.y + 10);
      await pp.mouse.down();
      await pp.mouse.move(b.x + 20, b.y + 12, { steps: 2 });
      await pp.mouse.move(b.x + 12 + dx, piste.y + piste.height / 2, { steps: 10 });
      await pp.waitForTimeout(120);
      const apercu = await pp.$eval('.apercu-creneau', el => el.textContent).catch(() => '');
      await pp.mouse.up();
      await pp.waitForTimeout(250);
      return apercu;
    }
    await verifier('Planning 3. Avancer d’une heure (10:00 à 09:00), aperçu affiché, durée conservée', async () => {
      const apercu = await glisser('INT-9', -60, 'B2');
      assert.match(apercu, /09:00 à 11:00/);
      assert.deepEqual(await inter('INT-9'), { date: mardi, debut: '09:00', fin: '11:00', equipeId: 'B2' });
      assert.match(await pp.textContent('#planning-message'), /Intervention déplacée/);
    });
    await verifier('Planning 3. Retarder de deux heures (09:00 à 11:00), durée conservée', async () => {
      await glisser('INT-9', 120, 'B2');
      assert.deepEqual(await inter('INT-9'), { date: mardi, debut: '11:00', fin: '13:00', equipeId: 'B2' });
    });
    await verifier('Planning 4. Vers un autre binôme fixe complet (vue par ressource)', async () => {
      await glisser('INT-9', 0, 'B3');
      assert.equal((await inter('INT-9')).equipeId, 'B3');
    });
    await verifier('Planning 6. Annuler le déplacement : retour au binôme 2', async () => {
      await pp.click('[data-annuler]');
      await pp.waitForTimeout(200);
      assert.deepEqual(await inter('INT-9'), { date: mardi, debut: '11:00', fin: '13:00', equipeId: 'B2' });
      assert.match(await pp.textContent('#planning-message'), /Déplacement annulé/);
    });
    await verifier('Planning 5. Binôme vers employé seul : refusé, affectation précédente conservée', async () => {
      const avant = await metierPlanning();
      await glisser('INT-9', 0, 'S-C');
      assert.match(await pp.textContent('#planning-message'), /Déplacement refusé[\s\S]*passage en solo/);
      assert.equal(await metierPlanning(), avant);
    });
    await verifier('Planning 5. Chevauchement : refusé, aucune possibilité de forcer', async () => {
      // Une intervention du binôme 3 occupe 10:30 à 12:30 le même jour.
      await pp.evaluate(d => {
        const s = Edysol.api.charger();
        s.interventions.push({ id: 'INT-TEST', commandeId: 'EDY-2026-045', date: d, debut: '10:30', fin: '12:30', equipeId: 'B3', statut: 'planifiee', creneauClient: 'non-confirme' });
        Edysol.api.sauver();
      }, mardi);
      await pp.goto(base + 'espace.html#/cogerance/tableau'); await pp.goto(base + 'espace.html#/cogerance/planning');
      const avant = await metierPlanning();
      const apercu = await glisser('INT-9', 0, 'B3');
      assert.match(apercu, /Impossible/);
      assert.match(await pp.textContent('#planning-message'), /Chevauchement avec EDY-2026-045/);
      assert.equal(await metierPlanning(), avant);
      assert.equal(/forcer|malgré/i.test(await pp.textContent('#planning-message')), false);
    });
    await verifier('Planning : échec d’enregistrement simulé, retour à la position précédente', async () => {
      await pp.check('#simuler-echec');
      const avant = await metierPlanning();
      await glisser('INT-9', -60, 'B2');
      assert.match(await pp.textContent('#planning-message'), /enregistrement a échoué/);
      assert.equal(await metierPlanning(), avant);
      await pp.reload({ waitUntil: 'networkidle' });
      assert.equal(await metierPlanning(), avant);
    });
    await verifier('Planning 4. Vue semaine : vers un autre jour, heure conservée', async () => {
      await pp.click('[data-semaine="1"]'); // la page a été rechargée : retour à la semaine de l'intervention
      await pp.click('[data-mode="semaine"]');
      const bloc = await (await pp.$('.planning-grille .bloc-inter[data-intervention="INT-9"]')).boundingBox();
      const mercredi = await pp.evaluate(d => Edysol.ajouterJours(d, 1), mardi);
      const cellule = await (await pp.$(`.planning-grille__cellule[data-date="${mercredi}"][data-equipe="B2"]`)).boundingBox();
      await pp.mouse.move(bloc.x + 10, bloc.y + 8); await pp.mouse.down();
      await pp.mouse.move(bloc.x + 20, bloc.y + 10, { steps: 2 });
      await pp.mouse.move(cellule.x + cellule.width / 2, cellule.y + cellule.height / 2, { steps: 10 });
      await pp.mouse.up(); await pp.waitForTimeout(250);
      assert.deepEqual(await inter('INT-9'), { date: mercredi, debut: '11:00', fin: '13:00', equipeId: 'B2' });
    });
    await capture(pp, 'interne-planning-ordinateur', false);
    await verifier('Planning 7. Alternative clavier : Entrée ouvre la fenêtre, déplacement sans glisser', async () => {
      await pp.focus('.planning-grille .bloc-inter[data-intervention="INT-9"]');
      await pp.keyboard.press('Enter');
      await pp.waitForSelector('#dialogue-intervention[open]');
      await pp.fill('#dlg-debut', '08:00');
      assert.equal(await pp.textContent('#dlg-fin'), '10:00');
      await pp.keyboard.press('Tab');
      await pp.click('#dialogue-intervention button[type=submit]');
      await pp.waitForTimeout(250);
      assert.equal((await inter('INT-9')).debut, '08:00');
      assert.equal((await inter('INT-9')).fin, '10:00');
    });
    await verifier('Planning 7. Fenêtre : refus expliqué et fenêtre laissée ouverte', async () => {
      await pp.focus('.planning-grille .bloc-inter[data-intervention="INT-9"]');
      await pp.keyboard.press('Enter');
      await pp.waitForSelector('#dialogue-intervention[open]');
      await pp.fill('#dlg-debut', '18:00');
      await pp.click('#dialogue-intervention button[type=submit]');
      assert.match(await pp.textContent('#dlg-retour'), /Hors de la plage/);
      assert.ok(await pp.$('#dialogue-intervention[open]'));
      assert.deepEqual((await pp.$$eval('#dlg-equipe option', o => o.map(x => x.value))).every(v => v.startsWith('B')), true); // même type seulement
      await pp.keyboard.press('Escape');
    });
    await pp.context().close();

    // Téléphone : appui long puis glisser ; un geste rapide reste un défilement.
    const pt2 = await page(390, 844, { hasTouch: true, isMobile: true });
    await pt2.goto(base + 'espace.html', { waitUntil: 'networkidle' });
    await pt2.evaluate(() => localStorage.clear());
    await pt2.goto(base + 'espace.html#/cogerance/planning', { waitUntil: 'networkidle' });
    const mardiT = await pt2.evaluate(() => {
      const d = Edysol.ajouterJours(Edysol.lundiDe(Edysol.aujourdhui()), 8);
      Object.assign(Edysol.api.charger().interventions.find(x => x.id === 'INT-9'), { date: d, debut: '10:00', fin: '12:00', equipeId: 'B2' });
      Edysol.api.sauver(); return d;
    });
    await pt2.click('[data-semaine="1"]'); await pt2.click(`[data-jour="${mardiT}"]`);
    const cdp = await pt2.context().newCDPSession(pt2);
    const toucher = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await pt2.$eval('.bloc-inter[data-intervention="INT-9"]', el => el.scrollIntoView({ block: 'center', inline: 'center' }));
    const posT = async () => pt2.evaluate(() => { const i = Edysol.api.charger().interventions.find(x => x.id === 'INT-9'); return i.debut + '-' + i.fin; });
    await verifier('Planning 7. Téléphone : geste rapide = défilement, aucun déplacement', async () => {
      const b = await (await pt2.$('.bloc-inter[data-intervention="INT-9"]')).boundingBox();
      await toucher('touchStart', b.x + 10, b.y + 10);
      for (let k = 1; k <= 6; k++) await toucher('touchMove', b.x + 10 + k * 12, b.y + 10);
      await toucher('touchEnd');
      await pt2.waitForTimeout(200);
      assert.equal(await posT(), '10:00-12:00');
    });
    await verifier('Planning 7. Téléphone : appui long puis glisser d’une heure plus tôt', async () => {
      const b = await (await pt2.$('.bloc-inter[data-intervention="INT-9"]')).boundingBox();
      const piste = await (await pt2.$('.chrono__piste[data-equipe="B2"]')).boundingBox();
      const dx = -60 / 720 * piste.width;
      await toucher('touchStart', b.x + 10, b.y + 10);
      await pt2.waitForTimeout(500);
      for (let k = 1; k <= 8; k++) await toucher('touchMove', b.x + 10 + dx * k / 8, b.y + 10);
      await toucher('touchEnd');
      await pt2.waitForTimeout(300);
      assert.equal(await posT(), '09:00-11:00');
      assert.equal(await debordement(pt2), 0);
    });
    await capture(pt2, 'interne-planning-telephone', false);
    await pt2.context().close();

    // ---------- Accès depuis les deux espaces et données partagées (précision du 05/11/2026) ----------
    const pa = await page(1440, 1000);
    await pa.goto(base + 'espace.html', { waitUntil: 'networkidle' });
    await pa.evaluate(() => localStorage.clear());
    for (const espace of ['cogerance', 'secretariat']) {
      await pa.goto(base + `espace.html#/${espace}/tableau`, { waitUntil: 'networkidle' });
      await verifier(`Accès ${espace} : menu et raccourcis « Planning et affectations » et « Suivi des véhicules »`, async () => {
        const menu = await pa.textContent('.laterale .menu');
        assert.ok(menu.includes('Planning et affectations') && menu.includes('Suivi des véhicules'));
        assert.equal(await pa.locator('.raccourcis a').count(), 2);
        await pa.click('.raccourci:has-text("Suivi des véhicules")');
        await pa.waitForSelector('.marqueur');
        assert.match(await pa.textContent('#vue'), /Accès confirmé/);
        assert.equal(await pa.getAttribute('.laterale .menu a[href$="/carte"]', 'aria-current'), 'page');
        await pa.click('.laterale .menu a[href$="/planning"]');
        await pa.waitForSelector('.chrono');
        assert.match(await pa.textContent('.page-entete__titre'), /Planning et affectations/);
      });
    }
    await verifier('Accès : aucune entrée planning ni suivi des véhicules pour employés et contrôleuses', async () => {
      for (const espace of ['employe', 'controleuse']) {
        await pa.goto(base + `espace.html#/${espace}`); await pa.waitForTimeout(150);
        const menu = await pa.textContent('.menu--onglets');
        assert.equal(/Planning et affectations|Suivi des véhicules/.test(menu), false);
      }
    });
    // Intervention de test : la semaine prochaine, binôme fixe 2, 10:00 à 12:00.
    const mardiA = await pa.evaluate(() => {
      const d = Edysol.ajouterJours(Edysol.lundiDe(Edysol.aujourdhui()), 8);
      Object.assign(Edysol.api.charger().interventions.find(x => x.id === 'INT-9'), { date: d, debut: '10:00', fin: '12:00', equipeId: 'B2', creneauClient: 'non-confirme' });
      Edysol.api.sauver(); return d;
    });
    const posA = () => pa.evaluate(() => { const i = Edysol.api.charger().interventions.find(x => x.id === 'INT-9'); return `${i.date} ${i.debut}-${i.fin} ${i.equipeId}`; });
    // La semaine affichée est gardée tant que la page n'est pas rechargée : n'avancer que si nécessaire.
    const blocVisible = async () => {
      if (!(await pa.$(`[data-jour="${mardiA}"]`))) await pa.click('[data-semaine="1"]');
      await pa.click(`[data-jour="${mardiA}"]`);
    };
    /** Glisse INT-9 dans la vue jour de la page pa. */
    async function glisserA(minutes, equipe) {
      const bloc = await pa.$('.bloc-inter[data-intervention="INT-9"]');
      await bloc.scrollIntoViewIfNeeded();
      const b = await bloc.boundingBox();
      const piste = await (await pa.$(`.chrono__piste[data-equipe="${equipe}"]`)).boundingBox();
      await pa.mouse.move(b.x + 12, b.y + 10); await pa.mouse.down();
      await pa.mouse.move(b.x + 20, b.y + 12, { steps: 2 });
      await pa.mouse.move(b.x + 12 + minutes / 720 * piste.width, piste.y + piste.height / 2, { steps: 10 });
      await pa.mouse.up(); await pa.waitForTimeout(250);
    }
    await verifier('Secrétaire : planning consultable, déplacement fermé par défaut (droits non définis, signalé)', async () => {
      await pa.goto(base + 'espace.html#/secretariat/planning', { waitUntil: 'networkidle' });
      await blocVisible();
      assert.match(await pa.textContent('#vue'), /droits de déplacement et de réaffectation ne sont pas encore définis/);
      assert.equal(await pa.getAttribute('.bloc-inter[data-intervention="INT-9"]', 'data-deplacable'), 'false');
      const avant = await posA();
      await glisserA(-60, 'B2');
      assert.equal(await posA(), avant);
      await pa.click('.bloc-inter[data-intervention="INT-9"]');
      await pa.waitForSelector('#dialogue-intervention[open]');
      assert.match(await pa.textContent('#dialogue-intervention'), /Consultation seulement/);
      assert.equal(await pa.locator('#dialogue-intervention button[type=submit]').count(), 0);
      await pa.keyboard.press('Escape');
    });
    await verifier('Direction (cogérant) : déplacement visible ensuite côté secrétariat (mêmes données)', async () => {
      await pa.goto(base + 'espace.html#/cogerance/planning', { waitUntil: 'networkidle' });
      await blocVisible();
      await glisserA(-60, 'B2');
      assert.equal(await posA(), `${mardiA} 09:00-11:00 B2`);
      await pa.goto(base + 'espace.html#/secretariat/planning', { waitUntil: 'networkidle' });
      await blocVisible();
      assert.match(await pa.getAttribute('.bloc-inter[data-intervention="INT-9"]', 'aria-label'), /de 09:00 à 11:00/);
      assert.equal(await pa.evaluate(() => Edysol.api.charger().interventions.filter(i => i.id === 'INT-9').length), 1); // pas de copie
    });
    await verifier('Secrétaire : permission de déplacer simulée, mais pas de réaffectation automatique', async () => {
      await pa.check('[data-permission-planning="planning:deplacer"]');
      await blocVisible();
      await glisserA(60, 'B2');
      assert.equal(await posA(), `${mardiA} 10:00-12:00 B2`);
      await glisserA(0, 'B3');
      assert.match(await pa.textContent('#planning-message'), /réaffectation/);
      assert.equal(await posA(), `${mardiA} 10:00-12:00 B2`);
    });
    await verifier('Déplacement fait par la secrétaire visible côté direction, avec son auteur', async () => {
      await pa.goto(base + 'espace.html#/cogerance/commande/EDY-2026-044', { waitUntil: 'networkidle' });
      assert.match(await pa.textContent('.historique'), /déplacée par Secrétaire/);
      await pa.goto(base + 'espace.html#/cogerance/planning', { waitUntil: 'networkidle' });
      await blocVisible();
      assert.match(await pa.getAttribute('.bloc-inter[data-intervention="INT-9"]', 'aria-label'), /de 10:00 à 12:00/);
    });
    await pa.evaluate(() => { Edysol.api.basculerPermission('planning:deplacer', false); });
    await pa.context().close();

    // ---------- Carte des véhicules ----------
    const pc = await page(1440, 1000);
    await pc.goto(base + 'espace.html', { waitUntil: 'networkidle' });
    await pc.evaluate(() => localStorage.clear());
    await pc.goto(base + 'espace.html#/cogerance/carte');
    await pc.waitForSelector('.marqueur');
    await verifier('Carte 1. Plusieurs véhicules visibles, avec bandeau de simulation', async () => {
      assert.equal(await pc.locator('.marqueur').count(), 4);
      assert.match(await pc.textContent('.bandeau-simulation'), /Démonstration — positions simulées/);
    });
    await verifier('Carte 1. Sélection d’un véhicule par son marqueur : fiche complète', async () => {
      // Clic direct sur l'élément du marqueur : des marqueurs proches peuvent se recouvrir à ce niveau de zoom.
      await pc.locator('.leaflet-marker-icon', { hasText: 'V2' }).evaluate(el => el.click());
      const fiche = await pc.textContent('#fiche-vehicule');
      for (const t of ['V-DÉMO-02', 'Identification', 'Statut', 'Dernière position', 'Mesure GPS', 'Réception']) assert.ok(fiche.includes(t), t);
    });
    await verifier('Carte 2. Communication perdue : jamais présentée comme actuelle', async () => {
      await pc.click('[data-vehicule="V-DÉMO-03"]');
      assert.match(await pc.textContent('#fiche-vehicule'), /Communication perdue[\s\S]*Ce n’est pas la position actuelle/);
      assert.match(await pc.textContent('#fiche-vehicule'), /Non pertinente/);
    });
    await verifier('Carte 2. Déplacement simulé du véhicule suivi et trajet affiché', async () => {
      await pc.click('[data-vehicule="V-DÉMO-01"]');
      const avant = await pc.evaluate(() => Edysol.positions.derniere('V-DÉMO-01').mesureLe);
      await pc.waitForTimeout(11000);
      const apres = await pc.evaluate(() => Edysol.positions.derniere('V-DÉMO-01').mesureLe);
      assert.notEqual(apres, avant);
      assert.ok(await pc.locator('.leaflet-overlay-pane path').count() >= 1);
      assert.ok(await pc.locator('.trajet-fleche').count() >= 1);
      assert.ok(await pc.locator('#trajet-horaires tbody tr').count() >= 5);
      assert.match(await pc.textContent('#trajet-vehicule'), /Début|mesure/);
    });
    await verifier('Carte 2. Heures de mesure GPS et de réception distinctes (rafales de V-DÉMO-04)', async () => {
      const ecarts = await pc.evaluate(() => Edysol.positions.mesures('V-DÉMO-04').filter(m => Date.parse(m.recuLe) - Date.parse(m.mesureLe) > 60000).length);
      assert.ok(ecarts > 0);
    });
    await verifier('Carte 2. Communication coupée : aucune position inventée', async () => {
      await pc.click('[data-vehicule="V-DÉMO-01"]');
      await pc.click('[data-coupure]');
      const coupure = await pc.evaluate(() => Date.now());
      await pc.waitForTimeout(11000);
      // Une mesure prise AVANT la coupure peut encore arriver (réception 1 à 3 s plus tard) :
      // on vérifie qu'aucune mesure n'est datée d'après la coupure.
      const apres = await pc.evaluate(t => Edysol.positions.mesures('V-DÉMO-01').filter(m => Date.parse(m.mesureLe) > t).length, coupure);
      assert.equal(apres, 0);
      assert.match(await pc.textContent('#fiche-vehicule'), /Rétablir la communication/);
      await pc.click('[data-coupure]');
    });
    await verifier('Carte : suivi mis en pause quand on explore la carte, puis repris', async () => {
      const c = await pc.$('#carte'); const b = await c.boundingBox();
      // Geste dans un coin vide de la carte (pas sur un marqueur ni une étiquette de trajet).
      await pc.mouse.move(b.x + 40, b.y + b.height - 70); await pc.mouse.down();
      await pc.mouse.move(b.x + 160, b.y + b.height - 120, { steps: 8 }); await pc.mouse.up();
      await pc.waitForTimeout(100);
      assert.equal(await pc.isVisible('#carte-reprendre'), true);
      await pc.click('#carte-reprendre');
      assert.equal(await pc.isVisible('#carte-reprendre'), false);
    });
    await verifier('Carte : filtres par état et recherche', async () => {
      await pc.click('[data-filtre="perdue"]');
      assert.equal(await pc.locator('.marqueur').count(), 1);
      await pc.click('[data-filtre=""]');
      await pc.fill('#carte-recherche', 'V-DÉMO-04');
      assert.equal(await pc.locator('.marqueur').count(), 1);
      await pc.fill('#carte-recherche', '');
    });
    await verifier('Carte : clavier, la liste des véhicules est utilisable sans souris', async () => {
      await pc.focus('[data-vehicule="V-DÉMO-02"]');
      await pc.keyboard.press('Enter');
      assert.match(await pc.textContent('#fiche-vehicule h2'), /V-DÉMO-02/);
    });
    await capture(pc, 'interne-carte-ordinateur', false);
    await verifier('Carte : refusée aux employés et aux contrôleuses', async () => {
      await pc.goto(base + 'espace.html#/employe/carte'); await pc.waitForTimeout(150);
      assert.match(await pc.textContent('#vue'), /Accès réservé/);
      await pc.goto(base + 'espace.html#/controleuse/carte'); await pc.waitForTimeout(150);
      assert.match(await pc.textContent('#vue'), /Accès réservé/);
      assert.equal(await pc.locator('.leaflet-container').count(), 0);
    });
    await pc.context().close();
    const pcm = await page(390, 844, { hasTouch: true, isMobile: true });
    await pcm.goto(base + 'espace.html#/cogerance/carte');
    await pcm.waitForSelector('.marqueur');
    await verifier('Carte 7. Téléphone : sans débordement, véhicule sélectionnable', async () => {
      assert.equal(await debordement(pcm), 0);
      await pcm.tap('[data-vehicule="V-DÉMO-01"]');
      assert.match(await pcm.textContent('#fiche-vehicule h2'), /V-DÉMO-01/);
    });
    await capture(pcm, 'interne-carte-telephone', false);
    await pcm.context().close();

    await verifier('Anciennes adresses V1 redirigées', async () => {
      await pi.goto(base + 'espace.html#g-vehicules');
      await pi.waitForTimeout(200);
      assert.equal(await pi.evaluate(() => location.hash), '#/cogerance/vehicules');
    });

    await verifier('Aucune erreur JavaScript pendant les parcours', async () => assert.deepEqual(erreurs, []));
    console.log(`\n${controles} contrôles réussis dans le navigateur (mode démonstration).`);
    if (tuilesIndisponibles) console.log(`Note : ${tuilesIndisponibles} tuile(s) OpenStreetMap non chargée(s) (pas de connexion) : fond schématique utilisé.`);
  } catch (e) {
    console.error('\nÉCHEC :', e.message);
    console.error(String(e.stack).split('\n').slice(1, 4).join('\n'));
    if (erreurs.length) console.error('Erreurs JavaScript :', erreurs);
    process.exitCode = 1;
  } finally {
    await navigateur.close();
    serveur.close();
  }
})();
