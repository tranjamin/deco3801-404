import { useEffect, useState } from "react";
import Home from "./home";
import Auth from "./auth";
import { getStoredAccessToken } from "../api/storage";

export const baseUrl: string = "https://deco3801-404.onrender.com/";

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

        const res = await fetch(`${baseUrl}api/auth/check`, {
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


