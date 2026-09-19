import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNav from '../AdminNav';

/**
 * AdminLayout
 * Unified wrapper layout for all admin-facing pages.
 * Houses the sticky header AdminNav and standard background surface.
 */
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg-cream/40 pb-20 font-body">
      <AdminNav />
      <Outlet />
    </div>
  );
}
