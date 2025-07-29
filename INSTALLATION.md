# Installation d'InfoApp

## Prérequis

Avant d'installer InfoApp, assurez-vous d'avoir :

1. **Node.js** version 16 ou supérieure
   - Téléchargez depuis : https://nodejs.org/
   - Choisissez la version LTS (Long Term Support)

2. **Git** (optionnel, pour le développement)
   - Téléchargez depuis : https://git-scm.com/

## Installation automatique (Windows)

1. Double-cliquez sur `install.bat`
2. Attendez que l'installation se termine
3. Double-cliquez sur `start.bat` pour lancer l'application

## Installation manuelle

### 1. Installation des dépendances
```bash
npm install
```

### 2. Reconstruction des modules natifs
```bash
npm run rebuild
```

### 3. Démarrage de l'application
```bash
npm start
```

## Création de l'installateur Windows

Pour créer un installateur Windows (.exe) :

```bash
npm run package-win
```

L'installateur sera créé dans le dossier `dist/`.

## Dépannage

### Erreur "better-sqlite3 not found"
```bash
npm run rebuild
```

### Erreur "Node.js version incompatible"
- Mettez à jour Node.js vers la version 16 ou supérieure
- Supprimez le dossier `node_modules`
- Relancez `npm install`

### L'application ne se lance pas
1. Vérifiez que toutes les dépendances sont installées
2. Vérifiez les permissions de fichier
3. Consultez les logs dans la console

## Support

Pour obtenir de l'aide :
1. Consultez le fichier README.md
2. Vérifiez les issues GitHub
3. Contactez l'équipe de développement
