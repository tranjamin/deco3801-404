import type React from "react";
import type { TLSCertificateTransformed } from "../../sharedComponent/types";

type Props = {
    data: TLSCertificateTransformed;
};

export function CurrentSiteSummary({ data }: Props) {
    const getStatusColor = () => {
        // checks for current domain days remaining of tls
        if (data.daysRemaining < 3) return "#ff4c4cda";
        if (data.daysRemaining < 15) return "#e4bc2e";
        return "#3edd4c";
    };

    return (
        <div style={cardStyle}>

            <div style={headerStyle}>
                <h4 style={{ margin: 0 }}><b>Current Visited Site</b></h4>
            </div>
            

            <div style={gridStyle}>
                {/* left box */}
                <div style={leftBox}>
                    {/* days left */}
                    <div style={{
                        padding: 14,
                        background: getStatusColor(),
                        color: "#000000",
                        borderRadius: 6,
                        border: "1px solid #d1d9e0",
                    }}>
                        <p style={{ margin: 0 }}><b>Days left</b></p>
                        <p style={{ margin: 0 }}>{data.daysRemaining}</p>
                    </div>

                    <div style={protocolBox}>
                        <p style={{ margin: 0 }}><b>Protocol</b></p>
                        <p style={{ margin: 0 }}>{data.protocol}</p>                    
                    </div>
                </div>

                {/* right box */}
                <div style={rightBox}>
                    <div style={{ padding: 3 }}>
                        <p style= {{ margin: 0 }}><b>Domain</b></p>
                        <p style= {{ margin: 0 }}>{data.subjectName || data.sanList?.[0]}</p>
                    </div>
                    
                    <div style={{ padding: 3 }}>
                        <p style= {{ margin: 0 }}><b>Issuer</b></p>
                        <p style= {{ margin: 0 }}>{data.issuer}</p>
                    </div>
                        
                    <div style={{ padding: 3 }}>
                        <p style= {{ margin: 0 }}><b>Valid Date</b></p>
                        <p style= {{ margin: 0 }}>{data.validFrom} - {data.validTo}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}



// Shared style to keep buttons consistent
const cardStyle: React.CSSProperties = {
    padding: "8px",
    border: "1px solid white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.47)",
};


const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10
};

// reference: ChatGPT4o - assisted in creating the column box and row box containers
// prompt: how do i make my containers stack vertically or side by side horizontally
const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: "10px",
    alignItems: "stretch"
};


const leftBox: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
};


const protocolBox: React.CSSProperties = {
    padding: 14,
    borderRadius: 5,
    border: "1px solid #d1d9e0",
};


const rightBox: React.CSSProperties = {
    padding: 10,
    borderRadius: "12px",
    border: "1px solid #d1d9e0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
};