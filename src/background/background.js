/**
 * background.js
 * -------------------------------
 * Event listener script for monitoring browser history changes.
 * Triggers the history collection and categorization process upon visiting new pages.
 * Now includes SQL.js initialization for storing categorized history.
 * Enhanced with advanced URL filtering logic.
 */

import initSqlJs from 'sql.js';

let db;  // SQLite Database instance

// Load SQL.js and initialize the database
const loadDatabase = async () => {
  try {
    const SQL = await initSqlJs({
      // Load the Wasm file from the extension's own assets folder
      locateFile: () => browser.runtime.getURL(`assets/sql-wasm.wasm`)
    });

    // Initialize the database
    db = new SQL.Database();
    console.log("SQLite Database initialized successfully!");

    // Create a table for categorized history if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        title TEXT,
        visitTime TIMESTAMP,
        category TEXT
      );
    `);
    console.log("History table created or already exists.");
  } catch (error) {
    console.error("SQLite Initialization Error:", error);
  }
};

// Function to Fetch and Display Stored History
const displayStoredHistory = () => {
  if (!db) {
    console.error("DB not initialized.");
    return;
  }
  
  const results = [];
  const stmt = db.prepare("SELECT * FROM history ORDER BY visitTime DESC;");
  
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  
  stmt.free();
  console.log("Stored History Data:", results);
  return results;
};

// Function to Save History
const saveHistory = async (url, title) => {
  if (!db) {
    console.error("DB not initialized.");
    return;
  }

  const visitTime = Date.now();
  const category = "General"; // You can enhance this with categorization logic

  const item = {
    url,
    title,
    visitTime,
    category
  };

  const stmt = db.prepare(`
    INSERT INTO history (url, title, visitTime, category) 
    VALUES (?, ?, ?, ?);
  `);
  stmt.run([item.url, item.title, item.visitTime, item.category]);
  stmt.free();

  console.log("History item saved:", item);

  // Display Stored History after Saving
  const storedHistory = displayStoredHistory();
  browser.storage.local.set({ historyData: storedHistory });
};

/**
 * Function to Check if URL is Relevant for History
 * Filters out known ad domains, tracking parameters, and tracking pixels.
 * 
 * @param {String} url - The URL to check
 * @returns {Boolean} - True if the URL is relevant, False otherwise
 */
const isRelevantUrl = (url) => {
  // Filter out known ad and tracking domains
  const adDomains = [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'google-analytics.com',
    'adsrvr.org',
    'fls.doubleclick.net',
    'adservice.google.com',
    'adservice.google.co',
    'ct.pinterest.com',
    'facebook.com/tr',
    'twitter.com/i/adsct'
  ];

  // Filter out URLs with common tracking parameters
  const trackingParams = ['utm_', 'gclid=', 'fbclid=', 'ref='];

  // Check if URL contains an ad domain
  const isAdDomain = adDomains.some(domain => url.includes(domain));
  if (isAdDomain) {
    console.log(`Filtered Out (Ad Domain): ${url}`);
    return false;
  }

  // Check if URL has tracking parameters
  const hasTrackingParams = trackingParams.some(param => url.includes(param));
  if (hasTrackingParams) {
    console.log(`Filtered Out (Tracking Param): ${url}`);
    return false;
  }

  // Check if it's a known tracking pixel or beacon
  const isTrackingPixel = url.endsWith('.gif') || url.endsWith('.png');
  if (isTrackingPixel) {
    console.log(`Filtered Out (Tracking Pixel): ${url}`);
    return false;
  }

  return true;
};

// Trigger on History Visit
browser.history.onVisited.addListener(({ url, title }) => {
  console.log("onVisited Triggered for:", url);

  // Filter irrelevant URLs
  if (!isRelevantUrl(url)) return;

  saveHistory(url, title);
});

// Trigger on Navigation Completion
browser.webNavigation.onCompleted.addListener(({ url, tabId }) => {
  console.log("onCompleted Triggered for:", url);

  // Filter irrelevant URLs
  if (!isRelevantUrl(url)) return;

  // Get tab details to retrieve the title
  browser.tabs.get(tabId).then(tab => {
    saveHistory(url, tab.title);
  }).catch(error => {
    console.error("Failed to get tab details:", error);
  });
}, {
  url: [{ urlMatches: 'https?://.*' }]  // Match all HTTP/HTTPS URLs
});

// Initialize the Database
loadDatabase();
