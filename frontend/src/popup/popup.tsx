import Home from "./home";
import Auth from "./auth";
import { useAuth } from "../api/auth";

export default function Popup() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isAuthenticated ? (
        <Home onSessionExpired={() => setIsAuthenticated(false)} />
      ) : (
        <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}
