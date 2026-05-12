import {
  clearStorage,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAccessToken,
} from "./storage";
import { BACKEND_BASE_URL } from "../base_url";
/// <reference types="chrome" />
import { useEffect, useState } from "react";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.access_token as string) || null;
  } catch {
    return null;
  }
}

/**
 * Returns a valid access token, refreshing it if expired.
 * Clears storage and returns null if neither token is usable.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = await getStoredAccessToken();

  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshToken = await getStoredRefreshToken();
  if (refreshToken) {
    const newAccessToken = await refreshAccessToken(refreshToken);
    if (newAccessToken) {
      await setStoredAccessToken(newAccessToken);
      return newAccessToken;
    }
  }

  await clearStorage();
  return null;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = async () => {
    try {
      const token = await getValidAccessToken();
      setIsAuthenticated(token !== null);
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (
        (area === "session" && "accessToken" in changes) ||
        (area === "local" && "refreshToken" in changes)
      ) {
        checkAuth();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated !== true) return;
    const interval = setInterval(checkAuth, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return { isAuthenticated, setIsAuthenticated };
}
