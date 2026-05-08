export const getStoredAccessToken = async (): Promise<string | null> => {
  const { accessToken } = await chrome.storage.local.get("accessToken");
  return (accessToken as string | undefined) || null;
};

export const setStoredAccessToken = async (accessToken: string | null): Promise<void> => {
  await chrome.storage.local.set({ accessToken });
};

export const clearStorage = async (): Promise<void> => {
  await chrome.storage.local.remove(["accessToken"]);
  await chrome.storage.local.remove(["currentCert"]);
};

export const getCurrentCertificateData = async (): Promise<string | null> => {
  const { currentCert } = await chrome.storage.local.get("currentCert");
  return (currentCert as string | undefined) || null;
};

export const setCurrentCertificateData = async (currentCert: string | null): Promise<void> => {
  await chrome.storage.local.set({ currentCert });
};