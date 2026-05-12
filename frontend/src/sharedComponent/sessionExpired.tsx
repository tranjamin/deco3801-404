/// <reference types="chrome" />

export function SessionExpired() {
  const handleSignIn = () => {
    chrome.action.openPopup().catch(() => {});
    window.close();
  };

  return (
    <div>
      <div>
        <h2>Session Expired</h2>
        <p>Your session has expired. Click below to sign in again.</p>
        <button onClick={handleSignIn}>Sign In</button>
      </div>
    </div>
  );
}
