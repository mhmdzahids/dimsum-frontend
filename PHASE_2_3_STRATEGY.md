# Phase 2.3: Tab 3 (Laporan Lot Gilingan) Migration Strategy

**Date Created:** 2026-09-29  
**Previous Phase:** Phase 2.2 (Tab 2: Kesiapan H-1) - ✅ Complete  
**Current Phase:** Phase 2.3 (Tab 3: Laporan Lot Gilingan) - In Progress  
**Next Phase:** Phase 2.4 (Tab 4: Rencana Mingguan) - Planned

---

## Overview

Phase 2.3 will migrate Tab 3 (Laporan Lot Gilingan / Production Log) from useState + manual fetch to React Query. This tab displays historical production batch data and summary statistics.

---

## Current Implementation Analysis

### State Management (Lines 68-70)
```javascript
// Production Log (Laporan Lot Harian)
const [productionLog, setProductionLog] = useState({ logs: [], summary: {} });
const [logLoading, setLogLoading] = useState(false);
```

### Fetch Function (Lines 162-172)
```javascript
const fetchProductionLog = useCallback(async () => {
  setLogLoading(true);
  try {
    const res = await api.get('/api/inventory/raw-materials/production-log?limit=30', { auth: 'admin' });
    if (res.success) setProductionLog(res.data || { logs: [], summary: {} });
  } catch (err) {
    console.error('Failed to fetch production log', err);
  } finally {
    setLogLoading(false);
  }
}, []);
```

### Usage
- **Trigger:** Called in useEffect on component mount (line 458)
- **Refetch:** When activeTab changes to 'lot-log' (line 458)
- **Data Structure:** `{ logs: Array, summary: Object }`

---

## Migration Plan

### Step 1: Create React Query Hook

Add to `hooks/useQueries.js`:

```javascript
/**
 * Hook for fetching production log (Laporan Lot Gilingan)
 * Shows historical production batches and summary statistics
 */
export const useProductionLog = (limit = 30) => {
  return useQuery({
    queryKey: ['productionLog', limit],
    queryFn: async () => {
      const res = await secureClient.get(
        `/api/inventory/raw-materials/production-log?limit=${limit}`
      );
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch production log');
      }
      return res.data || { logs: [], summary: {} };
    },
    staleTime: 60000, // 1 minute (historical data doesn't change often)
    cacheTime: 300000, // 5 minutes (keep in cache longer for tab switching)
    retry: 1,
  });
};
```

### Step 2: Update AdminRawMaterials.jsx

#### Remove useState
```javascript
// DELETE these lines:
const [productionLog, setProductionLog] = useState({ logs: [], summary: {} });
const [logLoading, setLogLoading] = useState(false);
```

#### Add React Query Hook
```javascript
// ADD this line near other hooks:
const { 
  data: productionLog, 
  isLoading: logLoading, 
  error: logError, 
  refetch: refetchProductionLog 
} = useProductionLog(30);
```

#### Remove fetchProductionLog Function
Delete the entire `fetchProductionLog` function (lines 162-172).

#### Update Tab Switching Logic
The current code (line 458):
```javascript
if (activeTab === 'lot-log') fetchProductionLog();
```

React Query handles this automatically via `staleTime`. However, if you want to force refetch when switching to the tab:
```javascript
if (activeTab === 'lot-log') refetchProductionLog();
```

### Step 3: Update Tab 3 UI

Replace the placeholder with actual content from the backup file.

#### Add Loading State
```javascript
{logLoading && (
  <div className="bg-white border border-bg-cream-dark/80 rounded-card p-6 shadow-card">
    <div className="h-8 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
    <div className="h-96 bg-gray-50 rounded animate-pulse" />
  </div>
)}
```

#### Add Error State
```javascript
{logError && (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
    <p className="text-red-700 font-semibold">Gagal memuat laporan lot gilingan</p>
    <button
      onClick={() => refetchProductionLog()}
      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
    >
      Coba Lagi
    </button>
  </div>
)}
```

#### Add Success State
Copy the content from the backup file for the production log table and summary cards.

---

## Expected Data Structure

From backend endpoint `/api/inventory/raw-materials/production-log`:

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "LOT-20260929-001",
        "date": "2026-09-29",
        "lot_number": "20260929-001",
        "gilingan": 36,
        "packaging_type": "mika",
        "actual_packs": 350,
        "status": "completed",
        "completed_at": "2026-09-29T08:30:00Z",
        "notes": "Produksi pagi"
      }
    ],
    "summary": {
      "total_gilingan": 108,
      "total_packs": 1050,
      "mika_packs": 700,
      "vakum_packs": 350,
      "avg_gilingan_per_day": 36
    }
  }
}
```

---

## Benefits of React Query for Production Log

1. **Automatic Caching:** Data persists when switching between tabs
2. **Background Refetching:** Silent refetch when window regains focus
3. **Stale Time:** 1-minute stale time prevents unnecessary API calls
4. **Error Recovery:** Built-in retry and manual refetch capabilities
5. **DevTools Visibility:** Easy debugging in React Query DevTools

---

## Implementation Checklist

- [ ] Add `useProductionLog` hook to `hooks/useQueries.js`
- [ ] Import hook in `AdminRawMaterials.jsx`
- [ ] Remove `productionLog` and `logLoading` useState
- [ ] Remove `fetchProductionLog` function
- [ ] Update useEffect to remove production log fetch call
- [ ] Add loading state UI for Tab 3
- [ ] Add error state UI for Tab 3
- [ ] Add success state UI (from backup file)
- [ ] Test tab switching and data caching
- [ ] Verify build succeeds
- [ ] Update documentation

---

## Testing Plan

### Functional Tests
1. **Initial Load:** Tab 3 shows loading skeleton
2. **Data Display:** Table shows production logs correctly
3. **Summary Cards:** Display correct totals and averages
4. **Tab Switching:** Switch between tabs maintains cache
5. **Error Handling:** Backend failure shows error state
6. **Retry Button:** Manual refetch works correctly

### Performance Tests
1. **Cache Hit:** Switching back to Tab 3 within 1 minute should not refetch
2. **Stale Refetch:** After 1 minute, switching to Tab 3 should refetch
3. **Network Tab:** Verify only one request per stale period
4. **DevTools:** Check query status and cache behavior

---

## Security Considerations

- `cacheTime: 300000` (5 minutes): Keep in memory for tab switching performance
- Not using `cacheTime: 0` because production log is not highly sensitive
- Token refresh handled by `secureClient.js` automatically
- No sensitive data exposure in localStorage (React Query cache is in-memory)

---

## Next Steps After Phase 2.3

Once Tab 3 migration is complete and tested:

**Phase 2.4: Tab 4 (Rencana Mingguan)**
- Weekly planning data
- Uses `weeklyData` and `weeklyLoading` state
- More complex interactions (date selection, plan updates)

**Phase 2.5: Tab 5 (Riwayat Bahan Baku)**
- Material transaction history
- Uses `transactions` state
- Pagination and filtering

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data structure mismatch | Low | Medium | Check backend response format first |
| Cache invalidation issues | Low | Low | Use React Query DevTools to debug |
| Missing UI components | Medium | Low | Restore from backup file |
| Breaking existing features | Low | High | Test thoroughly before committing |

---

## Success Criteria

Phase 2.3 will be considered complete when:
- ✅ Tab 3 uses React Query for data fetching
- ✅ Loading and error states are properly displayed
- ✅ Data caching works correctly
- ✅ Build succeeds with no errors
- ✅ Manual testing shows correct behavior
- ✅ Documentation updated

---

**Status:** Ready to implement  
**Estimated Effort:** 30-45 minutes  
**Dependencies:** Backend running on `127.0.0.1:5000`

---

**Last Updated:** 2026-09-29  
**Migration Lead:** Kiro AI Development Environment
