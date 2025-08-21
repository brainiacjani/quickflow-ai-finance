import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export function RequireRole({ roles = [], children }: { roles?: string[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const profileQuery = useProfile();
  const location = useLocation();

  if (loading || profileQuery.isLoading) return null;

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  const profileAny = profileQuery.data as any;
  const role = profileAny?.role ?? (user?.user_metadata?.role as string | undefined);
  const isAdminFlag = profileAny?.is_admin ?? false;

  if (roles.length > 0 && !(isAdminFlag || roles.includes(role ?? ''))) {
    // Not authorized for this role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default RequireRole;
