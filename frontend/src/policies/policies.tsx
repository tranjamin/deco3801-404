/// <reference types="chrome" />
import React, { useState } from "react";
import PolicyList from "./components/policyList";
import Details from "./components/details";
import {type SecurityPolicy, storeNewPolicy} from "../policySharing/policySharing";
import Navbar from "../sharedComponent/navbar";
import { useAuth } from "../api/auth";
import { SessionExpired } from "../sharedComponent/sessionExpired";

/**
 * Main Policies page component. Displays a two-pane layout with the policy list
 * on the left and detailed policy view on the right.
 * Manages policy selection, creation, and state updates.
 * this comment was made with GPT-5 mini on 2026-05-09
 */
export default function Policies() {

  const { isAuthenticated } = useAuth();

  const [sidebarOpen] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
  const [selectedIsDefault, setSelectedIsDefault] = useState<boolean>(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);

  const emptyPolicy: SecurityPolicy = {
    id: 0,
    name: "",
    description: "",
    active: false,
    domains: [],
    protocols: [],
    ciphers: [],
    subjects: [],
    issuers: [],
    validAfter: 0,
    validFor: 0,
  };

  /**
   * Handle policy selection from the list. Updates the selected policy and tracks
   * whether it is a default policy.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const handleSelectPolicy = (policy: SecurityPolicy, isDefault?: boolean) => {
    setIsCreatingPolicy(false);
    setSelectedPolicy(policy);
    setSelectedIsDefault(Boolean(isDefault));
  };

  /**
   * Initiate creation of a new policy by setting an empty policy template
   * and entering edit mode.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const handleAddPolicy = () => {
    setIsCreatingPolicy(true);
    setSelectedPolicy(emptyPolicy);
  };

  /**
   * Save a newly created policy via the backend and reload the page.
   * this comment was made with GPT-5 mini on 2026-05-09
   */
  const handleSaveNewPolicy = async (policy: SecurityPolicy) => {
    await storeNewPolicy(policy);
    setIsCreatingPolicy(false);
    setSelectedPolicy(policy);
    window.location.reload();
  };

  if (isAuthenticated === null) return <div>Loading...</div>;
  if (!isAuthenticated) return <SessionExpired />;

  // Calculate sidebar width based on state; used for responsive layout adjustment
  const sidebarWidth = sidebarOpen ? 220 : 0; //if the state is true width is 220 (random number lol), if not then 0, dont care that its single use for now

  return (
    <div style={page}>

      {/* Sidebar navigation */}
      <div>
        <Navbar active="policies" />
      </div>
      
      {/*actual page*/}
      <div style={{ ...splits, marginLeft: sidebarWidth }}>
        {/*Left Split*/}
        <div style={{ ...split, ...left }}>
          <PolicyList
            onSelectPolicy={handleSelectPolicy}
            onAddPolicy={handleAddPolicy}
            selectedPolicyName={selectedPolicy?.name ?? null}
          />
        </div>
        {/*Right Split*/}
        <div style={{ ...split, ...right }}>
          <Details
            policy={selectedPolicy}
            startInEditMode={isCreatingPolicy}
            isNewPolicy={isCreatingPolicy}
            onSaveNewPolicy={handleSaveNewPolicy}
            isDefaultPolicy={selectedIsDefault}
          />
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh", //can get rid of later if find way to stop the jank
  background: "#ffffff",
};

const splits: React.CSSProperties = {
  display: "flex", //horizontal split
  height: "100vh",
  transition: "margin-left 200ms ",
};

const split: React.CSSProperties = {
  width: "50%",
  position: "relative", //keep the stuff within their split
};

const left: React.CSSProperties = {
  background: "#ffffff",
  color: "#000000",
  borderRight: "0.5px solid #000000",
  overflow: "auto",
  paddingBottom: "4px"
};

const right: React.CSSProperties = {
  background: "#ffffff",
  color: "#111",
  borderLeft: "0.5px solid #000000"
};
