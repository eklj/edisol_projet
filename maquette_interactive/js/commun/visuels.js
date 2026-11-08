/* =========================================================================
   ÉDYSOL NC — Catalogue des visuels du site public
   Visuels générés : voir ressources-visuels.json ; les SVG restent conservés.
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
  // Les formats WebP réutilisent les six visuels générés le 6 novembre 2026.
  const GEN = 'assets/images/generees/';

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
      id: 'aspiration', type: 'illustration-generee', categories: ['accueil', 'prestations', 'sols'], src: GEN + 'aspiration-1024.webp',
      sources: [{ type: 'image/webp', srcset: [640, 1024, 1600].map(l => GEN + 'aspiration-' + l + '.webp ' + l + 'w').join(', ') }], largeur: 1600, hauteur: 1000,
      alt: "Visuel d’illustration : une agente passe un aspirateur professionnel sur le sol d’un bureau lumineux.",
      titre: 'Aspiration et entretien des sols', legende: 'Visuel d’illustration généré. Personnes et lieux fictifs ; aucun chantier ÉDYSOL réel représenté.'
    },
    {
      id: 'monobrosse', type: 'illustration-generee', categories: ['prestations', 'sols'], src: GEN + 'monobrosse-1024.webp',
      sources: [{ type: 'image/webp', srcset: [640, 1024, 1600].map(l => GEN + 'monobrosse-' + l + '.webp ' + l + 'w').join(', ') }], largeur: 1600, hauteur: 1000,
      alt: "Visuel d’illustration : un agent lave le carrelage d’un hall à la monobrosse, avec signalisation du sol humide.",
      titre: 'Lavage mécanisé des sols', legende: 'Visuel d’illustration généré. Personnes et lieux fictifs ; aucun chantier ÉDYSOL réel représenté.'
    },
    {
      id: 'vitres', type: 'illustration-generee', categories: ['accueil', 'prestations', 'vitres'], src: GEN + 'vitres-1024.webp',
      sources: [{ type: 'image/webp', srcset: [640, 1024, 1600].map(l => GEN + 'vitres-' + l + '.webp ' + l + 'w').join(', ') }], largeur: 1600, hauteur: 1000,
      alt: "Visuel d’illustration : une agente nettoie une baie vitrée accessible à la raclette et au mouilleur.",
      titre: 'Nettoyage des vitres', legende: 'Visuel d’illustration généré. Personnes et lieux fictifs ; aucun chantier ÉDYSOL réel représenté.'
    },
    {
      id: 'bureaux', type: 'illustration-generee', categories: ['prestations', 'bureaux', 'entreprise'], src: GEN + 'bureaux-1024.webp',
      sources: [{ type: 'image/webp', srcset: [640, 1024, 1600].map(l => GEN + 'bureaux-' + l + '.webp ' + l + 'w').join(', ') }], largeur: 1600, hauteur: 1000,
      alt: "Visuel d’illustration : une agente gantée essuie un bureau à la microfibre verte.",
      titre: 'Mobilier et postes de travail', legende: 'Visuel d’illustration généré. Personnes et lieux fictifs ; aucun chantier ÉDYSOL réel représenté.'
    },
    {
      id: 'equipe', type: 'illustration-generee', categories: ['entreprise', 'accueil'], src: GEN + 'equipe-1024.webp',
      sources: [{ type: 'image/webp', srcset: [640, 1024, 1600].map(l => GEN + 'equipe-' + l + '.webp ' + l + 'w').join(', ') }], largeur: 1600, hauteur: 1000,
      alt: "Visuel d’illustration : un binôme en tenue marine déplace un chariot de nettoyage dans un couloir.",
      titre: 'Une équipe organisée', legende: 'Visuel d’illustration généré. Personnes et lieux fictifs ; aucun chantier ÉDYSOL réel représenté.'
    },
    {
      id: 'domicile', type: 'illustration-generee', categories: ['prestations', 'domicile', 'entreprise'], src: GEN + 'domicile-1024.webp',
      sources: [{ type: 'image/webp', srcset: [640, 1024, 1600].map(l => GEN + 'domicile-' + l + '.webp ' + l + 'w').join(', ') }], largeur: 1600, hauteur: 1000,
      alt: "Visuel d’illustration : une agente entretient une table basse dans un salon lumineux.",
      titre: 'Chez les particuliers', legende: 'Visuel d’illustration généré. Personnes et lieux fictifs ; aucun chantier ÉDYSOL réel représenté.'
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
    return v.type === 'illustration-generee' ? 'Visuel d’illustration' : v.type === 'illustration' ? 'Illustration provisoire' : v.type === 'image-projet' ? 'Visuel d’ambiance · à remplacer' : 'Photo de chantier';
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
