/* =========================================================================
   ÉDYSOL NC — Petit serveur statique local (aucune dépendance)
   Usage : node outils/serveur.js [port]   (port 8000 par défaut)
   Écoute uniquement sur 127.0.0.1 : ce n'est PAS un serveur de production
   et il ne contient aucune logique métier ni aucun secret.
   ========================================================================= */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.resolve(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};

/**
 * Crée le serveur. Paramètre : port (0 = port libre choisi par le système).
 * Retour : promesse résolue avec le serveur démarré.
 */
function demarrer(port = 8000) {
  const serveur = http.createServer((req, res) => {
    // Décodage du chemin puis blocage de toute sortie du dossier de la maquette.
    let chemin;
    try { chemin = decodeURIComponent(new URL(req.url, 'http://local').pathname); } catch { res.writeHead(400).end(); return; }
    const fichier = path.resolve(RACINE, '.' + (chemin.endsWith('/') ? chemin + 'index.html' : chemin));
    if (!fichier.startsWith(RACINE + path.sep)) { res.writeHead(403).end('Accès refusé'); return; }
    fs.readFile(fichier, (err, contenu) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(contenu);
    });
  });
  return new Promise(resolve => serveur.listen(port, '127.0.0.1', () => resolve(serveur)));
}

if (require.main === module) {
  const port = Number(process.argv[2] || 8000);
  demarrer(port).then(s => {
    console.log(`Maquette ÉDYSOL disponible sur http://127.0.0.1:${s.address().port}/`);
    console.log('Site public : /index.html · Commande : /commande.html · Espaces internes : /espace.html');
    console.log('Arrêter avec Ctrl+C.');
  });
}
module.exports = { demarrer };
