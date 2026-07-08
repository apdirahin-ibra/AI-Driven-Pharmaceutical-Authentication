import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

export function AdminRoute() {
  const { role } = useAuth();

  if (role !== "Admin") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
