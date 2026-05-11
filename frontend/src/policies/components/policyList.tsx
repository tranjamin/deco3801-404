import React, { useEffect, useState } from "react";
import { getAllPolicies, importPolicy, type SecurityPolicy } from "../../policySharing/policySharing";
//import { getAllPolicies } from "../../policySharing/policySharing";
import PolicyStub from "./policyStub";

/**
 * Props for PolicyList component that displays all available policies.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
type PolicyListProps = {
  onSelectPolicy: (policy: SecurityPolicy, isDefault?: boolean) => void;
  onAddPolicy: () => void;
  selectedPolicyName: string | null;
};

/**
 * Component for listing all policies, separated into active and inactive sections.
 * Supports adding new policies, importing from JSON files, and loading default policies.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
export default function PolicyList({
  onSelectPolicy,
  onAddPolicy,
  selectedPolicyName,
}: PolicyListProps) {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [defaultPolicyNames, setDefaultPolicies] = useState<string[]>([]);

  /**
   * Fetch all policies from the backend and load bundled default policies.
   * Auto-import default policies that don't already exist in the backend.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const GetAllPoliciesFunction = async () => {
    const fetchedPolicies = await getAllPolicies();
    console.log(fetchedPolicies);
    console.log(typeof(fetchedPolicies));
    const backendPolicies = fetchedPolicies ?? [];
    const collectedDefaults: string[] = [];

    try {
      const modules = import.meta.glob('../../../../defaultPolicies/*.json', {
        eager: true
      }) as Record<string, { default: string }>;

      console.log("imported:",modules);

      const defaultFiles = Object.values(modules).map(m => m.default);

      const backendNames = new Set(
        backendPolicies.map((p) => (p?.name ?? '').toLowerCase()),
      );
      console.log("default files:", defaultFiles);
      for (const fileContent of defaultFiles) {
        try {
          //const parsed = JSON.parse(fileContent) as { name?: unknown };
          const parsed = fileContent as { name?: unknown };
          const name = typeof parsed.name === 'string' ? parsed.name : null;

          if (!name) continue;

          collectedDefaults.push(name);

          // Only import if this policy name doesn't already exist in backend
          if (!backendNames.has(name.toLowerCase())) {
            console.log("importing a policy")
            await importPolicy(JSON.stringify(fileContent));
            
          }
        } catch (err) {
          console.warn('Skipping invalid default policy file:', err);
        }
      }
      //window.location.reload();
    } catch (e) {
      console.warn('No default policies found or failed to load defaults.', e);
    }

    setDefaultPolicies(collectedDefaults);
    const allPolicies = await getAllPolicies();
    setPolicies(allPolicies ?? backendPolicies);
    console.log("default policy names:", collectedDefaults)
    
  };

  useEffect(() => {
    void GetAllPoliciesFunction();
  }, []);

  /**
   * Open a file dialog to import a policy JSON file from the user's filesystem.
   * Parse and store the imported policy via the backend API.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === "string") {
              resolve(content);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });

        await importPolicy(fileContent);
        window.location.reload();
      } catch (error) {
        console.error("Import failed:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Please ensure it is a valid JSON file.";
        alert(`Failed to import policy. ${message}`);
      }
    };

    input.click();
  };

  /**
   * Trigger adding a new policy by calling the onAddPolicy callback.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const handleAdd = () => {
    onAddPolicy();
  };

  return (
    <div style={container}>
      <h2 style={heading}>POLICIES</h2>
      <div style={rowofthings}>
        <h3 style={subheading}>Active Policies</h3>
        <div style={putonLeft}>
          <button
            style={addbutton}
            onClick={handleAdd}
            onMouseOver={(e) => (e.currentTarget.style.background = "#d3d3d3")}
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "rgb(243, 243, 243)")
            }
          >
            Add
          </button>
          <button
            style={importbutton}
            onClick={handleImport}
            onMouseOver={(e) => (e.currentTarget.style.background = "#d3d3d3")}
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "rgb(243, 243, 243)")
            }
          >
            Import
          </button>
        </div>
      </div>
      {policies.length === 0 ? (
        <p>loading...</p>
      ) : (
        policies.map((policy, index) =>
          policy.active === true ? (
            <PolicyStub
              key={`${policy.name}-${index}`}
              policy={policy}
              onSelect={onSelectPolicy}
              isSelected={selectedPolicyName === policy.name}
              isDefault={defaultPolicyNames.some((n) => n === (policy.name ?? ''))}
            />
          ) : (
            ""
          ),
        )
      )}
      <h3 style={subheading}>Inactive Policies</h3>
      {policies.length === 0 ? (
        <p>loading...</p>
      ) : (
        policies.map((policy, index) =>
          policy.active === false ? (
            <PolicyStub
              key={`${policy.name}-${index}`}
              policy={policy}
                onSelect={onSelectPolicy}
                isSelected={selectedPolicyName === policy.name}
                isDefault={defaultPolicyNames.some((n) => n.toLowerCase() === (policy.name ?? '').toLowerCase())}
            />
          ) : (
            ""
          ),
        )
      )}
    </div>
  );
}

const rowofthings: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const putonLeft: React.CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  gap: "8px"
}

const addbutton: React.CSSProperties = {
  //marginLeft: "auto",
  padding: "8px 12px 8px 8px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#009900",
  backgroundColor: "rgb(243, 243, 243)",
};


const importbutton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#00a2ff",
  backgroundColor: "rgb(243, 243, 243)",
};

const container: React.CSSProperties = {
  maxHeight: "100%",
  width: "100%",
  padding: "24px",
  boxSizing: "border-box",
  overflow: "auto",
};

const heading: React.CSSProperties = {
  marginTop: 0,
  borderBottom: "2px solid #000000",
  textAlign: "center",
};

const subheading: React.CSSProperties = {
  marginTop: 0,
  fontStyle: "italic bold",
  textDecoration: "underline",
  fontSize: 20,
  //  flex: 1,
  textAlign: "left",
};
