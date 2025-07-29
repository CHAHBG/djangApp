import React from 'react';
import './App.css';

const LevelView = ({ userData, levels }) => {
  const getCurrentLevel = () => {
    let currentLevel = levels[0];
    for (let level of levels) {
      if (userData.xp >= level.xpRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  };

  const getNextLevel = () => {
    const currentLevel = getCurrentLevel();
    const nextLevelIndex = levels.findIndex((l) => l.level === currentLevel.level) + 1;
    return nextLevelIndex < levels.length ? levels[nextLevelIndex] : null;
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const xpInCurrentLevel = userData.xp - currentLevel.xpRequired;
  const xpForNextLevel = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 100;
  const progress = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);

  return (
    <div className="content-section active" id="level-section">
      <div className="section-header">
        <h1>Mon niveau</h1>
        <p>Découvrez votre progression et les récompenses à venir</p>
      </div>
      <div className="level-content">
        <div className="current-level">
          <div className="level-display">
            <div className="level-number" id="currentLevelNumber">{currentLevel.level}</div>
            <div className="level-info">
              <h4 id="currentLevelName">{currentLevel.name}</h4>
              <div className="level-progress">
                <div className="level-bar">
                  <div className="level-fill" id="levelFill" style={{ width: `${progress}%` }}></div>
                </div>
                <span id="levelProgress">
                  {nextLevel ? `${xpInCurrentLevel} / ${xpForNextLevel} XP` : `${userData.xp} XP`}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="levels-timeline" id="levelsTimeline">
          {levels.map((level) => (
            <div
              key={level.level}
              className={`level-item ${userData.xp >= level.xpRequired ? 'unlocked' : ''}`}
            >
              <div
                className="level-circle"
                style={{ background: userData.xp >= level.xpRequired ? level.color : '#e5e7eb' }}
              >
                {level.level}
              </div>
              <div className="level-info">
                <h4>{level.name}</h4>
                <p>{level.xpRequired} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelView;