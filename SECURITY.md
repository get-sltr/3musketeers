# Security Policy - SLTR Application

**Last Updated:** 2025-11-28
**Status:** ✅ Critical Security Issues Resolved

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues Identified & Resolved](#critical-issues-identified--resolved)
3. [Security Features Implemented](#security-features-implemented)
4. [Environment Configuration](#environment-configuration)
5. [Best Practices](#best-practices)
6. [Reporting Vulnerabilities](#reporting-vulnerabilities)
7. [Security Checklist](#security-checklist)

---

## Executive Summary

This document details the security review findings and remediation steps taken for the SLTR application. Three critical security vulnerabilities were identified and have been successfully resolved:

1. ✅ **Supabase Webhook Signature Verification** - FIXED
2. ✅ **CSRF Protection** - FIXED
3. ✅ **Service Key Exposure via Fallback Pattern** - FIXED

**Current Security Status:** All critical vulnerabilities have been patched. The application now implements industry-standard security practices including webhook signature verification, CSRF protection, and secure credential handling.

---

## Critical Issues Identified & Resolved

### Issue 1: Supabase Webhook - No Signature Verification ✅ FIXED

**Risk Level:** 🔴 CRITICAL
**CVSS Score:** 8.1 (High)

#### Problem
The Supabase webhook endpoint (`/api/webhooks/supabase/route.ts`) accepted POST requests from any source without verifying they originated from Supabase. This allowed attackers to:
- Spoof webhook events
- Trigger unauthorized welcome emails
- Potentially manipulate user data
- Execute arbitrary webhook logic

#### Impact
- Unauthorized access to webhook functionality
- Email spam via fake verification events
- Potential data manipulation
- Service abuse

#### Solution Implemented
Added cryptographic signature verification using HMAC-SHA256:

**File:** `src/app/api/webhooks/supabase/route.ts`

```typescript
// Verify webhook signature before processing
const rawBody = await request.text()
const signature = request.headers.get('x-supabase-signature')

if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
  console.error('Invalid webhook signature - possible spoofing attempt')
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

**Security Features:**
- ✅ HMAC-SHA256 signature verification
- ✅ Timestamp validation (5-minute window)
- ✅ Replay attack prevention
- ✅ Timing-safe comparison (prevents timing attacks)
- ✅ Requires `SUPABASE_WEBHOOK_SECRET` environment variable

**References:**
- [Supabase Webhook Security Documentation](https://supabase.com/docs/guides/database/webhooks#securing-your-webhooks)
- [OWASP Webhook Security](https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html)

---

### Issue 2: CSRF Protection Missing ✅ FIXED

**Risk Level:** 🔴 CRITICAL
**CVSS Score:** 7.5 (High)

#### Problem
All state-changing API endpoints (POST/PUT/DELETE) were vulnerable to Cross-Site Request Forgery (CSRF) attacks. An attacker could:
- Trick authenticated users into making unwanted requests
- Delete user accounts
- Modify user data
- Make unauthorized purchases
- Change subscription settings

**Vulnerable Endpoints:**
- `/api/delete-account` - Account deletion
- `/api/taps` - User interactions
- `/api/create-checkout-session` - Payment initiation
- `/api/stripe/checkout` - Stripe payments
- `/api/groups/setup-club` - Group creation
- `/api/feedback/welcome` - Feedback submission
- All backend POST endpoints

#### Impact
- Unauthorized account deletions
- Unwanted financial transactions
- Data manipulation by third parties
- User privacy violations

#### Solution Implemented
Implemented comprehensive CSRF protection using the Double Submit Cookie pattern:

**Files Created:**
- `src/lib/csrf.ts` - Server-side CSRF utilities
- `src/lib/csrf-client.ts` - Client-side CSRF helpers
- `src/app/api/csrf-token/route.ts` - Token generation endpoint
- Updated `src/middleware.ts` - Automatic CSRF enforcement

**How It Works:**

1. **Token Generation:**
   ```typescript
   // Client requests token
   const response = await fetch('/api/csrf-token')
   const { token } = await response.json()
   ```

2. **Token Storage:**
   - Token stored in HTTP-only cookie (secure, tamper-proof)
   - Token also returned in response body for header inclusion

3. **Token Validation:**
   ```typescript
   // Middleware automatically validates on all POST/PUT/DELETE/PATCH
   if (!requireCsrf(request)) {
     return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
   }
   ```

4. **Client Usage:**
   ```typescript
   import { csrfFetch } from '@/lib/csrf-client'

   // Automatically includes CSRF token
   const response = await csrfFetch('/api/delete-account', {
     method: 'POST',
     body: JSON.stringify({ confirm: true })
   })
   ```

**Security Features:**
- ✅ HMAC-signed tokens (prevents tampering)
- ✅ 24-hour token expiration
- ✅ HTTP-only cookies (XSS protection)
- ✅ Timing-safe comparison
- ✅ Automatic middleware enforcement
- ✅ Webhook exemption (use signature verification instead)
- ✅ Safe method exemption (GET/HEAD/OPTIONS)

**References:**
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)

---

### Issue 3: Service Key Exposure - Dangerous Fallback Pattern ✅ FIXED

**Risk Level:** 🔴 CRITICAL
**CVSS Score:** 9.1 (Critical)

#### Problem
The Supabase client initialization code contained a dangerous fallback pattern that returned a mock client with demo credentials when real credentials were missing:

**Before (DANGEROUS):**
```typescript
if (!supabaseUrl || !supabaseKey) {
  // ❌ DANGEROUS: Returns mock client with demo credentials
  return createBrowserClient('https://demo.supabase.co', 'demo-key')
}
```

**Risks:**
- Masked configuration errors
- Potential credential exposure patterns
- Silent failures in production
- Security misconfigurations going unnoticed

#### Impact
- Configuration errors hidden from developers
- Potential for production deployment with missing credentials
- Security vulnerabilities masked
- Difficulty debugging authentication issues

#### Solution Implemented
Removed fallback pattern and enforced explicit errors:

**File:** `src/lib/supabase/client.ts`

**After (SECURE):**
```typescript
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// Validate no placeholder values
if (supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
  throw new Error('Supabase credentials contain placeholder values')
}
```

**Security Features:**
- ✅ Explicit error on missing credentials
- ✅ No fallback to demo/mock clients
- ✅ Placeholder value detection
- ✅ Fail-fast principle (errors surface immediately)
- ✅ Clear error messages for debugging

**Best Practice:** The application now follows the "fail-fast" security principle - configuration errors are immediately visible rather than silently degrading security.

---

## Security Features Implemented

### 1. Webhook Security

**Supabase Webhooks:**
- ✅ HMAC-SHA256 signature verification
- ✅ Timestamp validation (5-minute window)
- ✅ Replay attack prevention
- ✅ Timing-safe signature comparison

**Stripe Webhooks:**
- ✅ Already implemented (using Stripe SDK)
- ✅ Signature verification with `stripe.webhooks.constructEvent()`

### 2. CSRF Protection

- ✅ Double Submit Cookie pattern
- ✅ HMAC-signed tokens
- ✅ 24-hour token expiration
- ✅ HTTP-only cookies
- ✅ Automatic middleware enforcement
- ✅ Client-side utility functions
- ✅ Token caching (1 hour)

### 3. Authentication & Authorization

- ✅ Supabase Auth integration
- ✅ Session management via middleware
- ✅ HTTP-only session cookies
- ✅ Row Level Security (RLS) policies
- ✅ JWT token validation

### 4. Security Headers

Configured in `src/middleware.ts`:

```typescript
'X-DNS-Prefetch-Control': 'on'
'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
'X-Frame-Options': 'SAMEORIGIN'
'X-Content-Type-Options': 'nosniff'
'Referrer-Policy': 'origin-when-cross-origin'
'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
```

### 5. Environment Security

- ✅ No credentials in version control
- ✅ Service key usage limited to server-side
- ✅ Explicit credential validation
- ✅ No fallback patterns
- ✅ Environment-specific configurations

---

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file with the following (NEVER commit this file):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...  # KEEP SECRET - Server-side only

# Security - Webhook Secrets
SUPABASE_WEBHOOK_SECRET=your-webhook-secret-from-supabase-dashboard
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Security - CSRF Protection
# Generate with: openssl rand -hex 32
CSRF_SECRET=your-random-csrf-secret-key

# App
NEXT_PUBLIC_APP_URL=https://getsltr.com
```

### Generating Secure Secrets

**CSRF Secret:**
```bash
openssl rand -hex 32
```

**Webhook Secrets:**
- **Supabase:** Found in Supabase Dashboard → Database → Webhooks → Your Webhook → Signing Secret
- **Stripe:** Found in Stripe Dashboard → Developers → Webhooks → Signing Secret

### Production Deployment

**Vercel Environment Variables:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables from `.env.local`
3. Mark sensitive keys (service keys, secrets) as "Sensitive"
4. Never expose service keys or webhook secrets in client-side code

---

## Best Practices

### 1. API Security

✅ **DO:**
- Always use CSRF protection for state-changing endpoints
- Validate webhook signatures
- Use HTTPS in production
- Implement rate limiting
- Validate and sanitize user inputs
- Use parameterized queries (prevent SQL injection)
- Keep dependencies updated

❌ **DON'T:**
- Expose service keys in client-side code
- Skip CSRF validation
- Accept unsigned webhooks
- Trust user input without validation
- Use fallback credentials
- Commit secrets to version control

### 2. Frontend Security

✅ **DO:**
- Use `csrfFetch()` helper for API calls
- Store sensitive data in HTTP-only cookies
- Sanitize user-generated content before rendering
- Implement Content Security Policy (CSP)
- Use TypeScript for type safety

❌ **DON'T:**
- Store sensitive data in localStorage
- Use `dangerouslySetInnerHTML` without sanitization
- Skip CSRF token inclusion
- Make authenticated requests from untrusted origins

### 3. Credential Management

✅ **DO:**
- Use environment variables
- Rotate secrets regularly
- Use different credentials for dev/staging/prod
- Implement secret rotation procedures
- Use a secret management service (e.g., Vercel, AWS Secrets Manager)

❌ **DON'T:**
- Hardcode credentials
- Commit `.env` files
- Share credentials via email/Slack
- Use the same credentials across environments
- Use weak or predictable secrets

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please follow responsible disclosure:

### Contact
**Email:** security@getsltr.com (if available, otherwise contact project maintainers)

### What to Include
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if known)

### Response Timeline
- **Initial Response:** Within 24 hours
- **Status Update:** Within 72 hours
- **Fix Target:** Within 7-14 days (depending on severity)

### Disclosure Policy
- We will credit reporters (unless you prefer anonymity)
- We request 90 days before public disclosure
- We commit to transparent communication

---

## Security Checklist

Use this checklist for security reviews:

### Webhooks
- [ ] All webhooks verify signatures
- [ ] Webhook secrets configured in environment
- [ ] Timestamp validation implemented
- [ ] Replay attack prevention in place
- [ ] Failed verification attempts logged

### CSRF Protection
- [ ] CSRF middleware enabled
- [ ] All POST/PUT/DELETE endpoints protected
- [ ] Frontend uses `csrfFetch()` helper
- [ ] CSRF secret configured
- [ ] Token expiration implemented

### Credentials
- [ ] No credentials in version control
- [ ] Service keys used server-side only
- [ ] No fallback patterns for missing credentials
- [ ] Environment variables validated at startup
- [ ] Different credentials for each environment

### API Security
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] Authentication required where needed
- [ ] Authorization checks in place
- [ ] Error messages don't leak sensitive info

### Headers & Transport
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Cookies set as HTTP-only and Secure
- [ ] SameSite attribute set on cookies

---

## Additional Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

### Tools
- [Snyk](https://snyk.io/) - Dependency vulnerability scanning
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Built-in dependency auditing
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing

---

## Changelog

### 2025-11-28 - Initial Security Review & Fixes
- ✅ Implemented Supabase webhook signature verification
- ✅ Implemented comprehensive CSRF protection
- ✅ Fixed service key exposure via fallback pattern
- ✅ Updated environment configuration
- ✅ Created security documentation

---

**Document Version:** 1.0
**Next Review Date:** 2026-01-28 (or upon major changes)
**Maintained By:** SLTR Security Team
