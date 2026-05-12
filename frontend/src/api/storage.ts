export const getStoredAccessToken = async (): Promise<string | null> => {
  const { accessToken } = await chrome.storage.session.get("accessToken");
  return (accessToken as string | undefined) || null;
};

export const setStoredAccessToken = async (accessToken: string | null): Promise<void> => {
  if (!accessToken) {
    await chrome.storage.session.remove("accessToken");
  } else {
    await chrome.storage.session.set({ accessToken });
  }
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
  const { refreshToken } = await chrome.storage.local.get("refreshToken");
  return (refreshToken as string | undefined) || null;
};

export const setStoredRefreshToken = async (refreshToken: string | null): Promise<void> => {
  if (!refreshToken) {
    await chrome.storage.local.remove("refreshToken");
  } else {
    await chrome.storage.local.set({ refreshToken });
  }
};

export const clearStorage = async (): Promise<void> => {
  await chrome.storage.session.remove(["accessToken"]);
  await chrome.storage.local.remove(["refreshToken", "currentCert"]);
};

export const getCurrentCertificateData = async (): Promise<string | null> => {
  const { currentCert } = await chrome.storage.local.get("currentCert");
  return (currentCert as string | undefined) || null;
};

export const setCurrentCertificateData = async (currentCert: string | null): Promise<void> => {
  await chrome.storage.local.set({ currentCert });
};
