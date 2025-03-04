import initDB, { saveHistory, getHistory } from '../storage/sqlite.js';

const RATE_LIMIT = 2000;

// Initialize the SQLite DB
initDB().then(() => {
    console.log('✅ SQLite Initialized in historyCollector.');
}).catch(err => console.error('SQLite Initialization Error:', err));

const categorizeItem = (item) => {
    const url = item.url.toLowerCase();
    if (url.includes('developer') || url.includes('github')) return 'Developer';
    if (url.includes('news') || url.includes('article')) return 'News';
    if (url.includes('youtube') || url.includes('video')) return 'Entertainment';
    return 'General';
};

// Optimized history collection function
export const collectHistory = async () => {
    try {
        await browser.storage.local.set({ historyLoading: true });

        const endTime = Date.now();
        const startTime = endTime - (1000 * 60 * 60 * 24 * 7);
        const historyItems = await browser.history.search({
            text: '',
            startTime,
            endTime,
            maxResults: 100
        });

        for (const item of historyItems) {
            const categorizedItem = {
                title: item.title,
                url: item.url,
                category: categorizeItem(item),
                visitTime: item.lastVisitTime
            };
            saveHistory(categorizedItem);
        }

        const allData = getHistory();

        await browser.storage.local.set({
            historyData: allData,
            historyLoading: false
        });

        console.log(`✅ Collected ${historyItems.length} items, total now: ${allData.length}`);
    } catch (err) {
        console.error('❌ Error collecting history:', err);
        await browser.storage.local.set({ historyLoading: false });
    }

    setTimeout(collectHistory, RATE_LIMIT);
};

// Direct retrieval function
export const getCategorizedHistory = () => {
    return getHistory();
};

