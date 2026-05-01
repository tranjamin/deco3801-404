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
                        <th style={headerCellStyle}>Domain</th>
                        <th style={headerCellStyle}>Issuer</th>
                        <th style={headerCellStyle}>Protocol</th>
                        <th style={headerCellStyle}>Days Remaining</th>
                        <th style={headerCellStyle}>Cipher</th>
                        <th style={headerCellStyle}>Valid From</th>
                        <th style={headerCellStyle}>Valid To</th>
                        <th style={headerCellStyle}>Description</th>
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

                            // insert if statement for red background due to incorrect policies (mismatching policies)

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
                                    <td style={cellStyle}>{cert.desc}</td>
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
    height: "450px", // Set preferred limit here
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


const domainCellStyle: React.CSSProperties = {
    ...cellStyle,
    width: "120px"
};


const issuerCellStyle: React.CSSProperties = {
    ...cellStyle,
    width: "300px",
};


const protocolCellStyle: React.CSSProperties = {
    ...cellStyle,
};


const statusCellStyle: React.CSSProperties = {
    ...cellStyle,
    width: "120px",
};


const cipherCellStyle: React.CSSProperties = {
    ...cellStyle,
    width: "240px",
};


const dateCellStyle: React.CSSProperties = {
    ...cellStyle,
    width: "80px",
};