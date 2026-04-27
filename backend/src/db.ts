import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'codeburn.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    project_name TEXT NOT NULL,
    session_file_path TEXT NOT NULL UNIQUE,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    model TEXT,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cache_read_tokens INTEGER DEFAULT 0,
    total_cache_write_tokens INTEGER DEFAULT 0,
    total_cost_usd REAL DEFAULT 0,
    turn_count INTEGER DEFAULT 0,
    activities TEXT,
    one_shot_rates TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_aggregates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    provider TEXT NOT NULL,
    project_name TEXT,
    model TEXT,
    activity TEXT,
    cost_usd REAL DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cache_write_tokens INTEGER DEFAULT 0,
    call_count INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    one_shot_success_rate REAL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_path
    ON sessions(provider, session_file_path);
  CREATE INDEX IF NOT EXISTS idx_daily_date
    ON daily_aggregates(date, provider);
`);

export default db;