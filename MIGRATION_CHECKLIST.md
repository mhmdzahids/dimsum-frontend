# Migration Checklist

## Phase 1: Setup - ✅ COMPLETED

### ✅ 1. Install Dependencies
- [x] `npm install @tanstack/react-query @tanstack/react-query-devtools zustand`

### ✅ 2. Create Zustand Stores
- [x] `stores/authStore.js` - Admin + Customer auth with localStorage persistence
- [x] `stores/uiStore.js` - UI state (modals, toasts, search queries)

### ✅ 3. Create Query Provider
- [x] `providers/QueryProvider.jsx` - React Query setup with security defaults
- [x] Secure cache settings (staleTime, cacheTime, retry logic)
- [x] DevTools only in development

### ✅ 4. Update Main Application
- [x] Update `main.jsx` to wrap with QueryProvider
- [x] Initialize auth stores on app start
- [x] Maintain backward compatibility with existing AuthContext

### ✅ 5. Create Enhanced API Client
- [x] `api/secureClient.js` - Token refresh, request/response interceptors
- [x] Automatic 401 handling with refresh retry
- [x] Backward compatible with original `api/client.js`

### ✅ 6. Create React Query Hooks
- [x] `hooks/useQueries.js` - Common query patterns for admin pages
- [x] `hooks/useAuth.js` - Enhanced auth hooks with cache clearing
- [x] Security-sensitive queries configured (cacheTime: 0)

### ✅ 7. Add Backend Token Refresh
- [x] `POST /api/auth/refresh` endpoint in `auth/routes.py`
- [x] Token renewal without requiring re-login

### ✅ 8. Update AuthContext
- [x] Refactor `context/AuthContext.jsx` to use Zustand
- [x] Integrate with React Query cache clearing
- [x] Maintain existing API for backward compatibility

### ✅ 9. Create Example Component
- [x] `pages/AdminRawMaterialsRefactored.jsx` - Demonstration of migration
- [x] Showcase reduction from 35+ useState to 2 hooks

### ✅ 10. Create Documentation
- [x] `MIGRATION_GUIDE.md` - Complete migration documentation
- [x] Architecture, benefits, patterns, troubleshooting

---

## Phase 2: Component Migration

### High Priority (Inventory Control - P1)

#### 1. AdminRawMaterials.jsx
- [ ] Create React Query hooks for all endpoints:
  - [ ] `useRawMaterials()` - Main materials list
  - [ ] `useTransactions()` - Material transactions
  - [ ] `useProductionLog()` - Daily production log
  - [ ] `useWeeklyPlanning()` - Weekly planning data
- [ ] Replace useState for server data with React Query
- [ ] Replace useState for UI state with Zustand (`useUIStore`)
- [ ] Remove manual fetch functions
- [ ] Update mutations to use React Query
- [ ] Test loading states, error states, refetching
- [ ] Verify cache invalidation on mutations

#### 2. AdminStockOut.jsx
- [ ] Create query hooks for stock out data
- [ ] Migrate from useState to React Query
- [ ] Use Zustand for UI state
- [ ] Test stock out creation/invalidation

#### 3. AdminProducts.jsx
- [ ] Create query hooks for products
- [ ] Migrate product CRUD operations
- [ ] Handle product images/uploads

### Medium Priority (Production Planning - P2)

#### 4. AdminProduction.jsx
- [ ] Create hooks for production batches, lots
- [ ] Migrate production planning UI
- [ ] Handle real-time updates

#### 5. AdminInventoryDashboard.jsx
- [ ] Create hooks for dashboard metrics
- [ ] Migrate charts and KPIs
- [ ] Handle dashboard refreshes

#### 6. AdminQCHistory.jsx
- [ ] Create hooks for QC data
- [ ] Migrate quality control history

### Low Priority

#### 7. Other Admin Pages
- [ ] AdminBanners.jsx
- [ ] AdminVouchers.jsx
- [ ] AdminUsers.jsx
- [ ] AdminTransactions.jsx

#### 8. Customer Pages
- [ ] Menu.jsx
- [ ] Profile.jsx
- [ ] OrderHistory.jsx

---

## Phase 3: Security & Performance

### Security Checks
- [ ] All DevTools disabled in production build
- [ ] Token refresh working on 401
- [ ] Cache cleared on logout
- [ ] Sensitive data not cached
- [ ] Permission checks in query `enabled` options

### Performance Checks
- [ ] localStorage reads reduced by ~97%
- [ ] Request deduplication working
- [ ] Background refetch working
- [ ] Cache invalidation working
- [ ] No memory leaks in long sessions

### Testing Checklist per Component
For each migrated page, verify:

#### Data Loading
- [ ] Data loads on initial render
- [ ] Loading states display correctly
- [ ] Error states show helpful messages
- [ ] Retry works on network errors
- [ ] Stale data refetched on focus

#### Mutations
- [ ] Create operations invalidate cache
- [ ] Update operations invalidate cache
- [ ] Delete operations invalidate cache
- [ ] Error states for failed mutations
- [ ] Loading states during mutations

#### UI State
- [ ] Modals open/close correctly
- [ ] Search filters work
- [ ] Toast notifications show
- [ ] Loading indicators work

#### Security
- [ ] Logout clears all cached data
- [ ] Token not exposed in DevTools
- [ ] No localStorage reads in component
- [ ] Permission checks working

---

## Phase 4: Deployment & Monitoring

### Build & Deployment
- [ ] Production build succeeds (`npm run build`)
- [ ] DevTools not included in production bundle
- [ ] Verify environment-specific settings
- [ ] Test token refresh in production-like environment

### Monitoring
- [ ] Add React Query logging in development
- [ ] Monitor cache hit rates
- [ ] Track mutation success rates
- [ ] Monitor token refresh success

### Fallback Plan
- [ ] Keep original API client as backup
- [ ] AuthContext maintains compatibility
- [ ] Gradual rollout possible
- [ ] Rollback procedure documented

---

## Quick Start Testing

To verify the current setup:

1. **Start the development server:**
```bash
cd front-end
npm run dev
```

2. **Test the refactored example:**
- Open `AdminRawMaterialsRefactored` component
- Verify data loads without console errors
- Check React Query DevTools (bottom-right)
- Test search and modal functionality

3. **Verify security features:**
- Logout should clear all cached data
- DevTools should only show in development
- Token refresh endpoint should work

4. **Check performance:**
- Network tab should show deduplicated requests
- localStorage reads should be minimal
- No memory leaks after page navigation

---

## Common Issues & Solutions

### Issue: "useQueryClient must be used within QueryProvider"
**Solution:** Ensure `QueryProvider` wraps your app in `main.jsx`

### Issue: Zustand state not updating
**Solution:** Use proper selector syntax: `useUIStore(state => state.modals)`

### Issue: Cache not invalidating
**Solution:** Check query keys match exactly. Use `queryClient.invalidateQueries({ queryKey: ['key'] })`

### Issue: Infinite fetch loop
**Solution:** Ensure query key is stable (no object literals in queryKey array)

### Issue: 401 errors not handled
**Solution:** Import from `api/secureClient.js` instead of `api/client.js`

---

## Progress Tracking

| Component | Status | Est. Hours | Completed |
|-----------|--------|------------|-----------|
| Setup & Infrastructure | ✅ | 8 | Today |
| AdminRawMaterials.jsx | ✅ | 4 | Complete |
| AdminStockOut.jsx | ⭕ | 3 | Day 2 |
| AdminProducts.jsx | ⭕ | 3 | Day 2 |
| AdminProduction.jsx | ⭕ | 4 | Day 3 |
| AdminInventoryDashboard.jsx | ⭕ | 3 | Day 3 |
| All Other Components | ⭕ | 12 | Day 4-5 |
| Testing & Optimization | ⭕ | 4 | Day 6 |

**Total Estimated Time:** 35-40 hours

---

## Success Criteria

The migration is complete when:

1. **All admin pages** use React Query for server state
2. **All admin pages** use Zustand for client state  
3. **Zero console errors** in development
4. **90%+ reduction** in useState hooks across the codebase
5. **97% reduction** in localStorage token reads
6. **All CRUD operations** trigger automatic cache invalidation
7. **Security features** active (token refresh, cache clear on logout)
8. **Performance improved** (caching, deduplication, background refetch)
9. **Backward compatibility** maintained for existing code

---

## Getting Help

- Check `MIGRATION_GUIDE.md` for detailed patterns
- Review `AdminRawMaterialsRefactored.jsx` for working example
- Use React Query DevTools for debugging
- Enable React Query logging: `{ logger: console }`
- Test in isolation: Each component can be migrated independently

---

**Last Updated:** Today (Phase 1 Complete)  
**Next Action:** Start migrating `AdminRawMaterials.jsx` using the refactored example as template
