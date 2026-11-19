/* Fiche publique partagée. L'URL sélectionne une entrée du catalogue. */
(function () {
  'use strict';
  const E = window.Edysol;
  const { esc, icone } = E;
  const contenu = document.getElementById('contenu');
  const description = document.querySelector('meta[name="description"]');
  const id = new URLSearchParams(window.location.search).get('prestation');
  // Le catalogue résout les anciennes références avant de préparer le lien de demande.
  const prestation = E.prestationParId(id);

  function navigation(titre) {
    return `<nav class="fiche-prestation__navigation" aria-label="Fil d’Ariane">
      <ol>
        <li><a href="index.html#accueil">Accueil</a></li>
        <li>${icone('droite')}<a href="index.html#prestations">Prestations</a></li>
        <li>${icone('droite')}<span aria-current="page">${esc(titre)}</span></li>
      </ol>
    </nav>`;
  }

  if (!prestation) {
    const titre = 'Prestation introuvable';
    document.title = titre + ' · EDYSOL';
    contenu.innerHTML = `<section class="fiche-prestation__entete" aria-labelledby="prestation-titre">
      <div class="conteneur">
        ${navigation(titre)}
        <h1 id="prestation-titre">${titre}</h1>
        <p class="chapeau chapeau--clair">Retrouvez la prestation qui vous intéresse dans le catalogue.</p>
        <a class="bouton bouton--principal" href="index.html#prestations">${icone('gauche')}Voir les prestations</a>
      </div>
    </section>`;
    return;
  }

  const { titre, resume, details, specialite } = prestation;
  const pourDemande = 'commande.html?prestation=' + encodeURIComponent(prestation.id);
  const illustration = E.visuelPrestation(prestation);
  const media = E.mediaPrestation(prestation, { prioritaire: true, tailles: '(min-width: 1340px) 660px, (min-width: 900px) 52vw, 100vw' });
  document.title = titre + ' · EDYSOL';
  description.content = resume;

  contenu.innerHTML = `
    <section class="fiche-prestation__entete" aria-labelledby="prestation-titre">
      <div class="conteneur">
        ${navigation(titre)}
        <div class="fiche-prestation__grille">
          <div class="fiche-prestation__intro">
            ${specialite ? '<p class="surtitre surtitre--clair">Spécialité EDYSOL</p>' : ''}
            <h1 id="prestation-titre">${esc(titre)}</h1>
            <span class="filet" aria-hidden="true"></span>
            <p class="chapeau chapeau--clair">${esc(resume)}</p>
            <a class="bouton bouton--principal" href="${pourDemande}">${icone('commandes')}Demander cette prestation</a>
          </div>
          ${illustration ? `<figure class="fiche-prestation__visuel">
            <div class="fiche-prestation__media tuile-4">
              ${media}
              <button class="bouton-icone fiche-prestation__agrandir" type="button"
                aria-label="Agrandir le visuel de la prestation">${icone('agrandir')}</button>
            </div>
            <figcaption>${esc(illustration.legende)}</figcaption>
          </figure>` : `<div class="fiche-prestation__media fiche-prestation__media--attente tuile-4">${media}</div>`}
        </div>
      </div>
    </section>
    <div class="conteneur fiche-prestation__suite">
      <div class="fiche-prestation__details">
        ${details.map(({ titre: titreSection, texte }) => `
          <section>
            <h2>${esc(titreSection)}</h2>
            <p>${esc(texte)}</p>
          </section>`).join('')}
        <a class="lien-fleche fiche-prestation__retour" href="index.html#prestations">${icone('gauche')}Toutes les prestations</a>
      </div>
      <aside class="fiche-prestation__demande tuile-2" aria-labelledby="prestation-demande">
        <h2 id="prestation-demande">Décrivez votre besoin</h2>
        <p>La prestation est présélectionnée dans le formulaire de demande.</p>
        <a class="bouton bouton--bleu" href="${pourDemande}">${icone('commandes')}Ouvrir le formulaire</a>
      </aside>
    </div>`;

  // La même visionneuse que sur l'accueil rend le focus au bouton après fermeture.
  const agrandir = contenu.querySelector('.fiche-prestation__agrandir');
  if (agrandir) agrandir.addEventListener('click', () => E.visionneuse.ouvrir([illustration], 0, agrandir));
})();
