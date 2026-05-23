const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'tasks.db');

let db = null;

/**
 * Converts a raw row from sql.js (with completed as 0/1 integer)
 * to a plain JS object with completed as boolean.
 */
function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    created_at: row.created_at,
  };
}

/**
 * Persists the in-memory SQLite database to tasks.db on disk.
 * Must be called AFTER reading last_insert_rowid() because
 * db.export() resets it to 0.
 */
function save() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Initializes the database: loads existing tasks.db if present,
 * creates a new in-memory database otherwise, and runs schema migration.
 */
async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
    )
  `);

  save();
}

// Auto-initialize on first require
const initPromise = init();

async function getAllTasks() {
  await initPromise;
  const stmt = db.prepare('SELECT id, title, completed, created_at FROM tasks ORDER BY created_at ASC');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows.map(toTask);
}

async function getTaskById(id) {
  await initPromise;
  const stmt = db.prepare('SELECT id, title, completed, created_at FROM tasks WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return toTask(row);
  }
  stmt.free();
  return null;
}

async function createTask(title) {
  await initPromise;
  db.run('INSERT INTO tasks (title) VALUES (?)', [title]);
  const rowId = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
  save();
  return getTaskById(rowId);
}

async function updateTask(id, { completed }) {
  await initPromise;
  const existing = await getTaskById(id);
  if (!existing) return null;

  const completedInt = completed ? 1 : 0;
  db.run('UPDATE tasks SET completed = ? WHERE id = ?', [completedInt, id]);
  save();
  return getTaskById(id);
}

async function deleteTask(id) {
  await initPromise;
  const existing = await getTaskById(id);
  if (!existing) return null;

  db.run('DELETE FROM tasks WHERE id = ?', [id]);
  save();
  return true;
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
