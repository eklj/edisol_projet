/**
 * Simulation locale Édysol : illustre la reprise automatique des relevés.
 * Les données sont fictives, conservées en mémoire et perdues au rechargement.
 * Le choix d’un écran n’est PAS une authentification ; les droits réels sont à vérifier au serveur.
 */
(function () {
  'use strict';
  const M = window.EdysolMetier;
  const zone = document.createElement('section');
  zone.className = 'simulation';
  document.querySelector('#frame').after(zone);
  let sequence = 0;
  let historique = [];
  // Deux employés ont utilisé le véhicule : leurs compteurs ne sont pas additionnés.
  for (const entree of [
    {rapportId:'CR-DÉMO-041',employeId:'Agent B',compteur:123420,dateReleve:'2026-10-25T17:00:00+11:00',cleIdempotence:'EX1'},
    {rapportId:'CR-DÉMO-042',employeId:'Agent A',compteur:123450,dateReleve:'2026-10-26T18:00:00+11:00',cleIdempotence:'EX2'},
    {rapportId:'CR-DÉMO-040',employeId:'Agent C',compteur:123400,dateReleve:'2026-10-24T16:00:00+11:00',cleIdempotence:'EX3'},
  ]) historique = M.enregistrerReleve(historique, {...entree,vehiculeId:'V-DÉMO-01',auteur:entree.employeId,dateSaisie:'2026-10-27T10:00:00+11:00'});

  /** Crée un élément avec du texte sûr ; paramètres : balise, texte, parent. Retour : élément. */
  function element(balise, texte, parent) {
    const n = document.createElement(balise);
    if (texte !== null) n.textContent = texte;
    if (parent) parent.append(n);
    return n;
  }

  /** Crée un champ HTML ; paramètres : formulaire, libellé, type, nom. Retour : input. */
  function champ(formulaire, libelle, type, nom) {
    const label = element('label', libelle, formulaire);
    const input = document.createElement('input');
    input.type = type;
    input.name = nom;
    label.append(input);
    return input;
  }

  /**
   * Affiche la simulation correspondant à l’écran.
   * Paramètre : identifiant de vue. Retour : aucun ; met à jour la zone de démonstration.
   */
  function afficher(idEcran) {
    zone.replaceChildren();
    const compteRendu = idEcran === 'e-compterendu';
    const suivi = /^[gs]-(vehicules|releves)$/.test(idEcran);
    zone.hidden = !compteRendu && !suivi;
    if (zone.hidden) return;
    element('h2', 'Démonstration interactive · données fictives', zone);
    element('p', 'Simulation en mémoire, sans serveur ni authentification. Les relevés ne représentent pas des kilomètres parcourus.', zone);
    if (compteRendu) {
      const form = document.createElement('form');
      zone.append(form);
      const reference = champ(form, 'Compte rendu de démonstration', 'text', 'rapport');
      reference.value = 'CR-DÉMO-043';
      reference.required = true;
      const label = element('label', 'Véhicule de service', form);
      const vehicule = document.createElement('select');
      label.append(vehicule);
      for (const [value, texte] of [['','Aucun véhicule de service'],['V-DÉMO-01','V-DÉMO-01 · 000001 NC (fictif)'],['V-DÉMO-02','V-DÉMO-02 · 000002 NC (fictif)']]) {
        const option = element('option', texte, vehicule);
        option.value = value;
      }
      const compteur = champ(form, 'Kilométrage au compteur (km) — total', 'number', 'compteur');
      compteur.min = '0';
      compteur.step = 'any';
      const date = champ(form, 'Date et heure réelles du relevé (Nouvelle-Calédonie)', 'datetime-local', 'date');
      date.value = '2026-10-27T10:00';
      const message = element('p', '', form);
      message.setAttribute('role', 'status');
      /** Adapte les champs au véhicule choisi ; aucun paramètre ni valeur retournée. */
      function adapterVehicule() {
        const utilise = Boolean(vehicule.value);
        compteur.disabled = !utilise;
        compteur.required = utilise;
        date.disabled = !utilise;
        date.required = utilise;
        if (!utilise) compteur.value = '';
      }
      vehicule.addEventListener('change', adapterVehicule);
      adapterVehicule();
      const soumettre = element('button', 'Enregistrer dans la simulation', form);
      soumettre.type = 'submit';
      /** Enregistre un exemple ; paramètre : événement submit ; retour : aucun. */
      form.addEventListener('submit', function enregistrerSimulation(evenement) {
        // L’identité est fixe dans cet exemple ; en production elle provient exclusivement de la session serveur.
        evenement.preventDefault();
        try {
          const saisie = {rapportId:reference.value.trim(),employeId:'Agent A',vehiculeId:vehicule.value || null,
            compteur:vehicule.value ? compteur.value : null,dateReleve:vehicule.value ? date.value+':00+11:00' : null,
            dateSaisie:new Date().toISOString(),auteur:'Agent A',cleIdempotence:'DEMO-'+(++sequence)};
          historique = M.enregistrerReleve(historique,saisie);
          const etat = saisie.vehiculeId ? M.suiviVehicule(historique,saisie.vehiculeId) : null;
          message.textContent = etat ? 'Relevé repris automatiquement dans le suivi du véhicule. '+(etat.anomalies.length ? 'Attention : incohérence chronologique signalée.' : 'Aucune incohérence détectée.') : 'Compte rendu sans véhicule : aucun relevé créé dans cette simulation.';
        } catch (erreur) { message.textContent = erreur.message; }
      });
      element('p', 'Consultez ensuite Véhicules dans la maquette secrétaire ou cogérance pour observer le résultat.', zone);
    } else {
      for (const vehiculeId of ['V-DÉMO-01','V-DÉMO-02']) {
        const etat = M.suiviVehicule(historique,vehiculeId);
        element('h3', vehiculeId, zone);
        element('p', etat.ambigu ? 'Derniers relevés contradictoires : à examiner.' : etat.dernier ? 'Dernier compteur daté : '+etat.dernier.compteur+' km — '+etat.dernier.dateReleve : 'Aucun relevé.', zone);
        const table = document.createElement('table');
        zone.append(table);
        const entete = element('tr', null, table);
        for (const titre of ['Date réelle','Compteur total','Employé','Compte rendu source','Révision']) element('th',titre,entete);
        for (const r of etat.lignes) {
          const ligne = element('tr',null,table);
          for (const valeur of [r.dateReleve,r.compteur+' km',r.employeId,r.rapportId,String(r.revision)]) element('td',valeur,ligne);
        }
        for (const alerte of etat.anomalies) element('p', 'À examiner : '+alerte.type+' ('+alerte.ids.join(', ')+')', zone);
      }
      element('p','Les corrections append-only sont illustrées et testées dans reference/suivi_metier.js ; leurs permissions restent à définir.',zone);
    }
  }
  window.EdysolSimulation = {afficher};
})();
