# Tap Feature Setup ✅

## Problem
Tap functionality wasn't working because the `taps` table and `tap_user()` function didn't exist in the database.

## Solution
Created migration: `supabase/migrations/20251112_create_taps_table.sql`

## What It Includes

### 1. Taps Table
- Tracks all user taps (when someone likes/interests another user)
- Automatically detects mutual taps (both users tapped each other)
- Prevents duplicate taps with UNIQUE constraint

### 2. Database Functions

#### `tap_user(target_user_id)`
- Taps another user
- Automatically detects if it's a mutual tap
- Returns JSON with tap status

#### `untap_user(target_user_id)`
- Removes a tap
- Updates mutual status if needed

#### `has_tapped(target_user_id)`
- Checks if current user has tapped someone
- Returns boolean

#### `get_mutual_taps_count()`
- Returns count of mutual taps for current user

### 3. Security
- Row Level Security (RLS) enabled
- Users can only:
  - View taps they sent
  - View taps they received
  - Create/delete their own taps

## To Apply This Migration

### Step 1: Go to Supabase Dashboard
1. Open your project at https://supabase.com/dashboard
2. Click "SQL Editor" in the left sidebar

### Step 2: Run the Migration
Copy and paste the entire contents of:
```
supabase/migrations/20251112_create_taps_table.sql
```

### Step 3: Execute
Click "Run" button in the SQL Editor

## How Taps Work in the App

### Where Users Can Tap
1. **User Profile Modal** - Click the 😈 button
2. **Map View** - Click user markers
3. **Grid View** - Click on profile cards

### Tap UI States
- **Not Tapped**: 😈 (devil emoji)
- **Tapped**: 💞 (two hearts emoji)
- **Mutual Tap**: Marked with special badge

### Tap Pages
- `/taps` - View all taps
  - **My Taps** - People you've tapped
  - **Tapped Me** - People who tapped you
  - **Mutual** - Mutual taps (matches)

## Testing

After applying migration:

1. Open app and login
2. View a user profile
3. Click the 😈 button
4. Should see it change to 💞
5. Go to `/taps` page
6. Should see the tap listed under "My Taps"

## Database Schema

```sql
taps (
  id UUID PRIMARY KEY,
  tapper_id UUID (who initiated the tap),
  tapped_user_id UUID (who received the tap),
  tapped_at TIMESTAMPTZ,
  is_mutual BOOLEAN,
  UNIQUE(tapper_id, tapped_user_id)
)
```

## Indexes
- `idx_taps_tapper_id` - Fast lookups for "my taps"
- `idx_taps_tapped_user_id` - Fast lookups for "tapped me"
- `idx_taps_is_mutual` - Fast lookups for mutual taps
- `idx_taps_tapped_at` - Sorting by date

## Next Steps
After applying this migration, the tap feature will be fully functional!
