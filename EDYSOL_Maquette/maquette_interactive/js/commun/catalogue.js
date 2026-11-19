/* =========================================================================
   EDYSOL NC — Catalogue partagé entre la vitrine et les espaces internes.
   Les activités déclarées proviennent du questionnaire repris dans EV-017.
   Les spécialités, les procédés et les coordonnées complétés ici ont été
   confirmés par l'entreprise. Les anciennes demandes gardent leur identifiant.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};

  const OFFRES = [
    {
      id: 'fin-chantier', titre: 'Nettoyage de fin de chantier', icone: 'balai', visuel: null, specialite: true,
      resume: 'Après les travaux, EDYSOL prépare les espaces à leur prochaine utilisation.',
      details: [
        { titre: 'Après les travaux', texte: 'Le nettoyage de fin de chantier intervient une fois les travaux achevés. Il prépare les espaces pour la remise des lieux ou leur mise en service.' },
        { titre: 'Préparer l’intervention', texte: 'Indiquez les zones à nettoyer, le type de travaux réalisés et l’état des lieux. Ces éléments permettent de définir avec EDYSOL les tâches à prévoir.' }
      ]
    },
    {
      id: 'fin-bail', titre: 'Nettoyage de fin de bail', icone: 'maison', visuel: null, specialite: true,
      resume: 'EDYSOL nettoie le logement ou le local avant sa restitution en fin de bail.',
      details: [
        { titre: 'Avant la remise des clés', texte: 'Cette prestation s’inscrit dans la préparation d’un logement ou d’un local à sa restitution. Précisez les pièces à nettoyer et la date prévue pour la remise des clés ou l’état des lieux.' },
        { titre: 'Définir les besoins du lieu', texte: 'L’état des pièces et les points qui demandent une attention particulière aident à définir le contenu de l’intervention avec EDYSOL.' }
      ]
    },
    {
      id: 'parties-communes', titre: 'Nettoyage des parties communes', icone: 'equipe', visuel: null,
      resume: 'Nettoyage des espaces partagés, selon les besoins du bâtiment.',
      details: [
        { titre: 'Des espaces utilisés en commun', texte: 'La prestation concerne les espaces partagés d’un bâtiment. Les parties concernées et les besoins d’entretien se définissent selon le lieu.' },
        { titre: 'Organiser l’entretien', texte: 'Précisez les zones, leurs conditions d’accès et la fréquence souhaitée pour préparer votre demande.' }
      ]
    },
    {
      id: 'commerces', titre: 'Nettoyage de commerces', icone: 'bureau', visuel: null,
      resume: 'Nettoyage des espaces commerciaux en tenant compte de leur usage.',
      details: [
        { titre: 'Des espaces liés à votre activité', texte: 'Le nettoyage concerne les parties du commerce à entretenir. La demande permet de distinguer les espaces utilisés par le public et les autres zones concernées.' },
        { titre: 'Préciser les conditions d’accès', texte: 'Décrivez les surfaces, le besoin d’entretien et les contraintes liées à l’ouverture du commerce pour définir l’intervention avec EDYSOL.' }
      ]
    },
    {
      id: 'bureaux', titre: 'Nettoyage de bureaux', icone: 'bureau', visuel: 'bureaux',
      resume: 'Nettoyage des bureaux et des espaces de travail selon les besoins du site.',
      details: [
        { titre: 'Des locaux professionnels', texte: 'La prestation porte sur les espaces de travail que vous souhaitez faire nettoyer. Le contenu dépend de la configuration des locaux et de leur usage.' },
        { titre: 'Tenir compte du rythme de travail', texte: 'Indiquez les zones à traiter, leur occupation et la fréquence souhaitée afin de préciser le périmètre et le créneau avec EDYSOL.' }
      ]
    },
    {
      id: 'particuliers', titre: 'Nettoyage chez les particuliers', icone: 'maison', visuel: 'domicile',
      resume: 'Nettoyage à domicile, adapté aux pièces et aux besoins décrits dans la demande.',
      details: [
        { titre: 'Le nettoyage à domicile', texte: 'EDYSOL intervient chez les particuliers. Le contenu de la prestation se définit à partir des pièces concernées et de vos besoins.' },
        { titre: 'Décrire votre demande', texte: 'Indiquez les tâches souhaitées et les conditions d’accès au logement. Vous pouvez préciser si votre besoin est ponctuel ou régulier.' }
      ]
    },
    {
      id: 'encombrants', titre: 'Enlèvement d’encombrants', icone: 'etoile', visuel: null,
      resume: 'Enlèvement d’objets volumineux après échange sur leur nature et les conditions d’accès.',
      details: [
        { titre: 'Identifier les objets', texte: 'Décrivez les encombrants à enlever ainsi que leur nombre ou leur volume approximatif. EDYSOL pourra préciser la prise en charge selon le contenu de votre demande.' },
        { titre: 'Vérifier l’accès au lieu', texte: 'Précisez l’endroit où se trouvent les objets, l’étage si nécessaire et les possibilités d’accès aux lieux.' }
      ]
    },
    {
      id: 'tags', titre: 'Enlèvement de tags', icone: 'etoile', visuel: null,
      resume: 'Enlèvement de tags, avec une intervention étudiée selon le support concerné.',
      details: [
        { titre: 'Décrire le support', texte: 'La demande porte sur les marques visibles et sur la surface où elles apparaissent. Indiquez le type de revêtement, son état et l’étendue approximative de la zone.' },
        { titre: 'Préciser l’intervention', texte: 'EDYSOL étudie les informations sur le support et les conditions d’accès pour définir la méthode et le périmètre de l’intervention.' }
      ]
    },
    {
      id: 'espaces-verts', titre: 'Espaces verts', icone: 'etoile', visuel: null,
      resume: 'Intervention sur les espaces verts selon la configuration du lieu et le besoin.',
      details: [
        { titre: 'Décrire l’espace concerné', texte: 'Présentez la zone, sa configuration et les travaux souhaités. Ces informations permettent de définir le contenu de la prestation.' },
        { titre: 'Préparer l’accès', texte: 'Indiquez la surface approximative et les particularités du lieu qui peuvent compter pour l’intervention.' }
      ]
    }
  ].map((p, i) => ({ ...p, groupe: 'offres', nature: 'offre', source: ['Q1', ...(['encombrants', 'tags', 'espaces-verts'].includes(p.id) ? ['Q8', 'Q27'] : [])], tuile: i % 4 + 1 }));

  const ACTIVITES_TECHNIQUES = [
    {
      id: 'karcher', titre: 'Nettoyage haute pression', icone: 'goutte', visuel: null, tuile: 2,
      groupe: 'techniques', nature: 'activite-technique', source: ['Q27'],
      resume: 'Nettoyage à l’eau sous pression, selon l’état et la nature de la surface.',
      details: [
        { titre: 'Le nettoyage à l’eau sous pression', texte: 'Cette prestation utilise de l’eau sous pression. L’état du support et son revêtement sont pris en compte pour évaluer si le procédé convient à la demande.' },
        { titre: 'Préciser la surface à nettoyer', texte: 'Indiquez la nature de la surface, son état, ses dimensions approximatives et les conditions d’accès. EDYSOL pourra préciser les modalités de l’intervention.' }
      ]
    }
  ];

  const ENTREES_HISTORIQUES = [
    {
      id: 'sols', titre: 'Décapage des sols', icone: 'goutte', visuel: 'monobrosse', tuile: 1, nature: 'technique-ou-offre-a-preciser',
      resume: 'Décapage réalisé avec une machine spécialisée dans l’entretien des sols et des disques choisis selon le revêtement et le travail à effectuer.',
      details: [
        { titre: 'Une machine spécialisée', texte: 'EDYSOL utilise une machine d’entretien des sols qui peut recevoir différents disques. Le choix du disque dépend du revêtement et du travail à réaliser.' },
        { titre: 'Un choix adapté au revêtement', texte: 'Décrivez la nature et l’état du sol pour qu’EDYSOL puisse examiner votre demande. L’adaptation du matériel se décide en fonction de la surface concernée.' }
      ]
    },
    {
      id: 'vitres', titre: 'Nettoyage des vitres', icone: 'vitre', visuel: 'vitres', tuile: 3, nature: 'tache-ou-offre-a-preciser',
      resume: 'Nettoyage avec une machine utilisant de l’eau déminéralisée ou avec des produits d’entretien spécifiques, selon l’intervention.',
      details: [
        { titre: 'Avec une machine à eau déminéralisée', texte: 'EDYSOL dispose d’un procédé de nettoyage qui emploie une machine utilisant de l’eau déminéralisée.' },
        { titre: 'Avec des produits d’entretien spécifiques', texte: 'L’équipe peut aussi utiliser des produits d’entretien spécifiques pour les vitres. Le choix entre les deux procédés est adapté aux vitrages à nettoyer et aux caractéristiques de l’intervention.' }
      ]
    },
    {
      id: 'mobilier', titre: 'Mobilier et postes de travail', icone: 'bureau', visuel: 'bureaux', tuile: 4, nature: 'tache-ou-offre-a-preciser',
      resume: 'Entretien du mobilier et des surfaces des postes de travail.',
      details: [
        { titre: 'Les surfaces de travail', texte: 'La prestation concerne l’entretien du mobilier et des surfaces utilisées dans les espaces de travail. Les éléments concernés sont précisés avec EDYSOL.' },
        { titre: 'Définir le périmètre', texte: 'Indiquez les meubles, les postes de travail ou les zones à traiter, en précisant les particularités des surfaces et des locaux.' }
      ]
    }
  ].map(p => ({ ...p, groupe: 'historique', source: ['Pictogrammes du logo — historique'] }));

  /** Une entrée par prestation présentée ; les alias ne créent pas de choix supplémentaire. */
  const PRESTATIONS = [...OFFRES, ...ACTIVITES_TECHNIQUES, ...ENTREES_HISTORIQUES];
  const GROUPES_PRESTATIONS = [
    { id: 'offres', titre: 'Nettoyage et services' },
    { id: 'techniques', titre: 'Nettoyage des surfaces' },
    { id: 'historique', titre: 'Sols, vitres et mobilier' }
  ];
  const TYPES_CLIENTS = ['Particulier', 'Professionnel'];

  /** Choix supplémentaire du formulaire : besoin non listé. */
  const DEMANDE_SPECIFIQUE = { id: 'specifique', titre: 'Demande spécifique', icone: 'etoile',
    resume: 'Décrivez votre besoin pour en parler avec EDYSOL.',
    details: [
      { titre: 'Expliquer votre besoin', texte: 'Décrivez le lieu, les tâches souhaitées et les éventuelles contraintes d’accès. Ces éléments permettent à EDYSOL d’examiner votre demande.' }
    ] };

  const CONTACT = {
    telephoneAffiche: '45 38 12',
    telephoneLien: 'tel:+687453812',
    adresse: ['13 route du Sud RP1', 'Normandie, 98800 Nouméa'],
    email: 'contact@edysol.nc',
    horaires: 'Du lundi au vendredi, de 07h30 à 12h00 et de 13h00 à 16h30.'
  };
  const OBJETS_RAPPEL = {
    'rendez-vous': 'Prendre rendez-vous',
    'question-prestation': 'Question sur une prestation'
  };

  /** Les 33 communes de Nouvelle-Calédonie (zone réellement couverte : à confirmer). */
  const COMMUNES = ['Bélep', 'Boulouparis', 'Bourail', 'Canala', 'Dumbéa', 'Farino', 'Hienghène', 'Houaïlou', 'Île des Pins',
    'Kaala-Gomen', 'Koné', 'Kouaoua', 'Koumac', 'La Foa', 'Lifou', 'Maré', 'Moindou', 'Le Mont-Dore', 'Nouméa', 'Ouégoa',
    'Ouvéa', 'Païta', 'Poindimié', 'Ponérihouen', 'Pouébo', 'Poum', 'Poya', 'Sarraméa', 'Thio', 'Touho',
    'Voh', 'Yaté'];

  /** Créneaux et fréquences proposés dans le formulaire (repris de la maquette V1). */
  const CRENEAUX = ['Matin', 'Après-midi', 'Indifférent'];
  const FREQUENCES = ['Intervention ponctuelle', 'Entretien régulier (contrat à étudier)'];

  // « lavage » correspond à l'ancienne entrée mécanisée réunie dans le décapage.
  // L'alias permet de relire les demandes et URL existantes sans migrer le stockage.
  const ALIAS_PRESTATIONS = { lavage: 'sols' };

  /** Donne l'identifiant de référence, en laissant les identifiants inconnus lisibles. */
  function idPrestationCanonique(id) {
    return typeof id === 'string' && Object.hasOwn(ALIAS_PRESTATIONS, id) ? ALIAS_PRESTATIONS[id] : id;
  }

  /** Retrouve une prestation, y compris une ancienne référence ou un besoin spécifique. */
  function prestationParId(id) {
    const canonique = idPrestationCanonique(id);
    return PRESTATIONS.find(p => p.id === canonique) || (canonique === DEMANDE_SPECIFIQUE.id ? DEMANDE_SPECIFIQUE : null);
  }

  /** Libellé commun au récapitulatif, au planning, au PDF et aux espaces terrain. */
  function libellePrestation(id) { return prestationParId(id)?.titre || (id ? `Prestation historique (${String(id)})` : 'À préciser'); }

  Object.assign(Edysol, { OFFRES, ACTIVITES_TECHNIQUES, ENTREES_HISTORIQUES, GROUPES_PRESTATIONS, TYPES_CLIENTS, libellePrestation, PRESTATIONS, DEMANDE_SPECIFIQUE, CONTACT, OBJETS_RAPPEL, COMMUNES, CRENEAUX, FREQUENCES, prestationParId, idPrestationCanonique });
})(window);
