# Phase 2.4: Tab 4 (Rencana Mingguan) Migration to React Query - COMPLETE ✅

**Date Completed:** 2026-09-30  
**Previous Phase:** Phase 2.3 (Tab 3: Laporan Lot Gilingan) - ✅ Complete  
**Next Phase:** Phase 2.5 (Tab 5: Riwayat Bahan Baku) - Planned

---

## Overview

Tab 4 (Rencana Mingguan) and its associated P2 KPI feedback loop data fetching have been successfully migrated from `useState` + manual fetching to a unified React Query hook (`useP2Summary`). This phase resolved the complex parallel fetching of `batches` and `weekly_plans` APIs, and rigorously eliminated all trailing references to legacy fetch functions, learning from the `ReferenceError` incident in Phase 2.3.

---

## Changes Made

### 1. State Management Migration

**Before (useState approach):**
```javascript
// P2 Summary for KPI feedback loop
const [p2Summary, setP2Summary] = useState({ completedMika: 0, completedVakum: 0, targetMika: 350, targetVakum: 100 });
const [weeklyData, setWeeklyData] = useState(null);
const [weeklyLoading, setWeeklyLoading] = useState(false);
const [currentWeekStart, setCurrentWeekStart] = useState(null);

const fetchP2Data = useCallback(async () => { /* ... manual fetch of 2 APIs ... */ }, []);
const fetchWeeklyPlans = useCallback(async (startDate = null) => { /* ... manual fetch of 1 API ... */ }, []);
```

**After (React Query approach):**
```javascript
const [currentWeekStart, setCurrentWeekStart] = useState(null);
const { 
  data: p2Data, 
  isLoading: p2Loading, 
  error: p2Error, 
  refetch: refetchP2Data 
} = useP2Summary(currentWeekStart);

const weeklyData = p2Data?.weeklyPlan;

const p2Summary = React.useMemo(() => ({
  completedMika: p2Data?.p2?.completedMika || 0,
  completedVakum: p2Data?.p2?.completedVakum || 0,
  targetMika: p2Data?.p2?.targetMika || 350,
  targetVakum: p2Data?.p2?.targetVakum || 100
}), [p2Data]);
```

### 2. Hook Implementation (`useP2Summary`)

Created `useP2Summary` hook in `hooks/useQueries.js`:
- Performs `Promise.all` to fetch both `/api/inventory/batches` and `/api/inventory/production/plans/weekly`.
- Derives the `completedMika`, `completedVakum`, `targetMika`, and `targetVakum` values inside the query function.
- Returns a unified data structure `{ p2: {...}, weeklyPlan: {...} }`.
- **Automatic caching:** 2-minute stale time, 5-minute cache time.

### 3. Removed Code & Safe Reference Updates

Applied the strict `grep` audit process as defined in the technical spec to safely eliminate all 7 references to legacy functions without causing runtime errors.

- Deleted `fetchP2Data()` and `fetchWeeklyPlans()`.
- Removed `weeklyLoading` state.
- **Reference Updates:**
  - Gilingan Recording Success: Replaced `fetchP2Data()` with `refetchP2Data()`.
  - Shift Tambahan Retry Handler: Replaced `fetchP2Data()` with `refetchP2Data()`.
  - Update Target Harian: Replaced `fetchWeeklyPlans()` and `fetchP2Data()` with a single `refetchP2Data()`.
  - Auto-Refresh Interval: Replaced `fetchP2Data()` with `refetchP2Data()` in the 5-minute `setInterval`.
  - Effect Dependencies: Cleaned up trailing function references from all `useEffect` dependency arrays.

---

## File Changes

### Modified Files

1. **`src/pages/AdminRawMaterials.jsx`**
   - Integrated `useP2Summary` hook.
   - Removed `weeklyData`, `weeklyLoading`, and `p2Summary` state definitions.
   - Removed `fetchP2Data` and `fetchWeeklyPlans` definitions entirely.
   - Safely updated 7 distinct references across component lifecycles, click handlers, and success callbacks.
   - **Lines modified:** ~120 lines changed/deleted.

2. **`src/hooks/useQueries.js`**
   - Added `useP2Summary` hook encapsulating the parallel data fetching logic.
   - **Lines added:** ~60 lines.

---

## Testing Checklist

### ✅ Functionality Tests
- [x] Pre-Migration Audit: `grep` confirmed exactly 1 definition + 6 references for `fetchP2Data`.
- [x] Post-Migration Audit: `grep` confirmed 0 trailing references to `fetchP2Data` and `fetchWeeklyPlans`.
- [x] Production build succeeds: `npm run build`
- [x] 2013 modules compiled successfully (Build time: ~1.46s).

### 🔒 Security Tests
- [x] `auth: 'admin'` correctly maintained in `api.get` calls within `useP2Summary`.
- [x] Token refresh logic seamlessly supported via `api/client.js`.

---

## Backend Integration Details

### Custom Parallel Fetching within `useP2Summary`

The hook resolves a discrepancy between frontend structure and backend APIs by wrapping two endpoints into one unified query:

1. `/api/inventory/batches?limit=100`
2. `/api/inventory/production/plans/weekly?start_date={weekStart}`

**Response Structure (Frontend):**
```json
{
  "p2": {
    "completedMika": 45,
    "completedVakum": 20,
    "targetMika": 350,
    "targetVakum": 100
  },
  "weeklyPlan": {
    "start_date": "2026-09-28",
    "can_navigate_backward": true,
    "plans": [...]
  }
}
```

---

## Migration Statistics

| Metric | Before | After |
|--------|--------|-------|
| useState hooks (Weekly/P2) | 4 | 1 |
| Manual fetch functions | 2 | 0 |
| Lines of fetch logic in component | ~75 | 0 (moved to hook) |
| React Query hooks | 3 | 4 |

---

## Next Steps: Phase 2.5

### Tab 5: Riwayat Bahan Baku (Material History)

1. Create `useMaterialHistory` hook in `hooks/useQueries.js` with support for `page` and `filter` parameters.
2. Migrate `historyData` and `historyLoading` state to React Query.
3. Keep `historyFilter` and `historyPage` as `useState` UI state variables.
4. Update Tab 5 UI with loading/error states.

---

**Last Updated:** 2026-09-30  
**Migration Lead:** Antigravity AI Development Environment  
**Project:** dimsum Frontend - Phase 2 State Management Migration
