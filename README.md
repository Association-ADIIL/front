# adiil.fr — Frontend

Site web et interface d'administration de l'**ADIIL**, association étudiante, développés en React.

🔗 Site en production : [adiil.fr](https://adiil.fr)

## 🎯 À propos du projet

Ce dépôt contient le frontend du site vitrine et du panneau d'administration d'ADIIL. Le projet couvre à la fois la partie publique du site et des fonctionnalités d'administration avancées, connectées à une API REST maison.

Fonctionnalités notables :
- **Panneau d'administration** avec authentification JWT, gestion des utilisateurs et des contenus
- **Système de bannières dynamiques** activables via QR code, avec contrôle d'accès administrateur
- **Gestion du "Battle Pass"** (Pass de Combat) : suivi des paliers, récompenses et participants, avec des outils d'administration dédiés (révocation premium, gestion des participants)
- Intégration avec un backend Node.js/Express/Prisma

## 🛠️ Stack technique

- **React 19** avec le [React Compiler](https://react.dev/learn/react-compiler) activé
- **TypeScript**
- **Vite** pour le build et le serveur de développement
- **TailwindCSS** pour le style
- **React Router v7** pour la navigation
- **ESLint** avec règles type-aware pour la qualité du code

Backend associé : Node.js, Express, Prisma (MySQL), déployé via PM2 et nginx.

## 🚀 Démarrage rapide

### Prérequis
- Node.js (version LTS recommandée)
- npm

### Installation

```bash
git clone https://github.com/Association-ADIIL/adiil-front.git
cd adiil-front
npm ci
```

### Développement

```bash
npm run dev
```

L'application est alors accessible sur `http://localhost:5173` (port par défaut de Vite).

### Build de production

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## 📦 Déploiement

Le site est déployé sur un serveur avec nginx en reverse proxy et PM2 pour la gestion des processus. Le build de production (`dist/`) est servi statiquement, pendant que le backend tourne en tâche de fond via PM2.

## 📁 Structure du projet

```
src/
├── api/          # Appels et clients API vers le backend
├── components/   # Composants React réutilisables
├── context/      # Contextes React (état global, auth, etc.)
├── hooks/        # Hooks personnalisés
├── pages/        # Pages / vues de l'application
├── types/        # Types TypeScript partagés
├── utils/        # Fonctions utilitaires (dont un logger dédié)
├── App.tsx       # Composant racine
└── main.tsx      # Point d'entrée de l'application
public/           # Assets statiques
index.html
vite.config.ts
tsconfig.json
eslint.config.js
```

## 👤 Contribution

Projet développé et maintenu dans le cadre des activités de développement web de l'association **ADIIL**.
