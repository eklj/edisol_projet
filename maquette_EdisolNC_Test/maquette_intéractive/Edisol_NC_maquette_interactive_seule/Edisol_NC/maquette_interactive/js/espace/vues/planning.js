/* =========================================================================
   ÉDYSOL NC — Vue « Planning et affectations » (cogérance et secrétariat)
   - Grille hebdomadaire par équipe (ordinateur) ou agenda par jour (téléphone).
   - Formulaire d'affectation : type d'équipe, puis équipe. Un binôme fixe
     est toujours affecté en entier ; aucune équipe n'est recomposée.
   - Les conflits de créneau sont SIGNALÉS. L'enregistrement malgré un
     conflit demande une confirmation explicite (arbitrage humain).
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const O = racine.EdysolOrganisation;
  const vues = E.vues = E.vues || {};
  let decalageSemaine = 0; // navigation conservée pendant la session

  vues.planning = ctx => {
    const D = E.donneesVues;
    const s = D.etat();
    const lundi = E.ajouterJours(E.lundiDe(E.aujourdhui()), decalageSemaine * 7);
    const jours = Array.from({ length: 6 }, (_, i) => E.ajouterJours(lundi, i)); // lundi à samedi
    const commandeChoisie = s.commandes.find(c => c.id === ctx.param);
    const aPlanifier = s.commandes.filter(c => c.statut !== 'terminee');

    /** Pastille d'une intervention dans la grille ou l'agenda. */
    const pastille = i => {
      const c = s.commandes.find(x => x.id === i.commandeId);
      return `<a class="creneau creneau--${esc(D.equipe(i.equipeId)?.type || 'solo')}" href="${ctx.lien('commande/' + i.commandeId)}">
          <span class="creneau__heure">${esc(i.debut)}–${esc(i.fin)}</span><strong>${esc(i.commandeId.replace('EDY-2026-', 'EDY-'))}</strong>
          <span class="creneau__lieu">${esc(c?.commune || '')}</span></a>`;
    };
    const coordinationsDuJour = (jour, equipeId) => s.coordinations.filter(co => co.date === jour && D.equipe(equipeId)?.membres.includes(co.controleuseId));

    const grille = `
      <div class="planning-grille" role="table" aria-label="Planning de la semaine par équipe">
        <div class="planning-grille__ligne planning-grille__ligne--entete" role="row">
          <span role="columnheader" class="planning-grille__equipe">Équipe</span>
          ${jours.map(j => `<span role="columnheader" class="${j === E.aujourdhui() ? 'est-aujourdhui' : ''}">${esc(E.formaterDate(j, 'court'))}</span>`).join('')}
        </div>
        ${s.equipes.map(eq => `
          <div class="planning-grille__ligne" role="row">
            <span role="rowheader" class="planning-grille__equipe"><strong>${esc(eq.nom)}</strong><small>${esc(eq.type === 'binome' ? eq.membres.map(E.api.nomPersonne).join(' + ') : O.TYPES_EQUIPE[eq.type])}</small></span>
            ${jours.map(j => `<span role="cell" class="planning-grille__cellule${j === E.aujourdhui() ? ' est-aujourdhui' : ''}">
              ${s.interventions.filter(i => i.equipeId === eq.id && i.date === j).sort((a, b) => a.debut.localeCompare(b.debut)).map(pastille).join('')}
              ${coordinationsDuJour(j, eq.id).map(co => `<a class="creneau creneau--coordination" href="${ctx.lien('commande/' + co.commandeId)}"><span class="creneau__heure">Coordination</span><strong>${esc(co.commandeId.replace('EDY-2026-', 'EDY-'))}</strong></a>`).join('')}
            </span>`).join('')}
          </div>`).join('')}
      </div>`;

    const agenda = `<ol class="agenda">${jours.map(j => {
      const duJour = s.interventions.filter(i => i.date === j).sort((a, b) => a.debut.localeCompare(b.debut));
      return `<li class="agenda__jour${j === E.aujourdhui() ? ' est-aujourdhui' : ''}"><h3>${esc(E.formaterDate(j, 'court'))}</h3>
        ${duJour.length ? `<ul>${duJour.map(i => `<li>${pastille(i)}<span class="agenda__equipe">${esc(D.libelleEquipe(i.equipeId))}</span></li>`).join('')}</ul>` : '<p class="vide">Aucune intervention.</p>'}</li>`;
    }).join('')}</ol>`;

    const typeInitial = 'binome';
    const formulaire = `
      <form class="bloc bloc--formulaire formulaire-affectation" id="form-affectation" novalidate>
        <h2 class="bloc__titre">Planifier une commande</h2>
        <div class="champ">
          <label for="aff-commande">Commande</label>
          <select id="aff-commande" name="commande" required>
            ${aPlanifier.map(c => `<option value="${esc(c.id)}" ${c.id === (commandeChoisie?.id || aPlanifier[0]?.id) ? 'selected' : ''}>${esc(c.id)} · ${esc(c.client.nom)} · ${esc(ui.STATUTS[c.statut])}</option>`).join('')}
          </select>
          <p class="aide" id="aff-souhait"></p>
        </div>
        <div class="grille-champs">
          <div class="champ champ--large"><label for="aff-date">Date confirmée</label><input id="aff-date" name="date" type="date" required value="${esc(commandeChoisie?.dateSouhaitee || E.ajouterJours(E.aujourdhui(), 1))}"></div>
          <div class="champ"><label for="aff-debut">Début</label><input id="aff-debut" name="debut" type="time" required value="08:00" step="900"></div>
          <div class="champ"><label for="aff-fin">Fin</label><input id="aff-fin" name="fin" type="time" required value="10:00" step="900"></div>
        </div>
        <fieldset class="groupe-choix">
          <legend class="libelle">Type d’équipe</legend>
          <div class="segments">${Object.entries(O.TYPES_EQUIPE).map(([k, v]) => `<label class="segment"><input type="radio" name="type" value="${k}" ${k === typeInitial ? 'checked' : ''}><span>${esc(v)}</span></label>`).join('')}</div>
        </fieldset>
        <div class="champ">
          <label for="aff-equipe">Équipe affectée</label>
          <select id="aff-equipe" name="equipe" required></select>
          <p class="aide" id="aff-membres"></p>
        </div>
        <div id="aff-retour" role="alert"></div>
        <button type="submit" class="bouton bouton--principal">${icone('valide')}Enregistrer l’affectation (simulation)</button>
        <p class="aide-bloc">Disponibilités à vérifier ; responsable et procédure de validation à préciser.</p>
      </form>`;

    return {
      titre: 'Planning',
      html: `
        ${ui.entetePage({ titre: 'Planning et affectations', sousTitre: '4 binômes fixes, employés en solo et prestations de ménage des contrôleuses.' })}
        <div class="planning-nav">
          <button type="button" class="bouton-icone" data-semaine="-1" aria-label="Semaine précédente">${icone('gauche')}</button>
          <p class="planning-nav__titre" aria-live="polite">Semaine du ${esc(E.formaterDate(lundi))}</p>
          <button type="button" class="bouton-icone" data-semaine="1" aria-label="Semaine suivante">${icone('droite')}</button>
          ${decalageSemaine ? '<button type="button" class="bouton bouton--discret bouton--petit" data-semaine="0">Cette semaine</button>' : ''}
          <span class="planning-legende"><span class="creneau-legende creneau--binome">Binôme fixe</span><span class="creneau-legende creneau--solo">Solo</span><span class="creneau-legende creneau--controleuse">Contrôleuse (ménage)</span><span class="creneau-legende creneau--coordination">Coordination</span></span>
        </div>
        <div class="grille-planning">
          <div class="planning-vue">${grille}${agenda}</div>
          <div class="pile">
            ${formulaire}
            ${ui.bloc('Règles en attente', `<ul class="liste-regles">${O.REGLES_EN_ATTENTE.map(r => `<li>${ui.aDefinir(r)}</li>`).join('')}</ul>`)}
          </div>
        </div>`,
      apres(vue) {
        const form = vue.querySelector('#form-affectation');
        const selectEquipe = form.querySelector('#aff-equipe');
        const retour = form.querySelector('#aff-retour');
        let conflitEnAttente = null;

        /** Remplit la liste des équipes selon le type choisi et affiche leurs membres. */
        function majEquipes() {
          const type = form.querySelector('[name=type]:checked').value;
          selectEquipe.innerHTML = s.equipes.filter(e => e.type === type).map(e => `<option value="${esc(e.id)}">${esc(e.nom)}</option>`).join('');
          majMembres();
        }
        function majMembres() {
          const eq = D.equipe(selectEquipe.value);
          const txt = eq ? (eq.type === 'binome' ? `Binôme fixe : ${eq.membres.map(E.api.nomPersonne).join(' + ')}, toujours affectés ensemble.`
            : eq.type === 'controleuse' ? `${E.api.nomPersonne(eq.membres[0])} effectue la prestation de ménage. Disponibilité à vérifier.` : `${E.api.nomPersonne(eq.membres[0])} intervient seul.`) : '';
          form.querySelector('#aff-membres').textContent = txt;
          conflitEnAttente = null;
          retour.innerHTML = '';
        }
        /** Affiche le souhait du client pour la commande choisie. */
        function majSouhait() {
          const c = s.commandes.find(x => x.id === form.elements.commande.value);
          form.querySelector('#aff-souhait').textContent = c ? `Souhait du client : ${c.dateSouhaitee ? E.formaterDate(c.dateSouhaitee) : 'non précisé'}, ${c.creneau.toLowerCase()} · ${D.prestation(c.prestation)} à ${c.commune}.` : '';
        }
        form.addEventListener('change', e => {
          if (e.target.name === 'type') majEquipes();
          if (e.target.name === 'equipe') majMembres();
          if (e.target.name === 'commande') majSouhait();
          if (['date', 'debut', 'fin'].includes(e.target.name)) { conflitEnAttente = null; retour.innerHTML = ''; }
        });
        form.addEventListener('submit', e => {
          e.preventDefault();
          const proposition = { date: form.elements.date.value, debut: form.elements.debut.value, fin: form.elements.fin.value, equipeId: selectEquipe.value };
          const auteur = ctx.espace === 'secretariat' ? 'la secrétaire' : 'un cogérant';
          const accepter = conflitEnAttente === JSON.stringify(proposition);
          const r = E.api.planifier(form.elements.commande.value, proposition, auteur, accepter);
          if (r.erreurs.length) { retour.innerHTML = ui.notice(r.erreurs.map(esc).join('<br>'), 'erreur', 'alerte'); return; }
          if (!r.ok && r.conflits.length) {
            conflitEnAttente = JSON.stringify(proposition);
            retour.innerHTML = ui.notice(`<strong>Conflit de créneau :</strong> ${r.conflits.map(i => `${esc(i.commandeId)} (${esc(D.libelleEquipe(i.equipeId))}, ${esc(i.debut)}–${esc(i.fin)})`).join(', ')}.
              Aucune réaffectation automatique n’est faite. Modifiez le créneau ou l’équipe, ou cliquez de nouveau sur « Enregistrer » pour confirmer l’arbitrage.`, 'alerte', 'alerte');
            return;
          }
          ctx.rafraichir();
          document.querySelector('#vue .planning-vue').insertAdjacentHTML('beforebegin', ui.notice(`Affectation enregistrée dans la simulation pour ${esc(form.elements.commande.value)}. Les membres de l’équipe la voient dans leur espace.`, 'succes', 'valide'));
        });
        vue.querySelectorAll('[data-semaine]').forEach(b => b.addEventListener('click', () => {
          decalageSemaine = b.dataset.semaine === '0' ? 0 : decalageSemaine + Number(b.dataset.semaine);
          ctx.rafraichir();
        }));
        majEquipes();
        majSouhait();
      }
    };
  };
})(window);
