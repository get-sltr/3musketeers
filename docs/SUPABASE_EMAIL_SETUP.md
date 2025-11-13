# 📧 Supabase Email Configuration with Resend

## 🎯 **Overview**

This guide shows you how to configure Supabase to use Resend for all authentication emails (signup verification, password reset, etc.).

---

## ✅ **Step 1: Get Your Resend API Key**

1. Go to **Resend Dashboard**: https://resend.com/api-keys
2. Create a new API key (or use existing one)
3. Copy the API key (starts with `re_`)

---

## ✅ **Step 2: Configure Resend Domain in Supabase**

### **Option A: Use Resend SMTP (Recommended for Supabase Auth Emails)**

1. Go to **Supabase Dashboard** → **Project Settings** → **Auth** → **Email Templates**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure Resend SMTP:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `465` (SSL) or `587` (TLS)
   - **SMTP User:** `resend`
   - **SMTP Password:** Your Resend API key (starts with `re_`)
   - **Sender Email:** `onboarding@yourdomain.com` (must be verified in Resend)
   - **Sender Name:** `SLTR`

5. **Verify Domain in Resend:**
   - Go to **Resend Dashboard** → **Domains**
   - Add your domain (`getsltr.com`)
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification (usually a few minutes)

---

## ✅ **Step 3: Customize Email Templates in Supabase**

1. Go to **Supabase Dashboard** → **Project Settings** → **Auth** → **Email Templates**
2. Customize templates:
   - **Confirm signup** (email verification)
   - **Magic Link** (if using magic links)
   - **Change Email Address**
   - **Reset Password**
   - **Invite User** (if using)

3. **Template Variables Available:**
   - `{{ .ConfirmationURL }}` - Email verification link
   - `{{ .Token }}` - OTP code (if using OTP)
   - `{{ .Email }}` - User's email
   - `{{ .SiteURL }}` - Your site URL

---

## ✅ **Step 4: Configure Email Redirect URLs**

1. Go to **Supabase Dashboard** → **Project Settings** → **Auth**
2. Set **Site URL:** `https://getsltr.com`
3. Add **Redirect URLs:**
   - `https://getsltr.com/auth/callback`
   - `https://getsltr.com/reset-password`
   - `https://getsltr.com/app`
   - `http://localhost:3001/auth/callback` (for local dev)

---

## ✅ **Step 5: Add Resend API Key to Environment Variables**

### **Local Development (.env.local):**
```bash
RESEND_API_KEY=re_your_resend_api_key_here
```

### **Vercel (Production):**
1. Go to **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Your Resend API key
   - **Environment:** Production, Preview, Development

---

## ✅ **Step 6: Test Email Configuration**

### **Test Signup Email:**
1. Go to **Supabase Dashboard** → **Auth** → **Users**
2. Create a test user
3. Check if email is sent
4. Check Resend Dashboard → **Logs** for delivery status

### **Test Password Reset:**
1. Go to `/forgot-password`
2. Enter test email
3. Check inbox for reset email
4. Verify link works

### **Test Welcome Email (After Verification):**
1. Sign up a new user
2. Verify email
3. Check inbox for welcome email (sent via our API route)

---

## 📝 **Email Flow Summary**

### **1. Signup & Verification (Supabase + Resend SMTP):**
- User signs up → Supabase sends verification email via Resend SMTP
- User clicks verification link → Auth callback → Welcome email sent via Resend API

### **2. Password Reset (Supabase + Resend SMTP):**
- User requests password reset → Supabase sends reset email via Resend SMTP
- User clicks reset link → Redirects to `/reset-password`

### **3. Welcome Email (Resend API):**
- After email verification → Auth callback triggers welcome email via Resend API
- Sent from `onboarding@getsltr.com`

---

## 🔧 **Troubleshooting**

### **Emails Not Sending:**

1. **Check Resend Domain Verification:**
   - Go to **Resend Dashboard** → **Domains**
   - Verify domain status is "Verified"
   - Check DNS records are correct

2. **Check Supabase SMTP Settings:**
   - Verify SMTP credentials are correct
   - Test SMTP connection in Supabase dashboard

3. **Check Resend API Key:**
   - Verify API key is correct in `.env.local`
   - Check API key has proper permissions

4. **Check Spam Folder:**
   - Emails might be filtered

5. **Check Resend Logs:**
   - Go to **Resend Dashboard** → **Logs**
   - Check for delivery errors

### **Email Templates Not Working:**

1. **Check Template Variables:**
   - Verify correct variable syntax (`{{ .ConfirmationURL }}`)
   - Check Supabase documentation for available variables

2. **Check Email Format:**
   - Ensure HTML is valid
   - Test with plain text first

---

## 🚀 **Production Checklist**

- [ ] Resend domain verified (`getsltr.com`)
- [ ] Resend API key added to Vercel
- [ ] Supabase SMTP configured with Resend
- [ ] Email templates customized in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Site URL set to `https://getsltr.com`
- [ ] Test signup email works
- [ ] Test password reset email works
- [ ] Test welcome email works
- [ ] Check Resend logs for delivery status

---

## 📚 **Additional Resources**

- **Resend Documentation:** https://resend.com/docs
- **Supabase Auth Documentation:** https://supabase.com/docs/guides/auth
- **Supabase Email Templates:** https://supabase.com/docs/guides/auth/auth-email-templates

---

**Need help? Check the logs in Resend Dashboard or Supabase Dashboard → Auth → Logs**

