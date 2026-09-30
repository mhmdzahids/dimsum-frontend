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
        },

        clearAuth: () => {
          set({ customerToken: null, customerUser: null, coins: 0 });
          try {
            localStorage.removeItem('dimsum_customer_token');
            localStorage.removeItem('dimsum_customer_user');
            localStorage.removeItem('dimsum_customer_coins');
          } catch (err) {
            console.error('Error clearing customer auth from localStorage:', err);
          }
        },

        setCoins: (amount) => {
          set({ coins: amount });
        },

        updateUser: (user) => {
          set({ customerUser: user });
        },

        rehydrate: () => {
          try {
            const token = localStorage.getItem('dimsum_customer_token');
            const userStr = localStorage.getItem('dimsum_customer_user');
            const coins = localStorage.getItem('dimsum_customer_coins');
            
            if (token) {
              set({
                customerToken: token,
                customerUser: userStr ? JSON.parse(userStr) : null,
                coins: coins ? parseInt(coins, 10) : 0,
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
