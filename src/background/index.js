/**
 * index.js
 * -------------------------------
 * Entry point for background scripts in the Histofy Firefox Extension.
 * Initializes and triggers the history collection process upon extension startup.
 */

import './background.js';
import { collectHistory } from './historyCollector.js';

// Initial History Collection on Extension Startup
collectHistory().then(historyData => {
  console.log('Initial History Data:', historyData);

  // Store history data locally
  browser.storage.local.set({ historyData });
});
