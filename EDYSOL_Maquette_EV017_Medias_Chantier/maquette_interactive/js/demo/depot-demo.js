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
  // Nom de clé historique conservé (« v1 ») ; la version des données est contrôlée par VERSION.
  const CLE = 'edysol-maquette-demo-v1';
  let etat = null;

  // Version 3 : créneaux client, véhicules de la carte. (Version 2 : notifications par personne.)
  const VERSION = 3;

  /** Charge l'état (ou le crée) ; retour : objet d'état modifiable. */
  function charger() {
    if (etat) return etat;
    const sauve = Edysol.stockage.lire(CLE);
    const valide = sauve && sauve.version === VERSION;
    // Données absentes ou d'une ancienne version : on recrée les données fictives.
    etat = valide ? sauve : Edysol.creerDonneesDemo();
    if (!valide) sauver();
    return etat;
  }

  // Outil de démonstration : forcer l'échec du prochain enregistrement pour tester le retour arrière.
  let echecSimule = false;
  function simulerEchecEnregistrement(actif) { echecSimule = Boolean(actif); }

  /**
   * Enregistre l'état dans CE navigateur (localStorage) et prévient la page.
   * Retour : vrai si l'écriture a réussi. En cas d'échec (stockage plein, refusé
   * ou échec simulé), les données restent en mémoire : l'appelant décide du retour arrière.
   */
  function sauver(signalerEchec = true) {
    let ok;
    if (echecSimule) { echecSimule = false; ok = false; }
    else ok = Edysol.stockage.ecrire(CLE, etat);
    if (ok || signalerEchec) document.dispatchEvent(new CustomEvent('edysol:donnees', { detail: { externe: false } }));
    return ok;
  }

  /*
   * Synchronisation entre onglets du MÊME navigateur : l'événement « storage »
   * est émis quand un autre onglet modifie les données. Ce n'est pas une
   * synchronisation entre appareils : le localStorage reste propre à ce navigateur.
   */
  window.addEventListener('storage', e => {
    if (e.key !== CLE || !e.newValue) return;
    try {
      const recu = JSON.parse(e.newValue);
      if (recu.version !== VERSION) return;
      etat = recu;
      document.dispatchEvent(new CustomEvent('edysol:donnees', { detail: { externe: true } }));
    } catch (err) { /* contenu illisible : on garde l'état courant */ }
  });

  /** Réinitialise toutes les données fictives. */
  function reinitialiser() {
    // Supprime les pièces locales des demandes réinitialisées.
    for (const commande of charger().commandes) {
      if (commande.referenceMedias) Edysol.mediasDemo.supprimer(commande.referenceMedias).catch(console.error);
    }
    Edysol.stockage.supprimer(CLE);
    etat = Edysol.creerDonneesDemo();
    sauver();
  }

  /** Génère un identifiant unique de démonstration avec un préfixe. */
  function nouvelId(prefixe) {
    charger().sequence += 1;
    return `${prefixe}-${etat.sequence}`;
  }

  /**
   * Transforme des groupes en destinataires individuels.
   * 'secretariat' donne la ou les secrétaires, 'cogerance' donne CHACUN des deux cogérants.
   * Chaque personne obtient ainsi sa propre lecture. Les doublons sont retirés.
   */
  function resoudreDestinataires(pour) {
    const roles = { secretariat: 'secretaire', cogerance: 'cogerant' };
    const liste = pour.flatMap(d => roles[d]
      ? charger().personnes.filter(p => p.role === roles[d]).map(p => 'personne:' + p.id)
      : [d]);
    return [...new Set(liste)];
  }

  /**
   * Ajoute une notification interne (simulation : aucun envoi externe).
   * Elle est ajoutée à la fin du tableau : l'ordre d'affichage est calculé
   * par EdysolNotifications.boiteDe, jamais par la position dans le tableau.
   */
  function notifier(pour, titre, texte, lien = '') {
    const n = { id: nouvelId('N'), pour: resoudreDestinataires(pour), titre, texte, recueLe: new Date().toISOString(), lectures: {}, lien };
    charger().notifications.push(n);
    return n;
  }

  /** Boîte de réception triée d'un destinataire (lecture seule : aucun statut modifié). */
  function boite(destinataire) {
    return racine.EdysolNotifications.boiteDe(charger().notifications, destinataire);
  }

  /** Nombre de non lues d'un destinataire (lecture seule). */
  function nonLues(destinataire) {
    return racine.EdysolNotifications.compterNonLues(charger().notifications, destinataire);
  }

  /**
   * Enregistre la lecture d'UNE personne après ouverture réussie.
   * Paramètres : identifiant, destinataire, ouverture { type, chemin, contenuCharge }.
   * Retour : { ok, motif }. Ne modifie ni la commande, ni les affectations, ni aucune validation.
   */
  function enregistrerLecture(id, destinataire, ouverture) {
    const N = racine.EdysolNotifications;
    const liste = charger().notifications;
    const i = liste.findIndex(x => x.id === id);
    const n = liste[i];
    const controle = N.lecturePossible(n, destinataire, ouverture);
    if (!controle.ok) return controle;
    if (N.estLue(n, destinataire)) return { ok: true, motif: 'Déjà lue.' };
    liste[i] = N.avecLecture(n, destinataire, new Date().toISOString());
    sauver();
    return { ok: true, motif: '' };
  }

  /** Crée une notification fictive pour un seul destinataire (outil de démonstration). */
  function recevoirNotificationDemo(destinataire) {
    const n = notifier([destinataire], 'Message de démonstration', 'Notification fictive créée par le bouton de test de la maquette. Elle n’a pas de détail associé.', '');
    sauver();
    return n;
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
    // La prestation reste une valeur unique ; la multisélection n'est pas validée.
    if (typeof d.prestation !== 'string' || !Edysol.prestationParId(d.prestation)) erreurs.prestation = 'Choisissez une prestation.';
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
  function creerCommande(d, source, referenceMedias) {
    charger();
    const sequenceAvant = etat.sequence;
    etat.sequenceCommande += 1;
    const id = `EDY-2026-${String(etat.sequenceCommande).padStart(3, '0')}`;
    const commande = {
      id, statut: 'a-confirmer', prestation: d.prestation, commune: d.commune, creeLe: new Date().toISOString(), source,
      client: { nom: d.nom.trim(), telephone: d.telephone.trim(), email: (d.email || '').trim(), type: d.typeClient || 'Particulier' },
      adresse: d.adresse.trim(), acces: (d.acces || '').trim(), description: d.description.trim(),
      dateSouhaitee: d.dateSouhaitee || '', creneau: d.creneau || 'Indifférent', frequence: d.frequence || Edysol.FREQUENCES[0],
      historique: []
    };
    if (referenceMedias) commande.referenceMedias = referenceMedias;
    historiser(commande, source === 'secretaire' ? 'Commande saisie par la secrétaire (démonstration)' : 'Demande enregistrée depuis le site (démonstration)');
    historiser(commande, 'Information du secrétariat et des deux cogérants (simulée, aucun envoi)');
    etat.commandes.unshift(commande);
    notifier(['secretariat', 'cogerance'], `Nouvelle commande ${id}`, `Client : ${commande.client.nom} · à vérifier`, 'commande/' + id);
    // Avec des pièces jointes, il faut aussi conserver durablement le lien vers les fichiers.
    if (!sauver(!referenceMedias) && referenceMedias) {
      etat.commandes.shift();
      etat.notifications.pop();
      etat.sequence = sequenceAvant;
      etat.sequenceCommande -= 1;
      throw new Error('Enregistrement de la demande impossible.');
    }
    return commande;
  }

  /** Stocke les fichiers avant la demande et retire le lot si la demande échoue. */
  async function creerCommandeAvecMedias(d, fichiers) {
    if (!fichiers.length) return creerCommande(d, 'client');
    const reference = await Edysol.mediasDemo.enregistrer(fichiers);
    try {
      return creerCommande(d, 'client', reference);
    } catch (erreur) {
      await Edysol.mediasDemo.supprimer(reference);
      throw erreur;
    }
  }

  /** Cloisonnement de la démo selon la personne choisie et son lien avec le dossier. */
  async function lireMediasCommande(commandeId, personneId) {
    const s = charger();
    const personne = s.personnes.find(p => p.id === personneId);
    const commande = s.commandes.find(c => c.id === commandeId);
    if (!personne || !commande) throw new Error('Dossier inaccessible.');
    const bureau = ['cogerant', 'secretaire'].includes(personne.role);
    const coordination = personne.role === 'controleuse' && s.coordinations.some(
      c => c.commandeId === commandeId && c.controleuseId === personneId);
    const equipes = s.equipes.filter(e => e.membres.includes(personneId));
    const mission = s.interventions.some(i => i.commandeId === commandeId && equipes.some(e => e.id === i.equipeId));
    if (!bureau && !coordination && !mission) throw new Error('Dossier inaccessible.');
    if (!commande.referenceMedias) return [];
    const fichiers = await Edysol.mediasDemo.lire(commande.referenceMedias);
    if (!fichiers) throw new Error('Fichiers indisponibles.');
    return fichiers;
  }

  /** Enregistre une demande de rappel envoyée depuis la section Contact (simulation). */
  function demanderRappel(d) {
    charger().demandesRappel.unshift({ id: nouvelId('R'), ...d, date: new Date().toISOString() });
    notifier(['secretariat'], 'Demande de rappel', `${d.nom} (${d.telephone}) · ${d.objet}`, '');
    sauver();
  }

  /**
   * Planifie une commande sur une équipe (binôme fixe, solo ou contrôleuse).
   * Paramètres : identifiant de commande, proposition { date, debut, fin, equipeId }, auteur.
   * Retour : { ok, erreurs, conflits, intervention, notification }. En cas de conflit, rien n'est enregistré
   * tant que l'utilisateur n'a pas confirmé explicitement (accepterConflit).
   */
  function planifier(commandeId, proposition, auteur, accepterConflit = false) {
    charger();
    const commande = etat.commandes.find(c => c.id === commandeId);
    if (!commande) return { ok: false, erreurs: ['Commande introuvable.'], conflits: [] };
    const controle = racine.EdysolOrganisation.controlerAffectation(proposition, etat.equipes, etat.interventions);
    if (controle.erreurs.length || (controle.conflits.length && !accepterConflit)) return { ok: false, ...controle };
    // Garde les positions d’origine pour annuler toutes les écritures si la sauvegarde échoue.
    const { sequence, interventions, notifications } = etat;
    const { statut, historique } = commande;
    const nombreInterventions = interventions.length;
    const nombreNotifications = notifications.length;
    const tailleHistorique = historique.length;
    const intervention = { id: nouvelId('INT'), commandeId, ...proposition, statut: 'planifiee' };
    etat.interventions.push(intervention);
    if (commande.statut === 'a-confirmer') commande.statut = 'planifiee';
    const equipe = etat.equipes.find(e => e.id === proposition.equipeId);
    historiser(commande, `Affectation proposée par ${auteur} : ${equipe.nom}, ${proposition.date} ${proposition.debut}-${proposition.fin} (validation à préciser)`);
    if (controle.conflits.length) historiser(commande, 'Conflit de créneau signalé et laissé à l’arbitrage (aucune réaffectation automatique)');
    const notification = notifier(['secretariat', 'cogerance'], `Affectation enregistrée pour ${commandeId}`, `${equipe.nom} · ${Edysol.formaterDate(proposition.date, 'court')}`, 'commande/' + commandeId);
    notifier(equipe.membres.map(m => 'personne:' + m), 'Nouvelle intervention', `${commandeId} · ${Edysol.formaterDate(proposition.date, 'court')} ${proposition.debut}`, 'intervention/' + intervention.id);
    // N’avertit les vues qu’après écriture, sans leur exposer l’état provisoire.
    if (!sauver(false)) {
      interventions.length = nombreInterventions;
      notifications.length = nombreNotifications;
      historique.length = tailleHistorique;
      commande.statut = statut;
      etat.sequence = sequence;
      return { ok: false, erreurs: ['L’affectation n’a pas pu être enregistrée. Réessayez.'], conflits: [] };
    }
    return { ok: true, erreurs: [], conflits: controle.conflits, intervention, notification };
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

  /* ---------- Déplacement d'une intervention (glisser-déposer ou fenêtre clavier) ---------- */

  /** Copie des champs modifiables d'une intervention (pour annuler ou revenir en arrière). */
  const instantane = i => ({ date: i.date, debut: i.debut, fin: i.fin, equipeId: i.equipeId, creneauClient: i.creneauClient });

  /**
   * Déplace une intervention après contrôle (js/metier/deplacement.js).
   * Paramètres : identifiant, cible { date, debut, equipeId }, auteur (nom affiché).
   * Retour : { ok, bloquants, avertissements, impossibles, position, jeton, erreurEnregistrement }.
   * - bloquant : rien n'est modifié, l'intervention reste à sa place ;
   * - échec d'enregistrement : la position précédente est rétablie ;
   * - jeton : permet « Annuler le déplacement ».
   */
  function deplacerIntervention(id, cible, auteur, role) {
    charger();
    const R = racine.EdysolDeplacement;
    // Droits vérifiés ici aussi (pas seulement dans l'interface) : rôle issu du sélecteur de démo.
    const droits = R.droitsPlanning(acteur(role));
    const i = etat.interventions.find(x => x.id === id);
    if (!i) return { ok: false, bloquants: ['Intervention introuvable.'], avertissements: [], impossibles: [] };
    const position = R.nouvellePosition(i, cible);
    if (R.memePosition(position, i)) return { ok: false, inchange: true, bloquants: [], avertissements: [], impossibles: [], position };
    const controle = R.controlerDeplacement(i, position, { equipes: etat.equipes, interventions: etat.interventions, aujourdhui: Edysol.aujourdhui(), droits });
    if (controle.bloquants.length) return { ok: false, ...controle, position };

    const avant = instantane(i);
    const commande = etat.commandes.find(c => c.id === i.commandeId);
    const historiqueAvant = commande ? commande.historique.length : 0;
    const nbNotifs = etat.notifications.length;
    Object.assign(i, position);
    if (avant.creneauClient === 'confirme' && (avant.date !== position.date || avant.debut !== position.debut)) i.creneauClient = 'a-reconfirmer';
    const eqAvant = etat.equipes.find(e => e.id === avant.equipeId), eqApres = etat.equipes.find(e => e.id === position.equipeId);
    if (commande) historiser(commande, `Intervention ${i.id} déplacée par ${auteur} : ${avant.date} ${avant.debut}-${avant.fin} (${eqAvant.nom}) vers ${position.date} ${position.debut}-${position.fin} (${eqApres.nom}). Planning interne.`);
    // Information interne des personnes concernées (simulée : aucun envoi externe).
    notifier([...new Set([...eqAvant.membres, ...eqApres.membres])].map(m => 'personne:' + m), 'Intervention déplacée',
      `${i.commandeId} : ${Edysol.formaterDate(position.date, 'court')} ${position.debut}-${position.fin} · ${eqApres.nom}`, 'intervention/' + i.id);

    if (!sauver()) {
      // Retour arrière complet : position, historique et notifications d'avant.
      Object.assign(i, avant);
      if (commande) commande.historique.length = historiqueAvant;
      etat.notifications.length = nbNotifs;
      document.dispatchEvent(new CustomEvent('edysol:donnees', { detail: { externe: false } }));
      return { ok: false, erreurEnregistrement: true, bloquants: ['L’enregistrement a échoué : l’intervention a été remise à sa position précédente.'], avertissements: [], impossibles: controle.impossibles, position };
    }
    return { ok: true, ...controle, position, jeton: { id: i.id, avant, apres: instantane(i) } };
  }

  /**
   * Annule un déplacement réussi, si l'intervention n'a pas changé depuis.
   * Le retour est lui aussi contrôlé : si l'ancien créneau est désormais pris, l'annulation est refusée.
   */
  function annulerDeplacement(jeton, auteur, role) {
    charger();
    const R = racine.EdysolDeplacement;
    const droits = R.droitsPlanning(acteur(role));
    const i = etat.interventions.find(x => x.id === jeton.id);
    if (!i || JSON.stringify(instantane(i)) !== JSON.stringify(jeton.apres)) return { ok: false, bloquants: ['L’intervention a changé depuis : annulation impossible.'] };
    const controle = R.controlerDeplacement(i, jeton.avant, { equipes: etat.equipes, interventions: etat.interventions, aujourdhui: Edysol.aujourdhui(), droits });
    if (controle.bloquants.length) return { ok: false, bloquants: controle.bloquants };
    const apres = instantane(i);
    Object.assign(i, jeton.avant);
    const commande = etat.commandes.find(c => c.id === i.commandeId);
    if (commande) historiser(commande, `Déplacement de ${i.id} annulé par ${auteur} : retour à ${i.date} ${i.debut}-${i.fin}.`);
    if (!sauver()) { Object.assign(i, apres); if (commande) commande.historique.pop(); return { ok: false, bloquants: ['L’enregistrement de l’annulation a échoué.'] }; }
    return { ok: true, bloquants: [] };
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

  Edysol.depotDemo = { charger, sauver, reinitialiser, validerCommande, creerCommande, creerCommandeAvecMedias, lireMediasCommande, demanderRappel, planifier, demarrerIntervention,
    enregistrerCompteRendu, signalerRenfort, acteur, basculerPermission, ajouterMouvement, corrigerReleve, nomPersonne, notifier,
    boite, nonLues, enregistrerLecture, recevoirNotificationDemo, resoudreDestinataires,
    deplacerIntervention, annulerDeplacement, simulerEchecEnregistrement };
})(window);
