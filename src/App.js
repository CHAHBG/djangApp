import React, { useState, useEffect } from 'react';
import { Layout, Alert, Spin } from 'antd';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import ModuleView from './ModuleView';
import ScrapingManager from './ScrapingManager';
import 'antd/dist/antd.css'; // Note: For antd v5, you may need to import CSS differently if using CSS-in-JS
import './App.css';

const { Sider, Content, Header } = Layout;

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [content, setContent] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [scrapingNotification, setScrapingNotification] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingContent(true);
        const userData = await window.electronAPI.getUserData();
        setUser(userData);
        if (userData) {
          const progressData = await window.electronAPI.getProgress(userData.id);
          setUserProgress(progressData);
          const badgesData = await window.electronAPI.getBadges(userData.id);
          setUserBadges(badgesData);
        }
        const contentData = await window.electronAPI.getContent();
        setContent(contentData);
        if (contentData.length === 0) {
          setScrapingNotification({
            type: 'info',
            message: 'Aucun contenu détecté. Recherche de ressources éducatives en cours...',
          });
          try {
            await window.electronAPI.runContentScraper();
          } catch (error) {
            console.error('Initial scraping error:', error);
            setScrapingNotification({
              type: 'error',
              message: 'Erreur lors de la recherche de contenu. Réessayez manuellement.',
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setScrapingNotification({
          type: 'error',
          message: 'Erreur lors du chargement des données.',
        });
      } finally {
        setIsLoadingContent(false);
      }
    };
    loadData();
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleContentUpdated = (newContent) => {
    setContent(newContent);
    setScrapingNotification({
      type: 'success',
      message: `✅ ${newContent.length} leçons disponibles ! Contenu mis à jour.`,
    });
    setTimeout(() => setScrapingNotification(null), 5000);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200}>
        <Sidebar currentView={currentView} onViewChange={handleViewChange} user={user} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <h1 style={{ margin: 0 }}>DjangApp</h1>
        </Header>
        <Content style={{ padding: '16px' }}>
          {scrapingNotification && (
            <Alert
              message={scrapingNotification.message}
              type={scrapingNotification.type}
              showIcon
              onClose={() => setScrapingNotification(null)}
              style={{ marginBottom: '16px' }}
            />
          )}
          {isLoadingContent ? (
            <Spin tip="Chargement du contenu éducatif..." style={{ display: 'block', margin: '50px auto' }} />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <>
                  <Dashboard user={user} progress={userProgress} badges={userBadges} content={content} />
                  <ScrapingManager onContentUpdated={handleContentUpdated} />
                </>
              )}
              {['bureautique', 'informatique', 'programmation'].includes(currentView) && (
                <ModuleView moduleId={currentView} content={content} progress={userProgress} />
              )}
              {currentView === 'content-manager' && (
                <ScrapingManager onContentUpdated={handleContentUpdated} />
              )}
              {currentView === 'profile' && <div>Profil (À implémenter)</div>}
              {currentView === 'level' && <div>Niveau (À implémenter)</div>}
              {currentView === 'settings' && <div>Paramètres (À implémenter)</div>}
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;