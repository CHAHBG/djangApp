-- Table for scraped content
CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id TEXT NOT NULL,
    lesson_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_path TEXT,
    pdf_path TEXT,
    has_quiz BOOLEAN DEFAULT 0,
    xp INTEGER DEFAULT 0,
    quiz_data TEXT,
    source_name TEXT,
    license_info TEXT,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
);

-- Table for user progress
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    progress REAL DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES content(lesson_id)
);

-- Table for quiz results
CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES content(lesson_id)
);

-- Table for user badges
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_id TEXT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table for resources
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES content(lesson_id)
);