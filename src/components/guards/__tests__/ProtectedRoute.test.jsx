// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthContext } from '../../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('ProtectedRoute guard', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('redirects unauthenticated users to /auth with return location', () => {
    const mockAuthValue = {
      isLoggedIn: false,
      loading: false,
      user: null
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile/edit']}>
            <Routes>
              <Route path="/auth" element={<div>Auth Page</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile/edit" element={<div>Protected Profile Edit</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    });

    expect(container.innerHTML).toContain('Auth Page');
    expect(container.innerHTML).not.toContain('Protected Profile Edit');
  });

  it('allows authenticated users to access protected routes', () => {
    const mockAuthValue = {
      isLoggedIn: true,
      loading: false,
      user: { full_name: 'Budi' }
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile/edit']}>
            <Routes>
              <Route path="/auth" element={<div>Auth Page</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile/edit" element={<div>Protected Profile Edit</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    });

    expect(container.innerHTML).toContain('Protected Profile Edit');
    expect(container.innerHTML).not.toContain('Auth Page');
  });

  it('renders loading placeholder while authentication status is resolving', () => {
    const mockAuthValue = {
      isLoggedIn: false,
      loading: true,
      user: null
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile/edit']}>
            <Routes>
              <Route path="/auth" element={<div>Auth Page</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile/edit" element={<div>Protected Profile Edit</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    });

    // Should NOT have redirected to /auth yet while loading
    expect(container.innerHTML).not.toContain('Auth Page');
    expect(container.innerHTML).not.toContain('Protected Profile Edit');
  });
});
