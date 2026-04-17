/// <reference types="chrome" />
import Navbar from "../sharedComponent/navbar";

export default function Report() {
    return (
        <div>
            {/* sidebar navigation */}
            <div>
                <Navbar active="report" />
            </div>

            {/* Report content */}
            <div style={{
                maxWidth: "800px",
                margin: "40px auto",
                padding: "20px",
                fontFamily: "sans-serif",
                border: "1px solid white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.47)"
            }}>
                <h3>Report</h3>
                <p>The report content generation things will go here</p>
                <p>This should include:</p>
                <p> (1) Report Log containing all previously visited domains </p>
                <p> (2) Colour-coded visual summary i.e. Red for errors, Yellow for warnings, Green for correct </p>
                <p> (3) Filters for sorting and searching as well as report generation </p>
            </div>
        </div>
        
    );

}