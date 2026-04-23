/// <reference types="chrome" />
// import { useState } from "react";
import { CurrentSiteSummary } from "./components/currentSiteSummary";
import { TLSLog } from "./components/TLSLog";
import { ActionButtons } from "./components/actionButtons";
import { transformSingleCert } from "../sharedComponent/utils";
import { mockTLSData } from "../sharedComponent/mockData";

export default function Popup() {

    // temporary data
    const data = mockTLSData[3]
    const transformedData = transformSingleCert(data);


    const handleOpenReport = () => {
        // finds the report.html file in root dir
        const reportUrl = chrome.runtime.getURL("report.html");

        // opens new tab of report.html
        chrome.tabs.create({ url:reportUrl });
    }

    const handleOpenPolicies = () => {
        const policiesUrl = chrome.runtime.getURL("policies.html");
        chrome.tabs.create({ url:policiesUrl });
    }

    const handleOpenSettings = () => {
        const settingsUrl = chrome.runtime.getURL("settings.html");
        chrome.tabs.create({ url:settingsUrl });
    }

    return (
        <div style={{ width: 300, padding: 12 }}>
            
            <div style={headerStyle}>
                <h3><u>TLS Certificate Checker</u></h3>
            </div>
            
            {/* layout */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12}}>
                {/* current domain summary view */}
                <CurrentSiteSummary data={transformedData} />
        
                {/* TLS certificate log section */}
                <TLSLog />

                {/* buttons */}
                <ActionButtons 
                    onOpenReport={handleOpenReport}
                    onOpenPolicies={handleOpenPolicies}
                    onOpenSettings={handleOpenSettings}
                />
            </div>            
        </div>
    );
}

const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10
};