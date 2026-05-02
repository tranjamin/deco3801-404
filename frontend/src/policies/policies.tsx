/// <reference types="chrome" />
import React, { useState } from "react";
import PolicyList from "./components/policyList";
import Details from "./components/details";
import {type SecurityPolicy, storeNewPolicy} from "../policySharing/policySharing";
import Navbar from "../sharedComponent/navbar";

export default function Policies() {

  const [sidebarOpen] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
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

  const handleSelectPolicy = (policy: SecurityPolicy) => {
    setIsCreatingPolicy(false);
    setSelectedPolicy(policy);
  };

  const handleAddPolicy = () => {
    setIsCreatingPolicy(true);
    setSelectedPolicy(emptyPolicy);
  };

  const handleSaveNewPolicy = async (policy: SecurityPolicy) => {
    console.log("placeholder: create new policy", policy);
    await storeNewPolicy(policy);
    // await addDummyPolicy();
    setIsCreatingPolicy(false);
    setSelectedPolicy(policy);
    //window.location.reload();
  };

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

// const sidebar: React.CSSProperties = {
//   position: "fixed", //everything breaks without this
//   top: 0,
//   left: 0,
//   height: "100vh",
//   background: "#111",
//   color: "#fff",
//   transition: "width 200ms",
//   overflow: "hidden", //DO NOT DELETE, stops stuff from showing when collapsed
//   paddingTop: 12,
//   boxSizing: "border-box",
//   zIndex: 20,
// };

// const toggleBtn: React.CSSProperties = {
//   margin: "0 10px 12px",
//   border: "none",
//   borderRadius: 6,
//   padding: "8px 10px",
//   cursor: "pointer",
// };

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
  borderRight: "3px solid #000000",
  overflow: "auto",
  paddingBottom: "4px"
};

const right: React.CSSProperties = {
  background: "#ffffff",
  color: "#111",
  borderLeft: "3px solid #000000"
};
