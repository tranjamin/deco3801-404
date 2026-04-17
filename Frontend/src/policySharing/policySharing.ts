export const baseUrl: string = "https://deco3801-404-dev.onrender.com";

export interface SecurityPolicy {
  id: number;
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

type RawPolicy = {
  id: number;
  name?: string;
  description?: string;
  active?: boolean;
  validProtocols?: string[];
  validCiphers?: string[];
  validSubjects?: string[];
  validSans?: string[];
  validIssuers?: string[];
  minCertificateDaysLeft?: number;
  minCertificateLifespan?: number;
  needsSct?: boolean;
  domain?: string;
};

function mapPolicyToBackendPayload(policy: SecurityPolicy): Omit<RawPolicy, "id"> {
  return {
    domain: policy.name,
    description: policy.description,
    //active: policy.active,
    validProtocols: policy.protocols,
    validCiphers: policy.ciphers,
    validSubjects: policy.subjects,
    validSans: policy.SANs,
    validIssuers: policy.issuers,
    minCertificateDaysLeft: policy.validFor,
    minCertificateLifespan: policy.validAfter,
    needsSct: policy.hasSCT,
  };
}

export const DefaultPolicy1: SecurityPolicy = {
  id: 12312,
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

// export async function storeNewPolicy(policy: SecurityPolicy) {
//   var existingEntries;
//   chrome.storage.local.get(["policies"]).then((policiesString) => {
//     existingEntries = policiesString.key;
//   });
//   if (existingEntries == null) existingEntries = "";
//   var existingJSONEntries: SecurityPolicy[] = JSON.parse(existingEntries);
//   var newPolicyID = 0;
//   chrome.storage.local.get(["numPolicies"]).then((numPolicies) => {
//     if (typeof numPolicies.key === "number") {
//       newPolicyID = numPolicies.key + 1;
//     }
//   });
//   existingJSONEntries.push(policy);
//   chrome.storage.local.set({ policies: existingJSONEntries }).then(() => {
//     console.log("Value is set");
//   });
//   chrome.storage.local.set({ numPolicies: newPolicyID }).then(() => {
//     console.log("Value is set");
//   });
// }

export async function storeNewPolicy(
  policy: SecurityPolicy,
): Promise<SecurityPolicy | null> {
  console.log("sending this", JSON.stringify(mapPolicyToBackendPayload(policy)));
  try {
    const response = await fetch(`${baseUrl}/api/policies/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapPolicyToBackendPayload(policy)),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as RawPolicy;
    return mapJSONtoPolicies([data])[0] ?? null;
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
}

export async function activatePolicy(
  policyID: number,
): Promise<{ message: string } | null> {
  try {
    const response = await fetch(`${baseUrl}/api/policies/${policyID}/active`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: true }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as { message?: string };
    return { message: data.message ?? "Policy activity updated" };
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
}

export async function deactivatePolicy(
  policyID: number,
): Promise<{ message: string } | null> {
  try {
    const response = await fetch(`${baseUrl}/api/policies/${policyID}/active`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: false }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as { message?: string };
    return { message: data.message ?? "Policy activity updated" };
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
}

export async function updatePolicy(policy: SecurityPolicy, policyID: number) {
  console.log(policy, policyID);
}

export async function deletePolicy(policyID: number) {
  console.log(policyID);
  try {
    const response = await fetch(`${baseUrl}/api/policies/${policyID}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
}

export async function getPolicy(policyID: number) {
  try {
    const response = await fetch(`${baseUrl}/api/policies/${policyID}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return mapJSONtoPolicies(Array.isArray(data) ? data : [data]);
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
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
    return mapJSONtoPolicies(Array.isArray(data) ? data : [data]);
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
}

export function mapJSONtoPolicies(jsonInput: RawPolicy[]): SecurityPolicy[] {
  return jsonInput.map((policy) => ({
    id: policy.id,
    name: policy.name ?? policy.domain ?? "Unnamed Policy",
    description: policy.description ?? "",
    active: policy.active ?? false,
    protocols: policy.validProtocols ?? [],
    ciphers: policy.validCiphers ?? [],
    subjects: policy.validSubjects ?? [],
    SANs: policy.validSans ?? [],
    issuers: policy.validIssuers ?? [],
    validAfter: policy.minCertificateLifespan ?? 0,
    validFor: policy.minCertificateDaysLeft ?? 0,
    hasSCT: policy.needsSct ?? false,
  }));
}
