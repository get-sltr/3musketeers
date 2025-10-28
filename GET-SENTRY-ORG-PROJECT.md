# Get Your Sentry Org and Project Names

## ✅ Your DSN is Set!

```
NEXT_PUBLIC_SENTRY_DSN=https://d2ba0c1a9272d32940166d81d289f598@o4510267194212352.ingest.us.sentry.io/4510267248082944
```

---

## 🔍 Now You Need: ORG and PROJECT Names

### **Step 1: Find Your Organization Slug**

1. Go to https://sentry.io
2. Look at the URL in your browser - it will show:
   ```
   https://sentry.io/organizations/YOUR-ORG-SLUG/
   ```
   or
   ```
   https://YOUR-ORG-SLUG.sentry.io/
   ```

3. **Copy the org slug** (usually your company name or username in lowercase)

**Alternative way:**
- Click your profile icon (top right)
- Click "Organization Settings"
- Look for "Organization Slug" field
- It's usually something like: `my-company`, `john-smith`, `sltr-team`, etc.

---

### **Step 2: Find Your Project Slug**

1. On Sentry, click "Projects" in the left sidebar
2. You'll see your project name
3. Click on it
4. Look at the URL:
   ```
   https://sentry.io/organizations/YOUR-ORG/projects/YOUR-PROJECT/
   ```

5. **Copy the project slug** (usually the project name in lowercase)

**Common project slugs:**
- `sltr`
- `3musketeers`
- `nextjs`
- `my-app`

---

### **Step 3: Get Auth Token (Optional but Recommended)**

**This is for uploading source maps (makes debugging easier)**

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click **"Create New Token"**
3. Name: `SLTR Production`
4. **Select these scopes:**
   - ✅ `project:releases`
   - ✅ `org:read`
5. Click **"Create Token"**
6. **Copy the token immediately** (you can only see it once!)

The token looks like:
```
sntrys_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

### **Step 4: Update Your .env.local**

Once you have the values, edit `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://d2ba0c1a9272d32940166d81d289f598@o4510267194212352.ingest.us.sentry.io/4510267248082944
SENTRY_ORG=your-actual-org-slug       # ← Replace this
SENTRY_PROJECT=your-actual-project    # ← Replace this
SENTRY_AUTH_TOKEN=sntrys_your-token   # ← Replace this (optional)
```

---

## ⚡ Quick Example:

If your org is "sltr-team" and project is "sltr":

```bash
NEXT_PUBLIC_SENTRY_DSN=https://d2ba0c1a9272d32940166d81d289f598@o4510267194212352.ingest.us.sentry.io/4510267248082944
SENTRY_ORG=sltr-team
SENTRY_PROJECT=sltr
SENTRY_AUTH_TOKEN=sntrys_abc123...
```

---

## 🧪 Test It!

Once updated:

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Visit test page:**
   ```
   http://localhost:5000/test-sentry
   ```

3. **Click "Test Client Error"**

4. **Check Sentry Dashboard** - error should appear within 10 seconds!

---

## 📝 Note About Auth Token:

- **Required for:** Source map uploads (production)
- **NOT required for:** Basic error tracking
- **You can skip it for now** and just test with the DSN
- Add it later when deploying to production

---

## ✅ Minimum Required:

To get started RIGHT NOW, you only need:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://d2ba0c1a9272d32940166d81d289f598@o4510267194212352.ingest.us.sentry.io/4510267248082944
```

The other values are optional for local development!
