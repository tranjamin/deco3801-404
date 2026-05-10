import type { TLSCertificateTransformed } from "../../sharedComponent/types";

type Props = {
  data: TLSCertificateTransformed[];
};

const CSV_COLUMNS: Array<{
  header: string;
  value: (row: TLSCertificateTransformed) => string | number;
}> = [
  { header: "Domain", value: (row) => row.subjectName },
  { header: "Issuer", value: (row) => row.issuer },
  { header: "Protocol", value: (row) => row.protocol },
  { header: "Days Remaining", value: (row) => row.daysRemaining },
  { header: "Cipher", value: (row) => row.cipher },
  { header: "Valid From", value: (row) => row.validFrom },
  { header: "Valid To", value: (row) => row.validTo },
  { header: "Status", value: (row) => row.status },
  { header: "Description", value: (row) => row.desc },
];

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function createCsv(data: TLSCertificateTransformed[]): string {
  const headers = CSV_COLUMNS.map((column) => escapeCsvValue(column.header));
  const rows = data.map((row) =>
    CSV_COLUMNS.map((column) => escapeCsvValue(column.value(row))).join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getReportFilename(): string {
  const date = new Intl.DateTimeFormat("en-CA").format(new Date());
  return `tls-report-${date}.csv`;
}

export default function GenerateReport({ data }: Props) {
  const hasData = data.length > 0;

  const handleGenerateReport = () => {
    if (!hasData) return;
    downloadCsv(getReportFilename(), createCsv(data));
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div>
          <h3 style={headingStyle}>Report Export</h3>
          <p style={summaryStyle}>
            {hasData
              ? `${data.length} row${data.length === 1 ? "" : "s"} ready to export`
              : "No report data to export"}
          </p>
        </div>

        <button
          type="button"
          style={{
            ...buttonStyle,
            opacity: hasData ? 1 : 0.55,
            cursor: hasData ? "pointer" : "not-allowed",
          }}
          onClick={handleGenerateReport}
          disabled={!hasData}
        >
          Generate CSV
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  border: "1px solid #d1d9e0",
  borderRadius: "6px",
  padding: "12px 14px",
  background: "#ffffff",
};

const contentStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
};

const summaryStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#57606a",
  fontSize: "14px",
};

const buttonStyle: React.CSSProperties = {
  minHeight: "36px",
  padding: "8px 12px",
  background: "#ffffff",
  border: "1px solid #24292f",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#24292f",
};