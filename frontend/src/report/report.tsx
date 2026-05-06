/// <reference types="chrome" />
import React, { useEffect, useState } from "react";
import { getStoredAccessToken } from "../api/storage";
import Navbar from "../sharedComponent/navbar";
import ReportTable from "./components/reportTable";
import TableFilters from "./components/tableFilters";
import GenerateReport from "./components/reportform";
import {
  filterCertificates,
  searchCertificates,
  sortCertificates,
} from "./utils/tableUtils";
import type { TLSCertificateTransformed } from "../sharedComponent/types";

const BACKEND_BASE_URL = "http://localhost:5000";
const REPORT_VISITS_ENDPOINT = `${BACKEND_BASE_URL}/api/reports/visits`;

type BackendVisit = {
  id: number;
  domain: string;
  visited_at: number;
  certificate_id: number | null;
  protocol: string | null;
  cipher: string | null;
  issuer: string | null;
  subject_name: string | null;
  valid_from: number | null;
  valid_to: number | null;
  evaluation_passed: boolean;
  issues_found: string[];
  days_until_expiry: number | null;
};

type VisitsResponse = {
  visits: BackendVisit[];
};

function formatTimestamp(seconds: number | null): string {
  if (seconds === null) return "";
  return new Intl.DateTimeFormat("en-CA").format(new Date(seconds * 1000));
}

function mapVisitToTableRow(visit: BackendVisit): TLSCertificateTransformed {
  const isExpired =
    visit.issues_found.includes("expired") ||
    (visit.days_until_expiry !== null && visit.days_until_expiry <= 0);

  const status: TLSCertificateTransformed["status"] = isExpired
    ? "expired"
    : visit.evaluation_passed
      ? "ok"
      : "warning";

  const daysRemaining =
    visit.days_until_expiry !== null
      ? Math.ceil(visit.days_until_expiry)
      : visit.valid_to !== null
        ? Math.ceil((visit.valid_to * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

  const desc =
    visit.issues_found.length > 0
      ? visit.issues_found.join(", ")
      : visit.evaluation_passed
        ? "Everything is currently fine"
        : "Visit has policy or certificate issues";

  return {
    id: String(visit.id),
    protocol: visit.protocol ?? "Unknown",
    cipher: visit.cipher ?? "Unknown",
    subjectName: visit.domain || visit.subject_name || "Unknown domain",
    sanList: [],
    issuer: visit.issuer ?? "Unknown",
    validFrom: formatTimestamp(visit.valid_from),
    validTo: formatTimestamp(visit.valid_to),
    daysRemaining,
    status,
    desc,
  };
}

export default function Report() {
  const [sidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? 220 : 0;

  const [data, setData] = useState<TLSCertificateTransformed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortBy, setSortBy] = useState("default");
  const [filters, setFilters] = useState({
    status: [] as string[],
    protocol: [] as string[],
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchReportVisits = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = await getStoredAccessToken();

        if (!accessToken) {
          setError("Sign in to view report history.");
          setData([]);
          return;
        }

        const response = await fetch(REPORT_VISITS_ENDPOINT, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load reports (${response.status})`);
        }

        const result = (await response.json()) as VisitsResponse;
        setData(result.visits.map(mapVisitToTableRow));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportVisits();
  }, []);

  const searchedData = searchCertificates(data, searchQuery);
  const filteredData = filterCertificates(searchedData, filters);
  const sortedData = sortCertificates(filteredData, sortBy);

  return (
    <div>
      <div>
        <Navbar active="report" />
      </div>

      <div style={{ marginLeft: sidebarWidth }}>
        <div style={page}>
          <h2 style={heading}>Report</h2>

          <h4 style={subheading}>TLS Certificate Log</h4>

          <TableFilters
            sortBy={sortBy}
            filters={filters}
            searchQuery={searchQuery}
            setSortBy={setSortBy}
            setFilters={setFilters}
            setSearchQuery={setSearchQuery}
          />

          {loading && <p>Loading report history...</p>}
          {error && <p style={errorStyle}>{error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <ReportTable data={sortedData} />
            <GenerateReport />
          </div>
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = {
  background: "#ffffff",
  paddingLeft: "24px",
  paddingRight: "24px",
};

const heading: React.CSSProperties = {
  marginTop: 0,
  borderBottom: "2px solid #000000",
  textAlign: "center",
};

const subheading: React.CSSProperties = {
  marginTop: 0,
  fontStyle: "italic bold",
  textDecoration: "underline",
  fontSize: 20,
  textAlign: "left",
};

const errorStyle: React.CSSProperties = {
  color: "#b42318",
  fontWeight: 700,
};
