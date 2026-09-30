# Phase 2.4 & 2.5 Migration - Quick Reference

**Document Version:** 1.0  
**Date:** 2026-09-29  
**Status:** Ready for Implementation

---

## TL;DR - What's Left

### Phase 2.4: Tab 4 - Rencana Mingguan (Weekly Planning)
- **Current State:** Manual `fetchP2Data()` function with useState
- **Target:** React Query hook `useP2Summary()`
- **Time Estimate:** 30-45 minutes
- **Complexity:** Medium

**Key Changes:**
```javascript
// Remove these
- const [weeklyData, setWeeklyData] = useState(null);
- const [weeklyLoading, setWeeklyLoading] = useState(false);
- const fetchP2Data = useCallback(...) // DELETE entire function

// Add this
const { data: p2Data, isLoading: p2Loading, error: p2Error, refetch: refetchP2Data } = useP2Summary();

// Replace references (6 total)
Line ~378: fetchP2Data() → refetchP2Data()
Line ~403: fetchP2Data() → refetchP2Data()
Line ~434: fetchP2Data() → REMOVE (React Query auto-fetches)
Line ~439: fetchP2Data() → refetchP2Data()
Line ~443: Update dependency array
```

### Phase 2.5: Tab 5 - Riwayat Bahan Baku (Material History)
- **Current State:** Manual `fetchMaterialHistory()` function with useState
- **Target:** React Query hook `useMaterialHistory()`
- **Time Estimate:** 45-60 minutes
- **Complexity:** Medium-High (includes pagination & filtering)

**Key Changes:**
```javascript
// Remove these
- const [materialHistory, setMaterialHistory] = useState([]);
- const [historyLoading, setHistoryLoading] = useState(false);
- const fetchMaterialHistory = useCallback(...) // DELETE

// Keep UI state (not server state)
- const [historyFilter, setHistoryFilter] = useState('all');
- const [historyPage, setHistoryPage] = useState(1);

// Add this
const { data: historyData, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useMaterialHistory({ action: historyFilter, page: historyPage });

// Replace references (3 total)
Line ~112: fetchMaterialHistory() → REMOVE in fetchAdvancedData()
Line ~??: Filter change useEffect → REMOVE (React Query auto-refetches)
```

---

## Critical Issue from Phase 2.3: fetchProductionLog() Error

### What Happened
```
ReferenceError: fetchProductionLog is not defined
```

**Root Cause:** 3 references to the old function were not updated:
- Line 377: In gilingan recording success handler
- Line 402: In retry handler
- Line 433: In useEffect initialization

### Prevention for Phase 2.4 & 2.5

**Before starting migration, audit all references:**

```bash
# Phase 2.4 audit
grep -n "fetchP2Data" src/pages/AdminRawMaterials.jsx
# Expected: 6 matches (1 definition + 5 references)

# Phase 2.5 audit
grep -n "fetchMaterialHistory" src/pages/AdminRawMaterials.jsx
# Expected: 3 matches (1 definition + 2 references)
```

**After migration, validate all references removed:**

```bash
# Should return ZERO matches
grep -n "fetchP2Data" src/pages/AdminRawMaterials.jsx
grep -n "fetchMaterialHistory" src/pages/AdminRawMaterials.jsx
```

**Automated validation:**
```bash
npm run build  # Must succeed with 0 errors
```

---

## Migration Order

1. **Start with Phase 2.4** (simpler, less risk)
2. **Then Phase 2.5** (more complex, but validates strategy)

---

## Full Technical Details

See: `PHASE_2_4_2_5_TECHNICAL_SPEC.md`

This comprehensive document includes:
- ✅ Root cause analysis of fetchProductionLog() error
- ✅ Detailed migration steps for Phase 2.4
- ✅ Detailed migration steps for Phase 2.5
- ✅ Automated validation scripts
- ✅ Pre-commit hooks to prevent future issues
- ✅ Testing checklists
- ✅ Recovery procedures
- ✅ Line-by-line code examples

---

## Success Criteria

After both phases complete:
- ✅ 5/5 tabs migrated (100% complete)
- ✅ 0 orphaned function references
- ✅ Build succeeds with 0 errors
- ✅ All tabs load without errors
- ✅ All loading/error states work
- ✅ All refetch buttons work
- ✅ No console errors

---

## Next Steps

1. Read `PHASE_2_4_2_5_TECHNICAL_SPEC.md` for full details
2. Run pre-migration audit: `grep -n "fetchP2Data" src/pages/AdminRawMaterials.jsx`
3. Start Phase 2.4 migration
4. Verify with build and manual testing
5. Then proceed to Phase 2.5

---

**Phase 2.4 Complete! Ready to start Phase 2.5?** 🚀
