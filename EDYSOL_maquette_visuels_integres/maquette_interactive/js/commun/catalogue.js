/* =========================================================================
   ÉDYSOL NC — Contenus éditoriaux partagés (site public + espaces internes)
   Sources dans l'archive :
   - logo : « Prestige nettoyage », « Entretien - Nettoyage - Services » et
     quatre pictogrammes (aspiration, lavage mécanisé des sols, vitres,
     mobilier / postes de travail) ;
   - « Edysol fonctionnement.txt » : nettoyage, contrats particuliers et
     professionnels ;
   - site existant (site _web/dist/index.html) : téléphone et adresse.
   Les descriptions détaillées et le catalogue final restent À CONFIRMER
   par ÉDYSOL : aucun tarif, délai ou engagement n'est annoncé.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};

  /** Prestations présentées (intitulés déduits des pictogrammes du logo). */
  const PRESTATIONS = [
    { id: 'sols', titre: 'Entretien des sols', icone: 'balai', visuel: 'aspiration', tuile: 1,
      resume: 'Aspiration et entretien courant des sols de bureaux, de locaux et de logements.' },
    { id: 'lavage', titre: 'Lavage mécanisé des sols', icone: 'goutte', visuel: 'monobrosse', tuile: 2,
      resume: 'Lavage des grandes surfaces à la machine, par exemple dans les halls et couloirs.' },
    { id: 'vitres', titre: 'Nettoyage des vitres', icone: 'vitre', visuel: 'vitres', tuile: 3,
      resume: 'Vitres, baies vitrées et surfaces vitrées accessibles, pour plus de lumière.' },
    { id: 'mobilier', titre: 'Mobilier et postes de travail', icone: 'bureau', visuel: 'bureaux', tuile: 4,
      resume: 'Dépoussiérage et entretien des bureaux, tables et surfaces de travail.' }
  ];

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

  Object.assign(Edysol, { PRESTATIONS, DEMANDE_SPECIFIQUE, CONTACT, COMMUNES, CRENEAUX, FREQUENCES, prestationParId });
})(window);
