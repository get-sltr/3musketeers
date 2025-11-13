# 🚀 SLTR PRE-LAUNCH CHECKLIST
**Target Launch:** Tomorrow (Tuesday, November 11, 2025) at 11:00 AM PST

---

## 📊 LAUNCH READINESS SUMMARY

### ✅ READY (Verified in codebase)
- Legal policies (Privacy, Terms, Guidelines, Cookies)
- Age verification (18+)
- Authentication & profiles
- Core dating features
- Multi-language support
- Stripe payment integration (code ready)
- Sentry error tracking (configured)

### ⚠️ CRITICAL BLOCKERS (Must fix before launch)
1. **Safety features using localStorage** - NOT production ready
2. **Database migrations not confirmed applied**
3. **Missing profiles table migration**

### 🔍 NEEDS VERIFICATION (Test before launch)
- Stripe environment variables configured
- Database migrations applied in production
- Email sending works
- Video calls work end-to-end

---

## 🔴 CRITICAL BLOCKERS (DO NOT LAUNCH WITHOUT FIXING)

### 1. Safety Features - PRODUCTION BLOCKER ⚠️
**Status:** 🔴 NOT READY FOR PRODUCTION

**Issue Found:**
- `src/lib/safety.ts` stores blocked users and reports in **localStorage only**
- No database persistence
- Not synced across devices
- Easily bypassed by clearing browser data

**What needs to happen:**
1. Create `blocked_users` table in Supabase:
```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);
```

2. Create `reports` table in Supabase:
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('harassment', 'fake', 'inappropriate', 'spam', 'other')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Update `src/lib/safety.ts` to use Supabase instead of localStorage

**Risk if launched as-is:**
- Users can unblock themselves
- No admin visibility into reports
- No user safety protections
- Potential legal liability

---

### 2. Database Migrations - NOT CONFIRMED ⚠️
**Status:** 🟡 NEEDS VERIFICATION

**Migrations found (7 files):**
- ✅ `20251103_add_places_groups.sql`
- ✅ `20251104_push_subscriptions.sql`
- ⚠️ `20251108_create_settings_table.sql` - **DAILY_LOG says "NEEDS TO BE RUN"**
- ✅ `20251109_create_profile_views_table.sql`
- ✅ `20251109_fix_photo_albums_storage.sql`
- ✅ `20251109_storage_policies.sql`
- ✅ `create_groups_table.sql`

**Missing Critical Migration:**
- ❌ **No `profiles` table creation script found**
  - Stripe webhook expects `founder`, `subscription_status`, `founder_number` columns
  - Need to verify table exists in production with correct schema

**Action Required:**
1. Log into Supabase Dashboard (https://supabase.com/dashboard)
2. Check if ALL migrations have been run
3. Run `20251108_create_settings_table.sql` if not applied
4. Verify `profiles` table exists with these columns:
   - `id` (UUID, primary key)
   - `username` (TEXT)
   - `founder` (BOOLEAN)
   - `subscription_status` (TEXT)
   - `founder_number` (INTEGER)
   - `age` (INTEGER)
   - `date_of_birth` (DATE)
   - `preferred_language` (TEXT)

---

### 3. Environment Variables - NEEDS VERIFICATION 🟡
**Status:** Check production environment (Vercel)

**Required for core functionality:**
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_FOUNDER_PRICE_ID=      # Must be real price ID from Stripe
STRIPE_MEMBER_PRICE_ID=       # Must be real price ID from Stripe

# Sentry (REQUIRED for error tracking)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Email (if using Resend)
RESEND_API_KEY=

# Daily.co (REQUIRED for video calls)
DAILY_API_KEY=
```

**Action Required:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Verify ALL required variables are set
3. Especially check:
   - Stripe price IDs (not placeholder values)
   - Stripe webhook secret (from Stripe Dashboard)
   - Daily.co API key

---

## ✅ VERIFIED READY

### Legal & Compliance ✅
- [x] Privacy Policy (14 sections, GDPR/CCPA compliant)
- [x] Terms of Service (19 sections, arbitration clause)
- [x] Community Guidelines (11 sections, crisis resources)
- [x] Cookie Policy (10 sections)
- [x] Legal Hub page created
- [x] All policies cross-linked

### Age Verification ✅
- [x] 18+ age check on signup (`src/app/signup/page.tsx:49-55`)
- [x] Date of birth stored in user metadata
- [x] Terms explicitly state 18+ requirement

### Authentication ✅
- [x] Signup flow with email verification
- [x] Login flow
- [x] Password reset
- [x] OAuth callback handling

### Core Features ✅
- [x] Discovery (grid/list/map views)
- [x] User profiles
- [x] Photo uploads & albums
- [x] Messaging
- [x] Video calls (Daily.co integration)
- [x] Profile views tracking
- [x] Location features

### Payment System (Code Ready) ✅
- [x] Stripe Checkout integration (`src/app/api/stripe/route.ts`)
- [x] Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`)
- [x] Founder's Circle (limited to 2000, one-time $199)
- [x] Member subscription (monthly $12.99)
- [x] Handles checkout.session.completed events
- [x] Updates user profiles with subscription status

**Still needs:** Verify environment variables are set in production

---

## 🧪 PRE-LAUNCH TESTING CHECKLIST

### High Priority Tests (Do before launch)
- [ ] **Test full signup flow**
  - [ ] Enter email, password, username, DOB
  - [ ] Verify age rejection works (try DOB that makes user under 18)
  - [ ] Check email received
  - [ ] Click verification link
  - [ ] Lands on /app successfully
  - [ ] Profile created in database

- [ ] **Test blocking (AFTER fixing localStorage issue)**
  - [ ] Block a user
  - [ ] Verify blocked user disappears from discovery
  - [ ] Verify can't message blocked user
  - [ ] Check database has block record

- [ ] **Test reporting (AFTER fixing localStorage issue)**
  - [ ] Report a user for harassment
  - [ ] Check report appears in database
  - [ ] Verify admin can see reports (if admin panel exists)

- [ ] **Test Stripe payment flow**
  - [ ] Try purchasing Founder's Circle
  - [ ] Use Stripe test card: 4242 4242 4242 4242
  - [ ] Complete checkout
  - [ ] Verify webhook received
  - [ ] Check `founder: true` in profiles table
  - [ ] Verify founder badge shows on profile

- [ ] **Test video calls**
  - [ ] Start video call with another user
  - [ ] Verify Daily.co room created
  - [ ] Both users can see/hear each other
  - [ ] End call successfully

- [ ] **Test on mobile**
  - [ ] iOS Safari - full flow
  - [ ] Android Chrome - full flow
  - [ ] Check responsive layout
  - [ ] Test bottom navigation

- [ ] **Test multi-language**
  - [ ] Switch language in user menu
  - [ ] Verify UI updates
  - [ ] Check localStorage saved preference

### Medium Priority Tests (If time permits)
- [ ] Test photo upload to albums
- [ ] Test group creation
- [ ] Test place check-ins
- [ ] Test push notifications
- [ ] Test map clustering
- [ ] Test profile editing
- [ ] Test password reset flow

### Low Priority Tests (Can test post-launch)
- [ ] Test all 6 languages thoroughly
- [ ] Test with slow network
- [ ] Test with VPN/different countries
- [ ] Load test with multiple users

---

## 🔧 INFRASTRUCTURE VERIFICATION

### Vercel Deployment ✅
- [x] Connected to GitHub
- [x] Auto-deploy on push to main
- [x] Latest commit deployed: `ed3c4f8` (Legal Hub page)

### Supabase Setup (Needs verification)
- [ ] All 7 migrations applied
- [ ] RLS policies enabled on all tables
- [ ] Storage buckets configured (`photos`, `avatars`)
- [ ] Storage policies allow authenticated uploads
- [ ] Auth email templates customized
- [ ] Auth redirect URLs configured (https://getsltr.com/*)

### DNS & Domain (Needs verification)
- [ ] getsltr.com points to Vercel
- [ ] SSL certificate active
- [ ] www.getsltr.com redirects to getsltr.com
- [ ] No mixed content warnings

### Monitoring Setup
- [ ] Sentry DSN configured in production
- [ ] Test error tracking (trigger test error)
- [ ] Check Sentry receives error
- [ ] Set up Sentry alerts for critical errors

### Email Setup (Needs verification)
- [ ] Email service configured (Resend or Supabase Auth)
- [ ] Test signup email sent
- [ ] Test password reset email sent
- [ ] Email templates look good
- [ ] Emails not going to spam

---

## 🚨 LAUNCH DAY PROTOCOL

### T-Minus 3 Hours (8:00 AM)
1. [ ] Run all High Priority Tests
2. [ ] Fix any critical bugs found
3. [ ] Deploy fixes to production
4. [ ] Verify fixes deployed successfully

### T-Minus 1 Hour (10:00 AM)
1. [ ] Final smoke test: signup, login, discovery, messaging
2. [ ] Check Sentry for any new errors
3. [ ] Verify database migrations all applied
4. [ ] Check Vercel deployment is green
5. [ ] Test payment flow one more time

### Launch Time (11:00 AM)
1. [ ] Announce launch
2. [ ] Monitor Sentry for errors in real-time
3. [ ] Watch server metrics in Vercel
4. [ ] Monitor Supabase connection pool usage
5. [ ] Be ready to hotfix critical issues

### T-Plus 1 Hour (12:00 PM)
1. [ ] Check error rates in Sentry
2. [ ] Verify users can sign up successfully
3. [ ] Check database for new users
4. [ ] Monitor payment webhooks if any purchases

---

## 🛠️ RECOMMENDED ACTIONS BEFORE LAUNCH

### MUST DO (Critical)
1. **Fix safety features** - Move blocking/reporting to database
2. **Verify ALL database migrations applied** in production Supabase
3. **Verify profiles table exists** with correct schema
4. **Test Stripe payment flow end-to-end** with test card
5. **Verify environment variables** set in Vercel production

### SHOULD DO (Important)
6. Set up error alerting in Sentry (email/Slack)
7. Create admin dashboard to view reports
8. Test email sending works (signup, password reset)
9. Verify video call Daily.co integration works
10. Mobile testing on real iOS/Android devices

### NICE TO HAVE (If time permits)
11. Set up Vercel analytics
12. Create monitoring dashboard
13. Set up database backups
14. Write incident response plan
15. Prepare launch announcement

---

## 📞 CONTACTS & RESOURCES

### Service Dashboards
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **Sentry:** https://sentry.io
- **Daily.co:** https://dashboard.daily.co

### Important Files
- `.env.example` - List of required environment variables
- `DAILY_LOG.md` - Development history and known issues
- `supabase/migrations/` - Database migration scripts
- `src/lib/safety.ts` - Safety features (needs fixing)

### Emergency Contacts
- Email: legal@sltr.app
- Support: support@sltr.app

---

## ✅ FINAL GO/NO-GO DECISION

### GO if:
- ✅ Safety features moved to database
- ✅ All database migrations applied
- ✅ Stripe payment flow tested and working
- ✅ Environment variables verified in production
- ✅ Core user journey tested (signup → discovery → messaging)

### NO-GO if:
- ❌ Safety features still using localStorage
- ❌ Database migrations not verified/applied
- ❌ Stripe not working or environment variables missing
- ❌ Critical bugs found during testing
- ❌ Email sending not working

---

## 🎯 RECOMMENDATION

**CURRENT STATUS:** 🟡 **NOT READY** (critical blockers present)

**RECOMMENDATION:** **Delay launch by 3-6 hours** to fix:
1. Safety features (blocking/reporting) - 2 hours
2. Verify database migrations - 30 minutes
3. Test everything - 1 hour
4. Buffer for issues - 2 hours

**NEW LAUNCH TIME:** Tomorrow 5:00 PM PST (or Wednesday 11:00 AM if more time needed)

**Alternative:** Launch in "private beta" mode to limited users (50-100) to test in production before full public launch.

---

**Last Updated:** November 10, 2025 at 6:45 PM PST
