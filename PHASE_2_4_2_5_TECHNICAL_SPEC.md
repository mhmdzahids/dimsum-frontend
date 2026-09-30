# Technical Specification: Phase 2.4 & 2.5 Migration
## React Query Migration for AdminRawMaterials.jsx

**Document Version:** 1.0  
**Date:** 2026-09-29  
**Author:** AI Agent (Kiro)  
**Target Audience:** AI Agents, Developers  
**Status:** Planning Phase

---

## Executive Summary

This document provides a comprehensive technical specification for migrating Tab 4 (Rencana Mingguan) and Tab 5 (Riwayat Bahan Baku) in `AdminRawMaterials.jsx` from manual state management to React Query. This completes the Phase 2 migration at 100%.

### Current State
- **Migration Progress:** 60% (3/5 tabs migrated)
- **Completed:** Tab 1 (Inventory CRUD), Tab 2 (Kesiapan H-1), Tab 3 (Laporan Lot Gilingan)
- **Pending:** Tab 4 (Rencana Mingguan), Tab 5 (Riwayat Bahan Baku)

### Critical Issue Discovered
During Phase 2.3 deployment, a `ReferenceError: fetchProductionLog is not defined` error occurred. This document includes a root cause analysis and prevention strategies for future migrations.

---

## Part 1: Root Cause Analysis - fetchProductionLog() Error

### Incident Summary
**Error Message:** `ReferenceError: fetchProductionLog is not defined`  
**Trigger:** Accessing `/admin/raw-materials` route  
**Impact:** Complete page failure, error boundary triggered  
**Resolution Time:** 15 minutes  
**Fix:** Replace 3 orphaned function calls with React Query refetch method

### Root Cause Analysis

#### Technical Cause
During Phase 2.3 migration, the manual `fetchProductionLog()` function was removed from the component state management, but **3 references to this function were not updated**:

```
Line 377: fetchProductionLog(); // In gilingan recording success handler
Line 402: fetchProductionLog(); // In retry handler for additional shift
Line 433: fetchProductionLog(); // In useEffect initialization hook
```

These references continued to call the old function name `fetchProductionLog()` instead of the new React Query refetch method `refetchProductionLog()`.

#### Why This Happened

1. **Incomplete Migration Checklist**
   - Migration process focused on removing state and adding hooks
   - Did not systematically search for ALL function references
   - No automated test coverage for these specific code paths

2. **Manual Refactoring Risk**
   - No grep/search step to validate all references were updated
   - Code review missed these references (manual process)
   - Build succeeded, giving false confidence

3. **Pattern Inconsistency**
   - Old pattern: `fetchProductionLog()` - manual function call
   - New pattern: `refetchProductionLog()` - React Query method
   - Naming convention changed, but references not updated

### Impact Assessment

| Severity | High - Production Breaking |
|----------|---------------------------|
| User Impact | Complete page failure for all users |
| Business Impact | Raw materials page inaccessible |
| Recovery | Required hotfix deployment |
| Prevention | Automated reference checking |

### Mitigation Strategy for Future Migrations

#### Pre-Migration Checklist Enhancement

Add this step BEFORE any migration:

```markdown
## MIGRATION PRE-CHECK: Function Reference Audit

1. **Identify all function references to be removed:**
   ```bash
   # Search for all references to the function
   grep -n "fetchFunctionName" ComponentName.jsx
   ```

2. **Count total references:**
   - Expected: Definition + N references
   - Document each line number

3. **Plan replacement for each reference:**
   - Line X: Replace with `refetchQuery()`
   - Line Y: Replace with `refetchQuery()`
   - Line Z: Remove entirely (no longer needed)

4. **Verify during migration:**
   - Check off each reference as you update
   - Re-run grep after migration: `grep -n "fetchFunctionName" ComponentName.jsx`
   - Expected result: 0 matches for old function name
```

#### Automated Validation Script

Create a pre-commit hook or CI check:

```javascript
// scripts/validate-migration.js
const fs = require('fs');
const path = require('path');

const MIGRATED_FUNCTIONS = [
  'fetchProductionLog',
  'fetchProductionReadiness',
  'fetchRawMaterials',
  // Add functions as they are migrated
];

const COMPONENTS_TO_CHECK = [
  'src/pages/AdminRawMaterials.jsx',
  // Add other components being migrated
];

let hasErrors = false;

COMPONENTS_TO_CHECK.forEach(file => {
  const content = fs.readFileSync(path.resolve(file), 'utf8');
  const lines = content.split('\n');
  
  MIGRATED_FUNCTIONS.forEach(func => {
    lines.forEach((line, index) => {
      // Check if function is called (not defined or imported)
      const callPattern = new RegExp(`\\b${func}\\s*\\(`, 'g');
      if (callPattern.test(line) && !line.includes('const') && !line.includes('function') && !line.includes('import')) {
        console.error(`❌ ERROR: Found reference to removed function "${func}" at ${file}:${index + 1}`);
        console.error(`   Line: ${line.trim()}`);
        hasErrors = true;
      }
    });
  });
});

if (hasErrors) {
  console.error('\n❌ Migration validation failed. Fix the above errors before committing.');
  process.exit(1);
} else {
  console.log('✅ Migration validation passed. No orphaned function references found.');
  process.exit(0);
}
```

#### Naming Convention Standard

To prevent future confusion, establish this naming convention:

| Old Pattern | New Pattern | Example |
|-------------|-------------|---------|
| `fetchData()` | `refetchData()` | `fetchProductionLog()` → `refetchProductionLog()` |
| `loading` | `isLoading` | `logLoading` → `logLoading` (React Query standard) |
| `error` | `error` | Same naming, different source |
| `data` | `data` | Same naming, different source |

**Rule:** When migrating, always use React Query's destructured names:
```javascript
const { 
  data: customName,      // Rename data if needed
  isLoading: customLoading,  // Always prefix with 'isLoading'
  error: customError,
  refetch: refetchCustom     // Always prefix with 'refetch'
} = useQueryHook();
```

---

## Part 2: Phase 2.4 - Tab 4 Rencana Mingguan Migration

### Overview

**Tab Name:** Rencana Mingguan (Weekly Planning)  
**Purpose:** Display and manage weekly production plans  
**Current Implementation:** Manual state management with useState  
**Target:** React Query with automatic caching and refetching

### Current State Analysis

#### File Location
`C:\Users\Zahid\Documents\Project\dimsum\front-end\src\pages\AdminRawMaterials.jsx`

#### Current Implementation (Lines 79-82)

```javascript
// Weekly Planning Data (from P2)
const [weeklyData, setWeeklyData] = useState(null);
const [weeklyLoading, setWeeklyLoading] = useState(false);
```

#### Data Fetching Function (Estimated Lines 85-110)

```javascript
const fetchP2Data = useCallback(async () => {
  if (!canManageRawMaterials(adminRole)) return;
  setWeeklyLoading(true);
  try {
    const res = await api.get('/api/inventory/raw-materials/p2-summary', { auth: 'admin' });
    if (res.success) {
      setWeeklyData(res.data);
      // Also updates p2Summary state for KPI feedback loop
      setP2Summary({
        completedMika: res.data.p2?.completedMika || 0,
        completedVakum: res.data.p2?.completedVakum || 0,
        targetMika: res.data.p2?.targetMika || 350,
        targetVakum: res.data.p2?.targetVakum || 100
      });
    }
  } catch (err) {
    console.error('Failed to fetch P2 data:', err);
  } finally {
    setWeeklyLoading(false);
  }
}, [adminRole]);
```

#### Data Structure

Based on backend endpoint `/api/inventory/raw-materials/p2-summary`:

```typescript
interface WeeklyData {
  p2: {
    completedMika: number;
    completedVakum: number;
    targetMika: number;
    targetVakum: number;
    // Additional P2 fields...
  };
  weeklyPlan?: {
    weekStart: string; // ISO date
    weekEnd: string;
    plans: WeeklyPlanItem[];
  };
  // Additional weekly data...
}

interface WeeklyPlanItem {
  id: number;
  date: string;
  product: string;
  quantity: number;
  status: 'planned' | 'in_progress' | 'completed';
}
```

#### Usage Points

1. **Initial Load:** Called in `useEffect` on component mount (Line 434)
2. **Auto-Refresh:** Interval-based refresh every 5 minutes (Line 438-440)
3. **Manual Refresh:** After gilingan recording (Line 378, 403)
4. **Display:** Tab 4 UI rendering

### Migration Plan

#### Step 1: Create React Query Hook

**File:** `src/hooks/useQueries.js`  
**Location:** After `useProductionLog` hook (after line 247)

```javascript
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
      const url = weekStart 
        ? `/api/inventory/raw-materials/p2-summary?weekStart=${weekStart}`
        : '/api/inventory/raw-materials/p2-summary';
      
      const res = await api.get(url, { auth: 'admin' });
      
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch P2 summary');
      }
      
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (production data changes frequently)
    cacheTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });
};
```

#### Step 2: Update Component State

**File:** `src/pages/AdminRawMaterials.jsx`  
**Location:** After Tab 3 React Query hooks (after line 69)

**Before:**
```javascript
// Weekly Planning Data (from P2)
const [weeklyData, setWeeklyData] = useState(null);
const [weeklyLoading, setWeeklyLoading] = useState(false);
```

**After:**
```javascript
// Tab 4: P2 Summary & Weekly Planning - using React Query
const { 
  data: p2Data, 
  isLoading: p2Loading, 
  error: p2Error,
  refetch: refetchP2Data 
} = useP2Summary();
```

#### Step 3: Remove Manual Fetch Function

**Action:** DELETE the entire `fetchP2Data` function

**Expected Location:** Lines ~85-110

**Before Deletion:**
```javascript
const fetchP2Data = useCallback(async () => {
  // ... entire function ...
}, [adminRole]);
```

**After Deletion:**
```javascript
// REMOVED: fetchP2Data - replaced with useP2Summary React Query hook
```

#### Step 4: Update Function References

**CRITICAL STEP - Apply lessons from fetchProductionLog() error**

**Search for ALL references to `fetchP2Data`:**

```bash
grep -n "fetchP2Data" AdminRawMaterials.jsx
```

**Expected References Found:**
1. Line ~85: Function definition (DELETE)
2. Line 378: `fetchP2Data();` after gilingan recording → REPLACE with `refetchP2Data()`
3. Line 403: `fetchP2Data();` after retry → REPLACE with `refetchP2Data()`
4. Line 434: `fetchP2Data();` in useEffect → REMOVE (React Query handles initial load)
5. Line 439: `fetchP2Data();` in interval → REPLACE with `refetchP2Data()`
6. Line 443: `fetchP2Data` in useEffect dependencies → REMOVE from dependency array

**Detailed Replacement Strategy:**

##### Reference 1: Gilingan Recording Success (Line ~378)
```javascript
// BEFORE
refetch(); // React Query refetch
refetchProductionLog();
fetchP2Data();

// AFTER
refetch(); // React Query refetch
refetchProductionLog();
refetchP2Data();
```

##### Reference 2: Retry Handler (Line ~403)
```javascript
// BEFORE
refetch();
refetchProductionLog();
fetchP2Data();

// AFTER
refetch();
refetchProductionLog();
refetchP2Data();
```

##### Reference 3: useEffect Initial Load (Line ~431-443)
```javascript
// BEFORE
useEffect(() => {
  fetchAdvancedData();
  refetchProductionLog();
  fetchP2Data();
  fetchLatestDailyCheck();

  // Auto-refresh P2 KPI setiap 5 menit
  const p2RefreshInterval = setInterval(() => {
    fetchP2Data();
  }, 5 * 60 * 1000);

  return () => clearInterval(p2RefreshInterval);
}, [fetchP2Data, fetchLatestDailyCheck]);

// AFTER
useEffect(() => {
  fetchAdvancedData();
  // REMOVED: refetchProductionLog() - React Query handles this automatically
  // REMOVED: refetchP2Data() - React Query handles initial load automatically
  fetchLatestDailyCheck();

  // Auto-refresh P2 KPI setiap 5 menit
  const p2RefreshInterval = setInterval(() => {
    refetchP2Data();
  }, 5 * 60 * 1000);

  return () => clearInterval(p2RefreshInterval);
}, [refetchP2Data, fetchLatestDailyCheck]);
```

**IMPORTANT NOTE:** React Query automatically fetches on component mount. We do NOT need to call `refetchP2Data()` in the useEffect for initial load. The hook handles this.

##### Reference 4: Dependency Array Update
```javascript
// Remove fetchP2Data from dependencies
// Add refetchP2Data if needed (for interval)
}, [refetchP2Data, fetchLatestDailyCheck]);
```

#### Step 5: Update Tab 4 UI

**Location:** Tab 4 rendering section (estimated lines ~1500-1700)

**Current UI Pattern (Manual State):**
```javascript
{activeTab === 'weekly' && (
  <div className="space-y-4">
    {weeklyLoading ? (
      <div>Loading...</div>
    ) : weeklyData ? (
      <div>
        {/* Weekly planning content */}
      </div>
    ) : (
      <div>No data available</div>
    )}
  </div>
)}
```

**New UI Pattern (React Query):**
```javascript
{activeTab === 'weekly' && (
  <div className="space-y-4">
    {/* Loading State */}
    {p2Loading && (
      <div className="space-y-4">
        {/* Loading skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-bg-cream-dark/80 rounded-card p-3.5 sm:p-5 shadow-card">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-2 w-20 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Error State */}
    {p2Error && !p2Loading && (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-700 font-semibold">Gagal memuat rencana mingguan</p>
            <p className="text-red-600 text-sm mt-1">{p2Error.message || 'Terjadi kesalahan saat mengambil data'}</p>
          </div>
        </div>
        <button
          onClick={() => refetchP2Data()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    )}

    {/* Success State */}
    {!p2Loading && !p2Error && p2Data && (
      <div className="space-y-4">
        {/* P2 Summary Cards */}
        {p2Data.p2 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-bg-cream-dark/80 rounded-card p-3.5 sm:p-5 shadow-card">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Mika Completed
              </div>
              <div className="text-xl sm:text-3xl font-black font-heading text-text-primary mt-2">
                {p2Data.p2.completedMika || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-text-secondary mt-1">
                Target: {p2Data.p2.targetMika || 350}
              </div>
            </div>
            {/* Additional cards... */}
          </div>
        )}

        {/* Weekly Planning Table/Content */}
        {/* ... existing weekly planning UI ... */}
      </div>
    )}
  </div>
)}
```

#### Step 6: Update p2Summary State

The `p2Summary` state (lines 72-77) is used for KPI feedback loop. This should be updated from React Query data.

**Option A: Derive from React Query data (Recommended)**
```javascript
// Remove p2Summary useState entirely
// const [p2Summary, setP2Summary] = useState({ ... }); // DELETE THIS

// Derive from p2Data
const p2Summary = useMemo(() => ({
  completedMika: p2Data?.p2?.completedMika || 0,
  completedVakum: p2Data?.p2?.completedVakum || 0,
  targetMika: p2Data?.p2?.targetMika || 350,
  targetVakum: p2Data?.p2?.targetVakum || 100
}), [p2Data]);
```

**Option B: Keep state but update from React Query effect**
```javascript
// Keep state but remove manual updates
const [p2Summary, setP2Summary] = useState({
  completedMika: 0,
  completedVakum: 0,
  targetMika: 350,
  targetVakum: 100
});

// Update from React Query data
useEffect(() => {
  if (p2Data?.p2) {
    setP2Summary({
      completedMika: p2Data.p2.completedMika || 0,
      completedVakum: p2Data.p2.completedVakum || 0,
      targetMika: p2Data.p2.targetMika || 350,
      targetVakum: p2Data.p2.targetVakum || 100
    });
  }
}, [p2Data]);
```

**Recommendation:** Use Option A (derive from React Query data) to avoid duplicate state management.

### Migration Verification Checklist

```markdown
## Phase 2.4 Pre-Deployment Checklist

### Before Migration
- [ ] Run grep to find all `fetchP2Data` references: `grep -n "fetchP2Data" AdminRawMaterials.jsx`
- [ ] Document line numbers of each reference
- [ ] Count total references: Expected = N references + 1 definition

### During Migration
- [ ] Create `useP2Summary` hook in useQueries.js
- [ ] Import `useP2Summary` in AdminRawMaterials.jsx
- [ ] Add React Query hook usage in component
- [ ] Remove `weeklyData` useState
- [ ] Remove `weeklyLoading` useState
- [ ] Delete `fetchP2Data` function definition
- [ ] Update Reference 1: Line ~378 (gilingan recording)
- [ ] Update Reference 2: Line ~403 (retry handler)
- [ ] Update Reference 3: Line ~434 (useEffect - REMOVE call)
- [ ] Update Reference 4: Line ~439 (interval - replace with refetch)
- [ ] Update Reference 5: Line ~443 (dependencies - update)
- [ ] Update p2Summary state handling (Option A or B)
- [ ] Update Tab 4 UI with loading/error states

### After Migration
- [ ] Run grep again: `grep -n "fetchP2Data" AdminRawMaterials.jsx`
- [ ] Expected result: 0 matches
- [ ] Run build: `npm run build`
- [ ] Check for errors
- [ ] Test in browser
- [ ] Verify initial load works
- [ ] Verify interval refresh works (wait 5 minutes)
- [ ] Verify gilingan recording triggers refetch
- [ ] Verify error handling works

### Rollback Plan
If issues occur:
1. Restore from backup: `AdminRawMaterials.jsx.backup`
2. Investigate issue
3. Fix and retry
```

---

## Part 3: Phase 2.5 - Tab 5 Riwayat Bahan Baku Migration

### Overview

**Tab Name:** Riwayat Bahan Baku (Material History)  
**Purpose:** Display historical material transactions and changes  
**Current Implementation:** Manual state management with useState  
**Target:** React Query with filtering and pagination support

### Current State Analysis

#### Current Implementation (Estimated Lines 83-87)

```javascript
// Material History
const [materialHistory, setMaterialHistory] = useState([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'in' | 'out' | 'adjustment'
```

#### Data Fetching Function (Estimated Lines 112-140)

```javascript
const fetchMaterialHistory = useCallback(async () => {
  setHistoryLoading(true);
  try {
    const res = await api.get('/api/inventory/raw-materials/history', { 
      auth: 'admin',
      params: { filter: historyFilter }
    });
    if (res.success) {
      setMaterialHistory(res.data.history || []);
    }
  } catch (err) {
    console.error('Failed to fetch material history:', err);
  } finally {
    setHistoryLoading(false);
  }
}, [historyFilter]);
```

#### Data Structure

```typescript
interface MaterialHistoryItem {
  id: number;
  material_id: number;
  material_name: string;
  action: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes: string;
  created_at: string; // ISO datetime
  created_by: string;
}

interface MaterialHistoryResponse {
  history: MaterialHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Usage Points

1. **Initial Load:** Called in `fetchAdvancedData()` or separate useEffect
2. **Filter Change:** Refetch when `historyFilter` changes
3. **Display:** Tab 5 UI rendering with filter buttons

### Migration Plan

#### Step 1: Create React Query Hook

**File:** `src/hooks/useQueries.js`  
**Location:** After `useP2Summary` hook

```javascript
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
      
      const res = await api.get(`/api/inventory/raw-materials/history?${params}`, { 
        auth: 'admin' 
      });
      
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch material history');
      }
      
      return {
        history: res.data.history || [],
        pagination: res.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 }
      };
    },
    staleTime: 1000 * 60, // 1 minute (historical data)
    cacheTime: 1000 * 60 * 10, // 10 minutes (keep longer for tab switching)
    enabled: options.enabled !== false, // Allow conditional fetching
    ...options,
  });
};
```

#### Step 2: Update Component State

**File:** `src/pages/AdminRawMaterials.jsx`  
**Location:** After Tab 4 React Query hooks

**Before:**
```javascript
// Material History
const [materialHistory, setMaterialHistory] = useState([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [historyFilter, setHistoryFilter] = useState('all');
```

**After:**
```javascript
// Tab 5: Material History - using React Query
const [historyFilter, setHistoryFilter] = useState('all');
const [historyPage, setHistoryPage] = useState(1);

const { 
  data: historyData, 
  isLoading: historyLoading, 
  error: historyError,
  refetch: refetchHistory 
} = useMaterialHistory({ 
  action: historyFilter, 
  page: historyPage,
  limit: 50 
});

// Derive history array from data
const materialHistory = historyData?.history || [];
const historyPagination = historyData?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 };
```

**Note:** `historyFilter` and `historyPage` are UI state (not server state), so they remain as useState. React Query automatically refetches when these values change due to the queryKey dependency.

#### Step 3: Remove Manual Fetch Function

**Action:** DELETE the entire `fetchMaterialHistory` function

**Before Deletion:**
```javascript
const fetchMaterialHistory = useCallback(async () => {
  // ... entire function ...
}, [historyFilter]);
```

**After Deletion:**
```javascript
// REMOVED: fetchMaterialHistory - replaced with useMaterialHistory React Query hook
```

#### Step 4: Update Function References

**CRITICAL: Search for ALL references to `fetchMaterialHistory`:**

```bash
grep -n "fetchMaterialHistory" AdminRawMaterials.jsx
```

**Expected References:**
1. Function definition (DELETE)
2. In `fetchAdvancedData()` function (REPLACE or REMOVE)
3. In filter change useEffect (REMOVE - React Query handles this)

**Detailed Replacement Strategy:**

##### Reference 1: In fetchAdvancedData()
```javascript
// BEFORE
const fetchAdvancedData = async () => {
  // ... other fetches ...
  fetchMaterialHistory();
};

// AFTER
const fetchAdvancedData = async () => {
  // ... other fetches ...
  // REMOVED: fetchMaterialHistory() - React Query handles this
};
```

##### Reference 2: Filter Change useEffect
```javascript
// BEFORE
useEffect(() => {
  fetchMaterialHistory();
}, [historyFilter]);

// AFTER
// REMOVE this useEffect entirely
// React Query automatically refetches when historyFilter changes
// because it's part of the queryKey
```

#### Step 5: Update Tab 5 UI

**Location:** Tab 5 rendering section (estimated lines ~1700-2000)

**Current UI Pattern (Manual State):**
```javascript
{activeTab === 'history' && (
  <div className="space-y-4">
    {/* Filter buttons */}
    <div className="flex gap-2">
      <button onClick={() => setHistoryFilter('all')}>All</button>
      <button onClick={() => setHistoryFilter('in')}>Stock In</button>
      <button onClick={() => setHistoryFilter('out')}>Stock Out</button>
    </div>

    {historyLoading ? (
      <div>Loading...</div>
    ) : (
      <table>
        {materialHistory.map(item => (
          <tr key={item.id}>{/* ... */}</tr>
        ))}
      </table>
    )}
  </div>
)}
```

**New UI Pattern (React Query):**
```javascript
{activeTab === 'history' && (
  <div className="space-y-4">
    {/* Filter buttons */}
    <div className="flex gap-2">
      <button 
        onClick={() => {
          setHistoryFilter('all');
          setHistoryPage(1); // Reset to page 1 when filter changes
        }}
        className={historyFilter === 'all' ? 'active' : ''}
      >
        All
      </button>
      <button 
        onClick={() => {
          setHistoryFilter('in');
          setHistoryPage(1);
        }}
        className={historyFilter === 'in' ? 'active' : ''}
      >
        Stock In
      </button>
      <button 
        onClick={() => {
          setHistoryFilter('out');
          setHistoryPage(1);
        }}
        className={historyFilter === 'out' ? 'active' : ''}
      >
        Stock Out
      </button>
      <button 
        onClick={() => {
          setHistoryFilter('adjustment');
          setHistoryPage(1);
        }}
        className={historyFilter === 'adjustment' ? 'active' : ''}
      >
        Adjustment
      </button>
    </div>

    {/* Loading State */}
    {historyLoading && (
      <div className="bg-white border border-bg-cream-dark/80 rounded-card shadow-card p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Error State */}
    {historyError && !historyLoading && (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-700 font-semibold">Gagal memuat riwayat bahan baku</p>
            <p className="text-red-600 text-sm mt-1">{historyError.message || 'Terjadi kesalahan saat mengambil data'}</p>
          </div>
        </div>
        <button
          onClick={() => refetchHistory()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    )}

    {/* Success State */}
    {!historyLoading && !historyError && (
      <div className="space-y-4">
        {/* History Table */}
        <div className="bg-white border border-bg-cream-dark/80 rounded-card shadow-card overflow-hidden">
          <div className="p-4 border-b border-bg-cream-dark/60 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-brand-blue" />
              Riwayat Transaksi Bahan Baku
            </h3>
            <button 
              onClick={() => refetchHistory()} 
              disabled={historyLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Bahan Baku</th>
                  <th className="px-5 py-3.5">Aksi</th>
                  <th className="px-5 py-3.5">Jumlah</th>
                  <th className="px-5 py-3.5">Stok Sebelum</th>
                  <th className="px-5 py-3.5">Stok Sesudah</th>
                  <th className="px-5 py-3.5">Catatan</th>
                  <th className="px-5 py-3.5">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materialHistory.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      Belum ada riwayat transaksi.
                    </td>
                  </tr>
                ) : (
                  materialHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{item.material_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                          ${item.action === 'in' ? 'bg-green-100 text-green-800 border border-green-200' : ''}
                          ${item.action === 'out' ? 'bg-red-100 text-red-800 border border-red-200' : ''}
                          ${item.action === 'adjustment' ? 'bg-amber-100 text-amber-800 border border-amber-200' : ''}
                        `}>
                          {item.action === 'in' && <ArrowDownLeft className="w-3 h-3" />}
                          {item.action === 'out' && <ArrowUpRight className="w-3 h-3" />}
                          {item.action === 'adjustment' && <Sliders className="w-3 h-3" />}
                          {item.action === 'in' ? 'Masuk' : item.action === 'out' ? 'Keluar' : 'Penyesuaian'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-bold ${item.action === 'in' ? 'text-green-600' : item.action === 'out' ? 'text-red-600' : 'text-amber-600'}`}>
                          {item.action === 'in' ? '+' : item.action === 'out' ? '-' : '±'}{item.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{item.previous_stock}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{item.new_stock}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{item.notes || '-'}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{item.created_by || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {historyPagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((historyPagination.page - 1) * historyPagination.limit) + 1} to{' '}
              {Math.min(historyPagination.page * historyPagination.limit, historyPagination.total)} of{' '}
              {historyPagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                disabled={historyPagination.page === 1 || historyLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-900">
                Page {historyPagination.page} of {historyPagination.totalPages}
              </span>
              <button
                onClick={() => setHistoryPage(prev => Math.min(prev + 1, historyPagination.totalPages))}
                disabled={historyPagination.page === historyPagination.totalPages || historyLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}
```

#### Step 6: Handle Filter and Page Changes

React Query automatically refetches when `historyFilter` or `historyPage` changes because they are part of the `queryKey`. No additional `useEffect` is needed.

```javascript
// This is AUTOMATIC - no useEffect needed
// When setHistoryFilter('out') is called:
// 1. historyFilter state updates
// 2. queryKey changes from ['admin', 'material-history', 'all', 1, 50]
//    to ['admin', 'material-history', 'out', 1, 50]
// 3. React Query detects queryKey change
// 4. React Query automatically refetches with new parameters
```

### Migration Verification Checklist

```markdown
## Phase 2.5 Pre-Deployment Checklist

### Before Migration
- [ ] Run grep to find all `fetchMaterialHistory` references
- [ ] Document line numbers
- [ ] Count total references

### During Migration
- [ ] Create `useMaterialHistory` hook in useQueries.js
- [ ] Import `useMaterialHistory` in AdminRawMaterials.jsx
- [ ] Add React Query hook usage in component
- [ ] Remove `materialHistory` useState (derive from data)
- [ ] Remove `historyLoading` useState (use isLoading)
- [ ] Keep `historyFilter` and `historyPage` useState (UI state)
- [ ] Delete `fetchMaterialHistory` function definition
- [ ] Remove fetchMaterialHistory call from fetchAdvancedData()
- [ ] Remove filter change useEffect (React Query handles this)
- [ ] Update Tab 5 UI with loading/error states
- [ ] Add pagination controls

### After Migration
- [ ] Run grep again: Expected 0 matches for fetchMaterialHistory
- [ ] Run build: `npm run build`
- [ ] Test in browser
- [ ] Verify initial load works
- [ ] Verify filter change triggers refetch
- [ ] Verify pagination works
- [ ] Verify error handling works
- [ ] Verify refresh button works

### Rollback Plan
If issues occur, restore from backup.
```

---

## Part 4: Final Migration Summary

### State Management Changes

| Tab | State Before | State After | Hook Created |
|-----|--------------|-------------|--------------|
| Tab 1 | `materials`, `loading` | React Query | `useRawMaterials`, `useUpsertRawMaterial` |
| Tab 2 | `readiness`, `readinessLoading` | React Query | `useProductionReadiness` |
| Tab 3 | `productionLog`, `logLoading` | React Query | `useProductionLog` |
| Tab 4 | `weeklyData`, `weeklyLoading`, `p2Summary` | React Query + Derived | `useP2Summary` |
| Tab 5 | `materialHistory`, `historyLoading` | React Query | `useMaterialHistory` |

### Functions Removed

| Function | Replaced With | Lines Removed |
|----------|---------------|---------------|
| `fetchRawMaterials()` | React Query auto-fetch | ~20 lines |
| `fetchProductionReadiness()` | React Query auto-fetch | ~20 lines |
| `fetchProductionLog()` | React Query auto-fetch | ~20 lines |
| `fetchP2Data()` | `refetchP2Data()` | ~25 lines |
| `fetchMaterialHistory()` | React Query auto-fetch | ~20 lines |

### Critical References to Update

Based on the `fetchProductionLog` incident, here's the reference audit for Phase 2.4 and 2.5:

#### Phase 2.4 - fetchP2Data References

| Line | Context | Action |
|------|---------|--------|
| ~85 | Function definition | DELETE |
| ~378 | Gilingan recording success | REPLACE with `refetchP2Data()` |
| ~403 | Retry handler | REPLACE with `refetchP2Data()` |
| ~434 | useEffect initial load | REMOVE (React Query handles) |
| ~439 | Interval refresh | REPLACE with `refetchP2Data()` |
| ~443 | useEffect dependencies | UPDATE |

#### Phase 2.5 - fetchMaterialHistory References

| Line | Context | Action |
|------|---------|--------|
| ~112 | Function definition | DELETE |
| ~? | In fetchAdvancedData() | REMOVE |
| ~? | Filter change useEffect | REMOVE entire useEffect |

### Testing Strategy

#### Automated Testing
```bash
# Pre-commit validation
npm run build

# Reference validation
grep -n "fetchP2Data" src/pages/AdminRawMaterials.jsx
grep -n "fetchMaterialHistory" src/pages/AdminRawMaterials.jsx

# Expected: 0 matches after migration
```

#### Manual Testing Checklist

```markdown
## Post-Migration Testing

### Tab 4 Testing
1. [ ] Navigate to /admin/raw-materials
2. [ ] Click Tab 4 (Rencana Mingguan)
3. [ ] Verify loading state appears
4. [ ] Verify P2 summary cards load
5. [ ] Verify weekly planning content displays
6. [ ] Record a gilingan → verify Tab 4 refetches
7. [ ] Wait 5 minutes → verify auto-refresh works
8. [ ] Trigger error (disable network) → verify error state
9. [ ] Click retry → verify refetch works

### Tab 5 Testing
1. [ ] Click Tab 5 (Riwayat Bahan Baku)
2. [ ] Verify loading state appears
3. [ ] Verify history table loads
4. [ ] Click filter "Stock In" → verify refetch
5. [ ] Click filter "Stock Out" → verify refetch
6. [ ] Click pagination next → verify page change
7. [ ] Click pagination prev → verify page change
8. [ ] Click refresh button → verify manual refetch
9. [ ] Trigger error → verify error state
10. [ ] Click retry → verify refetch works
```

---

## Part 5: Prevention Strategy - Never Miss a Reference Again

### Method 1: Pre-Migration Audit Script

Add to `package.json`:
```json
{
  "scripts": {
    "pre-migrate": "node scripts/audit-migration.js",
    "post-migrate": "node scripts/validate-migration.js"
  }
}
```

Create `scripts/audit-migration.js`:
```javascript
const fs = require('fs');
const path = require('path');

// Get function name from command line
const functionName = process.argv[2];
const filePath = process.argv[3] || 'src/pages/AdminRawMaterials.jsx';

if (!functionName) {
  console.error('Usage: npm run pre-migrate <functionName> [filePath]');
  console.error('Example: npm run pre-migrate fetchP2Data');
  process.exit(1);
}

console.log(`\n📋 Auditing references to "${functionName}" in ${filePath}...\n`);

const content = fs.readFileSync(path.resolve(filePath), 'utf8');
const lines = content.split('\n');

let references = [];
let definition = null;

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Check for function definition
  if (line.includes(`const ${functionName}`) || line.includes(`function ${functionName}`)) {
    definition = lineNum;
    console.log(`✓ Definition found at line ${lineNum}`);
  }
  
  // Check for function calls (not definition)
  const callPattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
  if (callPattern.test(line) && !line.includes(`const ${functionName}`) && !line.includes(`function ${functionName}`)) {
    references.push(lineNum);
    console.log(`  Reference at line ${lineNum}: ${line.trim().substring(0, 60)}...`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`  Definition: ${definition ? `Line ${definition}` : 'NOT FOUND'}`);
console.log(`  References: ${references.length} found`);
console.log(`  Total to update: ${references.length + (definition ? 1 : 0)}\n`);

if (references.length > 0) {
  console.log(`⚠️  ACTION REQUIRED:`);
  console.log(`  After migration, update or remove ${references.length} references`);
  console.log(`  Run: npm run post-migrate ${functionName}\n`);
}
```

Create `scripts/validate-migration.js`:
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const functionName = process.argv[2];
const filePath = process.argv[3] || 'src/pages/AdminRawMaterials.jsx';

if (!functionName) {
  console.error('Usage: npm run post-migrate <functionName> [filePath]');
  process.exit(1);
}

console.log(`\n🔍 Validating migration of "${functionName}"...\n`);

const content = fs.readFileSync(path.resolve(filePath), 'utf8');
const lines = content.split('\n');

let foundReferences = false;

lines.forEach((line, index) => {
  const callPattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
  if (callPattern.test(line) && !line.includes(`const ${functionName}`) && !line.includes(`function ${functionName}`)) {
    console.error(`❌ ERROR: Found orphaned reference at line ${index + 1}: ${line.trim()}`);
    foundReferences = true;
  }
});

if (foundReferences) {
  console.error(`\n❌ Migration validation FAILED!`);
  console.error(`   Found references to removed function "${functionName}"`);
  console.error(`   Fix these references before committing.\n`);
  process.exit(1);
} else {
  console.log(`✅ Migration validation PASSED!`);
  console.log(`   No orphaned references to "${functionName}" found.\n`);
  
  // Run build to verify
  console.log(`🔨 Running build to verify...`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`\n✅ Build successful! Migration complete.\n`);
  } catch (error) {
    console.error(`\n❌ Build failed! Fix build errors before committing.\n`);
    process.exit(1);
  }
}
```

### Method 2: IDE Search Pattern

Before starting any migration, run this search in your IDE:

**VS Code Search (Ctrl+Shift+F):**
```
Search: fetchFunctionName\(
Replace: (leave empty)
Files: src/pages/AdminRawMaterials.jsx
```

**Expected Results:**
- Count the number of matches
- Document each line number
- Plan replacement for each

### Method 3: Git Pre-Commit Hook

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash

echo "Running pre-commit migration validation..."

# List of migrated functions to check
MIGRATED_FUNCTIONS=(
  "fetchProductionLog"
  "fetchP2Data"
  "fetchMaterialHistory"
)

# Files to check
FILES_TO_CHECK=(
  "src/pages/AdminRawMaterials.jsx"
)

has_errors=false

for func in "${MIGRATED_FUNCTIONS[@]}"; do
  for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
      # Check for function calls (not definitions)
      matches=$(grep -n "${func}()" "$file" | grep -v "const ${func}" | grep -v "function ${func}")
      if [ ! -z "$matches" ]; then
        echo "❌ ERROR: Found orphaned reference to ${func}() in $file"
        echo "$matches"
        has_errors=true
      fi
    fi
  done
done

if [ "$has_errors" = true ]; then
  echo ""
  echo "❌ Commit rejected! Fix orphaned function references before committing."
  exit 1
fi

echo "✅ No orphaned function references found."
exit 0
```

### Method 4: Code Review Checklist

Add to pull request template:

```markdown
## Migration Checklist

- [ ] **Pre-Migration Audit:** Ran `grep -n "functionName" Component.jsx` and documented all references
- [ ] **State Removal:** Removed all useState hooks for server data
- [ ] **Function Removal:** Deleted manual fetch function
- [ ] **Reference Updates:** Updated ALL function call references (count: N)
- [ ] **Post-Migration Validation:** Ran `grep -n "functionName" Component.jsx` and confirmed 0 matches
- [ ] **Build Verification:** `npm run build` succeeds with 0 errors
- [ ] **Manual Testing:** Tested all affected user flows in browser
```

---

## Part 6: Execution Plan

### Recommended Order

1. **Phase 2.4** (Tab 4: Rencana Mingguan)
   - Lower complexity
   - Single data source (P2 Summary)
   - Tests the prevention strategy

2. **Phase 2.5** (Tab 5: Riwayat Bahan Baku)
   - Higher complexity
   - Filtering and pagination
   - Validates the prevention strategy worked

### Timeline Estimate

| Phase | Estimated Time | Complexity |
|-------|----------------|------------|
| Phase 2.4 | 30-45 minutes | Medium |
| Phase 2.5 | 45-60 minutes | Medium-High |
| Testing | 30 minutes | - |
| **Total** | **1.5-2.25 hours** | - |

### Success Criteria

- ✅ Zero orphaned function references
- ✅ Production build succeeds
- ✅ All tabs load without errors
- ✅ Loading states display correctly
- ✅ Error states display with retry functionality
- ✅ Manual refresh buttons work
- ✅ Filter/pagination refetch works
- ✅ No runtime errors in browser console
- ✅ No new ESLint warnings

---

## Appendix A: Quick Reference Card

### Common Migration Pattern

```javascript
// BEFORE (Manual State)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await api.get('/api/endpoint', { auth: 'admin' });
    if (res.success) setData(res.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [dependency]);

useEffect(() => {
  fetchData();
}, [fetchData]);

// In JSX
{loading ? <Loading /> : <Content data={data} />}
```

```javascript
// AFTER (React Query)
const { 
  data, 
  isLoading: loading, 
  error,
  refetch: refetchData 
} = useCustomHook(dependency);

// In useQueries.js
export const useCustomHook = (dependency) => {
  return useQuery({
    queryKey: ['namespace', 'endpoint', dependency],
    queryFn: async () => {
      const res = await api.get('/api/endpoint', { auth: 'admin' });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 5,
  });
};

// In JSX
{loading && <Loading />}
{error && <Error onRetry={refetchData} />}
{!loading && !error && <Content data={data} />}
```

### Function Reference Replacement Table

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| `fetchData()` in useEffect | REMOVE | React Query auto-fetches on mount |
| `fetchData()` in event handler | `refetchData()` | Manual trigger |
| `fetchData()` in interval | `refetchData()` | Keep interval |
| `loading` state | `isLoading` | React Query standard |
| `data` state | `data` | Same name |
| `error` state | `error` | React Query standard |

---

## Appendix B: Error Recovery Guide

### If Build Fails

1. Check import statements
2. Check hook usage syntax
3. Check for typos in function names
4. Run `npm run build` and read error messages

### If Runtime Error Occurs

1. Open browser DevTools (F12)
2. Check Console tab for error messages
3. Check Network tab for failed API calls
4. Use React Query DevTools to inspect query state

### If Page Shows "Terjadi Kendala Memuat Halaman"

This indicates an error boundary caught an error:

1. Check browser console for the actual error
2. Look for "ReferenceError: functionName is not defined"
3. Run: `grep -n "functionName" Component.jsx`
4. Fix any orphaned references
5. Rebuild and test

### Rollback Procedure

```bash
# Restore from backup
cp src/pages/AdminRawMaterials.jsx.backup src/pages/AdminRawMaterials.jsx

# Rebuild
npm run build

# Test
npm run dev
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-09-29 | Kiro (AI Agent) | Initial technical specification |

---

## End of Document

This technical specification provides a complete guide for completing Phase 2.4 and 2.5 of the React Query migration, with specific focus on preventing the orphaned function reference issue discovered during Phase 2.3.

**Next Action:** Begin Phase 2.4 migration following the checklist in Part 2.
