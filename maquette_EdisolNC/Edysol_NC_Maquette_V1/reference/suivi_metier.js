/**
 * Référence métier Édysol : compteurs, mouvements de stock et autorisations.
 * Ces fonctions pures sont testables, mais ne remplacent pas un serveur sécurisé.
 * Les tableaux reçus sont des exemples : aucun appel réseau ni secret n’est utilisé.
 */
(function (racine) {
  'use strict';

  /** Vérifie une condition métier ; lève une erreur avec le motif fourni. */
  function exiger(condition, motif) {
    if (!condition) throw new Error(motif);
  }

  /** Convertit une date horodatée avec fuseau en millisecondes ; rejette les dates ambiguës. */
  function instant(date) {
    exiger(typeof date === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(date), 'Fuseau du relevé obligatoire.');
    // Date.parse normalise parfois le 30 février : contrôler aussi les composants civils.
    const composants = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.exec(date);
    exiger(composants, 'Date et heure complètes requises.');
    const jour = new Date(composants[1]+'-'+composants[2]+'-'+composants[3]+'T00:00:00Z');
    exiger(jour.getUTCFullYear() === Number(composants[1]) && jour.getUTCMonth()+1 === Number(composants[2])
      && jour.getUTCDate() === Number(composants[3]) && Number(composants[4]) < 24
      && Number(composants[5]) < 60 && Number(composants[6] || 0) < 60, 'Date civile invalide.');
    const valeur = Date.parse(date);
    exiger(Number.isFinite(valeur), 'Date du relevé invalide.');
    return valeur;
  }

  /**
   * Valide la rubrique véhicule d’un compte rendu et retourne les données normalisées.
   * Paramètre : saisie contenant rapportId, employeId, dateReleve, vehiculeId et compteur.
   * Retour : null si aucun véhicule ; sinon un relevé. L’identité réelle doit venir du serveur.
   */
  function normaliserReleve(saisie) {
    exiger(saisie.rapportId && saisie.employeId, 'Compte rendu et employé obligatoires.');
    if (!saisie.vehiculeId) {
      exiger(saisie.compteur === null || saisie.compteur === undefined || saisie.compteur === '', 'Aucun véhicule : ne pas conserver de compteur.');
      return null;
    }
    exiger(saisie.compteur !== '' && saisie.compteur !== null && saisie.compteur !== undefined, 'Compteur obligatoire.');
    const compteur = Number(saisie.compteur);
    exiger(Number.isFinite(compteur) && compteur >= 0, 'Le compteur doit être un nombre positif ou nul.');
    instant(saisie.dateReleve);
    return {...saisie, compteur};
  }

  /**
   * Retrouve la version courante d’un relevé à partir de son historique append-only.
   * Paramètre : toutes les révisions. Retour : la dernière révision de chaque relevé logique.
   */
  function revisionsCourantes(historique) {
    const courantes = new Map();
    for (const r of historique) {
      const precedent = courantes.get(r.releveId);
      if (!precedent || r.revision > precedent.revision) courantes.set(r.releveId, r);
    }
    return [...courantes.values()].filter(r => !r.retire);
  }

  /**
   * Insère un relevé ou une correction sans effacer l’original.
   * Paramètres : historique immuable et commande avec idempotence, auteur et motif de correction.
   * Retour : nouvel historique. Une répétition de la même requête ne crée pas de doublon.
   * À intégrer dans une transaction serveur avec contrôle de droits et verrou/version attendu.
   */
  function enregistrerReleve(historique, commande) {
    exiger(commande.cleIdempotence && commande.auteur, 'Clé d’idempotence et auteur requis.');
    instant(commande.dateSaisie);
    const precedentAppel = historique.find(r => r.cleIdempotence === commande.cleIdempotence);
    const signature = JSON.stringify([commande.rapportId, commande.employeId, commande.vehiculeId || null,
      commande.compteur === '' || commande.compteur == null ? null : Number(commande.compteur),
      commande.dateReleve || null, commande.corrigeReleveId || null, commande.motif || null, commande.revisionAttendue || null]);
    if (precedentAppel) {
      exiger(precedentAppel.signature === signature, 'Clé d’idempotence réutilisée avec un autre contenu.');
      return historique;
    }
    const valeur = normaliserReleve(commande);
    const courants = revisionsCourantes(historique);
    let ancien = null;
    if (commande.corrigeReleveId) {
      ancien = courants.find(r => r.releveId === commande.corrigeReleveId);
      exiger(ancien && ancien.rapportId === commande.rapportId && ancien.employeId === commande.employeId,
        'Origine de correction incohérente.');
      exiger(commande.motif && commande.motif.trim(), 'Motif de correction obligatoire.');
      exiger(commande.revisionAttendue === ancien.revision, 'Conflit de révision : relire le relevé.');
    }
    if (!valeur && !ancien) return historique;
    if (valeur) exiger(!courants.some(r => r.rapportId === valeur.rapportId && r.vehiculeId === valeur.vehiculeId && r.releveId !== ancien?.releveId),
      'Un relevé existe déjà pour ce compte rendu et ce véhicule : utiliser une correction.');
    const revision = {
      ...commande, ...(valeur || {}),
      compteur: valeur ? valeur.compteur : null,
      retire: !valeur,
      releveId: ancien ? ancien.releveId : commande.cleIdempotence,
      revision: ancien ? ancien.revision + 1 : 1,
      signature,
    };
    return [...historique, revision];
  }

  /**
   * Projette l’historique d’un véhicule selon la date réelle du compteur.
   * Paramètres : révisions et véhicule. Retour : lignes, dernier relevé daté et anomalies.
   * Ne calcule aucune distance ; ne somme jamais les kilométrages au compteur.
   */
  function suiviVehicule(historique, vehiculeId) {
    const lignes = revisionsCourantes(historique).filter(r => r.vehiculeId === vehiculeId)
      .sort((a, b) => instant(a.dateReleve) - instant(b.dateReleve) || a.releveId.localeCompare(b.releveId));
    const anomalies = [];
    for (let i = 1; i < lignes.length; i++) {
      const a = lignes[i - 1], b = lignes[i];
      if (instant(a.dateReleve) === instant(b.dateReleve) && a.compteur !== b.compteur)
        anomalies.push({type: 'DATE_IDENTIQUE', ids: [a.releveId, b.releveId]});
      else if (b.compteur < a.compteur)
        anomalies.push({type: 'COMPTEUR_INFERIEUR', ids: [a.releveId, b.releveId]});
    }
    const derniereDate = lignes.length ? instant(lignes[lignes.length - 1].dateReleve) : null;
    const derniers = lignes.filter(r => instant(r.dateReleve) === derniereDate);
    const ambigu = new Set(derniers.map(r => r.compteur)).size > 1;
    return {lignes, dernier: ambigu ? null : derniers[0] || null, derniers, ambigu, anomalies};
  }

  /**
   * Convertit une quantité décimale en milli-unités entières, sans arrondi flottant.
   * Paramètre : texte à trois décimales au maximum. Retour : entier signé.
   * La précision de trois décimales est une proposition technique à confirmer.
   */
  function quantiteMilli(texte) {
    const valeur = String(texte).replace(',', '.');
    exiger(/^-?\d+(\.\d{1,3})?$/.test(valeur), 'Quantité invalide (trois décimales maximum dans cette référence).');
    const signe = valeur.startsWith('-') ? -1 : 1;
    const [entier, fraction = ''] = valeur.replace('-', '').split('.');
    const resultat = signe * (Number(entier) * 1000 + Number(fraction.padEnd(3, '0')));
    exiger(Number.isSafeInteger(resultat), 'Quantité hors plage.');
    return resultat;
  }

  /**
   * Ajoute un mouvement motivé dans l’unité de référence de l’article.
   * Paramètres : historique, article et mouvement. Retour : nouvel historique immuable.
   * Une correction de stock utilise un nouveau mouvement ; elle ne réécrit pas le passé.
   */
  function mouvementStock(historique, article, mouvement) {
    exiger(mouvement.id && mouvement.auteur && mouvement.motif?.trim(), 'Identifiant, auteur et motif requis.');
    instant(mouvement.date);
    exiger(mouvement.articleId === article.id && mouvement.unite === article.unite, 'Article ou unité incohérente.');
    exiger(['ENTREE', 'SORTIE', 'AJUSTEMENT'].includes(mouvement.type), 'Type de mouvement invalide.');
    exiger(Number.isSafeInteger(mouvement.quantiteMilli) && mouvement.quantiteMilli !== 0, 'Quantité entière non nulle requise.');
    exiger(mouvement.type === 'AJUSTEMENT' || mouvement.quantiteMilli > 0, 'Entrées et sorties attendent une quantité positive.');
    if (article.nature === 'DURABLE') exiger(mouvement.quantiteMilli % 1000 === 0, 'Un matériel durable ne se fractionne pas dans cette référence.');
    const existant = historique.find(m => m.id === mouvement.id);
    if (existant) {
      exiger(JSON.stringify(existant) === JSON.stringify(mouvement), 'Mouvement déjà enregistré avec un autre contenu.');
      return historique;
    }
    return [...historique, {...mouvement}];
  }

  /** Calcule le stock d’un article dans son unité ; retourne quantité et éventuelle alerte. */
  function stockCourant(mouvements, articleId) {
    const milli = mouvements.filter(m => m.articleId === articleId).reduce((s, m) =>
      s + (m.type === 'SORTIE' ? -m.quantiteMilli : m.quantiteMilli), 0);
    return {quantite: milli / 1000, alerte: milli < 0 ? 'STOCK_NEGATIF_A_EXAMINER' : null};
  }

  /** Compare un comptage physique au stock figé ; retourne l’écart, sans ajuster le stock. */
  function ecartInventaire(stockFigeMilli, compteMilli) {
    exiger(Number.isSafeInteger(stockFigeMilli) && Number.isSafeInteger(compteMilli) && compteMilli >= 0, 'Comptage invalide.');
    return (compteMilli - stockFigeMilli) / 1000;
  }

  /**
   * Politique de référence à exécuter SUR LE SERVEUR après authentification.
   * Paramètres : acteur issu de la session et permission demandée. Retour : autorisé ou non.
   * Les droits de modification restent fermés sans attribution explicite, encore à définir.
   */
  function autoriserComptabilite(acteur, permission) {
    if (!acteur || !['secretaire', 'cogerant'].includes(acteur.role)) return false;
    if (permission === 'comptabilite:lire') return true;
    return ['stocks:ecrire', 'inventaire:ecrire', 'releves:corriger'].includes(permission)
      && Array.isArray(acteur.permissions) && acteur.permissions.includes(permission);
  }

  const api = {normaliserReleve, enregistrerReleve, revisionsCourantes, suiviVehicule,
    quantiteMilli, mouvementStock, stockCourant, ecartInventaire, autoriserComptabilite};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.EdysolMetier = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
