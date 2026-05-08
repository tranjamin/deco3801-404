import { getStoredAccessToken } from "../api/storage";

export const baseUrl: string = "https://deco3801-404.onrender.com/";

export interface SecurityPolicy {
  id: number;
  name: string;
  description: string;
  active: boolean;
  domains: string[];
  protocols: string[];
  ciphers: string[];
  subjects: string[];
  issuers: string[];
  validAfter: number; //maximum days since certificate issue
  validFor: number; //days remaining until expiration
}

export interface ExportedPolicy {
  name: string;
  description: string;
  active: boolean;
  domains: string[];
  protocols: string[];
  ciphers: string[];
  subjects: string[];
  issuers: string[];
  validAfter: number; //maximum days since certificate issue
  validFor: number; //days remaining until expiration
  SANs: string[]; //DELETE THIS
  SCT: boolean; //DELETE THIS
}

type RawPolicy = {
  id: number;
  name?: string;
  description?: string;
  active?: boolean;
  domains?: string[];
  validProtocols?: string[];
  validCiphers?: string[];
  validSubjects?: string[];
  validIssuers?: string[];
  minCertificateDaysLeft?: number;
  minCertificateLifespan?: number;
  validSans?: string[];//DELETE THIS
  needsSct?: boolean;//DELETE THIS
};

const MAX_TEXT_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 255;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStringField(
  obj: Record<string, unknown>,
  fieldName: string,
  maxLength: number,
): string {
  const value = obj[fieldName];

  if (typeof value !== "string") {
    throw new Error(`'${fieldName}' must be a string.`);
  }

  if (value.length > maxLength) {
    throw new Error(`'${fieldName}' must be ${maxLength} characters or less.`);
  }

  return value;
}

function parseStringArrayField(
  obj: Record<string, unknown>,
  fieldName: string,
): string[] {
  const value = obj[fieldName];

  if (!Array.isArray(value)) {
    throw new Error(`'${fieldName}' must be an array of strings.`);
  }

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];

    if (typeof item !== "string") {
      throw new Error(
        `'${fieldName}[${index}]' must be a string (all values in '${fieldName}' must be strings).`,
      );
    }

    if (item.length > MAX_TEXT_LENGTH) {
      throw new Error(
        `'${fieldName}[${index}]' must be ${MAX_TEXT_LENGTH} characters or less.`,
      );
    }
  }

  return value;
}

function parseBooleanField(obj: Record<string, unknown>, fieldName: string): boolean {
  const value = obj[fieldName];

  if (typeof value !== "boolean") {
    throw new Error(`'${fieldName}' must be a boolean.`);
  }

  return value;
}

function parseNumberField(obj: Record<string, unknown>, fieldName: string): number {
  const value = obj[fieldName];

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`'${fieldName}' must be a number.`);
  }

  return value;
}

function parseImportedPolicy(iPolicy: string): ExportedPolicy {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(iPolicy);
  } catch {
    throw new Error("Policy file is not valid JSON.");
  }

  if (!isRecord(parsedValue)) {
    throw new Error("Policy file must contain a JSON object.");
  }

  return {
    name: parseStringField(parsedValue, "name", MAX_TEXT_LENGTH),
    description: parseStringField(
      parsedValue,
      "description",
      MAX_DESCRIPTION_LENGTH,
    ),
    active: parseBooleanField(parsedValue, "active"),
    domains: parseStringArrayField(parsedValue, "domains"),
    protocols: parseStringArrayField(parsedValue, "protocols"),
    ciphers: parseStringArrayField(parsedValue, "ciphers"),
    subjects: parseStringArrayField(parsedValue, "subjects"),
    issuers: parseStringArrayField(parsedValue, "issuers"),
    validAfter: parseNumberField(parsedValue, "validAfter"),
    validFor: parseNumberField(parsedValue, "validFor"),

    SANs: parseStringArrayField(parsedValue, "SANs"),//DELETE THIS
    SCT: parseBooleanField(parsedValue, "SCT"),//DELETE THIS
  };
}

function mapPolicyToBackendPayload(policy: SecurityPolicy): Omit<RawPolicy, "id"> {
  return {
    name: policy.name,
    description: policy.description,
    //active: policy.active,
    //domains: policy.domains,
    validProtocols: policy.protocols,
    validCiphers: policy.ciphers,
    validSubjects: policy.subjects,
    validIssuers: policy.issuers,
    minCertificateDaysLeft: policy.validFor,
    minCertificateLifespan: policy.validAfter,
    validSans: [],//DELETE THIS
    needsSct: false,//DELETE THIS
  };
}

export const DefaultPolicy1: SecurityPolicy = {
  id: 12312,
  name: "My Policy",
  description: "Default 1",
  active: true,
  domains: [],
  protocols: ["1.2", "1.3"],
  ciphers: [],
  subjects: [],
  issuers: [],
  validAfter: 50,
  validFor: 10,
};

//Need to include 2 more default policies and update the above to be industry standard

export async function importPolicy(iPolicy: string) {
  const exportedPolicy = parseImportedPolicy(iPolicy);
  const cPolicy: SecurityPolicy = {
    id: 0,
    ...exportedPolicy,
  };
  await storeNewPolicy(cPolicy);
  return cPolicy;
}

export async function exportPolicy(cPolicy: SecurityPolicy) {
  const sPolicy: ExportedPolicy = {
    name: cPolicy.name,
    description: cPolicy.description,
    active: cPolicy.active,
    domains: cPolicy.domains,
    protocols: cPolicy.protocols,
    ciphers: cPolicy.ciphers,
    subjects: cPolicy.subjects,
    issuers: cPolicy.issuers,
    validAfter: cPolicy.validAfter,
    validFor: cPolicy.validFor,
    SANs: [],
    SCT: false
  }
  const ePolicy: string = JSON.stringify(sPolicy, null, 2);
  const blob = new Blob([ePolicy], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = (cPolicy.name || "policy")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_");

  link.href = objectUrl;
  link.download = `${safeName || "policy"}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);

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

export async function addDummyPolicy(): Promise<{ message: string } | null> {
  //console.log("sending this", JSON.stringify(mapPolicyToBackendPayload(policy)));
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    const response = await fetch(`${baseUrl}/api/policies/create_dummy`, {
      method: "GET",
      headers: headers,
      //body: JSON.stringify(mapPolicyToBackendPayload(policy)),
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

export async function storeNewPolicy(
  policy: SecurityPolicy,
): Promise<SecurityPolicy | null> {
  console.log("sending this", mapPolicyToBackendPayload(policy));
  try {
    const accessToken = await getStoredAccessToken();
    console.log(accessToken);
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${baseUrl}/api/policies/`, {
      method: "POST",
      headers,
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
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${baseUrl}/api/policies/${policyID}/active`, {
      method: "PUT",
      headers,
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
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${baseUrl}/api/policies/${policyID}/active`, {
      method: "PUT",
      headers,
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
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${baseUrl}/api/policies/${policyID}/update`, {
      method: "PUT",
      headers,
      body: JSON.stringify(mapPolicyToBackendPayload(policy)),
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

export async function deletePolicy(policyID: number) {
  console.log(policyID);
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${baseUrl}/api/policies/${policyID}`, {
      method: "DELETE",
      headers,
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
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    const response = await fetch(`${baseUrl}/api/policies/${policyID}`, {
      method: "GET",
      headers: headers,
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
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    const response = await fetch(`${baseUrl}/api/policies/`, {
      method: "GET",
      headers: headers,
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
    name: policy.name ?? "Unnamed Policy",
    description: policy.description ?? "",
    active: policy.active ?? false,
    domains: policy.domains ?? [],
    protocols: policy.validProtocols ?? [],
    ciphers: policy.validCiphers ?? [],
    subjects: policy.validSubjects ?? [],
    issuers: policy.validIssuers ?? [],
    validAfter: policy.minCertificateLifespan ?? 0,
    validFor: policy.minCertificateDaysLeft ?? 0,
  }));
}
