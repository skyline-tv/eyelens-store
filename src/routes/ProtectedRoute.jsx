import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../auth/auth";

export default function ProtectedRoute({ redirectTo = "/login" }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

