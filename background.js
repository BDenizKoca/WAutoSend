// Force-set the action icon on startup and install to defeat caches
chrome.runtime.onInstalled.addListener(() => {
  trySetIcons();
});

chrome.runtime.onStartup.addListener(() => {
  trySetIcons();
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'closeTab') {
    // Close the tab that sent the message
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id).then(() => {
        console.log('[WAS] Tab closed successfully');
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('[WAS] Error closing tab:', error);
        sendResponse({ success: false, error: error.message });
      });
    } else {
      console.error('[WAS] No valid tab ID found');
      sendResponse({ success: false, error: 'No valid tab ID' });
    }
    return true; // Keep the message channel open for async response
  }
});

function trySetIcons() {
  const path = {
    16: "icons/icon-16.png",
    24: "icons/icon-24.png",
    32: "icons/icon-32.png",
    38: "icons/icon-38.png",
    48: "icons/icon-48.png"
  };
  if (chrome.action && chrome.action.setIcon) {
    chrome.action.setIcon({ path });
    console.log('[WAS] Action icon forced via background');
  }
}
