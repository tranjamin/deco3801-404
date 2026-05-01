type AccessToken = string | null;

export const getAccessToken = async (): Promise<AccessToken> => {
  const { accessToken } = await chrome.storage.local.get("accessToken");
  return (accessToken as string | undefined) || null;
};

export const setAccessToken = async (accessToken: AccessToken): Promise<void> => {
  await chrome.storage.local.set({ accessToken });
};

export const clearStorage = async (): Promise<void> => {
  await chrome.storage.local.remove(["accessToken", "authUser"]);
};