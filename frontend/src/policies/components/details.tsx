import React, { useEffect, useState } from "react";
import {
  deletePolicy,
  type SecurityPolicy,
  activatePolicy,
  deactivatePolicy,
  exportPolicy,
  updatePolicy
} from "../../policySharing/policySharing";

type DetailsProps = {
  policy: SecurityPolicy | null;
  startInEditMode?: boolean;
  isNewPolicy?: boolean;
  onSaveNewPolicy?: (policy: SecurityPolicy) => Promise<void> | void,
  isDefaultPolicy?: boolean;
};

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

type ArrayFieldName = "domains" | "protocols" | "ciphers" | "subjects" | "issuers";

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

type ProtocolSelectorProps = {
  selectedProtocols: string[];
  onProtocolChange: (protocol: string, checked: boolean) => void;
};

const AVAILABLE_PROTOCOLS = ["TLS 1.0", "TLS 1.1", "TLS 1.2", "TLS 1.3"];

function normalizeProtocol(protocol: string): string {
  return protocol.trim().toLowerCase().replace(/^tls\s+/, "");
}

function toDisplayProtocol(protocol: string): string {
  return `TLS ${normalizeProtocol(protocol)}`;
}

function toBackendProtocol(protocol: string): string {
  return `tls ${normalizeProtocol(protocol)}`;
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

function mapPolicyToFormData(policy: SecurityPolicy): PolicyFormData {
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
    protocols: formData.protocols.map((protocol) => toBackendProtocol(protocol)),
    ciphers: [...formData.ciphers],
    subjects: [...formData.subjects],
    issuers: [...formData.issuers],
    validAfter: Number(formData.validAfter) || 0,
    validFor: Number(formData.validFor) || 0,
  };
}

function ProtocolSelector({
  selectedProtocols,
  onProtocolChange,
}: ProtocolSelectorProps) {
  return (
    <div style={fieldGroup}>
      <label
        style={fieldLabel}
        title="Select allowed TLS/SSL protocol versions"
      >
        Protocols
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
      <label style={fieldLabel} title={tooltip}>
        {label}
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
        <button type="button" style={addButton} onClick={onAdd}>
          Add
        </button>
      </div>
    </div>
  );
}

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


  useEffect(() => {
    console.log("default?:", isDefaultPolicy);
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
    if (policy == null) {return}
    console.log("sending activated policy to API");
    await activatePolicy(policy.id);
    window.location.reload();
  };

  const handleDeactivate = async () => {
    if (policy == null) {return}
    console.log("sending deactivated policy to API");
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
    // call existing delete logic; keep it centralized
    if (!isDefaultPolicy) {
      await handleDelete();
    } else {
      //add code here for deleting the policy in the default folder
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

  const handleSave = async () => {
    const policyPayload = mapFormDataToPolicy(formData, policy?.id);

    if (isNewPolicy && onSaveNewPolicy) {
      await onSaveNewPolicy(policyPayload);
      return;
    } else if (!isNewPolicy && updatePolicy && policy) {
      await updatePolicy(policyPayload, policy.id);
    }

    console.log("saving edited policy to API", policyPayload);
    window.location.reload();
  };

  const handleBack = async () => {
    console.log("cancelling policy edit");
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
                    {policy.active ? <div style={greendot} /> : <div style={graydot} />}
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
                          (e.currentTarget.style.background = "#d3d3d3")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background =
                            "rgb(243, 243, 243)")
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleActivate();
                        }}
                      >
                        {" "}
                        activate
                      </button>
                    ) : (
                      <button
                        style={deactivatebutton}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#d3d3d3")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background =
                            "rgb(243, 243, 243)")
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeactivate();
                        }}
                      >
                        {" "}
                        deactivate
                      </button>
                    )}
                    <button
                      style={importbutton}
                      onClick={handleShare}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#d3d3d3")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background =
                          "rgb(243, 243, 243)")
                      }
                    >
                      Share
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div>
                <div style={fieldGroup}>
                  <label
                    style={fieldLabel}
                    htmlFor="policy-name"
                    title="The name of the policy"
                  >
                    Name
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
                    style={fieldLabel}
                    htmlFor="policy-description"
                    title="A brief description of what this policy enforces"
                  >
                    Description
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
                    tooltip="Domains where this policy should apply"
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
                    tooltip="Valid cipher suites for TLS connections"
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
                    tooltip="Valid certificate subject names"
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
                    style={fieldLabel}
                    htmlFor="policy-valid-for"
                    title="Minimum number of days the certificate should be valid after issuance"
                  >
                    Valid for how many days after issue?
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
                    style={fieldLabel}
                    htmlFor="policy-valid-after"
                    title="Minimum number of days remaining until certificate expiration"
                  >
                    How many days is the certificate still valid for? (minimum)
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
                <p>
                  <strong>Description:</strong> {policy.description}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {policy.active ? "Active" : "Inactive"}
                </p>
                <p>
                  <strong>Domains:</strong> {policy.domains.join(", ")}
                </p>
                <p>
                  <strong>Protocols:</strong> {policy.protocols.join(", ")}
                </p>
                <p>
                  <strong>Ciphers:</strong> {policy.ciphers.join(", ")}
                </p>
                <p>
                  <strong>Subjects:</strong> {policy.subjects.join(", ")}
                </p>
                <p>
                  <strong>Valid Certificate Authorities:</strong>{" "}
                  {policy.issuers.join(", ")}
                </p>
                <p>
                  <strong>Valid for how many days after issue?:</strong>{" "}
                  {policy.validFor}
                </p>
                <p>
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
              <button type="button" style={editbutton} onClick={handleEdit}>
                Edit
              </button>
              <button
                type="button"
                style={deletebutton}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                Delete
              </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  style={savebutton}
                  onClick={() => void handleSave()}
                >
                  Save
                </button>
                <button
                  type="button"
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
                    ? (isDefaultPolicy === true || (typeof isDefaultPolicy === 'undefined'))
                      ? `This is a default policy bundled with the app. Deleting it will remove the local copy. Are you sure you want to delete "${policy.name}"?`
                      : `Are you sure you want to permanently delete "${policy.name}"? This action cannot be undone.`
                    : "No policy selected."
                  }
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
                      if (typeof isDefaultPolicy != 'undefined') {
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
  //gap: "8px",
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
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#ff0000",
  backgroundColor: "rgb(243, 243, 243)",
  margin: "3px",
};

const activatebutton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#047e00",
  backgroundColor: "rgb(243, 243, 243)",
  margin: "3px",
};

const importbutton: React.CSSProperties = {
  marginLeft: "auto",
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#00a2ff",
  backgroundColor: "rgb(243, 243, 243)",
  margin: "3px",
};

const editbutton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#967500",
  backgroundColor: "rgb(243, 243, 243)",
  margin: "3px",
};

const deletebutton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#b30000",
  backgroundColor: "rgb(243, 243, 243)",
  margin: "3px",
};

const fieldGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginBottom: "12px",
};

const fieldLabel: React.CSSProperties = {
  fontWeight: "bold",
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
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#047e00",
  backgroundColor: "rgb(243, 243, 243)",
};

const backbutton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#333333",
  backgroundColor: "rgb(243, 243, 243)",
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
