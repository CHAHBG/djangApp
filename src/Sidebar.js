import React from 'react';
import { Menu } from 'antd';
import { DashboardOutlined, FileOutlined, DesktopOutlined, UserOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons';

const Sidebar = ({ currentView, onViewChange, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <DashboardOutlined /> },
    { id: 'bureautique', label: 'Bureautique', icon: <FileOutlined /> },
    { id: 'informatique', label: 'Informatique', icon: <DesktopOutlined /> },
    { id: 'programmation', label: 'Programmation', icon: <DesktopOutlined /> },
    { id: 'content-manager', label: 'Contenu Auto', icon: <SyncOutlined /> },
    { id: 'profile', label: 'Mon Profil', icon: <UserOutlined /> },
    { id: 'level', label: 'Mon Niveau', icon: <UserOutlined /> },
    { id: 'settings', label: 'Paramètres', icon: <SettingOutlined /> },
  ];

  const avatarEmojis = {
    etudiant: '👨‍🎓',
    developpeur: '👨‍💻',
    professeur: '👨‍🏫',
  };

  return (
    <div style={{ width: 200, background: '#001529', height: '100vh' }}>
      <div style={{ padding: '16px', color: 'white', textAlign: 'center' }}>
        <h2>DjangApp</h2>
        {user && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2rem' }}>{avatarEmojis[user.avatar] || '👨‍🎓'}</div>
            <div style={{ color: 'white' }}>{user.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.65)' }}>Niveau {user.level}</div>
          </div>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentView]}
        onClick={({ key }) => onViewChange(key)}
        items={navItems.map((item) => ({
          key: item.id,
          icon: item.icon,
          label: item.label,
        }))}
      />
    </div>
  );
};

export default Sidebar;