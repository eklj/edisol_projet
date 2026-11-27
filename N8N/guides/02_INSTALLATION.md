# Installer le laboratoire et préparer les connexions

Version 1.0 du 19/11/2026. Méthode principale proposée, Docker Compose avec stockage persistant SQLite pour le laboratoire. Le dossier d’origine ne fournit aucune contrainte d’installation à préserver. Le statut de chaque procédure est indiqué dans 07.

## Pré requis et versions

| Élément | Choix ou contrôle |
| --- | --- |
| Machine | Linux 64 bits avec Docker Engine, ou environnement Docker Desktop/WSL2 approprié |
| Docker | Engine installé et démon accessible, plugin Compose v2. Vérifier `docker version` et `docker compose version` |
| n8n | `2.48.5`, version stable affichée par la documentation consultée et disponible dans npm le 19/11/2026. Version fixée pour ce guide, à réexaminer lors des mises à jour |
| Node.js sur l’hôte | Inutile pour le chemin Docker. Pour la variante npm testée, Node `24.x` est nécessaire selon le champ `engines` du paquet 2.48.5, plus précis que la plage générale de la page npm |
| Outils | Git, navigateur, curl et Python 3 pour générer le `.env` et lire les exemples |
| Réseau | Accès aux images Docker au premier téléchargement. Les connexions externes sont nécessaires seulement pour leurs intégrations |
| Capacité | Dimensionner selon volume, documents et concurrence. Point de départ pédagogique proposé, 2 vCPU, 2 à 4 Go de RAM disponibles et espace disque surveillé. Ce chiffre est un budget de test à mesurer, pas une garantie fournisseur |

Le guide Docker officiel actuel couvre également des composants d’assistant IA. Le laboratoire fourni utilise uniquement n8n et n’active aucun assistant ou conteneur privilégié. Son périmètre se limite à la réception de JSON fictif. Sources S01 à S03 et S16 dans 08.

### Installer Docker si nécessaire

Commencer par les deux commandes de version. Si Docker existe, examiner les erreurs avant toute réinstallation. Sous Ubuntu compatible, suivre le dépôt APT officiel Docker, puis installer `docker-ce`, `docker-ce-cli`, `containerd.io`, `docker-buildx-plugin` et `docker-compose-plugin`. La procédure officielle consultée inclut Ubuntu 26.04 LTS. Sur un poste déjà équipé, examiner les conflits de paquets avec l’administrateur avant retrait.

Depuis n’importe quel répertoire sur un poste Ubuntu dont le dépôt Docker officiel est déjà configuré, les commandes suivantes installent et vérifient les paquets. L’ajout du dépôt APT et de sa clé est détaillé dans S16 et doit correspondre à la version réelle d’Ubuntu.

```bash
# Mise à jour de la liste des paquets, sans mise à niveau globale du système.
sudo apt update
# Installer les composants depuis le dépôt Docker configuré.
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
# Vérifier le démon et exécuter l'image officielle de contrôle.
sudo systemctl status docker
sudo docker run --rm hello-world
docker compose version
```

Si les commandes nécessitent `sudo`, conserver cette méthode ou faire configurer l’accès par l’administrateur. L’appartenance au groupe Docker donne des pouvoirs élevés sur l’hôte, elle ne doit pas être accordée à tous les employés pour utiliser l’application ÉDYSOL.

## Préparer le dossier de test

Depuis le répertoire où stocker la copie du projet, si elle manque uniquement, cloner le dépôt. Dans une copie existante, utiliser son propre chemin et examiner `git status` avant une mise à jour.

```bash
git clone https://github.com/eklj/edisol_projet.git
cd edisol_projet
# Relever l'état de code réellement utilisé.
git branch --show-current
git rev-parse HEAD
# Entrer dans le dossier contenant compose.yaml fourni avec ce guide.
cd N8N
```

Les documents et exemples de cette livraison sont préparés localement. S’ils ne figurent pas encore dans votre clone, copier le dossier livré avant de poursuivre. Ne pas attendre leur présence sur GitHub sans intégration effective.

Depuis `N8N/`, créer un `.env` privé à partir de l’exemple. La clé d’exemple n’est pas utilisable pour des données réelles.

```bash
# Le script refuse d'écraser une configuration existante.
python3 - <<'PY'
from pathlib import Path
import secrets

cible = Path('.env')
if cible.exists():
    raise SystemExit('.env existe déjà : conserver sa clé et examiner la configuration.')
texte = Path('.env.example').read_text()
texte = texte.replace('EXEMPLE_FICTIF_A_REMPLACER_PAR_UNE_CLE_ALEATOIRE', secrets.token_hex(32))
cible.write_text(texte)
cible.chmod(0o600)
PY
# Les exports peuvent contenir des données privées, ils sont exclus de Git.
mkdir -p exports sauvegardes
chmod 700 exports sauvegardes
```

Ne pas remplacer la clé au redémarrage. Les connexions chiffrées avec l’ancienne clé deviendraient illisibles. Conserver une copie protégée de la clé avec les sauvegardes appropriées.

### Paramètres livrés

| Paramètre | Rôle |
| --- | --- |
| `N8N_VERSION=2.48.5` | Version d’image fixée, évite de suivre un tag mobile |
| `N8N_LOCAL_PORT=5678` | Port du poste. En cas de conflit, modifier seulement cette valeur puis recréer le service |
| `N8N_ENCRYPTION_KEY` | Clé privée générée, conservée entre installations et sauvegardes |
| `TZ`, `GENERIC_TIMEZONE` | Fuseau système et horaires des déclencheurs, tous deux `Pacific/Noumea` |
| `N8N_WEBHOOK_URL` | URL des appels entrants, nom actuel du paramètre. `WEBHOOK_URL` est déprécié à partir de 2.35 et utilisé sur certaines anciennes versions |
| Volume `/home/node/.n8n` | Base SQLite, paramètres et données locales de n8n |
| `EXECUTIONS_DATA_PRUNE=false` | Choix du laboratoire fictif pour garder les preuves. La conservation et le contrôle du disque doivent être définis avant usage réel |

La publication Docker écoute sur `127.0.0.1` du poste. Un service Internet ne peut pas appeler cette adresse sur votre ordinateur. Dans le conteneur, l’écoute sur `0.0.0.0` est nécessaire pour le transfert de port Docker. Les adresses fictives d’entreprise sont décrites dans 03. Sources S01, S04, S13 et S14.

## Démarrer et contrôler

Toujours depuis `N8N/`.

```bash
# Validation Compose sans afficher les secrets interpolés.
docker compose config --quiet
# Télécharger puis relever l'image réellement résolue.
docker compose pull
docker image inspect n8nio/n8n:2.48.5 --format '{{json .RepoDigests}}'
# Démarrer en arrière-plan.
docker compose up -d
docker compose ps
docker compose logs --tail=60 n8n
# Contrôle HTTP local. L'absence d'erreur et le code 200 sont attendus.
curl --fail --show-error http://localhost:5678/healthz
```

Ouvrir l’éditeur local, créer le compte administrateur n8n de test et conserver son accès. L’administration n8n doit être confiée aux personnes qui construisent/exploitent les automatisations. Les employés utilisent les interfaces ÉDYSOL. Les possibilités de partage et de rôles dans n8n dépendent de l’édition retenue.

## Importer le workflow pédagogique

Depuis l’éditeur, menu du workflow → **Import from File**, sélectionner `exemples/workflow_test_local.json`, examiner les trois nœuds et enregistrer. Le JSON livré est inactif. Pour utiliser son adresse `/webhook/edysol-test-local`, publier uniquement ce workflow sur le laboratoire local. Le terme « production URL » de n8n désigne cette route publiée, même si l’instance est un laboratoire.

Alternative CLI depuis `N8N/`, avec le service démarré et le propriétaire créé.

```bash
# Import dans la base du laboratoire. Le dossier /exemples est monté en lecture seule.
docker compose exec -u node n8n n8n import:workflow --input=/exemples/workflow_test_local.json
# Publier le seul workflow pédagogique identifié.
docker compose exec -u node n8n n8n publish:workflow --id=EdysolTestLocal01
# Appliquer l'état publié, quelle que soit la stratégie de rechargement de l'instance.
docker compose restart n8n
```

L’import conserve un identifiant fixe pour faciliter la reproduction sur une instance neuve. Dans une instance contenant déjà un workflow de même ID, sauvegarder et comparer avant import, car un import peut modifier le workflow correspondant. Ne pas importer à l’aveugle dans une instance d’entreprise. Après export d’un vrai workflow, rechercher les headers HTTP, URL privées et identifiants de connexions avant de le partager. Sources S05 et S06.

## Connexions et secrets

Le workflow pédagogique ne requiert aucun credential externe. Pour un vrai service, créer la connexion dans **Credentials**, choisir le type correspondant au nœud et à sa version, puis sélectionner cette connexion dans le nœud. Utiliser un libellé fonctionnel tel que `TEST-MICROSOFT-LECTURE`, sans secret dans le nom. Les clés, mots de passe et jetons restent dans le coffre n8n ou le mécanisme retenu, pas dans les JSON du dépôt.

Pour un webhook d’entreprise, activer par exemple **Header Auth** dans le nœud et créer le credential correspondant. Le secret reste côté backend appelant. Un navigateur public ne peut pas protéger un secret embarqué dans son JavaScript. Définir aussi validation de charge, droit d’appel, limites et prévention des réessais en double. La configuration réelle dépend du service retenu, voir 03.

## Locale de test et utilisation par l’entreprise

| Sujet | Laboratoire fourni | Préparation d’entreprise |
| --- | --- | --- |
| Adresse | HTTP sur la boucle locale | Domaine stable HTTPS, pare-feu et reverse proxy vérifiés |
| Base | SQLite dans un volume persistant | Dimensionnement et choix SQLite/PostgreSQL à arbitrer, sauvegardes restaurées en recette |
| Clés / comptes | Connexions de test et compte administrateur local | Comptes d’entreprise, permissions minimales et procédure de rotation/révocation |
| Workflows | Un exemple fictif | Références métier validées, journal durable, canaux et destinataires autorisés |
| Données | JSON fictif | Minimisation, droits sur médias et conservation décidés |
| Disponibilité | Dépend du poste, du courant et du réseau | Responsable, alertes, reprise, mises à jour et budget identifiés |

Exemple fictif derrière un seul reverse proxy, à adapter et vérifier sans l’appliquer au laboratoire local.

```dotenv
N8N_HOST=automatisation.exemple.invalid
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://automatisation.exemple.invalid/
N8N_WEBHOOK_URL=https://automatisation.exemple.invalid/
N8N_PROXY_HOPS=1
TZ=Pacific/Noumea
GENERIC_TIMEZONE=Pacific/Noumea
```

Le proxy termine HTTPS et transmet les informations d’origine `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto`. Le nombre de proxies doit refléter le chemin réel. Le backend n8n reste sur son port interne. Ajouter un tunnel pour un essai ponctuel change l’exposition réseau et doit faire l’objet d’un test ciblé avec données fictives. Source S04.

## Variante npm utilisée pour les vérifications

Docker étant absent de l’environnement de rédaction, le même n8n 2.48.5 a été installé localement pour tenter le parcours. Résultats et éventuelles limites dans 07. Sur un poste de test Node 24, depuis `N8N/`, les commandes équivalentes sont les suivantes.

```bash
# Installation isolée, hors dépendances du site ÉDYSOL.
npm install --prefix .runtime n8n@2.48.5 --no-audit --no-fund
# Isoler les données et imposer le fuseau pour cette session du terminal.
export N8N_USER_FOLDER="$PWD/.runtime/etat"
export TZ=Pacific/Noumea
export GENERIC_TIMEZONE=Pacific/Noumea
export N8N_LISTEN_ADDRESS=127.0.0.1
export N8N_DIAGNOSTICS_ENABLED=false
export EXECUTIONS_DATA_PRUNE=false
# Sans clé personnalisée, n8n en crée une dans son dossier d'état : sauvegarder ce dossier entier.
./.runtime/node_modules/.bin/n8n start
```

Cette variante peut télécharger plusieurs gigaoctets et afficher des avertissements de dépendances. Mesurer l’espace avant installation. La documentation actuelle annonce la dépréciation des installations npm à partir de n8n 3.0, ce qui justifie de conserver Docker comme méthode proposée à long terme. Source S02.
