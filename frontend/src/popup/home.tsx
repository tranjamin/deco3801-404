/// <reference types="chrome" />
// import { useState } from "react";
import { CurrentSiteSummary } from "./components/currentSiteSummary";
import { TLSLog } from "./components/TLSLog";
import { ActionButtons } from "./components/actionButtons";
import {
  countStatus,
  transformCertificates,
  transformSingleCert,
} from "../sharedComponent/utils";
import { mockTLSData } from "../sharedComponent/mockData";
import { getCurrentCertificateData } from "../api/storage";
import type {
  TLSCertificateTransformed,
} from "../sharedComponent/types";
import React, { useEffect, useState } from "react";

export default function Home() {
  // temporary data current site
  //const data = mockTLSData[3]
  const [transformedData, setTransformedData] =
    useState<TLSCertificateTransformed>();
  const [stats, setStats] = useState<{
    ok: number;
    warning: number;
    expired: number;
  }>({
    ok: 0,
    warning: 0,
    expired: 0,
  });
  const fetchAll = async () => {
    const tempData = await getCurrentCertificateData();
    console.log("got here");
    console.log(tempData);
    if (tempData) {
      setTransformedData(transformSingleCert(JSON.parse(tempData)));
      const allDataTransformed = transformCertificates(mockTLSData);
      setStats(countStatus(allDataTransformed));
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);
  //const data = await getCurrentCertificateData();
  //const transformedData = transformSingleCert(data);

  // temporary log data

  const handleOpenReport = () => {
    // finds the report.html file in root dir
    const reportUrl = chrome.runtime.getURL("report.html");

    // opens new tab of report.html
    chrome.tabs.create({ url: reportUrl });
  };

  const handleOpenPolicies = () => {
    const policiesUrl = chrome.runtime.getURL("policies.html");
    chrome.tabs.create({ url: policiesUrl });
  };

  const handleOpenSettings = () => {
    const settingsUrl = chrome.runtime.getURL("settings.html");
    chrome.tabs.create({ url: settingsUrl });
  };

  return (
    <div style={homeContainer}>
      <div style={headerStyle}>
        <h3>
          <u>TLS Certificate Checker</u>
        </h3>
      </div>

      {/* layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* current domain summary view */}
        {transformedData ? (
          <CurrentSiteSummary data={transformedData} />
        ) : (
          <p>Loading certificate...</p>
        )}

        {/* TLS certificate log section */}
        <TLSLog stats={stats} />

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

// frame around the home
const homeContainer: React.CSSProperties = {
  width: "300px",
  height: "auto",
  backgroundColor: "#ffffff", // Your actual UI background
  border: "2px solid #3367d6", // A professional blue frame (Chrome's signature blue)
  borderRadius: "8px", // Rounded corners for the frame
  padding: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)", // Extra depth
  margin: "1px", // Prevents the border from clipping against the browser edge
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 10,
};
