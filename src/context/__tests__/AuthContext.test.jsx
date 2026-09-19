// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('AuthContext and useAuth', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(api, 'get').mockResolvedValue({ success: false });
    vi.spyOn(api, 'post').mockResolvedValue({ success: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('throws error when useAuth is called outside AuthProvider', () => {
    function InvalidConsumer() {
      useAuth();
      return null;
    }

    expect(() => {
      act(() => {
        root.render(<InvalidConsumer />);
      });
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('provides default unauthenticated state when storage is empty', () => {
    let auth;
    function Consumer() {
      auth = useAuth();
      return <div>{auth.isLoggedIn ? 'logged' : 'guest'}</div>;
    }

    act(() => {
      root.render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );
    });

    expect(auth.isLoggedIn).toBe(false);
    expect(auth.user).toBeNull();
    expect(auth.token).toBe('');
    expect(auth.coins).toBe(0);
  });

  it('handles login, updateUser, setCoins, and logout correctly', () => {
    let auth;
    function Consumer() {
      auth = useAuth();
      return (
        <div>
          <span data-testid="status">{auth.isLoggedIn ? 'logged' : 'guest'}</span>
          <span data-testid="name">{auth.user?.full_name || ''}</span>
          <span data-testid="coins">{auth.coins}</span>
        </div>
      );
    }

    act(() => {
      root.render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );
    });

    expect(auth.isLoggedIn).toBe(false);

    // 1. Perform login
    act(() => {
      auth.login('mock-jwt-token', { full_name: 'Budi Santoso', email: 'budi@dimsum.id' }, 2000);
    });

    expect(auth.isLoggedIn).toBe(true);
    expect(auth.user.full_name).toBe('Budi Santoso');
    expect(auth.token).toBe('mock-jwt-token');
    expect(auth.coins).toBe(2000);
    expect(localStorage.getItem('dimsum_customer_token')).toBe('mock-jwt-token');

    // 2. Update user
    act(() => {
      auth.updateUser({ full_name: 'Budi Updated', email: 'budi@dimsum.id', phone: '08123456789' });
    });

    expect(auth.user.full_name).toBe('Budi Updated');
    expect(auth.user.phone).toBe('08123456789');

    // 3. Set coins
    act(() => {
      auth.setCoins(3500);
    });

    expect(auth.coins).toBe(3500);

    // 4. Perform logout
    act(() => {
      auth.logout();
    });

    expect(auth.isLoggedIn).toBe(false);
    expect(auth.user).toBeNull();
    expect(auth.token).toBe('');
    expect(auth.coins).toBe(0);
    expect(localStorage.getItem('dimsum_customer_token')).toBeNull();
  });
});
