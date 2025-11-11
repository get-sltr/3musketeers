# 🚀 SLTR LAUNCH CHECKLIST - 11PM TONIGHT

**Launch Time:** Tonight at 11:00 PM PST
**Time Until Launch:** ~4 hours
**Status:** ✅ Safety features fixed! Ready to verify database and env vars.

---

## ✅ COMPLETED

### 1. Safety Features - FIXED! ✅
- [x] Created `blocked_users` and `reports` tables migration
- [x] Updated `src/lib/safety.ts` to use Supabase database
- [x] Updated components to handle async functions
- [x] Build passes with no errors
- [x] Committed and deployed (commit: f0cb837)

**Next Step:** Run the migration in Supabase Dashboard

---

## 🎯 REMAINING TASKS (3-4 hours)

### Task 1: Apply Database Migrations in Supabase (30 min) 🔴 CRITICAL

**Go to:** https://supabase.com/dashboard

#### Step-by-Step:
1. **Log into Supabase Dashboard**
   - Select your SLTR project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New query"

3. **Run Safety Tables Migration** ⚡ MOST IMPORTANT
   ```sql
   -- Copy/paste the contents of:
   -- supabase/migrations/20251110_create_safety_tables.sql
   ```
   - Open `supabase/migrations/20251110_create_safety_tables.sql` locally
   - Copy entire file
   - Paste into Supabase SQL Editor
   - Click "Run"
   - ✅ Should see: "Success. No rows returned"

4. **Verify Safety Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should see:
     - `blocked_users` table
     - `reports` table
   - Click each table to verify columns exist

5. **Run Settings Table Migration** (if not already run)
   ```sql
   -- Copy/paste the contents of:
   -- supabase/migrations/20251108_create_settings_table.sql
   ```
   - Same process as safety tables
   - Verify `settings` table appears

6. **Verify All Migrations Applied**
   - Check these tables exist in "Table Editor":
     - [ ] `profiles` (should already exist)
     - [ ] `settings`
     - [ ] `profile_views`
     - [ ] `albums`
     - [ ] `album_photos`
     - [ ] `blocked_users` ⚡ NEW
     - [ ] `reports` ⚡ NEW
     - [ ] `groups`
     - [ ] `group_members`
     - [ ] `group_messages`
     - [ ] `push_subscriptions`

7. **Verify `profiles` Table Columns**
   - Click `profiles` table
   - Verify these columns exist:
     - [ ] `id` (uuid)
     - [ ] `username` (text)
     - [ ] `founder` (boolean)
     - [ ] `subscription_status` (text)
     - [ ] `founder_number` (integer)
     - [ ] `age` (integer)
     - [ ] `date_of_birth` (date)
     - [ ] `preferred_language` (text)

**⚠️ If `profiles` table missing columns:**
- Your profiles table needs updating
- Let me know and I'll create a migration

---

### Task 2: Verify Vercel Environment Variables (15 min) 🟡 CRITICAL

**Go to:** https://vercel.com/dashboard

#### Step-by-Step:
1. **Select your SLTR project**

2. **Go to Settings → Environment Variables**

3. **Verify ALL these variables are set:**

#### ✅ Supabase (REQUIRED)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Should start with https://
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Long string starting with eyJ
- [ ] `SUPABASE_SERVICE_KEY` - Long string starting with eyJ (different from anon)

#### ✅ Stripe (REQUIRED for payments)
- [ ] `STRIPE_SECRET_KEY` - Should start with sk_live_ or sk_test_
- [ ] `STRIPE_WEBHOOK_SECRET` - Should start with whsec_
- [ ] `STRIPE_FOUNDER_PRICE_ID` - Should start with price_ (NOT "price_founder")
- [ ] `STRIPE_MEMBER_PRICE_ID` - Should start with price_ (NOT "price_member")

**⚠️ If Stripe price IDs are placeholders:**
1. Go to https://dashboard.stripe.com
2. Click "Products"
3. Find your Founder's Circle product ($199 one-time)
4. Copy the Price ID (starts with price_)
5. Update `STRIPE_FOUNDER_PRICE_ID` in Vercel
6. Repeat for Member subscription ($12.99/month)
7. Update `STRIPE_MEMBER_PRICE_ID` in Vercel

**⚠️ If Stripe webhook secret missing:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. URL: `https://getsltr.com/api/webhooks/stripe`
4. Events: Select `checkout.session.completed`
5. Add subscription events if needed
6. Copy the Signing Secret (starts with whsec_)
7. Update `STRIPE_WEBHOOK_SECRET` in Vercel

#### ✅ Sentry (REQUIRED for error tracking)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Should start with https://
- [ ] `SENTRY_ORG` - Your organization name
- [ ] `SENTRY_PROJECT` - Your project name
- [ ] `SENTRY_AUTH_TOKEN` - Long auth token

#### ✅ Daily.co (REQUIRED for video calls)
- [ ] `DAILY_API_KEY` - Your Daily.co API key

#### 🔵 Email (Optional but recommended)
- [ ] `RESEND_API_KEY` - If using Resend for emails

4. **After updating variables:**
   - Click "Redeploy" to apply changes
   - Wait for deployment to complete (~2-3 minutes)

---

### Task 3: Test Critical User Flows (1.5 hours) 🟡 IMPORTANT

Go to: https://getsltr.com

#### Test 1: Signup Flow (10 min)
- [ ] Navigate to https://getsltr.com/signup
- [ ] Enter email, password, username, DOB (18+)
- [ ] Click Sign Up
- [ ] Check email inbox for verification email
- [ ] Click verification link
- [ ] Should redirect to /app
- [ ] Profile should be created

**⚠️ If email not received:**
- Check Supabase Dashboard → Authentication → Email Templates
- Verify redirect URL is set to https://getsltr.com/auth/callback

#### Test 2: Login Flow (5 min)
- [ ] Log out
- [ ] Go to /login
- [ ] Enter credentials
- [ ] Should log in successfully
- [ ] Should land on /app

#### Test 3: Discovery & Profiles (10 min)
- [ ] Go to /app
- [ ] Should see user profiles in grid
- [ ] Click a profile
- [ ] Profile modal should open
- [ ] Click through photos
- [ ] Info should display correctly

#### Test 4: Blocking (10 min) ⚡ CRITICAL TEST
- [ ] Open a user profile
- [ ] Click "Block" button
- [ ] Confirm block
- [ ] Should see success message
- [ ] User should disappear from discovery
- [ ] **VERIFY IN DATABASE:**
   - Go to Supabase Dashboard → Table Editor → blocked_users
   - Should see new row with your user_id and blocked_user_id

#### Test 5: Reporting (10 min) ⚡ CRITICAL TEST
- [ ] Open a user profile
- [ ] Click "Report" button
- [ ] Select category (e.g., "spam")
- [ ] Enter reason
- [ ] Submit report
- [ ] Should see success message
- [ ] **VERIFY IN DATABASE:**
   - Go to Supabase Dashboard → Table Editor → reports
   - Should see new row with reporter_user_id and reported_user_id

#### Test 6: Messaging (15 min)
- [ ] Go to a profile
- [ ] Click "Message"
- [ ] Should create conversation
- [ ] Should redirect to /messages/[id]
- [ ] Type a message
- [ ] Send message
- [ ] Should appear in conversation

#### Test 7: Video Calls (15 min)
- [ ] Need 2 accounts for this test
- [ ] Start video call from profile
- [ ] Other user should receive notification
- [ ] Both join call
- [ ] Verify video and audio work
- [ ] End call

#### Test 8: Stripe Payment (15 min)
- [ ] Go to /pricing
- [ ] Click "Join Founder's Circle" ($199)
- [ ] Should redirect to Stripe Checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: any future date
- [ ] CVC: any 3 digits
- [ ] Complete checkout
- [ ] Should redirect back to /pricing?success=true
- [ ] **VERIFY IN DATABASE:**
   - Go to Supabase Dashboard → Table Editor → profiles
   - Find your profile
   - `founder` should be `true`
   - `subscription_status` should be "founder"

**⚠️ If payment fails:**
- Check Stripe webhook is configured
- Check `STRIPE_WEBHOOK_SECRET` in Vercel
- Check Vercel logs for webhook errors

#### Test 9: Multi-language (5 min)
- [ ] Click SLTR logo (top left)
- [ ] Click "Language"
- [ ] Select different language
- [ ] UI should update
- [ ] Refresh page - language should persist

#### Test 10: Mobile (15 min)
- [ ] Open on iPhone Safari
- [ ] Test signup flow
- [ ] Test discovery
- [ ] Test messaging
- [ ] Test bottom navigation
- [ ] Verify responsive layout

---

### Task 4: Verify Error Tracking (10 min) 🔵 NICE TO HAVE

1. **Test Sentry is working:**
   - Go to https://getsltr.com/test-sentry
   - Click "Throw Test Error"
   - Go to https://sentry.io
   - Check Issues tab
   - Should see test error appear

2. **If no error appears:**
   - Verify `NEXT_PUBLIC_SENTRY_DSN` in Vercel
   - Redeploy after fixing

---

## 🚨 FINAL PRE-LAUNCH CHECKS (30 min)

### T-Minus 30 Minutes (10:30 PM)

1. **Quick Smoke Test:**
   - [ ] Signup works
   - [ ] Login works
   - [ ] Discovery works
   - [ ] Messaging works
   - [ ] Blocking works
   - [ ] Reporting works
   - [ ] Payment flow works (test card)

2. **Check Production Logs:**
   - [ ] Vercel Dashboard → Logs
   - [ ] No critical errors in last hour
   - [ ] Supabase Dashboard → Logs
   - [ ] No critical errors

3. **Verify Deployment:**
   - [ ] Latest commit deployed (f0cb837 or newer)
   - [ ] Build status: Success
   - [ ] No deployment errors

4. **Database Health:**
   - [ ] Supabase Dashboard → Database
   - [ ] Check connection pool usage
   - [ ] Should be < 50%

---

## 🎯 LAUNCH TIME - 11:00 PM

### At Launch:
1. [ ] Announce launch (Twitter, social media, etc.)
2. [ ] Monitor Vercel logs in real-time
3. [ ] Monitor Sentry for errors
4. [ ] Be ready to hotfix if needed

### First Hour After Launch:
1. [ ] Watch for signup errors
2. [ ] Monitor Stripe webhooks
3. [ ] Check user activity in database
4. [ ] Respond to any user reports/issues

---

## 🆘 IF SOMETHING BREAKS

### Blocker Issues:
1. **Signups not working:**
   - Check Supabase Auth logs
   - Verify email service configured
   - Check redirect URLs

2. **Blocking/Reporting not working:**
   - Verify migrations ran successfully
   - Check browser console for errors
   - Check Vercel logs

3. **Payments not working:**
   - Verify Stripe webhook configured
   - Check webhook secret in Vercel
   - Test with 4242 4242 4242 4242

4. **Video calls not working:**
   - Verify `DAILY_API_KEY` in Vercel
   - Check Daily.co dashboard for errors

### Emergency Rollback:
If critical issue:
```bash
git revert HEAD
git push
```
Then redeploy on Vercel

---

## 📞 QUICK REFERENCE

### Dashboards:
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **Sentry:** https://sentry.io
- **Daily.co:** https://dashboard.daily.co

### Important Files:
- Safety migration: `supabase/migrations/20251110_create_safety_tables.sql`
- Safety features: `src/lib/safety.ts`
- Pre-launch checklist: `PRE_LAUNCH_CHECKLIST.md`

---

## ✅ COMPLETION CHECKLIST

Before launching at 11pm:
- [ ] All database migrations applied in Supabase
- [ ] All environment variables verified in Vercel
- [ ] All 10 critical user flows tested
- [ ] Blocking and reporting tested and working
- [ ] Payment flow tested with test card
- [ ] Mobile testing completed
- [ ] No critical errors in logs
- [ ] Latest code deployed

**If all checked:** 🟢 **GO FOR LAUNCH!**

**If any unchecked:** 🔴 **DO NOT LAUNCH - Fix issues first**

---

**Last Updated:** November 10, 2025 at 7:00 PM PST
**Time Remaining:** 4 hours until launch
