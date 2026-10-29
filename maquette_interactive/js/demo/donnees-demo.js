/* =========================================================================
   ÉDYSOL NC — DONNÉES FICTIVES DE DÉMONSTRATION (mode démo uniquement)
   Ce fichier est volontairement séparé du reste du code : il ne contient
   aucune donnée réelle (clients, employés, véhicules, stocks sont inventés,
   repris des exemples de la maquette V1). Les dates sont calculées à partir
   de la semaine en cours pour que le planning reste toujours rempli.
   À supprimer ou remplacer lorsqu'un vrai backend sera branché.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};

  /**
   * Construit un état initial complet et neuf.
   * Retour : objet contenant personnes, équipes, commandes, interventions,
   * comptes rendus, relevés, stocks, notifications et permissions simulées.
   */
  function creerDonneesDemo() {
    const { aujourdhui, ajouterJours, lundiDe } = Edysol;
    const jour = aujourdhui();
    const lundi = lundiDe(jour);
    const j = n => ajouterJours(lundi, n);          // jour n de la semaine en cours (0 = lundi)
    const horo = (date, heure) => `${date}T${heure}:00+11:00`;

    // --- Personnes (toutes fictives) ---
    const personnes = [
      { id: 'A', nom: 'Agent A', role: 'employe' }, { id: 'B', nom: 'Agent B', role: 'employe' },
      { id: 'D', nom: 'Agent D', role: 'employe' }, { id: 'E', nom: 'Agent E', role: 'employe' },
      { id: 'F', nom: 'Agent F', role: 'employe' }, { id: 'G', nom: 'Agent G', role: 'employe' },
      { id: 'H', nom: 'Agent H', role: 'employe' }, { id: 'K', nom: 'Agent K', role: 'employe' },
      { id: 'C', nom: 'Agent C', role: 'employe' }, { id: 'J', nom: 'Agent J', role: 'employe' }, { id: 'L', nom: 'Agent L', role: 'employe' },
      { id: 'CT1', nom: 'Contrôleuse 1', role: 'controleuse' }, { id: 'CT2', nom: 'Contrôleuse 2', role: 'controleuse' }
    ];

    // --- Équipes : 4 binômes fixes, employés solos, contrôleuses pour leurs prestations de ménage ---
    const equipes = [
      { id: 'B1', type: 'binome', nom: 'Binôme fixe 1', membres: ['A', 'B'] },
      { id: 'B2', type: 'binome', nom: 'Binôme fixe 2', membres: ['D', 'E'] },
      { id: 'B3', type: 'binome', nom: 'Binôme fixe 3', membres: ['F', 'G'] },
      { id: 'B4', type: 'binome', nom: 'Binôme fixe 4', membres: ['H', 'K'] },
      { id: 'S-C', type: 'solo', nom: 'Agent C (solo)', membres: ['C'] },
      { id: 'S-J', type: 'solo', nom: 'Agent J (solo)', membres: ['J'] },
      { id: 'S-L', type: 'solo', nom: 'Agent L (solo)', membres: ['L'] },
      { id: 'M-CT1', type: 'controleuse', nom: 'Contrôleuse 1 (ménage)', membres: ['CT1'] },
      { id: 'M-CT2', type: 'controleuse', nom: 'Contrôleuse 2 (ménage)', membres: ['CT2'] }
    ];

    /** Fabrique une commande fictive avec son historique de démonstration. */
    function commande(num, client, commune, prestation, statut, extra = {}) {
      const id = `EDY-2026-${String(num).padStart(3, '0')}`;
      const creeLe = horo(extra.creeLeJour || j(-3), '08:42');
      return Object.assign({
        id, statut, prestation, commune, creeLe,
        client: { nom: client, telephone: 'Numéro fictif', email: '', type: extra.typeClient || 'Particulier' },
        adresse: 'Adresse de démonstration', acces: 'Appeler avant l’arrivée.',
        description: 'Demande fictive de démonstration.', dateSouhaitee: extra.dateSouhaitee || j(7), creneau: 'Matin',
        frequence: 'Intervention ponctuelle', source: 'client',
        historique: [
          { date: creeLe, texte: 'Demande enregistrée (démonstration)' },
          { date: creeLe, texte: 'Information du secrétariat et des deux cogérants (simulée)' }
        ]
      }, extra.champs || {});
    }

    const commandes = [
      commande(39, 'Client Démo D', 'La Foa', 'sols', 'terminee', { creeLeJour: j(-10), dateSouhaitee: j(-3) }),
      commande(40, 'Client Démo C', 'Moindou', 'vitres', 'en-cours', { creeLeJour: j(-6), dateSouhaitee: jour }),
      commande(41, 'Client Démo B', 'Bourail', 'mobilier', 'planifiee', { creeLeJour: j(-4), dateSouhaitee: j(2), typeClient: 'Professionnel' }),
      commande(42, 'Camille Exemple', 'La Foa', 'specifique', 'a-confirmer', { creeLeJour: j(-1), dateSouhaitee: j(7),
        champs: { description: 'Demande spécifique : remise en état après déménagement (exemple fictif).' } }),
      commande(43, 'Client Démo E', 'Nouméa', 'lavage', 'a-confirmer', { creeLeJour: jour, dateSouhaitee: j(9), typeClient: 'Professionnel',
        champs: { source: 'secretaire', description: 'Hall d’entrée à laver (exemple fictif saisi par la secrétaire).' } }),
      commande(44, 'Client Démo F', 'Dumbéa', 'sols', 'planifiee', { creeLeJour: j(-2), dateSouhaitee: j(2) }),
      commande(45, 'Client Démo G', 'Païta', 'lavage', 'planifiee', { creeLeJour: j(-5), dateSouhaitee: j(3), typeClient: 'Professionnel',
        champs: { description: 'Gros chantier fictif : plusieurs équipes et coordination par une contrôleuse.', grosChantier: true } })
    ];
    // Historique complémentaire des commandes déjà planifiées ou terminées.
    commandes.find(c => c.id === 'EDY-2026-039').historique.push({ date: horo(j(-3), '11:05'), texte: 'Intervention terminée, compte rendu disponible' });

    // --- Interventions planifiées (une ligne par équipe et par créneau) ---
    const interventions = [
      { id: 'INT-1', commandeId: 'EDY-2026-039', date: j(-3), debut: '08:00', fin: '11:00', equipeId: 'B2', statut: 'terminee' },
      { id: 'INT-2', commandeId: 'EDY-2026-040', date: jour, debut: '09:00', fin: '11:00', equipeId: 'S-C', statut: 'en-cours' },
      { id: 'INT-3', commandeId: 'EDY-2026-041', date: j(2), debut: '08:00', fin: '10:00', equipeId: 'B1', statut: 'planifiee' },
      { id: 'INT-4', commandeId: 'EDY-2026-044', date: j(2), debut: '14:00', fin: '16:00', equipeId: 'S-C', statut: 'planifiee' },
      { id: 'INT-5', commandeId: 'EDY-2026-045', date: j(3), debut: '07:30', fin: '12:00', equipeId: 'B3', statut: 'planifiee' },
      { id: 'INT-6', commandeId: 'EDY-2026-045', date: j(3), debut: '07:30', fin: '12:00', equipeId: 'B4', statut: 'planifiee' },
      { id: 'INT-7', commandeId: 'EDY-2026-041', date: j(4), debut: '13:30', fin: '15:30', equipeId: 'M-CT2', statut: 'planifiee' },
      // Prestation de ménage de la contrôleuse 1, distincte de sa mission de coordination.
      { id: 'INT-8', commandeId: 'EDY-2026-044', date: ajouterJours(jour, 1), debut: '08:00', fin: '09:30', equipeId: 'M-CT1', statut: 'planifiee' }
    ];
    // Coordination des gros chantiers : distincte des prestations de ménage.
    const coordinations = [{ id: 'CO-1', commandeId: 'EDY-2026-045', controleuseId: 'CT1', date: j(3), note: 'Coordination des binômes 3 et 4 (exemple fictif).' }];

    // --- Comptes rendus et relevés kilométriques (repris de la simulation V1) ---
    const comptesRendus = [
      { id: 'CR-DÉMO-039', interventionId: 'INT-1', employeId: 'D', etat: 'Terminée', debut: '08:00', fin: '11:00',
        observations: 'Intervention terminée (exemple fictif).', vehiculeId: 'V-DÉMO-01', creeLe: horo(j(-3), '11:20') }
    ];
    const relevesInitiaux = [
      { rapportId: 'CR-DÉMO-040', employeId: 'Agent C', compteur: 123400, dateReleve: horo(j(-5), '16:00'), cleIdempotence: 'EX3' },
      { rapportId: 'CR-DÉMO-041', employeId: 'Agent B', compteur: 123420, dateReleve: horo(j(-4), '17:00'), cleIdempotence: 'EX1' },
      { rapportId: 'CR-DÉMO-039', employeId: 'Agent D', compteur: 123450, dateReleve: horo(j(-3), '11:15'), cleIdempotence: 'EX2' }
    ];
    let releves = [];
    for (const r of relevesInitiaux) {
      releves = racine.EdysolMetier.enregistrerReleve(releves, { ...r, vehiculeId: 'V-DÉMO-01', auteur: r.employeId, dateSaisie: horo(j(-3), '12:00') });
    }
    const vehicules = [
      { id: 'V-DÉMO-01', libelle: 'V-DÉMO-01 · 000001 NC (fictif)' },
      { id: 'V-DÉMO-02', libelle: 'V-DÉMO-02 · 000002 NC (fictif)' }
    ];

    // --- Stocks : articles et mouvements append-only (quantités en milli-unités) ---
    const articles = [
      { id: 'A1', libelle: 'Détergent (démo)', nature: 'CONSOMMABLE', unite: 'L' },
      { id: 'A2', libelle: 'Sacs (démo)', nature: 'CONSOMMABLE', unite: 'pièces' },
      { id: 'A3', libelle: 'Aspirateur (démo)', nature: 'DURABLE', unite: 'unités' }
    ];
    const mvt = (id, articleId, type, quantiteMilli, motif, date) => ({ id, articleId, unite: articles.find(a => a.id === articleId).unite, type, quantiteMilli, motif, auteur: 'Secrétaire (démo)', date });
    const mouvements = [
      mvt('M-0', 'A1', 'ENTREE', 17000, 'Stock initial de démonstration', horo(j(-14), '09:00')),
      mvt('M-1', 'A2', 'ENTREE', 75000, 'Stock initial de démonstration', horo(j(-14), '09:00')),
      mvt('M-2', 'A3', 'ENTREE', 3000, 'Stock initial de démonstration', horo(j(-14), '09:00')),
      mvt('M-3', 'A1', 'ENTREE', 10000, 'Livraison (démo)', horo(j(-2), '09:30')),
      mvt('M-4', 'A1', 'SORTIE', 2500, 'Sortie pour chantier (démo)', horo(j(-2), '10:00')),
      mvt('M-5', 'A2', 'AJUSTEMENT', 5000, 'Ajustement motivé (démo)', horo(j(-2), '10:30'))
    ];

    // --- Notifications internes (affichées dans les espaces, AUCUN envoi externe) ---
    const notifications = [
      { id: 'N-1', pour: ['secretariat', 'cogerance'], titre: 'Nouvelle commande EDY-2026-042', texte: 'Client : Camille Exemple · à vérifier', date: horo(j(-1), '08:42'), lu: [], lien: 'commande/EDY-2026-042' },
      { id: 'N-2', pour: ['secretariat', 'cogerance'], titre: 'EDY-2026-041 : affectation enregistrée', texte: 'Binôme fixe 1 · Agent A + Agent B', date: horo(j(-2), '15:10'), lu: [], lien: 'commande/EDY-2026-041' },
      { id: 'N-3', pour: ['secretariat', 'cogerance'], titre: 'EDY-2026-039 : intervention terminée', texte: 'Compte rendu de l’équipe disponible', date: horo(j(-3), '11:20'), lu: [], lien: 'commande/EDY-2026-039' },
      { id: 'N-4', pour: ['personne:A', 'personne:B'], titre: 'Planning mis à jour', texte: 'EDY-2026-041 : ' + j(2) + ', 08:00 · Binôme fixe 1', date: horo(j(-2), '15:10'), lu: [], lien: 'intervention/INT-3' },
      { id: 'N-5', pour: ['personne:CT1'], titre: 'Coordination prévue', texte: 'EDY-2026-045 : gros chantier à coordonner', date: horo(j(-1), '10:00'), lu: [], lien: 'coordination/EDY-2026-045' }
    ];

    return {
      version: 1, creeLe: new Date().toISOString(), sequenceCommande: 45, sequence: 100,
      personnes, equipes, commandes, interventions, coordinations, comptesRendus,
      releves, vehicules, articles, mouvements, inventaires: [], notifications, renforts: [], demandesRappel: [],
      // Permissions d'écriture SIMULÉES : fermées par défaut (politique de référence inchangée).
      permissionsSimulees: { 'stocks:ecrire': false, 'inventaire:ecrire': false, 'releves:corriger': false }
    };
  }

  Edysol.creerDonneesDemo = creerDonneesDemo;
})(window);
