console.log("TLS Retrieval Engine service worker loaded.");

let selectedTab: chrome.tabs.Tab | null = null;
let attachedTabId: number | null

const BACKEND_BASE_URL = "http://localhost:5000";
const CERTIFICATE_ENDPOINT = `${BACKEND_BASE_URL}/api/certificates/`;

/**
 * Need to create a filter that only allows 
 */

/**
 * Constructs a chrome.debugger.Debuggee from the tabID, and attaches the 
 * debugger to the constructed target. It must wait for asynchronous methods 
 * such as chrome.debugger.attach() and chrome.debugger.sendCommand(), hence
 * attachToTab is also asynchronous. It then enables the network to send 
 * events to the debugger.
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

async function detachFromTab(tabId: number): Promise<void> {
  try {
    await chrome.debugger.detach({tabId: tabId});
    console.log(`Detached debugger from tab ${tabId}.`);
  } catch (error) {
    console.error("Failed to detach debugger:", error);
  }
}

/**
 * Writes the TLS Security Details to the console when the event, Network.responseReceived, 
 * is received through chrome.debugger.onEvent, and the hostname of the selected
 * tab is identical to the hostname of the response URL. It then builds a certificate
 * payload in the format expected by the backend, and logs that payload as a formatted JSON, 
 * before sending the formatted JSON to the backend via sendCertToBackend().
 * 
 * @param _source, target tab, which is of object type chrome.debugger.Debuggee (tabId)
 * for this use case
 * @param method, which is of a string type (which is required by the callback parameter)
 * and is a CDP event name. 
 * @param params, is the payload object for an event, e.g., for Network.responseReceived,
 * the payload contains fields including requestId, loaderId, timestamp, etc.
 */
async function handleDebuggerEvent(
  source: chrome.debugger.Debuggee,
  method: string,
  params?: any
): Promise<void> {

    if (method !== "Network.responseReceived") {
        return;
    }

    console.log("A Network.responseReceived event was received.");

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

    if (!selectedTab?.url) {
        console.log("No selected tab stored.");
        return;
    }

    const responseHostname = new URL(response.url).hostname;
    const selectedHostname = new URL(selectedTab.url).hostname;

    if (responseHostname === selectedHostname) {
        const payload = {
          url: response.url,
          protocol: securityDetails.protocol,
          cipher: securityDetails.cipher ?? "",


          subjectName: securityDetails.subjectName ?? "",
          sanList: securityDetails.sanList ?? [],
          issuer: securityDetails.issuer ?? "",
          validFrom: Math.trunc(securityDetails.validFrom),
          validTo: Math.trunc(securityDetails.validTo),

          certificateTransparencyCompliance:
            securityDetails.certificateTransparencyCompliance ?? "unknown",

        };

        console.log("TLS certificate payload captured.");
        console.log(JSON.stringify(payload, null, 2));

        await sendCertToBackend(payload);

        if (source.tabId !== undefined) {
          await detachFromTab(source.tabId);
          attachedTabId = null;
        }

        return;
    }

    console.log("TLS security details received, but hostname did not match.");

    //console.log(securityDetails);
  
}

/**
 * Writes to console that the extension has been clicked, and runs the attachToTab method.
 * It also selects the tab, which will determine the selectedHostname to be compared 
 * with when recording TLS metadata.
 * @param tab (chrome.tabs.Tab object)
 */

// function handleActionClick(tab: chrome.tabs.Tab): void {
//   console.log("Extension icon clicked.");
//   selectedTab = tab;
//   attachToTab(tab);
// }

/**
 * 
 * @returns the current tab that the user is currently on
 */
//async function getCurrentTab() {
  //let queryOptions = {active: true, lastFocusedWindow: true};
  //let [tab] = await chrome.tabs.query(queryOptions);
  //return tab;
//}

async function handleOnUpdate(_tabId: number, changeInfo: {url?: string}, tab: chrome.tabs.Tab): Promise <void> {
  if (!changeInfo.url) {
    return;
  }
  if (!changeInfo.url.startsWith("https://")) {
    return;
  }
  if (!tab.active) {
    return;
  }

  const window = await chrome.windows.get(tab.windowId);

  if (!window.focused) {
    return;
  }
  if (tab.id === undefined) {
    return;
  }
  if (attachedTabId !== null) {
    console.log("Debugger already attached - waiting for current capture to finish.");
    return;
  }
  
  selectedTab = tab;
  attachedTabId = tab.id;
  console.log("tls_retriever is listening.");
  attachToTab(selectedTab);

}



/**
 * Sends a POST request to the backend, with JSON headers and a JSON body containing the
 * TLS certificate metadata payload, using fetch(). The backend's reply is then sent back,
 * as a Response object. If the TLS certificate metadata was accepted, then the saved
 * Certificate sent, will be recorded in the console. Otherwise, the Certificate will be
 * rejected by the backend, or if the TLS certificate was not sent at all, these errors
 * will be logged.
 * @param payload 
 * @returns void
 */
async function sendCertToBackend(payload: object): Promise<void> {
  try {
    const response = await fetch(CERTIFICATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend rejected TLS certificate:", response.status, errorText);
      return;
    }

    const savedCertificate = await response.json();
    console.log("TLS certificate saved to backend:");
    console.log(savedCertificate);
  } catch (error) {
    console.error("Failed to send TLS certificate to backend:", error);
  }
}

// Registers the handleDebuggerEvent function as the function to run when Chrome delivers 
// the network events.
chrome.debugger.onEvent.addListener(handleDebuggerEvent);

// Once the extension is clicked, the handleActionClick function is ran, which in turn,
// runs the attachToTab function, requesting the Network to send events through the debugger
// API. These events then fire the handleDebuggerEvent function, which then records the 
// securityDetails from specific events in console.
//chrome.action.onClicked.addListener(handleActionClick);

chrome.tabs.onUpdated.addListener(handleOnUpdate);
