# 🚀 QUICK SUPABASE EMAIL SETUP - STEP BY STEP

## ✅ **Step 1: Open Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project (SLTR)
3. Click **Settings** (gear icon in left sidebar)
4. Click **Auth** in the settings menu

---

## ✅ **Step 2: Configure SMTP Settings**

1. Scroll down to **SMTP Settings** section
2. Toggle **Enable Custom SMTP** to **ON**
3. Fill in these fields:

### **SMTP Configuration:**
```
SMTP Host: smtp.resend.com
SMTP Port: 465 (or 587)
SMTP User: resend
SMTP Password: [Your Resend API Key - starts with re_]
Sender Email: onboarding@getsltr.com
Sender Name: SLTR
```

### **Important Notes:**
- **SMTP Port:** Use `465` for SSL or `587` for TLS (both work)
- **SMTP Password:** This is your Resend API key (the same one you added to `.env.local`)
- **Sender Email:** Must be from your verified domain (`getsltr.com`)

---

## ✅ **Step 3: Verify Domain in Resend (If Not Done)**

1. Go to: https://resend.com/domains
2. Click **Add Domain**
3. Enter: `getsltr.com`
4. Resend will give you DNS records to add:
   - **SPF record**
   - **DKIM record**
   - **DMARC record** (optional but recommended)
5. Add these DNS records to your domain provider (where `getsltr.com` is hosted)
6. Wait for verification (usually 5-15 minutes)

**⚠️ If domain isn't verified yet, emails might not send!**

---

## ✅ **Step 4: Configure Email Redirect URLs**

1. Still in **Supabase Dashboard** → **Settings** → **Auth**
2. Scroll to **URL Configuration**
3. Set **Site URL:** `https://getsltr.com`
4. Add these **Redirect URLs:**
   ```
   https://getsltr.com/auth/callback
   https://getsltr.com/reset-password
   https://getsltr.com/app
   http://localhost:3001/auth/callback
   ```

---

## ✅ **Step 5: Test Email Configuration**

### **Test Signup Email:**
1. Go to your app: `https://getsltr.com/signup`
2. Sign up with a test email
3. Check inbox for verification email
4. Check **Resend Dashboard** → **Logs** for delivery status

### **Test Password Reset:**
1. Go to: `https://getsltr.com/forgot-password`
2. Enter your email
3. Check inbox for reset email
4. Verify link works

---

## 🔧 **Troubleshooting**

### **Emails Not Sending?**

1. **Check Resend Domain:**
   - Go to **Resend Dashboard** → **Domains**
   - Verify `getsltr.com` shows "Verified" status
   - If not verified, add DNS records and wait

2. **Check Supabase SMTP:**
   - Verify SMTP settings are saved
   - Test SMTP connection (Supabase has a test button)
   - Double-check API key is correct

3. **Check Resend Logs:**
   - Go to **Resend Dashboard** → **Logs**
   - Look for any errors or delivery failures

4. **Check Spam Folder:**
   - Emails might be filtered

---

## ✅ **Quick Checklist**

- [ ] SMTP enabled in Supabase
- [ ] SMTP host: `smtp.resend.com`
- [ ] SMTP user: `resend`
- [ ] SMTP password: Your Resend API key
- [ ] Sender email: `onboarding@getsltr.com`
- [ ] Domain verified in Resend
- [ ] Site URL set to `https://getsltr.com`
- [ ] Redirect URLs added
- [ ] Test email sent successfully

---

**Need help? Let me know what step you're on!**

