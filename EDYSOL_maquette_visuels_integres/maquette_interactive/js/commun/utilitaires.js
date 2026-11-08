/* =========================================================================
   ÉDYSOL NC — Utilitaires communs (site public et espaces internes)
   Rôle : échappement HTML, icônes SVG, stockage local protégé, formats de
   dates (heure de Nouvelle-Calédonie), piège de focus pour les fenêtres.
   Chargé en script classique (window.Edysol) : la maquette fonctionne
   aussi en ouvrant les fichiers directement, sans serveur.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};

  /**
   * Échappe une valeur avant insertion dans du HTML.
   * Paramètre : valeur quelconque. Retour : texte sûr (pas d'injection de balises).
   */
  function esc(valeur) {
    return String(valeur ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* Tracés d'icônes 24x24 (trait), dessinés pour la maquette. */
  const TRACES = {
    gauche: '<path d="M15 5l-7 7 7 7"/>',
    droite: '<path d="M9 5l7 7-7 7"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    lecture: '<path d="M7 4.5v15l12-7.5z"/>',
    agrandir: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
    fermer: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    telephone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    lieu: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    calendrier: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    horloge: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    utilisateur: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    equipe: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M15 14.5a5 5 0 016.5 5"/>',
    commandes: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    planning: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3M13 14h3"/>',
    documents: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    cloche: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
    comptabilite: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 7.5h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0"/>',
    stock: '<path d="M3.5 8L12 4l8.5 4v8L12 20l-8.5-4z"/><path d="M3.5 8L12 12l8.5-4M12 12v8"/>',
    vehicule: '<path d="M3 15V9l2-4h10l4 4h2v6"/><path d="M3 15h18"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
    accueil: '<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    valide: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    alerte: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
    sortie: '<path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
    recherche: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    balai: '<path d="M14 3l-4 9M7 12h8l2 9H5z"/><path d="M9 16v5M13 16v5"/>',
    vitre: '<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M12 3.5v17M4 12h16M7 8l3-2"/>',
    goutte: '<path d="M12 3s6.5 7 6.5 11a6.5 6.5 0 01-13 0C5.5 10 12 3 12 3z"/>',
    bureau: '<path d="M3 10h18M5 10v10M19 10v10M8 10V6h8v4"/>',
    maison: '<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
    etoile: '<path d="M12 3l2.2 5.6L20 9.3l-4.4 3.9 1.3 5.8L12 16l-4.9 3 1.3-5.8L4 9.3l5.8-.7z"/>',
    crayon: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
    imprimer: '<path d="M7 9V3.5h10V9M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
    bouclier: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/>',
    rafraichir: '<path d="M20 6v5h-5"/><path d="M19.5 11A7.5 7.5 0 106 17.5"/>'
  };

  /**
   * Retourne le code SVG d'une icône décorative (masquée aux lecteurs d'écran).
   * Paramètres : nom de l'icône, classe CSS facultative. Retour : chaîne HTML.
   */
  function icone(nom, classe = '') {
    const plein = nom === 'lecture';
    return `<svg class="icone ${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="${plein ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TRACES[nom] || ''}</svg>`;
  }

  /**
   * Stockage local protégé : certaines navigations privées refusent localStorage.
   * En cas d'échec, les données restent en mémoire jusqu'au rechargement.
   */
  const memoire = new Map();
  const stockage = {
    lire(cle) {
      try { const v = localStorage.getItem(cle); return v === null ? (memoire.get(cle) ?? null) : JSON.parse(v); }
      catch (e) { return memoire.get(cle) ?? null; }
    },
    ecrire(cle, valeur) {
      memoire.set(cle, valeur);
      try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
    },
    supprimer(cle) {
      memoire.delete(cle);
      try { localStorage.removeItem(cle); } catch (e) { /* stockage indisponible : rien à faire */ }
    }
  };

  /* --- Dates : toute l'application raisonne en heure de Nouvelle-Calédonie (UTC+11, sans heure d'été) --- */
  const FUSEAU = 'Pacific/Noumea';

  /** Retourne la date du jour en Nouvelle-Calédonie au format AAAA-MM-JJ. */
  function aujourdhui() {
    return new Intl.DateTimeFormat('fr-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  /** Ajoute un nombre de jours à une date AAAA-MM-JJ. Retour : nouvelle date AAAA-MM-JJ. */
  function ajouterJours(dateIso, jours) {
    const d = new Date(dateIso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
  }

  /** Retourne le lundi de la semaine contenant la date fournie (AAAA-MM-JJ). */
  function lundiDe(dateIso) {
    const d = new Date(dateIso + 'T12:00:00Z');
    const decalage = (d.getUTCDay() + 6) % 7; // lundi = 0
    return ajouterJours(dateIso, -decalage);
  }

  /**
   * Formate une date AAAA-MM-JJ en français.
   * Paramètres : date, style ('long' : lundi 3 novembre 2026, 'court' : lun. 3 nov.).
   */
  function formaterDate(dateIso, style = 'long') {
    if (!dateIso) return '—';
    const d = new Date(dateIso.slice(0, 10) + 'T12:00:00Z');
    const options = style === 'court'
      ? { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }
      : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    return new Intl.DateTimeFormat('fr-FR', options).format(d);
  }

  /** Formate un horodatage ISO complet en date et heure de Nouvelle-Calédonie. */
  function formaterHorodatage(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }

  /** Formate un nombre à la française (espaces fines pour les milliers). */
  function formaterNombre(n) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(n);
  }

  /**
   * Piège le focus clavier dans un conteneur (fenêtre modale, menu mobile).
   * Paramètre : élément conteneur. Retour : fonction qui retire le piège.
   */
  function piegerFocus(conteneur) {
    const selecteur = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    function surTouche(e) {
      if (e.key !== 'Tab') return;
      const elements = [...conteneur.querySelectorAll(selecteur)].filter(el => el.offsetParent !== null);
      if (!elements.length) return;
      const premier = elements[0], dernier = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    }
    conteneur.addEventListener('keydown', surTouche);
    return () => conteneur.removeEventListener('keydown', surTouche);
  }

  /** Indique si l'utilisateur a demandé la réduction des animations. */
  function mouvementsReduits() {
    return racine.matchMedia && racine.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  Object.assign(Edysol, { esc, icone, stockage, aujourdhui, ajouterJours, lundiDe, formaterDate, formaterHorodatage, formaterNombre, piegerFocus, mouvementsReduits, FUSEAU });
})(window);
