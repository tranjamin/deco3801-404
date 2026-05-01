export default function GenerateReport() {

    const noop = () => {};

    return(
        <div style={containerStyle}>
            <div style={buttonContainer}>
                <div 
                    style={buttonStyle}
                    onClick={noop}
                    title="Open settings page"
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && noop}
                >
                    GENERATE REPORT (currently does nothing)
                </div>
            </div>

            <div>
                <p>The report content generation things will go here</p>
                <p>This should include:</p>
                <p> (1) Report Log containing all previously visited domains </p>
                <p> (2) Colour-coded visual summary i.e. Red for errors, Yellow for warnings, Green for correct </p>
                <p> (3) Filters for sorting and searching as well as report generation </p>
            </div>
        </div>
        
    )
}


const containerStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "10px",
    overflowX: "auto", // Enable horizontal scroll
    maxHeight: "200px",
};

const buttonContainer: React.CSSProperties = {
    display: "flex", // flexbox to align buttons
    gap: "4px",
    alignItems: "center",
    padding: 6
};


const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: 6,
    background: "#ffffff",
    border: "1px solid #d1d9e0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#24292f",
    transition: "background 0.2s"
};