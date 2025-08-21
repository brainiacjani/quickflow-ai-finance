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

  const role = (profileQuery.data as any)?.role ?? (user?.user_metadata?.role as string | undefined);

  if (roles.length > 0 && !roles.includes(role ?? '')) {
    // Not authorized for this role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default RequireRole;
