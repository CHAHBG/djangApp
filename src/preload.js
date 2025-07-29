const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getUser: () => ipcRenderer.invoke('getUser'),
  getUserData: () => ipcRenderer.invoke('getUserData'),
  createUser: (userData) => ipcRenderer.invoke('createUser', userData),
  updateUserProgress: (progressData) => ipcRenderer.invoke('updateUserProgress', progressData),
  getUserProgress: (userId) => ipcRenderer.invoke('getUserProgress', userId),
  getProgress: (userId) => ipcRenderer.invoke('getProgress', userId),
  saveQuizResult: (quizData) => ipcRenderer.invoke('saveQuizResult', quizData),
  getUserBadges: (userId) => ipcRenderer.invoke('getUserBadges', userId),
  getBadges: (userId) => ipcRenderer.invoke('getBadges', userId),
  awardBadge: (badgeData) => ipcRenderer.invoke('awardBadge', badgeData),
  updateUserXP: (userId, xpToAdd) => ipcRenderer.invoke('updateUserXP', userId, xpToAdd),
  updateUserData: (userData) => ipcRenderer.invoke('updateUserData', userData),
  getContent: () => ipcRenderer.invoke('getContent'),
  getResources: (lessonId) => ipcRenderer.invoke('getResources', lessonId),
  getAssetPath: (path) => ipcRenderer.invoke('getAssetPath', path),
  runScraper: () => ipcRenderer.invoke('runScraper'),
});