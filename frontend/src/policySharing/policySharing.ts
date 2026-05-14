import { getStoredAccessToken, setActiveDomains } from "../api/storage";
import { BACKEND_BASE_URL } from "../base_url";

/**
 * Represents a security policy used by the frontend UI and backend API.
 *
 * Fields mirror the policy model used by the backend with frontend-friendly
 * names. This interface is used throughout the UI to present and edit
 * policies.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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

/**
 * Shape of the policy when exported to or imported from a JSON file.
 *
 * This excludes `id` (created by backend)
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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

/**
 * Raw policy shape received from/sent to the backend API. This is looser
 * than the frontend `SecurityPolicy` and uses backend naming conventions.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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
};

const MAX_TEXT_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 255;

/**
 * Type guard that returns true when the provided value is a plain object.
 * Used to validate parsed JSON before extracting expected fields.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Parse and validate a string field from a generic object.
 * Throws descriptive errors when validation fails so callers can report
 * meaningful messages to the user.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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

/**
 * Parse and validate an array-of-strings field.
 * Each element is checked to be a string and to not exceed `MAX_TEXT_LENGTH`.
 * Detailed errors include the failing index to aid debugging.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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

    // Ensure each entry is a string - this comment was made with GPT-5 mini on 2026-05-09
    if (typeof item !== "string") {
      throw new Error(
        `'${fieldName}[${index}]' must be a string (all values in '${fieldName}' must be strings).`,
      );
    }

    // Enforce a reasonable length limit to avoid extremely long inputs - this comment was made with GPT-5 mini on 2026-05-09
    if (item.length > MAX_TEXT_LENGTH) {
      throw new Error(
        `'${fieldName}[${index}]' must be ${MAX_TEXT_LENGTH} characters or less.`,
      );
    }
  }

  return value;
}

/**
 * Parse and validate a boolean field.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
function parseBooleanField(obj: Record<string, unknown>, fieldName: string): boolean {
  const value = obj[fieldName];

  if (typeof value !== "boolean") {
    throw new Error(`'${fieldName}' must be a boolean.`);
  }

  return value;
}

/**
 * Parse and validate a numeric field. Rejects NaN and non-number types.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
function parseNumberField(obj: Record<string, unknown>, fieldName: string): number {
  const value = obj[fieldName];

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`'${fieldName}' must be a number.`);
  }

  return value;
}

/**
 * Parse a policy JSON string that was exported from the UI (or manually
 * created). This function performs shape validation and returns a
 * canonical `ExportedPolicy` object or throws detailed errors.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
function parseImportedPolicy(iPolicy: string): ExportedPolicy {
  let parsedValue: unknown;

  try {
    // Parse JSON and validate that the top-level value is an object - this comment was made with GPT-5 mini on 2026-05-09
    parsedValue = JSON.parse(iPolicy);
  } catch {
    throw new Error("Policy file is not valid JSON.");
  }

  if (!isRecord(parsedValue)) {
    throw new Error("Policy file must contain a JSON object.");
  }

  return {
    // Validate all required fields using the helper parsers above - this comment was made with GPT-5 mini on 2026-05-09
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

/**
 * Map frontend `SecurityPolicy` to the backend `RawPolicy` shape expected by
 * the API. Note: `id` is omitted because it is assigned by the backend.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
function mapPolicyToBackendPayload(policy: SecurityPolicy): Omit<RawPolicy, "id"> {
  return {
    name: policy.name,
    description: policy.description,

    //active: policy.active,
    domains: policy.domains,
    validProtocols: policy.protocols,
    validCiphers: policy.ciphers,
    validSubjects: policy.subjects,
    validIssuers: policy.issuers,
    minCertificateDaysLeft: policy.validFor,
    minCertificateLifespan: policy.validAfter,
  };
}

/**
 * Import a policy JSON string and store it as a new policy via the backend
 * API. Returns the created `SecurityPolicy` (with `id` filled by backend)
 * or throws on validation/network errors.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
export async function importPolicy(iPolicy: string) {
  const exportedPolicy = parseImportedPolicy(iPolicy);
  const cPolicy: SecurityPolicy = {
    id: 0,
    ...exportedPolicy,
  };
  await storeNewPolicy(cPolicy);
  return cPolicy;
}

/**
 * Export a policy to a JSON file and trigger browser download. The filename
 * is sanitized based on the policy name to be filesystem-safe.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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
  // Sanitize policy name to remove special characters for safe filename - this comment was made with GPT-5 mini on 2026-05-09
  const safeName = (cPolicy.name || "policy")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_");

  // Create a temporary download link and trigger browser download - this comment was made with GPT-5 mini on 2026-05-09
  link.href = objectUrl;
  link.download = `${safeName || "policy"}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);

  return ePolicy;
}

/**
 * Create a dummy policy on the backend. Returns a message object on
 * success or `null` on error.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
export async function addDummyPolicy(): Promise<{ message: string } | null> {
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/create_dummy`, {
      method: "GET",
      headers: headers,
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

/**
 * Create a new policy record via the backend API and return the created
 * `SecurityPolicy` (mapped from backend response). Returns `null` on error.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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
      // Include auth token if available for authenticated requests - this comment was made with GPT-5 mini on 2026-05-09
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/`, {
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

/**
 * Set the policy active flag to `true` via the API. Returns a message on
 * success or `null` on failure.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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

    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/${policyID}/active`, {
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

/**
 * Set the policy active flag to `false` via the API. Returns a message on
 * success or `null` on failure.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
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

    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/${policyID}/active`, {
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

/**
 * Update a policy's fields via the backend API. Returns parsed response or
 * `null` on failure.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
export async function updatePolicy(policy: SecurityPolicy, policyID: number) {
  console.log(policy, policyID);
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/${policyID}/update`, {
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

/**
 * Delete a policy by id via the backend API. Returns parsed response or
 * `null` on failure.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
export async function deletePolicy(policyID: number) {
  console.log(policyID);
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/${policyID}`, {
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

/**
 * Fetch a single policy by id and map the backend response to frontend
 * `SecurityPolicy` representation. Returns `null` on error.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
export async function getPolicy(policyID: number) {
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/${policyID}`, {
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

/**
 * Fetch all policies from the backend and return them as an array of
 * `SecurityPolicy` objects. Returns `null` on error.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
export async function getAllPolicies() {
  try {
    const accessToken = await getStoredAccessToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    const response = await fetch(`${BACKEND_BASE_URL}/api/policies/`, {
      method: "GET",
      headers: headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const policies = mapJSONtoPolicies(Array.isArray(data) ? data : [data]);
    console.log("got the following policies from the backend:",policies);
    //ok now im going to add the policies that are active to a locally stored array for ref in the tlsReterval engine
    const activeDomains: string[] = [];
    for (const policy of policies) {
      if (policy.active === true) {
        for (const domain of policy.domains) {
          if (domain.startsWith("https://")) {
            activeDomains.push(domain);
          } else {
            activeDomains.push("https://" + domain);
          }
        }
      }
    }
    if (activeDomains.length != 0) {
      setActiveDomains(activeDomains);
    }
    console.log("active domains", activeDomains);
    return policies;
  } catch (e) {
    console.log("BIG ERROR:", e);
    return null;
  }
}

/**
 * Map backend `RawPolicy` records to frontend `SecurityPolicy` objects.
 * Applies safe defaults for missing fields to prevent undefined values in the UI.
 *
 * this docstring was made with GPT-5 mini on 2026-05-09
 */
export function mapJSONtoPolicies(jsonInput: RawPolicy[]): SecurityPolicy[] {
  // Transform each raw policy from backend to frontend representation,
  // remapping field names and providing defaults for optional fields - this comment was made with GPT-5 mini on 2026-05-09
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
