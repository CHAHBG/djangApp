import React, { useEffect } from 'react';
import Chart from 'chart.js/auto';

const Dashboard = ({ user, progress, badges, content }) => {
  useEffect(() => {
    const ctx = document.getElementById('progressChart')?.getContext('2d');
    if (ctx) {
      const modules = ['bureautique', 'informatique', 'programmation', 'cybersecurite'];
      const completedLessons = modules.map(moduleId => {
        const moduleLessons = content.filter(c => c.module_id === moduleId);
        return progress.filter(p => p.module_id === moduleId && p.completed).length;
      });

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Bureautique', 'Informatique', 'Programmation', 'Cybersécurité'],
          datasets: [{
            label: 'Leçons terminées',
            data: completedLessons,
            backgroundColor: [
              'rgba(33, 128, 141, 0.6)',
              'rgba(245, 158, 11, 0.6)',
              'rgba(34, 197, 94, 0.6)',
              'rgba(147, 51, 234, 0.6)'
            ],
            borderColor: [
              'var(--color-teal-500)',
              'var(--color-orange-500)',
              'var(--color-success)',
              'var(--color-bg-5)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Nombre de leçons' }
            },
            x: { title: { display: true, text: 'Modules' } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }, [progress, content]);

  const totalLessons = content.length;
  const completedLessons = progress.filter(p => p.completed).length;
  const globalProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div id="dashboard-section" className="content-section active" role="region" aria-labelledby="dashboard-title">
      <div className="section-header">
        <h1 id="dashboard-title">Tableau de bord</h1>
        <p>Suivez votre progression et découvrez vos accomplissements</p>
      </div>
      <div className="dashboard-grid">
        <div className="stats-card">
          <h3>Progression globale</h3>
          <div
            className="progress-circle"
            role="progressbar"
            aria-valuenow={globalProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            style={{ background: `conic-gradient(var(--color-primary) ${globalProgress * 3.6}deg, var(--color-secondary) 0deg)` }}
          >
            <span className="progress-text" id="globalProgress">{globalProgress}%</span>
          </div>
        </div>
        <div className="stats-card">
          <h3>Expérience</h3>
          <div className="xp-info">
            <div className="xp-bar">
              <div className="xp-fill" id="xpFill" style={{ width: `${user?.xp || 0}%` }}></div>
            </div>
            <span id="xpDisplay">{user?.xp || 0} XP</span>
          </div>
        </div>
        <div className="stats-card">
          <h3>Statistiques de progression</h3>
          <canvas id="progressChart" role="img" aria-label="Graphique de progression des leçons par module"></canvas>
        </div>
        <div className="stats-card">
          <h3>Derniers badges</h3>
          <div className="recent-badges" id="recentBadges">
            {badges.length > 0 ? (
              badges.slice(-3).map(badge => (
                <div key={badge.id} className="badge-item">{badge.badge_id}</div>
              ))
            ) : (
              <p className="no-badges">Aucun badge obtenu</p>
            )}
          </div>
        </div>
        <div className="stats-card">
          <h3>Statistiques</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span>Leçons terminées</span>
              <span id="completedLessons">{completedLessons}</span>
            </div>
            <div className="stat-item">
              <span>Quiz réussis</span>
              <span id="completedQuizzes">{progress.filter(p => p.completed && content.find(c => c.lesson_id === p.lesson_id && c.has_quiz)).length}</span>
            </div>
            <div className="stat-item">
              <span>Badges obtenus</span>
              <span id="totalBadges">{badges.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;