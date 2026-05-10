import { setCurrentCertificateData, getStoredAccessToken } from "./api/storage";

console.log("TLS Retrieval Engine service worker loaded.");

let selectedTab: chrome.tabs.Tab | null = null;
let attachedTabId: number | null = null;

const processingCerts = new Set<string>();
const completedCerts = new Set<string>();

const BACKEND_BASE_URL = "https://deco3801-404.onrender.com";
const CERTIFICATE_ENDPOINT = `${BACKEND_BASE_URL}/api/certificates/`;
const REPORT_VISITS_ENDPOINT = `${BACKEND_BASE_URL}/api/reports/visits`;

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

async function detachFromTab(tabId: number): Promise<void> {
  try {
    await chrome.debugger.detach({tabId});
    console.log(`Detached debugger from tab ${tabId}.`);
  } catch (error) {
    console.warn("Failed to detach debugger:", error);
  } finally {
    if (attachedTabId === tabId) {
      attachedTabId = null;
      selectedTab = null;
    }

    clearCertStateForTab(tabId);
  }
}

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

async function handleOnUpdate(
  _tabId: number,
  changeInfo: { url?: string },
  tab: chrome.tabs.Tab,
): Promise<void> {
  const accessToken = await getStoredAccessToken();

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
    selectedTab = tab;
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

  selectedTab = tab;
  attachedTabId = tab.id;

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
  storeCurrentCert(payload);

  try {
    const accessToken = await getStoredAccessToken();

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

    await logVisitToBackend(payload, savedCertificate, headers);
  } catch (error) {
    console.error("Failed to send TLS certificate to backend:", error);
  }
}

async function logVisitToBackend(
  payload: object,
  savedCertificate: { id?: number | string },
  headers: Record<string, string>,
): Promise<void> {
  try {
    const p = payload as Record<string, unknown>;
    const url = typeof p.url === "string" ? p.url : "";
    const domain = url
      ? new URL(url).hostname
      : selectedTab?.url
        ? new URL(selectedTab.url).hostname
        : "";

    if (!domain) {
      console.error("Cannot log report visit without a domain.");
      return;
    }

    const reportPayload = {
      domain,
      certificate_id: savedCertificate.id,
      user_agent: navigator.userAgent,
      tab_id: selectedTab?.id,
    };

    const response = await fetch(REPORT_VISITS_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(reportPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Backend rejected report visit:",
        response.status,
        errorText,
      );
      return;
    }

    console.log("Report visit logged to backend:");
    console.log(await response.json());
  } catch (error) {
    console.error("Failed to log report visit:", error);
  }
}

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
    sanList: readStr("sanList"),
    issuer: readStr("issuer"),
    validFrom: new Date(Number(p["validFrom"]) * 1000).toISOString(),
    validTo: new Date(Number(p["validTo"]) * 1000).toISOString(),
  };
  return tempVar;
}

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

