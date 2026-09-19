import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import PageLoader from '../PageLoader';

/**
 * ProtectedRoute - Customer authentication route guard.
 * Redirects unauthenticated visitors to /auth with return location state.
 */
export function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
