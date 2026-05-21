/// <reference types="chrome" />
import { useEffect, useState } from "react";
import { CurrentSiteSummary } from "./components/currentSiteSummary";
import { TLSLog } from "./components/TLSLog";
import { ActionButtons } from "./components/actionButtons";
import { transformSingleCert } from "../sharedComponent/utils";
import { clearStorage, getCurrentCertificateData } from "../api/storage";
import { getValidAccessToken } from "../api/auth";
import { BACKEND_BASE_URL } from "../base_url";
import type { TLSCertificateTransformed } from "../sharedComponent/types";

type Stats = {
  ok: number;
  warning: number;
  expired: number;
};

type BackendVisit = {
  evaluation_passed: boolean;
  issues_found: string[];
  days_until_expiry: number | null;
  valid_to: number | null;
};

type VisitsResponse = {
  visits: BackendVisit[];
};

const emptyStats: Stats = {
  ok: 0,
  warning: 0,
  expired: 0,
};

function getVisitStatus(visit: BackendVisit): keyof Stats {
  const isExpired =
    visit.issues_found.includes("expired") ||
    (visit.days_until_expiry !== null && visit.days_until_expiry <= 0) ||
    (visit.valid_to !== null && visit.valid_to * 1000 <= Date.now());

  if (isExpired) return "expired";
  if (!visit.evaluation_passed || visit.issues_found.length > 0) return "warning";
  return "ok";
}

function countVisitStatuses(visits: BackendVisit[]): Stats {
  return visits.reduce<Stats>((acc, visit) => {
    acc[getVisitStatus(visit)] += 1;
    return acc;
  }, { ...emptyStats });
}

export default function Home({ onSessionExpired }: { onSessionExpired?: () => void }) {
  const [transformedData, setTransformedData] =
    useState<TLSCertificateTransformed>();
  const [stats, setStats] = useState<Stats>(emptyStats);

  const fetchCurrentCertificate = async () => {
    const tempData = await getCurrentCertificateData();
    if (tempData) {
      setTransformedData(transformSingleCert(JSON.parse(tempData)));
    }
  };

  const fetchReportStats = async () => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      onSessionExpired?.();
      return;
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/reports/visits`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setStats(emptyStats);
        return;
      }

      const result = (await response.json()) as VisitsResponse;
      setStats(countVisitStatuses(result.visits ?? []));
    } catch (error) {
      console.error("Failed to fetch report stats:", error);
      setStats(emptyStats);
    }
  };

  useEffect(() => {
    fetchCurrentCertificate();
    fetchReportStats();
  }, []);

  const handleOpenReport = () => {
    const reportUrl = chrome.runtime.getURL("report.html");
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

  const handleLogout = async () => {
    await clearStorage();
    onSessionExpired?.();
  };

  const openReportWithStatus = (status: "ok" | "warning" | "expired") => {
    const reportUrl = chrome.runtime.getURL(`report.html?status=${status}`);
    chrome.tabs.create({ url: reportUrl });
  };

  const handleOKClick = () => openReportWithStatus("ok");
  const handleWarningClick = () => openReportWithStatus("warning");
  const handleExpiredClick = () => openReportWithStatus("expired");

  return (
    <div style={homeContainer}>
      <div style={headerStyle}>
        <h3>
          <u>TLS Certificate Checker</u>
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {transformedData ? (
          <CurrentSiteSummary data={transformedData} />
        ) : (
          <p>Waiting for a TLS certificate...</p>
        )}

        <TLSLog
          stats={stats}
          onOpenOK={handleOKClick}
          onOpenWarning={handleWarningClick}
          onOpenExpired={handleExpiredClick}
        />

        <ActionButtons
          onOpenReport={handleOpenReport}
          onOpenPolicies={handleOpenPolicies}
          onOpenSettings={handleOpenSettings}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}

const homeContainer: React.CSSProperties = {
  width: "320px",
  height: "auto",
  backgroundColor: "#ffffff",
  border: "2px solid #3367d6",
  borderRadius: "8px",
  padding: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  margin: "1px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 10,
};