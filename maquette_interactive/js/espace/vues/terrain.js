/* =========================================================================
   ÉDYSOL NC — Vues « terrain » (mobile) : employés et contrôleuses
   Même environnement pour tous ; le contenu se limite aux interventions
   affectées à la personne (via son binôme fixe, son poste solo ou ses
   prestations de ménage de contrôleuse).
   Compte rendu : état, horaires, observations et rubrique véhicule.
   Le kilométrage saisi est le TOTAL affiché au compteur (jamais une
   distance) ; il alimente le suivi des véhicules sans nouvelle saisie.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const O = racine.EdysolOrganisation;
  const vues = E.vues = E.vues || {};

  const D = () => E.donneesVues;
  /** Interventions de ménage de la personne (toutes équipes dont elle est membre). */
  function mesInterventions(personneId) {
    const s = D().etat();
    const equipes = O.equipesDe(personneId, s.equipes).map(e => e.id);
    return s.interventions.filter(i => equipes.includes(i.equipeId)).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut));
  }

  /** Carte d'une intervention dans la liste « Mes missions ». */
  function carteMission(i, ctx) {
    const s = D().etat();
    const c = s.commandes.find(x => x.id === i.commandeId);
    const eq = D().equipe(i.equipeId);
    const cr = s.comptesRendus.find(x => x.interventionId === i.id && x.employeId === ctx.personne.id);
    return `<li><a class="mission tuile-${eq.type === 'binome' ? 1 : 2}" href="${ctx.lien('intervention/' + i.id)}">
        <span class="mission__haut"><strong>${esc(i.commandeId)}</strong>${ui.badgeStatut(i.statut)}</span>
        <span class="mission__heure">${icone('horloge')}${esc(E.formaterDate(i.date, 'court'))} · ${esc(i.debut)} à ${esc(i.fin)}</span>
        <span class="mission__lieu">${icone('lieu')}${esc(c?.commune || '')} · ${esc(D().prestation(c?.prestation))}</span>
        <span class="mission__equipe">${icone(eq.type === 'binome' ? 'equipe' : 'utilisateur')}${esc(O.decrireOrganisation(eq, ctx.personne.id, s.personnes))}</span>
        ${cr ? `<span class="mission__cr">${icone('valide')}Compte rendu envoyé</span>` : ''}
      </a></li>`;
  }

  /* ---------- Mes interventions (employé) / Mes prestations (contrôleuse) ---------- */
  vues.interventions = ctx => {
    const toutes = mesInterventions(ctx.personne.id);
    const jour = E.aujourdhui();
    const groupes = [
      ['Aujourd’hui', toutes.filter(i => i.date === jour)],
      ['À venir', toutes.filter(i => i.date > jour)],
      ['Passées (7 derniers jours)', toutes.filter(i => i.date < jour && i.date >= E.ajouterJours(jour, -7))]
    ];
    const titre = ctx.espace === 'controleuse' ? 'Mes prestations' : 'Mes interventions';
    return {
      titre,
      html: `${ui.entetePage({ titre, sousTitre: `${esc(ctx.personne.nom)} · ${toutes.length} intervention${toutes.length > 1 ? 's' : ''} affectée${toutes.length > 1 ? 's' : ''}` })}
        ${groupes.map(([t, liste]) => `<section class="groupe-missions"><h2 class="sous-titre-section">${esc(t)}</h2>
          ${liste.length ? `<ul class="missions">${liste.map(i => carteMission(i, ctx)).join('')}</ul>` : '<p class="vide">Aucune intervention.</p>'}</section>`).join('')}
        ${ui.notice('Un changement ? Il apparaît dans vos notifications. Les absences et remplacements ne sont jamais gérés automatiquement.', 'info')}`
    };
  };

  /* ---------- Détail d'une intervention ---------- */
  vues.intervention = ctx => {
    const s = D().etat();
    const i = s.interventions.find(x => x.id === ctx.param);
    const retour = { href: ctx.lien('interventions'), texte: 'Mes missions' };
    if (!i || !mesInterventions(ctx.personne.id).some(x => x.id === i.id)) {
      // Cloisonnement de démonstration : une personne ne consulte que ses propres interventions.
      return { titre: 'Intervention non affectée', html: ui.entetePage({ titre: 'Intervention non affectée', retour }) + ui.notice('Cette intervention n’est pas affectée à la personne choisie. (En production, le serveur devra refuser cet accès.)', 'alerte', 'bouclier') };
    }
    const c = s.commandes.find(x => x.id === i.commandeId);
    const eq = D().equipe(i.equipeId);
    const cr = s.comptesRendus.find(x => x.interventionId === i.id && x.employeId === ctx.personne.id);
    return {
      titre: i.commandeId,
      html: `${ui.entetePage({ titre: eq.type === 'solo' ? 'Intervention en solo' : 'Détail de l’intervention', retour, sousTitre: `${esc(i.commandeId)} · ${ui.badgeStatut(i.statut)}` })}
        <div class="fiche-mission">
          <p class="fiche-mission__quand">${icone('calendrier')}<span><strong>${esc(E.formaterDate(i.date))}</strong><br>${esc(i.debut)} à ${esc(i.fin)}</span></p>
          ${ui.definitions([
            ['Client', esc(c.client.nom)], ['Lieu', `${esc(c.commune)} · ${esc(c.adresse)}`], ['Prestation', esc(D().prestation(c.prestation))],
            ['Organisation', `<strong>${esc(O.decrireOrganisation(eq, ctx.personne.id, s.personnes))}</strong>`]
          ], true)}
        </div>
        <section class="consigne"><h2>${icone('info')}Consignes</h2><p>${esc(c.acces || 'Aucune consigne d’accès.')}</p><p>${esc(c.description)}</p><p class="aide-bloc">Accès à vérifier avec le secrétariat en cas de doute.</p></section>
        <div class="actions-mission">
          ${i.statut === 'planifiee' ? `<button type="button" class="bouton bouton--bleu" data-demarrer>${icone('lecture')}Signaler le début</button>` : ''}
          ${cr ? ui.notice(`Compte rendu ${esc(cr.id)} enregistré (${esc(cr.etat)}).`, 'succes', 'valide')
            : `<a class="bouton bouton--principal" href="${ctx.lien('compte-rendu/' + i.id)}">${icone('crayon')}Rédiger le compte rendu</a>`}
        </div>`,
      apres(vue) {
        vue.querySelector('[data-demarrer]')?.addEventListener('click', () => {
          E.api.demarrerIntervention(i.id, ctx.personne.id);
          ctx.rafraichir();
          document.querySelector('#vue .actions-mission').insertAdjacentHTML('afterbegin', ui.notice('Début signalé dans la simulation (heure du navigateur).', 'succes', 'valide'));
        });
      }
    };
  };

  /** Date et heure actuelles en Nouvelle-Calédonie au format AAAA-MM-JJTHH:MM (champ datetime-local). */
  function maintenantNC() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('fr-FR', { timeZone: E.FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }

  /* ---------- Compte rendu avec rubrique véhicule ---------- */
  vues['compte-rendu'] = ctx => {
    const s = D().etat();
    const i = s.interventions.find(x => x.id === ctx.param);
    if (!i || !mesInterventions(ctx.personne.id).some(x => x.id === i.id)) return vues.intervention(ctx);
    const rapport = 'CR-DÉMO-' + i.commandeId.slice(-3) + '-' + ctx.personne.id;
    return {
      titre: 'Compte rendu',
      html: `${ui.entetePage({ titre: 'Compte rendu', retour: { href: ctx.lien('intervention/' + i.id), texte: i.commandeId }, sousTitre: `${esc(i.commandeId)} · ${esc(rapport)} · ${esc(ctx.personne.nom)}` })}
        <form class="formulaire-terrain" id="form-cr" novalidate>
          <fieldset class="groupe-choix"><legend class="libelle">État de l’intervention</legend>
            <div class="segments">${['Terminée', 'En cours', 'À reprogrammer'].map((t, k) => `<label class="segment"><input type="radio" name="etat" value="${t}" ${k === 0 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
          </fieldset>
          <div class="grille-champs grille-champs--2">
            <div class="champ"><label for="cr-debut">Début</label><input id="cr-debut" name="debut" type="time" value="${esc(i.debut)}"></div>
            <div class="champ"><label for="cr-fin">Fin</label><input id="cr-fin" name="fin" type="time" value="${esc(i.fin)}"></div>
          </div>
          <div class="champ"><label for="cr-obs">Observations</label><textarea id="cr-obs" name="observations" rows="4" placeholder="Travail effectué, suivi nécessaire…"></textarea></div>
          <fieldset class="bloc-vehicule">
            <legend>${icone('vehicule')}Véhicule de service</legend>
            <div class="champ"><label for="cr-vehicule">Véhicule utilisé</label>
              <select id="cr-vehicule" name="vehicule"><option value="">Aucun véhicule de service</option>${s.vehicules.map(v => `<option value="${esc(v.id)}">${esc(v.libelle)}</option>`).join('')}</select></div>
            <div class="champ"><label for="cr-compteur">Kilométrage au compteur (km)</label>
              <input id="cr-compteur" name="compteur" type="number" min="0" step="1" inputmode="numeric" aria-describedby="cr-compteur-aide">
              <p class="aide" id="cr-compteur-aide"><strong>Total affiché au compteur</strong>, pas la distance de la mission.</p></div>
            <div class="champ"><label for="cr-date">Date et heure réelles du relevé</label>
              <input id="cr-date" name="dateReleve" type="datetime-local" value="${esc(maintenantNC())}">
              <p class="aide">Heure de Nouvelle-Calédonie.</p></div>
            <p class="aide" id="cr-sans-vehicule">Sans véhicule : aucun relevé n’est créé.</p>
          </fieldset>
          <div id="cr-retour" role="alert"></div>
          <button type="submit" class="bouton bouton--principal bouton--plein">${icone('valide')}Enregistrer le compte rendu (simulation)</button>
        </form>`,
      apres(vue) {
        const form = vue.querySelector('#form-cr');
        const vehicule = form.elements.vehicule, compteur = form.elements.compteur, date = form.elements.dateReleve;
        /** Active les champs de relevé seulement si un véhicule est choisi (pas de compteur résiduel). */
        function adapter() {
          const utilise = Boolean(vehicule.value);
          compteur.disabled = date.disabled = !utilise;
          compteur.required = date.required = utilise;
          if (!utilise) compteur.value = '';
          vue.querySelector('#cr-sans-vehicule').hidden = utilise;
        }
        vehicule.addEventListener('change', adapter);
        adapter();
        form.addEventListener('submit', e => {
          e.preventDefault();
          const d = { interventionId: i.id, etat: form.querySelector('[name=etat]:checked').value, debut: form.elements.debut.value, fin: form.elements.fin.value,
            observations: form.elements.observations.value.trim(), vehiculeId: vehicule.value || null, compteur: compteur.value, dateReleve: date.value };
          const zone = vue.querySelector('#cr-retour');
          if (d.vehiculeId && !d.compteur) { zone.innerHTML = ui.notice('Indiquez le kilométrage total affiché au compteur.', 'erreur', 'alerte'); compteur.focus(); return; }
          const r = E.api.enregistrerCompteRendu(d, ctx.personne.id);
          if (!r.ok) { zone.innerHTML = ui.notice(esc(r.message), 'erreur', 'alerte'); return; }
          const alerte = r.anomalies.length ? ui.notice('Relevé enregistré, mais une incohérence chronologique est signalée au secrétariat (compteur à vérifier).', 'alerte', 'alerte') : '';
          vue.innerHTML = `${ui.entetePage({ titre: 'Compte rendu enregistré', retour: { href: ctx.lien('interventions'), texte: 'Mes missions' } })}
            ${ui.notice(`${esc(r.message)} ${d.vehiculeId ? 'Le relevé est repris automatiquement dans le suivi du véhicule.' : 'Aucun véhicule : aucun relevé créé.'} Le secrétariat et les cogérants le voient dans leur espace.`, 'succes', 'valide')}
            ${alerte}
            <a class="bouton bouton--bleu" href="${ctx.lien('interventions')}">Retour à mes missions</a>`;
          vue.querySelector('h1').focus();
        });
      }
    };
  };

  /* ---------- Contrôleuses : activités ---------- */
  vues.activites = ctx => {
    const s = D().etat();
    const prestations = mesInterventions(ctx.personne.id).filter(i => i.date >= E.aujourdhui());
    const coords = s.coordinations.filter(c => c.controleuseId === ctx.personne.id);
    return {
      titre: 'Mes activités',
      html: `${ui.entetePage({ titre: 'Mes activités', sousTitre: `${esc(ctx.personne.nom)} · employée de ménage et contrôleuse` })}
        <div class="deux-fonctions">
          <section class="fonction fonction--menage tuile-1">
            <h2>${icone('balai')}Mes prestations de ménage</h2>
            ${prestations.length ? `<ul class="missions">${prestations.map(i => carteMission(i, ctx)).join('')}</ul>` : '<p class="vide">Aucune prestation de ménage à venir.</p>'}
            <p class="aide-bloc">Disponibilité à vérifier dans le planning avant toute intervention.</p>
          </section>
          <section class="fonction fonction--coordination tuile-2">
            <h2>${icone('bouclier')}Coordination des équipes</h2>
            <p>Sous les ordres de la secrétaire et des cogérants. Coordination sur les gros chantiers avec renfort.</p>
            ${coords.length ? `<ul class="liste-simple">${coords.map(co => `<li><a class="lien-simple" href="${ctx.lien('coordination/' + co.commandeId)}">${esc(co.commandeId)} · ${esc(E.formaterDate(co.date, 'court'))}</a><small class="sous-ligne">${esc(co.note)}</small></li>`).join('')}</ul>` : '<p class="vide">Aucune coordination prévue.</p>'}
          </section>
        </div>
        ${ui.notice('Coordonner un chantier ne signifie pas être disponible pour y faire du ménage : ce sont deux fonctions distinctes.', 'info')}`
    };
  };

  /* ---------- Contrôleuses : coordination d'un chantier ---------- */
  vues.coordination = ctx => {
    const s = D().etat();
    const coords = s.coordinations.filter(c => c.controleuseId === ctx.personne.id);
    const commandeId = ctx.param || coords[0]?.commandeId;
    const c = s.commandes.find(x => x.id === commandeId);
    if (!c) return { titre: 'Coordination', html: ui.entetePage({ titre: 'Coordination chantier' }) + '<p class="vide">Aucun chantier à coordonner pour cette personne.</p>' };
    const ints = D().interventionsDe(c.id);
    const renforts = s.renforts.filter(r => r.commandeId === c.id);
    return {
      titre: 'Coordination',
      html: `${ui.entetePage({ titre: 'Coordination chantier', retour: { href: ctx.lien('activites'), texte: 'Mes activités' }, sousTitre: `${esc(c.id)} · ${esc(c.commune)} · ${esc(D().prestation(c.prestation))}` })}
        ${coords.length > 1 ? `<div class="barre-filtres"><div class="champ"><label for="choix-chantier">Chantier</label><select id="choix-chantier">${coords.map(co => `<option ${co.commandeId === c.id ? 'selected' : ''}>${esc(co.commandeId)}</option>`).join('')}</select></div></div>` : ''}
        ${ui.bloc('Équipes prévues', ints.length ? `<ul class="liste-simple">${ints.map(i => `<li><strong>${esc(D().libelleEquipe(i.equipeId))}</strong><small class="sous-ligne">${esc(E.formaterDate(i.date, 'court'))} · ${esc(i.debut)} à ${esc(i.fin)}</small></li>`).join('')}</ul>` : '<p class="vide">Équipes à renseigner.</p>')}
        <form class="bloc bloc--formulaire" id="form-renfort" novalidate>
          <h2 class="bloc__titre">Besoin de renfort</h2>
          <p class="aide-bloc">Le signalement informe la secrétaire et les cogérants. Il ne sélectionne et n’affecte personne.</p>
          <div class="champ"><label for="renfort-texte">Décrire le besoin</label><textarea id="renfort-texte" name="texte" rows="3" placeholder="Ex. surface plus grande que prévu, une équipe supplémentaire serait utile."></textarea></div>
          <button type="submit" class="bouton bouton--bleu bouton--plein">Signaler le besoin (simulation)</button>
          <div id="renfort-retour" role="status"></div>
        </form>
        ${renforts.length ? ui.bloc('Signalements', `<ul class="liste-simple">${renforts.map(r => `<li>${esc(r.texte)}<small class="sous-ligne">${esc(E.formaterHorodatage(r.date))} · ${esc(r.etat)}</small></li>`).join('')}</ul>`) : ''}
        ${ui.bloc('Règles restant à définir', `<ul class="liste-regles">${O.REGLES_EN_ATTENTE.slice(0, 3).map(r => `<li>${ui.aDefinir(r)}</li>`).join('')}</ul>`)}`,
      apres(vue) {
        vue.querySelector('#choix-chantier')?.addEventListener('change', e => ctx.naviguer('coordination/' + e.target.value));
        vue.querySelector('#form-renfort').addEventListener('submit', e => {
          e.preventDefault();
          const texte = e.target.elements.texte.value.trim();
          if (texte.length < 5) { vue.querySelector('#renfort-retour').innerHTML = ui.notice('Décrivez le besoin en quelques mots.', 'erreur', 'alerte'); return; }
          E.api.signalerRenfort(c.id, ctx.personne.id, texte);
          ctx.rafraichir();
          document.querySelector('#vue #renfort-retour').innerHTML = ui.notice('Besoin signalé dans la simulation. Aucune affectation automatique.', 'succes', 'valide');
        });
      }
    };
  };
})(window);
