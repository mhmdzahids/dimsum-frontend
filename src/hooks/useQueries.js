import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';

/**
 * Fetch admin raw materials
 * Used by AdminRawMaterials page
 */
export const useRawMaterials = (options = {}) => {
  return useQuery({
    queryKey: ['admin', 'raw-materials'],
    queryFn: async () => {
      const res = await api.get('/api/inventory/raw-materials', { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to fetch raw materials');
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Create/Update raw material mutation
 * Automatically invalidates the raw materials query on success
 */
export const useUpsertRawMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const isUpdate = data.id;
      const method = isUpdate ? 'put' : 'post';
      const endpoint = isUpdate 
        ? `/api/inventory/raw-materials/${data.id}`
        : '/api/inventory/raw-materials';
      
      const res = await api[method](endpoint, data, { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to save raw material');
      return res.data;
    },
    onSuccess: () => {
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'raw-materials'] });
    },
    onError: (error) => {
      console.error('Raw material mutation error:', error);
    },
  });
};

/**
 * Delete raw material mutation
 */
export const useDeleteRawMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (materialId) => {
      const res = await api.delete(`/api/inventory/raw-materials/${materialId}`, { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to delete raw material');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'raw-materials'] });
    },
  });
};

/**
 * Fetch production readiness (Kesiapan H-1)
 * Checks if raw materials are sufficient for target production
 */
export const useProductionReadiness = (targetGilingan = 36, options = {}) => {
  return useQuery({
    queryKey: ['admin', 'raw-materials', 'readiness', targetGilingan],
    queryFn: async () => {
      const res = await api.get(`/api/inventory/raw-materials/readiness?target_gilingan=${targetGilingan}`, { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to fetch readiness');
      return res.data;
    },
    staleTime: 1000 * 60, // 1 minute
    cacheTime: 1000 * 60 * 3, // 3 minutes
    ...options,
  });
};

/**
 * Fetch production batches
 */
export const useProductionBatches = (options = {}) => {
  return useQuery({
    queryKey: ['admin', 'production-batches'],
    queryFn: async () => {
      const res = await api.get('/api/inventory/production-batches', { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to fetch batches');
      return res.data;
    },
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Create production batch
 */
export const useCreateProductionBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/api/inventory/production-batches', data, { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to create batch');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'production-batches'] });
    },
  });
};

/**
 * Fetch production lots
 */
export const useProductionLots = (options = {}) => {
  return useQuery({
    queryKey: ['admin', 'production-lots'],
    queryFn: async () => {
      const res = await api.get('/api/inventory/production-lots', { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to fetch production lots');
      return res.data;
    },
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Create production lot
 */
export const useCreateProductionLot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/api/inventory/production-lots', data, { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to create production lot');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'production-lots'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'raw-materials'] });
    },
  });
};

/**
 * Fetch daily stock checks
 */
export const useDailyStockChecks = (options = {}) => {
  return useQuery({
    queryKey: ['admin', 'daily-stock-checks'],
    queryFn: async () => {
      const res = await api.get('/api/inventory/daily-stock-checks', { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to fetch stock checks');
      return res.data;
    },
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Create daily stock check
 */
export const useCreateDailyStockCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/api/inventory/daily-stock-checks', data, { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to create stock check');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'daily-stock-checks'] });
    },
  });
};

/**
 * Fetch all products (for inventory planning)
 */
export const useProducts = (options = {}) => {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const res = await api.get('/api/products', { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to fetch products');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    ...options,
  });
};

/**
 * Fetch user details (for permission checks)
 * Cache time is 0 for security-sensitive queries
 */
export const useCurrentAdminUser = (options = {}) => {
  return useQuery({
    queryKey: ['admin', 'current-user'],
    queryFn: async () => {
      const res = await api.get('/api/auth/me', { auth: 'admin' });
      if (!res.success) throw new Error(res.error || 'Failed to fetch user');
      return res.data;
    },
    cacheTime: 0, // Don't cache user info
    staleTime: 0,  // Always refetch
    ...options,
  });
};

/**
 * Fetch production log (Laporan Lot Gilingan)
 * Shows historical production batches and summary statistics
 */
export const useProductionLog = (limit = 30, options = {}) => {
  return useQuery({
    queryKey: ['admin', 'production-log', limit],
    queryFn: async () => {
      const res = await api.get(`/api/inventory/raw-materials/production-log?limit=${limit}`, { auth: 'admin' });
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch production log');
      }
      return res.data || { logs: [], summary: {} };
    },
    staleTime: 1000 * 60, // 1 minute (historical data doesn't change often)
    cacheTime: 1000 * 60 * 5, // 5 minutes (keep in cache longer for tab switching)
    ...options,
  });
};

/**
 * Fetch P2 Summary and Weekly Planning Data
 * Used by Tab 4: Rencana Mingguan
 * 
 * @param {string} weekStart - ISO date string for week start (optional)
 * @param {object} options - Additional React Query options
 * @returns {object} React Query result with weekly planning data
 */
export const useP2Summary = (weekStart = null, options = {}) => {
  return useQuery({
    queryKey: ['admin', 'p2-summary', weekStart],
    queryFn: async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const url = weekStart 
        ? `/api/inventory/production/plans/weekly?start_date=${weekStart}`
        : '/api/inventory/production/plans/weekly';
      
      const [batchesRes, weeklyRes] = await Promise.all([
        api.get('/api/inventory/batches?limit=100', { auth: 'admin' }),
        api.get(url, { auth: 'admin' })
      ]);
      
      if (!weeklyRes.success) {
        throw new Error(weeklyRes.error || 'Failed to fetch weekly plans');
      }

      let completedMika = 0, completedVakum = 0, targetMika = 350, targetVakum = 100;
      
      if (batchesRes.success) {
        const todayBatches = (batchesRes.data || []).filter(b => {
          const d = (b.completed_at || b.created_at || '').substring(0, 10);
          return d === todayStr && b.status === 'completed';
        });
        completedMika = todayBatches
          .filter(b => b.packaging_type === 'mika' || b.lot_size === 50)
          .reduce((sum, b) => sum + (b.actual_packs || 0), 0);
        completedVakum = todayBatches
          .filter(b => b.packaging_type === 'vakum' || b.lot_size === 25)
          .reduce((sum, b) => sum + (b.actual_packs || 0), 0);
      }

      const weeklyPlan = weeklyRes.data;
      const todayPlan = weeklyPlan?.plans?.find(p => p.is_today);
      if (todayPlan) {
        targetMika = todayPlan.target_mika || 350;
        targetVakum = todayPlan.target_vakum || 100;
      }
      
      return { 
        p2: { completedMika, completedVakum, targetMika, targetVakum },
        weeklyPlan 
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - data considered fresh for 2 minutes
    cacheTime: 1000 * 60 * 5, // 5 minutes - keep in cache
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes (replaces manual interval)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    ...options,
  });
};

/**
 * Fetch Material Transaction History
 * Used by Tab 5: Riwayat Bahan Baku
 * 
 * @param {object} filters - Filter options
 * @param {string} filters.action - 'all' | 'in' | 'out' | 'adjustment'
 * @param {number} filters.page - Page number (default 1)
 * @param {number} filters.limit - Items per page (default 50)
 * @param {object} options - Additional React Query options
 * @returns {object} React Query result with material history data
 */
export const useMaterialHistory = (filters = {}, options = {}) => {
  const { action = 'all', page = 1, limit = 50 } = filters;
  
  return useQuery({
    queryKey: ['admin', 'material-history', action, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: action !== 'all' ? action : '',
        page: page.toString(),
        limit: limit.toString()
      });
      
      const res = await api.get(`/api/inventory/raw-materials/transactions?${params}`, { 
        auth: 'admin' 
      });
      
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch material history');
      }
      
      const historyData = Array.isArray(res.data) ? res.data : (res.data?.history || []);
      
      return {
        history: historyData,
        pagination: res.data?.pagination || { page: 1, limit: 50, total: historyData.length, totalPages: 1 }
      };
    },
    staleTime: 1000 * 60, // 1 minute (historical data)
    cacheTime: 1000 * 60 * 10, // 10 minutes (keep longer for tab switching)
    enabled: options.enabled !== false, // Allow conditional fetching
    ...options,
  });
};
