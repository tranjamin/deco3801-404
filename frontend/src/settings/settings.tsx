/// <reference types="chrome" />
import React, { useEffect, useState } from "react";
import Navbar from "../sharedComponent/navbar";

const SETTINGS_STORAGE_KEY = "allowedDomains";

type SettingsFormData = {
  allowedDomains: string[];
};

type SettingsListEditorProps = {
  label: string;
  inputId: string;
  items: string[];
  draftValue: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

function SettingsListEditor({
  label,
  inputId,
  items,
  draftValue,
  onDraftChange,
  onAdd,
  onRemove,
}: SettingsListEditorProps) {
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
          placeholder="new domain"
        />
        <button type="button" style={addButton} onClick={onAdd}>
          Add
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const defaultAllowedDomains = ["portal.my.uq.edu.au", "my.uq.edu.au"];
  const [formData, setFormData] = useState<SettingsFormData>({
    allowedDomains: defaultAllowedDomains,
  });
  const [lastSavedAllowedDomains, setLastSavedAllowedDomains] = useState<string[]>(
    defaultAllowedDomains,
  );
  const [domainDraft, setDomainDraft] = useState("");

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!rawValue) {
        return;
      }

      const parsedValue = JSON.parse(rawValue);
      if (Array.isArray(parsedValue)) {
        setFormData({
          allowedDomains: parsedValue,
        });
        setLastSavedAllowedDomains(parsedValue);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
  }, []);

  const hasUnsavedChanges =
    JSON.stringify(formData.allowedDomains) !==
    JSON.stringify(lastSavedAllowedDomains);

  const handleDomainAdd = () => {
    const value = domainDraft.trim();

    if (!value) return;

    setFormData((prev) => ({
      ...prev,
      allowedDomains: [...prev.allowedDomains, value],
    }));
    setDomainDraft("");
  };

  const handleDomainRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  const handleSave = async () => {
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(formData.allowedDomains),
      );
      setLastSavedAllowedDomains([...formData.allowedDomains]);
      console.log("Value is set");
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  };

  return (
    <div style={page}>
      <Navbar active="settings" />

      <main style={content}>
        <div style={container}>
          <h2 style={heading}>SETTINGS</h2>
            <div style={card}>
            <SettingsListEditor
              label="Allowed Domains"
              inputId="allowed-domains"
              items={formData.allowedDomains}
              draftValue={domainDraft}
              onDraftChange={setDomainDraft}
              onAdd={handleDomainAdd}
              onRemove={handleDomainRemove}
            />

            <div style={footerActions}>
              <button
                type="button"
                style={{
                  ...saveButton,
                  ...(hasUnsavedChanges ? {} : saveButtonDisabled),
                }}
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
              >
                Save
              </button>
            </div>
            </div>
        </div>
      </main>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
};

const content: React.CSSProperties = {
  marginLeft: 220,
  minHeight: "100vh",
};

const container: React.CSSProperties = {
  maxHeight: "100%",
  padding: "24px",
  boxSizing: "border-box",
  overflow: "auto",
};

const card: React.CSSProperties = {
  maxWidth: "720px",
//   padding: "20px",
//   border: "1px solid #c7c7c7",
//   borderRadius: "12px",
//   backgroundColor: "#ffffff",
//   boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
};

const heading: React.CSSProperties = {
  marginTop: 0,
  borderBottom: "2px solid #000000",
  textAlign: "left",
};

const fieldGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginBottom: "16px",
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

const footerActions: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
  marginTop: "20px",
};

const saveButton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#047e00",
  backgroundColor: "rgb(243, 243, 243)",
};

const saveButtonDisabled: React.CSSProperties = {
  cursor: "not-allowed",
  opacity: 0.5,
};