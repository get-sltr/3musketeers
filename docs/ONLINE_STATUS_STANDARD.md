# Online Status Standardization

## Problem
The codebase had inconsistent column naming for online status:
- Database column: `online` (BOOLEAN)
- Some functions returned: `is_online`
- Frontend expected: `is_online`

This caused users to appear offline even when they were connected.

## Solution
**Database Column**: `online` (BOOLEAN) - this is the source of truth
**API Response**: `is_online` - aliased in SQL functions for frontend compatibility

## Standardized Pattern

### ✅ Database Schema
```sql
-- profiles table has:
online BOOLEAN DEFAULT false
```

### ✅ SQL Functions
```sql
-- All RPC functions should alias online -> is_online
SELECT 
  prof.online AS is_online
FROM profiles prof
```

### ✅ Frontend Code
```typescript
// Always use is_online in TypeScript
interface User {
  is_online: boolean  // ✅ Correct
  // online: boolean  // ❌ Don't use this
}
```

## Updated Migrations

1. **20251111_add_geo_nearby_profiles.sql**
   - Changed: `prof.is_online` → `prof.online AS is_online`

2. **20251112_add_super_admin_role.sql**
   - Changed: `WHERE is_online = true` → `WHERE online = true`
   - Changed: Return column aliased as `is_online`

3. **20251116_fix_nearby_profiles_blocks.sql**
   - Changed: `prof.is_online` → `prof.online AS is_online`

## How Online Status Works

### 1. User Connects
```typescript
// RealtimeManager.connect()
await supabase
  .from('profiles')
  .update({ online: true, last_active: new Date().toISOString() })
  .eq('id', userId)
```

### 2. User Disconnects
```typescript
// RealtimeManager.disconnect()
await supabase
  .from('profiles')
  .update({ online: false, last_active: new Date().toISOString() })
  .eq('id', userId)
```

### 3. Frontend Receives Data
```typescript
// get_nearby_profiles returns is_online
const users = await supabase.rpc('get_nearby_profiles', {...})
users.forEach(user => {
  console.log(user.is_online) // ✅ Works
})
```

## Apply Changes

Run the migration script:
```bash
./scripts/apply-migrations.sh
```

Or manually:
```bash
supabase db push
```

## Testing

After applying:
1. User connects → appears online in grid
2. User disconnects → appears offline
3. Realtime updates show status changes immediately
