# 🛡️ AI ASSISTANT SAFETY RULES - CRITICAL
**Launch Date: November 9, 2024**  
**Mode: PRE-LAUNCH PROTECTION**

---

## ⚠️ **MANDATORY RULES FOR ALL AI ASSISTANTS**

### 🚫 **ABSOLUTE DON'TS:**

1. **NEVER make changes without asking first**
2. **NEVER update dependencies** (unless critical security fix)
3. **NEVER refactor working code**
4. **NEVER make "improvements"** unless explicitly requested
5. **NEVER touch core architecture files** without approval
6. **NEVER skip validation steps**
7. **NEVER commit without backup**
8. **NEVER delete files** (user explicitly stated this)
9. **NEVER ignore TypeScript errors** that would break the build
10. **NEVER make changes that could break existing features**

---

## ✅ **REQUIRED BEFORE ANY CHANGE:**

### Step 1: BACKUP FIRST
```
User: I want to make a change

AI: "🔄 Creating backup first..."
[Run: npm run backup:full]
[Wait for completion]
[Confirm backup created]
```

### Step 2: SHOW WHAT YOU'LL CHANGE
```
AI: "📋 Here's what I'll change:

File: src/app/page.tsx
Current: [show current code]
Change: [show exact change with diff]
Reason: [why this is needed]
Risk: [what could break]
Rollback: [how to undo]

⏸️ AWAITING YOUR APPROVAL"
```

### Step 3: WAIT FOR EXPLICIT APPROVAL
```
DO NOT proceed until user explicitly says:
- "Yes"
- "Go ahead"
- "Approved"
- "Do it"

NOT approved:
- "Maybe"
- "I guess"
- "If you think so"
- Silence
```

### Step 4: MAKE CHANGE
```
After approval:
1. Make the EXACT change shown
2. No extras or "improvements"
3. Run: npm run validate:post
4. Report results
```

### Step 5: VERIFY
```
After change:
1. Run: npm run validate:post
2. Check build: npm run build (if critical file)
3. Report if validation passes or fails
4. If fails: ROLLBACK IMMEDIATELY
```

---

## 🔒 **LOCKED FILES - EXPLICIT APPROVAL REQUIRED**

These files require EXPLICIT approval before ANY change:

### Critical Core Files:
- `src/app/layout.tsx`
- `src/middleware.ts`
- `src/lib/supabase/client.ts`
- `next.config.js`
- `package.json`
- `tsconfig.json`
- `backend/server-enhanced.js`
- `backend/server.js`
- All `.env` files (NEVER touch)
- All `.sql` database files

### For Locked Files:
1. Show EXACT change you want to make
2. Explain WHY it's critical
3. Show RISK assessment
4. Show ROLLBACK plan
5. WAIT for explicit approval
6. If not approved, DON'T CHANGE

---

## 📋 **STANDARD RESPONSE FORMAT**

When user requests a change:

```
🛡️ SAFETY CHECK INITIATED

📦 Creating backup...
[Status: Backup created ✓]

📋 Change Plan:
- File: [filename]
- Type: [bug fix/feature/add/change]
- Impact: [what this affects]
- Risk: [low/medium/high]

🔄 Proposed Change:
[Show code diff]

⚡ Rollback Plan:
Run: npm run restore:last

⏸️ AWAITING YOUR APPROVAL

Please confirm: "Yes, proceed" or "No, don't change"
```

---

## 🚨 **EMERGENCY PROCEDURES**

### If Something Breaks:

1. **STOP IMMEDIATELY**
2. **Don't try to fix - rollback first**
3. Report to user:
```
🚨 ERROR DETECTED

Issue: [what broke]
Action: Rolling back to last backup
[Run: npm run restore:last]
Status: [restoration status]
Next: [what to do next]
```
4. **Wait for user direction**

---

## 📊 **DAILY PROTOCOL**

### When Project Opens:
1. Run: `npm run validate:daily`
2. Report status: ✅ Working or ❌ Issues
3. **DO NOT** make any "fixes" unless explicitly requested

### Before Making Changes:
1. Check CURRENT_WORKING_STATE.md
2. Verify feature is documented
3. Show user what's working
4. Get explicit approval before changes

---

## 🎯 **LAUNCH PRIORITY REMINDERS**

**Launch: November 9, 2024**
**Days Remaining: [UPDATE DAILY]**
**Priority: STABILITY > FEATURES**

Remember:
- ✅ Working code > Perfect code
- ✅ No errors > New features
- ✅ Stability > Improvements
- ✅ Safety > Speed

---

## 📝 **DOCUMENTATION REQUIREMENTS**

### After Any Change:
1. Update DAILY_LOG.md with:
   - What was changed
   - Why it was changed
   - Who approved it
   - Validation results

2. If core file changed:
   - Update CURRENT_WORKING_STATE.md
   - Document new status
   - Run validation

---

## ⚡ **QUICK REFERENCE**

### Before ANY change:
```bash
npm run backup:full      # Backup first
npm run validate:pre      # Check current state
```

### After change:
```bash
npm run validate:post    # Verify change worked
npm run build            # Check build (if critical)
```

### If breaks:
```bash
npm run restore:last     # Rollback immediately
```

---

## 🔐 **USER PROTECTIONS**

User has explicitly stated:
- ❌ NO deleting files (without permission)
- ❌ NO breaking changes
- ❌ NO 2-day fix cycles
- ✅ Project must stay running
- ✅ Launch in 9 days
- ✅ Presentation to Perplexity

**These are NON-NEGOTIABLE.**

---

**Remember: Better to ask and wait than to break and spend 2 days fixing.**

