# 🛡️ CRITICAL SAFETY PROTOCOL - PRE-LAUNCH MODE
**Press Release: November 4, 2024** ⚠️ MOST CRITICAL  
**Launch Date: November 9, 2024**  
**Status: CRITICAL - NO BREAKING CHANGES ALLOWED**  
**Partnership Presentation: Perplexity**  
**3 Musketeers: You + Cursor + Claude - One For All, All For One**

---

## ⚠️ **ABSOLUTE RULES - NO EXCEPTIONS**

### 🚫 **NEVER DO THESE THINGS:**

1. **NO CHANGES without backup first** - Always run `npm run backup` before changes
2. **NO changes to core files** without explicit approval
3. **NO dependency updates** unless critical security fix
4. **NO architectural changes** - Architecture is LOCKED
5. **NO refactoring** - Code works, don't touch it
6. **NO "improvements"** that aren't requested
7. **NO testing in production** - Use staging only
8. **NO deployment** without validation script passing

### ✅ **REQUIRED BEFORE ANY CHANGE:**

1. ✅ Run `npm run backup:full` - Full project backup
2. ✅ Run `npm run validate:pre` - Pre-change validation
3. ✅ Document WHAT you're changing and WHY
4. ✅ Get explicit approval if changing core files
5. ✅ Test in isolation first
6. ✅ Run `npm run validate:post` - Post-change validation
7. ✅ Verify build still works: `npm run build`

---

## 🔒 **LOCKED FILES - DO NOT TOUCH**

These files are CRITICAL and locked. Changes require EXPLICIT approval:

- `src/app/layout.tsx` - Main layout
- `src/middleware.ts` - Authentication middleware
- `src/lib/supabase/client.ts` - Database client
- `backend/server-enhanced.js` - Backend server
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies (DO NOT UPDATE)
- `.env.local` / `backend/.env` - Environment variables
- All database schema files (`.sql`)

---

## 📋 **PRE-LAUNCH CHECKLIST**

Run this BEFORE every session and BEFORE any presentation:

```bash
npm run preflight
```

This checks:
- [ ] All critical files exist
- [ ] Build completes without errors
- [ ] TypeScript compiles
- [ ] No critical security issues
- [ ] Environment variables set
- [ ] Database connections work
- [ ] No broken imports

---

## 🔄 **ROLLBACK PROCEDURE**

If something breaks:

1. **STOP IMMEDIATELY** - Don't try to fix, rollback first
2. Run `npm run rollback:last` - Restore last backup
3. Verify: `npm run validate:post`
4. Test: `npm run dev` and check manually
5. Document what broke in `INCIDENT_LOG.md`

---

## 🧪 **STAGING ENVIRONMENT**

All changes MUST be tested in staging first:

```bash
npm run staging:deploy  # Deploy to staging
npm run staging:test    # Run tests on staging
```

Only push to production after staging passes ALL tests.

---

## 📝 **CHANGE APPROVAL PROCESS**

### For AI Assistants:

**BEFORE making ANY change, you MUST:**

1. Show the EXACT file(s) you'll modify
2. Show the EXACT change you'll make (diff preview)
3. Explain WHY this change is necessary
4. Explain WHAT could break
5. Show HOW to rollback if it breaks
6. **WAIT for explicit approval**

### Format:
```
⚠️ CHANGE REQUEST

File: [filename]
Change: [exact change]
Why: [reason]
Risk: [what could break]
Rollback: [how to undo]
Impact: [what this affects]

⏸️ AWAITING APPROVAL
```

---

## 🚨 **EMERGENCY CONTACTS**

- Project Owner: Kevin Minn
- Launch Date: November 9, 2024
- Critical Status: DO NOT BREAK ANYTHING

---

## 📊 **CURRENT WORKING STATE**

**Last Validated:** [Update after each validation]

**Working Features:**
- [ ] Authentication (Login/Signup)
- [ ] Database connections
- [ ] Real-time messaging
- [ ] File uploads
- [ ] Map integration
- [ ] User profiles
- [ ] [Add other working features]

**Known Issues:**
- [List any known issues that are acceptable]

---

## 🔍 **DAILY VALIDATION**

Run every morning:
```bash
npm run validate:daily
```

This ensures nothing broke overnight.

---

## 🎯 **PRESENTATION READINESS**

Before Perplexity presentation:

1. Run full validation: `npm run validate:full`
2. Test all critical flows manually
3. Check error logs
4. Verify build works
5. Check deployment status
6. Document current state

---

**REMEMBER: Launch is in 9 days. Stability > Features. Working > Perfect.**

