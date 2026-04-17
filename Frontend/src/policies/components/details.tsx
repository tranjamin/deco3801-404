import React, { useEffect, useState } from "react";
import {
  deletePolicy,
  type SecurityPolicy,
  activatePolicy,
  deactivatePolicy
} from "../../policySharing/policySharing";

type DetailsProps = {
  policy: SecurityPolicy | null;
  startInEditMode?: boolean;
  isNewPolicy?: boolean;
  onSaveNewPolicy?: (policy: SecurityPolicy) => Promise<void> | void;
};

type PolicyFormData = {
  name: string;
  description: string;
  active: string;
  protocols: string[];
  ciphers: string[];
  subjects: string[];
  SANs: string[];
  issuers: string[];
  validFor: string;
  validAfter: string;
  hasSCT: string;
};

type ArrayFieldName = "protocols" | "ciphers" | "subjects" | "SANs" | "issuers";

type ArrayListEditorProps = {
  label: string;
  inputId: string;
  items: string[];
  draftValue: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const emptyFormData: PolicyFormData = {
  name: "",
  description: "",
  active: "",
  protocols: [],
  ciphers: [],
  subjects: [],
  SANs: [],
  issuers: [],
  validFor: "",
  validAfter: "",
  hasSCT: "",
};

function mapPolicyToFormData(policy: SecurityPolicy): PolicyFormData {
  return {
    name: policy.name,
    description: policy.description,
    active: String(policy.active),
    protocols: [...policy.protocols],
    ciphers: [...policy.ciphers],
    subjects: [...policy.subjects],
    SANs: [...policy.SANs],
    issuers: [...policy.issuers],
    validFor: String(policy.validFor),
    validAfter: String(policy.validAfter),
    hasSCT: String(policy.hasSCT),
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
    protocols: [...formData.protocols],
    ciphers: [...formData.ciphers],
    subjects: [...formData.subjects],
    SANs: [...formData.SANs],
    issuers: [...formData.issuers],
    validAfter: Number(formData.validAfter) || 0,
    validFor: Number(formData.validFor) || 0,
    hasSCT: formData.hasSCT === "true",
  };
}

function ArrayListEditor({
  label,
  inputId,
  items,
  draftValue,
  onDraftChange,
  onAdd,
  onRemove,
}: ArrayListEditorProps) {
  return (
    <div style={fieldGroup}>
      <label style={fieldLabel}>{label}</label>
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
          value={draftValue}
          onChange={(e) => onDraftChange(e.target.value)}
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
}: DetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PolicyFormData>(emptyFormData);
  const [arrayDrafts, setArrayDrafts] = useState<
    Record<ArrayFieldName, string>
  >({
    protocols: "",
    ciphers: "",
    subjects: "",
    SANs: "",
    issuers: "",
  });

  useEffect(() => {
    if (policy) {
      setFormData(mapPolicyToFormData(policy));
      setIsEditing(startInEditMode);
      setArrayDrafts({
        protocols: "",
        ciphers: "",
        subjects: "",
        SANs: "",
        issuers: "",
      });
      return;
    }

    setIsEditing(false);
    setFormData(emptyFormData);
    setArrayDrafts({
      protocols: "",
      ciphers: "",
      subjects: "",
      SANs: "",
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
    console.log("Downloading Policy JSON");
    //window.location.reload();
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

  const handleInputChange = (field: keyof PolicyFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
    }

    console.log("saving edited policy to API", policyPayload);
    //window.location.reload();
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
                  <label style={fieldLabel} htmlFor="policy-name">
                    Name
                  </label>
                  <input
                    id="policy-name"
                    style={textInput}
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div style={fieldGroup}>
                  <label style={fieldLabel} htmlFor="policy-description">
                    Description
                  </label>
                  <input
                    id="policy-description"
                    style={textInput}
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </div>

                <div style={fieldGroup}>
                  <ArrayListEditor
                    label="Protocols"
                    inputId="policy-protocols"
                    items={formData.protocols}
                    draftValue={arrayDrafts.protocols}
                    onDraftChange={(value) =>
                      handleArrayDraftChange("protocols", value)
                    }
                    onAdd={() => handleArrayAdd("protocols")}
                    onRemove={(index) => handleArrayRemove("protocols", index)}
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
                  />
                </div>

                <div style={fieldGroup}>
                  <ArrayListEditor
                    label="SANs"
                    inputId="policy-sans"
                    items={formData.SANs}
                    draftValue={arrayDrafts.SANs}
                    onDraftChange={(value) =>
                      handleArrayDraftChange("SANs", value)
                    }
                    onAdd={() => handleArrayAdd("SANs")}
                    onRemove={(index) => handleArrayRemove("SANs", index)}
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
                  />
                </div>

                <div style={fieldGroup}>
                  <label style={fieldLabel} htmlFor="policy-valid-for">
                    Valid for how many days after issue?
                  </label>
                  <input
                    id="policy-valid-for"
                    style={textInput}
                    type="text"
                    value={formData.validFor}
                    onChange={(e) =>
                      handleInputChange("validFor", e.target.value)
                    }
                  />
                </div>

                <div style={fieldGroup}>
                  <label style={fieldLabel} htmlFor="policy-valid-after">
                    How many days is the certificate still valid for? (minimum)
                  </label>
                  <input
                    id="policy-valid-after"
                    style={textInput}
                    type="text"
                    value={formData.validAfter}
                    onChange={(e) =>
                      handleInputChange("validAfter", e.target.value)
                    }
                  />
                </div>

                <div style={fieldGroup}>
                  <label style={checkboxLabel} htmlFor="policy-has-sct">
                    <input
                      id="policy-has-sct"
                      type="checkbox"
                      checked={formData.hasSCT === "true"}
                      onChange={(e) =>
                        handleInputChange(
                          "hasSCT",
                          e.currentTarget.checked ? "true" : "false",
                        )
                      }
                    />
                    Has SCT
                  </label>
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
                  <strong>Protocols:</strong> {policy.protocols.join(", ")}
                </p>
                <p>
                  <strong>Ciphers:</strong> {policy.ciphers.join(", ")}
                </p>
                <p>
                  <strong>Subjects:</strong> {policy.subjects.join(", ")}
                </p>
                <p>
                  <strong>SANs:</strong> {policy.SANs.join(", ")}
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
                <p>
                  <strong>Has SCT?:</strong> {policy.hasSCT ? "True" : "False"}
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
              <button type="button" style={deletebutton} onClick={handleDelete}>
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
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
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

const bottomActionBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  padding: "12px 0 0",
  backgroundColor: "#e5e7eb",
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
