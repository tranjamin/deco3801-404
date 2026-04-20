import React from "react";
import { type  SecurityPolicy, activatePolicy, deactivatePolicy } from "../../policySharing/policySharing";

type PolicyStubProps = {
    policy: SecurityPolicy;
    onSelect: (policy: SecurityPolicy) => void;
    isSelected: boolean;
};

export default function PolicyStub({ policy, onSelect, isSelected }: PolicyStubProps) {

    const handleActivate = async () => {
        console.log("sending activated policy to API");
        await activatePolicy(policy.id);
        window.location.reload();
    }

    const handleDeactivate = async () => {
        console.log("sending deactivated policy to API");
         await deactivatePolicy(policy.id);
        window.location.reload();
    }
    return (
                <div style={{ ...stub, ...(isSelected ? selectedStub : {}) }} onClick={() => onSelect(policy)}>
            <div style={rowofthings}>
                <div style={rowofthings}>
                    {policy.active === true ? (
                    <div style={greendot}/>) : (<div style={graydot} />)}
                    <h2>{policy.name}</h2>
                </div>
                {policy.active === false ? (
                        <button style={activatebutton} 
                        onMouseOver={(e) => (e.currentTarget.style.background = "#d3d3d3")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "rgb(243, 243, 243)")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleActivate();
                                                }}> activate</button>
                      ) : (
                        <button style={deactivatebutton}  
                        onMouseOver={(e) => (e.currentTarget.style.background = "#d3d3d3")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "rgb(243, 243, 243)")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDeactivate();
                                                }}> deactivate</button>
                      )}
                
            </div>
            <p>{policy.description}</p>
            
            
        </div>
    );
}

const stub: React.CSSProperties = {
    border: "1px solid #000",
    borderRadius: "8px",
    padding: "8px",
    marginBottom: "12px",
    background: "#ffffff",
    cursor: "pointer",
    boxSizing: "border-box"
};

const selectedStub: React.CSSProperties = {
    border: "3px solid #000",   // thicker border
    boxShadow: "0 0 0 1px #00000020", // optional subtle emphasis
    
};

const rowofthings: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const deactivatebutton: React.CSSProperties = {
  marginLeft: "auto",
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#ff0000",
  backgroundColor: "rgb(243, 243, 243)"
  
};

const activatebutton: React.CSSProperties = {
  marginLeft: "auto",
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#047e00",
  backgroundColor: "rgb(243, 243, 243)"
};

const greendot: React.CSSProperties = {
    width: "10px",
    aspectRatio: "1 / 1",
    border: "1px solid #000000",
    borderRadius: "50%",
    backgroundColor: "#00ff37",
    margin: "5px"
}

const graydot: React.CSSProperties = {
    width: "10px",
    aspectRatio: "1 / 1",
    border: "1px solid #000000",
    borderRadius: "50%",
    backgroundColor: "#c0c0c0",
    margin: "5px"
}