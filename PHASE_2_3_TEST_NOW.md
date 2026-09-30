# Phase 2.3: Tab 3 Migration - Test Now! 🧪

**Migration Complete:** Tab 3 (Laporan Lot Gilingan / Production Log) now uses React Query  
**Dev Server:** Running on `http://localhost:5174`  
**Backend:** Should be running on `http://127.0.0.1:5000`

---

## Quick Start Testing

### 1. Start Backend (if not running)
```bash
cd C:\Users\Zahid\Documents\Project\dimsum\back-end
python -m flask run --host=127.0.0.1 --port=5000
```

### 2. Open Frontend
```
http://localhost:5174
```

### 3. Navigate to Raw Materials Page
1. Login as admin
2. Go to **Inventory → Raw Materials (Bahan Baku)**
3. Click on **Tab 3: Laporan Lot Gilingan** tab

---

## What to Test

### ✅ Tab 3 (Laporan Lot Gilingan) - React Query Migration

#### A. Loading States
- [ ] **Initial load:** Should show 4 skeleton cards + table skeleton with pulse animation
- [ ] **Smooth transition:** Loading state fades in smoothly
- [ ] **Card layout:** Skeleton maintains the 2-column (mobile) / 4-column (desktop) layout

#### B. Summary Cards
- [ ] **Total Hari Tercatat:** Shows number of production days recorded
- [ ] **Gilingan Aktual:** Shows total actual vs target gilingan
- [ ] **Hari Tercapai:** Shows number of days target was achieved
- [ ] **Pencapaian:** Shows overall achievement percentage
  - [ ] Green (≥90%) when achievement is high
  - [ ] Amber (<90%) when achievement is lower

#### C. Production Log Table
- [ ] **Headers display correctly:** Tanggal, Target, Aktual, Gap, Pencapaian, Catatan, PJ
- [ ] **Date format:** Shows formatted date (e.g., "Mon, 29 Sep")
- [ ] **Gap column:** Shows positive (green) for exceeded target, negative (red) for below target
- [ ] **Achievement badge:** Green "Tercapai" for achieved days, red "Di bawah target" for below
- [ ] **Notes column:** Displays truncated notes if too long
- [ ] **PJ column:** Shows creator name

#### D. Data Display
- [ ] **Empty state:** Shows helpful message when no logs exist
- [ ] **Data rows:** Table displays all production logs from backend
- [ ] **Row coloring:** Rows below target show subtle red background
- [ ] **Hover effect:** Rows highlight on hover

#### E. React Query Behavior
- [ ] **Auto-refetch:** After 1 minute of stale data, switching tabs refetches
- [ ] **Cache persistence:** Tab 3 data stays cached for 5 minutes
- [ ] **Error handling:** If backend is down, shows red error banner with "Coba Lagi" button
- [ ] **Retry button:** Clicking "Coba Lagi" refetches data
- [ ] **DevTools:** Open React Query DevTools (bottom-left icon) to see query status

#### F. Tab Switching
- [ ] Switch to **Tab 1 (Inventory)** → React Query maintains cache
- [ ] Switch to **Tab 2 (Kesiapan H-1)** → React Query maintains cache
- [ ] Switch back to **Tab 3** → Should not refetch if within 5 minutes
- [ ] Wait 1+ minute and switch back → May show stale indicator (if DevTools supports)

#### G. Refresh Button
- [ ] **Refresh button** in table header should manually refetch data
- [ ] **Loading animation:** Spinner should animate while loading
- [ ] **Disabled state:** Button disabled while loading

---

## React Query DevTools

Look for this icon in the **bottom-left corner** of the page:  
🔴 Red circle = error  
🟡 Yellow circle = loading  
🟢 Green circle = success  

Click it to open DevTools and inspect:
- **Query Key:** `['admin', 'production-log', 30]`
- **Status:** loading / success / error
- **Data:** Full production log response with logs[] and summary{}
- **Last Updated:** Timestamp of last fetch
- **Stale Time:** 60000ms (1 minute)
- **Cache Time:** 300000ms (5 minutes)

---

## Expected Behavior

### Scenario 1: Data Available (Most Common)
```
Loading State: 4 skeleton cards + table skeleton appear for 0.5-2 seconds

Success State:
- Summary cards show actual numbers
- Achievement color: Green (≥90%) or Amber (<90%)
- Table shows 10-30 production logs
- Each row displays date, targets, achievement status
```

### Scenario 2: Empty Data (No Production Logs)
```
Summary Cards: All show 0

Table:
- Empty state message:
  "Belum ada data lot harian. Gunakan tombol 
   'Catat Gilingan Hari Ini' untuk mulai mencatat."
- Icon showing empty state
```

### Scenario 3: Backend Error (Network/Auth Issue)
```
Status: Error ❌
Cards: Hidden or empty
Content: Red error banner with alert icon
Message: "Gagal memuat laporan lot gilingan"
Subtext: Error message from backend
Button: "Coba Lagi" to retry
```

---

## Test Different Scenarios

### Test 1: Normal Production Data
- **Expected:** Summary cards show realistic numbers
- **Expected:** Table has 10-30 rows of production logs
- **Expected:** Some days should show "Tercapai" (achieved), some "Di bawah target"
- **Verify:** Achievement percentage reflects actual vs target gilingan

### Test 2: Check Cache Behavior
1. Open Tab 3 (triggers initial fetch)
2. Wait 1-2 seconds for data to load
3. Switch to Tab 1 (cache maintained)
4. Switch back to Tab 3 within 5 minutes (should NOT refetch)
5. Open DevTools → should show data without loading spinner
6. Wait 6+ minutes and switch back → should refetch

### Test 3: Manual Refresh
1. Click "Refresh" button in table header
2. Should see loading spinner
3. Table should update with fresh data
4. DevTools should show new request

### Test 4: Error Recovery
1. Stop backend (Ctrl+C)
2. Wait for error banner to appear
3. Click "Coba Lagi" button
4. Should attempt to retry
5. Restart backend
6. Click "Coba Lagi" again
7. Data should load successfully

---

## Common Issues & Solutions

### Issue: "Gagal memuat laporan lot gilingan"
**Cause:** Backend not running or API endpoint error  
**Solution:**
1. Check backend is running: `http://127.0.0.1:5000/api/health`
2. Check terminal for backend errors
3. Verify admin token is valid (check AuthContext/localStorage)
4. Click "Coba Lagi" button to retry

### Issue: Loading state never ends
**Cause:** API request stuck or timeout  
**Solution:**
1. Open DevTools → Network tab
2. Look for request to `/api/inventory/raw-materials/production-log?limit=30`
3. Check if request is pending, failed, or timing out
4. Refresh page and try again

### Issue: Data not updating after refresh
**Cause:** React Query cache or network issue  
**Solution:**
1. Open React Query DevTools
2. Look for query key `['admin', 'production-log', 30]`
3. Click "Refetch" in DevTools
4. Check Network tab for actual request

### Issue: Old data showing after long time
**Cause:** Cache time set to 5 minutes  
**Solution:**
- This is intentional for Tab 3 (historical data doesn't change frequently)
- Data is marked "stale" after 1 minute but stays cached for 5 minutes
- Manual refresh forces immediate refetch

---

## Performance Checks

### Network Tab (Chrome DevTools)
- [ ] Request to production-log endpoint only fires once on initial load
- [ ] No duplicate requests within 5 minutes
- [ ] Request includes `Authorization: Bearer <token>` header
- [ ] Response time < 500ms (should be fast)
- [ ] Response includes both `logs[]` and `summary{}`

### React Query DevTools
- [ ] Query status transitions: loading → success
- [ ] Cache persists for 5 minutes
- [ ] No memory leaks (old queries garbage collected)
- [ ] dataUpdatedAt timestamp updates correctly
- [ ] Stale flag set after 1 minute

### Console Tab
- [ ] No React warnings about missing keys
- [ ] No errors about undefined productionLog data
- [ ] No 401 Unauthorized errors (should auto-refresh token)
- [ ] No CORS errors (Vite proxy should handle)

---

## Success Criteria

All of the following should work:
- ✅ Tab 3 loads without errors
- ✅ Loading skeleton displays during fetch
- ✅ Summary cards display correct statistics
- ✅ Table displays production logs correctly
- ✅ Empty state shows when no data
- ✅ Error state shows if backend fails
- ✅ Retry button works
- ✅ Refresh button works
- ✅ React Query DevTools shows proper cache behavior
- ✅ Data persists in cache for 5 minutes
- ✅ No console errors or warnings

---

## Next: Phase 2.4

Once Tab 3 testing is complete and verified, we'll migrate:
- **Tab 4:** Rencana Mingguan (Weekly Planning)
- **Tab 5:** Riwayat Bahan Baku (Material History)

---

## Need Help?

If you encounter issues:
1. Check `PHASE_2_3_COMPLETE.md` for implementation details
2. Review `MIGRATION_GUIDE.md` for React Query patterns
3. Check backend logs for API errors
4. Open React Query DevTools for cache inspection
5. Check Network tab in Chrome DevTools

---

**Happy Testing! 🎉**

Frontend: `http://localhost:5174`  
Backend: `http://127.0.0.1:5000`  
DevTools: React Query icon (bottom-left) + Chrome DevTools (F12)

**Tab 3 Status:** ✅ Ready for testing
**Previous Tabs:** ✅ Tab 1 & 2 completed and tested
**Migration Progress:** 3/5 tabs completed (60%)
