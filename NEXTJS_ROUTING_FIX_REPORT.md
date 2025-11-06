# Next.js Routing Issue: Complete Diagnostic & Fix Report

**Date:** November 5, 2025  

**Project:** SLTR (3musketeers)  

**Issue:** Dev server returning 404 for all routes, Next.js reverting to pages router instead of app router

---

## Problem Summary

Next.js was unable to find any routes and showed "Route pages" instead of "Route app", only building `/` with a "not found" response. All routes returned 404 errors despite files existing and appearing correct.

---

## Root Cause

**Conflicting Directory Structure:** Two `app` directories existed simultaneously:

1. `/app/` (root level) - contained only a `help` folder

2. `/src/app/` (nested) - contained the actual application code

Next.js detected both directories and became confused about which router system to use, ultimately failing to properly load either.

---

## Why This Happens

### Next.js Router Detection Logic

Next.js 13+ uses a priority system for detecting which router to use:

1. **App Router (preferred):** Looks for `/app` or `/src/app` directory

2. **Pages Router (legacy):** Looks for `/pages` or `/src/pages` directory

3. **Conflict Resolution:** When multiple directories exist, Next.js may:

   - Choose the wrong directory

   - Fail to initialize properly

   - Default to pages router even without a pages directory

   - Cache incorrect build artifacts

### The Specific Problem

```
Project Structure (BROKEN):

3musketeers/

├── app/                    ← CONFLICT: Empty except for help/

│   └── help/

├── src/

│   ├── app/               ← ACTUAL APP: All your routes here

│   │   ├── page.tsx

│   │   ├── layout.tsx

│   │   ├── login/

│   │   ├── signup/

│   │   └── [other routes]/

│   └── components/

└── [other files]
```

Next.js tried to use `/app` but found it mostly empty, then got confused when it detected `/src/app` with actual content.

---

## Diagnostic Steps (For Next Time)

### Step 1: Check Directory Structure

```bash
# Navigate to project root
cd ~/Desktop/3musketeers

# List all potential routing directories
ls -d app pages src/app src/pages 2>/dev/null
```

**What to look for:**

- Multiple `app` or `pages` directories

- Both app router AND pages router directories

- Empty or partially populated directories

### Step 2: Verify Your Location

```bash
# Confirm you're in the project root
pwd

# Should output: /Users/lastud/Desktop/3musketeers
# (or wherever your project is)
```

**Common mistake:** Running commands from the wrong directory (e.g., `~/Desktop` instead of `~/Desktop/3musketeers`)

### Step 3: Check What's Actually in Each Directory

```bash
# If root app/ exists
ls -la app/

# If src/app/ exists
ls -la src/app/

# If pages/ exists
ls -la pages/

# If src/pages/ exists
ls -la src/pages/
```

**What you're looking for:**

- Which directory has `page.tsx` or `layout.tsx`?

- Which directory has your actual routes?

- Are there empty/conflicting directories?

### Step 4: Check Next.js Config

```bash
# View your Next.js configuration
cat next.config.js
# or
cat next.config.ts
# or
cat next.config.mjs
```

**Look for:**

- `pageExtensions` configuration

- Any custom directory settings

- Experimental features that might affect routing

### Step 5: Check Build Artifacts

```bash
# Check if .next exists and is stale
ls -la .next/

# Look at when it was last modified
ls -lt .next/ | head -5
```

**Problem indicator:** `.next` directory exists but is from an old build with the wrong directory structure.

---

## The Fix (Step-by-Step)

### Step 1: Identify the Conflict

```bash
cd ~/Desktop/3musketeers

# Check both locations
ls -la app/
ls -la src/app/
```

**Decision criteria:**

- Which directory has `page.tsx` and `layout.tsx`?

- Which directory has your actual application code?

- Which directory is just empty or has minimal content?

In your case:

- `/app/` only had `help/` folder → **DELETE THIS**

- `/src/app/` had all your routes → **KEEP THIS**

### Step 2: Remove Conflicting Directory

```bash
# Delete the empty/conflicting directory
rm -rf app/

# IMPORTANT: Make sure you're deleting the RIGHT one!
# In this case, we deleted the root app/ because it was empty
```

**WARNING:** Always verify which directory has your actual code before deleting!

### Step 3: Clear Build Cache

```bash
# Delete Next.js build artifacts
rm -rf .next

# This forces Next.js to do a clean build
```

**Why this is necessary:** `.next` contains cached routing information. If it was built with the wrong directory structure, it must be cleared.

### Step 4: Kill Zombie Processes (If Needed)

```bash
# If you get "EADDRINUSE" error
lsof -ti:3001 | xargs kill -9

# This kills any process using port 3001
```

**Common ports:**

- Development: `3000`, `3001`

- Production: `80`, `443`, `8080`

### Step 5: Start Fresh

```bash
# Start the dev server
npm run dev

# Should now show:
# ✓ Starting...
# ✓ Ready in [time]
```

### Step 6: Verify the Fix

```bash
# Open in browser
open http://localhost:3001
```

**Or manually navigate to:** `http://localhost:3001`

**What you should see:**

- Your landing page loads correctly

- No 404 errors

- Routes work as expected

- Browser console (F12) shows no routing errors

---

## Prevention Checklist

### Before Starting Development

- [ ] **Single app directory:** Use EITHER `/app` OR `/src/app`, never both

- [ ] **Consistent structure:** If using `/src`, put everything in there (`/src/app`, `/src/components`, etc.)

- [ ] **Clean .next:** Delete `.next` folder when switching directory structures

- [ ] **Check config:** Verify `next.config.js` doesn't have conflicting settings

### During Development

- [ ] **Don't create duplicate directories:** If `/src/app` exists, don't create `/app`

- [ ] **Version control:** Use Git to track directory structure changes

- [ ] **Document structure:** Keep a note of your chosen directory pattern

### When Issues Arise

- [ ] **First step:** Always check `ls -d app pages src/app src/pages`

- [ ] **Second step:** Delete `.next` folder

- [ ] **Third step:** Kill zombie processes

- [ ] **Fourth step:** Fresh `npm run dev`

---

## Common Error Messages & What They Mean

### "Route pages" instead of "Route app"

**Meaning:** Next.js is using pages router instead of app router  

**Cause:** Conflicting directories or missing app router setup  

**Fix:** Remove conflicting directories, verify `src/app/layout.tsx` exists

### "404 | This page could not be found"

**Meaning:** Next.js can't find the route  

**Cause:** Wrong directory structure, corrupted cache, or missing files  

**Fix:** Clear `.next`, verify correct directory structure

### "EADDRINUSE: address already in use"

**Meaning:** Another process is using the port  

**Cause:** Zombie dev server or another application  

**Fix:** `lsof -ti:3001 | xargs kill -9`

### "Could not read package.json: ENOENT"

**Meaning:** You're in the wrong directory  

**Cause:** Running commands from outside the project root  

**Fix:** `cd ~/Desktop/3musketeers`

---

## Your Specific Solution

### What Was Wrong

```
BEFORE (Broken):

/app/help/                    ← Conflict

/src/app/page.tsx            ← Actual app

/src/app/layout.tsx

/src/app/[all routes]/
```

### What We Fixed

```
AFTER (Fixed):

/src/app/page.tsx            ← Only app directory

/src/app/layout.tsx

/src/app/[all routes]/
```

### Commands Used

```bash
cd ~/Desktop/3musketeers
rm -rf app/
rm -rf .next
lsof -ti:3001 | xargs kill -9
npm run dev
```

**Result:** Server started successfully, all routes working.

---

## Quick Reference: Emergency Fix Commands

```bash
# 1. Navigate to project
cd ~/Desktop/3musketeers

# 2. Check for conflicts
ls -d app pages src/app src/pages 2>/dev/null

# 3. Remove conflicting directory (carefully!)
# rm -rf [conflicting-directory]

# 4. Clear cache
rm -rf .next

# 5. Kill zombie processes
lsof -ti:3001 | xargs kill -9

# 6. Fresh start
npm run dev
```

---

## Key Takeaways

1. **Never have duplicate routing directories** - Choose ONE location for your app router

2. **Clear .next when troubleshooting** - Cached builds can cause persistent issues

3. **Verify your location** - Many errors come from running commands in the wrong directory

4. **Use src/ consistently** - If you use `/src`, put everything in there

5. **Check before deleting** - Always verify which directory has your actual code

---

## Additional Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)

- [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure)

- [Troubleshooting Next.js](https://nextjs.org/docs/messages)

---

## When to Use This Guide

Use this troubleshooting process whenever you see:

- 404 errors on all routes

- "Route pages" instead of "Route app"

- Routes not building properly

- Next.js ignoring your app router

- Clean builds failing mysteriously

**Save this file** in your project root for quick reference: `NEXTJS_ROUTING_FIX_REPORT.md`

