import { useEffect, useRef, useState } from "react";

type Props = {
    sortBy: string;
    filterStatus: string[];
    setSortBy: (value: string) => void;
    setFilterStatus: React.Dispatch<React.SetStateAction<string[]>>;
};

// filterStatus, 
export default function TableFilters({sortBy, filterStatus, setSortBy, setFilterStatus}: Props) {

    // handles back to default screen when clicked outside the popup/dropdown
    const sortRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if ( filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilterMenu(false);
            }
        } // function handle for clicking outside the popup. in this case, if filter menu is open and clicked outside, the menu is closed.

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // handles checkbox for filters
    const allStatus = ["ok", "warning", "expired"]
    const handleCheckboxChange = (status: string) => {
        setFilterStatus((prev) => {
            let next;
            if (prev.includes(status)) {
                next = prev.filter((s) => s !== status); // removes from array if exists
            } else {
                next = [...prev, status]; // adds to array if doesnt exist
            }

            return next;
        });
    };

    const resetFilters = () => {
        setFilterStatus(allStatus);
    };

    return(
        <div style={containerStyle}>
            <div style={gridContainer}>
                {/* sort by */}
                <div ref={sortRef}>
                    <label>
                        Sort By:
                        <select
                            style={{ marginLeft: "6px" }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <optgroup label="Default Sort">
                                <option value="default">Default</option>
                            </optgroup>

                            <optgroup label="Domain">
                                <option value="domainAsc">Domain Name (A-Z)</option>
                                <option value="domainDesc">Domain Name (Z-A)</option>
                            </optgroup>
                            
                            <optgroup label="Issuer">
                                <option value="issuerAsc">Issuer (A-Z)</option>
                                <option value="issuerDesc">Issuer (Z-A)</option>
                            </optgroup>
                            
                            <optgroup label="Date">
                                <option value="expiryAsc">Expiry Date (Old-New)</option>
                                <option value="expiryDesc">Expiry Date (New-Old)</option>
                            </optgroup>
                        </select>
                    </label>
                </div>
                

                {/* filter */}
                <div ref={filterRef}>
                    <button 
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        title="Filter table"
                    >
                        <img src="/filter.svg" width={16} height={16}/>
                    </button> { showFilterMenu && (
                        <div style={popupStyle}>
                            {["ok", "warning", "expired"].map((status) => (
                                <label key={status} style={{ display: "block" }}>
                                    <input
                                        type="checkbox"
                                        checked={filterStatus.includes(status)}
                                        onChange={() => handleCheckboxChange(status)}
                                    /><span style={{textTransform: "capitalize"}}>{status}</span>
                                </label>
                            ))}

                            {filterStatus.length !== 3 && (
                                <button
                                    onClick={resetFilters}
                                    title="Reset all filters to default"
                                    style={resetButtonStyle}
                                > Reset Filters</button>
                            )}
                        </div>
                    )}                  
                </div>
            </div>       
        </div>
    );
}


const containerStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "10px",
    overflowX: "visible", // Enable horizontal scroll
    position: "relative"
};


const gridContainer: React.CSSProperties = {
    display: "flex",
    gap: "8px"
}


const popupStyle: React.CSSProperties = {
    position: "absolute",
    background: "white",
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    zIndex: 100,
    marginTop: "5px",
};


const resetButtonStyle: React.CSSProperties = {
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #eee",
    width: "100%",
    background: "none",
    borderLeft: "none",
    borderRight: "none",
    borderBottom: "none",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "12px",
    textAlign: "center"
}
