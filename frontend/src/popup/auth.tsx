import { useState } from "react";
import { setStoredAccessToken } from "../api/storage"; 

export const baseUrl: string = "https://deco3801-404.onrender.com/";

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {

    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [regUsername, setRegUsername] = useState("");
    const [regPassword, setRegPassword] = useState("");
    
    const [error, setError] = useState("");

    const handleLogin = async (event: React.SubmitEvent) => {
        event.preventDefault(); 
        setError("");

        try {
            const res = await fetch(`${baseUrl}api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: loginUsername, password: loginPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            await setStoredAccessToken(data.accessToken); 
            onAuthSuccess();

        } catch (err) {
            if (err instanceof Error) setError(err.message);
        }
    };

    const handleRegister = async (event: React.SubmitEvent) => {
        event.preventDefault();
        setError("");

        try {
            const res = await fetch(`${baseUrl}api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: regUsername, password: regPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            await setStoredAccessToken(data.accessToken);
            onAuthSuccess();

        } catch (err) {
            if (err instanceof Error) setError(err.message);
        }
    };

    return (
        <div>
            <h1>TLS Checker</h1>
            <h2>Get started with a new account or an existing account</h2>
            
            {error && <p style={{ color: "red" }}>{error}</p>}

            <h3>Register</h3>
            <form onSubmit={handleRegister}>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={regUsername}
                    onChange={(error) => setRegUsername(error.target.value)}
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={regPassword}
                    onChange={(error) => setRegPassword(error.target.value)}
                    required 
                />
                <button type="submit">Register</button>
            </form>

            <h3>Sign In</h3>
            <form onSubmit={handleLogin}>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={loginUsername}
                    onChange={(error) => setLoginUsername(error.target.value)}
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={loginPassword}
                    onChange={(error) => setLoginPassword(error.target.value)}
                    required 
                />
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
}