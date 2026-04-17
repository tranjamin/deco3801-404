import type React from "react";
import type { TLSData } from "../types";

type Props = {
    data: TLSData;
};

export function CurrentSiteSummary({ data }: Props) {
    const getStatusColor = () => {
        // checks for current domain days remaining of tls
        if (data.daysRemaining < 3) return "#d81b1bda";
        if (data.daysRemaining < 15) return "#f1c120";
        return "green";
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
                        color: "white",
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
                        <p style= {{ margin: 0 }}>{data.domain}</p>
                    </div>
                    
                    <div style={{ padding: 3 }}>
                        <p style= {{ margin: 0 }}><b>Issuer</b></p>
                        <p style= {{ margin: 0 }}>{data.issuer}</p>
                    </div>
                        
                    <div style={{ padding: 3 }}>
                        <p style= {{ margin: 0 }}><b>Valid Date</b></p>
                        <p style= {{ margin: 0 }}>{new Date(data.validDate).toLocaleDateString("en-GB")}</p>
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