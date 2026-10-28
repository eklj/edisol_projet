/* Évolution des trois vues publiques ÉDYSOL : présentation et galeries.
 * Les commandes et les interfaces internes sont conservées par le routeur existant.
 * Aucun contenu photographique non autorisé n'est chargé par ce module.
 */
(function () {
  'use strict';
  const vues=new Set(['p-accueil','p-entreprise','p-prestations']);
  const controles=[];
  let galerie=null;
  const mouvement=window.matchMedia('(prefers-reduced-motion: reduce)');
  const economie=Boolean(navigator.connection?.saveData);
  const logo='LOGO_EDYSOL_DATA';

  /** Échappe du texte inclus dans un fragment HTML.
   * @param {string} valeur Texte à afficher. @returns {string} Texte échappé.
   */
  function echapper(valeur) {return String(valeur??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  /** Accepte un chemin d'image local, une URL HTTPS ou une image incorporée.
   * @param {string} valeur Source proposée. @returns {boolean} Source utilisable.
   */
  function sourceValide(valeur) {return typeof valeur==='string'&&valeur.length>0&&!/^\s*(javascript|vbscript):/i.test(valeur)&&(/^(https:\/\/|data:image\/(png|jpeg|webp|avif|gif);base64,)/i.test(valeur)||(!valeur.includes(':')&&!valeur.startsWith('//')));}

  /** Filtre les photos validées ; en leur absence, conserve des emplacements honnêtes.
   * @param {Array} catalogue Photos d'une même prestation. @returns {object} Images et état éditorial.
   */
  function selectionner(catalogue=[]) {
    const autorisees=catalogue.filter(p=>p.publicationAutorisee===true&&p.confidentialiteVerifiee===true&&sourceValide(p.src)&&p.alt&&Number(p.width)>0&&Number(p.height)>0);
    if(autorisees.length)return {elements:autorisees,reelles:true};
    return {elements:catalogue.length?catalogue:[{titre:'Photo réelle à fournir',texte:'Aucune photo autorisée n’est disponible.',alt:'Emplacement réservé à une photo réelle.'}],reelles:false};
  }

  /** Retourne un emplacement purement graphique, sans photographie fictive.
   * @returns {string} Fragment décoratif identifié comme photo manquante.
   */
  function emplacement() {return '<div class="ed-placeholder"><svg viewBox="0 0 64 48" aria-hidden="true"><rect x="2" y="2" width="60" height="44" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="45" cy="15" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 39 23 22 35 33 43 27 59 41" fill="none" stroke="currentColor" stroke-width="2"/></svg><strong>Photo réelle à fournir</strong><small>Emplacement de maquette · aucun chantier illustré</small></div>';}

  /** Produit l'ossature accessible d'un carrousel, utilisable avant son montage.
   * @param {string} cle Identifiant éditorial. @param {string} titre Nom de galerie. @returns {string} HTML.
   */
  function carrousel(cle,titre) {
    const premier=window.EdysolPhotos[cle]?.[0]||{titre,texte:'Photos autorisées à fournir.'};
    return `<section class="ed-carousel" data-gallery="${echapper(cle)}" aria-roledescription="carrousel" aria-label="${echapper(titre)}">
      <button type="button" class="ed-open" aria-label="Agrandir : ${echapper(titre)}"><span class="ed-media">${emplacement()}<span class="ed-enlarge">Agrandir ↗</span></span></button>
      <div class="ed-caption"><h3>${echapper(premier.titre)}</h3><p>${echapper(premier.texte)}</p></div>
      <div class="ed-controls"><button type="button" data-action="precedent" aria-label="Photo précédente : ${echapper(titre)}">←</button><button type="button" data-action="suivant" aria-label="Photo suivante : ${echapper(titre)}">→</button><button type="button" data-action="pause">Pause</button><output class="ed-count" aria-live="off"></output><div class="ed-dots" aria-label="Choisir une photo"></div><span class="ed-state"></span></div>
      <span class="ed-sr" aria-live="polite" data-annonce></span>
    </section>`;
  }

  /** Produit la navigation publique et conserve les destinations du routeur.
   * @param {string} id Vue active. @returns {string} Barre de navigation.
   */
  function entete(id) {return `<div class="ed-site-header"><nav class="ed-container ed-nav" aria-label="Navigation du site ÉDYSOL"><a class="ed-logo" href="#p-accueil" aria-label="ÉDYSOL — Accueil"><img src="${logo}" width="390" height="225" alt="ÉDYSOL — Entretien, nettoyage, services"></a><div class="ed-links">${[['p-accueil','Accueil'],['p-entreprise','L’entreprise'],['p-prestations','Prestations'],['p-contact','Contact']].map(([l,t])=>`<a href="#${l}"${l===id?' aria-current="page"':''}>${t}</a>`).join('')}<a class="ed-cta" href="#p-commande">Faire une demande</a><a class="ed-team" href="#connexion">Espace équipe</a></div></nav></div>`;}

  /** Produit un appel à l'action vers le formulaire existant.
   * @returns {string} Deux liens publics déjà présents dans la maquette.
   */
  function actions() {return '<div class="ed-actions"><a class="ed-cta" href="#p-commande">Demander une prestation</a><a class="ed-cta ed-cta-secondary" href="#p-contact">Échanger avec nous</a></div>';}

  /** Produit la présentation d'une prestation sans inventer de catalogue validé.
   * @param {string} cle Galerie liée à cette prestation. @param {string} nom Intitulé actuel. @param {string} texte Présentation. @returns {string} Section.
   */
  function prestation(cle,nom,texte) {return `<article class="ed-service"><div class="ed-service-copy"><span class="ed-service-tag">${cle==='specifique'?'Votre besoin':'Catalogue à confirmer'}</span><h2>${nom}</h2><p>${texte}</p>${actions()}</div>${carrousel(cle,nom)}</article>`;}

  /** Construit une vue publique responsive dans sa palette actuelle.
   * @param {string} id Vue existante. @param {string} variante Palette conservée. @returns {string} HTML de la vue.
   */
  function rendre(id,variante='Bleue') {
    const themes={Bleue:'--ed-bg:#274D66;--ed-panel:#365C48;--ed-card:#DCE8EE;',Verte:'--ed-bg:#365C48;--ed-panel:#274D66;--ed-card:#DFEADF;',Mixte:'--ed-bg:#274D66;--ed-panel:#365C48;--ed-card:#DFEADF;'};
    let contenu='';
    if(id==='p-accueil')contenu=`<div class="ed-container ed-hero"><div><span class="ed-eyebrow">ÉDYSOL · Nouvelle-Calédonie</span><h1>Le soin des lieux.<br>Le travail en images.</h1><p class="ed-lead">Découvrez l’entreprise, ses équipes et ses prestations. Décrivez votre besoin : nous organisons la suite avec vous.</p>${actions()}<p class="ed-note" style="margin-top:20px">Les photographies de cette présentation seront ajoutées après validation par l’entreprise.</p></div>${carrousel('entreprise','L’entreprise en images')}</div>
      <section class="ed-section ed-section-alt"><div class="ed-container"><div class="ed-section-head"><div><span class="ed-eyebrow">L’entreprise</span><h2>Un savoir-faire à montrer,<br>une équipe à découvrir.</h2></div><p>Des images des équipes, des gestes du métier et des chantiers accompagneront la présentation d’ÉDYSOL.</p></div><div class="ed-grid"><article class="ed-info-card"><h3>Les personnes</h3><p>Présenter les équipes sur le terrain, avec les autorisations adaptées.</p></article><article class="ed-info-card"><h3>Le travail réalisé</h3><p>Associer chaque image à une explication concrète du geste et de la prestation.</p></article><article class="ed-info-card"><h3>Les réalisations</h3><p>Montrer des chantiers réels et autorisés, sans exposer les informations des clients.</p></article></div><div class="ed-actions"><a class="ed-cta ed-cta-secondary" href="#p-entreprise">Découvrir l’entreprise</a></div></div></section>
      <section class="ed-section ed-container"><span class="ed-eyebrow">Les prestations</span><h2>Une galerie pour chaque besoin.</h2><p class="ed-lead">Chaque prestation dispose de sa propre sélection de photos : aucune image d’un autre service n’est utilisée pour la représenter.</p><p class="ed-catalogue-note">Les intitulés « Prestation A » et « Prestation B » de la maquette restent à remplacer par le catalogue validé d’ÉDYSOL.</p>${prestation('prestationA','Prestation A','Intitulé et périmètre à confirmer avec l’entreprise. Les emplacements ci-contre accueilleront uniquement les photos correspondant à cette prestation.')}${prestation('prestationB','Prestation B','Une sélection distincte pour présenter le travail et le résultat de cette prestation, lorsque les photos autorisées seront disponibles.')}</section>`;
    if(id==='p-entreprise')contenu=`<div class="ed-container ed-hero"><div><span class="ed-eyebrow">L’entreprise</span><h1>Des équipes,<br>des gestes,<br>des réalisations.</h1><p class="ed-lead">ÉDYSOL accompagne vos besoins de ménage et de nettoyage en Nouvelle-Calédonie. Cette présentation mettra en relation les équipes, leur travail et les lieux d’intervention.</p>${actions()}</div>${carrousel('entreprise','Équipes et chantiers ÉDYSOL')}</div><section class="ed-section ed-section-alt"><div class="ed-container"><div class="ed-section-head"><div><span class="ed-eyebrow">Au fil des images</span><h2>Comprendre ce qui est fait.</h2></div><p>La légende de chaque photographie explique son contexte. La galerie permet d’examiner les détails, sans mouvement imposé.</p></div><div class="ed-grid"><article class="ed-info-card"><h3>Une équipe coordonnée</h3><p>Les informations utiles sont transmises aux personnes concernées par chaque intervention.</p></article><article class="ed-info-card"><h3>Un besoin identifié</h3><p>Le lieu, les tâches et le créneau sont précisés avec le client au fil de la demande.</p></article><article class="ed-info-card"><h3>Des images fidèles</h3><p>Les photos réelles viendront illustrer le travail d’ÉDYSOL, après validation de leur publication.</p></article></div></div></section>`;
    if(id==='p-prestations')contenu=`<section class="ed-section ed-container"><span class="ed-eyebrow">Les prestations</span><h1>Le bon service.<br>Les bonnes images.</h1><p class="ed-lead">Parcourez les galeries liées à chaque prestation et agrandissez une image pour en voir les détails.</p><p class="ed-catalogue-note">Le catalogue de services et les photos de chantiers sont encore à valider. Les emplacements ne représentent pas des réalisations d’ÉDYSOL.</p>${prestation('prestationA','Prestation A','Le nom de cette prestation et sa description seront précisés avec l’entreprise. Deux emplacements distincts sont prévus pour le travail réalisé et le résultat.')}${prestation('prestationB','Prestation B','Cette galerie est réservée à cette prestation. Elle utilisera plusieurs photos si elles sont disponibles et autorisées.')}${prestation('specifique','Demande spécifique','Vous ne trouvez pas votre besoin ? Décrivez-le dans le formulaire ou contactez la secrétaire pour préparer votre demande.')}</section>`;
    return `<div class="ed-public" style="${themes[variante]||themes.Bleue}">${entete(id)}${contenu}<footer class="ed-footer"><div class="ed-container"><span>ÉDYSOL · Nouvelle-Calédonie</span><a href="#p-commande">Accéder au formulaire de demande</a><a href="#p-contact">Contact</a><a href="#connexion">Espace équipe</a></div></footer></div>`;
  }

  /** Ajoute l'image autorisée ou un emplacement, sans variation de hauteur.
   * @param {HTMLElement} media Conteneur réservé. @param {object} photo Élément sélectionné. @param {boolean} reelle Photo autorisée. @param {boolean} prioritaire Chargement immédiat utile. @returns {void}
   */
  function remplirMedia(media,photo,reelle,prioritaire=false) {
    media.replaceChildren();
    if(!reelle){media.innerHTML=emplacement();return;}
    const img=document.createElement('img');img.alt=photo.alt;img.width=Number(photo.width);img.height=Number(photo.height);img.loading=prioritaire?'eager':'lazy';img.decoding='async';
    if(photo.srcset){const candidats=photo.srcset.split(',').map(s=>s.trim().split(/\s+/));if(candidats.every(([src,w])=>sourceValide(src)&&/^\d+w$/.test(w||''))){img.srcset=photo.srcset;img.sizes='(max-width:760px) calc(100vw - 36px), 560px';}}
    img.addEventListener('error',()=>{media.innerHTML=emplacement();media.querySelector('strong').textContent='Photo indisponible';media.querySelector('small').textContent='La présentation reste accessible.';},{once:true});
    img.src=photo.src;media.append(img);
    if(!mouvement.matches&&typeof img.animate==='function')img.animate([{opacity:.5},{opacity:1}],{duration:450,easing:'ease-out'});
  }

  class Carrousel {
    /** Initialise une galerie et ses interactions.
     * @param {HTMLElement} element Section accessible. @param {boolean} prioritaire Première galerie visible.
     */
    constructor(element,prioritaire=false) {
      this.element=element;this.prioritaire=prioritaire;this.selection=selectionner(window.EdysolPhotos[element.dataset.gallery]||[]);this.photos=this.selection.elements;this.index=0;this.pauseUtilisateur=false;this.survole=false;this.visible=true;this.timer=null;this.detruit=false;this.nettoyages=[];
      this.ouvrir=element.querySelector('.ed-open');this.media=element.querySelector('.ed-media');this.pause=element.querySelector('[data-action="pause"]');this.annonce=element.querySelector('[data-annonce]');
      this.ecouter(element.querySelector('[data-action="precedent"]'),'click',()=>this.deplacer(-1,true));this.ecouter(element.querySelector('[data-action="suivant"]'),'click',()=>this.deplacer(1,true));
      this.ecouter(this.pause,'pointerdown',()=>{this.pauseDemandee=!this.pauseUtilisateur;});
      this.ecouter(this.pause,'click',()=>{this.pauseUtilisateur=this.pauseDemandee??!this.pauseUtilisateur;this.pauseDemandee=undefined;this.actualiserEtat();});this.ecouter(this.ouvrir,'click',()=>ouvrirGalerie(this));
      this.ecouter(element,'keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();this.deplacer(event.key==='ArrowRight'?1:-1,true);}});
      this.ecouter(element,'focusin',()=>{this.pauseUtilisateur=true;this.actualiserEtat();});
      this.ecouter(element,'mouseenter',()=>{this.survole=true;this.planifier();});this.ecouter(element,'mouseleave',()=>{this.survole=false;this.planifier();});
      this.ecouter(document,'visibilitychange',()=>this.planifier());
      this.reduction=()=>{if(mouvement.matches)this.pauseUtilisateur=true;this.actualiserEtat();};mouvement.addEventListener('change',this.reduction);this.nettoyages.push(()=>mouvement.removeEventListener('change',this.reduction));
      let depart=null;
      this.ecouter(this.ouvrir,'pointerdown',event=>{depart={x:event.clientX,y:event.clientY};});
      this.ecouter(this.ouvrir,'pointercancel',()=>{depart=null;});
      this.ecouter(this.ouvrir,'pointerup',event=>{if(!depart)return;const dx=event.clientX-depart.x,dy=event.clientY-depart.y;depart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){this.deplacer(dx<0?1:-1,true);this.ignoreClick=true;setTimeout(()=>{this.ignoreClick=false;},250);}});
      const points=element.querySelector('.ed-dots');
      this.photos.forEach((photo,i)=>{const bouton=document.createElement('button');bouton.type='button';bouton.className='ed-dot';bouton.textContent=String(i+1);bouton.setAttribute('aria-label','Afficher la photo '+(i+1));this.ecouter(bouton,'click',()=>this.afficher(i,true));points.append(bouton);});
      if('IntersectionObserver' in window){this.observateur=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.planifier();},{threshold:.12});this.observateur.observe(element);}
      this.afficher(0,false);
    }

    /** Enregistre un événement et sa désinscription.
     * @param {EventTarget} cible Objet écouté. @param {string} type Événement. @param {Function} action Gestionnaire. @returns {void}
     */
    ecouter(cible,type,action) {cible.addEventListener(type,action);this.nettoyages.push(()=>cible.removeEventListener(type,action));}

    /** Change d'image en bouclant dans la galerie.
     * @param {number} pas Sens du déplacement. @param {boolean} manuel Interaction utilisateur. @returns {void}
     */
    deplacer(pas,manuel) {this.afficher(this.index+pas,manuel);}

    /** Affiche une photo et ses légendes ; les annonces vocales restent manuelles.
     * @param {number} indice Position demandée. @param {boolean} manuel Origine de la demande. @returns {void}
     */
    afficher(indice,manuel) {
      this.index=(indice+this.photos.length)%this.photos.length;
      if(manuel)this.pauseUtilisateur=true;
      const photo=this.photos[this.index];
      remplirMedia(this.media,photo,this.selection.reelles,this.prioritaire&&this.index===0);
      const agrandir=document.createElement('span');agrandir.className='ed-enlarge';agrandir.textContent='Agrandir ↗';this.media.append(agrandir);
      this.ouvrir.setAttribute('aria-label','Agrandir : '+photo.titre);
      this.element.querySelector('.ed-caption h3').textContent=photo.titre;this.element.querySelector('.ed-caption p').textContent=photo.texte||'';
      this.element.querySelector('.ed-count').textContent=(this.index+1)+' / '+this.photos.length;
      this.element.querySelectorAll('.ed-dot').forEach((n,i)=>n.setAttribute('aria-current',i===this.index?'true':'false'));
      for(const n of this.element.querySelectorAll('[data-action="precedent"],[data-action="suivant"]'))n.disabled=this.photos.length<2;
      if(manuel)this.annonce.textContent='Image '+(this.index+1)+' sur '+this.photos.length+' : '+photo.titre;
      this.actualiserEtat();
    }

    /** Met à jour les commandes selon les préférences, les photos et la pause.
     * @returns {void}
     */
    actualiserEtat() {
      const possible=this.selection.reelles&&this.photos.length>1&&!mouvement.matches&&!economie;
      this.pause.disabled=!possible;this.pause.textContent=this.pauseUtilisateur?'Reprendre':'Pause';this.pause.setAttribute('aria-label',this.pauseUtilisateur?'Reprendre le diaporama':'Mettre le diaporama en pause');
      this.element.querySelector('.ed-state').textContent=mouvement.matches?'Animations réduites : navigation manuelle.':economie?'Économie de données : navigation manuelle.':!this.selection.reelles?'Emplacements en attente de photos autorisées.':this.photos.length<2?'Une seule photo : défilement désactivé.':this.pauseUtilisateur?'Diaporama en pause.':'Défilement doux toutes les 7 secondes.';
      this.planifier();
    }

    /** Programme une seule avance ; aucun minuteur ne subsiste hors de la vue.
     * @returns {void}
     */
    planifier() {
      clearTimeout(this.timer);this.timer=null;
      if(this.detruit||this.pauseUtilisateur||this.survole||!this.visible||document.hidden||mouvement.matches||economie||!this.selection.reelles||this.photos.length<2||galerie?.controle===this)return;
      this.timer=setTimeout(()=>this.deplacer(1,false),7000);
    }

    /** Libère les événements et minuteurs lorsque la route change.
     * @returns {void}
     */
    detruire() {this.detruit=true;clearTimeout(this.timer);this.observateur?.disconnect();this.nettoyages.forEach(f=>f());}
  }

  /** Actualise le contenu agrandi depuis le même jeu de photos que le carrousel.
   * @returns {void}
   */
  function afficherGalerie() {
    if(!galerie)return;
    const {dialogue,controle}=galerie,photo=controle.photos[controle.index];
    dialogue.querySelector('h2').textContent=photo.titre;
    remplirMedia(dialogue.querySelector('.ed-media'),photo,controle.selection.reelles,true);
    dialogue.querySelector('.ed-lightbox-caption').textContent=photo.texte||'';
    dialogue.querySelector('output').textContent=(controle.index+1)+' / '+controle.photos.length;
    dialogue.querySelectorAll('[data-gallery-step]').forEach(n=>n.disabled=controle.photos.length<2);
  }

  /** Ferme la galerie et restitue le focus à la commande d'agrandissement.
   * @returns {void}
   */
  function fermerGalerie() {
    if(!galerie)return;
    const ancienne=galerie;galerie=null;
    ancienne.dialogue.close();ancienne.dialogue.remove();
    if(ancienne.retour?.isConnected)ancienne.retour.focus();
    ancienne.controle.planifier();
  }

  /** Ouvre une boîte modale native avec fermeture et navigation clavier.
   * @param {Carrousel} controle Galerie à agrandir. @returns {void}
   */
  function ouvrirGalerie(controle) {
    if(controle.ignoreClick)return;
    fermerGalerie();controle.pauseUtilisateur=true;controle.actualiserEtat();
    const dialogue=document.createElement('dialog');dialogue.className='ed-lightbox';dialogue.setAttribute('aria-label','Galerie de photos');
    dialogue.innerHTML='<div class="ed-lightbox-top"><h2></h2><button type="button" data-fermer aria-label="Fermer la galerie">Fermer ×</button></div><div class="ed-media"></div><p class="ed-lightbox-caption"></p><div class="ed-lightbox-controls"><button type="button" data-gallery-step="-1" aria-label="Photo précédente">← Précédente</button><output aria-live="polite"></output><button type="button" data-gallery-step="1" aria-label="Photo suivante">Suivante →</button></div>';
    document.body.append(dialogue);galerie={dialogue,controle,retour:controle.ouvrir};
    dialogue.querySelector('[data-fermer]').addEventListener('click',fermerGalerie);
    dialogue.addEventListener('cancel',e=>{e.preventDefault();fermerGalerie();});
    dialogue.addEventListener('click',e=>{if(e.target===dialogue){const r=dialogue.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)fermerGalerie();}});
    dialogue.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();controle.deplacer(e.key==='ArrowRight'?1:-1,true);afficherGalerie();}});
    dialogue.querySelectorAll('[data-gallery-step]').forEach(b=>b.addEventListener('click',()=>{controle.deplacer(Number(b.dataset.galleryStep),true);afficherGalerie();}));
    afficherGalerie();dialogue.showModal();dialogue.querySelector('[data-fermer]').focus();
  }

  /** Nettoie la vue publique avant de rendre une autre route.
   * @returns {void}
   */
  function demonter() {fermerGalerie();controles.splice(0).forEach(c=>c.detruire());}

  /** Branche les galeries de la vue affichée.
   * @param {HTMLElement} racine Conteneur rendu. @returns {void}
   */
  function monter(racine) {racine.querySelectorAll('[data-gallery]').forEach((n,i)=>controles.push(new Carrousel(n,i===0)));}

  window.EdysolPublic={contient:id=>vues.has(id),rendre,monter,demonter,selectionner,etat:()=>controles.map(c=>({cle:c.element.dataset.gallery,index:c.index,photos:c.photos.length,reelles:c.selection.reelles,pause:c.pauseUtilisateur,minuteur:!!c.timer}))};
}());
