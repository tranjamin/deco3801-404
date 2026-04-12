/// <reference types="chrome" />
import { useState } from "react";

export default function Report() {
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

    return (
        <div style={{
            maxWidth: "800px",
            margin: "40px auto",
            padding: "20px",
            fontFamily: "sans-serif",
            border: "1px solid white",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.47)"
        }}>
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

        </div>
    );

}