/* =========================================================================
   ÉDYSOL NC — Dépôt de démonstration (simulation locale, SANS serveur)
   Rôle : conserver l'état fictif dans le navigateur (localStorage si
   disponible, sinon mémoire) et appliquer les règles métier de référence :
   - js/metier/suivi_metier.js (relevés, stocks, autorisations) ;
   - js/metier/organisation.js (binômes fixes, conflits signalés).
   Aucune notification réelle, aucun e-mail, aucun paiement, aucune
   publication : les « notifications » sont des lignes affichées dans les
   espaces internes de cette maquette.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};
  const CLE = 'edysol-maquette-demo-v1';
  let etat = null;

  /** Charge l'état (ou le crée) ; retour : objet d'état modifiable. */
  function charger() {
    if (etat) return etat;
    const sauve = Edysol.stockage.lire(CLE);
    etat = sauve && sauve.version === 1 ? sauve : Edysol.creerDonneesDemo();
    if (!sauve) sauver();
    return etat;
  }

  /** Enregistre l'état dans le navigateur et prévient les autres onglets/vues. */
  function sauver() {
    Edysol.stockage.ecrire(CLE, etat);
    document.dispatchEvent(new CustomEvent('edysol:donnees'));
  }

  /** Réinitialise toutes les données fictives. */
  function reinitialiser() {
    Edysol.stockage.supprimer(CLE);
    etat = Edysol.creerDonneesDemo();
    sauver();
  }

  /** Génère un identifiant unique de démonstration avec un préfixe. */
  function nouvelId(prefixe) {
    charger().sequence += 1;
    return `${prefixe}-${etat.sequence}`;
  }

  /** Ajoute une notification interne (simulation : aucun envoi externe). */
  function notifier(pour, titre, texte, lien = '') {
    charger().notifications.unshift({ id: nouvelId('N'), pour, titre, texte, date: new Date().toISOString(), lu: [], lien });
  }

  /** Ajoute une ligne à l'historique d'une commande. */
  function historiser(commande, texte) {
    commande.historique.push({ date: new Date().toISOString(), texte });
  }

  /**
   * Valide les données d'une demande de prestation (contrôle côté navigateur
   * uniquement : un serveur devra refaire ces contrôles).
   * Paramètre : données du formulaire. Retour : objet { champ: message } des erreurs.
   */
  function validerCommande(d) {
    const erreurs = {};
    if (!Edysol.prestationParId(d.prestation)) erreurs.prestation = 'Choisissez une prestation.';
    if (!d.nom || d.nom.trim().length < 2) erreurs.nom = 'Indiquez votre nom et prénom.';
    const chiffres = String(d.telephone || '').replace(/\D/g, '');
    if (chiffres.length < 6) erreurs.telephone = 'Indiquez un numéro de téléphone (6 chiffres au minimum).';
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) erreurs.email = 'Adresse e-mail invalide.';
    if (!d.commune) erreurs.commune = 'Choisissez la commune.';
    if (!d.adresse || d.adresse.trim().length < 5) erreurs.adresse = 'Indiquez l’adresse et les repères d’accès.';
    if (!d.description || d.description.trim().length < 10) erreurs.description = 'Décrivez votre besoin en quelques mots (10 caractères au minimum).';
    if (d.dateSouhaitee && d.dateSouhaitee < Edysol.aujourdhui()) erreurs.dateSouhaitee = 'La date souhaitée ne peut pas être passée.';
    if (!d.consentement) erreurs.consentement = 'Cochez cette case pour que la demande puisse être traitée.';
    return erreurs;
  }

  /**
   * Enregistre une demande de prestation (client sur le site ou secrétaire).
   * Paramètres : données validées, source ('client' | 'secretaire').
   * Retour : la commande créée (statut « à confirmer » : la date reste un souhait).
   */
  function creerCommande(d, source) {
    charger();
    etat.sequenceCommande += 1;
    const id = `EDY-2026-${String(etat.sequenceCommande).padStart(3, '0')}`;
    const commande = {
      id, statut: 'a-confirmer', prestation: d.prestation, commune: d.commune, creeLe: new Date().toISOString(), source,
      client: { nom: d.nom.trim(), telephone: d.telephone.trim(), email: (d.email || '').trim(), type: d.typeClient || 'Particulier' },
      adresse: d.adresse.trim(), acces: (d.acces || '').trim(), description: d.description.trim(),
      dateSouhaitee: d.dateSouhaitee || '', creneau: d.creneau || 'Indifférent', frequence: d.frequence || Edysol.FREQUENCES[0],
      historique: []
    };
    historiser(commande, source === 'secretaire' ? 'Commande saisie par la secrétaire (démonstration)' : 'Demande enregistrée depuis le site (démonstration)');
    historiser(commande, 'Information du secrétariat et des deux cogérants (simulée, aucun envoi)');
    etat.commandes.unshift(commande);
    notifier(['secretariat', 'cogerance'], `Nouvelle commande ${id}`, `Client : ${commande.client.nom} · à vérifier`, 'commande/' + id);
    sauver();
    return commande;
  }

  /** Enregistre une demande de rappel envoyée depuis la section Contact (simulation). */
  function demanderRappel(d) {
    charger().demandesRappel.unshift({ id: nouvelId('R'), ...d, date: new Date().toISOString() });
    notifier(['secretariat'], 'Demande de rappel', `${d.nom} · ${d.objet}`, 'notifications');
    sauver();
  }

  /**
   * Planifie une commande sur une équipe (binôme fixe, solo ou contrôleuse).
   * Paramètres : identifiant de commande, proposition { date, debut, fin, equipeId }, auteur.
   * Retour : { ok, erreurs, conflits, intervention }. En cas de conflit, rien n'est enregistré
   * tant que l'utilisateur n'a pas confirmé explicitement (accepterConflit).
   */
  function planifier(commandeId, proposition, auteur, accepterConflit = false) {
    charger();
    const commande = etat.commandes.find(c => c.id === commandeId);
    if (!commande) return { ok: false, erreurs: ['Commande introuvable.'], conflits: [] };
    const controle = racine.EdysolOrganisation.controlerAffectation(proposition, etat.equipes, etat.interventions);
    if (controle.erreurs.length || (controle.conflits.length && !accepterConflit)) return { ok: false, ...controle };
    const intervention = { id: nouvelId('INT'), commandeId, ...proposition, statut: 'planifiee' };
    etat.interventions.push(intervention);
    if (commande.statut === 'a-confirmer') commande.statut = 'planifiee';
    const equipe = etat.equipes.find(e => e.id === proposition.equipeId);
    historiser(commande, `Affectation proposée par ${auteur} : ${equipe.nom}, ${proposition.date} ${proposition.debut}-${proposition.fin} (validation à préciser)`);
    if (controle.conflits.length) historiser(commande, 'Conflit de créneau signalé et laissé à l’arbitrage (aucune réaffectation automatique)');
    notifier(['secretariat', 'cogerance'], `${commandeId} : affectation enregistrée`, `${equipe.nom} · ${Edysol.formaterDate(proposition.date, 'court')}`, 'commande/' + commandeId);
    notifier(equipe.membres.map(m => 'personne:' + m), 'Nouvelle intervention', `${commandeId} · ${Edysol.formaterDate(proposition.date, 'court')} ${proposition.debut}`, 'intervention/' + intervention.id);
    sauver();
    return { ok: true, erreurs: [], conflits: controle.conflits, intervention };
  }

  /** Signale le début d'une intervention (statut « en cours »). */
  function demarrerIntervention(interventionId, personneId) {
    charger();
    const i = etat.interventions.find(x => x.id === interventionId);
    if (!i) return;
    i.statut = 'en-cours';
    const commande = etat.commandes.find(c => c.id === i.commandeId);
    if (commande && commande.statut !== 'terminee') commande.statut = 'en-cours';
    historiser(commande, `Début d’intervention signalé par ${nomPersonne(personneId)}`);
    sauver();
  }

  /** Retourne le nom d'une personne fictive à partir de son identifiant. */
  function nomPersonne(id) { return charger().personnes.find(p => p.id === id)?.nom || id; }

  /**
   * Enregistre un compte rendu et, si un véhicule est utilisé, son relevé de compteur.
   * Le relevé est validé par EdysolMetier.enregistrerReleve (compteur TOTAL, date réelle avec fuseau).
   * Paramètres : saisie du formulaire, identifiant de la personne connectée (en production : issu de la session).
   * Retour : { ok, message, anomalies }.
   */
  function enregistrerCompteRendu(saisie, personneId) {
    charger();
    const intervention = etat.interventions.find(i => i.id === saisie.interventionId);
    if (!intervention) return { ok: false, message: 'Intervention introuvable.' };
    const rapportId = 'CR-DÉMO-' + intervention.commandeId.slice(-3) + '-' + personneId;
    if (etat.comptesRendus.some(c => c.id === rapportId)) return { ok: false, message: 'Un compte rendu existe déjà pour cette intervention : sa correction reste à définir.' };
    const nom = nomPersonne(personneId);
    try {
      etat.releves = racine.EdysolMetier.enregistrerReleve(etat.releves, {
        rapportId, employeId: nom, auteur: nom,
        vehiculeId: saisie.vehiculeId || null,
        compteur: saisie.vehiculeId ? saisie.compteur : null,
        dateReleve: saisie.vehiculeId ? saisie.dateReleve + ':00+11:00' : null,
        dateSaisie: new Date().toISOString(), cleIdempotence: 'CR-' + rapportId
      });
    } catch (erreur) { return { ok: false, message: erreur.message }; }

    etat.comptesRendus.unshift({ id: rapportId, interventionId: intervention.id, employeId: personneId, etat: saisie.etat, debut: saisie.debut, fin: saisie.fin,
      observations: saisie.observations, vehiculeId: saisie.vehiculeId || null, creeLe: new Date().toISOString() });
    const correspondance = { 'Terminée': 'terminee', 'En cours': 'en-cours', 'À reprogrammer': 'a-reprogrammer' };
    intervention.statut = correspondance[saisie.etat] || intervention.statut;
    const commande = etat.commandes.find(c => c.id === intervention.commandeId);
    // La commande n'est terminée que si toutes ses interventions le sont.
    const toutes = etat.interventions.filter(i => i.commandeId === commande.id);
    if (toutes.every(i => i.statut === 'terminee')) commande.statut = 'terminee';
    else if (saisie.etat === 'À reprogrammer') commande.statut = 'a-reprogrammer';
    else commande.statut = 'en-cours';
    historiser(commande, `Compte rendu ${rapportId} enregistré par ${nom} : ${saisie.etat}`);
    notifier(['secretariat', 'cogerance'], `${commande.id} : compte rendu`, `${nom} · ${saisie.etat}`, 'commande/' + commande.id);
    const anomalies = saisie.vehiculeId ? racine.EdysolMetier.suiviVehicule(etat.releves, saisie.vehiculeId).anomalies : [];
    sauver();
    return { ok: true, message: 'Compte rendu enregistré dans la simulation.', anomalies, rapportId };
  }

  /** Signale un besoin de renfort : AUCUNE sélection ni affectation automatique. */
  function signalerRenfort(commandeId, controleuseId, texte) {
    charger();
    etat.renforts.unshift({ id: nouvelId('RF'), commandeId, controleuseId, texte, date: new Date().toISOString(), etat: 'À examiner' });
    const commande = etat.commandes.find(c => c.id === commandeId);
    if (commande) historiser(commande, `Besoin de renfort signalé par ${nomPersonne(controleuseId)} (sélection et validation à définir)`);
    notifier(['secretariat', 'cogerance'], `Besoin de renfort · ${commandeId}`, `${nomPersonne(controleuseId)} : ${texte}`, 'commande/' + commandeId);
    sauver();
  }

  /** Construit l'acteur de démonstration (rôle + permissions simulées) pour la politique de référence. */
  function acteur(role) {
    charger();
    const permissions = Object.entries(etat.permissionsSimulees).filter(([, actif]) => actif).map(([p]) => p);
    return { role, permissions };
  }

  /** Active ou désactive une permission d'écriture simulée (démonstration uniquement). */
  function basculerPermission(permission, actif) {
    charger().permissionsSimulees[permission] = actif;
    sauver();
  }

  /**
   * Ajoute un mouvement de stock après contrôle de la permission simulée.
   * Paramètres : rôle courant, saisie { articleId, type, quantite, motif }. Retour : { ok, message }.
   */
  function ajouterMouvement(role, saisie) {
    charger();
    const M = racine.EdysolMetier;
    if (!M.autoriserComptabilite(acteur(role), 'stocks:ecrire')) return { ok: false, message: 'Permission « stocks:ecrire » non attribuée : saisie refusée (droits encore à définir).' };
    const article = etat.articles.find(a => a.id === saisie.articleId);
    try {
      let q = M.quantiteMilli(saisie.quantite);
      if (saisie.type !== 'AJUSTEMENT' && q <= 0) throw new Error('Entrées et sorties attendent une quantité positive.');
      etat.mouvements = M.mouvementStock(etat.mouvements, article, { id: nouvelId('M'), articleId: article.id, unite: article.unite, type: saisie.type,
        quantiteMilli: q, motif: saisie.motif, auteur: role === 'secretaire' ? 'Secrétaire (démo)' : 'Cogérant (démo)', date: new Date().toISOString().slice(0, 19) + 'Z' });
    } catch (erreur) { return { ok: false, message: erreur.message }; }
    sauver();
    const s = M.stockCourant(etat.mouvements, article.id);
    return { ok: true, message: `Mouvement enregistré. Stock : ${Edysol.formaterNombre(s.quantite)} ${article.unite}.` + (s.alerte ? ' Stock négatif à examiner.' : '') };
  }

  /**
   * Corrige un relevé kilométrique : nouvelle révision motivée, l'original est conservé.
   * Paramètres : rôle, relevé courant, nouveau compteur, motif. Retour : { ok, message }.
   */
  function corrigerReleve(role, releve, compteur, motif) {
    charger();
    const M = racine.EdysolMetier;
    if (!M.autoriserComptabilite(acteur(role), 'releves:corriger')) return { ok: false, message: 'Permission « releves:corriger » non attribuée : correction refusée (droits encore à définir).' };
    try {
      etat.releves = M.enregistrerReleve(etat.releves, {
        rapportId: releve.rapportId, employeId: releve.employeId, vehiculeId: releve.vehiculeId, compteur, dateReleve: releve.dateReleve,
        dateSaisie: new Date().toISOString().slice(0, 19) + 'Z', auteur: role === 'secretaire' ? 'Secrétaire (démo)' : 'Cogérant (démo)',
        cleIdempotence: nouvelId('COR'), corrigeReleveId: releve.releveId, revisionAttendue: releve.revision, motif
      });
    } catch (erreur) { return { ok: false, message: erreur.message }; }
    sauver();
    return { ok: true, message: 'Correction enregistrée : la valeur d’origine reste dans l’historique.' };
  }

  /** Marque une notification comme lue pour un destinataire. */
  function marquerLue(id, destinataire) {
    const n = charger().notifications.find(x => x.id === id);
    if (n && !n.lu.includes(destinataire)) { n.lu.push(destinataire); sauver(); }
  }

  Edysol.depotDemo = { charger, sauver, reinitialiser, validerCommande, creerCommande, demanderRappel, planifier, demarrerIntervention,
    enregistrerCompteRendu, signalerRenfort, acteur, basculerPermission, ajouterMouvement, corrigerReleve, marquerLue, nomPersonne, notifier };
})(window);
