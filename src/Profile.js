import React, { useEffect, useState } from 'react';
import './App.css';

const Profile = ({ userData, badges, updateUserData }) => {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(userData?.avatar || 'etudiant');

  const avatarEmojis = {
    etudiant: '👨‍🎓',
    developpeur: '👨‍💻',
    professeur: '👨‍🏫',
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const saveAvatar = async () => {
    try {
      const newUserData = { ...userData, avatar: selectedAvatar };
      await window.electronAPI.updateUserData(newUserData);
      updateUserData(newUserData);
      setIsAvatarModalOpen(false);
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  return (
    <div className="content-section active" id="profile-section">
      <div className="section-header">
        <h1>Mon profil</h1>
        <p>Gérez vos informations personnelles et vos accomplissements</p>
      </div>
      <div className="profile-content">
        <div className="profile-info">
          <div className="profile-avatar-section">
            <div className="profile-avatar">{avatarEmojis[userData?.avatar] || '👨‍🎓'}</div>
            <button
              className="btn btn--outline btn--sm"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              Changer d'avatar
            </button>
            <div className="profile-details">
              <h3>{userData?.name || 'Utilisateur'}</h3>
              <p>Niveau {userData?.level || 1} • {userData?.xp || 0} XP</p>
            </div>
          </div>
        </div>
        <div className="badges-grid" id="allBadges">
          {userData?.badges.length > 0 ? (
            userData.badges.map((badgeId) => {
              const badge = badges.find((b) => b.id === badgeId);
              return (
                <div key={badge.id} className="badge-item">
                  <span className="badge-icon">{badge.icon}</span>
                  <div>
                    <h4>{badge.name}</h4>
                    <p>{badge.description}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-badges">Aucun badge obtenu pour le moment</p>
          )}
        </div>
      </div>

      {isAvatarModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Changer d'avatar</h3>
              <button
                className="modal-close"
                onClick={() => setIsAvatarModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="avatar-selection">
                {Object.keys(avatarEmojis).map((avatar) => (
                  <div
                    key={avatar}
                    className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(avatar)}
                  >
                    <div className="avatar-circle">{avatarEmojis[avatar]}</div>
                    <span>{avatar.charAt(0).toUpperCase() + avatar.slice(1)}</span>
                  </div>
                ))}
              </div>
              <div className="lesson-actions">
                <button className="btn btn--primary" onClick={saveAvatar}>
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;