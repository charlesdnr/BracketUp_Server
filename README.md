# BrackUp Tournament Platform - Server

API REST pour la plateforme de tournois gaming BrackUp avec authentification Discord.

## 🚀 Phase 1 - Backend Foundation ✅

- ✅ Setup Node.js + Express
- ✅ Configuration PostgreSQL + Prisma
- ✅ Authentification Discord OAuth2
- ✅ API CRUD Users, Games, Teams
- ✅ Middleware d'authentification et validation

## 🏗️ Structure du Projet

```
src/
├── config/
│   ├── database.js      # Configuration Prisma
│   └── passport.js      # Configuration Discord OAuth
├── controllers/         # Contrôleurs API
│   ├── authController.js
│   ├── userController.js
│   ├── gameController.js
│   └── teamController.js
├── services/            # Logique métier
│   ├── userService.js
│   ├── gameService.js
│   └── teamService.js
├── middleware/          # Middlewares
│   ├── auth.js         # JWT & rôles
│   └── validation.js   # Validation des données
├── routes/             # Routes API
│   ├── auth.js
│   ├── users.js
│   ├── games.js
│   └── teams.js
└── index.js           # Point d'entrée
```

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 14+
- Application Discord (pour OAuth)

## ⚙️ Installation

### 1. Cloner et installer
```bash
git clone <repo-url>
cd BrackUp_Server
npm install
```

### 2. Configuration Base de Données
```bash
# Créer la base de données PostgreSQL
createdb brackup_db

# Appliquer le schéma SQL
psql -d brackup_db -f sql_version1.sql
```

### 3. Configuration Environment
```bash
cp .env.example .env
```

Modifier `.env` avec vos valeurs :
```env
DATABASE_URL="postgresql://username:password@localhost:5432/brackup_db"
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
```

### 4. Configuration Discord App

1. Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créer une nouvelle application
3. Onglet OAuth2 → Ajouter redirect URL : `http://localhost:3000/auth/discord/callback`
4. Copier Client ID et Client Secret dans `.env`

### 5. Initialiser Prisma
```bash
npm run db:generate
npm run db:push
```

## 🚀 Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

L'API sera disponible sur `http://localhost:3000`

## 📚 API Endpoints

### Auth
- `GET /auth/discord` - Connexion Discord
- `GET /auth/discord/callback` - Callback Discord
- `GET /auth/me` - Utilisateur connecté
- `POST /auth/verify` - Vérifier token JWT

### Users
- `GET /api/users` - Liste users (admin)
- `GET /api/users/me` - Profil utilisateur
- `GET /api/users/:id` - Détail utilisateur
- `PUT /api/users/:id` - Modifier profil
- `PATCH /api/users/:id/role` - Modifier rôle (admin)

### Games
- `GET /api/games` - Liste des jeux
- `GET /api/games/:id` - Détail jeu
- `POST /api/games` - Créer jeu (admin)
- `PUT /api/games/:id` - Modifier jeu (admin)
- `DELETE /api/games/:id` - Supprimer jeu (admin)

### Teams
- `GET /api/teams` - Liste équipes
- `GET /api/teams/:id` - Détail équipe
- `POST /api/teams` - Créer équipe
- `PUT /api/teams/:id` - Modifier équipe (captain)
- `DELETE /api/teams/:id` - Supprimer équipe (captain)
- `POST /api/teams/:id/members` - Ajouter membre (captain)
- `DELETE /api/teams/:id/members/:userId` - Retirer membre

## 🔐 Authentification

L'API utilise JWT pour l'authentification. Après connexion Discord, incluez le token dans le header :

```http
Authorization: Bearer <your-jwt-token>
```

### Rôles
- `PLAYER` - Utilisateur standard
- `MODERATOR` - Modérateur
- `ADMIN` - Administrateur

## 📊 Base de Données

Le schéma complet est dans `sql_version1.sql` avec :
- Users (authentification Discord)
- Games (jeux disponibles)
- Teams (équipes par jeu)
- Tournaments (tournois - Phase 2)
- Matches (matchs - Phase 2)
- Brackets (arbres tournois - Phase 2)

## 🔄 Prochaines Étapes - Phase 2

1. **API Tournaments** - CRUD tournois
2. **Système d'inscription** - Solo/équipe
3. **Génération brackets** - Single elimination
4. **Gestion des matchs** - Scores et progression

## 🐛 Debug

```bash
# Logs Prisma
DEBUG=prisma:* npm run dev

# Vérifier la DB
npx prisma studio
```

## 📝 Tests

```bash
npm test
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request