import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import ModuleView from './ModuleView';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [content, setContent] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await window.electronAPI.getUserData();
        setUser(userData);
        const progressData = await window.electronAPI.getProgress();
        setUserProgress(progressData);
        const badgesData = await window.electronAPI.getBadges();
        setUserBadges(badgesData);
        const contentData = await window.electronAPI.getContent();
        setContent(contentData);
        await window.electronAPI.runScraper(); // Run background scraping
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="main-app">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} user={user} />
      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard user={user} progress={userProgress} badges={userBadges} content={content} />
        )}
        {['bureautique', 'informatique', 'programmation', 'cybersecurite'].includes(currentView) && (
          <ModuleView moduleId={currentView} content={content} />
        )}
      </main>
    </div>
  );
};

export default App;