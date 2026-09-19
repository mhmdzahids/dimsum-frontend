import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * AdminRoute Guard
 * Protects administrative routes by verifying admin token in localStorage.
 * Automatically listens to 'dimsum_admin_auth_expired' custom event dispatched by client.js.
 */
export default function AdminRoute() {
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

  return <Outlet />;
}
