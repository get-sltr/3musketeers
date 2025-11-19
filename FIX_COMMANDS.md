# Fix Commands - Online Status & SLTR Pro

## Issues Fixed
1. ✅ Users showing offline (column name standardization)
2. ✅ SLTR Pro system not working (migration not applied)
3. ✅ Favorites table missing (now created)

## Apply Fixes

### Method 1: Use the script (Recommended)
```bash
./scripts/apply-migrations.sh
```

### Method 2: Manual Supabase CLI
```bash
# Link to your project if not already
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### Method 3: Direct SQL (if no Supabase CLI)
If you're using Supabase Dashboard, run these in the SQL Editor:

1. **Fix get_nearby_profiles function**
```sql
CREATE OR REPLACE FUNCTION public.get_nearby_profiles(
  p_user_id uuid,
  p_origin_lat double precision,
  p_origin_lon double precision,
  p_radius_miles double precision default 25
)
RETURNS TABLE (
  id uuid,
  display_name text,
  photo_url text,
  photos text[],
  is_online boolean,
  dtfn boolean,
  party_friendly boolean,
  latitude double precision,
  longitude double precision,
  founder_number integer,
  about text,
  kinks text[],
  tags text[],
  "position" text,
  age integer,
  incognito_mode boolean,
  distance_miles double precision,
  is_self boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH origin AS (
    SELECT p_origin_lat AS lat, p_origin_lon AS lon, COALESCE(NULLIF(p_radius_miles, 0), 1)::double precision AS radius
  )
  SELECT
    prof.id,
    prof.display_name,
    prof.photo_url,
    CASE
      WHEN jsonb_typeof(prof.photos) = 'array'
      THEN (SELECT array_agg(value::text) FROM jsonb_array_elements_text(prof.photos))
      ELSE ARRAY[]::text[]
    END AS photos,
    prof.online AS is_online,
    prof.dtfn,
    prof.party_friendly,
    prof.latitude,
    prof.longitude,
    prof.founder_number,
    prof.about,
    prof.kinks,
    prof.tags,
    prof."position",
    prof.age,
    prof.incognito_mode,
    public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude) AS distance_miles,
    prof.id = p_user_id AS is_self
  FROM public.profiles prof
  CROSS JOIN origin
  LEFT JOIN public.blocks b1
    ON b1.blocker_id = p_user_id
   AND b1.blocked_id = prof.id
  LEFT JOIN public.blocks b2
    ON b2.blocker_id = prof.id
   AND b2.blocked_id = p_user_id
  WHERE prof.latitude IS NOT NULL
    AND prof.longitude IS NOT NULL
    AND COALESCE(prof.incognito_mode, false) = false
    AND b1.blocked_id IS NULL
    AND b2.blocker_id IS NULL
    AND (
      prof.id = p_user_id
      OR public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude) <= origin.radius
    )
  ORDER BY
    CASE WHEN prof.id = p_user_id THEN 0 ELSE 1 END,
    public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude)
  LIMIT 500;
$function$;
```

2. **Apply SLTR subscription migration**
Copy and paste the entire content of:
`supabase/migrations/20251119_add_subscription_privileges.sql`
into the SQL Editor and run it.

## Verify Fixes

### Check online status:
```bash
# Start dev server
npm run dev

# Open browser, login, check grid view
# Users should show green dot when online
```

### Check SLTR Pro:
```bash
# In browser console:
# Check if subscription columns exist
```

Or in Supabase SQL Editor:
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('subscription_tier', 'subscription_expires_at');

-- Should return 2 rows
```

## What Changed

### Online Status (3 files)
- `supabase/migrations/20251111_add_geo_nearby_profiles.sql`
- `supabase/migrations/20251112_add_super_admin_role.sql`
- `supabase/migrations/20251116_fix_nearby_profiles_blocks.sql`

**Change**: `prof.is_online` → `prof.online AS is_online`

### SLTR Pro System (1 file)
- `supabase/migrations/20251119_add_subscription_privileges.sql`

**Adds**:
- `subscription_tier` column (free/plus)
- `subscription_expires_at` column
- DTFN activation tracking
- Privilege check functions
- Performance indexes

## Next Steps

After applying:
1. Restart your dev server
2. Login and check grid view
3. Test online status updates
4. Test SLTR Pro features (if you have test subscription)

## Rollback (if needed)

```sql
-- Remove subscription columns
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_expires_at;
DROP TABLE IF EXISTS dtfn_activations;
DROP TABLE IF EXISTS feature_usage;
```
