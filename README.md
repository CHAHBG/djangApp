# InfoApp - Application d'apprentissage informatique

Une application de bureau Windows moderne pour apprendre l'informatique aux débutants, développée avec Electron, React et SQLite.

## Caractéristiques

- **100% hors ligne** - Fonctionne sans connexion Internet
- **Interface moderne** - Design responsive et intuitif en français
- **3 modules d'apprentissage** :
  - Bureautique (Word, Excel, PowerPoint)
  - Informatique de base (ordinateur, Windows, sécurité)
  - Programmation (Scratch, Python, HTML/CSS)
- **Système de gamification** - Badges, niveaux, progression
- **Vidéos intégrées** - Lecteur vidéo local avec contrôles personnalisés
- **Quiz interactifs** - Validation des connaissances
- **Projets pratiques** - Mise en application des compétences

## Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation des dépendances
```bash
npm install
```

### Reconstruction des modules natifs
```bash
npm run rebuild
```

## Développement

### Démarrer en mode développement
```bash
npm run dev
```

### Démarrer seulement Electron
```bash
npm start
```

## Construction et packaging

### Construire l'application
```bash
npm run build
```

### Créer l'installateur Windows
```bash
npm run package-win
```

## Structure du projet

```
apprend-informatique/
├── assets/                 # Ressources (vidéos, images, icônes)
│   ├── videos/            # Vidéos d'apprentissage
│   ├── avatars/           # Images d'avatars
│   └── icons/             # Icônes de l'application
├── database/              # Base de données SQLite
│   └── app.db            # Fichier de base de données
├── src/                   # Code source React (si utilisé)
├── main.js               # Processus principal Electron
├── preload.js            # Script de préchargement sécurisé
├── package.json          # Configuration du projet
└── README.md             # Ce fichier
```

## Base de données

L'application utilise SQLite pour stocker localement :
- Profils utilisateurs
- Progression par module et leçon
- Résultats des quiz
- Badges obtenus
- Paramètres personnalisés

## Vidéos et contenu

Les vidéos d'apprentissage sont stockées localement dans le dossier `assets/videos/` pour un fonctionnement 100% hors ligne. Format recommandé : MP4 H.264.

## Contribution

Ce projet a été conçu pour être facilement extensible. Vous pouvez :
- Ajouter de nouveaux modules d'apprentissage
- Créer de nouvelles leçons et quiz
- Personnaliser l'interface utilisateur
- Ajouter de nouveaux systèmes de gamification

## Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## Support

Pour toute question ou problème, veuillez créer une issue sur le repository GitHub.
