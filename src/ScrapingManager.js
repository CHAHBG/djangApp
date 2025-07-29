import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, List, Statistic, Row, Col, Spin } from 'antd';
import { SyncOutlined, DatabaseOutlined } from '@ant-design/icons';

const ScrapingManager = ({ onContentUpdated }) => {
  const [scrapingStatus, setScrapingStatus] = useState('idle');
  const [scrapingStats, setScrapingStats] = useState(null);
  const [lastResults, setLastResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadScrapingStats = async () => {
    try {
      const stats = await window.electronAPI.getScrapingStats();
      setScrapingStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleManualScraping = async () => {
    if (scrapingStatus === 'running') return;
    setScrapingStatus('running');
    setLastResults(null);
    try {
      window.electronAPI.onScrapingStarted(() => setScrapingStatus('running'));
      const results = await window.electronAPI.runContentScraper();
      setLastResults(results);
      setScrapingStatus(results.success ? 'completed' : 'error');
      if (results.success) {
        await window.electronAPI.manualContentRefresh();
      }
    } catch (error) {
      console.error('Manual scraping error:', error);
      setScrapingStatus('error');
      setLastResults({ success: false, error: error.message });
    }
    setTimeout(() => setScrapingStatus('idle'), 5000);
  };

  useEffect(() => {
    loadScrapingStats();
    window.electronAPI.onContentUpdated((newContent) => {
      console.log('New content received:', newContent.length, 'lessons');
      if (onContentUpdated) onContentUpdated(newContent);
      loadScrapingStats();
    });
    window.electronAPI.onScrapingStarted(() => setScrapingStatus('running'));
    window.electronAPI.onScrapingCompleted((results) => {
      setScrapingStatus(results.success ? 'completed' : 'error');
      setLastResults(results);
      setTimeout(() => setScrapingStatus('idle'), 5000);
    });
    return () => {
      window.electronAPI.removeContentUpdatedListener();
      window.electronAPI.removeScrapingListeners();
    };
  }, [onContentUpdated]);

  return (
    <Card title="🎯 Contenu Automatique" style={{ margin: '1rem' }}>
      {scrapingStatus === 'running' && (
        <Spin tip="Recherche de contenu en cours..." style={{ margin: '1rem auto', display: 'block' }} />
      )}
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Total Leçons"
            value={scrapingStats?.totalLessons || 0}
            prefix={<DatabaseOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Ajoutées (7j)"
            value={scrapingStats?.recentlyAdded || 0}
            prefix={<DatabaseOutlined />}
          />
        </Col>
      </Row>
      {scrapingStats?.modules && (
        <List
          header={<div>Par Module</div>}
          dataSource={scrapingStats.modules}
          renderItem={(module) => (
            <List.Item>
              <span>
                {module.module_id === 'bureautique' && '📊'}
                {module.module_id === 'informatique' && '💻'}
                {module.module_id === 'programmation' && '👨‍💻'}{' '}
                {module.module_id}
              </span>
              <span>
                {module.total_lessons} leçons ({module.lessons_with_quiz} avec quiz)
              </span>
            </List.Item>
          )}
          style={{ margin: '1rem 0' }}
        />
      )}
      <Button
        type="primary"
        icon={<SyncOutlined />}
        onClick={handleManualScraping}
        loading={scrapingStatus === 'running'}
        disabled={scrapingStatus === 'running'}
      >
        Actualiser
      </Button>
      {showDetails && lastResults && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Dernier Scraping</h4>
          {lastResults.success ? (
            <Alert
              message={`✅ ${lastResults.integrated || 0} leçons intégrées`}
              description={
                lastResults.modules_breakdown && (
                  <div>
                    {Object.entries(lastResults.modules_breakdown).map(([module, count]) => (
                      <span key={module} style={{ marginRight: '1rem' }}>
                        {module}: {count}
                      </span>
                    ))}
                    <br />
                    <small>{new Date(lastResults.timestamp).toLocaleString('fr-FR')}</small>
                  </div>
                )
              }
              type="success"
              showIcon
            />
          ) : (
            <Alert
              message="❌ Erreur"
              description={`${lastResults.error} (${new Date(lastResults.timestamp).toLocaleString('fr-FR')})`}
              type="error"
              showIcon
            />
          )}
        </div>
      )}
      <Button
        type="link"
        onClick={() => setShowDetails(!showDetails)}
        style={{ marginTop: '1rem' }}
      >
        {showDetails ? 'Masquer Détails' : 'Afficher Détails'}
      </Button>
    </Card>
  );
};

export default ScrapingManager;