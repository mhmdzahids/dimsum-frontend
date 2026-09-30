import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Enhanced useAuth hook with React Query integration
 * 
 * Provides centralized auth operations with automatic cache clearing on logout
 * Security improvements:
 * - Single source of truth for token (Zustand)
 * - Automatic query cache purge on logout
 * - Cancels in-flight requests on logout
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const adminToken = useAuthStore((state) => state.adminToken);
  const adminUser = useAuthStore((state) => state.adminUser);
  const adminRole = useAuthStore((state) => state.adminRole);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const login = useCallback((token, user, role) => {
    setAuth(token, user, role);
    try {
      localStorage.setItem('adminToken', token);
    } catch (err) {
      console.error('Error saving token to localStorage:', err);
    }
  }, [setAuth]);

  const logout = useCallback(() => {
    clearAuth();
    queryClient.cancelQueries();
    queryClient.clear();
    try {
      window.dispatchEvent(new CustomEvent('dimsum_admin_auth_expired'));
    } catch (err) {
      console.error('Error dispatching auth expired event:', err);
    }
    navigate('/admin/login', { replace: true });
  }, [clearAuth, queryClient, navigate]);

  return {
    token: adminToken,
    user: adminUser,
    role: adminRole,
    isAuthenticated: !!adminToken,
    login,
    logout,
  };
};

// Default export for backward compatibility
export default useAuth;

/**
 * Hook for customer authentication
 */
export const useCustomerAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { useCustomerAuthStore } = require('../stores/authStore');
  const customerToken = useCustomerAuthStore((state) => state.customerToken);
  const customerUser = useCustomerAuthStore((state) => state.customerUser);
  const coins = useCustomerAuthStore((state) => state.coins);
  const setAuth = useCustomerAuthStore((state) => state.setAuth);
  const clearAuth = useCustomerAuthStore((state) => state.clearAuth);
  const setCoinsStore = useCustomerAuthStore((state) => state.setCoins);
  const updateUser = useCustomerAuthStore((state) => state.updateUser);

  const login = useCallback((token, user, initialCoins = 1500) => {
    setAuth(token, user, initialCoins);
    // Sync with localStorage for backward compatibility
    try {
      localStorage.setItem('dimsum_customer_token', token);
      localStorage.setItem('dimsum_customer_user', JSON.stringify(user));
      localStorage.setItem('dimsum_customer_coins', String(initialCoins));
      window.dispatchEvent(new CustomEvent('dimsum_customer_auth_changed', { detail: { loggedIn: true } }));
    } catch (err) {
      console.error('Error saving customer auth to localStorage:', err);
    }
  }, [setAuth]);

  const logout = useCallback(() => {
    clearAuth();
    queryClient.cancelQueries();
    queryClient.clear();
    
    try {
      window.dispatchEvent(new CustomEvent('dimsum_customer_auth_changed', { detail: { loggedIn: false } }));
    } catch (err) {
      console.error('Error dispatching customer auth event:', err);
    }
    
    navigate('/', { replace: true });
  }, [clearAuth, queryClient, navigate]);

  return {
    // State
    token: customerToken,
    user: customerUser,
    coins,
    isLoggedIn: !!customerToken,
    
    // Actions
    login,
    logout,
    setCoins: setCoinsStore,
    updateUser,
  };
};
