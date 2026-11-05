/* =========================================================================
   ÉDYSOL NC — Règles des pièces jointes d'une demande (fonctions pures)
   Photos et documents du chantier joints par le client à sa demande.
   Aucune dépendance au navigateur : testé avec Node
   (outils/tester_pieces_jointes.js) et réutilisable côté serveur.

   Ce module décide :
   - quels formats sont acceptés (JPEG, PNG, WebP, PDF) ;
   - le type RÉEL d'un fichier, lu dans ses premiers octets (signature),
     sans se fier au nom ni au type annoncé par le navigateur ;
   - les limites de taille et de nombre (PARAMÈTRES À CONFIRMER) ;
   - qui peut consulter les pièces jointes d'une commande.
   Les durées de conservation et les droits de suppression ne sont PAS
   décidés : ils restent « à définir » et ne sont pas codés ici.
   ========================================================================= */
(function (racine) {
  'use strict';

  const MO = 1024 * 1024;

  /**
   * Limites proposées pour la maquette. Ce sont des PARAMÈTRES À CONFIRMER
   * par l'entreprise, pas des décisions. Ils sont modifiables à un seul endroit.
   */
  const PARAMETRES = {
    maxFichiers: 8,             // nombre de fichiers par demande
    maxOctetsParFichier: 10 * MO, // taille d'un fichier
    maxOctetsTotal: 30 * MO,    // total des fichiers d'une demande
    aConfirmer: true
  };

  /** Formats acceptés : type réel, extensions admises, libellé et catégorie d'affichage. */
  const FORMATS = {
    'image/jpeg': { extensions: ['jpg', 'jpeg'], libelle: 'JPEG', categorie: 'photo', extensionStockage: 'jpg' },
    'image/png': { extensions: ['png'], libelle: 'PNG', categorie: 'photo', extensionStockage: 'png' },
    'image/webp': { extensions: ['webp'], libelle: 'WebP', categorie: 'photo', extensionStockage: 'webp' },
    'application/pdf': { extensions: ['pdf'], libelle: 'PDF', categorie: 'document', extensionStockage: 'pdf' }
  };

  /** Valeur de l'attribut « accept » du champ fichier (filtre d'aide, PAS un contrôle). */
  const ACCEPT = Object.entries(FORMATS).flatMap(([type, f]) => [type, ...f.extensions.map(e => '.' + e)]).join(',');

  /** Nombre d'octets à lire au début d'un fichier pour reconnaître sa signature. */
  const OCTETS_SIGNATURE = 16;

  /**
   * Détermine le type réel d'un fichier d'après ses premiers octets.
   * Paramètre : tableau d'octets (Uint8Array ou Array). Retour : type MIME accepté, ou null.
   * Signatures : JPEG FF D8 FF ; PNG 89 50 4E 47 0D 0A 1A 0A ; WebP « RIFF » + « WEBP » ; PDF « %PDF- ».
   */
  function detecterType(octets) {
    const o = octets || [];
    const commence = (sig, decalage = 0) => sig.every((v, i) => o[decalage + i] === v);
    const ascii = s => [...s].map(c => c.charCodeAt(0));
    if (commence([0xFF, 0xD8, 0xFF])) return 'image/jpeg';
    if (commence([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return 'image/png';
    if (commence(ascii('RIFF')) && commence(ascii('WEBP'), 8)) return 'image/webp';
    if (commence(ascii('%PDF-'))) return 'application/pdf';
    return null;
  }

  /** Extension d'un nom de fichier, en minuscules (« » si absente). */
  function extension(nom) {
    const m = /\.([a-z0-9]{1,8})$/i.exec(String(nom || ''));
    return m ? m[1].toLowerCase() : '';
  }

  /**
   * Nom présentable du fichier d'origine : sans chemin, sans caractères de contrôle, 120 caractères au plus.
   * Ce nom sert seulement à l'affichage ; il n'est JAMAIS utilisé comme nom de stockage.
   */
  function nomAffichage(nom) {
    const sansChemin = String(nom || '').split(/[\\/]/).pop();
    const propre = sansChemin.replace(/[\u0000-\u001f\u007f<>]/g, '').trim();
    return (propre || 'fichier').slice(0, 120);
  }

  /** Taille lisible en français : « 850 Ko », « 2,4 Mo ». */
  function formaterTaille(octets) {
    if (!Number.isFinite(octets) || octets < 0) return '—';
    if (octets < 1024) return `${octets} octets`;
    if (octets < MO) return `${Math.round(octets / 1024)} Ko`;
    return `${(octets / MO).toFixed(1).replace(/\.0$/, '').replace('.', ',')} Mo`;
  }

  /** Phrase des formats et limites, affichée au client. */
  function texteLimites(p = PARAMETRES) {
    return `Photos JPEG, PNG ou WebP et documents PDF. ${p.maxFichiers} fichiers au maximum, ${formaterTaille(p.maxOctetsParFichier)} par fichier et ${formaterTaille(p.maxOctetsTotal)} au total.`;
  }

  /**
   * Contrôle UN fichier.
   * Paramètres : { nom, taille, typeDeclare }, premiers octets du fichier, paramètres.
   * Retour : { ok, type, categorie, erreur }. Le type retenu est le type RÉEL (signature).
   */
  function verifierFichier(fichier, octetsDebut, p = PARAMETRES) {
    const nom = nomAffichage(fichier && fichier.nom);
    const ext = extension(nom);
    const taille = Number(fichier && fichier.taille);
    if (['heic', 'heif'].includes(ext) || /heic|heif/i.test((fichier && fichier.typeDeclare) || '')) {
      return { ok: false, erreur: `« ${nom} » est au format HEIC, non accepté. Envoyez la photo en JPEG (sur iPhone : Réglages, Appareil photo, Formats, « Le plus compatible »).` };
    }
    const extensionsAdmises = Object.values(FORMATS).flatMap(f => f.extensions);
    if (!extensionsAdmises.includes(ext)) {
      return { ok: false, erreur: `« ${nom} » n’est pas accepté. Formats possibles : JPEG, PNG, WebP ou PDF.` };
    }
    if (!Number.isFinite(taille) || taille <= 0) return { ok: false, erreur: `« ${nom} » est vide ou illisible.` };
    if (taille > p.maxOctetsParFichier) {
      return { ok: false, erreur: `« ${nom} » est trop volumineux (${formaterTaille(taille)}). La limite est de ${formaterTaille(p.maxOctetsParFichier)} par fichier.` };
    }
    const type = detecterType(octetsDebut);
    if (!type) {
      return { ok: false, erreur: `« ${nom} » ne correspond pas à une vraie photo JPEG, PNG, WebP ou à un PDF : son contenu n’a pas été reconnu.` };
    }
    // Contenu et extension doivent désigner la même famille (photo ou document).
    if (FORMATS[type].categorie !== Object.values(FORMATS).find(f => f.extensions.includes(ext)).categorie) {
      return { ok: false, erreur: `« ${nom} » : le contenu (${FORMATS[type].libelle}) ne correspond pas à son extension .${ext}.` };
    }
    return { ok: true, type, categorie: FORMATS[type].categorie, erreur: '' };
  }

  /**
   * Contrôle l'ajout de nouveaux fichiers (déjà vérifiés un à un) à une sélection existante.
   * Paramètres : sélection actuelle [{ taille }], candidats [{ nom, taille, ... }], paramètres.
   * Retour : { acceptes, refuses: [{ fichier, erreur }] }. Les candidats sont pris dans l'ordre.
   */
  function verifierAjout(selection, candidats, p = PARAMETRES) {
    let nombre = selection.length;
    let total = selection.reduce((s, f) => s + f.taille, 0);
    const acceptes = [], refuses = [];
    for (const f of candidats) {
      if (nombre >= p.maxFichiers) { refuses.push({ fichier: f, erreur: `« ${nomAffichage(f.nom)} » n’a pas été ajouté : ${p.maxFichiers} fichiers au maximum par demande.` }); continue; }
      if (total + f.taille > p.maxOctetsTotal) { refuses.push({ fichier: f, erreur: `« ${nomAffichage(f.nom)} » n’a pas été ajouté : le total dépasserait ${formaterTaille(p.maxOctetsTotal)}.` }); continue; }
      acceptes.push(f); nombre += 1; total += f.taille;
    }
    return { acceptes, refuses };
  }

  /**
   * Nom de stockage généré (côté serveur en production) : identifiant aléatoire + extension
   * déduite du type RÉEL. Le nom fourni par le client n'est jamais utilisé, ce qui évite les
   * collisions, les chemins détournés et les doubles extensions exécutables.
   */
  function nomStockage(identifiant, type) {
    if (!FORMATS[type]) throw new Error('Type non accepté.');
    if (!/^[A-Za-z0-9-]{8,}$/.test(String(identifiant))) throw new Error('Identifiant de stockage invalide.');
    return `${identifiant}.${FORMATS[type].extensionStockage}`;
  }

  /**
   * Droit de consulter les pièces jointes d'UNE commande (à refaire côté serveur à chaque consultation).
   * Paramètres : acteur { role, personneId }, identifiant de commande,
   *              données { equipes, interventions, coordinations }.
   * Retour : { autorise, motif }.
   * Règles (reprises des droits de consultation déjà en place dans la maquette) :
   * - direction (cogérants) et secrétaire : toutes les commandes, comme le détail de commande ;
   * - employé ou contrôleuse : seulement si une intervention de CETTE commande est affectée
   *   à une équipe dont la personne est membre (mission affectée) ;
   * - contrôleuse : aussi si elle coordonne CETTE commande (vue coordination existante) ;
   * - toute autre personne, et le public : refusé.
   */
  function accesPiecesJointes(acteur, commandeId, donnees) {
    const role = acteur && acteur.role;
    if (role === 'cogerant' || role === 'secretaire') return { autorise: true, motif: 'Détail de commande (direction ou secrétariat).' };
    if (role !== 'employe' && role !== 'controleuse') return { autorise: false, motif: 'Profil sans accès aux pièces jointes.' };
    const d = donnees || {};
    const sesEquipes = (d.equipes || []).filter(e => e.membres.includes(acteur.personneId)).map(e => e.id);
    const affectee = (d.interventions || []).some(i => i.commandeId === commandeId && i.statut !== 'annulee' && sesEquipes.includes(i.equipeId));
    if (affectee) return { autorise: true, motif: 'Mission affectée à la personne.' };
    if (role === 'controleuse' && (d.coordinations || []).some(c => c.commandeId === commandeId && c.controleuseId === acteur.personneId)) {
      return { autorise: true, motif: 'Coordination de ce chantier.' };
    }
    return { autorise: false, motif: 'Aucune mission de cette commande n’est affectée à cette personne.' };
  }

  /** Décisions volontairement non prises : affichées telles quelles, jamais simulées comme validées. */
  const A_DEFINIR = [
    'Durée de conservation des photos et documents du chantier : à définir.',
    'Personnes autorisées à supprimer une pièce jointe : à définir.',
    'Limites de taille et de nombre : paramètres proposés, à confirmer.'
  ];

  const api = { PARAMETRES, FORMATS, ACCEPT, OCTETS_SIGNATURE, detecterType, extension, nomAffichage, formaterTaille, texteLimites,
    verifierFichier, verifierAjout, nomStockage, accesPiecesJointes, A_DEFINIR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.EdysolPiecesJointes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
