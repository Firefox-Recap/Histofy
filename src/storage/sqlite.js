import initSqlJs from 'sql.js';

let db;

/**
 * Initializes the SQLite database in memory.
 */
const initDB = async () => {
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
  });
  db = new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS categorizedHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      title TEXT,
      visitTime INTEGER,
      category TEXT
    );
  `);
  console.log('SQLite DB Initialized.');
};

/**
 * Saves a categorized history item to the database.
 * 
 * @param {Object} historyItem - The categorized history item to save
 */
export const saveHistory = (historyItem) => {
  if (!db) {
    console.error('DB not initialized.');
    return;
  }
  const stmt = db.prepare(`
    INSERT INTO categorizedHistory (url, title, visitTime, category) 
    VALUES (?, ?, ?, ?);
  `);
  stmt.run([historyItem.url, historyItem.title, historyItem.visitTime, historyItem.category]);
  stmt.free();
  console.log('History item saved:', historyItem);
};

/**
 * Retrieves all categorized history from the database.
 * 
 * @returns {Array} - Array of categorized history items
 */
export const getHistory = () => {
  if (!db) {
    console.error('DB not initialized.');
    return [];
  }
  const stmt = db.prepare('SELECT * FROM categorizedHistory ORDER BY visitTime DESC;');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};

export default initDB;

