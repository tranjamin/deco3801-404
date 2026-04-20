/// <reference types="chrome" />
import React from "react";
import type { TLSCertificateTransformed } from "../types";


type Props = {
  data: TLSCertificateTransformed[];
};


export default function ReportTable({ data }: Props) {
    return (
        <div style={containerStyle}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={cellStyle}>ID</th>
                        <th style={cellStyle}>Domain</th>
                        <th style={cellStyle}>Issuer</th>
                        <th style={cellStyle}>Protocol</th>
                        <th style={cellStyle}>Days Remaining</th>
                        <th style={cellStyle}>Cipher</th>
                        <th style={cellStyle}>Valid From</th>
                        <th style={cellStyle}>Valid To</th>
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
    overflowX: "auto",
};



const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #ccc",
}

const cellStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "8px",
};