/// <reference types="chrome" />
import React, { useState } from "react";
import Navbar from "../sharedComponent/navbar";
import ReportTable from "./components/reportTable";
import type { TLSCertificate } from "../sharedComponent/types";
import { transformCertificates } from "../sharedComponent/utils"
import { mockTLSData } from "../sharedComponent/mockData";

export default function Report() {

    const [sidebarOpen] = useState(true);
    const sidebarWidth = sidebarOpen ? 220 : 0;

    const [data] = useState<TLSCertificate[]>(mockTLSData);
    const transformedData = transformCertificates(data);


    return (
        <div>
            {/* sidebar navigation */}
            <div>
                <Navbar active="report" />
            </div>
            
            
            {/* Report content */}
            <div style={{ marginLeft: sidebarWidth }}>
                <div style={page}>
                    <h2 style={heading}>
                        Report
                    </h2>


                    <h4 style={subheading}>
                        TLS Certificate Log
                    </h4>
                    <ReportTable data={transformedData} />

                    
                    <p>The report content generation things will go here</p>
                    <p>This should include:</p>
                    <p> (1) Report Log containing all previously visited domains </p>
                    <p> (2) Colour-coded visual summary i.e. Red for errors, Yellow for warnings, Green for correct </p>
                    <p> (3) Filters for sorting and searching as well as report generation </p>
                </div>
            </div>

        </div>
        
    );

}


const page: React.CSSProperties = {
  minHeight: "100vh", //can get rid of later if find way to stop the jank
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
//  flex: 1,
  textAlign: "left",
};
