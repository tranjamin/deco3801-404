/// <reference types="chrome" />
import React from "react";
import type { TLSCertificateTransformed } from "../../sharedComponent/types";


type Props = {
  data: TLSCertificateTransformed[];
};


export default function ReportTable({ data }: Props) {
    return (
        <div style={containerStyle}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={headerCellStyle}>ID</th>
                        <th style={headerCellStyle}>Domain</th>
                        <th style={headerCellStyle}>Issuer</th>
                        <th style={headerCellStyle}>Protocol</th>
                        <th style={headerCellStyle}>Days Remaining</th>
                        <th style={headerCellStyle}>Cipher</th>
                        <th style={headerCellStyle}>Valid From</th>
                        <th style={headerCellStyle}>Valid To</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(cert => {

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
                                <td style={cellStyle}>{cert.id}</td>
                                <td style={cellStyle}>{cert.subjectName}</td>
                                <td style={cellStyle}>{cert.issuer}</td>
                                <td style={cellStyle}>{cert.protocol}</td>
                                <td style={cellStyle}>
                                    {cert.status === "expired" ? "Expired" : `${cert.daysRemaining} days`}
                                </td>
                                <td style={cellStyle}>{cert.cipher}</td>
                                <td style={cellStyle}>{cert.validFrom}</td>
                                <td style={cellStyle}>{cert.validTo}</td>
                            </tr>
                        );
                    })}
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
    maxHeight: "500px", // Set preferred limit here
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
    position: "sticky",
    top: "-11px",
    backgroundColor: "#ffffff",
    zIndex: 10,
    fontWeight: "bold",
    borderTop: "1px solid #ccc",
    borderBottom: "2px solid #ccc",
    borderLeft: "1px solid #ccc",
    borderRight: "1px solid #ccc",
};