# 📧 Email Configuration Guide - SLTR

## 🔍 **Understanding Email Types**

### 1. **Authentication Emails (Supabase)**
- **What:** Email verification, password reset
- **From:** Supabase Auth
- **Issue:** Free tier has limited emails (50/day), may need custom SMTP

### 2. **Payment Emails (Stripe)**
- **What:** Payment receipts, subscription updates
- **From:** Stripe automatically
- **Issue:** Customer may not receive emails if settings disabled

---

## ✅ **SOLUTION 1: Supabase Authentication Emails**

### **Problem:** Not receiving signup/verification emails

### **Fix Options:**

#### **Option A: Configure Custom SMTP in Supabase**
1. Go to **Supabase Dashboard** → **Project Settings** → **Auth** → **Email Templates**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure your SMTP provider:
   - **Gmail:** Use App Password
   - **SendGrid:** Use API key
   - **Mailgun:** Use API key
   - **Resend:** Use API key (recommended for deliverability)

#### **Option B: Check Supabase Email Settings**
1. Go to **Supabase Dashboard** → **Project Settings** → **Auth**
2. Check **Enable email confirmations** is ON
3. Verify **Site URL** is set to `https://getsltr.com`
4. Check **Redirect URLs** includes `https://getsltr.com/**`

#### **Option C: Check Email in Supabase Dashboard**
1. Go to **Supabase Dashboard** → **Auth** → **Users**
2. Check if user was created successfully
3. Manually resend verification email if needed

---

## ✅ **SOLUTION 2: Stripe Payment Emails**

### **Problem:** Not receiving payment receipts after Stripe checkout

### **Fix Options:**

#### **Option A: Enable Stripe Customer Emails**
**Stripe automatically sends emails, but you can verify:**

1. Go to **Stripe Dashboard** → **Settings** → **Emails**
2. Check these are enabled:
   - ✅ **Successful payments** (receipts)
   - ✅ **Refunds** (if applicable)
   - ✅ **Subscription updates** (for members)

#### **Option B: Verify Customer Email in Checkout**
Your code already includes `customer_email` in checkout session:
```typescript
customer_email: email,  // Line 121 in src/app/api/stripe/route.ts
```

This ensures Stripe sends receipt to the customer.

#### **Option C: Check Stripe Dashboard**
1. Go to **Stripe Dashboard** → **Payments**
2. Check if payment was successful
3. Click on payment → Check "Email sent" status
4. Manually resend receipt if needed

---

## 🔧 **Quick Fixes**

### **For Supabase Authentication Emails:**
1. **Check spam folder**
2. **Verify email address** is correct
3. **Check Supabase Dashboard** → **Auth** → **Users** for user status
4. **Resend verification email** from dashboard
5. **Configure custom SMTP** if on free tier (50 emails/day limit)

### **For Stripe Payment Emails:**
1. **Check spam folder**
2. **Verify email** in Stripe Dashboard → Payments
3. **Check Stripe Settings** → **Emails** are enabled
4. **Manually resend** receipt from Stripe Dashboard

---

## 📝 **Configuration Checklist**

### **Supabase:**
- [ ] Site URL set to `https://getsltr.com`
- [ ] Redirect URLs include `https://getsltr.com/**`
- [ ] Email confirmations enabled
- [ ] Custom SMTP configured (if needed)
- [ ] Email templates customized (optional)

### **Stripe:**
- [ ] Customer emails enabled in Settings → Emails
- [ ] Payment receipts enabled
- [ ] Subscription emails enabled
- [ ] Business info set (for email branding)

---

## 🚨 **Common Issues**

### **Supabase Emails Not Sending:**
- **Free tier limit:** 50 emails/day - upgrade or use custom SMTP
- **Email domain not verified** - configure custom SMTP
- **Spam filtering** - check spam folder
- **Wrong redirect URL** - verify in Supabase settings

### **Stripe Emails Not Sending:**
- **Customer email missing** - check checkout session
- **Email settings disabled** - enable in Stripe Dashboard
- **Spam filtering** - check spam folder
- **Business info not set** - Stripe may not send from unverified account

---

## 💡 **Recommended Setup**

### **For Production (Best Deliverability):**

1. **Supabase Authentication:**
   - Use **Resend** or **SendGrid** for custom SMTP
   - Better deliverability than free tier
   - Higher email limits

2. **Stripe Payments:**
   - Stripe automatically sends receipts
   - Just ensure customer_email is set (already done in code)
   - Enable email notifications in Stripe Dashboard

---

**Need help setting up custom SMTP? Let me know which provider you want to use!**

