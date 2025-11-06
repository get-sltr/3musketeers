# 🧹 How to Clear All Caches - SLTR

## Quick Commands

### **Clear All Next.js Caches:**
```bash
cd /Users/lastud/Desktop/3musketeers
pkill -f "next dev"
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
npm run dev
```

### **Clear Browser Cache (Chrome/Edge):**
1. Open DevTools (F12 or Cmd+Option+I)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**
   - Or: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)

### **Clear Browser Cache (Safari):**
1. `Cmd+Option+E` - Clear caches
2. `Cmd+Shift+R` - Hard refresh

### **Clear Everything (Nuclear Option):**
```bash
cd /Users/lastud/Desktop/3musketeers
pkill -f "next dev"
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
rm -rf node_modules
npm install
npm run dev
```

---

## What Each Cache Does:

- **`.next/`** - Next.js build output and compiled routes
- **`node_modules/.cache/`** - Node module cache
- **`.swc/`** - SWC compiler cache
- **Browser Cache** - Cached JavaScript, CSS, and HTML files

---

## After Clearing Cache:

1. Wait for Next.js to compile (look for "Ready" in terminal)
2. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Try accessing: `http://localhost:3001/`

---

**Need help? The cache has been cleared and dev server restarted!**

