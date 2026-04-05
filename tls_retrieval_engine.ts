console.log("TLS Retrieval Engine service worker loaded.");

async function attachToTab(tab: chrome.tabs.Tab): Promise<void> {
  try {
    if (tab.id === undefined) {
      console.error("Tab has no id.");
      return;
    }

    if (!tab.url || !tab.url.startsWith("http")) {
      console.error("Tab is not a normal web page:", tab.url);
      return;
    }

    const target: chrome.debugger.Debuggee = {
      tabId: tab.id,
    };

    await chrome.debugger.attach(target, "1.3");
    console.log(`Attached debugger to tab ${tab.id} (${tab.url})`);
  } catch (error) {
    console.error("Failed to attach debugger:", error);
  }
}

function handleActionClick(tab: chrome.tabs.Tab): void {
    console.log("Extension icon clicked.");
    attachToTab(tab);
}

chrome.action.onClicked.addListener(handleActionClick);