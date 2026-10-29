/* =========================================================================
   ÉDYSOL NC — Catalogue des visuels du site public
   IMPORTANT : aucune photo de chantier ÉDYSOL autorisée n'a été fournie.
   - « illustration » : dessin vectoriel créé pour la maquette (provisoire).
   - « image-projet » : image présente dans l'archive (site _web/dist),
     utilisée comme visuel d'ambiance ; ce n'est pas un chantier ÉDYSOL attesté.
   Pour ajouter une vraie photo : renseigner src/srcset/largeur/hauteur/alt,
   type « photo-chantier », puis passer publicationAutorisee et
   confidentialiteVerifiee à true après accord écrit de l'entreprise
   (aucune adresse, plaque ou personne identifiable sans accord).
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};
  const ILL = 'assets/illustrations/';

  /** Liste des visuels ; « categories » sert aux carrousels et aux filtres de la galerie. */
  const VISUELS = [
    {
      id: 'interieur', type: 'image-projet', categories: ['accueil', 'entreprise', 'sols'],
      src: 'assets/images/edysol-interieur-1024.jpg',
      sources: [{ type: 'image/webp', srcset: 'assets/images/edysol-interieur-640.webp 640w, assets/images/edysol-interieur-1024.webp 1024w, assets/images/edysol-interieur-1600.webp 1600w' }],
      largeur: 1600, hauteur: 900,
      alt: 'Une agente en tenue bleu marine passe la frange sur le carrelage d’un open space lumineux avec vue sur la mer.',
      titre: 'Entretien des sols de bureaux',
      legende: 'Image d’ambiance reprise du site existant. À remplacer par une photo de chantier autorisée.',
      publicationAutorisee: false, confidentialiteVerifiee: false
    },
    {
      id: 'aspiration', type: 'illustration', categories: ['accueil', 'prestations', 'sols'], src: ILL + 'sols-aspiration.svg', largeur: 1600, hauteur: 1000,
      alt: 'Illustration : une personne passe l’aspirateur dans un bureau avec une grande baie vitrée.',
      titre: 'Aspiration et entretien des sols', legende: 'Illustration provisoire. Photo de chantier à fournir.'
    },
    {
      id: 'monobrosse', type: 'illustration', categories: ['prestations', 'sols'], src: ILL + 'sols-monobrosse.svg', largeur: 1600, hauteur: 1000,
      alt: 'Illustration : lavage d’un sol de hall à la monobrosse, un panneau signale le sol glissant.',
      titre: 'Lavage mécanisé des sols', legende: 'Illustration provisoire. Photo de chantier à fournir.'
    },
    {
      id: 'vitres', type: 'illustration', categories: ['accueil', 'prestations', 'vitres'], src: ILL + 'vitres.svg', largeur: 1600, hauteur: 1000,
      alt: 'Illustration : nettoyage d’une baie vitrée à la raclette, vue sur le lagon.',
      titre: 'Nettoyage des vitres', legende: 'Illustration provisoire. Photo de chantier à fournir.'
    },
    {
      id: 'bureaux', type: 'illustration', categories: ['prestations', 'bureaux', 'entreprise'], src: ILL + 'bureaux-mobilier.svg', largeur: 1600, hauteur: 1000,
      alt: 'Illustration : une personne essuie un bureau et son poste de travail.',
      titre: 'Mobilier et postes de travail', legende: 'Illustration provisoire. Photo de chantier à fournir.'
    },
    {
      id: 'equipe', type: 'illustration', categories: ['entreprise', 'accueil'], src: ILL + 'equipe-binome.svg', largeur: 1600, hauteur: 1000,
      alt: 'Illustration : deux personnes en tenue de travail arrivent dans un couloir avec un chariot de nettoyage.',
      titre: 'Une équipe organisée', legende: 'Illustration provisoire. Photo de l’équipe à fournir avec l’accord des personnes.'
    },
    {
      id: 'domicile', type: 'illustration', categories: ['prestations', 'domicile', 'entreprise'], src: ILL + 'domicile.svg', largeur: 1600, hauteur: 1000,
      alt: 'Illustration : un salon de particulier rangé et lumineux, fenêtre ouverte sur la mer.',
      titre: 'Chez les particuliers', legende: 'Illustration provisoire. Photo à fournir avec l’accord du client.'
    }
  ];

  /**
   * Retourne les visuels d'une catégorie, dans l'ordre du catalogue.
   * Les photos réelles ne sont gardées que si leur publication est autorisée.
   */
  function visuelsDe(categorie) {
    return VISUELS.filter(v => (!categorie || v.categories.includes(categorie)) && (v.type !== 'photo-chantier' || (v.publicationAutorisee && v.confidentialiteVerifiee)));
  }

  /** Libellé court affiché sur la pastille selon le type de visuel. */
  function libelleStatut(v) {
    return v.type === 'illustration' ? 'Illustration provisoire' : v.type === 'image-projet' ? 'Visuel d’ambiance · à remplacer' : 'Photo de chantier';
  }

  /**
   * Construit la balise image (ou picture) d'un visuel, avec dimensions déclarées
   * pour éviter les décalages de mise en page.
   * Paramètres : visuel, options { prioritaire, tailles, classe }.
   */
  function baliseImage(v, { prioritaire = false, tailles = '100vw', classe = '' } = {}) {
    const esc = Edysol.esc;
    const attributs = `src="${esc(v.src)}" alt="${esc(v.alt)}" width="${v.largeur}" height="${v.hauteur}" class="${esc(classe)}" decoding="async" ${prioritaire ? 'fetchpriority="high"' : 'loading="lazy"'}`;
    if (!v.sources) return `<img ${attributs}>`;
    return `<picture>${v.sources.map(s => `<source type="${esc(s.type)}" srcset="${esc(s.srcset)}" sizes="${esc(tailles)}">`).join('')}<img ${attributs}></picture>`;
  }

  Object.assign(Edysol, { VISUELS, visuelsDe, libelleStatut, baliseImage });
})(window);
