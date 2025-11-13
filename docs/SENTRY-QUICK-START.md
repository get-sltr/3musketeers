# Sentry Quick Start Guide - Get Your DSN

## 🚀 **Step-by-Step Setup (5 minutes)**

### **Step 1: Create Sentry Account**

1. Go to https://sentry.io
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with:
   - GitHub account (recommended - fastest)
   - Google account
   - Email address

### **Step 2: Create Your First Project**

After signing up, Sentry will guide you through project creation:

1. **Choose Platform:**
   - Select **"Next.js"** from the platform list
   - Click **"Create Project"**

2. **Name Your Project:**
   - Project name: `sltr` (or whatever you prefer)
   - Alert frequency: **"Alert me on every new issue"** (recommended)
   - Click **"Create Project"**

### **Step 3: Get Your DSN**

You'll immediately see a setup page with your DSN displayed prominently:

```
🎯 Your DSN (Data Source Name):
https://examplePublicKey@o0000000.ingest.sentry.io/0000000
```

**Copy this DSN!** You'll need it in the next step.

**Alternative ways to find it later:**
- Settings → Projects → [Your Project] → Client Keys (DSN)
- Or go directly to: `https://sentry.io/settings/[your-org]/projects/[your-project]/keys/`

### **Step 4: Add DSN to Your App**

1. **Open your `.env.local` file:**
   ```bash
   # In your project root
   nano .env.local
   # or use your favorite editor
   ```

2. **Update the Sentry DSN line:**
   ```bash
   # Replace the placeholder with your actual DSN
   NEXT_PUBLIC_SENTRY_DSN=https://YOUR-ACTUAL-DSN@sentry.io/YOUR-PROJECT-ID
   ```

3. **Save the file**

### **Step 5: Get Auth Token (For Source Maps)**

To upload source maps (makes error debugging easier):

1. Go to **Settings** (your profile) → **Auth Tokens**
   - Direct link: https://sentry.io/settings/account/api/auth-tokens/

2. Click **"Create New Token"**

3. **Configure token:**
   - Name: `SLTR Production`
   - Scopes needed:
     - ✅ `project:releases` (required)
     - ✅ `org:read` (required)
   - Click **"Create Token"**

4. **Copy the token** (you can only see it once!)

5. **Add to `.env.local`:**
   ```bash
   SENTRY_AUTH_TOKEN=your-token-here
   ```

### **Step 6: Get Org and Project Names**

1. **Organization Slug:**
   - Look at your Sentry URL: `https://sentry.io/organizations/YOUR-ORG-SLUG/`
   - Or go to Settings → General Settings → Organization Slug

2. **Project Slug:**
   - Look at your project URL or go to Project Settings
   - Usually the same as your project name (lowercased)

3. **Add to `.env.local`:**
   ```bash
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=sltr
   ```

### **Step 7: Verify Setup**

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Visit the test page:**
   ```
   http://localhost:5000/test-sentry
   ```

3. **Click "Test Client Error" button**

4. **Check Sentry Dashboard:**
   - Go to https://sentry.io
   - Click on your project
   - You should see the error appear in the "Issues" tab within 10 seconds!

---

## 📋 **Your Complete .env.local Should Look Like:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Mapbox Token
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sentry Configuration (NEW)
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o1234567.ingest.sentry.io/7890123
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=sltr
SENTRY_AUTH_TOKEN=sntrys_abc123def456...
```

---

## 🎯 **Quick Visual Guide**

### Finding Your DSN:

```
Sentry Dashboard
  ↓
Settings (⚙️)
  ↓
Projects
  ↓
[Your Project Name]
  ↓
Client Keys (DSN)  ← YOUR DSN IS HERE!
  ↓
Copy the "DSN" value
```

### Finding Your Auth Token:

```
Your Profile (👤)
  ↓
Settings
  ↓
Auth Tokens
  ↓
Create New Token
  ↓
Select scopes: project:releases, org:read
  ↓
Copy token immediately (can't see it again!)
```

---

## 🆓 **Sentry Free Tier**

The free tier includes:
- ✅ 5,000 errors per month
- ✅ 10,000 performance units
- ✅ 1 team member
- ✅ 30 days data retention
- ✅ All core features

**Perfect for getting started!**

---

## ⚠️ **Important Notes**

1. **DSN is Public:**
   - The DSN can be public (it's in your client-side code)
   - It's safe to commit to git
   - Uses `NEXT_PUBLIC_` prefix

2. **Auth Token is Secret:**
   - Never commit auth token to git
   - Keep it in `.env.local` (git-ignored)
   - Only needed for source map uploads

3. **Development Mode:**
   - By default, errors in development mode are NOT sent to Sentry
   - This is configured in the sentry config files
   - You can change this if you want to test in development

---

## 🎉 **You're Done!**

Once you have your DSN in `.env.local`:
- Sentry is automatically tracking errors
- No additional code needed
- Visit `/test-sentry` to verify it's working

---

## 🆘 **Troubleshooting**

### Can't Find DSN?
- Go to: `https://[your-org].sentry.io/settings/projects/[your-project]/keys/`
- Or click: Settings → Projects → [Project] → Client Keys

### DSN Not Working?
- Make sure it starts with `https://`
- Make sure environment variable is `NEXT_PUBLIC_SENTRY_DSN`
- Restart your dev server after adding it

### No Errors Showing in Sentry?
- Check if DSN is correct
- Make sure you restarted the server
- Try the test page: `/test-sentry`
- Check browser console for Sentry initialization errors

---

## 📞 **Need Help?**

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry Support: https://sentry.io/support/
- Check our `SENTRY-HOW-IT-WORKS.md` for more details
