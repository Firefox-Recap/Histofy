/**
 * historyCollector.js
 * -------------------------------
 * Module responsible for collecting and categorizing browsing history.
 * Utilizes simple keyword matching for initial categorization.
 * Future Improvements: Integrate NLP model for advanced topic classification.
 */

import initDB, { saveHistory, getHistory } from '../storage/sqlite.js';

const CACHE = new Map();
const RATE_LIMIT = 500;  // 500ms delay between API calls

// Initialize the SQLite database
initDB().then(() => {
  console.log('SQLite Initialized in historyCollector.');
}).catch(err => console.error('SQLite Initialization Error:', err));

/**
 * Categorizes a history item based on simple keyword matching.
 * Future improvement: Integrate NLP model for advanced categorization.
 * 
 * @param {Object} item - Browsing history item
 * @returns {String} - Category label
 */
const categorizeItem = (item) => {
  const url = item.url.toLowerCase();
  if (url.includes('developer') || url.includes('github')) return 'Developer';
  if (url.includes('news') || url.includes('article')) return 'News';
  if (url.includes('youtube') || url.includes('video')) return 'Entertainment';
  return 'General';
};

/**
 * Fetches browsing history in batches and categorizes it.
 * Stores categorized history in SQLite database.
 */
const fetchHistory = async (startTime, endTime) => {
  try {
    const historyItems = await browser.history.search({
      text: '',          // Empty text to get all history
      startTime,
      endTime,
      maxResults: 100
    });

    historyItems.forEach(item => {
      if (!CACHE.has(item.visitTime)) {
        CACHE.set(item.visitTime, item);

        // Categorize the history item
        const categorizedItem = {
          title: item.title,
          url: item.url,
          category: categorizeItem(item),
          visitTime: item.lastVisitTime
        };

        // Save categorized item to SQLite
        saveHistory(categorizedItem);
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
  }
};

/**
 * Collects and categorizes browsing history continuously.
 * Implements rate limiting to avoid API throttling.
 */
export const collectHistory = async () => {
  const endTime = Date.now();
  const startTime = endTime - (1000 * 60 * 60 * 24 * 7); // Past week

  await fetchHistory(startTime, endTime);
  setTimeout(collectHistory, RATE_LIMIT);  // Repeat with rate limit
};

/**
 * Fetches all categorized history from SQLite for display in the popup.
 * 
 * @returns {Array} - Array of categorized history items
 */
export const getCategorizedHistory = () => {
  return getHistory();
};
