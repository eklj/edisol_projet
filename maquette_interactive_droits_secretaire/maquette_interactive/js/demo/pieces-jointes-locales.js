/* =========================================================================
   ÉDYSOL NC — Stockage LOCAL des pièces jointes (simulation, SANS serveur)
   Les fichiers choisis par le client sont copiés dans la base IndexedDB
   de CE navigateur. Ils ne sont transmis à personne :
   - pas d'envoi aux employés, pas de synchronisation entre appareils ;
   - conservation jusqu'à « Réinitialiser la démo » ou jusqu'à l'effacement
     des données du site par le navigateur ;
   - la durée de conservation réelle reste à définir.
   Si IndexedDB est indisponible (navigation privée, réglage du navigateur),
   les fichiers restent en mémoire et disparaissent au changement de page :
   l'écran l'indique au lieu de faire croire à un enregistrement.
   En production, ce module est remplacé par un transfert vers un stockage
   PRIVÉ sur le serveur (voir LIRE_MOI.md, « Pièces jointes »).
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};
  const BASE = 'edysol-maquette-fichiers', MAGASIN = 'fichiers';
  const memoire = new Map(); // repli si IndexedDB est indisponible
  let promesseBase = null;
  let echecSimule = false;   // outil de test : fait échouer le prochain transfert

  /** Ouvre (une seule fois) la base locale. Retour : promesse d'une base, ou null si indisponible. */
  function base() {
    if (promesseBase) return promesseBase;
    promesseBase = new Promise(resoudre => {
      try {
        if (!racine.indexedDB) { resoudre(null); return; }
        const demande = racine.indexedDB.open(BASE, 1);
        demande.onupgradeneeded = () => demande.result.createObjectStore(MAGASIN, { keyPath: 'id' });
        demande.onsuccess = () => resoudre(demande.result);
        demande.onerror = () => resoudre(null);
        demande.onblocked = () => resoudre(null);
      } catch (e) { resoudre(null); }
    });
    return promesseBase;
  }

  /** Exécute une opération sur le magasin. Retour : promesse du résultat de la requête. */
  async function operation(mode, action) {
    const db = await base();
    if (!db) return action(null);
    return new Promise((resoudre, rejeter) => {
      const tx = db.transaction(MAGASIN, mode);
      const requete = action(tx.objectStore(MAGASIN));
      let resultat;
      if (requete) requete.onsuccess = () => { resultat = requete.result; };
      tx.oncomplete = () => resoudre(resultat);
      tx.onerror = () => rejeter(tx.error || new Error('Écriture locale refusée.'));
      tx.onabort = () => rejeter(tx.error || new Error('Écriture locale interrompue.'));
    });
  }

  /** Indique si les fichiers survivent au changement de page (IndexedDB disponible). */
  async function estPersistant() { return Boolean(await base()); }

  /** Identifiant aléatoire non devinable (sert aussi de nom de stockage). */
  function nouvelIdentifiant() {
    if (racine.crypto && racine.crypto.randomUUID) return racine.crypto.randomUUID();
    return 'pj-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  /**
   * « Transfère » les fichiers vers le stockage local, en une seule transaction :
   * soit tous sont enregistrés, soit aucun (pas de demi-transfert).
   * Paramètre : [{ fichier: Blob, nom, type, taille }]. Les fichiers sont marqués « provisoires »
   * tant qu'ils ne sont pas associés à une commande.
   * Retour : promesse des métadonnées [{ id, nom, type, taille, ajouteLe }].
   */
  async function enregistrerProvisoires(liste) {
    const metas = liste.map(f => ({ id: nouvelIdentifiant(), nom: f.nom, type: f.type, taille: f.taille, ajouteLe: new Date().toISOString() }));
    if (echecSimule) { echecSimule = false; throw new Error('Transfert interrompu (échec simulé).'); }
    const db = await base();
    if (!db) {
      liste.forEach((f, i) => memoire.set(metas[i].id, { ...metas[i], blob: f.fichier, commandeId: null, etat: 'provisoire' }));
      return metas;
    }
    await operation('readwrite', magasin => {
      liste.forEach((f, i) => magasin.put({ ...metas[i], blob: f.fichier, commandeId: null, etat: 'provisoire' }));
      return null;
    });
    return metas;
  }

  /** Associe des fichiers provisoires à une commande (l'association ne change pas leur contenu). */
  async function associer(ids, commandeId) {
    const db = await base();
    if (!db) { ids.forEach(id => { const f = memoire.get(id); if (f) Object.assign(f, { commandeId, etat: 'associe' }); }); return; }
    await operation('readwrite', magasin => {
      ids.forEach(id => {
        const r = magasin.get(id);
        r.onsuccess = () => { if (r.result) magasin.put({ ...r.result, commandeId, etat: 'associe' }); };
      });
      return null;
    });
  }

  /** Lit un fichier stocké. Retour : promesse de l'enregistrement { id, blob, commandeId, ... } ou null. */
  async function lire(id) {
    const db = await base();
    if (!db) return memoire.get(id) || null;
    return (await operation('readonly', magasin => magasin.get(id))) || null;
  }

  /** Supprime des fichiers (transfert abandonné ou orphelins). */
  async function supprimer(ids) {
    const db = await base();
    if (!db) { ids.forEach(id => memoire.delete(id)); return; }
    await operation('readwrite', magasin => { ids.forEach(id => magasin.delete(id)); return null; });
  }

  /**
   * Nettoie les fichiers ORPHELINS : provisoires depuis plus d'une heure (transfert interrompu,
   * onglet fermé avant l'envoi) ou associés à une commande qui n'existe plus.
   * Paramètre : identifiants des commandes existantes. Retour : nombre de fichiers supprimés.
   */
  async function nettoyerOrphelins(commandesExistantes) {
    const db = await base();
    if (!db) return 0;
    const tous = (await operation('readonly', magasin => magasin.getAll())) || [];
    const limite = Date.now() - 60 * 60 * 1000;
    const orphelins = tous.filter(f => (f.etat === 'provisoire' && Date.parse(f.ajouteLe) < limite)
      || (f.etat === 'associe' && !commandesExistantes.includes(f.commandeId))).map(f => f.id);
    if (orphelins.length) await supprimer(orphelins);
    return orphelins.length;
  }

  /** Efface tous les fichiers locaux (bouton « Réinitialiser la démo »). */
  async function toutEffacer() {
    memoire.clear();
    const db = await base();
    if (db) await operation('readwrite', magasin => magasin.clear());
  }

  /** Outil de test : fait échouer le prochain transfert pour vérifier le message d'erreur. */
  function simulerEchec(actif) { echecSimule = Boolean(actif); }

  Edysol.piecesJointesLocales = { enregistrerProvisoires, associer, lire, supprimer, nettoyerOrphelins, toutEffacer, estPersistant, simulerEchec };
})(window);
