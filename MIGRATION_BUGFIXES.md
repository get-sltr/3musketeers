# Migration Bug Fixes 🐛

**Date:** January 2025  
**Status:** 🔴 Issues found after Socket.io migration

---

## 🐛 BUGS IDENTIFIED

### 1. Map Not Showing (CRITICAL)
**Problem:** Map tiles not loading because `isConnected` starts as `false`

**Root Cause:** 
- `useMapRealtime()` hook initializes with `isConnected: false`
- MapboxUsers waits for `isConnected: true` before rendering map features
- If user isn't logged in or Supabase fails, map never loads

**Fix Applied:** Modified `useMapRealtime.ts` to:
- Set `isConnected: true` even when no user is authenticated
- Allow map to work without realtime features
- Add proper cleanup with `isMounted` flag

---

### 2. Tap Function Not Working
**Problem:** Tap button not responding when clicked on map pins

**Root Cause:** Needs investigation - callbacks are being passed correctly

**Possible Causes:**
1. Event propagation being stopped too early
2. Z-index issues with hover card
3. Button not receiving click events

**Status:** ⏸️ Needs testing after map fix

---

### 3. Three.js Header Overlap
**Problem:** Three.js canvas overlapping map header

**Root Cause:** Z-index conflict

**Fix Needed:** Check z-index values in:
- HoloPinsLayer (WebGL canvas)
- Map header components
- Hover card (currently `z-50`)

---

## 🔧 FIXES APPLIED

### Fix 1: useMapRealtime.ts - Allow map to load without auth

**Before:**
```typescript
if (!user) {
  console.warn('⚠️ No authenticated user for map realtime')
  return // Map won't load!
}
```

**After:**
```typescript
if (!user) {
  console.warn('⚠️ No authenticated user for map realtime')
  setIsConnected(true) // Allow map to load anyway
  return
}
```

**Also Added:**
- `isMounted` flag to prevent state updates after unmount
- Error handling that still allows map to load
- Better async cleanup

---

## 🧪 TESTING NEEDED

1. **Test Map Display:**
   - Open `/holo-map`
   - Verify map tiles load
   - Verify pins appear

2. **Test Tap Function:**
   - Hover over a pin
   - Click the "Tap" button in the drawer
   - Verify it navigates to `/messages?conversation=USER_ID&tap=1`

3. **Test Header Overlap:**
   - Check if Three.js particles appear over the header
   - Verify header is clickable

---

## 🚨 ADDITIONAL ISSUES TO INVESTIGATE

### Push Notifications Not Working
**Possible Causes:**
1. Railway backend still being called (old Socket.io endpoint)
2. Service worker not registered
3. VAPID keys not configured

**Files to Check:**
- `src/hooks/useNotifications.ts` (lines 59-73)
- Railway backend: `backend/server.js` (lines 779-815)

**Fix Options:**
1. Migrate push notifications to Next.js API routes
2. Or keep Railway and remove only Socket.io code

---

## 📊 PRIORITY

| Issue | Priority | Status |
|-------|----------|--------|
| Map not showing | 🔴 CRITICAL | ✅ Fixed |
| Tap not working | 🟡 HIGH | ⏸️ Testing |
| Three.js overlap | 🟡 HIGH | ⏸️ Pending |
| Push notifications | 🟢 MEDIUM | ⏸️ Pending |

---

**Next steps:** Test the map fix, then debug tap function and z-index issues.
