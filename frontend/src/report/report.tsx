/// <reference types="chrome" />
import React, { useState } from "react";
import Navbar from "../sharedComponent/navbar";
import ReportTable from "./components/reportTable";
import TableFilters from "./components/tableFilters";
import GenerateReport from "./components/reportForm";
import { filterCertificates, searchCertificates, sortCertificates } from "./utils/tableUtils";
import type { TLSCertificate } from "../sharedComponent/types";
import { transformCertificates } from "../sharedComponent/utils"
import { mockTLSData } from "../sharedComponent/mockData";

export default function Report() {

    const [sidebarOpen] = useState(true); // open/close navbar thing
    const sidebarWidth = sidebarOpen ? 220 : 0;


    const [data] = useState<TLSCertificate[]>(mockTLSData); // mock data for visual testing

    // sorting, filtering, searching
    const [sortBy, setSortBy] = useState("default");
    const [filters, setFilters] = useState({
        status: [] as string[],
        protocol: [] as string[],
    });
    const [searchQuery, setSearchQuery] = useState("");

    const transformedData = transformCertificates(data); // add days remaining and "status" to the data structure

    // search -> filter -> sort
    const searchedData = searchCertificates(transformedData, searchQuery);
    const filteredData = filterCertificates(searchedData, filters);
    const sortedData = sortCertificates(filteredData, sortBy);
    

    return (
        <div>
            {/* sidebar navigation */}
            <div>
                <Navbar active="report" />
            </div>
            
            
            {/* Report content */}
            <div style={{marginLeft: sidebarWidth}}>
                <div style={page}>
                    <h2 style={heading}>
                        Report
                    </h2>


                    <h4 style={subheading}>
                        TLS Certificate Log
                    </h4>

                    {/* table filters here */}
                    <TableFilters 
                        sortBy={sortBy}
                        filters={filters}
                        searchQuery={searchQuery}
                        setSortBy={setSortBy}
                        setFilters={setFilters}
                        setSearchQuery={setSearchQuery}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap:"10px" }}>
                        <ReportTable data={sortedData} />
                        <GenerateReport />
                    </div>
                </div>
            </div>
        </div>
        
    );

}


const page: React.CSSProperties = {
//   minHeight: "100vh", //can get rid of later if find way to stop the jank
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
