/// <reference types="chrome" />

type Props = {
    active: "report" | "settings" | "policies";
};

export default function Navbar({ active }: Props) {

    // function that navigates based on which header is clicked
    const navigate = (page: string) => {
        chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
            const tabId = tabs[0].id;
            if (tabId) {
                chrome.tabs.update(tabId, {
                    url: chrome.runtime.getURL(page)
                });
            }
        });
    }

    // style settings for items (headers)
    const items = (name: string) => ({
        padding: "24px",
        cursor: "pointer",
        background: active === name ? "#b6b6b6" : "transparent",
        fontSize: "16px"
    })

    // sidebar user interface
    return (
        <div style={navBarStyle}>
            <h3 style={{ padding: "20px", fontSize: "14px" }}>TLS Certificate Checker</h3>

            <div 
                style={items("report")} 
                onClick={() => navigate("report.html")}
                onMouseEnter={(e) => {
                    if (active !== "report") e.currentTarget.style.background = "#c5c5c5";
                }}
                onMouseLeave={(e) => {
                    if (active !== "report") e.currentTarget.style.background = "transparent";
                }}
            >
                Reports
            </div>

            <div 
                style={items("policies")} 
                onClick={() => navigate("policies.html")}
                onMouseEnter={(e) => {
                    if (active !== "policies") e.currentTarget.style.background = "#c5c5c5";
                }}
                onMouseLeave={(e) => {
                    if (active !== "policies") e.currentTarget.style.background = "transparent";
                }}
            >
                Policies
            </div>

            <div 
                style={items("settings")} 
                onClick={() => navigate("settings.html")}
                onMouseEnter={(e) => {
                    if (active !== "settings") e.currentTarget.style.background = "#c5c5c5";
                }}
                onMouseLeave={(e) => {
                    if (active !== "settings") e.currentTarget.style.background = "transparent";
                }}
            >
                Settings
            </div>

            <div style={versionStyle}>
                Version 1.0a
            </div>
        </div>
    );
}


const navBarStyle: React.CSSProperties = {
    width: 220,
    height: "100vh",
    background: "#ffffff",
    color: "#000000",
    position: "fixed",
    top: 0,
    left: 0,
    boxShadow: "2px 0 10px rgba(0, 0, 0, 0.6)",
    zIndex: 1000
};


const versionStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    padding: "6px",
    alignContent: "center"
};
