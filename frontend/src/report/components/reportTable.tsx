/// <reference types="chrome" />
import React from "react";
import type { TLSCertificateTransformed } from "../../sharedComponent/types";


type Props = {
  data: TLSCertificateTransformed[];
};


export default function ReportTable({ data }: Props) {
    return (
        <div style={containerStyle}>
            {/* reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table */}
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={headerCellStyle}>Domain</th>
                        <th style={headerCellStyle}>Issuer</th>
                        <th style={headerCellStyle}>Protocol</th>
                        <th style={headerCellStyle}>Days Remaining</th>
                        <th style={headerCellStyle}>Cipher</th>
                        <th style={headerCellStyle}>Valid From</th>
                        <th style={headerCellStyle}>Valid To</th>
                        <th style={headerCellStyle}>Violations to Resolve</th>
                    </tr>
                </thead>
                <tbody>
                    {/* if the # of certs is more than 0, display. otherwise show no matching certificates to users */}
                    {data.length > 0 ? (
                        data.map(cert => {
                            let rowStyle: React.CSSProperties = {};

                            if (cert.status === "expired") {
                                rowStyle = { backgroundColor: "#ff4c4cda"};
                            } else if (cert.status === "warning") {
                                rowStyle = { backgroundColor: "#ffd231" };
                            } else {
                                rowStyle = { backgroundColor: "#83ff8d"}
                            }

                            return (
                                <tr key={cert.id} style={rowStyle}>
                                    <td style={domainCellStyle}>{cert.subjectName}</td>
                                    <td style={issuerCellStyle}>{cert.issuer}</td>
                                    <td style={protocolCellStyle}>{cert.protocol}</td>
                                    <td style={statusCellStyle}>
                                        {cert.status === "expired" ? "Expired" : `${cert.daysRemaining} days`}
                                    </td>
                                    <td style={cipherCellStyle}>{cert.cipher}</td>
                                    <td style={dateCellStyle}>{cert.validFrom}</td>
                                    <td style={dateCellStyle}>{cert.validTo}</td>
                                    <td style={descCellStyle}>{cert.desc}</td>
                                </tr>
                            );
                        })
                    ) : ( 
                        <tr>
                            <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "#685c5c"}}>
                                No certificates match the selected filters
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

    );
};


const containerStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "10px",
    overflowX: "auto", // Enable horizontal scroll
    overflowY: "auto", // Enables vertical scroll
    height: "450px",
};


const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #ccc",
};


const cellStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "8px",
};


const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    position: "sticky", // reference: https://www.w3schools.com/css/css_positioning_sticky.asp
    top: "-11px",
    backgroundColor: "#ffffff",
    zIndex: 10,
    fontWeight: "bold",
    borderTop: "1px solid #ccc",
    borderBottom: "2px solid #ccc",
    borderLeft: "1px solid #ccc",
    borderRight: "1px solid #ccc",
};


const domainCellStyle: React.CSSProperties = {
    ...cellStyle,
    minWidth: "120px",
    maxWidth: "120px",
};


const issuerCellStyle: React.CSSProperties = {
    ...cellStyle,
    minWidth: "300px",
    maxWidth: "300px",
};


const protocolCellStyle: React.CSSProperties = {
    ...cellStyle,
    minWidth: "80px",
    maxWidth: "80px",
};


const statusCellStyle: React.CSSProperties = {
    ...cellStyle,
    minWidth: "120px",
    maxWidth: "120px",
};


const cipherCellStyle: React.CSSProperties = {
    ...cellStyle,
    minWidth: "200px",
    maxWidth: "200px",
};


const dateCellStyle: React.CSSProperties = {
    ...cellStyle,
    minWidth: "80px",
    maxWidth: "80px",
};


const descCellStyle: React.CSSProperties = {
    ...cellStyle,
    minWidth: "220px",
    maxWidth: "220px",
};