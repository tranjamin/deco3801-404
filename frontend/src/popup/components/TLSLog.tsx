import type React from "react";

type Props = {
    stats: { 
        ok: number; 
        warning: number; 
        expired: number 
    };

    onOpenOK: () => void;
    onOpenWarning: () => void;
    onOpenExpired: () => void;
};

export function TLSLog({ stats, onOpenOK, onOpenWarning, onOpenExpired } : Props) {

    return (
        <div style={cardStyle}>

            <div style={headerStyle}>
                <h4 style={{ margin: 0 }}><b>
                    TLS Certificate Log
                </b></h4>
            </div>
            
            <div style={gridStyle}>
                {/* future log entries */}

                <div 
                    role="button"
                    style={itemStyle}
                    onClick={onOpenOK}
                    title="Open OK report log"
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenOK}
                >
                    <img src="/check.svg" width={24} height={24} />
                    <p style={{ margin: 5 }}>{stats.ok}</p>
                    {/* instead of number, function to grab total number */}
                </div>

                <div
                    role="button"
                    style={itemStyle}
                    onClick={onOpenWarning}
                    title="Open OK report log"
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenWarning}
                >
                    <img src="/warning.svg" width={24} height={24} />
                    <p style={{ margin: 5 }}>{stats.warning}</p>
                </div>

                <div
                    role="button"
                    style={itemStyle}
                    onClick={onOpenExpired}
                    title="Open OK report log"
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenExpired}
                >
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
    background: "#fff",
    cursor: "pointer",
    userSelect: "none",
}