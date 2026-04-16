import React, { useEffect, useState } from "react";
import type { SecurityPolicy } from "../../policySharing/policySharing";
//import { getAllPolicies } from "../../policySharing/policySharing";
import PolicyStub from "./policyStub";

type PolicyListProps = {
  onSelectPolicy: (policy: SecurityPolicy) => void;
  selectedPolicyName: string | null;
};

export default function PolicyList({ onSelectPolicy, selectedPolicyName }: PolicyListProps) {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);

  const GetAllPoliciesFunction = async () => {
    // this function will call an API endpoint to fetch all the users saved policies
    //for now just return sample data
    //const fetchedPolicies = await getAllPolicies();
    const DefaultPolicy1: SecurityPolicy = {
      name: "My Policy 1",
      description: "Default 1",
      active: true,
      protocols: ["1.2", "1.3"],
      subjects: [],
      SANs: [],
      issuers: [],
      validAfter: 50,
      validFor: 10,
      hasSCT: true,
      transparencyCompliance: true,
    };
    const DefaultPolicy2: SecurityPolicy = {
      name: "My Policy 2",
      description: "Default 1",
      active: false,
      protocols: ["1.2", "1.3"],
      subjects: [],
      SANs: [],
      issuers: [],
      validAfter: 50,
      validFor: 10,
      hasSCT: true,
      transparencyCompliance: true,
    };
    const DefaultPolicy3: SecurityPolicy = {
      name: "My Policy 3",
      description: "Default 1",
      active: true,
      protocols: ["1.2", "1.3"],
      subjects: [],
      SANs: [],
      issuers: [],
      validAfter: 50,
      validFor: 10,
      hasSCT: true,
      transparencyCompliance: true,
    };
    const DefaultPolicy4: SecurityPolicy = {
      name: "My Policy 4",
      description: "Default 1",
      active: false,
      protocols: ["1.2", "1.3"],
      subjects: [],
      SANs: [],
      issuers: [],
      validAfter: 50,
      validFor: 10,
      hasSCT: true,
      transparencyCompliance: true,
    };
    const DefaultPolicy5: SecurityPolicy = {
      name: "My Policy 5",
      description: "Default 1",
      active: false,
      protocols: ["1.2", "1.3"],
      subjects: [],
      SANs: [],
      issuers: [],
      validAfter: 50,
      validFor: 10,
      hasSCT: true,
      transparencyCompliance: true,
    };
    const DefaultPolicy6: SecurityPolicy = {
      name: "My Policy 6",
      description: "Default 1",
      active: false,
      protocols: ["1.2", "1.3"],
      subjects: [],
      SANs: [],
      issuers: [],
      validAfter: 50,
      validFor: 10,
      hasSCT: true,
      transparencyCompliance: true,
    };
    const DefaultPolicy7: SecurityPolicy = {
      name: "My Policy 7",
      description: "Default 1",
      active: false,
      protocols: ["1.2", "1.3"],
      subjects: [],
      SANs: [],
      issuers: [],
      validAfter: 50,
      validFor: 10,
      hasSCT: true,
      transparencyCompliance: true,
    };
    const policies = [DefaultPolicy1, DefaultPolicy2, DefaultPolicy3,DefaultPolicy4,DefaultPolicy5,DefaultPolicy6,DefaultPolicy7];
    setPolicies(policies);
  };

  useEffect(() => {
    void GetAllPoliciesFunction();
  }, []);

  const handleImport = () => {
        // finds the report.html file in root dir
        console.log("importing");
    }

  return (
    <div style={container}>
      <h2 style={heading}>POLICIES</h2>
      <div style={rowofthings}>
        <h3 style={subheading}>Active Policies</h3>
        <button style={importbutton} onClick={handleImport} 
                        onMouseOver={(e) => (e.currentTarget.style.background = "#d3d3d3")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "rgb(243, 243, 243)")}>Import</button>
      </div>
      {policies.length === 0 ? (
        <p>dis do be da policy list bruva</p>
      ) : (
        policies.map((policy, index) =>
          policy.active === true ? (
            <PolicyStub
              key={`${policy.name}-${index}`}
              policy={policy}
              onSelect={onSelectPolicy}
              isSelected={selectedPolicyName === policy.name}
            />
          ) : (
            ""
          ),
        )
      )}
      <h3 style={subheading}>Inactive Policies</h3>
      {policies.length === 0 ? (
        <p>dis do be da policy list bruva</p>
      ) : (
        policies.map((policy, index) =>
          policy.active === false ? (
            <PolicyStub
              key={`${policy.name}-${index}`}
              policy={policy}
              onSelect={onSelectPolicy}
              isSelected={selectedPolicyName === policy.name}
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

const importbutton: React.CSSProperties = {
  marginLeft: "auto",
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#00a2ff",
  backgroundColor: "rgb(243, 243, 243)"
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
