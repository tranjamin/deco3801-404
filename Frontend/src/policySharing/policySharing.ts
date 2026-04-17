export const baseUrl: string = "https://deco3801-404-pr-39.onrender.com";

export interface SecurityPolicy {
  name: string;
  description: string;
  active: boolean;
  protocols: string[];
  ciphers: string[];
  subjects: string[];
  SANs: string[];
  issuers: string[];
  validAfter: number; //maximum days since certificate issue
  validFor: number; //days remaining until expiration
  hasSCT: boolean;
  //transparencyCompliance: boolean;
}

export const DefaultPolicy1: SecurityPolicy = {
  name: "My Policy",
  description: "Default 1",
  active: true,
  protocols: ["1.2", "1.3"],
  ciphers: [],
  subjects: [],
  SANs: [],
  issuers: [],
  validAfter: 50,
  validFor: 10,
  hasSCT: true,
};

//Need to include 2 more default policies and update the above to be industry standard

export async function importPolicy(iPolicy: string) {
  const cPolicy: SecurityPolicy = JSON.parse(iPolicy);
  storeNewPolicy(cPolicy);
  return cPolicy;
}

export async function exportPolicy(cPolicy: SecurityPolicy) {
  const ePolicy: string = JSON.stringify(cPolicy);
  // include the actual download function within the frontend window code
  return ePolicy;
}

export async function storeNewPolicy(policy: SecurityPolicy) {
  var existingEntries;
  chrome.storage.local.get(["policies"]).then((policiesString) => {
    existingEntries = policiesString.key;
  });
  if (existingEntries == null) existingEntries = "";
  var existingJSONEntries: SecurityPolicy[] = JSON.parse(existingEntries);
  var newPolicyID = 0;
  chrome.storage.local.get(["numPolicies"]).then((numPolicies) => {
    if (typeof numPolicies.key === "number") {
      newPolicyID = numPolicies.key + 1;
    }
  });
  existingJSONEntries.push(policy);
  chrome.storage.local.set({ policies: existingJSONEntries }).then(() => {
    console.log("Value is set");
  });
  chrome.storage.local.set({ numPolicies: newPolicyID }).then(() => {
    console.log("Value is set");
  });
}

export async function updatePolicy(policy: SecurityPolicy, policyID: number) {
  console.log(policy, policyID);
}

export async function deletePolicy(policy: SecurityPolicy, policyID: number) {
  console.log(policy, policyID);
}

export async function getPolicy(policyID: number) {
  var existingEntries;
  chrome.storage.local.get(["policies"]).then((policiesString) => {
    existingEntries = policiesString.key;
  });
  if (existingEntries == null) existingEntries = "";
  var existingJSONEntries: SecurityPolicy[] = JSON.parse(existingEntries);
  var policy = existingJSONEntries[policyID];
  return policy;
}

export async function getAllPolicies() {
  try {
    const response = await fetch(`${baseUrl}/api/policies/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
}
