# Sentry Setup Guide

## Current Status
✅ Sentry package installed (`@sentry/nextjs`)
✅ Configuration files exist
⚠️ Client initialization was disabled
⚠️ Missing environment variables

## What You Need to Do:

### Step 1: Get Your Sentry Credentials

1. Go to https://sentry.io and sign in
2. Navigate to your project (or create one)
3. Go to **Settings** → **Projects** → **[Your Project]**
4. Find these values:
   - **DSN** (Data Source Name) - looks like: `https://xxx@xxx.ingest.sentry.io/xxx`
   - **Organization Slug** - found in URL: `sentry.io/organizations/[ORG-SLUG]/`
   - **Project Slug** - found in URL: `sentry.io/organizations/[ORG]/projects/[PROJECT-SLUG]/`

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://YOUR-DSN-HERE@YOUR-ORG.ingest.sentry.io/YOUR-PROJECT-ID
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token-from-sentry
```

### Step 3: Get Auth Token (for source maps)

1. Go to Sentry → **Settings** → **Auth Tokens**
2. Create a new token with these scopes:
   - `project:releases`
   - `org:read`
3. Copy the token and add it to `.env.local` as `SENTRY_AUTH_TOKEN`

### Step 4: Verify Setup

After adding the env variables, test with:
```bash
npm run build
```

You should see Sentry uploading source maps during the build.

## What I Fixed:

1. ✅ Enabled Sentry client initialization (was disabled with `if (false)`)
2. ✅ Made it conditional on DSN being present
3. ✅ Configuration files are ready

## Next Steps:

1. Add the environment variables above
2. Test the build
3. Check Sentry dashboard for errors

---
**Note:** The `.env.sentry-build-plugin` file has an auth token, but you should add it to `.env.local` instead for better organization.

