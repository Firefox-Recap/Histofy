/**
 * background.js
 * -----------------------------------------------
 * Tracks browser history with optimized duplicate prevention,
 * optional filtering of utility sub-URLs, and revisit tracking.
 */
import initSqlJs from 'sql.js';

let db; // SQLite Database instance
const recentUrls = new Set(); // Tracks URLs temporarily to prevent immediate duplicates
const duplicateTimeout = 5000; // 5-second window to prevent rapid duplicate saves

// Normalize URLs (removes "www.", enforces https)
const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    return parsed.href;
  } catch (error) {
    console.error("❌ URL Normalization Error:", error);
    return url;
  }
};

// Load SQL.js and initialize the database
const loadDatabase = async () => {
  try {
    const SQL = await initSqlJs({
      locateFile: () => browser.runtime.getURL(`assets/sql-wasm.wasm`)
    });

    db = new SQL.Database();
    console.log("✅ SQLite Database initialized successfully!");

    db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE,
        title TEXT,
        category TEXT,
        visitCount INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS visit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        visitTime TIMESTAMP,
        FOREIGN KEY(url) REFERENCES history(url)
      );
    `);

    console.log("✅ History & Visit Logs tables created or already exist.");
  } catch (error) {
    console.error("❌ SQLite Initialization Error:", error);
  }
};

// Fetch stored history
const displayStoredHistory = () => {
  if (!db) {
    console.error("❌ DB not initialized.");
    return [];
  }

  const results = [];
  const stmt = db.prepare("SELECT * FROM history ORDER BY id DESC;");
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();

  console.log("🔍 Stored History Data:", results);
  return results;
};

// Save history with revisit tracking
const saveHistory = async (url, title) => {
  if (!db) {
    console.error("❌ DB not initialized.");
    return;
  }

  url = normalizeUrl(url);
  if (!title) title = "Untitled Page";

  // Prevent immediate duplicate entries (within 5 seconds)
  if (recentUrls.has(url)) {
    console.log(`🔄 Skipping duplicate (within ${duplicateTimeout / 1000}s): ${url}`);
    return;
  }

  recentUrls.add(url);
  setTimeout(() => recentUrls.delete(url), duplicateTimeout); // Clear URL after timeout

  const visitTime = Date.now();
  const category = "General"; // Placeholder for categorization

  // Ensure URL exists in history table
  const stmt1 = db.prepare(`
    INSERT INTO history (url, title, category, visitCount) 
    VALUES (?, ?, ?, 1) 
    ON CONFLICT(url) DO UPDATE SET visitCount = visitCount + 1;
  `);
  stmt1.run([url, title, category]);
  stmt1.free();

  // Check the last visit time for this URL
  const lastVisitStmt = db.prepare(`
    SELECT visitTime FROM visit_logs WHERE url = ? ORDER BY visitTime DESC LIMIT 1;
  `);
  const lastVisit = lastVisitStmt.getAsObject([url]);

  // Only save revisit if it's been more than 10 minutes since the last visit
  if (lastVisit.visitTime && (Date.now() - lastVisit.visitTime) < (10 * 60 * 1000)) {
    console.log(`🔄 Skipping revisit (within 10 min): ${url}`);
    return;
  }

  // Log the visit in visit_logs
  const stmt2 = db.prepare(`
    INSERT INTO visit_logs (url, visitTime) 
    VALUES (?, ?);
  `);
  stmt2.run([url, visitTime]);
  stmt2.free();

  console.log("✅ Visit logged:", { url, title, visitTime });

  const storedHistory = displayStoredHistory();
  await browser.storage.local.set({ historyData: storedHistory });
};

// Optional: Filter out utility sub-URLs you don’t want to store at all
const adDomains = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'google-analytics.com', 'adsrvr.org', 'fls.doubleclick.net',
  'adservice.google.com', 'adservice.google.co', 'ct.pinterest.com',
  'facebook.com/tr', 'twitter.com/i/adsct'
];

const trackingParams = [
  'utm_', 'gclid=', 'fbclid=', 'ref=', 'trk=', 'clickid=', 
  'sessionid=', 'tracking'
];

// Utility or static paths you may want to ignore
const utilityPaths = ['/static/', '/localStorage'];

const isRelevantUrl = (url) => {
  // 1. Check ad domains
  if (adDomains.some(domain => url.includes(domain))) {
    console.log(`⚠️ Filtered Out (Ad Domain): ${url}`);
    return false;
  }

  // 2. Check tracking parameters
  if (trackingParams.some(param => url.includes(param))) {
    console.log(`⚠️ Filtered Out (Tracking Param): ${url}`);
    return false;
  }

  // 3. Check known utility paths
  if (utilityPaths.some(path => url.includes(path))) {
    console.log(`⚠️ Filtered Out (Utility Path): ${url}`);
    return false;
  }

  // 4. Filter out tracking pixels
  if (url.endsWith('.gif') || url.endsWith('.png')) {
    console.log(`⚠️ Filtered Out (Tracking Pixel): ${url}`);
    return false;
  }

  return true;
};

// Track visited pages
browser.history.onVisited.addListener(({ url, title }) => {
  console.log("📌 onVisited Triggered for:", url);

  if (!isRelevantUrl(url)) return;
  saveHistory(url, title);
});

// Track completed page loads
browser.webNavigation.onCompleted.addListener(({ url, tabId }) => {
  console.log("📌 onCompleted Triggered for:", url);

  if (!isRelevantUrl(url)) return;

  browser.tabs.get(tabId).then(tab => {
    saveHistory(url, tab.title);
  }).catch(error => {
    console.error("❌ Failed to get tab details:", error);
  });
}, { url: [{ urlMatches: 'https?://.*' }] });

// Initialize the database on load
loadDatabase();

