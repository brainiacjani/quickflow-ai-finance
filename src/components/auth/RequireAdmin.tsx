import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Wait for auth/profile to resolve
  if (loading || profileLoading) return null;

  // Not authenticated -> send to login
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  // Allow if profile indicates admin or user metadata role is admin
  const profileAny = profile as any;
  const isAdmin = profileAny?.is_admin === true || (user?.user_metadata as any)?.role === "admin";
  if (!isAdmin) {
    // Not authorized -> redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
