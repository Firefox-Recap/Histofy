// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('history-list');
    const loadingMessage = document.getElementById('loading-message');
  
    async function renderHistory() {
      // Always start by showing "Loading..." until we check the flags
      loadingMessage.style.display = 'block';
      loadingMessage.textContent = '⏳ Loading history...';
      historyList.innerHTML = '';
  
      try {
        // Grab both the loading flag & the actual data
        const { historyLoading, historyData } = await browser.storage.local.get(['historyLoading', 'historyData']);
  
        // If the background is still loading history
        if (historyLoading) {
          // Keep the spinner visible
          return;
        }
  
        // If loading is done but there's no data
        if (!historyData || historyData.length === 0) {
          loadingMessage.style.display = 'none';
          historyList.innerHTML = '<li>No browsing history available.</li>';
          return;
        }
  
        // We have data, so hide the loading message
        loadingMessage.style.display = 'none';
  
        // Group & display domain visits
        const domainGroups = {};
        historyData.forEach(item => {
          let domain;
          try {
            domain = new URL(item.url).hostname;
          } catch (e) {
            domain = item.url; // Fallback if parsing fails
          }
          if (!domainGroups[domain]) {
            domainGroups[domain] = {
              domain,
              category: item.category || 'Uncategorized',
              visitCount: 0
            };
          }
          domainGroups[domain].visitCount++;
        });
  
        // Sort by domain or by visitCount, whichever you prefer
        Object.values(domainGroups)
          .sort((a, b) => b.visitCount - a.visitCount)
          .forEach(group => {
            const li = document.createElement('li');
            li.innerHTML = `
              <strong>${group.domain}</strong>
              (${group.visitCount} visits)
              - <em>${group.category}</em>
            `;
            historyList.appendChild(li);
          });
      } catch (err) {
        console.error('❌ Error rendering history:', err);
        loadingMessage.textContent = '❌ Error loading history.';
      }
    }
  
    // Initial load when the popup opens
    renderHistory();
  
    // Listen for any changes in storage so we can refresh automatically
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes.historyData || changes.historyLoading)) {
        renderHistory();
      }
    });
  });
  



