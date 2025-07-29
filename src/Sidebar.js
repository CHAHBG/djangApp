import React from 'react';

const Sidebar = ({ currentView, onViewChange, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'bureautique', label: 'Bureautique', icon: '📚' },
    { id: 'informatique', label: 'Informatique', icon: '💻' },
    { id: 'programmation', label: 'Programmation', icon: '👨‍💻' },
    { id: 'cybersecurite', label: 'Cybersécurité', icon: '🔒' },
    { id: 'profile', label: 'Mon profil', icon: '👤' },
    { id: 'level', label: 'Mon niveau', icon: '🏆' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' }
  ];

  const avatarEmojis = {
    'etudiant': '👨‍🎓',
    'developpeur': '👨‍💻',
    'professeur': '👨‍🏫'
  };

  return (
    <aside className="sidebar" role="complementary">
      <div className="sidebar-header">
        <h2>InfoApp</h2>
        {user && (
          <div className="user-info">
            <div className="user-avatar" aria-hidden="true">{avatarEmojis[user.avatar] || '👨‍🎓'}</div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-level">Niveau {user.level}</span>
            </div>
          </div>
        )}
      </div>
      <nav className="sidebar-nav" role="navigation">
        {navItems.map(item => (
          <a
            key={item.id}
            href="#"
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onViewChange(item.id);
            }}
            role="button"
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;