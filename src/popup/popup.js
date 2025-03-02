/**
 * popup.js
 * -----------------------------------------------
 * Displays browsing history in a grouped domain format, showing
 * how many times each domain was visited.
 */
document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('history-list');

    function fetchHistory() {
        browser.storage.local.get(['historyData']).then(result => {
            const historyItems = result.historyData || [];
            historyList.innerHTML = ''; // Clear list before adding new items

            if (historyItems.length === 0) {
                historyList.innerHTML = '<li>No history available.</li>';
                return;
            }

            // Group history by domain
            const domainGroups = {};

            historyItems.forEach(item => {
                // Parse the domain from the URL
                let domain;
                try {
                    const parsed = new URL(item.url);
                    domain = parsed.hostname;  // e.g., "monterey.craigslist.org"
                } catch (e) {
                    domain = item.url; // fallback if URL parsing fails
                }

                if (!domainGroups[domain]) {
                    domainGroups[domain] = {
                        domain,
                        category: item.category || 'Uncategorized',
                        visitCount: 0
                    };
                }
                // Increment the domain’s total visit count
                domainGroups[domain].visitCount++;
            });

            // Optional: sort domains alphabetically
            const sortedDomains = Object.values(domainGroups)
                .sort((a, b) => a.domain.localeCompare(b.domain));

            // Render each domain with total visit count
            sortedDomains.forEach(group => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${group.domain}</strong> 
                    (${group.visitCount} visits) 
                    - <em>${group.category}</em>
                `;
                historyList.appendChild(li);
            });

        }).catch(err => console.error('❌ Error fetching history:', err));
    }

    // Fetch history when the popup opens
    fetchHistory();

    // Listen for storage updates and refresh automatically
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.historyData) {
            fetchHistory();
        }
    });
});



