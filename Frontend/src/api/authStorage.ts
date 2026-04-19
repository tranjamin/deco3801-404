// api/authStorage.ts

export type AuthUser = {
  id: number;
  username: string;
};

export const getStoredAccessToken = async (): Promise<string | null> => {
  const { accessToken } = await chrome.storage.local.get("accessToken");
  return (accessToken as string | undefined) || null;
};

export const setStoredAccessToken = async (accessToken: string | null): Promise<void> => {
  await chrome.storage.local.set({ accessToken });
};

export const getStoredUser = async (): Promise<AuthUser | null> => {
  const { authUser } = await chrome.storage.local.get("authUser");
  return (authUser as AuthUser | undefined) || null;
};

export const setStoredUser = async (user: AuthUser | null): Promise<void> => {
  await chrome.storage.local.set({ authUser: user });
};

export const clearAuthState = async (): Promise<void> => {
  await chrome.storage.local.remove(["accessToken", "authUser"]);
};