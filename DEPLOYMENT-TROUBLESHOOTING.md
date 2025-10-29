# SLTR Deployment Troubleshooting Guide

## Quick Fixes for Common Deployment Issues

### 1. ✅ Environment Variables Missing

**Required Environment Variables in Vercel Dashboard:**

Go to your Vercel project → Settings → Environment Variables and add:

#### **Critical (Required for App to Work)**
```
NEXT_PUBLIC_SUPABASE_URL=https://bnzyzkmixfmylviaojbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuenl6a21pe老老实实Iiwic-modal-ZSI6ImFub24iLCJpYXQiOjE3NTk0NDE3ODksImV4cCI6MjA3NTAxNzc4OX0.8WHWwe9ow_nTljMvwVUI70i07pmNBh2mR0yo80EsGMs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### **Optional (For Features)**
```
# Mapbox (for map features)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoic2x0ciIsImEiOiJjbWgwY3cxenUwMTMxMmtvZDFuYTdyN2xiIn0.HlQWna4dS1678IuOU4r8BA

# Railway Backend (for real-time features)
NEXT_PUBLIC_RAILWAY_URL=https://your-railway-url.up.railway.app

# Sentry (for error tracking) - Optional but recommended
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Redis (for rate limiting) - Optional
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

**⚠️ Important**: 
- Set environment variables for **Production**, **Preview**, and **Development** environments
- After adding env vars, **redeploy** your application

---

### 2. ✅ Build Failures

#### Common Build Errors:

**Error: "Module not found" or "Cannot resolve module"**
- **Fix**: Run `npm install` locally to ensure all dependencies are in package.json
- Commit `package-lock.json` to git

**Error: "Sentry configuration error"**
- **Fix**: Either add all Sentry env vars OR remove Sentry from next.config.js
- The current config gracefully handles missing Sentry vars

**Error: TypeScript errors**
- **Fix**: Run `npm run build` locally to catch TypeScript errors before deploying
- Fix all TypeScript errors in your code

**Error: "Out of memory" or Build timeout**
- **Fix**: Vercel has build limits. Contact Vercel support or optimize your build:
  - Reduce bundle size
  - Use dynamic imports for heavy components
  - Split large dependencies

---

### 3. ✅ Runtime Errors After Deployment

#### Error: "Supabase client not configured"
- **Cause**: Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Fix**: Add environment variables in Vercel dashboard

#### Error: "404 Not Found" on all routes
- **Cause**: Incorrect routing or missing page files
- **Fix**: 
  - Verify your `app/` directory structure matches Next.js App Router conventions
  - Check that `page.tsx` files exist in route directories

#### Error: "Function timeout" or "Edge function error"
- **Cause**: API routes taking too long or using too much memory
- **Fix**: 
  - Optimize API routes
  - Add proper error handling
  - Use edge runtime for simple functions: `export const runtime = 'edge'`

---

### 4. ✅ Vercel Deployment Checklist

Before deploying:
- [ ] All environment variables set in Vercel dashboard
- [ ] `npm run build` succeeds locally
- [ ] No TypeScript errors
- [ ] No ESLint errors (or they're ignored in next.config.js)
- [ ] `package.json` has correct Node version (`>=18.0.0`)
- [ ] `vercel.json` is properly configured
- [ ] Git repository is connected to Vercel
- [ ] Build logs don't show critical errors

---

### 5. ✅ Verifying Deployment

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Deployments → Click on latest deployment → Build Logs
   - Look for any red error messages

2. **Check Runtime Logs**:
   - Vercel Dashboard → Deployments → Runtime Logs
   - Monitor for runtime errors

3. **Test Your App**:
   - Visit your deployed URL
   - Test critical flows (login, messaging, etc.)
   - Check browser console for errors

---

### 6. ✅ Common Solutions

#### Force Redeploy
```bash
# In Vercel dashboard, click "Redeploy" on latest deployment
# Or via CLI:
vercel --prod
```

#### Clear Build Cache
- Vercel Dashboard → Settings → General → Clear Build Cache
- Redeploy after clearing cache

#### Rollback to Previous Version
- Vercel Dashboard → Deployments → Click on previous working deployment → "Promote to Production"

---

### 7. ✅ Local Testing Before Deploy

Test production build locally:
```bash
npm run build
npm start
# Visit http://localhost:5000
```

This helps catch issues before deploying to Vercel.

---

### 8. ✅ Getting Help

If deployment still fails:
1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure `npm run build` works locally
4. Check Vercel status page: https://www.vercel-status.com/
5. Review Next.js deployment docs: https://nextjs.org/docs/deployment

---

## Quick Command Reference

```bash
# Build locally
npm run build

# Test production build locally
npm start

# Deploy to Vercel
vercel --prod

# Check build status
vercel ls

# View logs
vercel logs
```

---

**Last Updated**: Current configuration supports graceful Sentry fallback and proper Vercel configuration.

