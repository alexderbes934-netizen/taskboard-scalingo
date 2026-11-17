# Taskboard

Gestionnaire de tâches minimal pour le TP de mise en production Ynov : React + TypeScript, API FastAPI et PostgreSQL.

## Architecture

- `client/` : application React/Vite, déployée en application Node.js Scalingo.
- `api/` : API FastAPI, déployée en application Python Scalingo.
- PostgreSQL : base managée Scalingo en production et conteneur PostgreSQL 16 en local.
- Les données sont persistées en base. Aucun secret ni fichier `.env` ne doit être commité.

## Lancer en local

Prérequis : Docker Compose, Python 3.12 et Node.js 20.

1. Copier `api/.env.example` vers `api/.env`, puis `client/.env.example` vers `client/.env`.
2. Lancer PostgreSQL : `docker compose up -d db`.
3. API :

   ```sh
   cd api
   python -m venv .venv
   . .venv/bin/activate  # Windows : .venv\\Scripts\\Activate.ps1
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

4. Client, dans un autre terminal :

   ```sh
   cd client
   npm install
   npm run dev
   ```

Ouvrir `http://localhost:5173`. La documentation API est disponible sur `http://localhost:8000/docs`.

## Variables d'environnement

| Variable | Application | Description |
| --- | --- | --- |
| `DATABASE_URL` | API | URL PostgreSQL. Scalingo fournit `SCALINGO_POSTGRESQL_URL`, normalisée par l'API. |
| `ALLOWED_ORIGINS` | API | Origines autorisées, séparées par des virgules. |
| `PORT` | API et client | Port injecté par Scalingo. |
| `VITE_API_URL` | Client | URL HTTPS publique de l'API, intégrée au bundle pendant le build. |

## Déploiement Scalingo

Créer deux applications (API et client) dans la même région, puis l'addon PostgreSQL Starter 512 sur l'API. Chaque application pointe vers le même dépôt GitHub, avec `PROJECT_DIR=api` ou `PROJECT_DIR=client`.

Déploiement réalisé :

- Dépôt : https://github.com/alexderbes934-netizen/taskboard-scalingo
- Client : https://taskboard-client-alexy.osc-fr1.scalingo.io/
- API : https://taskboard-api-alexy.osc-fr1.scalingo.io
- Documentation API : https://taskboard-api-alexy.osc-fr1.scalingo.io/docs

### API

- Buildpack Python ; version fixée dans `api/.python-version`.
- Ajouter l'addon PostgreSQL, puis définir `ALLOWED_ORIGINS` avec l'URL HTTPS du client.
- `api/Procfile` démarre Uvicorn sur `0.0.0.0:$PORT` et exécute Alembic en post-déploiement. Il est placé dans `api/` car `PROJECT_DIR=api` rend ce sous-dossier disponible au runtime.
- Vérifier `https://<api>/health` (réponse `200`) et `https://<api>/docs`.

### Client

- Buildpack Node.js ; définir `VITE_API_URL=https://<api>` avant le déploiement.
- Le script `build` produit `dist/`, et le script `start` sert les fichiers sur `$PORT` avec prise en charge du routage SPA.
- Après un changement de `VITE_API_URL`, redéployer pour reconstruire le bundle.

### Coût et ressources

Le sujet Ynov donne un plafond indicatif de 50 €/mois et recommande des conteneurs taille S avec un addon PostgreSQL Starter 512. Les deux applications utilisent chacune un conteneur S et l'API dispose de PostgreSQL Starter 512. Au tarif public en région standard, ces ressources représentent environ **21,60 € HT par mois** (environ **25,92 € TTC** si une TVA française de 20 % s'applique). Le calcul suppose les trois ressources actives 30 jours, sans stockage excédentaire ni option supplémentaire ; Scalingo facture à la minute. Le voucher est activé sur le compte, avec un plafond mensuel indiqué de 50 €.

- Estimation mensuelle de la configuration déployée : 21,60 € HT, soit environ 25,92 € TTC.
- Montant exact consommé : à relever dans Billing, car la facturation dépend de la durée réelle d'utilisation.

## CI

GitHub Actions vérifie l'API sur PostgreSQL, puis installe les dépendances client, exécute lint/tests et produit le build. Configurer Scalingo pour attendre le succès des checks avant l'Auto Deploy sur `main`.

## Exploitation

- Logs API : `scalingo --app <app-api> logs --lines 200`
- Déploiement précédent : Scalingo Dashboard → app → Deployments → rollback vers la version précédente.
- Sauvegarde/restauration PostgreSQL : utiliser les sauvegardes de l'addon et tester la restauration avant de la considérer fiable.
- Consommation : relever régulièrement mémoire, CPU et Billing ; supprimer les ressources de test à la fin du module.

## Limites du prototype

Il s'agit d'un exemple pédagogique sans comptes utilisateurs ni authentification. Ne pas y stocker d'information personnelle ou confidentielle.
