import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAdminRole, getAdminDefaultRoute, isRoleAllowed } from '../../utils/adminAuth';

/**
 * AdminRoute Guard
 * Protects administrative routes by verifying admin token in localStorage.
 * Enforces Role-Based Access Control (RBAC) if `allowedRoles` is passed.
 * Automatically listens to 'dimsum_admin_auth_expired' custom event dispatched by client.js.
 */
export default function AdminRoute({ allowedRoles }) {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const location = useLocation();

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
    };

    window.addEventListener('dimsum_admin_auth_expired', handleExpired);
    return () => {
      window.removeEventListener('dimsum_admin_auth_expired', handleExpired);
    };
  }, []);

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const role = getAdminRole() || 'admin';

  // Customers must never access admin portal
  if (role === 'customer') {
    return <Navigate to="/admin/login" replace />;
  }

  // If specific allowed roles are required on this route
  if (allowedRoles && allowedRoles.length > 0 && !isRoleAllowed(role, allowedRoles)) {
    const fallbackRoute = getAdminDefaultRoute(role);
    // Prevent redirect loop if already at fallback route
    if (location.pathname === fallbackRoute) {
      return <Outlet />;
    }
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
}
