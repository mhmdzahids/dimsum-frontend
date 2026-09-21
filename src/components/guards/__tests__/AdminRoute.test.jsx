// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminRoute from '../AdminRoute';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('AdminRoute guard', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
  });

  it('redirects unauthenticated users to /admin/login', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/admin/products']}>
          <Routes>
            <Route path="/admin/login" element={<div>Admin Login Page</div>} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/products" element={<div>Admin Products Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.innerHTML).toContain('Admin Login Page');
    expect(container.innerHTML).not.toContain('Admin Products Page');
  });

  it('allows authenticated admin users with token to access admin routes', () => {
    localStorage.setItem('adminToken', 'valid-fake-admin-token');

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/admin/products']}>
          <Routes>
            <Route path="/admin/login" element={<div>Admin Login Page</div>} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/products" element={<div>Admin Products Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.innerHTML).toContain('Admin Products Page');
    expect(container.innerHTML).not.toContain('Admin Login Page');
  });

  it('rejects customer role and redirects to /admin/login', () => {
    localStorage.setItem('adminToken', 'dummy-token');
    localStorage.setItem('adminUser', JSON.stringify({ id: '1', role: 'customer' }));

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/admin/inventory']}>
          <Routes>
            <Route path="/admin/login" element={<div>Admin Login Page</div>} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/inventory" element={<div>Inventory Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.innerHTML).toContain('Admin Login Page');
    expect(container.innerHTML).not.toContain('Inventory Page');
  });

  it('redirects staff (cashier) from unauthorized page to /admin/scan-qr', () => {
    localStorage.setItem('adminToken', 'dummy-token');
    localStorage.setItem('adminUser', JSON.stringify({ id: '2', role: 'staff' }));

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/admin/inventory']}>
          <Routes>
            <Route path="/admin/scan-qr" element={<div>Scan QR Cashier Page</div>} />
            <Route element={<AdminRoute allowedRoles={['admin', 'inventory', 'checker']} />}>
              <Route path="/admin/inventory" element={<div>Inventory Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.innerHTML).toContain('Scan QR Cashier Page');
    expect(container.innerHTML).not.toContain('Inventory Page');
  });

  it('allows staff (cashier) to access /admin/scan-qr', () => {
    localStorage.setItem('adminToken', 'dummy-token');
    localStorage.setItem('adminUser', JSON.stringify({ id: '2', role: 'staff' }));

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/admin/scan-qr']}>
          <Routes>
            <Route element={<AdminRoute allowedRoles={['admin', 'staff']} />}>
              <Route path="/admin/scan-qr" element={<div>Scan QR Cashier Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.innerHTML).toContain('Scan QR Cashier Page');
  });
});
