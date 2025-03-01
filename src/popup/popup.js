document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('history-list');

    // Fetch categorized history from background script or storage
    browser.storage.local.get(['categorizedHistory']).then(result => {
        const historyItems = result.categorizedHistory || [];

        if (historyItems.length === 0) {
            historyList.innerHTML = '<li>No history available.</li>';
        } else {
            historyItems.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${item.url}" target="_blank">${item.title}</a> - <em>${item.category}</em>`;
                historyList.appendChild(li);
            });
        }
    }).catch(err => console.error('Error fetching history:', err));
});
