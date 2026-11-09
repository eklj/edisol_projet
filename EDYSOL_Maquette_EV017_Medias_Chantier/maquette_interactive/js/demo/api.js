/* =========================================================================
   ÉDYSOL NC — Point d'accès unique aux données (« Edysol.api »)
   Les écrans n'appellent QUE Edysol.api : le jour où un backend existera,
   il suffira de remplacer ce branchement, sans réécrire les écrans.
   État actuel : aucun backend dans l'archive (voir README racine et
   MODELE_DONNEES_API.md). Seul le mode « demo » fonctionne.
   ========================================================================= */
(function (racine) {
  'use strict';
  const Edysol = racine.Edysol = racine.Edysol || {};

  /** Configuration : « demo » = données fictives locales ; « serveur » = non implémenté. */
  Edysol.config = Object.assign({ mode: 'demo' }, racine.EDYSOL_CONFIG || {});

  /**
   * Mode serveur : chaque appel échoue explicitement plutôt que de simuler un succès.
   * Les routes indicatives sont décrites dans maquette_EdisolNC/Edysol_NC_Maquette_V1/MODELE_DONNEES_API.md.
   */
  const serveurNonBranche = new Proxy({}, {
    get(_, nom) {
      return () => { throw new Error(`Backend non implémenté : l’opération « ${String(nom)} » n’est reliée à aucun serveur.`); };
    }
  });

  Edysol.api = Edysol.config.mode === 'demo' ? Edysol.depotDemo : serveurNonBranche;
  Edysol.estDemo = Edysol.config.mode === 'demo';
})(window);
