import {
  clearStorage,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAccessToken,
} from "./storage";
import { BACKEND_BASE_URL } from "../base_url";
/// <reference types="chrome" />
import { useEffect, useState } from "react";

type AuthApiResult = {
  success: boolean;
  error?: string;
}

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

/**
 * Is the actual function that sends POST requests to the backend via Jonah's API to change
 * usernames or passwords
 * @param endpoint The endpoint in Jonah's auth_routes.py API
 * @param body The contains data for the requested fields from the change_username and 
 * change_password functions in auth_routes.py API
 * @returns boolean and error? object
 */
async function authChangeRequest (
  endpoint: string,
  body: object
): Promise <AuthApiResult> {
  const token = await getValidAccessToken();

  if (!token) {
    return {success: false, error: "Session expired. Please log in again."};
  }

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Request failed"
      }
    }

    return {success: true};
  } catch (error) {
    console.error(`Failed to call /api/auth/${endpoint}:`, error);
    return {
      success: false,
      error: "Network error. Please try again."
    };
  }

}

/**
 * Feeds the endpoint for changing passwords and the required fields to authChangeRequest
 * @param currentPassword The current password used by the user to login
 * @param newPassword The new password the user wants to change password to
 * @returns A boolean and error? object
 */
export async function changePassword (
  currentPassword: string,
  newPassword: string
): Promise<AuthApiResult> {
  return authChangeRequest("change_password", {
    current_password: currentPassword,
    new_password: newPassword
  });
}

/**
 * Feeds the endpoint for changing username and the required fields to authChangeRequest
 * @param currentPassword The current password used by the user to login
 * @param newUsername The new username the users want to change usernames to
 * @returns A boolean and error? object
 */
export async function changeUsername (
  currentPassword: string,
  newUsername: string
): Promise<AuthApiResult> {
  return authChangeRequest("change_username", {
    current_password: currentPassword,
    new_username: newUsername
  });
}