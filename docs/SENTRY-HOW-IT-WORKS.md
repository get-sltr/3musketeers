# How Sentry is Hooked Up in SLTR

## ✅ **Yes, Sentry IS Already Hooked Up!**

You don't need to manually import or initialize Sentry anywhere. The `@sentry/nextjs` SDK automatically hooks everything up through the webpack plugin.

---

## 🔌 **How It Works Automatically**

### 1. **Webpack Plugin Magic** 
The `withSentryConfig()` wrapper in `next.config.js` does ALL the heavy lifting:

```javascript
// next.config.js
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
```

This automatically:
- ✅ Injects Sentry initialization code into your app
- ✅ Instruments client-side code
- ✅ Instruments server-side code
- ✅ Sets up error boundaries
- ✅ Uploads source maps (when configured)

### 2. **Configuration Files Are Auto-Loaded**
These files are automatically imported by the webpack plugin:

- `sentry.client.config.ts` → Loaded in browser
- `sentry.server.config.ts` → Loaded on server via `instrumentation.ts`
- `sentry.edge.config.ts` → Loaded in edge runtime via `instrumentation.ts`

### 3. **Instrumentation Hook**
The `instrumentation.ts` file is automatically executed by Next.js (when `instrumentationHook: true`):

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');  // ← Auto-loaded
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');    // ← Auto-loaded
  }
}
```

---

## 🎯 **What This Means For You**

### ✅ **Automatic Error Tracking**
Without writing ANY additional code:
- All uncaught exceptions are captured
- All unhandled promise rejections are logged
- API route errors are tracked
- Server component errors are caught
- Client component errors are caught

### ✅ **Zero Manual Setup Required**
You don't need to:
- ❌ Import Sentry in your components
- ❌ Wrap your app in providers
- ❌ Add try/catch everywhere
- ❌ Manually call `Sentry.init()`

### ✅ **But You CAN Add More**
For enhanced tracking, you can optionally:
```typescript
import { captureException, setUser } from '@/lib/sentry'

// Track specific errors with context
captureException(error, { userId: '123' })

// Set user context
setUser({ id: user.id, email: user.email })
```

---

## 📋 **Quick Verification Checklist**

To verify Sentry is working:

1. **Check DSN is Set**
   ```bash
   # In .env.local
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Visit Test Page**
   ```
   http://localhost:5000/test-sentry
   ```

4. **Click "Test Client Error"**

5. **Check Sentry Dashboard**
   - Go to sentry.io
   - You should see the error appear within seconds

---

## 🔧 **Configuration Files Explained**

| File | Purpose | Auto-Loaded? |
|------|---------|--------------|
| `sentry.client.config.ts` | Browser error tracking | ✅ Yes (webpack) |
| `sentry.server.config.ts` | Server error tracking | ✅ Yes (instrumentation.ts) |
| `sentry.edge.config.ts` | Edge runtime tracking | ✅ Yes (instrumentation.ts) |
| `instrumentation.ts` | Next.js hook | ✅ Yes (Next.js) |
| `next.config.js` | Webpack integration | ✅ Yes (build time) |

---

## 💡 **Common Questions**

### Q: Do I need to import Sentry in my layout?
**A:** No! The webpack plugin handles it automatically.

### Q: Do I need to wrap my app in a Sentry provider?
**A:** No! Sentry hooks into Next.js automatically.

### Q: When does Sentry initialize?
**A:** Immediately when your app loads (both client and server).

### Q: Can I use Sentry helper functions?
**A:** Yes! Import from `@/lib/sentry.ts` for easier usage:
```typescript
import { captureException, captureMessage, setUser } from '@/lib/sentry'
```

### Q: Will errors in development be sent to Sentry?
**A:** No! The config filters out development errors by default:
```typescript
beforeSend(event) {
  if (process.env.NODE_ENV === 'development') {
    return null; // Don't send
  }
  return event;
}
```

---

## 🎨 **What Gets Tracked Automatically**

### Client-Side
- ✅ Component rendering errors
- ✅ Event handler errors
- ✅ Promise rejections
- ✅ Console errors
- ✅ Network errors (fetch/axios)

### Server-Side
- ✅ API route errors
- ✅ Server component errors
- ✅ Middleware errors
- ✅ Database query errors
- ✅ External API failures

### Performance
- ✅ Page load times
- ✅ API response times
- ✅ Component render times
- ✅ Navigation timing

---

## 🚀 **Production Deployment**

For production, just set these environment variables in your hosting platform:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token
```

That's it! Everything else is automatic.

---

## 📊 **Summary**

### ✅ **Sentry IS Already Hooked Up**
- Webpack plugin injects it automatically
- No manual initialization needed
- Works out of the box

### ✅ **What You Need to Do**
1. Set `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`
2. Start your server
3. That's it!

### ✅ **Optional Enhancements**
- Use helper functions from `@/lib/sentry.ts`
- Add user context with `setUser()`
- Add breadcrumbs with `addBreadcrumb()`
- Track custom events with `captureMessage()`

**Everything just works! 🎉**
