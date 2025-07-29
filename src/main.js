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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initializeDatabase() {
  try {
    db = new Database(path.join(__dirname, '../database/app.db'), {
      verbose: console.log,
      timeout: 10000,
    });
    const setupSql = require('fs').readFileSync(path.join(__dirname, '../database/setup.sql'), 'utf8');
    db.exec(setupSql);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

async function runContentScraper() {
  try {
    console.log('Launching content scraper...');
    const scraperPath = path.join(__dirname, 'enhanced_scraper.py');
    const { stdout, stderr } = await execPromise(`python3 "${scraperPath}"`, {
      cwd: __dirname,
      timeout: 300000,
    });

    console.log('Scraper output:', stdout);
    if (stderr) console.error('Scraper errors:', stderr);

    let results;
    try {
      results = JSON.parse(stdout);
    } catch (parseError) {
      console.error('Invalid JSON output:', parseError);
      results = { success: false, error: 'Invalid scraper output' };
    }

    if (results.success && mainWindow) {
      const content = await refreshContentFromDatabase();
      mainWindow.webContents.send('content-updated', content);
      mainWindow.webContents.send('scraping-completed', results);
    }

    return { ...results, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Scraper error:', error);
    if (mainWindow) {
      mainWindow.webContents.send('scraping-completed', {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    return { success: false, error: error.message, timestamp: new Date().toISOString() };
  }
}

async function refreshContentFromDatabase() {
  try {
    const content = db.prepare('SELECT * FROM content ORDER BY module_id, lesson_id').all();
    console.log(`Content refreshed: ${content.length} lessons available`);
    return content;
  } catch (error) {
    console.error('Error refreshing content:', error);
    return [];
  }
}

async function startQuiz(quizData) {
  try {
    // Placeholder: In a full implementation, this could open a quiz window or store quiz state
    console.log('Starting quiz for lesson:', quizData.lessonId, quizData.quizData);
    if (mainWindow) {
      mainWindow.webContents.send('quiz-started', quizData);
    }
    return { success: true, lessonId: quizData.lessonId };
  } catch (error) {
    console.error('Error starting quiz:', error);
    return { success: false, error: error.message };
  }
}

function scheduleAutoScraping() {
  setInterval(async () => {
    console.log('Scheduled auto-scraping...');
    await runContentScraper();
  }, 24 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();

  setTimeout(async () => {
    const contentCount = db.prepare('SELECT COUNT(*) as count FROM content').get();
    if (contentCount.count === 0) {
      console.log('No content detected, running initial scrape...');
      mainWindow.webContents.send('scraping-started', { timestamp: new Date().toISOString() });
      await runContentScraper();
    }
  }, 5000);

  scheduleAutoScraping();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('getUser', async () => {
  return db.prepare('SELECT * FROM users LIMIT 1').get() || null;
});

ipcMain.handle('getUserData', async () => {
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

ipcMain.handle('getAssetPath', async (event, assetPath) => {
  return path.join(__dirname, '../assets', assetPath);
});

ipcMain.handle('runContentScraper', runContentScraper);

ipcMain.handle('startQuiz', async (event, quizData) => {
  return await startQuiz(quizData);
});

ipcMain.handle('getScrapingStats', async () => {
  try {
    const stats = db.prepare(`
      SELECT 
        module_id,
        COUNT(*) as total_lessons,
        SUM(CASE WHEN has_quiz = 1 THEN 1 ELSE 0 END) as lessons_with_quiz,
        AVG(xp) as avg_xp
      FROM content 
      GROUP BY module_id
    `).all();

    const totalContent = db.prepare('SELECT COUNT(*) as total FROM content').get();
    const recentContent = db.prepare(`
      SELECT COUNT(*) as recent 
      FROM content 
      WHERE scraped_at > datetime('now', '-7 days')
    `).get();

    return {
      modules: stats,
      totalLessons: totalContent.total,
      recentlyAdded: recentContent.recent,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { modules: [], totalLessons: 0, recentlyAdded: 0, lastUpdate: new Date().toISOString() };
  }
});

ipcMain.handle('manualContentRefresh', async () => {
  return await refreshContentFromDatabase();
});