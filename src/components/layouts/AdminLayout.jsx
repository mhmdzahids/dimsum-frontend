import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

/**
 * AdminLayout
 * Unified desktop-first CMS layout:
 * - Persistent Left Sidebar with grouped operations & role filtering
 * - Clean Sticky Top Bar with breadcrumbs and user pill
 * - Warm Cream Canvas for main content surfaces
 */
export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-cream flex font-body text-text-primary antialiased">
      {/* Left Sidebar */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Sticky Top Bar */}
        <AdminTopBar onToggleSidebar={() => setMobileOpen(true)} />

        {/* Dynamic Page Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
