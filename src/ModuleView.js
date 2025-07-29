import React from 'react';

const ModuleView = ({ moduleId, content }) => {
  const moduleIcons = {
    bureautique: { icon: '📊', color: 'var(--color-bg-1)' },
    informatique: { icon: '💻', color: 'var(--color-bg-2)' },
    programmation: { icon: '👨‍💻', color: 'var(--color-bg-3)' },
    cybersecurite: { icon: '🔒', color: 'var(--color-bg-5)' }
  };

  const module = {
    id: moduleId,
    name: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
    ...moduleIcons[moduleId]
  };

  const lessons = content.filter(c => c.module_id === moduleId);

  return (
    <div id="modules-section" className="content-section active" role="region" aria-labelledby="modules-title">
      <div className="section-header">
        <h1 id="modules-title">Modules d'apprentissage</h1>
        <p>Explorez nos différents domaines d'apprentissage</p>
      </div>
      <div className="modules-grid">
        <div className="module-card" role="article">
          <div className="module-header">
            <div className="module-icon" style={{ background: module.color }}>
              {module.icon}
            </div>
            <div>
              <h3 className="module-title">{module.name}</h3>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {lessons.filter(l => l.completed).length}/{lessons.length} leçons terminées
              </p>
            </div>
          </div>
          <div className="lessons-list">
            {lessons.map(lesson => (
              <div key={lesson.lesson_id} className="lesson-item">
                <div className="lesson-info">
                  <h4>{lesson.title}</h4>
                  <p className="lesson-status">
                    {lesson.completed ? '✅ Terminé' : '⏳ Non commencé'}
                    {lesson.has_quiz ? ' • Quiz disponible' : ''}
                  </p>
                </div>
                <div className="lesson-actions">
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => window.app.openLesson(lesson.lesson_id)}
                    aria-label={`Ouvrir la leçon ${lesson.title}`}
                  >
                    {lesson.completed ? 'Revoir' : 'Regarder'}
                  </button>
                  {lesson.has_quiz && (
                    <button
                      className="btn btn--sm btn--secondary"
                      onClick={() => window.app.openQuiz(lesson.lesson_id)}
                      aria-label={`Lancer le quiz pour ${lesson.title}`}
                    >
                      Quiz
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleView;