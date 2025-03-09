import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

      try {
        const { historyLoading, historyData } = await browser.storage.local.get([
          "historyLoading",
          "historyData",
        ]);

        if (historyLoading) {
          return; // Keep loading state active
        }

        if (!historyData || historyData.length === 0) {
          setHistoryData([]);
        } else {
          // Group and count visits per domain
          const domainGroups = {};
          historyData.forEach((item) => {
            let domain;
            try {
              domain = new URL(item.url).hostname;
            } catch (e) {
              domain = item.url; // Fallback
            }
            if (!domainGroups[domain]) {
              domainGroups[domain] = {
                domain,
                category: item.category || "Uncategorized",
                visitCount: 0,
              };
            }
            domainGroups[domain].visitCount++;
          });

          // Convert object to array and sort by visit count
          const sortedHistory = Object.values(domainGroups).sort(
            (a, b) => b.visitCount - a.visitCount
          );

          setHistoryData(sortedHistory);
        }
      } catch (err) {
        console.error("❌ Error loading history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();

    // Listen for storage changes and update
    const onStorageChange = (changes, area) => {
      if (area === "local" && (changes.historyData || changes.historyLoading)) {
        fetchHistory();
      }
    };

    browser.storage.onChanged.addListener(onStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(onStorageChange);
    };
  }, []);

  return (
    <div>
      <h1>Browsing History</h1>
      {loading ? (
        <p>⏳ Loading history...</p>
      ) : historyData.length === 0 ? (
        <p>No browsing history available.</p>
      ) : (
        <ul>
          {historyData.map((group, index) => (
            <li key={index}>
              <strong>{group.domain}</strong> ({group.visitCount} visits) -{" "}
              <em>{group.category}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Render React component
const root = createRoot(document.getElementById("root"));
root.render(<Popup />);
