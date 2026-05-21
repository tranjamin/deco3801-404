type Props = {
    onOpenReport: () => void;
    onOpenPolicies: () => void;
    onOpenSettings: () => void;
    onLogout: () => void;
}

export function ActionButtons({
    onOpenReport, onOpenPolicies, onOpenSettings, onLogout
}: Props) {

    return(
        <div style={buttonContainer}>
            <div style={leftButtonsStyle}>
                {/* report button */}
                <div
                    role="button"
                    style={buttonStyle}
                    onClick={onOpenReport}
                    title="Open report log"
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenReport}
                >
                    <img src="/view-details.svg" width={24} height={24} />
                </div>

                {/* policies button */}
                <div
                    role="button"
                    style={buttonStyle}
                    onClick={onOpenPolicies}
                    title="Open policies page"
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenPolicies}
                >
                    <img src="/policies.svg" width={24} height={24} />
                </div>

                {/* settings button */}
                <div
                    role="button"
                    style={buttonStyle}
                    onClick={onOpenSettings}
                    title="Open settings page"
                    onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenSettings}
                >
                    <img src="/settings.svg" width={24} height={24} />
                </div>
            </div>

            {/* logout button */}
            <div
                role="button"
                style={buttonStyle}
                onClick={onLogout}
                title="Log out of the account"
                onMouseOver={(e) => (e.currentTarget.style.background = "#e2e6ea")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                onKeyDown={(e) => e.key === 'Enter' && onLogout}
            >
                <img src="/logout.svg" width={24} height={24} />
            </div>
        </div>
    );
}


// Shared style to keep buttons consistent
const buttonContainer: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 8,
    boxSizing: "border-box",
};

const leftButtonsStyle: React.CSSProperties = {
    display: "flex",
    gap: "4px",
    alignItems: "center",
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
    fontSize: "11px",
    fontWeight: "500",
    color: "#24292f",
    transition: "background 0.2s"
};