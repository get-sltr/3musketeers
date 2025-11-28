# Database Remediation: Groups & Channels Schema Conflict

**Issue ID:** SLTR-DB-001
**Severity:** CRITICAL
**Date:** 2025-11-28
**Status:** SOLUTION READY
**Database Engineer:** Analysis Complete

---

## Executive Summary

The groups and channels features are **completely non-functional** due to conflicting database migrations creating incompatible table schemas. Three separate migrations attempted to create the `groups` table with different column names and structures, resulting in application code that references non-existent columns.

**Impact:**
- ❌ Cannot create groups (column `host_id` does not exist)
- ❌ Cannot create channels (RLS policies fail validation)
- ❌ Group detail pages fail to load data
- ❌ "The Club" default group cannot be initialized

**Root Cause:** Schema inconsistency between migrations created on different dates with conflicting requirements.

---

## Problem Details

### Conflicting Migrations

| Migration | Date | Primary Key Column | Owner Column | Issues |
|-----------|------|-------------------|--------------|--------|
| `20251021000000_create_groups_table.sql` | Oct 21 | `name` | `owner_id` | Creates full membership system |
| `20251103_add_places_groups.sql` | Nov 3 | `title` | `host_id` | Uses `CREATE TABLE IF NOT EXISTS` - silently fails if table exists |
| `20251126_create_channels_table.sql` | Nov 26 | N/A | N/A | RLS policies reference `host_id` which doesn't exist |

### Schema Comparison

#### Migration 1 Schema (Oct 21)
```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,           -- ⚠️ Application expects this
  owner_id UUID NOT NULL,       -- ⚠️ NOT used by application code
  is_private BOOLEAN,
  max_members INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Migration 2 Expected Schema (Nov 3)
```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,          -- ⚠️ Application doesn't use this
  host_id UUID,                 -- ⚠️ Application code REQUIRES this
  time TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ
);
```

#### What Actually Happened
Because Migration 1 ran first and created the `groups` table, Migration 2's `CREATE TABLE IF NOT EXISTS` **did nothing**. The table retained Migration 1's schema (`owner_id`, `name`) but the application code was written expecting Migration 2's schema (`host_id`, `title`).

---

## Failure Points Identified

### 1. Application Insert Failures

**File:** `/home/user/3musketeers/src/app/api/groups/setup-club/route.ts`
**Line:** 46
**Error:** `column "host_id" does not exist`

```typescript
const { data: newGroup, error: groupError } = await supabase
  .from('groups')
  .insert({
    name: 'The Club sltr',
    description: '...',
    host_id: user.id,  // ❌ FAILS - column doesn't exist
  })
```

**File:** `/home/user/3musketeers/src/app/groups/page.tsx`
**Line:** 93
**Error:** Same - `column "host_id" does not exist`

```typescript
const { error } = await supabase
  .from('groups')
  .insert({
    name: groupName.trim(),
    description: groupDescription.trim() || null,
    host_id: user.id,  // ❌ FAILS - column doesn't exist
  })
```

### 2. Channels RLS Policy Failures

**File:** `/home/user/3musketeers/supabase/migrations/20251126_create_channels_table.sql`
**Lines:** 32-38
**Error:** RLS policy references non-existent column

```sql
CREATE POLICY "channels_insert_host" ON public.channels
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id AND host_id = auth.uid()  -- ❌ FAILS - host_id doesn't exist
    )
  );
```

This prevents ANY channel creation because the policy cannot be evaluated.

### 3. Data Retrieval Inconsistencies

**File:** `/home/user/3musketeers/src/app/groups/[id]/page.tsx`
**Line:** 230
**Workaround:** Code attempts to handle both schemas

```typescript
<h1 className="text-white text-lg font-bold">
  {group.name || group.title}  // ⚠️ Fallback indicates known issue
</h1>
```

---

## Solution Architecture

### Strategy: Unified Schema with Backward Compatibility

Rather than choosing one schema over the other, we implement **BOTH** schemas simultaneously with automatic synchronization:

1. **Add missing columns** to support both naming conventions
2. **Sync data bidirectionally** using database triggers
3. **Update RLS policies** to check both column variants
4. **Preserve all existing data** without migration
5. **Enable future code flexibility** - developers can use either naming convention

### Migration File Created

**Path:** `/home/user/3musketeers/supabase/migrations/20251128_fix_groups_schema_conflict.sql`

**What it does:**
1. ✅ Adds `host_id` column (synced to `owner_id`)
2. ✅ Adds `title` column (synced to `name`)
3. ✅ Adds `time` column for events
4. ✅ Creates trigger to keep columns synchronized
5. ✅ Updates all RLS policies to work with both naming conventions
6. ✅ Adds performance indexes
7. ✅ Includes validation checks

### Key Innovation: Automatic Column Synchronization

```sql
CREATE TRIGGER sync_groups_columns_trigger
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_groups_columns();
```

This trigger ensures:
- When `owner_id` is set, `host_id` is automatically set to the same value
- When `host_id` is set, `owner_id` is automatically set to the same value
- When `name` is set, `title` is automatically set to the same value
- When `title` is set, `name` is automatically set to the same value

**Result:** Application code can use EITHER naming convention and it will work correctly.

---

## Implementation Plan

### Phase 1: Pre-Migration Validation

1. **Backup current database state**
   ```bash
   # Export groups data (if any exists)
   supabase db dump > backup_groups_$(date +%Y%m%d).sql
   ```

2. **Check current schema**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'groups'
   ORDER BY ordinal_position;
   ```

3. **Count existing records**
   ```sql
   SELECT
     (SELECT COUNT(*) FROM public.groups) AS groups_count,
     (SELECT COUNT(*) FROM public.channels) AS channels_count,
     (SELECT COUNT(*) FROM public.group_members) AS members_count,
     (SELECT COUNT(*) FROM public.group_messages) AS messages_count;
   ```

### Phase 2: Apply Migration

**Method 1: Via Supabase Dashboard**
1. Navigate to SQL Editor in Supabase Dashboard
2. Load `/home/user/3musketeers/supabase/migrations/20251128_fix_groups_schema_conflict.sql`
3. Execute migration
4. Verify output shows success messages

**Method 2: Via Supabase CLI**
```bash
cd /home/user/3musketeers
supabase db push
```

**Expected Output:**
```
✓ Added host_id column to groups table
✓ Added title column to groups table
✓ Added time column to groups table
✓ Column sync trigger installed
✓ Performance indexes created
✅ Groups schema migration completed successfully
```

### Phase 3: Verification

1. **Run verification script**
   ```bash
   psql $DATABASE_URL -f /home/user/3musketeers/sql/verify-groups-channels-schema.sql
   ```

2. **Expected results:**
   - ✓ All 4 required columns exist: `name`, `title`, `owner_id`, `host_id`
   - ✓ Sync trigger is installed
   - ✓ RLS policies updated (6+ policies for groups/channels)
   - ✓ All indexes created
   - ✓ No data inconsistencies

3. **Manual verification queries**
   ```sql
   -- Verify columns exist
   SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'groups'
   ORDER BY column_name;

   -- Should return: created_at, description, host_id, id, is_private,
   --                latitude, longitude, max_members, name, owner_id,
   --                photo, tags, time, title, updated_at
   ```

### Phase 4: Application Testing

1. **Test group creation** (via API)
   ```bash
   curl -X POST https://your-app.com/api/groups/setup-club \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json"
   ```
   Expected: "The Club sltr created successfully"

2. **Test group creation** (via UI)
   - Navigate to `/groups`
   - Click "+ Create Group"
   - Fill in name and description
   - Submit form
   Expected: Group created successfully

3. **Test channel creation** (via UI)
   - Navigate to `/groups/channels`
   - Select a group
   - Click "+ Create Channel"
   - Fill in channel details
   - Submit form
   Expected: Channel created successfully

4. **Test group detail page**
   - Navigate to `/groups/[group-id]`
   - Verify group name displays correctly
   - Verify channels list loads
   - Send a test message
   Expected: All features work without errors

### Phase 5: Performance Validation

1. **Check query performance**
   ```sql
   EXPLAIN ANALYZE
   SELECT g.*, COUNT(c.id) AS channel_count
   FROM public.groups g
   LEFT JOIN public.channels c ON c.group_id = g.id
   WHERE g.host_id = 'user-uuid'
   GROUP BY g.id;
   ```
   Expected: Uses index on `host_id`, execution time < 50ms

2. **Check RLS policy performance**
   ```sql
   SET ROLE authenticated;
   SET request.jwt.claims.sub = 'user-uuid';

   EXPLAIN ANALYZE
   SELECT * FROM public.channels WHERE group_id = 'group-uuid';
   ```
   Expected: RLS policy evaluation < 10ms overhead

---

## Rollback Plan

If migration causes issues:

### Option 1: Immediate Rollback (Safe)
```sql
-- Drop added columns (data in owner_id/name preserved)
ALTER TABLE public.groups DROP COLUMN IF EXISTS host_id;
ALTER TABLE public.groups DROP COLUMN IF EXISTS title;
ALTER TABLE public.groups DROP COLUMN IF EXISTS time;

-- Remove sync trigger
DROP TRIGGER IF EXISTS sync_groups_columns_trigger ON public.groups;
DROP FUNCTION IF EXISTS public.sync_groups_columns();

-- Restore original channels policies
-- (Run original migration 20251126_create_channels_table.sql RLS section)
```

### Option 2: Full Restore
```bash
# Restore from backup
psql $DATABASE_URL < backup_groups_YYYYMMDD.sql
```

---

## Application Code Changes (Optional Improvements)

While the migration makes both naming conventions work, you may optionally want to standardize on one:

### Recommended: Standardize on `host_id` and `name`

**Rationale:**
- `host_id` is more intuitive than `owner_id` for group creators
- `name` is simpler and more common than `title`
- Channels already use this convention

**Files to update:**
1. ✅ `/src/app/api/groups/setup-club/route.ts` - Already uses `host_id` ✓
2. ✅ `/src/app/groups/page.tsx` - Already uses `host_id` ✓
3. ⚠️ `/src/app/groups/[id]/page.tsx` - Remove fallback `group.name || group.title`

**Change in `/src/app/groups/[id]/page.tsx` line 230:**
```typescript
// Before
<h1>{group.name || group.title}</h1>

// After (simplified)
<h1>{group.name}</h1>
```

**TypeScript Interface Standardization:**

Create a unified type in `/src/types/database.ts`:
```typescript
export interface Group {
  id: string
  name: string              // Primary display name
  description?: string
  host_id: string           // Primary owner reference
  is_private?: boolean
  max_members?: number
  latitude?: number
  longitude?: number
  tags?: string[]
  time?: string            // For event groups
  created_at: string
  updated_at?: string

  // Deprecated aliases (for backward compatibility)
  title?: string           // Alias for name
  owner_id?: string        // Alias for host_id
}
```

---

## Long-Term Recommendations

### 1. Migration Management Process

**Prevent future conflicts:**
- ✅ Review ALL existing migrations before creating new ones
- ✅ Use `ALTER TABLE` instead of `CREATE TABLE IF NOT EXISTS` for modifications
- ✅ Namespace migrations by feature (e.g., `groups_`, `channels_`, `auth_`)
- ✅ Maintain a migration changelog documenting schema changes

### 2. Database Schema Documentation

**Create and maintain:**
- `docs/database-schema.md` - Complete table documentation
- `docs/database-rls-policies.md` - RLS policy reference
- `docs/database-indexes.md` - Performance index documentation

### 3. Testing Infrastructure

**Implement automated tests:**
```typescript
// Example: tests/database/groups.test.ts
describe('Groups Schema', () => {
  it('should support host_id column', async () => {
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: 'Test', host_id: userId })
    expect(error).toBeNull()
  })

  it('should sync host_id to owner_id', async () => {
    // Test trigger functionality
  })
})
```

### 4. Migration Validation Workflow

**Add pre-commit hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for conflicting table creations
if git diff --cached --name-only | grep -q "migrations/.*\.sql"; then
  echo "🔍 Checking SQL migrations for conflicts..."
  # Run validation script
  ./scripts/validate-migrations.sh
fi
```

### 5. Schema Versioning

**Implement schema version tracking:**
```sql
CREATE TABLE IF NOT EXISTS public.schema_version (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.schema_version (version, description)
VALUES ('2.0.0', 'Unified groups schema with host_id/owner_id sync');
```

---

## Success Criteria

Migration is considered successful when:

- [ ] All 4 columns exist: `name`, `title`, `owner_id`, `host_id`
- [ ] Sync trigger installed and functioning
- [ ] RLS policies updated for both column names
- [ ] No errors in Supabase logs
- [ ] Group creation works via API and UI
- [ ] Channel creation works via UI
- [ ] Group detail pages load correctly
- [ ] "The Club sltr" default group initializes
- [ ] No data loss (all existing groups preserved)
- [ ] Query performance within acceptable limits (< 100ms for list queries)

---

## Support & Troubleshooting

### Common Issues

**Issue 1: "Column already exists" error**
```
ERROR: column "host_id" already exists
```
**Solution:** Migration is idempotent - this is expected. Verify column was created correctly.

**Issue 2: Sync trigger not firing**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'sync_groups_columns_trigger';

-- Manually test trigger
INSERT INTO groups (name, owner_id) VALUES ('Test', 'uuid');
SELECT name, title, owner_id, host_id FROM groups WHERE name = 'Test';
-- Both name/title and owner_id/host_id should be populated
```

**Issue 3: RLS policy denies access**
```
ERROR: new row violates row-level security policy
```
**Solution:** Verify user is authenticated and policies allow the operation:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'groups';

-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid';
SELECT * FROM groups WHERE host_id = 'user-uuid';
```

### Debug Queries

```sql
-- View complete groups schema
\d+ public.groups

-- View all triggers on groups table
SELECT * FROM pg_trigger WHERE tgrelid = 'public.groups'::regclass;

-- View all policies
SELECT * FROM pg_policies WHERE tablename IN ('groups', 'channels');

-- Check for data inconsistencies
SELECT id, name, title, owner_id, host_id
FROM public.groups
WHERE (name IS NULL OR title IS NULL OR owner_id IS NULL OR host_id IS NULL)
   OR (name != title OR owner_id != host_id);
```

---

## File Reference

**Migration Files:**
- `/home/user/3musketeers/supabase/migrations/20251128_fix_groups_schema_conflict.sql` - Main fix migration

**Verification Files:**
- `/home/user/3musketeers/sql/verify-groups-channels-schema.sql` - Comprehensive verification script

**Documentation:**
- `/home/user/3musketeers/docs/DATABASE_REMEDIATION_GROUPS_CHANNELS.md` - This document

**Affected Application Files:**
- `/home/user/3musketeers/src/app/api/groups/setup-club/route.ts`
- `/home/user/3musketeers/src/app/groups/page.tsx`
- `/home/user/3musketeers/src/app/groups/[id]/page.tsx`
- `/home/user/3musketeers/src/app/groups/channels/page.tsx`

---

## Conclusion

This migration resolves the critical schema conflict that prevented groups and channels from functioning. The unified schema approach ensures backward compatibility while enabling both current and future code to work correctly regardless of naming convention used.

**Next Steps:**
1. Apply migration in development environment
2. Run verification script
3. Test all group/channel features
4. Apply to staging environment
5. Monitor for 24 hours
6. Apply to production with maintenance window

**Estimated Downtime:** < 5 minutes (migration execution time)
**Risk Level:** LOW (migration is idempotent and preserves all data)
**Rollback Time:** < 2 minutes if needed

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
**Prepared By:** Database Engineer
**Review Status:** Ready for Implementation
