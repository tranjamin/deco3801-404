import type React from "react";

type Props = {
    stats: { 
        ok: number; 
        warning: number; 
        expired: number 
    };
};

export function TLSLog({ stats } : Props) {

    return (
        <div style={cardStyle}>

            <div style={headerStyle}>
                <h4 style={{ margin: 0 }}><b>
                    TLS Certificate Log
                </b></h4>
            </div>
            
            <div style={gridStyle}>
                {/* future log entries */}

                <div style={itemStyle}>
                    <img src="/check.svg" width={24} height={24} />
                    <p style={{ margin: 5 }}>{stats.ok}</p>
                    {/* instead of number, function to grab total number */}
                </div>

                <div style={itemStyle}>
                    <img src="/warning.svg" width={24} height={24} />
                    <p style={{ margin: 5 }}>{stats.warning}</p>
                </div>

                <div style={itemStyle}>
                    <img src="/error.svg" width={24} height={24} />
                    <p style={{ margin: 5 }}>{stats.expired}</p>
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
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 10
};


const itemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    border: "1px solid #d1d9e0",
    borderRadius: 6,
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
    background: "#fff"
}