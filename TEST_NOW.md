# 🎯 React Query + Zustand - Quick Verification Test

**Time:** Right now  
**Goal:** Verify everything works in 2 minutes

---

## ✅ Step 1: Start Server
Open PowerShell in `C:\Users\Zahid\Documents\Project\dimsum\front-end` and run:

```powershell
npm run dev
```

**Expected output:** Server starts on `http://localhost:5173`

---

## ✅ Step 2: Open Browser
1. Open Chrome/Firefox
2. Go to `http://localhost:5173`

---

## ✅ Step 3: Verify React Query DevTools
Look for this in the bottom-right corner:

```
⚛️ React Query DevTools
```

If you see it → ✅ React Query is working!

---

## ✅ Step 4: Test the Refactored Example
1. Navigate to `/admin/raw-materials-refactored`
2. You should see:
   - Raw materials list loading
   - React Query DevTools showing queries
   - "Add New Raw Material" button working

---

## ✅ Step 5: Test Security Features
### Token Persistence
1. Open DevTools → Application → Local Storage
2. Look for `auth-storage` key
3. Should have your auth data

### Cache Clearing
1. Log out
2. Check localStorage: `auth-storage` should be empty
3. React Query cache should be empty

---

## ✅ Step 6: Verify Build
In a **NEW PowerShell window** (while dev server runs):

```powershell
npm run build
```

**Expected:** Build completes in ~1 second with no errors

---

## ✅ Step 7: Test Real Component (Optional)
1. Navigate to a real admin page (like `/admin/raw-materials`)
2. It should still work (backward compatibility!)
3. But won't have the new features yet

---

## 🎉 Success Indicators

**Your new system is working if:**

- ✅ Server starts without errors
- ✅ Website loads
- ✅ React Query DevTools icon visible
- ✅ `/admin/raw-materials-refactored` works
- ✅ Build succeeds
- ✅ Existing pages still work

---

## 🐛 Common Issues & Fixes

### "npm run dev" fails
**Check:** `package.json` exists and has dev script
**Fix:** Run `npm install` if missing dependencies

### No React Query DevTools icon
**Check:** Development mode is active
**Fix:** Verify you're not running production build

### Page doesn't load
**Check:** Backend server is running
**Fix:** Start backend first (`cd back-end && python main.py`)

### LocalStorage not saving
**Check:** Browser has localStorage enabled
**Fix:** Try incognito mode or clear site data

---

## 📊 What You Should See Now

### In Browser Console (F12):
```
⚛️ React Query DevTools loaded
[QueryClient] cache cleared (on logout)
[Zustand] state updated
```

### In React Query DevTools:
- "Queries" tab showing active queries
- "Mutations" tab showing changes
- "Cached" tab showing stored data

### In Zustand (Redux DevTools):
- Auth state changes
- UI state changes (modals, etc.)

---

## 🚀 Ready to Migrate?

If all tests pass → **System is production-ready!**

**Start migrating components by:**
1. Open `pages/AdminRawMaterials.jsx`
2. Copy patterns from `pages/AdminRawMaterialsRefactored.jsx`
3. Update to use new hooks from `hooks/useQueries.js`

---

## ⚡ Quick Migration Pattern

### Before (Old way):
```javascript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### After (New way - 1 line!):
```javascript
const { data: items, isLoading, error } = useMyEndpoint();
```

---

## 📞 Quick Help

**Still having issues?**
1. Check `MIGRATION_GUIDE.md` troubleshooting section
2. Look at `AdminRawMaterialsRefactored.jsx` working example
3. Ask for help with specific error

---

## ✅ Final Check

Run this quick test in browser console:

```javascript
// Test React Query
console.log('React Query version:', window.ReactQuery?.version);

// Test Zustand
console.log('Zustand version:', window.Zustand?.version);

// Test auth store
const auth = window.store?.auth;
console.log('Auth state:', auth);
```

**If you see versions printed → ✅ Everything loaded correctly!**

---

**🎯 Now test with `npm run dev` and verify the system works!**
