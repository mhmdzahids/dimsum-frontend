import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCustomerToken,
  getCustomerUser,
  getCustomerCoins,
  setCustomerCoins as persistCustomerCoins,
  loginCustomer as persistLoginCustomer,
  logoutCustomer as persistLogoutCustomer,
  updateCustomerUser as persistUpdateCustomerUser,
  subscribeCustomerAuth
} from '../utils/customerAuth';
import api from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getCustomerToken());
  const [user, setUser] = useState(() => getCustomerUser());
  const [coins, setCoinsState] = useState(() => getCustomerCoins());
  const [loading, setLoading] = useState(true);

  const isLoggedIn = Boolean(token && user);

  // Sync state from customerAuth utilities and events
  const syncStateFromStorage = useCallback(() => {
    setToken(getCustomerToken());
    setUser(getCustomerUser());
    setCoinsState(getCustomerCoins());
  }, []);

  // On mount: verify / refresh session if token exists
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const activeToken = getCustomerToken();
      if (!activeToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me', { auth: 'customer' });
        if (isMounted && res.success && res.data) {
          const fetchedUser = res.data.user || res.data;
          persistUpdateCustomerUser(fetchedUser);
          setUser(fetchedUser);
        }
      } catch (err) {
        console.warn('Session verification failed or offline:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
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
  }, [syncStateFromStorage]);

  const login = useCallback((authToken, authUser, initialCoins = 1500) => {
    persistLoginCustomer(authToken, authUser, initialCoins);
    setToken(authToken);
    setUser(authUser);
    setCoinsState(initialCoins);
  }, []);

  const logout = useCallback(() => {
    persistLogoutCustomer();
    setToken('');
    setUser(null);
    setCoinsState(0);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    persistUpdateCustomerUser(updatedUserData);
    setUser(updatedUserData);
  }, []);

  const setCoins = useCallback((amount) => {
    persistCustomerCoins(amount);
    setCoinsState(amount);
  }, []);

  const refreshSession = useCallback(async () => {
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
  }, [updateUser]);

  const value = useMemo(() => ({
    token,
    user,
    isLoggedIn,
    loading,
    coins,
    login,
    logout,
    updateUser,
    setCoins,
    refreshSession
  }), [token, user, isLoggedIn, loading, coins, login, logout, updateUser, setCoins, refreshSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
