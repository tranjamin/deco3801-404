import React from "react";
import {
  type SecurityPolicy,
  activatePolicy,
  deactivatePolicy,
} from "../../policySharing/policySharing";

/**
 * Props for PolicyStub component that displays a policy summary card.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
type PolicyStubProps = {
  policy: SecurityPolicy;
  onSelect: (policy: SecurityPolicy, isDefault?: boolean) => void;
  isSelected: boolean;
  isDefault?: boolean;
};

/**
 * Component displaying a policy as a selectable card with name, description, and status.
 * Allows quick activation/deactivation via buttons.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
export default function PolicyStub({
  policy,
  onSelect,
  isSelected,
  isDefault,
}: PolicyStubProps) {
  /**
   * Activate policy and reload page to show updated state.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const handleActivate = async () => {
    await activatePolicy(policy.id);
    window.location.reload();
  };

  /**
   * Deactivate policy and reload page to show updated state.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const handleDeactivate = async () => {
    await deactivatePolicy(policy.id);
    window.location.reload();
  };
  return (
    <div
      style={{ ...stub, ...(isSelected ? selectedStub : {}) }}
      onClick={() => onSelect(policy, !!isDefault)}
    >
      <div style={rowofthings}>
        <div style={rowofthings}>
          {policy.active === true ? (
            <div style={greendot} />
          ) : (
            <div style={graydot} />
          )}
          <h2>{policy.name}</h2>
        </div>
        {policy.active === false ? (
          <button
            style={activatebutton}
            onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
            title="Activate Policy"
            onClick={(e) => {
              e.stopPropagation();
              void handleActivate();
            }}
          >
            {" "}
            <img src="/empty.svg" width={15} height={15} />
          </button>
        ) : (
          <button
            style={deactivatebutton}
            onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
            title="Deactivate Policy"
            onClick={(e) => {
              e.stopPropagation();
              void handleDeactivate();
            }}
          >
            {" "}
            <img src="/activate4.svg" width={15} height={15} />
          </button>
        )}
      </div>
      <p>{policy.description}</p>
    </div>
  );
}

const stub: React.CSSProperties = {
  border: "1px solid rgb(204, 204, 204)",
  borderRadius: "8px",
  padding: "8px",
  marginBottom: "12px",
  background: "#ffffff",
  cursor: "pointer",
  boxSizing: "border-box",
};

const selectedStub: React.CSSProperties = {
  border: "3px solid #000",
  boxShadow: "0 0 0 1px #00000020",
};

const rowofthings: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const deactivatebutton: React.CSSProperties = {
  marginLeft: "auto",

  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: 6,
  background: "#ffffff",
  border: "2.5px solid #000000",
  borderRadius: "50%",
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
  border: "2.5px solid #000000",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500",
  color: "#24292f",
  transition: "background 0.2s",
};

const greendot: React.CSSProperties = {
  width: "10px",
  aspectRatio: "1 / 1",
  border: "1px solid #000000",
  borderRadius: "50%",
  backgroundColor: "#00ff37",
  margin: "5px",
};

const graydot: React.CSSProperties = {
  width: "10px",
  aspectRatio: "1 / 1",
  border: "1px solid #000000",
  borderRadius: "50%",
  backgroundColor: "#c0c0c0",
  margin: "5px",
};
