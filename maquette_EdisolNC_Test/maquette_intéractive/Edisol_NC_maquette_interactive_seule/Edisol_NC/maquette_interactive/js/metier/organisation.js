/* =========================================================================
   ÉDYSOL NC — Règles d'organisation des équipes (référence de maquette)
   Règles métier confirmées (README, CORRECTION_ORGANISATION.md, 28/10/2026) :
   - quatre binômes FIXES : leurs deux membres sont toujours affectés ensemble ;
   - les autres employés travaillent seuls sur leurs chantiers ;
   - deux contrôleuses, également employées de ménage, encadrent les équipes
     sous les ordres de la secrétaire et des cogérants ;
   - AUCUN remplacement automatique ni passage automatique en solo :
     ce module signale les conflits, il ne les résout jamais.
   Les règles d'absence, de renfort et de validation restent à définir.
   Fonctions pures, testables avec Node (outils/tester_organisation.js).
   ========================================================================= */
(function (racine) {
  'use strict';

  /** Types d'équipe autorisés pour une affectation de ménage. */
  const TYPES_EQUIPE = {
    binome: 'Binôme fixe',
    solo: 'Employé solo',
    controleuse: 'Contrôleuse (prestation de ménage)'
  };

  /**
   * Vérifie la cohérence de la composition des équipes.
   * Paramètre : liste d'équipes { id, type, membres }. Retour : liste de messages d'erreur (vide si conforme).
   * Contrôles : 4 binômes de 2 personnes, solos à 1 personne, aucune personne dans deux équipes de ménage.
   */
  function verifierComposition(equipes) {
    const erreurs = [];
    const binomes = equipes.filter(e => e.type === 'binome');
    if (binomes.length !== 4) erreurs.push(`Quatre binômes fixes attendus, ${binomes.length} trouvé(s).`);
    for (const e of equipes) {
      if (!TYPES_EQUIPE[e.type]) erreurs.push(`Type d'équipe inconnu : ${e.type}.`);
      if (e.type === 'binome' && e.membres.length !== 2) erreurs.push(`${e.nom} doit compter exactement deux membres.`);
      if ((e.type === 'solo' || e.type === 'controleuse') && e.membres.length !== 1) erreurs.push(`${e.nom} doit compter une seule personne.`);
    }
    const vus = new Map();
    for (const e of equipes) for (const m of e.membres) {
      if (vus.has(m)) erreurs.push(`La personne ${m} figure dans ${vus.get(m)} et ${e.nom}.`);
      else vus.set(m, e.nom);
    }
    return erreurs;
  }

  /** Convertit « HH:MM » en minutes depuis minuit. */
  function minutes(heure) {
    const [h, m] = String(heure).split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Contrôle une proposition d'affectation avant enregistrement.
   * Paramètres : proposition { date, debut, fin, equipeId }, équipes, interventions existantes, identifiant à ignorer.
   * Retour : { erreurs, conflits } — les conflits sont SIGNALÉS pour arbitrage humain, jamais résolus.
   */
  function controlerAffectation(proposition, equipes, interventions, ignorerId = null) {
    const erreurs = [];
    const equipe = equipes.find(e => e.id === proposition.equipeId);
    if (!equipe) erreurs.push('Équipe à choisir.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(proposition.date || '')) erreurs.push('Date confirmée à renseigner.');
    if (!/^\d{2}:\d{2}$/.test(proposition.debut || '') || !/^\d{2}:\d{2}$/.test(proposition.fin || '')) erreurs.push('Heures de début et de fin à renseigner.');
    else if (minutes(proposition.fin) <= minutes(proposition.debut)) erreurs.push('L’heure de fin doit suivre l’heure de début.');
    if (erreurs.length) return { erreurs, conflits: [] };

    // Un conflit existe si une même personne est déjà affectée sur un créneau qui se chevauche.
    const membres = new Set(equipe.membres);
    const conflits = interventions.filter(i => i.id !== ignorerId && i.date === proposition.date
      && minutes(i.debut) < minutes(proposition.fin) && minutes(proposition.debut) < minutes(i.fin)
      && (equipes.find(e => e.id === i.equipeId)?.membres || []).some(m => membres.has(m)));
    return { erreurs, conflits };
  }

  /**
   * Retourne les équipes de ménage d'une personne (binôme fixe, solo ou contrôleuse).
   * Paramètres : identifiant de la personne, équipes. Retour : tableau d'équipes.
   */
  function equipesDe(personneId, equipes) {
    return equipes.filter(e => e.membres.includes(personneId));
  }

  /**
   * Décrit l'organisation d'une équipe pour l'employé (avec qui il travaille).
   * Paramètres : équipe, personne consultante, annuaire des personnes. Retour : texte lisible.
   */
  function decrireOrganisation(equipe, personneId, personnes) {
    if (!equipe) return 'Équipe à confirmer';
    const nom = id => personnes.find(p => p.id === id)?.nom || id;
    if (equipe.type === 'binome') {
      const partenaire = equipe.membres.find(m => m !== personneId);
      return personneId && equipe.membres.includes(personneId) ? `${equipe.nom} · avec ${nom(partenaire)}` : `${equipe.nom} · ${equipe.membres.map(nom).join(' + ')}`;
    }
    if (equipe.type === 'controleuse') return `${nom(equipe.membres[0])} · prestation de ménage`;
    return `${nom(equipe.membres[0])} · solo`;
  }

  /**
   * Règles volontairement NON implémentées : elles attendent une décision de l'entreprise.
   * La maquette affiche ces textes au lieu d'inventer un comportement automatique.
   */
  const REGLES_EN_ATTENTE = [
    'Absence d’un membre d’un binôme fixe : procédure à définir.',
    'Sélection des renforts : responsable et critères à définir.',
    'Validation des changements d’affectation : à définir.',
    'Rattachement habituel des contrôleuses aux équipes : à préciser.'
  ];

  const api = { TYPES_EQUIPE, verifierComposition, controlerAffectation, equipesDe, decrireOrganisation, minutes, REGLES_EN_ATTENTE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.EdysolOrganisation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
