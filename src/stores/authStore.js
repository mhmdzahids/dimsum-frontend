import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

/**
 * Admin Authentication Store
 * 
 * Centralized single source of truth for admin auth state
 * - Manages token and user role
 * - Persists to localStorage for session recovery
 * - DevTools only enabled in development
 */
export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        adminToken: null,
        adminUser: null,
        adminRole: null,

        // Actions
        setAuth: (token, user, role) => {
          set({ adminToken: token, adminUser: user, adminRole: role });
        },

        clearAuth: () => {
          set({ adminToken: null, adminUser: null, adminRole: null });
          // Also clear from localStorage to ensure sync
          try {
            localStorage.removeItem('adminToken');
          } catch (err) {
            console.error('Error clearing adminToken from localStorage:', err);
          }
        },

        // Rehydrate from localStorage on app start
        rehydrate: () => {
          try {
            const token = localStorage.getItem('adminToken');
            if (token) {
              set({ adminToken: token });
            }
          } catch (err) {
            console.error('Error rehydrating auth store:', err);
          }
        },

        // Getters
        isAuthenticated: () => !!get().adminToken,
        getToken: () => get().adminToken,
      }),
      {
        name: 'admin-auth-store',
        partialize: (state) => ({
          adminToken: state.adminToken,
          adminRole: state.adminRole,
        }),
      }
    ),
    { name: 'AdminAuthStore', enabled: import.meta.env.DEV }
  )
);

/**
 * Customer Authentication Store
 * 
 * Manages customer login state and coins
 */
export const useCustomerAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        customerToken: null,
        customerUser: null,
        coins: 0,

        // Actions
        setAuth: (token, user, coins = 0) => {
          set({ customerToken: token, customerUser: user, coins });
          try {
            if (token) localStorage.setItem('dimsum_customer_token', token);
            if (user) {
              localStorage.setItem('dimsum_customer_user', JSON.stringify(user));
              if (user.full_name) localStorage.setItem('dimsum_customer_name', user.full_name);
              if (user.email) {
                if (user.email.includes('@')) {
                  localStorage.setItem('dimsum_customer_email', user.email);
                } else {
                  localStorage.setItem('dimsum_customer_phone', user.email);
                }
              }
            }
            localStorage.setItem('dimsum_customer_coins', String(coins));
            window.dispatchEvent(new CustomEvent('dimsum_customer_auth_changed', { detail: { loggedIn: true, user } }));
          } catch (err) {
            console.error('Error saving customer auth to localStorage:', err);
          }
        },

        clearAuth: () => {
          set({ customerToken: null, customerUser: null, coins: 0 });
          try {
            localStorage.removeItem('dimsum_customer_token');
            localStorage.removeItem('dimsum_customer_user');
            localStorage.removeItem('dimsum_customer_coins');
            window.dispatchEvent(new CustomEvent('dimsum_customer_auth_changed', { detail: { loggedIn: false } }));
          } catch (err) {
            console.error('Error clearing customer auth from localStorage:', err);
          }
        },

        setCoins: (amount) => {
          set({ coins: amount });
          try {
            localStorage.setItem('dimsum_customer_coins', String(amount));
            window.dispatchEvent(new CustomEvent('dimsum_customer_auth_changed', { detail: { coins: amount } }));
          } catch (err) {
            console.error('Error setting customer coins in localStorage:', err);
          }
        },

        updateUser: (user) => {
          set({ customerUser: user });
          try {
            if (user) {
              localStorage.setItem('dimsum_customer_user', JSON.stringify(user));
              if (user.full_name) localStorage.setItem('dimsum_customer_name', user.full_name);
              if (user.email && user.email.includes('@')) localStorage.setItem('dimsum_customer_email', user.email);
              if (user.phone) localStorage.setItem('dimsum_customer_phone', user.phone);
              window.dispatchEvent(new CustomEvent('dimsum_customer_auth_changed', { detail: { loggedIn: true, user } }));
            }
          } catch (err) {
            console.error('Error updating customer user in localStorage:', err);
          }
        },

        rehydrate: () => {
          try {
            const token = localStorage.getItem('dimsum_customer_token');
            const userStr = localStorage.getItem('dimsum_customer_user');
            const coins = localStorage.getItem('dimsum_customer_coins');
            
            if (token && userStr) {
              set({
                customerToken: token,
                customerUser: JSON.parse(userStr),
                coins: coins ? parseInt(coins, 10) : 0,
              });
            } else if (!token) {
              set({
                customerToken: null,
                customerUser: null,
                coins: 0
              });
            }
          } catch (err) {
            console.error('Error rehydrating customer auth store:', err);
          }
        },

        // Getters
        isAuthenticated: () => !!get().customerToken,
        getToken: () => get().customerToken,
      }),
      {
        name: 'customer-auth-store',
        partialize: (state) => ({
          customerToken: state.customerToken,
          customerUser: state.customerUser,
          coins: state.coins,
        }),
      }
    ),
    { name: 'CustomerAuthStore', enabled: import.meta.env.DEV }
  )
);
