/// <reference types="chrome" />
import { useEffect, useState } from "react";
import { CurrentSiteSummary } from "./components/currentSiteSummary";
import { TLSLog } from "./components/TLSLog";
import { ActionButtons } from "./components/actionButtons";
import type { TLSData } from "./types";
import {
    getStoredAccessToken,
    setStoredAccessToken,
    setStoredUser,
    clearAuthState,
    type AuthUser,
} from "../api/authStorage";

const API_BASE_URL = "https://deco3801-404-dev.onrender.com";
// const API_BASE_URL = "http://127.0.0.1:5000";

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
                const token = await getStoredAccessToken();
                if (!token) {
                    setIsAuthenticated(false);
                    setAuthUser(null);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        await clearAuthState();
                    }
                    throw new Error("Session expired or invalid");
                }

                const currentUser: AuthUser = await response.json();
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
        const reportUrl = chrome.runtime.getURL("report.html");
        chrome.tabs.create({ url: reportUrl });
    }

    const handleOpenPolicies = () => {
        const policiesUrl = chrome.runtime.getURL("policies.html");
        chrome.tabs.create({ url: policiesUrl });
    }

    const handleOpenSettings = () => {
        const settingsUrl = chrome.runtime.getURL("settings.html");
        chrome.tabs.create({ url: settingsUrl });
    };

    const resetAuthForm = () => {
        setUsername("");
        setPassword("");
    };

    const handleAuthSubmit = async () => {
        setAuthError(null);
        try {
            const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || responseData.message || "Authentication failed");
            }

            await Promise.all([
                setStoredAccessToken(responseData.accessToken),
                setStoredUser(responseData.user)
            ]);

            setAuthUser(responseData.user);
            setIsAuthenticated(true);
            resetAuthForm();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not authenticate";
            setAuthError(message);
        }
    };

    const handleLogout = async () => {
        await clearAuthState();
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
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12}}>
                <CurrentSiteSummary data={data} />
                <TLSLog />
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