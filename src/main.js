const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  // Load React frontend by default
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
  // Uncomment to load vanilla JS frontend for testing
  // mainWindow.loadFile(path.join(__dirname, 'vanilla/index-vanilla.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initializeDatabase() {
  try {
    db = new Database(path.join(__dirname, '../database/app.db'), { verbose: console.log });
    const setupSql = require('fs').readFileSync(path.join(__dirname, '../database/setup.sql'), 'utf8');
    db.exec(setupSql);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for both React and Vanilla JS
ipcMain.handle('getUser', async () => {
  const row = db.prepare('SELECT * FROM users LIMIT 1').get();
  return row || null;
});

ipcMain.handle('getUserData', async () => {
  // Alias for React frontend
  return await ipcMain.handle('getUser');
});

ipcMain.handle('createUser', async (event, userData) => {
  const stmt = db.prepare('INSERT INTO users (name, avatar, xp, level) VALUES (?, ?, ?, ?)');
  const result = stmt.run(userData.name, userData.avatar, 0, 1);
  return result.lastInsertRowid;
});

ipcMain.handle('updateUserProgress', async (event, progressData) => {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO user_progress (user_id, module_id, lesson_id, progress, completed, time_spent) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    progressData.userId || progressData.user_id,
    progressData.moduleId || progressData.module_id,
    progressData.lessonId || progressData.lesson_id,
    progressData.progress,
    progressData.completed ? 1 : 0,
    progressData.timeSpent || progressData.time_spent || 0
  );
  return result.changes;
});

ipcMain.handle('getProgress', async (event, userId) => {
  // Alias for React frontend
  return await ipcMain.handle('getUserProgress', null, userId);
});

ipcMain.handle('getUserProgress', async (event, userId) => {
  return db.prepare('SELECT * FROM user_progress WHERE user_id = ?').all(userId);
});

ipcMain.handle('saveQuizResult', async (event, quizData) => {
  const stmt = db.prepare(
    'INSERT INTO quiz_results (user_id, lesson_id, score, total_questions, attempt_number) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    quizData.userId || quizData.user_id,
    quizData.lessonId || quizData.lesson_id,
    quizData.score,
    quizData.totalQuestions || quizData.total_questions,
    quizData.attemptNumber || quizData.attempt_number
  );
  return result.lastInsertRowid;
});

ipcMain.handle('getUserBadges', async (event, userId) => {
  return db.prepare('SELECT * FROM user_badges WHERE user_id = ?').all(userId);
});

ipcMain.handle('getBadges', async (event, userId) => {
  // Alias for React frontend
  return await ipcMain.handle('getUserBadges', null, userId);
});

ipcMain.handle('awardBadge', async (event, badgeData) => {
  const stmt = db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)');
  const result = stmt.run(badgeData.userId || badgeData.user_id, badgeData.badgeId || badgeData.badge_id);
  return result.lastInsertRowid;
});

ipcMain.handle('updateUserXP', async (event, userId, xpToAdd) => {
  const stmt = db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
  const result = stmt.run(xpToAdd, userId);
  return result.changes;
});

ipcMain.handle('updateUserData', async (event, userData) => {
  const stmt = db.prepare('UPDATE users SET name = ?, avatar = ?, xp = ?, level = ? WHERE id = ?');
  const result = stmt.run(userData.name, userData.avatar, userData.xp, userData.level, userData.id);
  return result.changes;
});

ipcMain.handle('getContent', async () => {
  return db.prepare('SELECT * FROM content').all();
});

ipcMain.handle('getResources', async (event, lessonId) => {
  return db.prepare('SELECT * FROM resources WHERE lesson_id = ?').all(lessonId);
});

ipcMain.handle('getAssetPath', async (event, path) => {
  // Convert local paths to CDN for consistency
  return path.replace(/^assets\//, 'https://CHAHBG.github.io/infoapp-assets/');
});

ipcMain.handle('runScraper', async () => {
  try {
    const { stdout } = await execPromise('python3 scraper.py', { cwd: __dirname });
    const scrapedAssets = JSON.parse(stdout);
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO content (lesson_id, module_id, title, video_path, pdf_path, has_quiz, xp, quiz_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    let count = 0;
    for (const asset of scrapedAssets) {
      stmt.run(
        asset.lesson_id,
        asset.module_id,
        asset.title,
        `https://CHAHBG.github.io/infoapp-assets/videos/${asset.lesson_id}.mp4`,
        asset.pdf_path ? `https://CHAHBG.github.io/infoapp-assets/pdf/${asset.lesson_id}.pdf` : null,
        asset.has_quiz ? 1 : 0,
        asset.xp || 10,
        asset.quiz_data || null
      );
      count++;
    }
    return count;
  } catch (error) {
    console.error('Scraper error:', error);
    throw error;
  }
});