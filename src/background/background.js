/**
 * background.js
 * ------------------------------------------------
 * Tracks browser history with optimized duplicate prevention,
 * filters, real-time classification, and includes caching
 * for repeated classification (Approach #1),
 * now with a professional fix for DB initialization ordering.
 */

// ============ Imports ============ //
import initSqlJs from 'sql.js';
import { loadModel, classifyPage } from '../../models/transformers.js';

// ============ Globals ============ //
let db; // SQLite Database instance
const recentUrls = new Set();   // Prevent immediate duplicates (within 5s)
const duplicateTimeout = 5000;   // 5-second window to prevent rapid duplicate saves

// Classification cache: (title -> category)
const classificationCache = new Map();

// We'll use this Promise to know when the AI model is ready
const modelReady = new Promise((resolve, reject) => {
  loadModel()
    .then(() => {
      console.log("🚀 Zero-Shot Classifier Ready!");
      resolve();
    })
    .catch(err => reject(err));
});

// ============ Helpers ============ //

/**
 * Normalize URLs (removes "www.", enforces https, etc.)
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    return parsed.href;
  } catch (error) {
    console.error("❌ URL Normalization Error:", error);
    return url;
  }
}

/**
 * Show all stored history in the console and return as array.
 */
function displayStoredHistory() {
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
}

// ============ Classification Cache Logic ============ //
/**
 * Classify a page title, using our in-memory cache to avoid re-running the model.
 */
async function classifyWithCache(title) {
  if (classificationCache.has(title)) {
    // Already classified this exact title
    return classificationCache.get(title);
  }
  // Otherwise, run the model and cache the result
  const category = await classifyPage(title);
  classificationCache.set(title, category);
  return category;
}

// ============ SQLite Init ============ //

/**
 * Load SQL.js, initialize an in-memory DB, and create tables if needed.
 */
async function loadDatabase() {
  try {
    const SQL = await initSqlJs({
      // If you're bundling the .wasm file, adjust locateFile as needed
      locateFile: () => browser.runtime.getURL('assets/sql-wasm.wasm')
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
}

// ============ History Saving ============ //

/**
 * Save or update a URL in the DB, classify it if the model is ready,
 * and store everything in browser.storage.local -> historyData.
 */
async function saveHistory(rawUrl, rawTitle, updateStorage = true) {
  if (!db) {
    console.error("❌ DB not initialized.");
    return;
  }
  const url = normalizeUrl(rawUrl);
  const title = rawTitle || "Untitled Page";

  // Prevent immediate duplicates (within 5 seconds)
  if (recentUrls.has(url)) {
    console.log(`🔄 Skipping duplicate (within ${duplicateTimeout / 1000}s): ${url}`);
    return;
  }
  recentUrls.add(url);
  setTimeout(() => recentUrls.delete(url), duplicateTimeout);

  const visitTime = Date.now();

  // Wait for the model to be loaded before classifying
  let category = "General";
  try {
    await modelReady; // Ensure model is fully loaded
    category = await classifyWithCache(title);
    console.log(`📝 Classified Category: ${category}`);
  } catch (error) {
    console.error("❌ Classification Error:", error);
  }

  // Insert or update the 'history' table
  const stmt1 = db.prepare(`
    INSERT INTO history (url, title, category, visitCount)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(url) DO UPDATE SET
      visitCount = visitCount + 1,
      title = excluded.title,
      category = excluded.category;
  `);
  stmt1.run([url, title, category]);
  stmt1.free();

  // Check the last visit time for this URL
  const lastVisitStmt = db.prepare(`
    SELECT visitTime FROM visit_logs
    WHERE url = ?
    ORDER BY visitTime DESC
    LIMIT 1;
  `);
  const lastVisit = lastVisitStmt.getAsObject([url]);
  lastVisitStmt.free();

  // Only save a new visit log if it's been >10 minutes since last
  if (lastVisit.visitTime && (Date.now() - lastVisit.visitTime) < 10 * 60 * 1000) {
    console.log(`🔄 Skipping revisit (within 10 min): ${url}`);
    return;
  }

  // Insert into visit_logs
  const stmt2 = db.prepare(`
    INSERT INTO visit_logs (url, visitTime)
    VALUES (?, ?);
  `);
  stmt2.run([url, visitTime]);
  stmt2.free();

  console.log("✅ Visit logged:", { url, title, visitTime });

  // If requested, update storage so popup sees fresh data
  if (updateStorage) {
    const storedHistory = displayStoredHistory();
    await browser.storage.local.set({ historyData: storedHistory });
  }
}

// ============ Bulk Initial History Fetch ============ //

/**
 * Fetch the last 7 days of browser history, classify it, and store in DB.
 * We set 'historyLoading = true' so the popup shows a loading spinner.
 */
async function fetchInitialHistory() {
  try {
    // Mark that we're starting the initial import
    await browser.storage.local.set({ historyLoading: true });

    // Fetch browsing history (last 7 days)
    const endTime = Date.now();
    const startTime = endTime - (1000 * 60 * 60 * 24 * 7);
    const initialItems = await browser.history.search({
      text: '',
      startTime,
      endTime,
      maxResults: 500
    });

    // Insert each item (no repeated storage updates)
    for (const item of initialItems) {
      await saveHistory(item.url, item.title, false);
    }

    // After finishing bulk import, do one final setStorage
    const storedHistory = displayStoredHistory();
    await browser.storage.local.set({
      historyData: storedHistory,
      historyLoading: false
    });

    console.log(`✅ Initial import done: ${initialItems.length} items total`);
  } catch (error) {
    console.error("❌ Error during initial history fetch:", error);
    await browser.storage.local.set({ historyLoading: false });
  }
}

// ============ Ad/Tracking Filters ============ //

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

/**
 * Decide if a URL is "relevant" or should be filtered out (ads, trackers, etc.).
 */
function isRelevantUrl(url) {
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
}

// ============ Event Listeners ============ //

/**
 * Attaches our event listeners, ensuring they're only registered
 * after the DB is initialized. This prevents "DB not initialized" errors
 * if visits occur too quickly.
 */
function attachEventListeners() {
  // Tracks a visited page via the history API
  browser.history.onVisited.addListener(({ url, title }) => {
    console.log("📌 onVisited Triggered for:", url);
    if (!db) return console.error("❌ DB not initialized (onVisited).");
    if (!isRelevantUrl(url)) return;
    saveHistory(url, title);
  });

  // Tracks completed page loads (tab fully loaded)
  browser.webNavigation.onCompleted.addListener(({ url, tabId }) => {
    console.log("📌 onCompleted Triggered for:", url);
    if (!db) return console.error("❌ DB not initialized (onCompleted).");
    if (!isRelevantUrl(url)) return;

    browser.tabs.get(tabId).then(tab => {
      saveHistory(url, tab.title);
    }).catch(error => {
      console.error("❌ Failed to get tab details:", error);
    });
  }, { url: [{ urlMatches: 'https?://.*' }] });
}

// ============ Initialize the Extension ============ //

(async () => {
  // 1. Load the SQLite DB
  await loadDatabase();

  // 2. Attach event listeners only after DB init (prevents "DB not initialized")
  attachEventListeners();

  // 3. Ensure the AI model is ready
  await modelReady;

  // 4. Perform initial fetch of last 7 days (so user sees something right away)
  await fetchInitialHistory();

  // 5. Optional: Quick test classification
  classifyWithCache("Elon Musk launches new AI startup")
    .then(category => console.log(`📝 Test Category: ${category}`))
    .catch(err => console.error("❌ Classification test error:", err));
})();
