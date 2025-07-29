import React, { useState } from 'react';
import './App.css';

const Settings = ({ userData, updateUserData }) => {
  const [theme, setTheme] = useState(userData?.settings?.theme || 'auto');

  const handleThemeChange = async (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    const newUserData = {
      ...userData,
      settings: { ...userData.settings, theme: newTheme },
    };
    try {
      await window.electronAPI.updateUserData(newUserData);
      updateUserData(newUserData);
      applyTheme(newTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const applyTheme = (theme) => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  const exportData = () => {
    const data = JSON.stringify(userData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'infoapp-data.json';
    link.click();
    URL.revokeObjectURL(url);
    alert('Données exportées avec succès !');
  };

  const resetProgress = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser votre progression ? Cette action est irréversible.')) {
      const newUserData = {
        ...userData,
        completedLessons: [],
        quizResults: [],
        badges: [],
        xp: 0,
        level: 1,
      };
      try {
        await window.electronAPI.updateUserData(newUserData);
        updateUserData(newUserData);
        alert('Progression réinitialisée');
      } catch (error) {
        console.error('Error resetting progress:', error);
      }
    }
  };

  return (
    <div className="content-section active" id="settings-section">
      <div className="section-header">
        <h1>Paramètres</h1>
        <p>Personnalisez votre expérience d'apprentissage</p>
      </div>
      <div className="settings-content">
        <div className="settings-group">
          <h3>Apparence</h3>
          <div className="setting-item">
            <label htmlFor="themeSelect" className="form-label">Thème</label>
            <select
              id="themeSelect"
              className="form-control"
              value={theme}
              onChange={handleThemeChange}
            >
              <option value="auto">Automatique</option>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>
        </div>
        <div className="settings-group">
          <h3>Données</h3>
          <div className="settings-actions">
            <button className="btn btn--outline" onClick={exportData}>
              Exporter mes données
            </button>
            <button className="btn btn--outline" onClick={resetProgress}>
              Réinitialiser la progression
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;