# Phase 2.2: Tab 2 Migration - Test Now! 🧪

**Migration Complete:** Tab 2 (Kesiapan H-1 / Production Readiness) now uses React Query  
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
3. Click on **Tab 2: Kesiapan H-1** tab

---

## What to Test

### ✅ Tab 2 (Kesiapan H-1) - React Query Migration

#### A. Loading States
- [ ] **Initial load:** Should show gray skeleton with pulse animation
- [ ] **Target change:** Changing target gilingan should show loading state briefly
- [ ] **Card 2 (overview):** Should show loading skeleton before data arrives

#### B. Data Display
- [ ] **Status banner:** Shows "SIAP" (green) or "KURANG" (red/amber) based on stock
- [ ] **Deficit count:** Shows number of materials that are insufficient
- [ ] **Target selector:** Buttons for 24, 30, 36, 40 should highlight active selection
- [ ] **Custom input:** Manual target input should work and trigger refetch
- [ ] **BOM table:** Shows all materials with required qty vs current stock

#### C. Interactive Features
- [ ] **Physical verification checkboxes:** Click checkbox to mark item as verified
- [ ] **"Centang Semua" button:** Should toggle all checkboxes
- [ ] **Deficit items grid:** Should only show when there are deficits
- [ ] **"Belanja Restock Sekarang" button:** Should open transaction modal for first deficit item
- [ ] **Daily verification form:** Should accept notes and submit successfully

#### D. React Query Behavior
- [ ] **Auto-refetch:** Changing target gilingan automatically fetches new data
- [ ] **Error handling:** If backend is down, shows red error banner with "Coba Lagi" button
- [ ] **Retry button:** Clicking "Coba Lagi" refetches data
- [ ] **DevTools:** Open React Query DevTools (bottom-left icon) to see query status

#### E. Tab Switching
- [ ] Switch to **Tab 1 (Inventory)** → React Query should maintain cache
- [ ] Switch back to **Tab 2** → Should not refetch if within 30 seconds (staleTime)
- [ ] Wait 30+ seconds and switch back → Should refetch automatically

---

## React Query DevTools

Look for this icon in the **bottom-left corner** of the page:  
🔴 Red circle = error  
🟡 Yellow circle = loading  
🟢 Green circle = success  

Click it to open DevTools and inspect:
- **Query Key:** `['productionReadiness', 36]` (or your target number)
- **Status:** loading / success / error
- **Data:** Full readiness response
- **Last Updated:** Timestamp of last fetch
- **Stale Time:** 30000ms (30 seconds)

---

## Expected Behavior

### Scenario 1: Sufficient Stock (All Ready)
```
Status: SIAP ✅
Card 2: Green with "SIAP"
Banner: "Bahan Baku Siap Produksi"
Deficit Grid: Hidden (no deficits)
BOM Table: All rows show "Mencukupi" badge
```

### Scenario 2: Insufficient Stock (Deficits)
```
Status: KURANG ⚠️
Card 2: Amber with "KURANG"
Banner: "Peringatan: Bahan Baku Belum Cukup"
Deficit Grid: Shows materials that are short
BOM Table: Some rows show "Kurang X kg/dus" badge
Button: "Belanja Restock Sekarang" appears
```

### Scenario 3: Backend Error (Network/Auth Issue)
```
Status: Error ❌
Card 2: Red with alert icon and "Gagal memuat"
Content: Red error banner with "Coba Lagi" button
DevTools: Shows error state with retry count
```

---

## Test Different Targets

Try changing target gilingan and observe:
- **24 gilingan:** Lower requirements, more likely to be sufficient
- **30 gilingan:** Medium requirements
- **36 gilingan:** Standard production target (default)
- **40 gilingan:** Higher requirements, more likely to show deficits
- **Custom (e.g., 50):** Should calculate correctly and refetch

---

## Common Issues & Solutions

### Issue: "Gagal memuat data kesiapan produksi"
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
2. Look for request to `/api/inventory/raw-materials/readiness?target_gilingan=...`
3. Check if request is pending, failed, or timing out
4. Refresh page and try again

### Issue: Data not updating when changing target
**Cause:** React Query cache or dependency not working  
**Solution:**
1. Open React Query DevTools
2. Look for query key `['productionReadiness', <number>]`
3. Should see new query key when target changes
4. If same query key, check `targetGilingan` state update

### Issue: Stale data displayed
**Cause:** Cache time configuration  
**Solution:**
- Data is cached for 30 seconds (staleTime)
- This is intentional to reduce API calls
- After 30 seconds, switching tabs will refetch
- Manual refetch: Change target or click retry button

---

## Performance Checks

### Network Tab (Chrome DevTools)
- [ ] Request to readiness endpoint only fires when target changes
- [ ] No duplicate requests within 30 seconds
- [ ] Request includes `Authorization: Bearer <token>` header
- [ ] Response time < 500ms (should be fast)

### React Query DevTools
- [ ] Query status transitions: loading → success
- [ ] Cache updates when new target selected
- [ ] No memory leaks (old queries garbage collected)
- [ ] dataUpdatedAt timestamp updates correctly

### Console Tab
- [ ] No React warnings about missing keys
- [ ] No errors about undefined readiness data
- [ ] No 401 Unauthorized errors (should auto-refresh token)
- [ ] No CORS errors (Vite proxy should handle)

---

## Success Criteria

All of the following should work:
- ✅ Tab 2 loads without errors
- ✅ Loading skeleton displays during fetch
- ✅ Data displays correctly after load
- ✅ Changing target gilingan refetches data
- ✅ Error state shows if backend fails
- ✅ Retry button works
- ✅ Physical verification checkboxes work
- ✅ Daily verification form submits
- ✅ React Query DevTools shows proper cache behavior
- ✅ No console errors or warnings

---

## Next: Phase 2.3

Once Tab 2 testing is complete and verified, we'll migrate:
- **Tab 3:** Laporan Lot Gilingan (Production Log)
- **Tab 4:** Rencana Mingguan (Weekly Planning)
- **Tab 5:** Riwayat Bahan Baku (Material History)

---

## Need Help?

If you encounter issues:
1. Check `PHASE_2_2_COMPLETE.md` for implementation details
2. Review `MIGRATION_GUIDE.md` for React Query patterns
3. Check backend logs for API errors
4. Open React Query DevTools for cache inspection

---

**Happy Testing! 🎉**

Frontend: `http://localhost:5174`  
Backend: `http://127.0.0.1:5000`  
DevTools: React Query icon (bottom-left) + Chrome DevTools (F12)
