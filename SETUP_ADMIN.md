# Admin & Black Card Setup

## Step 1: Apply Database Migrations

```bash
supabase db push
```

If you get policy errors, run in Supabase SQL Editor instead:
1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of these files in order:
   - `supabase/migrations/20251111_create_founder_black_cards.sql`
   - `supabase/migrations/20251119_add_subscription_privileges.sql`

## Step 2: Set Yourself as Super Admin

### Option A: Using Script
```bash
./scripts/set-super-admin.sh your@email.com
```

### Option B: Using Supabase SQL Editor
```sql
-- Replace with your actual email
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'your@email.com';

-- Verify it worked
SELECT id, email, is_super_admin, display_name
FROM profiles 
WHERE is_super_admin = true;
```

## Step 3: Verify Tables Exist

Run in Supabase SQL Editor:
```sql
-- Check if founder_cards table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('founder_cards', 'verification_logs');

-- Check if subscription columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('subscription_tier', 'is_super_admin', 'founder_number');
```

Should return:
- `founder_cards` ✓
- `verification_logs` ✓
- `subscription_tier` ✓
- `is_super_admin` ✓
- `founder_number` ✓

## Step 4: Generate Black Cards (if not done yet)

### Check if cards already exist:
```sql
SELECT COUNT(*) as card_count FROM founder_cards;
```

If count is 0, generate them:

```bash
# Install dependencies if needed
npm install

# Generate 100 black cards
node scripts/generate_black_cards.js

# Import to Supabase
node scripts/import_to_supabase.js
```

Or manually create via SQL:
```sql
-- Generate sample card
INSERT INTO founder_cards (
  founder_number, 
  founder_name, 
  verification_code, 
  verify_url,
  is_active
) VALUES (
  1,
  'Founder #001',
  'SLTR-FC-' || substring(md5(random()::text) from 1 for 4) || '-' || substring(md5(random()::text) from 1 for 4),
  'https://yourapp.com/black-card/verify',
  true
);
```

## Step 5: Access Admin Features

After completing steps 1-2:

1. **Refresh your browser** (hard refresh: Cmd+Shift+R)
2. Look for red/purple shield icon in **top-right corner**
3. Click it to open Admin Dashboard
4. Go to "Actions" tab
5. Click "👑 Black Card System" to manage cards

## Troubleshooting

### Admin Dashboard Not Showing
```sql
-- Double check super admin status
SELECT email, is_super_admin FROM profiles WHERE email = 'your@email.com';
```

### Black Cards Page Shows Error
Check if tables exist:
```sql
SELECT * FROM founder_cards LIMIT 1;
```

### Functions Missing
Re-run the super admin migration:
```sql
-- Copy/paste entire contents of:
-- supabase/migrations/20251112_add_super_admin_role.sql
```

## What You Should See

### Admin Dashboard (Top-Right Icon)
- 📊 Statistics Tab - User counts and analytics
- 👥 Users Tab - Recent registrations
- ⚡ Actions Tab - Links to:
  - 👑 Black Card System
  - ∝ SLTR Plus Dashboard

### Black Card Admin (`/admin/black-cards`)
- Stats: Total, Redeemed, Available, Redemption Rate
- Card list with verification codes
- Search and filter options
- CSV export
- Real-time redemption tracking

## Quick Commands Reference

```bash
# Set super admin
./scripts/set-super-admin.sh your@email.com

# Apply migrations
supabase db push

# Check migration status
supabase migration list

# Generate black cards (if needed)
node scripts/generate_black_cards.js
node scripts/import_to_supabase.js
```
