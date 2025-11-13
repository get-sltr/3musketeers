# Sentry Integration Setup Guide

This guide will help you set up Sentry for error tracking and performance monitoring in the SLTR app.

## 📦 What's Installed

- `@sentry/nextjs` - Sentry SDK for Next.js with automatic instrumentation
- Client-side error tracking with Session Replay
- Server-side error tracking
- Edge runtime error tracking
- Performance monitoring
- Breadcrumbs and context tracking

## 🚀 Quick Setup

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up for a free account
2. Create a new project and select **Next.js** as the platform
3. Copy your DSN (Data Source Name) - it looks like:
   ```
   https://abc123def456@o123456.ingest.sentry.io/7890123
   ```

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/your-project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

**To get your auth token:**
1. Go to Sentry → Settings → Account → Auth Tokens
2. Create a new token with `project:releases` and `org:read` scopes
3. Copy the token and add it to your `.env.local`

### 3. Update Production Environment

For deployment (Vercel, Railway, etc.), add these environment variables to your hosting platform:

- `NEXT_PUBLIC_SENTRY_DSN` - Your Sentry DSN (must be public)
- `SENTRY_ORG` - Your organization slug
- `SENTRY_PROJECT` - Your project name
- `SENTRY_AUTH_TOKEN` - Your auth token (keep this secret!)

### 4. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:5000/test-sentry

3. Click the test buttons to verify Sentry is capturing events

4. Check your Sentry dashboard to see the events appear

## 📁 Files Created

- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `instrumentation.ts` - Next.js instrumentation for Sentry
- `src/lib/sentry.ts` - Utility functions for easier Sentry usage
- `src/app/global-error.tsx` - Global error boundary
- `src/app/test-sentry/page.tsx` - Testing page for Sentry features

## 🎯 Usage Examples

### Capture Exceptions

```typescript
import { captureException } from '@/lib/sentry'

try {
  // Your code here
  throw new Error('Something went wrong')
} catch (error) {
  captureException(error as Error, {
    context: 'user-profile-update',
    userId: user.id
  })
}
```

### Capture Messages

```typescript
import { captureMessage } from '@/lib/sentry'

// Info message
captureMessage('User completed onboarding', 'info')

// Warning
captureMessage('API rate limit approaching', 'warning')

// Error
captureMessage('Failed to load user data', 'error')
```

### Add Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/sentry'

addBreadcrumb({
  message: 'User clicked send message',
  category: 'user-action',
  level: 'info',
  data: {
    conversationId: '123',
    messageLength: 50
  }
})
```

### Set User Context

```typescript
import { setUser } from '@/lib/sentry'

// After user logs in
setUser({
  id: user.id,
  email: user.email,
  username: user.display_name
})

// After user logs out
setUser(null)
```

### Performance Monitoring

```typescript
import { startSpan } from '@/lib/sentry'

const result = await startSpan('Load User Profile', 'http.request', async () => {
  // Your code here
  return await loadUserProfile(userId)
})
```

## 🔧 Configuration Options

### Client Configuration (`sentry.client.config.ts`)

- **tracesSampleRate**: Set to `1.0` for 100% of transactions (adjust for production)
- **replaysOnErrorSampleRate**: `1.0` means 100% of errors will have session replay
- **replaysSessionSampleRate**: `0.1` means 10% of sessions will be recorded
- **debug**: Set to `true` for verbose logging during setup

### Server Configuration (`sentry.server.config.ts`)

- Similar to client config but for server-side errors
- Automatically captures API route errors
- Captures server component errors

### Filtering Errors

Both client and server configs include:
- Browser extension errors (ignored)
- Network errors that aren't actionable (ignored)
- Development environment errors (filtered out)

## 📊 What Sentry Tracks

### Automatic Tracking
- ✅ Uncaught exceptions
- ✅ Unhandled promise rejections
- ✅ API route errors
- ✅ Server component errors
- ✅ Client component errors
- ✅ Performance metrics
- ✅ User interactions (via Session Replay)

### Manual Tracking
- Custom error contexts
- Business logic errors
- User flow breadcrumbs
- Performance transactions
- Custom messages and warnings

## 🎨 Features Enabled

### Session Replay
Records user sessions when errors occur, helping you see exactly what the user did before the error happened.

### Performance Monitoring
Tracks page load times, API response times, and custom transactions.

### Breadcrumbs
Automatically tracks:
- Console logs
- Network requests
- User clicks
- Navigation changes
- Custom events

### Error Grouping
Sentry automatically groups similar errors together and provides:
- Stack traces
- User context
- Breadcrumb trail
- Device/browser information

## 🚨 Best Practices

1. **Don't Send Sensitive Data**
   - Never capture passwords, tokens, or PII in error messages
   - Use `beforeSend` hook to sanitize data

2. **Use Appropriate Sample Rates**
   - Development: High sample rates (100%)
   - Production: Lower rates (10-25%) to control costs

3. **Add Context**
   - Always include relevant context with errors
   - Use breadcrumbs for user flow tracking

4. **Set User Context**
   - Set user info after authentication
   - Clear user context on logout

5. **Monitor Performance**
   - Track critical user flows
   - Monitor API response times
   - Track database query performance

## 🔍 Monitoring

### Key Metrics to Watch

1. **Error Rate**: Errors per session
2. **Affected Users**: Number of users experiencing errors
3. **Performance**: Page load times and API response times
4. **Browser/OS Distribution**: Where errors occur most

### Alerts

Set up alerts in Sentry for:
- New error types
- Error spikes (sudden increase)
- Performance degradation
- Critical errors

## 📈 Production Checklist

Before deploying to production:

- [ ] DSN configured in production environment
- [ ] Auth token set (for source maps)
- [ ] Sample rates adjusted for production traffic
- [ ] Alerts configured for critical errors
- [ ] Team members invited to Sentry project
- [ ] Test error capturing in production
- [ ] Source maps uploading correctly
- [ ] Session replay working (if enabled)

## 🆘 Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is correctly configured
2. Verify environment variables are loaded
3. Check browser console for Sentry initialization errors
4. Ensure `debug: true` temporarily to see logs
5. Verify firewall isn't blocking Sentry requests

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry settings
3. Ensure token has correct permissions
4. Check build logs for source map upload errors

### High Data Usage

1. Lower `tracesSampleRate` (e.g., from 1.0 to 0.1)
2. Lower `replaysSessionSampleRate` 
3. Add more error filters in `beforeSend`
4. Use Sentry's inbound filters to drop unwanted errors

## 🔗 Useful Links

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## 💰 Pricing

Sentry offers:
- **Developer Plan**: Free (5k errors/month)
- **Team Plan**: $26/month (50k errors/month)
- **Business Plan**: Custom pricing

Monitor your usage in the Sentry dashboard to stay within your plan limits.
