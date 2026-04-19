const API_BASE_URL = "https://deco3801-404-dev.onrender.com"; // "http://127.0.0.1:5000" for local development


type BackgroundError = {
  status: number;
  message: string;
};

type RequestPayload = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
};

export type AuthUser = {
  id: number;
  username: string;
};

const AUTH_STORAGE_KEYS = ["accessToken", "authUser"] as const;

const getStoredAccessToken = async () => {
  const { accessToken } = await chrome.storage.local.get("accessToken");
  return (accessToken as string | undefined) || null;
};

const setStoredAccessToken = async (accessToken: string | null) => {
  await chrome.storage.local.set({ accessToken });
};

const getStoredUser = async () => {
  const { authUser } = await chrome.storage.local.get("authUser");
  return (authUser as AuthUser | undefined) || null;
};

const setStoredUser = async (user: AuthUser | null) => {
  await chrome.storage.local.set({ authUser: user });
};

const clearAuthState = async () => {
  await chrome.storage.local.remove([...AUTH_STORAGE_KEYS]);
};

const buildUrl = (path: string) => {
  const url = new URL(`${API_BASE_URL}${path}`);

  return url.toString();
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
};

const buildHttpError = (status: number, payload: unknown): BackgroundError => {
  const parsed = payload as { error?: string; message?: string; msg?: string } | null;
  return {
    status,
    message: parsed?.error || parsed?.message || parsed?.msg || `Request failed with status ${status}`,
  };
};

const requestBackend = async <T>({
  path,
  method = "GET",
  body,
  requiresAuth = false,
}: RequestPayload): Promise<T> => {
  if (!path) {
    throw { status: 400, message: "Missing request path" } as BackgroundError;
  }

  const headers: HeadersInit = { "Content-Type": "application/json" };
  const accessToken = await getStoredAccessToken();

  if (requiresAuth) {
    if (!accessToken) {
      throw { status: 401, message: "Not authenticated" } as BackgroundError;
    }
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      await clearAuthState();
    }
    throw buildHttpError(response.status, payload);
  }

  return payload as T;
};




/* Authentication API functions */




export const login = async (username: string, password: string) => {
  const data = await requestBackend<{ accessToken: string; user: AuthUser }>({
    path: "/api/auth/login",
    method: "POST",
    body: { username, password },
  });
  await Promise.all([setStoredAccessToken(data.accessToken), setStoredUser(data.user)]);
  return data;
};

export const register = async (payload: {
  username: string;
  password: string;
}) => {
  const data = await requestBackend<{ accessToken: string; user: AuthUser }>({
    path: "/api/auth/register",
    method: "POST",
    body: payload,
  });
  await Promise.all([setStoredAccessToken(data.accessToken), setStoredUser(data.user)]);
  return data;
};

export const me = async () => {
  const user = await requestBackend<AuthUser>({ path: "/api/auth/me", requiresAuth: true });
  await setStoredUser(user);
  return user;
};

export const logout = async () => {
  await clearAuthState();
  return { isAuthenticated: false, accessToken: null, user: null };
};

export const getAuthState = async () => {
  const [accessToken, user] = await Promise.all([getStoredAccessToken(), getStoredUser()]);
  return {
    isAuthenticated: Boolean(accessToken),
    accessToken,
    user,
  };
};