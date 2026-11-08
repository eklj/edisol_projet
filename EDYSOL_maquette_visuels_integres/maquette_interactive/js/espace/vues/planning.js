/* =========================================================================
   ÉDYSOL NC — Vue « Planning et affectations » (cogérance et secrétariat)
   - Vue « Jour par ressource » : une ligne par équipe, l'heure en abscisse.
     Glisser une intervention change son heure et/ou son équipe (même type).
   - Vue « Semaine » : glisser une intervention vers un autre jour ou une
     autre équipe ; l'heure est conservée. Agenda par jour sur téléphone.
   - La durée est toujours conservée ; la grille s'aligne sur un pas réglable.
   - Un conflit de déplacement est BLOQUANT : l'intervention reste à sa place.
   - « Annuler le déplacement » après chaque déplacement réussi.
   - Alternative accessible : cliquer (ou Entrée) sur une intervention ouvre
     une fenêtre pour changer date, heure ou équipe sans glisser-déposer.
   - Formulaire d'affectation d'une commande : inchangé (type d'équipe puis
     équipe ; un binôme fixe est toujours affecté en entier).
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone, ui } = E;
  const O = racine.EdysolOrganisation;
  const vues = E.vues = E.vues || {};
  let decalageSemaine = 0; // navigation conservée pendant la session
  let mode = 'jour';        // 'jour' (par ressource) ou 'semaine'
  let jourChoisi = null;    // date affichée en vue « jour »
  let messageEnAttente = null; // résultat du dernier déplacement, affiché après réaffichage
  const R = racine.EdysolDeplacement;
  /** Pas de la grille (minutes), mémorisé dans ce navigateur. */
  const lirePas = () => { const p = Number(E.stockage.lire('edysol-pas-grille')); return R.PAS.includes(p) ? p : 30; };

  vues.planning = ctx => {
    const D = E.donneesVues;
    const s = D.etat();
    const lundi = E.ajouterJours(E.lundiDe(E.aujourdhui()), decalageSemaine * 7);
    const jours = Array.from({ length: 6 }, (_, i) => E.ajouterJours(lundi, i)); // lundi à samedi
    const commandeChoisie = s.commandes.find(c => c.id === ctx.param);
    const aPlanifier = s.commandes.filter(c => c.statut !== 'terminee');

    const pas = lirePas();
    // Droits de la personne choisie : accès à l'outil ≠ pouvoir de déplacer (voir EdysolDeplacement.droitsPlanning).
    const droits = R.droitsPlanning(E.api.acteur(ctx.personne.role));
    const avecDroits = d => ({ ...d, droits });
    if (!jourChoisi || !jours.includes(jourChoisi)) jourChoisi = jours.includes(E.aujourdhui()) ? E.aujourdhui() : jours[0];
    const debutGrille = R.minutes(R.PLAGE.debut), finGrille = R.minutes(R.PLAGE.fin), amplitude = finGrille - debutGrille;
    const pct = m => ((m - debutGrille) / amplitude * 100).toFixed(4);

    /** Texte accessible décrivant une intervention (lu par les lecteurs d'écran). */
    const description = i => {
      const c = s.commandes.find(x => x.id === i.commandeId);
      return `${i.commandeId}, ${E.formaterDate(i.date, 'court')} de ${i.debut} à ${i.fin}, ${D.libelleEquipe(i.equipeId)}, ${ui.STATUTS[i.statut]}${c ? ', ' + c.commune : ''}${i.creneauClient === 'confirme' ? ', créneau confirmé au client' : ''}. Entrée pour modifier ou consulter.`;
    };
    /** Bloc d'intervention (bouton) : déplaçable seulement s'il est planifié. */
    const bloc = (i, style = '') => {
      const c = s.commandes.find(x => x.id === i.commandeId);
      const type = D.equipe(i.equipeId)?.type || 'solo';
      const deplacable = i.statut === 'planifiee' && droits.deplacer;
      return `<button type="button" class="bloc-inter bloc-inter--${esc(type)}${deplacable ? '' : ' est-verrouille'}" data-intervention="${esc(i.id)}" data-deplacable="${deplacable}" ${style} aria-label="${esc(description(i))}">
          <span class="bloc-inter__heure">${esc(i.debut)}–${esc(i.fin)}</span><strong>${esc(i.commandeId.replace('EDY-2026-', 'EDY-'))}</strong>
          <span class="bloc-inter__lieu">${esc(c?.commune || '')}${i.creneauClient === 'confirme' ? ' · client' : ''}${i.creneauClient === 'a-reconfirmer' ? ' · à reconfirmer' : ''}</span>
        </button>`;
    };
    const coordinationsDuJour = (jour, equipeId) => s.coordinations.filter(co => co.date === jour && D.equipe(equipeId)?.membres.includes(co.controleuseId));
    const ressource = eq => `<strong>${esc(eq.nom)}</strong><small>${esc(eq.type === 'binome' ? eq.membres.map(E.api.nomPersonne).join(' + ') : O.TYPES_EQUIPE[eq.type])}</small>`;

    // Vue « jour par ressource » : une piste horaire par équipe.
    const heures = Array.from({ length: amplitude / 60 }, (_, k) => R.heure(debutGrille + k * 60));
    const vueJour = `
      <div class="chrono" id="chrono" role="group" aria-label="Planning du ${esc(E.formaterDate(jourChoisi))} par équipe, de ${R.PLAGE.debut} à ${R.PLAGE.fin}">
        <div class="chrono__interieur" style="--colonnes:${heures.length}">
          <div class="chrono__entete" aria-hidden="true"><span class="chrono__coin">Équipe</span><div class="chrono__heures">${heures.map(h => `<span>${h}</span>`).join('')}</div></div>
          ${s.equipes.map(eq => {
            const duJour = s.interventions.filter(i => i.equipeId === eq.id && i.date === jourChoisi);
            const coord = coordinationsDuJour(jourChoisi, eq.id);
            return `<div class="chrono__ligne">
              <div class="chrono__ressource">${ressource(eq)}${coord.length ? `<span class="chrono__coordination">Coordination ${esc(coord.map(c => c.commandeId.replace('EDY-2026-', 'EDY-')).join(', '))} · horaires non renseignés</span>` : ''}</div>
              <div class="chrono__piste" data-equipe="${esc(eq.id)}" data-date="${esc(jourChoisi)}" data-type="${esc(eq.type)}">
                ${duJour.map(i => bloc(i, `style="left:${pct(R.minutes(i.debut))}%;width:${(R.duree(i) / amplitude * 100).toFixed(4)}%"`)).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;

    // Vue « semaine » : grille jours x équipes (ordinateur) et agenda (téléphone).
    const grille = `
      <div class="planning-grille" role="table" aria-label="Planning de la semaine par équipe">
        <div class="planning-grille__ligne planning-grille__ligne--entete" role="row">
          <span role="columnheader" class="planning-grille__equipe">Équipe</span>
          ${jours.map(j => `<span role="columnheader" class="${j === E.aujourdhui() ? 'est-aujourdhui' : ''}">${esc(E.formaterDate(j, 'court'))}</span>`).join('')}
        </div>
        ${s.equipes.map(eq => `
          <div class="planning-grille__ligne" role="row">
            <span role="rowheader" class="planning-grille__equipe">${ressource(eq)}</span>
            ${jours.map(j => `<span role="cell" class="planning-grille__cellule${j === E.aujourdhui() ? ' est-aujourdhui' : ''}" data-date="${esc(j)}" data-equipe="${esc(eq.id)}" data-type="${esc(eq.type)}">
              ${s.interventions.filter(i => i.equipeId === eq.id && i.date === j).sort((a, b) => a.debut.localeCompare(b.debut)).map(i => bloc(i)).join('')}
              ${coordinationsDuJour(j, eq.id).map(co => `<a class="creneau creneau--coordination" href="${ctx.lien('commande/' + co.commandeId)}"><span class="creneau__heure">Coordination</span><strong>${esc(co.commandeId.replace('EDY-2026-', 'EDY-'))}</strong></a>`).join('')}
            </span>`).join('')}
          </div>`).join('')}
      </div>`;
    const agenda = `<ol class="agenda">${jours.map(j => {
      const duJour = s.interventions.filter(i => i.date === j).sort((a, b) => a.debut.localeCompare(b.debut));
      return `<li class="agenda__jour${j === E.aujourdhui() ? ' est-aujourdhui' : ''}"><h3>${esc(E.formaterDate(j, 'court'))}</h3>
        ${duJour.length ? `<ul>${duJour.map(i => `<li>${bloc(i)}<span class="agenda__equipe">${esc(D.libelleEquipe(i.equipeId))}</span></li>`).join('')}</ul>` : '<p class="vide">Aucune intervention.</p>'}</li>`;
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
        ${ui.entetePage({ titre: 'Planning et affectations', sousTitre: `4 binômes fixes, employés en solo et prestations de ménage des contrôleuses · données communes à la direction et au secrétariat · ${esc(ctx.personne.nom)}.` })}
        <div class="planning-nav">
          <button type="button" class="bouton-icone" data-semaine="-1" aria-label="Semaine précédente">${icone('gauche')}</button>
          <p class="planning-nav__titre" aria-live="polite">Semaine du ${esc(E.formaterDate(lundi))}</p>
          <button type="button" class="bouton-icone" data-semaine="1" aria-label="Semaine suivante">${icone('droite')}</button>
          ${decalageSemaine ? '<button type="button" class="bouton bouton--discret bouton--petit" data-semaine="0">Cette semaine</button>' : ''}
          <span class="planning-legende"><span class="creneau-legende creneau--binome">Binôme fixe</span><span class="creneau-legende creneau--solo">Solo</span><span class="creneau-legende creneau--controleuse">Contrôleuse (ménage)</span><span class="creneau-legende creneau--coordination">Coordination</span></span>
        </div>
        ${ctx.personne.role === 'secretaire' ? ui.notice(`<strong>Accès de la secrétaire confirmé (consultation du planning).</strong> Ses droits de déplacement et de réaffectation ne sont pas encore définis : ils restent fermés et ne sont pas alignés automatiquement sur ceux de la direction. ${droits.deplacer ? '<br>Permission simulée active : ' + [droits.deplacer ? 'déplacer' : '', droits.reaffecter ? 'réaffecter' : ''].filter(Boolean).join(' et ') + ' (démonstration seulement).' : 'Les interventions s’ouvrent en consultation.'}`, 'alerte', 'bouclier') : ''}
        <div class="planning-commandes">
          <div class="segments" role="group" aria-label="Affichage du planning">
            <button type="button" class="segment-bouton" data-mode="jour" aria-pressed="${mode === 'jour'}">Jour par ressource</button>
            <button type="button" class="segment-bouton" data-mode="semaine" aria-pressed="${mode === 'semaine'}">Semaine</button>
          </div>
          ${mode === 'jour' ? `<div class="jours-choix" role="group" aria-label="Jour affiché">${jours.map(j => `<button type="button" class="filtre filtre--petit" data-jour="${j}" aria-pressed="${j === jourChoisi}">${esc(E.formaterDate(j, 'court'))}</button>`).join('')}</div>` : ''}
          <label class="pas-grille">Grille <select id="pas-grille">${R.PAS.map(p => `<option value="${p}" ${p === pas ? 'selected' : ''}>${p} min</option>`).join('')}</select></label>
        </div>
        <p class="aide-bloc planning-aide">${icone('info')}${droits.deplacer
          ? 'Glissez une intervention planifiée pour la déplacer (sur téléphone : appui long, puis glisser). Cliquez dessus, ou Entrée au clavier, pour modifier date, heure ou équipe sans glisser. La durée est conservée.'
          : 'Consultation : cliquez sur une intervention, ou Entrée au clavier, pour voir son détail. Le glisser-déposer n’est pas disponible tant que le droit de déplacement n’est pas attribué.'}</p>
        <div id="planning-message" class="planning-message" tabindex="-1"></div>
        <p class="visuellement-cache" aria-live="assertive" id="annonce-planning"></p>
        <div class="grille-planning${mode === 'jour' ? ' grille-planning--large' : ''}">
          <div class="planning-vue">${mode === 'jour' ? vueJour : grille + agenda}</div>
          <div class="pile">
            ${formulaire}
            ${ui.bloc('Contrôles lors d’un déplacement', `<ul class="liste-puces">
              <li>Chevauchement des personnes de l’équipe : <strong>bloquant</strong>.</li>
              <li>Binôme fixe déplacé en entier, vers un autre binôme fixe seulement.</li>
              <li>Pas de passage en solo, pas de remplacement automatique.</li></ul>
              <p class="aide-bloc">Impossibles faute de données : indisponibilités, véhicules affectés, temps de trajet, horaires de coordination.</p>`)}
            ${ui.bloc('Règles en attente', `<ul class="liste-regles">${O.REGLES_EN_ATTENTE.map(r => `<li>${ui.aDefinir(r)}</li>`).join('')}<li>${ui.aDefinir('Changement d’un créneau déjà confirmé au client : autorisation et information du client à définir.')}</li></ul>`)}
            ${ui.bloc('Outil de démonstration', `<label class="case"><input type="checkbox" id="simuler-echec"><span>Faire échouer l’enregistrement du prochain déplacement (pour vérifier le retour à la position précédente)</span></label>
              ${ctx.personne.role === 'secretaire' ? `<p class="aide-bloc">Droits de la secrétaire non définis. Pour tester l’écran, une permission peut être <strong>simulée</strong> :</p>
              <label class="case"><input type="checkbox" data-permission-planning="planning:deplacer" ${droits.deplacer ? 'checked' : ''}><span>Simuler la permission de déplacer <code>planning:deplacer</code></span></label>
              <label class="case"><input type="checkbox" data-permission-planning="planning:reaffecter" ${droits.reaffecter ? 'checked' : ''}><span>Simuler la permission de réaffecter <code>planning:reaffecter</code></span></label>` : ''}`, { classe: 'bloc--permissions' })}
          </div>
        </div>
        <dialog class="dialogue-intervention" id="dialogue-intervention" aria-labelledby="dialogue-titre"></dialog>`,
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
          const auteur = ctx.personne.nom; // personne choisie dans le sélecteur de démonstration
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

        /* ---------- Affichage : mode, jour, pas de grille, outil de démo ---------- */
        vue.querySelectorAll('[data-mode]').forEach(x => x.addEventListener('click', () => { mode = x.dataset.mode; ctx.rafraichir(); }));
        vue.querySelectorAll('[data-jour]').forEach(x => x.addEventListener('click', () => { jourChoisi = x.dataset.jour; ctx.rafraichir(); }));
        vue.querySelector('#pas-grille').addEventListener('change', e => { E.stockage.ecrire('edysol-pas-grille', Number(e.target.value)); });
        vue.querySelector('#simuler-echec').addEventListener('change', e => E.api.simulerEchecEnregistrement(e.target.checked));
        vue.querySelectorAll('[data-permission-planning]').forEach(c => c.addEventListener('change', () => {
          E.api.basculerPermission(c.dataset.permissionPlanning, c.checked); // permission SIMULÉE, démonstration seulement
          ctx.rafraichir();
        }));

        const zoneMessage = vue.querySelector('#planning-message');
        const annonce = texte => { vue.querySelector('#annonce-planning').textContent = texte; };

        /** Libellé court d'une position : « jeu. 6 nov. 09:00 à 11:00 · Binôme fixe 1 ». */
        const libellePosition = p => `${E.formaterDate(p.date, 'court')} ${p.debut} à ${p.fin} · ${D.equipe(p.equipeId)?.nom || p.equipeId}`;

        /** Applique un déplacement (glisser ou fenêtre) puis réaffiche avec le résultat. */
        function deplacer(id, cible) {
          const i = s.interventions.find(x => x.id === id);
          const avant = i ? { ...i } : null;
          const r = E.api.deplacerIntervention(id, cible, ctx.personne.nom, ctx.personne.role);
          if (r.inchange) { annonce('Même créneau : aucun changement.'); return r; }
          messageEnAttente = { ...r, avant };
          ctx.rafraichir();
          return r;
        }

        /** Message après un déplacement : succès avec « Annuler », ou refus expliqué. */
        function afficherResultat(r) {
          const impossibles = r.impossibles && r.impossibles.length ? `<details class="details-controles"><summary>Contrôles non effectués faute de données (${r.impossibles.length})</summary><ul>${r.impossibles.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : '';
          if (r.annule) {
            zoneMessage.innerHTML = ui.notice(`Déplacement annulé : ${esc(libellePosition(r.position))}.`, 'succes', 'valide');
          } else if (r.ok) {
            zoneMessage.innerHTML = `<div class="resultat-deplacement">
              ${ui.notice(`<strong>Intervention déplacée (planning interne).</strong> ${esc(r.avant ? libellePosition(r.avant) : '')} devient <strong>${esc(libellePosition(r.position))}</strong>. Durée conservée : ${esc(String(R.duree(r.position)))} min. Les personnes concernées voient le changement dans leur espace (notification interne simulée).`, 'succes', 'valide')}
              ${r.avertissements.map(t => ui.notice(esc(t), 'alerte', 'alerte')).join('')}
              ${impossibles}
              <button type="button" class="bouton bouton--clair bouton--petit" data-annuler>${icone('rafraichir')}Annuler le déplacement</button>
            </div>`;
            zoneMessage.querySelector('[data-annuler]').addEventListener('click', () => {
              const res = E.api.annulerDeplacement(r.jeton, ctx.personne.nom, ctx.personne.role);
              if (!res.ok) { zoneMessage.insertAdjacentHTML('beforeend', ui.notice(esc(res.bloquants.join(' ')), 'erreur', 'alerte')); return; }
              messageEnAttente = { annule: true, position: r.jeton.avant };
              ctx.rafraichir();
            });
          } else {
            zoneMessage.innerHTML = ui.notice(`<strong>Déplacement refusé : l’intervention reste à sa place${r.avant ? ' (' + esc(libellePosition(r.avant)) + ')' : ''}.</strong><br>${r.bloquants.map(esc).join('<br>')}`, 'erreur', 'alerte') + impossibles;
          }
          zoneMessage.focus({ preventScroll: true });
          zoneMessage.scrollIntoView({ block: 'nearest', behavior: E.mouvementsReduits() ? 'auto' : 'smooth' });
        }

        /* ---------- Glisser-déposer ---------- */
        const zonePlanning = vue.querySelector('.planning-vue');
        let fantome = null, dernierTexte = '';
        E.glisserDeposer.activer(zonePlanning, {
          selecteur: '.bloc-inter[data-deplacable="true"]',
          selecteurClic: '.bloc-inter',
          /** Cible sous le pointeur : piste horaire (vue jour) ou case jour/équipe (vue semaine). */
          cible(x, y, element, prise) {
            const i = s.interventions.find(it => it.id === element.dataset.intervention);
            if (mode === 'jour') {
              const pistes = [...zonePlanning.querySelectorAll('.chrono__piste')];
              const piste = pistes.find(p => { const r = p.getBoundingClientRect(); return y >= r.top && y <= r.bottom; });
              if (!piste) return null;
              const r = piste.getBoundingClientRect();
              const brut = debutGrille + ((x - prise.dx) - r.left) / r.width * amplitude;
              const debut = Math.min(Math.max(R.aligner(brut, lirePas()), debutGrille), finGrille - R.duree(i));
              return { date: piste.dataset.date, equipeId: piste.dataset.equipe, debut: R.heure(debut), piste };
            }
            const sous = document.elementFromPoint(x, y);
            const cellule = sous && sous.closest('.planning-grille__cellule');
            return cellule ? { date: cellule.dataset.date, equipeId: cellule.dataset.equipe, debut: i.debut, cellule } : null;
          },
          /** Aperçu du créneau cible : position, heures et validité, mis à jour pendant le geste. */
          apercu(cible, element) {
            if (fantome) { fantome.remove(); fantome = null; }
            if (!cible) return;
            const i = E.api.charger().interventions.find(it => it.id === element.dataset.intervention);
            const pos = R.nouvellePosition(i, cible);
            const ctrl = R.controlerDeplacement(i, pos, avecDroits({ equipes: s.equipes, interventions: E.api.charger().interventions, aujourdhui: E.aujourdhui() }));
            const valide = !ctrl.bloquants.length;
            fantome = document.createElement('div');
            fantome.className = 'apercu-creneau ' + (valide ? 'est-valide' : 'est-invalide');
            fantome.setAttribute('aria-hidden', 'true');
            fantome.innerHTML = `<strong>${esc(pos.debut)} à ${esc(pos.fin)}</strong><span>${esc(D.equipe(pos.equipeId)?.nom || '')}</span><span>${valide ? 'Créneau possible' : 'Impossible : ' + esc(ctrl.bloquants[0])}</span>`;
            if (cible.piste) {
              fantome.style.left = pct(R.minutes(pos.debut)) + '%';
              fantome.style.width = (R.duree(pos) / amplitude * 100) + '%';
              cible.piste.append(fantome);
            } else cible.cellule.append(fantome);
            const texte = `Aperçu : ${libellePosition(pos)}. ${valide ? 'Créneau possible.' : 'Impossible : ' + ctrl.bloquants[0]}`;
            if (texte !== dernierTexte) { dernierTexte = texte; annonce(texte); }
          },
          deposer(element, cible) {
            if (!cible) { annonce('Relâché hors du planning : aucun changement.'); return; }
            deplacer(element.dataset.intervention, { date: cible.date, debut: cible.debut, equipeId: cible.equipeId });
          },
          cliquer(element) { ouvrirDialogue(element.dataset.intervention, element); },
          annonce
        });

        /* ---------- Fenêtre de modification (alternative sans glisser-déposer) ---------- */
        const dialogue = vue.querySelector('#dialogue-intervention');
        let origineFocus = null;
        dialogue.addEventListener('close', () => { if (origineFocus && document.contains(origineFocus)) origineFocus.focus(); });

        /** Ouvre la fenêtre pour une intervention : date, heure de début, équipe du même type. */
        function ouvrirDialogue(id, origine) {
          const i = E.api.charger().interventions.find(x => x.id === id);
          if (!i) return;
          origineFocus = origine;
          const eq = D.equipe(i.equipeId);
          const c = s.commandes.find(x => x.id === i.commandeId);
          const deplacable = i.statut === 'planifiee' && droits.deplacer;
          const memesType = s.equipes.filter(e => e.type === eq.type);
          dialogue.innerHTML = `
            <form method="dialog" class="dialogue-intervention__form" novalidate>
              <div class="dialogue-intervention__entete">
                <h2 id="dialogue-titre">${esc(i.commandeId)} · ${esc(c ? c.client.nom : '')}</h2>
                <button type="button" class="bouton-icone" data-fermer aria-label="Fermer">${icone('fermer')}</button>
              </div>
              <p>${ui.badgeStatut(i.statut)} <span class="sous-ligne">Actuellement : ${esc(libellePosition(i))} · durée ${esc(String(R.duree(i)))} min</span></p>
              ${i.creneauClient === 'confirme' ? ui.notice('Créneau confirmé au client. Le modifier ici change le planning interne ; l’autorisation et l’information du client restent à définir. Aucun message ne lui est envoyé.', 'alerte', 'alerte') : ''}
              ${deplacable ? `
              <div class="grille-champs">
                <div class="champ"><label for="dlg-date">Date</label><input id="dlg-date" name="date" type="date" value="${esc(i.date)}" required></div>
                <div class="champ"><label for="dlg-debut">Début</label><input id="dlg-debut" name="debut" type="time" value="${esc(i.debut)}" step="${lirePas() * 60}" min="${R.PLAGE.debut}" max="${R.PLAGE.fin}" required></div>
              </div>
              <p class="dialogue-intervention__fin" aria-live="polite">Fin calculée : <strong id="dlg-fin">${esc(i.fin)}</strong> (durée conservée)</p>
              <div class="champ"><label for="dlg-equipe">Équipe</label>
                <select id="dlg-equipe" name="equipe" ${droits.reaffecter ? '' : 'disabled aria-describedby="dlg-equipe-droit"'}>${memesType.map(e => `<option value="${esc(e.id)}" ${e.id === i.equipeId ? 'selected' : ''}>${esc(e.nom)}${e.type === 'binome' ? ' · ' + esc(e.membres.map(E.api.nomPersonne).join(' + ')) : ''}</option>`).join('')}</select>
                <p class="aide">Seulement des équipes du même type (${esc(O.TYPES_EQUIPE[eq.type])}). Un binôme fixe est toujours déplacé en entier.</p>${droits.reaffecter ? '' : '<p class="aide" id="dlg-equipe-droit">Changement d’équipe : droit de réaffectation non attribué à ce rôle.</p>'}</div>
              <div id="dlg-retour" role="alert"></div>
              <div class="dialogue-intervention__actions">
                <button type="submit" class="bouton bouton--principal" value="enregistrer">${icone('valide')}Enregistrer le déplacement</button>
                <button type="button" class="bouton bouton--clair" data-fermer>Annuler</button>
              </div>` : `${ui.notice(i.statut !== 'planifiee' ? 'Intervention en cours ou terminée : elle ne peut pas être déplacée.' : 'Consultation seulement : le droit de déplacer n’est pas attribué à ce rôle (droits de la secrétaire à définir par la direction).', 'info')}`}
              <p><a class="lien-simple" href="${ctx.lien('commande/' + i.commandeId)}">Voir la commande ${esc(i.commandeId)}</a></p>
            </form>`;
          dialogue.querySelectorAll('[data-fermer]').forEach(b => b.addEventListener('click', () => dialogue.close()));
          const form = dialogue.querySelector('form');
          if (deplacable) {
            const majFin = () => {
              const debut = form.elements.debut.value;
              dialogue.querySelector('#dlg-fin').textContent = /^\d{2}:\d{2}$/.test(debut) ? R.heure(R.minutes(debut) + R.duree(i)) : '—';
            };
            form.elements.debut.addEventListener('input', majFin);
            form.addEventListener('submit', e => {
              e.preventDefault();
              const cible = { date: form.elements.date.value, debut: form.elements.debut.value, equipeId: droits.reaffecter ? form.elements.equipe.value : i.equipeId };
              if (!/^\d{4}-\d{2}-\d{2}$/.test(cible.date) || !/^\d{2}:\d{2}$/.test(cible.debut)) {
                dialogue.querySelector('#dlg-retour').innerHTML = ui.notice('Date et heure de début à renseigner.', 'erreur', 'alerte');
                return;
              }
              // Contrôle avant fermeture : en cas de refus, la fenêtre reste ouverte avec l'explication.
              const pos = R.nouvellePosition(i, cible);
              const ctrl = R.controlerDeplacement(i, pos, avecDroits({ equipes: s.equipes, interventions: E.api.charger().interventions, aujourdhui: E.aujourdhui() }));
              if (ctrl.bloquants.length) {
                dialogue.querySelector('#dlg-retour').innerHTML = ui.notice(`<strong>Déplacement impossible :</strong><br>${ctrl.bloquants.map(esc).join('<br>')}`, 'erreur', 'alerte');
                return;
              }
              origineFocus = null;
              dialogue.close();
              deplacer(i.id, cible);
            });
          }
          dialogue.showModal();
          (form.elements.date || dialogue.querySelector('[data-fermer]')).focus();
        }

        // Résultat du déplacement précédent (après réaffichage) : affiché une fois tout initialisé.
        if (messageEnAttente) { const m = messageEnAttente; messageEnAttente = null; afficherResultat(m); }
      }
    };
  };
})(window);
