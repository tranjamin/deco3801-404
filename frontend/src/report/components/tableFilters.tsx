import { useEffect, useRef, useState } from "react";

type Filters = {
    status: string[];
    protocol: string[];
}

type Props = {
    sortBy: string;
    filters: Filters;
    searchQuery: string;
    setSortBy: (value: string) => void;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    setSearchQuery: (value: string) => void;
};

// filterStatus, 
export default function TableFilters({sortBy, filters, searchQuery, setSortBy, setFilters, setSearchQuery}: Props) {

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
    const handleCheckboxChange = (category: "status" | "protocol", value: string) => {
        setFilters(prev => {
            const current = prev[category];

            const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
            
            return {...prev, [category]: next};
        });
    };

    const resetFilters = () => {
        setFilters({
            status: [],
            protocol: []
        });
    };

    return(
        <div style={containerStyle}>
            <div style={gridContainer}>
                
                {/* search */}
                <div style={searchWrapperStyle}>
                    <input 
                        type="text"
                        placeholder="Search domain or issuer"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={searchInputStyle}
                    />{searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            style={clearButtonStyle}
                            aria-label="Clear search"
                        >✕</button>
                    )}
                </div>
                

                {/* sort by */}
                <div style={{paddingTop: "4px"}} ref={sortRef}>
                    <label style={{fontSize: "16px"}}>
                        Sort By:
                        <select
                            style={{ fontSize: "16px", marginLeft: "6px" }}
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
                        <img src="/filter.svg" width={20} height={20}/>
                    </button> { showFilterMenu && (
                        <div style={popupStyle}>
                            
                            <div style={filterRowStyle}>
                                {/* protocol */}
                                <div style={filterColumnStyle}>
                                    <strong>Protocol</strong>
                                    {["TLS 1.1", "TLS 1.2", "TLS 1.3", "TLS 1.4"].map((protocol) => (
                                        <label key={protocol} style={checkboxLabelStyle}>
                                            <input 
                                                type="checkbox"
                                                style={{ transform: "scale(1.4)", marginRight: "6px" }}
                                                checked={filters.protocol.includes(protocol)}
                                                onChange={() => handleCheckboxChange("protocol", protocol)}
                                            /><span style={{textTransform: "capitalize"}}>{protocol}</span>

                                        </label>
                                    ))}
                                </div>
                                
                                <div style={dividerStyle}/>

                                {/* status */}
                                <div style={filterColumnStyle}>
                                    <strong>Status</strong>
                                    {["ok", "warning", "expired"].map((status) => (
                                        <label key={status} style={checkboxLabelStyle}>
                                            <input
                                                type="checkbox"
                                                style={{ transform: "scale(1.4)", marginRight: "6px" }}
                                                checked={filters.status.includes(status)}
                                                onChange={() => handleCheckboxChange("status", status)}
                                            /><span style={{textTransform: "capitalize"}}>{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {(filters.status.length > 0 || filters.protocol.length > 0) && (
                                <button
                                    onClick={resetFilters}
                                    title="Reset all filters to default"
                                    style={resetButtonStyle}
                                >Reset Filters</button>
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
    gap: "16px"
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
    fontSize: "16px"
};


const filterRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
};


const filterColumnStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minWidth: "80px",
};


const dividerStyle: React.CSSProperties = {
    width: "1px",
    backgroundColor: "#d8d8d8",
    margin: "0 4px"
};


const checkboxLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px"
}


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


const searchWrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
};


const searchInputStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #b4b4b4",
    width: "200px",
    fontSize: "14px"
};


const clearButtonStyle: React.CSSProperties = {
    position: "absolute",
    right: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    color: "#757575",
    padding: 0,
    lineHeight: 1
};