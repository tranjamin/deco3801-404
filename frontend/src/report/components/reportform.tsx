
export default function GenerateReport() {

    return(
        <div style={containerStyle}>
            test
            <p>The report content generation things will go here</p>
            <p>This should include:</p>
            <p> (1) Report Log containing all previously visited domains </p>
            <p> (2) Colour-coded visual summary i.e. Red for errors, Yellow for warnings, Green for correct </p>
            <p> (3) Filters for sorting and searching as well as report generation </p>
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