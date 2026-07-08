import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";

export function ProtectedRoute() {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f9ff]">
        <div className="text-center">
          <ShieldCheck className="spinner mx-auto h-12 w-12 text-primary" />
          <p className="mt-4 font-semibold text-muted-foreground">Checking secure session</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
