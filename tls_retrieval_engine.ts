console.log("TLS Retrieval Engine service worker loaded.");

/**
 * Attaches the chrome.debugger to the target tab. It assigns the target to the
 * chrome tab. It must wait for asynchronous methods such as
 * chrome.debugger.attach() and chrome.debugger.sendCommand(), hence attachToTab
 * is also asynchronous. It then enables the network to send events to the
 * debugger.
 * 
 * @param tab (chrome.tabs.Tab object)
 * @returns N/A
 */
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

    await chrome.debugger.sendCommand(target, "Network.enable");
    console.log("Network tracking enabled.");
  } catch (error) {
    console.error("Failed during attach / enable:", error);
  }
}

/**
 * Writes the Security Details to the console when the event, Network.responseReceived, 
 * is received through the debugger API to the debugger.
 * 
 * @param source, target tab, which is of object type chrome.debugger.Debuggee (tabId)
 * for this use case
 * @param method, which is of a string type (which is required by the callback parameter)
 * and is a CDP event name. 
 * @param params, is the payload object for an event, e.g., for Network.responseReceived,
 * the payload contains fields including requestId, loaderId, timestamp, etc.
 */
function handleDebuggerEvent(
  source: chrome.debugger.Debuggee,
  method: string,
  params?: any
): void {
  //console.log("Debugger event received:", method, params);

  if (method === "Network.responseReceived") {
    console.log("An HTTPS response was received.");

    const response = params?.response;

    if (!response) {
        console.log("No response received.");
        return;
    }

    const securityDetails = response.securityDetails;

    if (!securityDetails) {
        console.log("No security details for this response.");
        return;
    }

    console.log("TLS security details received.")
    console.log(securityDetails);
  }
}

/**
 * Writes to console that the extension has been clicked, and runs the attachToTab method.
 * @param tab (chrome.tabs.Tab object)
 */
function handleActionClick(tab: chrome.tabs.Tab): void {
  console.log("Extension icon clicked.");
  attachToTab(tab);
}

// Registers the handleDebuggerEvent function as the function to run when Chrome delivers 
// the network events.
chrome.debugger.onEvent.addListener(handleDebuggerEvent);

// Once the extension is clicked, the handleActionClick function is ran, which in turn,
// runs the attachToTab function, requesting the Network to send events through the debugger
// API. These events then fire the handleDebuggerEvent function, which then records the 
// events in console.
chrome.action.onClicked.addListener(handleActionClick);