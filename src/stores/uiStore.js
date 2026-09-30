import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * UI State Store
 * 
 * Manages transient UI state that doesn't need to persist:
 * - Modal open/close states
 * - Loading indicators
 * - Toast notifications
 * - Form states (temporary)
 * - Filters and search queries
 */
export const useUIStore = create(
  devtools(
    (set) => ({
      // Modal states
      modals: {},
      
      openModal: (modalId, data = null) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: { open: true, data } }
        }));
      },
      
      closeModal: (modalId) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: { open: false, data: null } }
        }));
      },
      
      // Loading states
      loadingStates: {},
      
      setLoading: (key, isLoading) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: isLoading }
        }));
      },
      
      // Global toast/notification
      toast: null,
      
      showToast: (message, type = 'info', duration = 3000) => {
        set({ toast: { message, type, duration, id: Date.now() } });
      },
      
      clearToast: () => {
        set({ toast: null });
      },
      
      // Search and filters (non-persisted)
      searchQueries: {},
      
      setSearchQuery: (key, query) => {
        set((state) => ({
          searchQueries: { ...state.searchQueries, [key]: query }
        }));
      },
      
      clearSearchQuery: (key) => {
        set((state) => {
          const newQueries = { ...state.searchQueries };
          delete newQueries[key];
          return { searchQueries: newQueries };
        });
      },
    }),
    { name: 'UIStore', enabled: import.meta.env.DEV }
  )
);
