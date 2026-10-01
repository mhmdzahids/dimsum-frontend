import { useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useAuthStore } from '../stores/authStore';

/**
 * useAuth - Access the customer authentication context.
 * Single source of truth for customer authentication across the buyer app.
 *
 * @returns {{
 *   user: Object|null,
 *   token: string,
 *   isLoggedIn: boolean,
 *   loading: boolean,
 *   coins: number,
 *   login: (token: string, user: Object, initialCoins?: number) => void,
 *   logout: () => void,
 *   updateUser: (updatedUserData: Object) => void,
 *   setCoins: (amount: number) => void,
 *   refreshSession: () => Promise<Object|null>
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;

/**
 * Backward compatibility alias for customer auth
 */
export const useCustomerAuth = useAuth;

/**
 * Hook for admin authentication
 */
export const useAdminAuth = () => {
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
      console.error('Error saving admin token to localStorage:', err);
    }
  }, [setAuth]);

  const logout = useCallback(() => {
    clearAuth();
    queryClient.cancelQueries();
    queryClient.clear();
    try {
      window.dispatchEvent(new CustomEvent('dimsum_admin_auth_expired'));
    } catch (err) {
      console.error('Error dispatching admin auth expired event:', err);
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
