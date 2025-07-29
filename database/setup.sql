CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_path TEXT,
  pdf_path TEXT,
  has_quiz BOOLEAN,
  xp INTEGER,
  quiz_data TEXT
);

CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  module_id TEXT,
  lesson_id TEXT,
  progress INTEGER,
  completed BOOLEAN,
  time_spent INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  lesson_id TEXT,
  score INTEGER,
  total_questions INTEGER,
  attempt_number INTEGER,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  badge_id TEXT,
  date_earned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id TEXT,
  type TEXT,
  path TEXT,
  title TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS scraped_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id TEXT,
  lesson_id TEXT,
  title TEXT,
  description TEXT,
  video_url TEXT,
  pdf_url TEXT,
  type TEXT,
  is_free BOOLEAN,
  source TEXT
);