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
  runContentScraper: () => ipcRenderer.invoke('runContentScraper'),
  getScrapingStats: () => ipcRenderer.invoke('getScrapingStats'),
  manualContentRefresh: () => ipcRenderer.invoke('manualContentRefresh'),
  startQuiz: (quizData) => ipcRenderer.invoke('startQuiz', quizData),
  onContentUpdated: (callback) => {
    ipcRenderer.on('content-updated', (event, content) => callback(content));
  },
  removeContentUpdatedListener: () => {
    ipcRenderer.removeAllListeners('content-updated');
  },
  onScrapingStarted: (callback) => {
    ipcRenderer.on('scraping-started', (event, data) => callback(data));
  },
  onScrapingCompleted: (callback) => {
    ipcRenderer.on('scraping-completed', (event, results) => callback(results));
  },
  onQuizStarted: (callback) => {
    ipcRenderer.on('quiz-started', (event, quizData) => callback(quizData));
  },
  removeScrapingListeners: () => {
    ipcRenderer.removeAllListeners('scraping-started');
    ipcRenderer.removeAllListeners('scraping-completed');
  },
  removeQuizListeners: () => {
    ipcRenderer.removeAllListeners('quiz-started');
  },
});