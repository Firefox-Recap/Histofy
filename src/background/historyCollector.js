/**
 * historyCollector.js
 * ---------------------------------------
 * Collects & categorizes history, then stores it in browser.storage.local.
 * Uses a 'historyLoading' flag to indicate when the UI should show a spinner.
 */

import initDB, { saveHistory, getHistory } from '../storage/sqlite.js';

// How often we poll for new history (ms)
const RATE_LIMIT = 2000;

// Initialize the SQLite DB
initDB().then(() => {
  console.log('✅ SQLite Initialized in historyCollector.');
}).catch(err => console.error('SQLite Initialization Error:', err));

/**
 * Simple keyword-based categorizer
 */
const categorizeItem = (item) => {
  const url = item.url.toLowerCase();
  if (url.includes('developer') || url.includes('github')) return 'Developer';
  if (url.includes('news') || url.includes('article')) return 'News';
  if (url.includes('youtube') || url.includes('video')) return 'Entertainment';
  return 'General';
};

/**
 * Fetch recent browsing history and store it in SQLite + browser.storage.
 * Sets a 'historyLoading' flag so the popup knows to show a loading spinner.
 */
export const collectHistory = async () => {
  try {
    // 1. Indicate we're starting to load
    await browser.storage.local.set({ historyLoading: true });

    // 2. Fetch history from the last 7 days (adjust as needed)
    const endTime = Date.now();
    const startTime = endTime - (1000 * 60 * 60 * 24 * 7); // 1 week
    const historyItems = await browser.history.search({
      text: '',
      startTime,
      endTime,
      maxResults: 100
    });

    // 3. Categorize and store in SQLite
    for (const item of historyItems) {
      const categorizedItem = {
        title: item.title,
        url: item.url,
        category: categorizeItem(item),
        visitTime: item.lastVisitTime
      };
      saveHistory(categorizedItem);
    }

    // 4. Once done, grab all history from SQLite
    const allData = getHistory();

    // 5. Store the final array + set loading = false
    await browser.storage.local.set({
      historyData: allData,
      historyLoading: false
    });

    console.log(`✅ Collected ${historyItems.length} items, total now: ${allData.length}`);
  } catch (err) {
    console.error('❌ Error collecting history:', err);
    // Even on error, clear the loading flag
    await browser.storage.local.set({ historyLoading: false });
  }

  // Schedule next run
  setTimeout(collectHistory, RATE_LIMIT);
};

/**
 * For direct (on-demand) retrieval if needed
 */
export const getCategorizedHistory = () => {
  return getHistory();
};
