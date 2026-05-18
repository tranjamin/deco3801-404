import React, { useEffect, useState } from "react";
import {
  deletePolicy,
  type SecurityPolicy,
  activatePolicy,
  deactivatePolicy,
  exportPolicy,
  updatePolicy,
  getAllPolicies,
} from "../../policySharing/policySharing";

/**
 * Props for the Details component that displays and edits a single policy.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
type DetailsProps = {
  policy: SecurityPolicy | null;
  startInEditMode?: boolean;
  isNewPolicy?: boolean;
  onSaveNewPolicy?: (policy: SecurityPolicy) => Promise<void> | void;
  isDefaultPolicy?: boolean;
};

/**
 * Form representation of a policy, with all numeric and boolean fields as strings
 * for easier input handling in form controls.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
type PolicyFormData = {
  name: string;
  description: string;
  active: string;
  domains: string[];
  protocols: string[];
  ciphers: string[];
  subjects: string[];
  issuers: string[];
  validFor: string;
  validAfter: string;
};

/**
 * Union type for the names of array fields in PolicyFormData.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
type ArrayFieldName =
  | "domains"
  | "protocols"
  | "ciphers"
  | "subjects"
  | "issuers";

/**
 * Props for editing a list of strings (domains, ciphers, etc.).
 * this comment was made with GPT-5 mini on 2026-05-09
 */
type ArrayListEditorProps = {
  label: string;
  inputId: string;
  items: string[];
  draftValue: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  tooltip?: string;
};

/**
 * Props for the protocol selector component that displays available TLS versions.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
type ProtocolSelectorProps = {
  selectedProtocols: string[];
  onProtocolChange: (protocol: string, checked: boolean) => void;
};

const AVAILABLE_PROTOCOLS = [
  "TLS 1.0",
  "TLS 1.1",
  "TLS 1.2",
  "TLS 1.3",
  "QUIC",
];

/**
 * Normalize protocol string by removing 'TLS' prefix and converting to lowercase.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
function normalizeProtocol(protocol: string): string {
  return protocol
    .trim()
    .toLowerCase()
    .replace(/^tls\s+/, "");
}

/**
 * Format protocol for UI display (e.g., 'tls 1.2' -> 'TLS 1.2').
 * this comment was made with GPT-5 mini on 2026-05-09
 */
function toDisplayProtocol(protocol: string): string {
  if (protocol != "quic") {
    return `TLS ${normalizeProtocol(protocol)}`;
  } else {
    return "QUIC";
  }
}

/**
 * Format protocol for backend API (e.g., 'TLS 1.2' -> 'tls 1.2').
 * this comment was made with GPT-5 mini on 2026-05-09
 */
function toBackendProtocol(protocol: string): string {
  if (protocol != "QUIC") {
    return `tls ${normalizeProtocol(protocol)}`;
  } else {
    return protocol.toLowerCase();
  }
}

const emptyFormData: PolicyFormData = {
  name: "",
  description: "",
  active: "",
  domains: [],
  protocols: [],
  ciphers: [],
  subjects: [],
  issuers: [],
  validFor: "0",
  validAfter: "0",
};

/**
 * Convert a SecurityPolicy to form-editable PolicyFormData with string representations.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
function mapPolicyToFormData(policy: SecurityPolicy): PolicyFormData {
  // Create a set of display-formatted protocols for quick lookup during filtering
  const protocolSet = new Set(
    policy.protocols.map((protocol) => toDisplayProtocol(protocol)),
  );

  return {
    name: policy.name,
    description: policy.description,
    active: String(policy.active),
    domains: [...policy.domains],
    protocols: AVAILABLE_PROTOCOLS.filter((protocol) =>
      protocolSet.has(protocol),
    ),
    ciphers: [...policy.ciphers],
    subjects: [...policy.subjects],
    issuers: [...policy.issuers],
    validFor: String(policy.validFor),
    validAfter: String(policy.validAfter),
  };
}

/**
 * Convert form data back to a SecurityPolicy for API submission.
 * Converts string fields back to their proper types.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
function mapFormDataToPolicy(
  formData: PolicyFormData,
  existingId?: number,
): SecurityPolicy {
  return {
    id: existingId ?? 0,
    name: formData.name,
    description: formData.description,
    active: formData.active.trim().toLowerCase() === "true",
    domains: [...formData.domains],
    protocols: formData.protocols.map((protocol) =>
      toBackendProtocol(protocol),
    ),
    ciphers: [...formData.ciphers],
    subjects: [...formData.subjects],
    issuers: [...formData.issuers],
    validAfter: Number(formData.validAfter) || 0,
    validFor: Number(formData.validFor) || 0,
  };
}

/**
 * Component for selecting which TLS protocol versions are allowed.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
function ProtocolSelector({
  selectedProtocols,
  onProtocolChange,
}: ProtocolSelectorProps) {
  return (
    <div style={fieldGroup}>
      <label
        style={fieldLabelWithInfo}
        title={
          "Allowed TLS/SSL protocol versions. If empty this criteria is ignored"
        }
      >
        <span>Protocols</span>

        <span style={infoIcon} aria-hidden="true">
          ?
        </span>
      </label>
      <div style={checkboxGroup}>
        {AVAILABLE_PROTOCOLS.map((protocol) => (
          <label key={protocol} style={checkboxItem}>
            <input
              type="checkbox"
              checked={selectedProtocols.includes(protocol)}
              onChange={(e) => onProtocolChange(protocol, e.target.checked)}
            />
            {protocol}
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Generic component for editing a list of strings (domains, ciphers, subjects, etc.).
 * Provides input field, add button, and removable list items.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
function ArrayListEditor({
  label,
  inputId,
  items,
  draftValue,
  onDraftChange,
  onAdd,
  onRemove,
  tooltip,
}: ArrayListEditorProps) {
  return (
    <div style={fieldGroup}>
      <label style={fieldLabelWithInfo} title={tooltip}>
        <span>{label}</span>
        {tooltip ? (
          <span style={infoIcon} aria-hidden="true">
            ?
          </span>
        ) : null}
      </label>
      <div style={listBox}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${inputId}-${item}-${index}`} style={listRow}>
              <span style={listItemText}>{item}</span>
              <button
                type="button"
                style={deleteItemButton}
                onClick={() => onRemove(index)}
                aria-label={`Remove ${item}`}
                title="Remove item"
              >
                x
              </button>
            </div>
          ))
        ) : (
          <div style={emptyListText}>No items yet.</div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
      >
        {" "}
        {/*without e.preventDefault the page autoreloads */}
        <div style={addRow}>
          <input
            id={inputId}
            style={textInput}
            type="text"
            maxLength={50}
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            title={tooltip}
            placeholder="press Add to add to list of valid items"
          />
          <button type="submit" style={addButton}>
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Main Details component: displays a policy's information in read or edit mode.
 * Handles policy activation/deactivation, editing, deletion, import/export, and creation.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
export default function Details({
  policy,
  startInEditMode = false,
  isNewPolicy = false,
  onSaveNewPolicy,
  isDefaultPolicy,
}: DetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PolicyFormData>(emptyFormData);
  const [arrayDrafts, setArrayDrafts] = useState<
    Record<ArrayFieldName, string>
  >({
    domains: "",
    protocols: "",
    ciphers: "",
    subjects: "",
    issuers: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  //const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    //console.log("default?:", isDefaultPolicy);
    if (policy) {
      setFormData(mapPolicyToFormData(policy));
      setIsEditing(startInEditMode);
      setArrayDrafts({
        domains: "",
        protocols: "",
        ciphers: "",
        subjects: "",
        issuers: "",
      });
      return;
    }

    setIsEditing(false);
    setFormData(emptyFormData);
    setArrayDrafts({
      domains: "",
      protocols: "",
      ciphers: "",
      subjects: "",
      issuers: "",
    });
  }, [policy, startInEditMode]);

  const handleActivate = async () => {
    if (policy == null) {
      return;
    }
    //.log("sending activated policy to API");
    await activatePolicy(policy.id);
    window.location.reload();
  };

  const handleDeactivate = async () => {
    if (policy == null) {
      return;
    }
    //console.log("sending deactivated policy to API");
    await deactivatePolicy(policy.id);
    window.location.reload();
  };

  const handleShare = async () => {
    if (!policy) return;
    await exportPolicy(policy);
  };

  const handleEdit = () => {
    if (!policy) return;
    setFormData(mapPolicyToFormData(policy));
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!policy) return;
    //setFormData(mapPolicyToFormData(policy));
    //setIsEditing(true);
    await deletePolicy(policy.id);
    window.location.reload();
  };

  const confirmDelete = async (isDefaultPolicy: boolean) => {
    if (!isDefaultPolicy) {
      await handleDelete();
    } else {
      //add code here for deleting the policy in the default folder
      const modules = import.meta.glob("../../../../defaultPolicies/*.json", {
        eager: true,
      }) as Record<string, { default: { name?: unknown } }>;

      for (const [filePath, mod] of Object.entries(modules)) {
        const parsed = mod.default;
        const name = typeof parsed.name === "string" ? parsed.name : null;

        if (!name || !policy) continue;

        if (policy.name.toLowerCase() === name.toLowerCase()) {
          console.log("matched file path:", filePath);
          //this is were the code for deleting the default policy would go... IF IT WAS POSSIBLE (an hour of my life down the drain)
        }
      }
      await handleDelete();
    }
  };

  const handleInputChange = (field: keyof PolicyFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProtocolChange = (protocol: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      protocols: checked
        ? [...prev.protocols, protocol]
        : prev.protocols.filter((p) => p !== protocol),
    }));
  };

  const handleArrayDraftChange = (field: ArrayFieldName, value: string) => {
    setArrayDrafts((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayAdd = (field: ArrayFieldName) => {
    const value = arrayDrafts[field].trim();

    if (!value) return;

    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value],
    }));

    setArrayDrafts((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleArrayRemove = (field: ArrayFieldName, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const validateSave = async () => {
    console.log("formData", formData);
    //Check name
    if (formData.name === "") {
      return "Policy name cannot be empty";
    }
    //check description
    if (formData.description === "") {
      return "Policy description cannot be empty";
    }
    if (policy) {
      if (!(formData.name === policy.name)) {
        //get a list of names
        const fetchedPolicies = await getAllPolicies();
        var curPolicyNames: string[] = [];
        if (fetchedPolicies) {
          for (const p of fetchedPolicies) {
            curPolicyNames.push(p.name);
          }
          if (curPolicyNames.includes(formData.name)) {
            return "that policy name is already in use, please chose another name";
          }
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    const valid = await validateSave();
    if (valid === null) {
      //setErrorMsg("");
      const policyPayload = mapFormDataToPolicy(formData, policy?.id);

      if (isNewPolicy && onSaveNewPolicy) {
        await onSaveNewPolicy(policyPayload);
        return;
      } else if (!isNewPolicy && updatePolicy && policy) {
        await updatePolicy(policyPayload, policy.id);
      }

      //console.log("saving edited policy to API", policyPayload);
      window.location.reload();
    } else {
      //setErrorMsg(valid);
      alert(valid);
    }
  };

  const handleBack = async () => {
    //console.log("cancelling policy edit");
    window.location.reload();
  };

  return (
    <div style={container}>
      <h2 style={heading}>DETAILS</h2>
      {policy ? (
        <div style={detailsPane}>
          <div style={detailsBody}>
            <div style={headerRow}>
              <div style={leftHeaderGroup}>
                {isNewPolicy ? (
                  ""
                ) : (
                  <>
                    {policy.active ? (
                      <div style={greendot} />
                    ) : (
                      <div style={graydot} />
                    )}
                    <div style={pName}>{policy.name}</div>
                  </>
                )}
              </div>

              <div style={rightHeaderGroup}>
                {!isEditing && (
                  <>
                    {policy.active === false ? (
                      <button
                        style={activatebutton}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#e2e6ea")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "#ffffff")
                        }
                        title="Activate Policy"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleActivate();
                        }}
                      >
                        {" "}
                        <img src="/activate4.svg" width={24} height={24} />
                      </button>
                    ) : (
                      <button
                        style={deactivatebutton}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#e2e6ea")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "#ffffff")
                        }
                        title="Deactivate Policy"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeactivate();
                        }}
                      >
                        {" "}
                        <img src="/deactivate.svg" width={24} height={24} />
                      </button>
                    )}
                    <button
                      style={importbutton}
                      onClick={handleShare}
                      title="Export a policy to JSON"
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#e2e6ea")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#ffffff")
                      }
                    >
                      <img src="/share.svg" width={24} height={24} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div>
                <div style={fieldGroup}>
                  <label
                    style={fieldLabelWithInfo}
                    title={"The name of the policy"}
                  >
                    <span>Name</span>

                    <span style={infoIcon} aria-hidden="true">
                      ?
                    </span>
                  </label>
                  <input
                    id="policy-name"
                    style={textInput}
                    type="text"
                    maxLength={50}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    title="The name of the policy"
                  />
                </div>

                <div style={fieldGroup}>
                  <label
                    style={fieldLabelWithInfo}
                    title={"A brief description of what this policy enforces"}
                  >
                    <span>Description</span>

                    <span style={infoIcon} aria-hidden="true">
                      ?
                    </span>
                  </label>
                  <input
                    id="policy-description"
                    style={textInput}
                    type="text"
                    maxLength={255}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    title="A brief description of what this policy enforces"
                  />
                </div>

                <ProtocolSelector
                  selectedProtocols={formData.protocols}
                  onProtocolChange={handleProtocolChange}
                />

                <div style={fieldGroup}>
                  <ArrayListEditor
                    label="Domains"
                    inputId="policy-domains"
                    items={formData.domains}
                    draftValue={arrayDrafts.domains}
                    onDraftChange={(value) =>
                      handleArrayDraftChange("domains", value)
                    }
                    onAdd={() => handleArrayAdd("domains")}
                    onRemove={(index) => handleArrayRemove("domains", index)}
                    tooltip="Domains where this policy should apply. If empty this criteria is ignored"
                  />
                </div>

                <div style={fieldGroup}>
                  <ArrayListEditor
                    label="Ciphers"
                    inputId="policy-ciphers"
                    items={formData.ciphers}
                    draftValue={arrayDrafts.ciphers}
                    onDraftChange={(value) =>
                      handleArrayDraftChange("ciphers", value)
                    }
                    onAdd={() => handleArrayAdd("ciphers")}
                    onRemove={(index) => handleArrayRemove("ciphers", index)}
                    tooltip="Valid cipher suites for TLS connections. If empty this criteria is ignored"
                  />
                </div>

                <div style={fieldGroup}>
                  <ArrayListEditor
                    label="Subjects"
                    inputId="policy-subjects"
                    items={formData.subjects}
                    draftValue={arrayDrafts.subjects}
                    onDraftChange={(value) =>
                      handleArrayDraftChange("subjects", value)
                    }
                    onAdd={() => handleArrayAdd("subjects")}
                    onRemove={(index) => handleArrayRemove("subjects", index)}
                    tooltip="Valid certificate subject names. If empty this criteria is ignored"
                  />
                </div>

                <div style={fieldGroup}>
                  <ArrayListEditor
                    label="Valid Certificate Authorities"
                    inputId="policy-issuers"
                    items={formData.issuers}
                    draftValue={arrayDrafts.issuers}
                    onDraftChange={(value) =>
                      handleArrayDraftChange("issuers", value)
                    }
                    onAdd={() => handleArrayAdd("issuers")}
                    onRemove={(index) => handleArrayRemove("issuers", index)}
                    tooltip="Valid certificate issuers or Certificate Authorities"
                  />
                </div>

                <div style={fieldGroup}>
                  <label
                    style={fieldLabelWithInfo}
                    title={
                      "Minimum number of days the certificate should be valid after issuance"
                    }
                  >
                    <span>Valid for how many days after issue?</span>

                    <span style={infoIcon} aria-hidden="true">
                      ?
                    </span>
                  </label>
                  <div style={sliderValueText}>{formData.validFor} days</div>
                  <input
                    id="policy-valid-for"
                    style={sliderInput}
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={formData.validFor}
                    onChange={(e) =>
                      handleInputChange("validFor", e.target.value)
                    }
                    title="Minimum number of days the certificate should be valid after issuance"
                  />
                </div>

                <div style={fieldGroup}>
                  <label
                    style={fieldLabelWithInfo}
                    title={
                      "Minimum number of days remaining until certificate expiration"
                    }
                  >
                    <span>
                      How many days is the certificate still valid for?
                      (minimum)
                    </span>

                    <span style={infoIcon} aria-hidden="true">
                      ?
                    </span>
                  </label>
                  <div style={sliderValueText}>{formData.validAfter} days</div>
                  <input
                    id="policy-valid-after"
                    style={sliderInput}
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={formData.validAfter}
                    onChange={(e) =>
                      handleInputChange("validAfter", e.target.value)
                    }
                    title="Minimum number of days remaining until certificate expiration"
                  />
                </div>
              </div>
            ) : (
              <>
                <p
                  title={"A brief description of what this policy enforces"}
                  style={valueStyle}
                >
                  <strong>Description:</strong> {policy.description}
                </p>
                <p
                  title={
                    "Fields of active policies are used as criteria for tracking/reporting"
                  }
                  style={valueStyle}
                >
                  <strong>Status:</strong>{" "}
                  {policy.active ? "Active" : "Inactive"}
                </p>
                <p
                  title={"Domains where this policy should apply"}
                  style={valueStyle}
                >
                  <strong>Domains:</strong> {policy.domains.join(", ")}
                </p>
                <p
                  title={
                    "Allowed TLS/SSL protocol versions. If empty this criteria is ignored"
                  }
                  style={valueStyle}
                >
                  <strong>Protocols:</strong> {policy.protocols.join(", ")}
                </p>
                <p
                  title={
                    "Valid cipher suites for TLS connections. If empty this criteria is ignored"
                  }
                  style={valueStyle}
                >
                  <strong>Ciphers:</strong> {policy.ciphers.join(", ")}
                </p>
                <p
                  title={
                    "Valid certificate subject names. If empty this criteria is ignored"
                  }
                  style={valueStyle}
                >
                  <strong>Subjects:</strong> {policy.subjects.join(", ")}
                </p>
                <p
                  title={
                    "Valid certificate issuers or Certificate Authorities. If empty this criteria is ignored"
                  }
                  style={valueStyle}
                >
                  <strong>Valid Certificate Authorities:</strong>{" "}
                  {policy.issuers.join(", ")}
                </p>
                <p
                  title={
                    "Minimum number of days the certificate should be valid after issuance"
                  }
                  style={valueStyle}
                >
                  <strong>Valid for how many days after issue?:</strong>{" "}
                  {policy.validFor}
                </p>
                <p
                  title={
                    "Minimum number of days remaining until certificate expiration"
                  }
                  style={valueStyle}
                >
                  <strong>
                    How many days is the certificate still valid for? (minimum):
                  </strong>{" "}
                  {policy.validAfter}
                </p>
              </>
            )}
          </div>

          <div style={bottomActionBar}>
            {!isEditing ? (
              <>
                {/* <button type="button" style={editbutton} onClick={handleEdit}>
                  Edit
                </button> */}
                <button
                  style={editbutton}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#e2e6ea")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#ffffff")
                  }
                  title="Edit Policy"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleEdit();
                  }}
                >
                  {" "}
                  <img src="/edit.svg" width={24} height={24} />
                </button>
                {!isDefaultPolicy ? 
                <button
                  style={deletebutton}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#e2e6ea")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#ffffff")
                  }
                  title="Delete Policy"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                >
                  {" "}
                  <img src="/delete.svg" width={24} height={24} />
                </button>
                : <></> }
              </> 
            ) : (
              <>
                <button
                  type="button"
                  style={savebutton}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#e2e6ea")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#ffffff")
                  }
                  title="Save Policy"
                  onClick={() => void handleSave()}
                >
                  Save
                </button>
                {/* <div style={errorMsgStyle}>{errorMsg}</div> */}
                <button
                  type="button"
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#e2e6ea")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#ffffff")
                  }
                  title="Go Back"
                  style={backbutton}
                  onClick={() => void handleBack()}
                >
                  Back
                </button>
              </>
            )}
          </div>
          {showDeleteConfirm && (
            <div
              style={modalOverlay}
              role="dialog"
              aria-modal="true"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <div style={modal} onClick={(e) => e.stopPropagation()}>
                <p style={modalMessage}>
                  {policy
                    ? isDefaultPolicy === true ||
                      typeof isDefaultPolicy === "undefined"
                      ? `This is a default policy bundled with the app. Deleting it will remove the local copy. Are you sure you want to delete "${policy.name}"?`
                      : `Are you sure you want to permanently delete "${policy.name}"? This action cannot be undone.`
                    : "No policy selected."}
                </p>

                <div style={modalActions}>
                  <button
                    type="button"
                    style={modalBackButton}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    style={modalDeleteButton}
                    onClick={async () => {
                      if (typeof isDefaultPolicy != "undefined") {
                        await confirmDelete(isDefaultPolicy);
                      } else {
                        await confirmDelete(false);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Select a policy from the left pane to view details.</p>
      )}
    </div>
  );
}

const container: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  padding: "24px",
  boxSizing: "border-box",
};

const heading: React.CSSProperties = {
  marginTop: 0,
  borderBottom: "2px solid #000000",
  textAlign: "center",
};

const pName: React.CSSProperties = {
  fontSize: 30,
  fontWeight: "bold",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  //gap: "16px",
};

const leftHeaderGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const rightHeaderGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  //flexDirection: "column",
  //alignItems: "flex-end",
  gap: "8px",
};

const detailsPane: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  flex: 1,
};

const detailsBody: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: "8px",
};

const greendot: React.CSSProperties = {
  width: "20px",
  aspectRatio: "1 / 1",
  border: "1px solid #000000",
  borderRadius: "50%",
  backgroundColor: "#00ff37",
  margin: "5px",
};

const graydot: React.CSSProperties = {
  width: "20px",
  aspectRatio: "1 / 1",
  border: "1px solid #000000",
  borderRadius: "50%",
  backgroundColor: "#c0c0c0",
  margin: "5px",
};

const deactivatebutton: React.CSSProperties = {
  marginLeft: "auto",

  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500",
  color: "#24292f",
  transition: "background 0.2s",
};

const activatebutton: React.CSSProperties = {
  marginLeft: "auto",

  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500",
  color: "#24292f",
  transition: "background 0.2s",
};

const importbutton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500",
  color: "#24292f",
  transition: "background 0.2s",
};

const editbutton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500",
  color: "#24292f",
  transition: "background 0.2s",
};

const deletebutton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500",
  color: "#24292f",
  transition: "background 0.2s",
};

const fieldGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginBottom: "12px",
};

const fieldLabel: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "16px",
};

const fieldLabelWithInfo: React.CSSProperties = {
  ...fieldLabel,
  display: "flex",
  alignItems: "center",
  gap: "3px",
};

const infoIcon: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  border: "1px solid #666666",
  color: "#666666",
  fontSize: "8px",
  lineHeight: 1,
  cursor: "help",
  flexShrink: 0,
};

const textInput: React.CSSProperties = {
  border: "1px solid #000000",
  borderRadius: "4px",
  padding: "8px",
  fontSize: "14px",
  flex: 1,
  minWidth: 0,
};

const sliderInput: React.CSSProperties = {
  width: "100%",
  margin: 0,
  padding: 0,
  display: "block",
};

const listBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "8px",
  border: "1px solid #b5b5b5",
  borderRadius: "6px",
  backgroundColor: "#f7f7f7",
};

const listRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const listItemText: React.CSSProperties = {
  wordBreak: "break-word",
};

const emptyListText: React.CSSProperties = {
  color: "#666666",
  fontStyle: "italic",
};

const addRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const addButton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#047e00",
  backgroundColor: "rgb(243, 243, 243)",
  flexShrink: 0,
};

const deleteItemButton: React.CSSProperties = {
  width: "22px",
  height: "22px",
  border: "1px solid #b00020",
  borderRadius: "50%",
  backgroundColor: "#fff0f2",
  color: "#b00020",
  cursor: "pointer",
  lineHeight: 1,
  padding: 0,
  flexShrink: 0,
};

const checkboxGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "8px",
  border: "1px solid #b5b5b5",
  borderRadius: "6px",
  backgroundColor: "#f7f7f7",
};

const checkboxItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
};

const sliderValueText: React.CSSProperties = {
  fontSize: "13px",
  color: "#666666",
};

const bottomActionBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  padding: "12px 0 0",
  backgroundColor: "#ffffff",
  flexShrink: 0,
};

const savebutton: React.CSSProperties = {
  color: "#047e00",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  transition: "background 0.2s",
};

const backbutton: React.CSSProperties = {
  color: "#000000",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  transition: "background 0.2s",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  background: "#ffffff",
  padding: "18px",
  borderRadius: "8px",
  maxWidth: "480px",
  width: "90%",
  boxSizing: "border-box",
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
};

const modalMessage: React.CSSProperties = {
  margin: 0,
  marginBottom: "12px",
};

const modalActions: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

const modalBackButton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "#f3f3f3",
};

const modalDeleteButton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #b30000",
  borderRadius: "6px",
  cursor: "pointer",
  backgroundColor: "#ffdddd",
  color: "#b30000",
};

const valueStyle: React.CSSProperties = {
  fontSize: "18px",
  marginBlockStart: "1em",
  marginBlockEnd: "0em",
  cursor: "help",
};

// const errorMsgStyle: React.CSSProperties = {
//   color: "#ff0000",
//   fontWeight: "bold",
//   fontSize:"20px"
// }
