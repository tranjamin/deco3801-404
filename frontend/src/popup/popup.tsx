import { useEffect, useState } from "react";
import Home from "./home";
import Auth from "./auth";
import { getStoredAccessToken } from "../api/storage";
import { BACKEND_BASE_URL } from "../base_url";

export default function Popup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const accessToken = await getStoredAccessToken();

        if (!accessToken) {
          setIsAuthenticated(false);
          return;
        }

        const res = await fetch(`${BACKEND_BASE_URL}/api/auth/check`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          setIsAuthenticated(false);
          return;
        }

        const data = await res.json();
        setIsAuthenticated(!!data.authenticated);
      } catch (error) {
        console.error("Auth process failed:", error);
        setIsAuthenticated(false);
      }
    };

    verifyUser();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isAuthenticated ? (
        <Home />
      ) : (
        <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}


