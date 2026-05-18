import { setCurrentCertificateData, getActiveDomains } from "./api/storage";
import { getValidAccessToken } from "./api/auth";
import { BACKEND_BASE_URL } from "./base_url";

console.log("TLS Retrieval Engine service worker loaded.");

chrome.runtime.onInstalled.addListener(() => {
  try {
    if (chrome.storage?.session?.setAccessLevel) {
      chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
    }
  } catch (e) {
    console.error("Error setting session storage access level:", e);
  }
});

const CERTIFICATE_ENDPOINT = `${BACKEND_BASE_URL}/api/certificates/`;

let attachedTabId: number | null = null;

const processingCerts = new Set<string>();
const completedCerts = new Set<string>();

/**
 * Clears the sets used to store certs that came from URLs within a once-attached-tab,
 * upon the debugger detaching from the tab.
 * 
 * @param tabId 
 */
function clearCertStateForTab(tabId: number): void {
  const prefix = `${tabId}:`;

  for (const key of processingCerts) {
    if (key.startsWith(prefix)) {
      processingCerts.delete(key);
    }
  }

  for (const key of completedCerts) {
    if (key.startsWith(prefix)) {
      completedCerts.delete(key);
    }
  }
}

/**
 * Constructs a chrome.debugger.Debuggee from the tabID, and attaches the
 * debugger to the constructed target. It must wait for asynchronous methods
 * such as chrome.debugger.attach() and chrome.debugger.sendCommand(), hence
 * attachToTab is also asynchronous. It then enables the network to send
 * events to the debugger.
 *
 * @param tab The Chrome tab to attach the debugger to.
 * @returns true if the debugger was attached and Network events were enabled
 */
async function attachToTab(tab: chrome.tabs.Tab): Promise<boolean> {
  try {
    if (tab.id === undefined) {
      console.error("Tab has no id.");
      return false;
    }

    if (!tab.url || !tab.url.startsWith("http")) {
      console.error("Tab is not a normal web page:", tab.url);
      return false;
    }

    const target: chrome.debugger.Debuggee = {
      tabId: tab.id,
    };

    await chrome.debugger.attach(target, "1.3");
    console.log(`Attached debugger to tab ${tab.id} (${tab.url})`);

    await chrome.debugger.sendCommand(target, "Network.enable");
    console.log("Network tracking enabled.");

    return true;
  } catch (error) {
    console.error("Failed during attach / enable:", error);
    return false;
  }
}

/**
 * Receives a chrome.debugger.Debugge (tabId), and detaches the debugger from the 
 * debuggee. Upon detaching, the sets used to track the certs being processed or
 * completed, are cleared, for the next tab.
 * 
 * @param tabId The chrome.debugger.Debuggee the debugger attaches to.
 */
async function detachFromTab(tabId: number): Promise<void> {
  try {
    await chrome.debugger.detach({tabId});
    console.log(`Detached debugger from tab ${tabId}.`);
  } catch (error) {
    console.warn("Failed to detach debugger:", error);
  } finally {
    if (attachedTabId === tabId) {
      attachedTabId = null;
    }

    clearCertStateForTab(tabId);
  }
}

/**
 * After receiving user authentication, starts passively listening to all URLs,
 * in all tabs, in all windows, of a Chrome session, before filtering for only
 * the active tab the user is on.
 * 
 * Excepts any websites with the google domain, as networkEvents cannot be
 * retrieved from websites with the google domain.
 * 
 * Detaches debugger from the old active tab if a new active tab is detected.
 * 
 * Attaches debugger to the new active tab.
 * 
 * @param _tabId 
 * @param changeInfo 
 * @param tab 
 * @returns void
 */
async function handleOnUpdate(
  _tabId: number,
  changeInfo: { url?: string },
  tab: chrome.tabs.Tab,
): Promise<void> {
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
     console.log("User is not signed in. Skipping TLS retrieval.");
     return;
  }
  if (!changeInfo.url) {
    return;
  }
  if (!changeInfo.url.startsWith("https://")) {
    return;
  }
  const activeDomains = await getActiveDomains();
  var domainIsActive: boolean = false;
  if (activeDomains != null) {
    for (const activeDomain of activeDomains) {
      if (changeInfo.url.startsWith(activeDomain)) {
        domainIsActive = true;
      }
    }
    if (domainIsActive === false) {
      console.log("NOT IN ACTIVE DOMAINS", activeDomains)
      return;
    }
    console.log("idk")
  }
  if (changeInfo.url.startsWith("https://www.google.com/")) {
    console.log("Google search detected - ignoring to prevent excessive captures.");
    return;
  } else {
    console.log("Tab URL updated to:", changeInfo.url);
  }
  if (!tab.active) {
    return;
  }

  const currentWindow = await chrome.windows.get(tab.windowId);

  if (!currentWindow.focused) {
    return;
  }
  if (tab.id === undefined) {
    return;
  }
  if (attachedTabId === tab.id) {
    console.log("Debugger already attached to this tab.");
    return;
  }
  if (attachedTabId !== null && attachedTabId !== tab.id) {
    console.log(
      `Debugger currently attached to tab ${attachedTabId}. Detaching before switching to tab ${tab.id}.`
    );

    await detachFromTab(attachedTabId);
  }

  console.log("tls_retriever is listening.");

  const attached = await attachToTab(tab);

  if (!attached) {
    return;
  }

  attachedTabId = tab.id;

}

/**
 * Writes the TLS Security Details to the console when the event, Network.responseReceived,
 * is received through chrome.debugger.onEvent, and the hostname of the selected
 * tab is identical to the hostname of the response URL. It then builds a certificate
 * payload in the format expected by the backend, and logs that payload as a formatted JSON,
 * before sending the formatted JSON to the backend via sendCertToBackend().
 *
 * @param source, target tab, which is of object type chrome.debugger.Debuggee (tabId)
 * for this use case
 * @param method, which is of a string type (which is required by the callback parameter)
 * and is a CDP event name.
 * @param params, is the payload object for an event, e.g., for Network.responseReceived,
 * the payload contains fields including requestId, loaderId, timestamp, etc.
 */
async function handleDebuggerEvent(
  source: chrome.debugger.Debuggee,
  method: string,
  params?: any,
): Promise<void> {

  if (method !== "Network.responseReceived") {
    return;
  }

  const tabId = source.tabId;
  
  if (tabId === undefined) {
    return;
  }

  const sourceTab = await chrome.tabs.get(tabId);

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

  if (!sourceTab?.url) {
    console.log("No selected tab stored.");
    return;
  }

  const responseHostname = new URL(response.url).hostname;
  const sourceTabHostname = new URL(sourceTab.url).hostname;
  
  if (responseHostname !== sourceTabHostname) {
    console.log(`TLS security details received, but hostname did not match. Response hostname is ${responseHostname},
      source tab hostname is ${sourceTabHostname}.`);
    return;
  }

  const certKey = `${tabId}:${sourceTabHostname}`;

  if (processingCerts.has(certKey) || completedCerts.has(certKey)) {
    console.log(`TLS certificate already handled for ${certKey}. Skipping duplicate.`);
    return;
  }

  processingCerts.add(certKey);

  if (source.tabId === undefined) {
    console.log("No tabId found for debugger event.");
    return;
  }

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

      try {
        console.log("TLS certificate payload captured.");
        console.log(JSON.stringify(payload, null, 2)); 

        await sendCertToBackend(payload);

        completedCerts.add(certKey);
        console.log(`TLS certificate sent successfully for ${certKey}.`)
      } catch (error) {
        console.error("Failed to send to backend:", error);
      } finally {
        processingCerts.delete(certKey);
      }   

  }

/**
 * Sends a POST request to the backend, with JSON headers and a JSON body containing the
 * TLS certificate metadata payload, using fetch(). The backend's reply is then sent back,
 * as a Response object. If the TLS certificate metadata was accepted, then the saved
 * certificate sent, will be recorded in the console. Otherwise, the certificate will be
 * rejected by the backend, or if the TLS certificate was not sent at all, these errors
 * will be logged.
 * 
 * Stores the current cert locally for Chrome to access for the popup.
 * @param payload
 * @returns void
 */
async function sendCertToBackend(payload: object): Promise<void> {
  console.log("storing:", payload);
  storeCurrentCert(payload);

  try {
    const accessToken = await getValidAccessToken();

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(CERTIFICATE_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Backend rejected TLS certificate:",
        response.status,
        errorText,
      );
      return;
    }

    const savedCertificate = await response.json();
    console.log("TLS certificate saved to backend:");
    console.log(savedCertificate);

  } catch (error) {
    console.error("Failed to send TLS certificate to backend:", error);
  }
}

/**
 * Takes a certificate security details payload and modifies the
 * format to be compatible with the extension popup component
 */
async function prepCurrentCertForDisplay(payload: object) {
  console.log(payload);
  const p = payload as Record<string, unknown>;
  const readStr = (key: string, fallback = "") =>
    typeof p[key] === "string" ? (p[key] as string) : fallback;

  console.log(Number(readStr("validFrom")));
  const tempVar = {
    id: "1",
    protocol: readStr("protocol"),
    cipher: readStr("cipher"),
    subjectName: readStr("subjectName"),
    //sanList: readStr("sanList"),
    sanList: p["sanList"],
    issuer: readStr("issuer"),
    validFrom: new Date(Number(p["validFrom"]) * 1000).toISOString(),
    validTo: new Date(Number(p["validTo"]) * 1000).toISOString(),
  };
  return tempVar;
}

/**
 * Formats the certificate into JSON for the currently active tab into the expected UI 
 * display format and saved in local Chrome/extension storage via setCurrentCertificateData,
 * granting the UI Popup quick access to the TLS Certificate details for the current tab.
 * 
 * @param payload The TLS certificate payload captured from Chrome securityDetails.
 */
async function storeCurrentCert(payload: object) {
  console.log("storing cert");
  const formattedCert = JSON.stringify(
    await prepCurrentCertForDisplay(payload),
    null,
    2,
  );
  console.log("formatted cert:", formattedCert);
  setCurrentCertificateData(formattedCert);
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

