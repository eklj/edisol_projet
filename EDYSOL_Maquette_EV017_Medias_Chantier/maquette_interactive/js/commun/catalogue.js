/* =========================================================================
   ÉDYSOL NC — Contenus éditoriaux partagés (site public + espaces internes)
   Sources dans l'archive :
   - logo : « Prestige nettoyage », « Entretien - Nettoyage - Services » et
     quatre pictogrammes (aspiration, lavage mécanisé des sols, vitres,
     mobilier / postes de travail) ;
   - « Edysol fonctionnement.txt » : nettoyage, contrats particuliers et
     professionnels ;
   - site existant (site _web/dist/index.html) : téléphone et adresse.
   EV-017 confirme les activités citées dans le questionnaire (Q1/Q8/Q27).
   Les descriptions détaillées et le catalogue exhaustif restent À CONFIRMER
   par ÉDYSOL : aucun tarif, délai ou engagement n'est annoncé.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};

  /** Offres citées en Q1 ; les périmètres non détaillés restent à préciser.
   * Source : EV-017, transcription des réponses Q1/Q8/Q27 ; aucune tâche incluse n'est déduite.
   */
  const OFFRES = [
    { id: 'parties-communes', titre: 'Nettoyage des parties communes', icone: 'equipe', visuel: null },
    { id: 'fin-chantier', titre: 'Nettoyage de fin de chantier', icone: 'balai', visuel: null },
    { id: 'fin-bail', titre: 'Nettoyage de fin de bail', icone: 'maison', visuel: null },
    { id: 'commerces', titre: 'Nettoyage de commerces', icone: 'bureau', visuel: null },
    { id: 'bureaux', titre: 'Nettoyage de bureaux', icone: 'bureau', visuel: 'bureaux' },
    { id: 'particuliers', titre: 'Nettoyage chez les particuliers', icone: 'maison', visuel: 'domicile' },
    { id: 'encombrants', titre: 'Enlèvement d’encombrants', icone: 'etoile', visuel: null },
    { id: 'tags', titre: 'Enlèvement de tags', icone: 'etoile', visuel: null },
    { id: 'espaces-verts', titre: 'Espaces verts', icone: 'etoile', visuel: null }
  ].map((p, i) => ({ ...p, groupe: 'offres', nature: 'offre', source: ['Q1', ...(['encombrants', 'tags', 'espaces-verts'].includes(p.id) ? ['Q8', 'Q27'] : [])], tuile: i % 4 + 1,
    resume: 'Activité déclarée par ÉDYSOL. Contenu et périmètre à préciser avec l’entreprise.' }));

  /** Activité technique explicitement citée en Q27, distincte de la monobrosse.
   * Son accès dans la demande ne valide pas un périmètre commercial autonome.
   */
  const ACTIVITES_TECHNIQUES = [
    { id: 'karcher', titre: 'Nettoyage au Kärcher', icone: 'goutte', visuel: null, tuile: 2,
      groupe: 'techniques', nature: 'activite-technique', source: ['Q27'],
      resume: 'Activité citée dans le questionnaire. Libellé public et périmètre à préciser ; distincte du lavage à la monobrosse.' }
  ];

  /** Identifiants historiques conservés : aucune migration des anciennes demandes.
   * Leur classement en offres, tâches ou techniques reste à arbitrer ; aucune inclusion
   * dans une nouvelle offre n'est supposée. Les anciennes descriptions sont archivées.
   */
  const ENTREES_HISTORIQUES = [
    { id: 'sols', titre: 'Entretien des sols', icone: 'balai', visuel: 'aspiration', tuile: 1, nature: 'tache-ou-offre-a-preciser',
      resumeHistorique: 'Aspiration et entretien courant des sols de bureaux, de locaux et de logements.' },
    { id: 'lavage', titre: 'Lavage mécanisé des sols', icone: 'goutte', visuel: 'monobrosse', tuile: 2, nature: 'technique-ou-offre-a-preciser',
      resumeHistorique: 'Lavage des grandes surfaces à la machine, par exemple dans les halls et couloirs.' },
    { id: 'vitres', titre: 'Nettoyage des vitres', icone: 'vitre', visuel: 'vitres', tuile: 3, nature: 'tache-ou-offre-a-preciser',
      resumeHistorique: 'Vitres, baies vitrées et surfaces vitrées accessibles, pour plus de lumière.' },
    { id: 'mobilier', titre: 'Mobilier et postes de travail', icone: 'bureau', visuel: 'bureaux', tuile: 4, nature: 'tache-ou-offre-a-preciser',
      resumeHistorique: 'Dépoussiérage et entretien des bureaux, tables et surfaces de travail.' }
  ].map(p => ({ ...p, groupe: 'historique', source: ['Pictogrammes du logo — historique'],
    resume: 'Entrée antérieure conservée. Place comme offre autonome, tâche ou technique et contenu à préciser.' }));

  /** Liste compatible avec les anciens consommateurs ; une seule valeur par demande. */
  const PRESTATIONS = [...OFFRES, ...ACTIVITES_TECHNIQUES, ...ENTREES_HISTORIQUES];
  const GROUPES_PRESTATIONS = [
    { id: 'offres', titre: 'Activités déclarées par ÉDYSOL' },
    { id: 'techniques', titre: 'Activité technique citée — périmètre à préciser' },
    { id: 'historique', titre: 'Entrées antérieures — classement à préciser' }
  ];
  // Les types de clients restent une information indépendante de la prestation choisie.
  const TYPES_CLIENTS = ['Particulier', 'Professionnel'];

  /** Choix supplémentaire du formulaire : besoin non listé. */
  const DEMANDE_SPECIFIQUE = { id: 'specifique', titre: 'Demande spécifique', icone: 'etoile',
    resume: 'Un autre besoin ? Décrivez-le : la secrétaire vous recontacte.' };

  /** Coordonnées présentes dans le site existant (site _web/dist/index.html). */
  const CONTACT = {
    telephoneAffiche: '45 38 12',
    telephoneLien: 'tel:+687453812',
    adresse: ['13 route du Sud RP1', 'Normandie, 98800 Nouméa'],
    email: null,      // À compléter : aucune adresse e-mail fournie dans l'archive.
    horaires: null    // À compléter : horaires d'accueil non fournis.
  };

  /** Les 33 communes de Nouvelle-Calédonie (zone réellement couverte : à confirmer par ÉDYSOL). */
  const COMMUNES = ['Bélep', 'Boulouparis', 'Bourail', 'Canala', 'Dumbéa', 'Farino', 'Hienghène', 'Houaïlou', 'Île des Pins',
    'Kaala-Gomen', 'Koné', 'Kouaoua', 'Koumac', 'La Foa', 'Lifou', 'Maré', 'Moindou', 'Le Mont-Dore', 'Nouméa', 'Ouégoa',
    'Ouvéa', 'Païta', 'Poindimié', 'Ponérihouen', 'Pouébo', 'Pouembout', 'Poum', 'Poya', 'Sarraméa', 'Thio', 'Touho',
    'Voh', 'Yaté'];

  /** Créneaux et fréquences proposés dans le formulaire (repris de la maquette V1). */
  const CRENEAUX = ['Matin', 'Après-midi', 'Indifférent'];
  const FREQUENCES = ['Intervention ponctuelle', 'Entretien régulier (contrat à étudier)'];

  /** Retrouve une prestation (y compris la demande spécifique) par identifiant. */
  function prestationParId(id) {
    return PRESTATIONS.find(p => p.id === id) || (id === DEMANDE_SPECIFIQUE.id ? DEMANDE_SPECIFIQUE : null);
  }

  /** Libellé unique pour récapitulatifs, planning, PDF et terrain ; un identifiant inconnu reste visible. */
  function libellePrestation(id) { return prestationParId(id)?.titre || (id ? `Prestation historique (${String(id)})` : 'À préciser'); }

  Object.assign(Edysol, { OFFRES, ACTIVITES_TECHNIQUES, ENTREES_HISTORIQUES, GROUPES_PRESTATIONS, TYPES_CLIENTS, libellePrestation, PRESTATIONS, DEMANDE_SPECIFIQUE, CONTACT, COMMUNES, CRENEAUX, FREQUENCES, prestationParId });
})(window);
