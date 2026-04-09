/// <reference types="chrome" />
import { useState } from "react";

export default function Popup() {
    const [data] = useState({
        domain: "example.com",
        issuer: "Let's Encrypt",
        protocol: "TLS 1.3",
        daysRemaining: 120
    });

    const getStatusColor = () => {
        // checks for current domain days remaining of tls
        if (data.daysRemaining < 3) return "red";
        if (data.daysRemaining < 15) return "orange";
        return "green";
    };

    const handleOpenReport = () => {
        // finds the report.html file in root dir
        const reportUrl = chrome.runtime.getURL("report.html");

        // opens new tab of report.html
        chrome.tabs.create({ url:reportUrl });
    }

    const handleOpenSettings = () => {
        const settingsUrl = chrome.runtime.getURL("settings.html");
        chrome.tabs.create({ url:settingsUrl });
    }

    return (
        <div style={{ width: 300, padding: 12, position: "relative", minHeight: "200px"}}>
            <h3>TLS Certificate Checker</h3>
            {/* summary view */}
            <p><b>{data.domain}</b></p>
            <p>Issuer: {data.issuer}</p>
            <p>Protocol: {data.protocol}</p>

            {/* days remaining */}
            <div style={{
                marginTop: 10,
                padding: 10,
                background: getStatusColor(),
                color: "white",
                borderRadius: 6
            }}>
                {data.daysRemaining} days remaining
            </div>

            
            {/* buttons container */}
            <div style={{
                position: "absolute",
                bottom: "2px",
                left: "12px",
                display: "flex", // flexbox to align buttons
                gap: "8px",
                alignItems: "center"
            }}>
                {/* report button */}
                <div
                    onClick={handleOpenReport}
                    role="button"
                    style={buttonStyle}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenReport()}
                >
                    <img
                        src="/view-details.svg"
                        alt="report"
                        style={{ width: "24px", height: "24px" }}
                    />
                </div>

                {/* settings button */}
                <div
                    onClick={handleOpenSettings}
                    role="button"
                    style={buttonStyle}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenSettings()}
                >
                    <img
                        src="/settings.svg"
                        alt=""
                        style={{ width: "24px", height: "24px" }}
                    />
                </div>
            </div>
        </div>
    );
}


// Shared style to keep buttons consistent
const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 6px",
    background: "#ffffff",
    border: "1px solid #d1d9e0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "500",
    color: "#24292f",
    transition: "background 0.2s"
};