# Restore Super Admin Access 🔧

**Issue:** kminn121@gmail.com lost super admin features after migration  
**Status:** 🔴 Database field needs to be set

---

## 🔍 WHY THIS HAPPENED

The AdminDashboard component checks for `is_super_admin` field in the profiles table:

```typescript
// src/components/AdminDashboard.tsx (line 49)
const { data: profile } = await supabase
  .from('profiles')
  .select('is_super_admin')
  .eq('id', session.user.id)
  .single()

setIsAdmin(profile?.is_super_admin === true)
```

**The field exists** (from migration `20251112_add_super_admin_role.sql`), but the value is set to `false` or `null` for kminn121@gmail.com.

---

## ✅ FIX (3 Options)

### **Option 1: Run SQL in Supabase Dashboard** (FASTEST)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

```sql
UPDATE public.profiles
SET is_super_admin = true
WHERE email = 'kminn121@gmail.com';
```

5. Click **Run**
6. Refresh your app and the admin button should appear (top right corner)

---

### **Option 2: Run the Full SQL Script**

I created a complete SQL script at: `SET_SUPER_ADMIN.sql`

1. Go to Supabase SQL Editor
2. Copy the entire contents of `SET_SUPER_ADMIN.sql`
3. Paste and run
4. This will:
   - Check if column exists
   - Set kminn121@gmail.com as super admin
   - Verify the update
   - Show all super admins

---

### **Option 3: Use Supabase CLI** (for developers)

If you have Supabase CLI installed:

```bash
# Connect to your database
npx supabase db execute --file SET_SUPER_ADMIN.sql

# Or run directly
npx supabase db execute "UPDATE public.profiles SET is_super_admin = true WHERE email = 'kminn121@gmail.com';"
```

---

## 🧪 VERIFY IT WORKED

### 1. Check Database
Run this query in Supabase SQL Editor:

```sql
SELECT 
    email,
    username, 
    display_name,
    is_super_admin,
    created_at
FROM public.profiles
WHERE email = 'kminn121@gmail.com';
```

**Expected result:**
- `is_super_admin` should be `true`

### 2. Check App
1. Log in with kminn121@gmail.com
2. Look for a **red/purple shield icon** in the top-right corner
3. Click it to open the Admin Dashboard
4. You should see:
   - 📊 Statistics tab (Total Users, New Today, etc.)
   - 👥 Recent Users tab

---

## 🎯 WHAT THE ADMIN DASHBOARD DOES

### Statistics Tab
Shows real-time stats:
- Total Users
- New Today
- New This Week
- New This Month
- Online Now
- With Photos
- With Location
- Verified Founders

### Recent Users Tab
Shows the last 20 registered users with:
- Profile photo
- Display name & username
- Founder number (if any)
- Registration time
- Online status
- Location status

### Database Functions Used
```sql
-- Get statistics (super admin only)
get_user_statistics(p_admin_id UUID)

-- Get recent users (super admin only)
get_recent_registrations(p_admin_id UUID, p_limit INT)
```

Both functions verify super admin status before returning data.

---

## 🚨 TROUBLESHOOTING

### Problem: Admin button doesn't appear after running SQL

**Possible causes:**

1. **Not logged in as kminn121@gmail.com**
   - Log out and log back in
   - Clear browser cache/cookies

2. **Migration not applied**
   - Check if `is_super_admin` column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name = 'is_super_admin';
   ```
   - If no result, run the migration:
   ```bash
   npx supabase db push
   ```

3. **RPC functions missing**
   - Check if functions exist:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name IN ('get_user_statistics', 'get_recent_registrations');
   ```
   - If missing, run the migration file

4. **Component not rendering**
   - Check browser console for errors
   - Look for: `src/components/AdminDashboard.tsx` errors

---

## 📂 RELATED FILES

| File | Purpose |
|------|---------|
| `src/components/AdminDashboard.tsx` | Admin dashboard component |
| `src/app/layout.tsx` (line 78) | Where AdminDashboard is rendered |
| `supabase/migrations/20251112_add_super_admin_role.sql` | Database migration |
| `SET_SUPER_ADMIN.sql` | Quick fix SQL script |

---

## 🔐 SECURITY NOTES

- Only users with `is_super_admin = true` can:
  - See the admin button
  - Access the dashboard
  - Call the RPC functions
- RPC functions have `SECURITY DEFINER` with admin checks
- All queries are protected at the database level

---

**After running the SQL, log out and log back in to see the admin button!** 🚀
