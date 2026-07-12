import { Navigate, useLocation } from "react-router-dom";

/**
 * Guards any nested route behind a valid access token and an active
 * host account. If the host's status is not "active" (e.g. still
 * awaiting_verification, suspended, or inactive), tokens are cleared
 * and the user is redirected to sign-in.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("access_token");
  const raw = localStorage.getItem("host");

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  if (raw) {
    try {
      const host = JSON.parse(raw);
      if (host.status !== "active") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("host");
        return <Navigate to="/signin" replace />;
      }
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("host");
      return <Navigate to="/signin" replace />;
    }
  }

  return children;
}
