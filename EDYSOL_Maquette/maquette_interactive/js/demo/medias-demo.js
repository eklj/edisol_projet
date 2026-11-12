/* ÉDYSOL NC — Stockage local des fichiers d’essai, séparé des données de planning. */
(function (racine) {
  'use strict';
  const E = racine.Edysol;
  const base = 'edysol-maquette-medias';
  const magasin = 'demandes';

  /** Attend la fin de la transaction avant de confirmer une écriture ou une lecture. */
  function executer(mode, operation) {
    return new Promise((resolve, reject) => {
      const ouverture = racine.indexedDB.open(base, 1);
      ouverture.onupgradeneeded = () => ouverture.result.createObjectStore(magasin);
      ouverture.onerror = () => reject(ouverture.error);
      ouverture.onsuccess = () => {
        const db = ouverture.result;
        try {
          const transaction = db.transaction(magasin, mode);
          const requete = operation(transaction.objectStore(magasin));
          transaction.oncomplete = () => { db.close(); resolve(requete.result); };
          transaction.onabort = () => { db.close(); reject(transaction.error); };
        } catch (erreur) {
          db.close();
          reject(erreur);
        }
      };
    });
  }

  E.mediasDemo = {
    async enregistrer(fichiers) {
      const octets = racine.crypto.getRandomValues(new Uint8Array(16));
      const reference = Array.from(octets, octet => octet.toString(16).padStart(2, '0')).join('');
      await executer('readwrite', stock => stock.add(fichiers, reference));
      return reference;
    },
    lire: reference => executer('readonly', stock => stock.get(reference)),
    supprimer: reference => executer('readwrite', stock => stock.delete(reference))
  };
})(window);
