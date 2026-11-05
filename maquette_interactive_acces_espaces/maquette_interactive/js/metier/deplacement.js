/* =========================================================================
   ÉDYSOL NC — Déplacement d'une intervention dans le planning (fonctions pures)
   Utilisé par le glisser-déposer ET par la fenêtre de modification au clavier :
   les deux passent par les mêmes contrôles. Testé avec Node
   (outils/tester_deplacement.js).
   Règles appliquées :
   - la DURÉE est conservée (seul le début est choisi, la fin est recalculée) ;
   - une équipe n'est jamais recomposée : on change d'équipe ENTIÈRE, et
     seulement vers une équipe du même type (binôme fixe vers binôme fixe,
     solo vers solo, contrôleuse vers contrôleuse). Passer d'un binôme à un
     solo serait un « passage en solo » : interdit sans règle validée ;
   - un chevauchement de personnes est BLOQUANT : il n'existe aucun moyen de
     le forcer, faute de règle validée ;
   - une intervention en cours ou terminée ne se déplace pas.
   Ce qui ne peut pas être contrôlé faute de données est signalé, pas deviné.
   ========================================================================= */
(function (racine) {
  'use strict';
  const O = (typeof module !== 'undefined' && module.exports) ? require('./organisation.js') : racine.EdysolOrganisation;

  /** Plage affichée par la grille de la maquette (paramètre d'affichage, pas une règle métier). */
  const PLAGE = { debut: '07:00', fin: '19:00' };
  /** Pas d'alignement proposés pour la grille (minutes). */
  const PAS = [15, 30, 60];

  /** « HH:MM » en minutes depuis minuit. */
  const minutes = h => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b; };
  /** Minutes depuis minuit en « HH:MM ». */
  const heure = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  /** Aligne une valeur en minutes sur le pas de grille le plus proche. */
  function aligner(valeur, pas) {
    return Math.round(valeur / pas) * pas;
  }

  /** Durée d'une intervention en minutes. */
  const duree = i => minutes(i.fin) - minutes(i.debut);

  /**
   * Calcule la nouvelle position en conservant la durée.
   * Paramètres : intervention, cible { date, debut ('HH:MM'), equipeId }.
   * Retour : { date, debut, fin, equipeId }.
   */
  function nouvellePosition(intervention, cible) {
    const debut = minutes(cible.debut);
    return { date: cible.date, debut: heure(debut), fin: heure(debut + duree(intervention)), equipeId: cible.equipeId || intervention.equipeId };
  }

  /**
   * Contrôle complet d'un déplacement.
   * Paramètres :
   *  - intervention : celle qui est déplacée ;
   *  - position : résultat de nouvellePosition ;
   *  - donnees : { equipes, interventions, aujourdhui (AAAA-MM-JJ), indisponibilites?, vehiculesParIntervention? }.
   * Retour : { bloquants, avertissements, impossibles, conflits }.
   *  - bloquants : le déplacement est refusé et l'intervention reste à sa place ;
   *  - avertissements : déplacement possible, point à connaître ;
   *  - impossibles : contrôles qui ne peuvent pas être faits faute de données.
   */
  function controlerDeplacement(intervention, position, donnees) {
    const bloquants = [], avertissements = [], impossibles = [];
    const source = donnees.equipes.find(e => e.id === intervention.equipeId);
    const cible = donnees.equipes.find(e => e.id === position.equipeId);

    // Droits de la personne (si fournis) : l'accès à l'outil ne donne pas le pouvoir de déplacer.
    if (donnees.droits) {
      if (!donnees.droits.deplacer) bloquants.push('Droit de déplacement non attribué à ce rôle (droits de la secrétaire à définir par la direction).');
      else if (position.equipeId !== intervention.equipeId && !donnees.droits.reaffecter) bloquants.push('Droit de réaffectation à une autre équipe non attribué à ce rôle (droits de la secrétaire à définir par la direction).');
    }
    if (intervention.statut !== 'planifiee') bloquants.push('Seule une intervention planifiée peut être déplacée (celle-ci est en cours ou terminée).');
    if (!cible) bloquants.push('Équipe de destination inconnue.');
    else if (source && cible.type !== source.type) {
      bloquants.push(source.type === 'binome'
        ? 'Un binôme fixe ne peut pas être remplacé par un employé seul : aucun passage en solo sans règle validée.'
        : `Changement de type d’équipe (${O.TYPES_EQUIPE[source.type]} vers ${O.TYPES_EQUIPE[cible.type]}) : règle non validée.`);
    }
    if (minutes(position.debut) < minutes(PLAGE.debut) || minutes(position.fin) > minutes(PLAGE.fin)) {
      bloquants.push(`Hors de la plage du planning (${PLAGE.debut} à ${PLAGE.fin}, paramètre de la maquette à confirmer).`);
    }
    if (minutes(position.fin) <= minutes(position.debut)) bloquants.push('Durée invalide.');

    // Chevauchements : toute personne de l'équipe cible déjà occupée sur un créneau qui se recoupe.
    let conflits = [];
    if (cible && !bloquants.length) {
      conflits = O.controlerAffectation(position, donnees.equipes, donnees.interventions, intervention.id).conflits;
      for (const c of conflits) {
        const eq = donnees.equipes.find(e => e.id === c.equipeId);
        bloquants.push(`Chevauchement avec ${c.commandeId} (${eq ? eq.nom : c.equipeId}, ${c.date} de ${c.debut} à ${c.fin}).`);
      }
    }

    if (intervention.creneauClient === 'confirme' && (position.date !== intervention.date || position.debut !== intervention.debut)) {
      avertissements.push('Ce créneau avait été confirmé au client. Autorisation et information du client : règles à définir. Aucun message ne lui est envoyé.');
    }
    if (donnees.aujourdhui && position.date < donnees.aujourdhui) avertissements.push('La nouvelle date est déjà passée.');

    // Contrôles sans données : on le dit au lieu de deviner.
    if (!donnees.indisponibilites) impossibles.push('Indisponibilités des personnes : aucune donnée dans la maquette.');
    if (!donnees.vehiculesParIntervention) impossibles.push('Véhicules : aucun véhicule n’est rattaché aux interventions.');
    impossibles.push('Temps de trajet entre chantiers : aucune donnée de distance ni de durée.');
    if (cible && cible.type === 'controleuse') impossibles.push('Missions de coordination de la contrôleuse : sans horaires, le chevauchement ne peut pas être vérifié.');

    return { bloquants, avertissements, impossibles, conflits };
  }

  /**
   * Droits sur le planning selon le rôle (politique de la maquette, à exécuter côté serveur en production).
   * - Accès à l'outil (consulter) : direction (cogérants) et secrétaire, confirmé le 05/11/2026.
   * - Pouvoir de déplacer ou de réaffecter : la direction le conserve.
   *   Pour la secrétaire, ces droits NE SONT PAS DÉFINIS : ils restent fermés,
   *   sauf permission explicite ('planning:deplacer', 'planning:reaffecter'),
   *   simulable dans la maquette. Rien n'est accordé automatiquement.
   * - Employés et contrôleuses : aucun accès au planning de gestion.
   * Paramètre : acteur { role, permissions }. Retour : { consulter, deplacer, reaffecter, droitsDefinis }.
   */
  function droitsPlanning(acteur) {
    const role = acteur && acteur.role;
    if (role === 'cogerant') return { consulter: true, deplacer: true, reaffecter: true, droitsDefinis: true };
    if (role === 'secretaire') {
      const p = (acteur.permissions || []);
      return { consulter: true, deplacer: p.includes('planning:deplacer'), reaffecter: p.includes('planning:reaffecter'), droitsDefinis: false };
    }
    return { consulter: false, deplacer: false, reaffecter: false, droitsDefinis: false };
  }

  /** Indique si deux positions sont identiques (aucun déplacement réel). */
  const memePosition = (a, b) => a.date === b.date && a.debut === b.debut && a.fin === b.fin && a.equipeId === b.equipeId;

  const api = { PLAGE, PAS, minutes, heure, aligner, duree, nouvellePosition, controlerDeplacement, memePosition, droitsPlanning };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.EdysolDeplacement = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
