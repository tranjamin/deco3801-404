import React from "react";
import type { SecurityPolicy } from "../../policySharing/policySharing";

type DetailsProps = {
  policy: SecurityPolicy | null;
};

export default function Details({ policy }: DetailsProps) {

	const handleActivate = async () => {
        console.log("sending activated policy to API");
        window.location.reload();
    }

    const handleDeactivate = async () => {
        console.log("sending deactivated policy to API");
        window.location.reload();
    }

	const handleShare = async () => {
        console.log("Downloading Policy JSON");
        //window.location.reload();
    }


  return (
    <div style={container}>
      <h2 style={heading}>DETAILS</h2>
      {policy ? (
        <div>
          <div style={headerRow}>
            <div style={leftHeaderGroup}>
              {policy.active === true ? (
                <div style={greendot} />
              ) : (
                <div style={graydot} />
              )}
              <div style={pName}>{policy.name}</div>
            </div>

            <div style={rightHeaderGroup}>
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
					  <button style={importbutton} onClick={handleShare} 
                        onMouseOver={(e) => (e.currentTarget.style.background = "#d3d3d3")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "rgb(243, 243, 243)")}>Share</button>
			</div>
          </div>
          <p>
            <strong>Description:</strong> {policy.description}
          </p>
          <p>
            <strong>Status:</strong> {policy.active ? "Active" : "Inactive"}
          </p>
          <p>
            <strong>Protocols:</strong> {policy.protocols.join(", ")}
          </p>
		  <p>
            <strong>Subjects:</strong> {policy.subjects.join(", ")}
          </p>
		  <p>
            <strong>SANs:</strong> {policy.SANs.join(", ")}
          </p>
		  <p>
            <strong>Valid Certificate Authorities:</strong> {policy.issuers.join(", ")}
          </p>
		  <p>
            <strong>Valid for how many days after issue?:</strong> {policy.validFor}
          </p>
		  <p>
            <strong>How many days is the certificate still valid for? (minimum):</strong> {policy.validAfter}
          </p>
		  <p>
            <strong>Has SCT?:</strong> {policy.hasSCT ? "True" : "False"}
          </p>
        </div>
      ) : (
        <p>Select a policy from the left pane to view details.</p>
      )}
    </div>
  );
}

const container: React.CSSProperties = {
  height: "100%",
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
  fontWeight: "bold"
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
  margin: "3px"
  
};

const activatebutton: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#047e00",
  backgroundColor: "rgb(243, 243, 243)",
  margin: "3px"
};

const importbutton: React.CSSProperties = {
  marginLeft: "auto",
  padding: "8px 12px",
  border: "1px solid #000000",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#00a2ff",
  backgroundColor: "rgb(243, 243, 243)",
  margin: "3px"
};
