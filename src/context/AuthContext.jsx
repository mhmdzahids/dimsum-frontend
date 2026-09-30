import React, { createContext, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getCustomerToken,
  getCustomerUser,
  getCustomerCoins,
  subscribeCustomerAuth
} from '../utils/customerAuth';
import api from '../api/client';
import { useCustomerAuthStore } from '../stores/authStore';

export const AuthContext = createContext(null);

/**
 * Enhanced AuthProvider with Zustand + React Query integration
 * 
 * Improvements:
 * - Uses Zustand for state management (single source of truth)
 * - Integrates with React Query for automatic cache clearing on logout
 * - Backwards compatible with existing code
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  
  // Get state and actions from Zustand store
  const token = useCustomerAuthStore((state) => state.customerToken);
  const user = useCustomerAuthStore((state) => state.customerUser);
  const coins = useCustomerAuthStore((state) => state.coins);
  const setAuth = useCustomerAuthStore((state) => state.setAuth);
  const clearAuth = useCustomerAuthStore((state) => state.clearAuth);
  const setCoinsState = useCustomerAuthStore((state) => state.setCoins);
  const updateUser = useCustomerAuthStore((state) => state.updateUser);
  const rehydrate = useCustomerAuthStore((state) => state.rehydrate);

  const isLoggedIn = Boolean(token && user);

  // Sync state from customerAuth utilities and events
  const syncStateFromStorage = () => {
    rehydrate();
  };

  // On mount: verify / refresh session if token exists
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const activeToken = getCustomerToken();
      if (!activeToken) {
        return;
      }

      try {
        const res = await api.get('/api/auth/me', { auth: 'customer' });
        if (isMounted && res.success && res.data) {
          const fetchedUser = res.data.user || res.data;
          updateUser(fetchedUser);
        }
      } catch (err) {
        console.warn('Session verification failed or offline:', err);
      }
    }

    checkSession();

    // Listen to custom auth events and storage changes
    const unsubscribe = subscribeCustomerAuth(() => {
      if (isMounted) syncStateFromStorage();
    });

    const handleStorage = (e) => {
      if (
        e.key === 'dimsum_customer_token' ||
        e.key === 'dimsum_customer_user' ||
        e.key === 'dimsum_customer_coins'
      ) {
        if (isMounted) syncStateFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = (authToken, authUser, initialCoins = 1500) => {
    setAuth(authToken, authUser, initialCoins);
  };

  const logout = () => {
    clearAuth();
    // Security: Clear all React Query cache on logout
    queryClient.cancelQueries();
    queryClient.clear();
  };

  const setCoins = (amount) => {
    setCoinsState(amount);
  };

  const refreshSession = async () => {
    const activeToken = getCustomerToken();
    if (!activeToken) return null;
    try {
      const res = await api.get('/api/auth/me', { auth: 'customer' });
      if (res.success && res.data) {
        const fetchedUser = res.data.user || res.data;
        updateUser(fetchedUser);
        return fetchedUser;
      }
    } catch {
      return null;
    }
    return null;
  };

  const value = useMemo(() => ({
    token,
    user,
    isLoggedIn,
    loading: false, // Zustand rehydrates synchronously
    coins,
    login,
    logout,
    updateUser,
    setCoins,
    refreshSession
  }), [token, user, isLoggedIn, coins]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
