/* =========================================================================
   ÉDYSOL NC — Composants d'interface des espaces internes
   Petites fonctions qui retournent du HTML (valeurs toujours échappées) :
   badges d'état, en-têtes de page, cartes indicateurs, tableaux qui
   deviennent des cartes sur téléphone, listes de définitions, notices.
   ========================================================================= */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const { esc, icone } = E;

  /** Libellés des statuts de commande et d'intervention (le texte accompagne toujours la couleur). */
  const STATUTS = {
    'a-confirmer': 'À confirmer', 'planifiee': 'Planifiée', 'en-cours': 'En cours',
    'terminee': 'Terminée', 'a-reprogrammer': 'À reprogrammer'
  };

  /** Badge d'état d'une commande ou d'une intervention. */
  function badgeStatut(statut) {
    return `<span class="badge badge--${esc(statut)}">${esc(STATUTS[statut] || statut)}</span>`;
  }

  /** Badge « Données fictives » / « Simulation » affiché sur les écrans. */
  function badgeDemo(texte = 'Données fictives') {
    return `<span class="badge badge--demo">${esc(texte)}</span>`;
  }

  /**
   * En-tête d'une vue : fil d'Ariane facultatif, titre, sous-titre et actions.
   * Paramètres : { titre, sousTitre, retour: {href, texte}, actions: HTML }.
   */
  function entetePage({ titre, sousTitre = '', retour = null, actions = '' }) {
    return `
      <div class="page-entete">
        <div>
          ${retour ? `<a class="lien-retour" href="${esc(retour.href)}">${icone('gauche')}${esc(retour.texte)}</a>` : ''}
          <h1 class="page-entete__titre" tabindex="-1">${esc(titre)}</h1>
          ${sousTitre ? `<p class="page-entete__sous-titre">${sousTitre}</p>` : ''}
        </div>
        ${actions ? `<div class="page-entete__actions">${actions}</div>` : ''}
      </div>`;
  }

  /** Carte indicateur (chiffre clé) avec une icône et un lien facultatif. */
  function carteIndicateur({ libelle, valeur, icone: ic, href = '', ton = 'bleu', note = '' }) {
    const balise = href ? 'a' : 'div';
    return `<${balise} class="indicateur indicateur--${ton}" ${href ? `href="${esc(href)}"` : ''}>
        <span class="indicateur__icone">${icone(ic)}</span>
        <span class="indicateur__valeur">${esc(valeur)}</span>
        <span class="indicateur__libelle">${esc(libelle)}</span>
        ${note ? `<span class="indicateur__note">${esc(note)}</span>` : ''}
      </${balise}>`;
  }

  /**
   * Tableau responsive : vrai tableau sur grand écran, cartes empilées sur téléphone
   * (chaque cellule reprend son en-tête via data-libelle).
   * Paramètres : colonnes [{ titre, cle | rendu(ligne) , classe }], lignes, options { lien(ligne), vide, legende }.
   */
  function tableau(colonnes, lignes, { lien = null, vide = 'Aucun élément.', legende = '' } = {}) {
    if (!lignes.length) return `<p class="vide">${esc(vide)}</p>`;
    return `
      <div class="tableau-conteneur">
        <table class="tableau">
          ${legende ? `<caption class="visuellement-cache">${esc(legende)}</caption>` : ''}
          <thead><tr>${colonnes.map(c => `<th scope="col" class="${esc(c.classe || '')}">${esc(c.titre)}</th>`).join('')}</tr></thead>
          <tbody>
            ${lignes.map(l => `
              <tr${lien ? ` class="ligne-cliquable" data-href="${esc(lien(l))}"` : ''}>
                ${colonnes.map((c, i) => {
                  const contenu = c.rendu ? c.rendu(l) : esc(l[c.cle]);
                  // La première cellule porte le lien réel (accessible au clavier).
                  const cellule = i === 0 && lien ? `<a href="${esc(lien(l))}">${contenu}</a>` : contenu;
                  return `<td data-libelle="${esc(c.titre)}" class="${esc(c.classe || '')}">${cellule}</td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  /** Liste de définitions (libellé / valeur) ; les valeurs sont échappées sauf si brut=true. */
  function definitions(paires, brut = false) {
    return `<dl class="definitions">${paires.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${brut ? d : esc(d)}</dd></div>`).join('')}</dl>`;
  }

  /** Notice colorée (info, alerte, succès, erreur, démo). */
  function notice(texte, ton = 'info', ic = 'info') {
    return `<p class="notice ${ton === 'demo' ? '' : 'notice--' + ton}"><span class="notice__icone">${icone(ic)}</span><span>${texte}</span></p>`;
  }

  /** Bloc de contenu avec titre (carte blanche). */
  function bloc(titre, contenu, { actions = '', classe = '' } = {}) {
    return `<section class="bloc ${esc(classe)}">
        ${titre ? `<div class="bloc__entete"><h2 class="bloc__titre">${esc(titre)}</h2>${actions}</div>` : ''}
        ${contenu}
      </section>`;
  }

  /** Repère « à définir » pour une règle métier non décidée. */
  function aDefinir(texte) {
    return `<span class="a-definir">${icone('alerte')}${esc(texte)}</span>`;
  }

  /** Horodatage en heure de Nouvelle-Calédonie avec élément <time>. */
  function temps(iso) {
    return `<time datetime="${esc(iso)}">${esc(E.formaterHorodatage(iso))}</time>`;
  }

  E.ui = { STATUTS, badgeStatut, badgeDemo, entetePage, carteIndicateur, tableau, definitions, notice, bloc, aDefinir, temps };
})(window);
