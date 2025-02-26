/**
 * background.js
 * -------------------------------
 * Event listener script for monitoring browser history changes.
 * Triggers the history collection and categorization process upon visiting new pages.
 */

import { collectHistory } from './historyCollector.js';

// Listen for history changes and update storage
browser.history.onVisited.addListener(() => {
  collectHistory().then(historyData => {
    console.log('Updated History Data:', historyData);

    // Update the stored history data
    browser.storage.local.set({ historyData });
  });
});
