import { useState } from "react";
import { setStoredAccessToken } from "../api/storage";
import "./auth.css";

export const baseUrl: string = "https://deco3801-404.onrender.com/";

type AuthMode = "login" | "register";

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const res = await fetch(`${baseUrl}api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (mode === "login" ? "Login failed" : "Registration failed"),
        );
      }

      await setStoredAccessToken(data.accessToken);
      onAuthSuccess();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
  };

  const submitLabel = mode === "login" ? "Login" : "Register";

  return (
    <div className="auth-shell">
      <section className="auth-panel" aria-label="TLS Certificate Checker auth">
        <h1 className="auth-title">TLS Certificate Checker</h1>

        <form className="auth-card" onSubmit={submitAuth}>
          <h2 className="auth-heading">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>

          <div className="auth-tabs" role="tablist" aria-label="Auth mode">
            <button
              type="button"
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => changeMode("login")}
              aria-selected={mode === "login"}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => changeMode("register")}
              aria-selected={mode === "register"}
            >
              Register
            </button>
          </div>

          <label className="auth-label" htmlFor="auth-username">
            Username
          </label>
          <input
            id="auth-username"
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label className="auth-label" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : submitLabel}
          </button>
        </form>
      </section>
    </div>
  );
}


