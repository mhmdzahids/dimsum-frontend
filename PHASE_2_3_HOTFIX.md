# Phase 2.3 Hotfix - ReferenceError Fix

## Issue
When accessing `/admin/raw-materials`, the page showed:
```
ReferenceError: fetchProductionLog is not defined
```

## Root Cause
During the Phase 2.3 migration to React Query, the old `fetchProductionLog()` function was removed, but there were still 3 references to it in the component:
- Line 377: In the gilingan recording success handler
- Line 402: In the retry handler for additional shift recording
- Line 433: In the initial `useEffect` hook for fetching advanced data

## Solution
Replaced all 3 references to the old `fetchProductionLog()` with the new React Query refetch function `refetchProductionLog()`:

### Changes Made
1. **Line 377**: `fetchProductionLog();` → `refetchProductionLog();`
   - In the gilingan recording success callback
   
2. **Line 402**: `fetchProductionLog();` → `refetchProductionLog();`
   - In the retry handler for shift recording
   
3. **Line 433**: `fetchProductionLog();` → `refetchProductionLog();`
   - In the initial useEffect hook

## Verification
- ✅ Build successful with no errors
- ✅ All 6 references to production log fetching now use `refetchProductionLog()`
- ✅ Component should now load without ReferenceError

## Testing
1. Navigate to `/admin/raw-materials`
2. Verify Tab 3 (Laporan Lot Gilingan) loads without errors
3. Test gilingan recording to verify refetch works correctly
4. Test retry functionality for additional shifts

## Related Files
- `src/pages/AdminRawMaterials.jsx` - Fixed 3 references
- `src/hooks/useQueries.js` - Defines `useProductionLog` hook with `refetch` method
