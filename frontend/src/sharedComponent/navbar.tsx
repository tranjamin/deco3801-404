/// <reference types="chrome" />

type Props = {
    active: "report" | "settings" | "policies";
};

// reference: Chatgpt4o - used to create initial function to navigate to specific page
// prompt: how to create a function that would allow me to select a specific active page
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
    const navItemStyle = (name: string): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: "10px",

        padding: "18px 24px",
        cursor: "pointer",

        background: active === name ? "#b6b6b6" : "transparent",
        fontSize: "16px",
        fontWeight: 500,

        transition: "background 0.2s ease",
    });

    // sidebar user interface
    return (
        <div style={navBarStyle}>
            <h3 style={{ padding: "20px", fontSize: "14px" }}>TLS Certificate Checker</h3>

            <div 
                style={navItemStyle("report")} 
                onClick={() => navigate("report.html")}
                onMouseEnter={(e) => {
                    if (active !== "report") e.currentTarget.style.background = "#c5c5c5";
                }}
                onMouseLeave={(e) => {
                    if (active !== "report") e.currentTarget.style.background = "transparent";
                }}
            >
                <img src="./view-details.svg" width={24} height={24}/><span>Reports</span>
            </div>

            <div 
                style={navItemStyle("policies")} 
                onClick={() => navigate("policies.html")}
                onMouseEnter={(e) => {
                    if (active !== "policies") e.currentTarget.style.background = "#c5c5c5";
                }}
                onMouseLeave={(e) => {
                    if (active !== "policies") e.currentTarget.style.background = "transparent";
                }}
            >
                <img src="./policies.svg" width={24} height={24}/><span>Policies</span>
            </div>
            
            <div 
                style={navItemStyle("settings")} 
                onClick={() => navigate("settings.html")}
                onMouseEnter={(e) => {
                    if (active !== "settings") e.currentTarget.style.background = "#c5c5c5";
                }}
                onMouseLeave={(e) => {
                    if (active !== "settings") e.currentTarget.style.background = "transparent";
                }}
            >
                <img src="./settings.svg" width={24} height={24}/><span>Settings</span>
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
