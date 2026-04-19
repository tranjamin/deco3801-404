/// <reference types="chrome" />
import { useEffect, useState } from "react";
import { CurrentSiteSummary } from "./components/currentSiteSummary";
import { TLSLog } from "./components/TLSLog";
import { ActionButtons } from "./components/actionButtons";
import type { TLSData } from "./types";
import {
    getAuthState,
    login,
    logout,
    me,
    register as registerUser,
    type AuthUser,
} from "../api/middleend";


export default function Popup() {
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // temporary data
    const [data] = useState<TLSData>({
        domain: "example.com",
        issuer: "example issuer",
        validDate: "1719878400000",
        protocol: "TLS example",
        daysRemaining: 120
    });

    useEffect(() => {
        const loadAuth = async () => {
            setAuthError(null);
            try {
                const state = await getAuthState();
                if (!state.isAuthenticated) {
                    setIsAuthenticated(false);
                    setAuthUser(null);
                    return;
                }
                const currentUser = await me();
                setAuthUser(currentUser);
                setIsAuthenticated(true);
            } catch {
                setIsAuthenticated(false);
                setAuthUser(null);
            }
        };
        void loadAuth();
    }, []);


    const handleOpenReport = () => {
        // finds the report.html file in root dir
        const reportUrl = chrome.runtime.getURL("report.html");

        // opens new tab of report.html
        chrome.tabs.create({ url:reportUrl });
    }

    const handleOpenPolicies = () => {
        const policiesUrl = chrome.runtime.getURL("policies.html");
        chrome.tabs.create({ url:policiesUrl });
    }

    const handleOpenSettings = () => {
        const settingsUrl = chrome.runtime.getURL("settings.html");
        chrome.tabs.create({ url:settingsUrl });
    };

    const resetAuthForm = () => {
        setUsername("");
        setPassword("");
    };

    const handleAuthSubmit = async () => {
        setAuthError(null);
        try {
            if (authMode === "login") {
                const response = await login(username, password);
                setAuthUser(response.user);
                setIsAuthenticated(true);
            } else {
                const response = await registerUser({ username, password });
                setAuthUser(response.user);
                setIsAuthenticated(true);
            }
            resetAuthForm();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not authenticate";
            setAuthError(message);
        }
    };

    const handleLogout = async () => {
        await logout();
        setIsAuthenticated(false);
        setAuthUser(null);
        setAuthMode("login");
        resetAuthForm();
    };



    if (!isAuthenticated) {
        return (
            <div style={rootStyle}>
                <div style={headerStyle}>
                    <h3><u>TLS Certificate Checker</u></h3>
                </div>
                <h4>Sign in to continue</h4>
                <p>
                    <button
                        onClick={() => {
                            setAuthMode("login");
                            setAuthError(null);
                        }}
                        type="button"
                        disabled={authMode === "login"}
                    >
                        Login
                    </button>{" "}
                    <button
                        onClick={() => {
                            setAuthMode("register");
                            setAuthError(null);
                        }}
                        type="button"
                        disabled={authMode === "register"}
                    >
                        Register
                    </button>
                </p>
                <label>Username</label>
                <br />
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                />
                <br />
                <label>Password</label>
                <br />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                />
                <br />
                {authError ? <p>{authError}</p> : null}
                <button
                    onClick={() => void handleAuthSubmit()}
                    type="button"
                >
                    {authMode === "login" ? "Login" : "Create account"}
                </button>
            </div>
        );
    }

    return (
        <div style={rootStyle}>
            
            <div style={headerStyle}>
                <h3><u>TLS Certificate Checker</u></h3>
            </div>

            <p>
                Signed in as <b>{authUser?.username || "user"}</b>{" "}
                <button type="button" onClick={() => void handleLogout()}>Log out</button>
            </p>
            
            {/* layout */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12}}>
                {/* current domain summary view */}
                <CurrentSiteSummary data={data} />
        
                {/* TLS certificate log section */}
                <TLSLog />

                {/* buttons */}
                <ActionButtons 
                    onOpenReport={handleOpenReport}
                    onOpenPolicies={handleOpenPolicies}
                    onOpenSettings={handleOpenSettings}
                />
            </div>            
        </div>
    );
}

const rootStyle: React.CSSProperties = {
    width: 320,
    padding: 12,
};

const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10
};