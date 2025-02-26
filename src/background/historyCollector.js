/**
 * historyCollector.js
 * -------------------------------
 * Module responsible for collecting and categorizing browsing history.
 * Utilizes simple keyword matching for initial categorization.
 * Future Improvements: Integrate NLP model for advanced topic classification.
 */

/**
 * Collects browsing history and categorizes it.
 * 
 * @returns {Promise<Array>} Categorized history data
 */
export async function collectHistory() {
    // Get browsing history
    const historyItems = await browser.history.search({
      text: '',                 // Empty text to get all history
      startTime: 0,              // From the beginning of time
      maxResults: 1000           // Limit results to 1000
    });
  
    // Example categorization logic (simple keyword matching)
    const categorizedHistory = historyItems.map(item => {
      const category = item.url.includes('developer') ? 'Developer' : 'General';
      return {
        title: item.title,
        url: item.url,
        category,
        visitTime: item.lastVisitTime
      };
    });
  
    return categorizedHistory;
  }
  
