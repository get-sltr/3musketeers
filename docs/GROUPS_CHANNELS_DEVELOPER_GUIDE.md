# Groups & Channels Developer Guide

**Quick Reference for SLTR Developers**
**Last Updated:** 2025-11-28

---

## Quick Start

### Creating a Group

Both naming conventions work (schema automatically syncs):

**Option 1: Using host_id (Recommended)**
```typescript
const { data, error } = await supabase
  .from('groups')
  .insert({
    name: 'My Group',
    description: 'Group description',
    host_id: userId,
  })
```

**Option 2: Using owner_id (Legacy)**
```typescript
const { data, error } = await supabase
  .from('groups')
  .insert({
    name: 'My Group',
    description: 'Group description',
    owner_id: userId,
    is_private: false,
    max_members: 50,
  })
```

**Both work!** The database trigger automatically syncs:
- `host_id` ↔ `owner_id`
- `name` ↔ `title`

---

## Database Schema

### Groups Table

```typescript
interface Group {
  // Primary columns (use these)
  id: string
  name: string              // Group name/title
  description?: string      // Group description
  host_id: string          // Group creator/owner
  created_at: string
  updated_at?: string

  // Optional columns
  is_private?: boolean     // Privacy setting (default: false)
  max_members?: number     // Member limit (default: 50)
  latitude?: number        // Location (for geo groups)
  longitude?: number       // Location (for geo groups)
  tags?: string[]          // Tags/categories
  time?: string           // Event time (for event groups)
  photo?: string          // Group photo URL

  // Deprecated aliases (auto-synced, backward compatible)
  title?: string          // Alias for 'name'
  owner_id?: string       // Alias for 'host_id'
}
```

### Channels Table

```typescript
interface Channel {
  id: string
  group_id: string         // Foreign key to groups.id
  name: string            // Channel name
  description?: string    // Channel description
  type: 'text' | 'voice' | 'video'  // Channel type
  created_by: string      // User who created channel
  created_at: string
  updated_at?: string
}
```

### Group Members Table

```typescript
interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}
```

### Group Messages Table

```typescript
interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string
}
```

### Channel Messages Table

```typescript
interface ChannelMessage {
  id: string
  channel_id: string
  sender_id: string
  content: string
  created_at: string
}
```

---

## Common Operations

### 1. List Groups

```typescript
// Get all public groups
const { data: groups } = await supabase
  .from('groups')
  .select('*')
  .eq('is_private', false)
  .order('created_at', { ascending: false })

// Get user's groups (as host)
const { data: myGroups } = await supabase
  .from('groups')
  .select('*')
  .eq('host_id', userId)

// Get user's groups (as member)
const { data: joinedGroups } = await supabase
  .from('groups')
  .select('*, group_members!inner(*)')
  .eq('group_members.user_id', userId)
```

### 2. Get Group Details

```typescript
// Get group with channels
const { data: group } = await supabase
  .from('groups')
  .select(`
    *,
    channels (
      id,
      name,
      description,
      type,
      created_at
    )
  `)
  .eq('id', groupId)
  .single()

// Get group with member count
const { data: group } = await supabase
  .from('groups')
  .select(`
    *,
    group_members (count)
  `)
  .eq('id', groupId)
  .single()
```

### 3. Create Channel

```typescript
const { data: channel, error } = await supabase
  .from('channels')
  .insert({
    group_id: groupId,
    name: 'General',
    description: 'General discussion',
    type: 'text',
    created_by: userId,
  })
  .select()
  .single()
```

**Important:** User must be the group host to create channels (enforced by RLS)

### 4. Join Group

```typescript
// For public groups
const { error } = await supabase
  .from('group_members')
  .insert({
    group_id: groupId,
    user_id: userId,
    role: 'member',
  })

// Check if already a member first
const { data: existing } = await supabase
  .from('group_members')
  .select('id')
  .eq('group_id', groupId)
  .eq('user_id', userId)
  .single()

if (!existing) {
  // Insert membership
}
```

### 5. Send Group Message

```typescript
const { error } = await supabase
  .from('group_messages')
  .insert({
    group_id: groupId,
    sender_id: userId,
    content: messageText,
  })
```

### 6. Subscribe to Group Messages

```typescript
const channel = supabase
  .channel(`group-messages-${groupId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'group_messages',
      filter: `group_id=eq.${groupId}`,
    },
    (payload) => {
      console.log('New message:', payload.new)
      // Update UI with new message
    }
  )
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
```

### 7. Update Group

```typescript
const { error } = await supabase
  .from('groups')
  .update({
    name: newName,
    description: newDescription,
  })
  .eq('id', groupId)
  .eq('host_id', userId)  // Only host can update
```

### 8. Delete Group

```typescript
const { error } = await supabase
  .from('groups')
  .delete()
  .eq('id', groupId)
  .eq('host_id', userId)  // Only host can delete
```

**Note:** This cascades and deletes:
- All channels in the group
- All group members
- All group messages
- All channel messages

---

## Row Level Security (RLS)

### What You Can Do

**Groups:**
- ✅ Anyone can view public groups
- ✅ Members can view private groups they belong to
- ✅ Authenticated users can create groups
- ✅ Group host can update their groups
- ✅ Group host can delete their groups

**Channels:**
- ✅ Anyone can view all channels
- ✅ Group host can create channels in their group
- ✅ Group host can update/delete channels in their group

**Group Members:**
- ✅ Members can view other members in their groups
- ✅ Users can join public groups
- ✅ Members can leave groups
- ✅ Admins/owners can remove members

**Group Messages:**
- ✅ Members can view messages in their groups
- ✅ Members can send messages in their groups
- ✅ Users can delete their own messages
- ✅ Admins/owners can delete any messages in their groups

---

## Best Practices

### 1. Always Check Membership

```typescript
// Before showing group content
const { data: membership } = await supabase
  .from('group_members')
  .select('role')
  .eq('group_id', groupId)
  .eq('user_id', userId)
  .single()

if (!membership) {
  // User is not a member - redirect or show join prompt
}
```

### 2. Handle Errors Gracefully

```typescript
const { data, error } = await supabase
  .from('groups')
  .insert({ name: 'Test', host_id: userId })

if (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    toast.error('A group with that name already exists')
  } else if (error.code === '42501') {
    // Permission denied
    toast.error('You do not have permission to create groups')
  } else {
    toast.error(`Error: ${error.message}`)
  }
}
```

### 3. Use Transactions for Complex Operations

```typescript
// Creating a group with initial channels
const { data: group, error: groupError } = await supabase
  .from('groups')
  .insert({ name: 'My Group', host_id: userId })
  .select()
  .single()

if (!groupError && group) {
  // Create default channels
  await supabase
    .from('channels')
    .insert([
      { group_id: group.id, name: 'General', type: 'text', created_by: userId },
      { group_id: group.id, name: 'Voice', type: 'voice', created_by: userId },
    ])
}
```

### 4. Optimize Queries

```typescript
// BAD: Multiple queries
const { data: group } = await supabase.from('groups').select('*').eq('id', id).single()
const { data: channels } = await supabase.from('channels').select('*').eq('group_id', id)
const { data: members } = await supabase.from('group_members').select('*').eq('group_id', id)

// GOOD: Single query with joins
const { data: group } = await supabase
  .from('groups')
  .select(`
    *,
    channels (*),
    group_members (*)
  `)
  .eq('id', id)
  .single()
```

### 5. Clean Up Subscriptions

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`group-${groupId}`)
    .on('postgres_changes', { ... })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)  // Important!
  }
}, [groupId])
```

---

## TypeScript Types

Create types file at `/src/types/groups.ts`:

```typescript
export interface Group {
  id: string
  name: string
  description?: string
  host_id: string
  is_private?: boolean
  max_members?: number
  latitude?: number
  longitude?: number
  tags?: string[]
  time?: string
  photo?: string
  created_at: string
  updated_at?: string

  // Relations (when using .select())
  channels?: Channel[]
  group_members?: GroupMember[]
}

export interface Channel {
  id: string
  group_id: string
  name: string
  description?: string
  type: 'text' | 'voice' | 'video'
  created_by: string
  created_at: string
  updated_at?: string

  // Relations
  channel_messages?: ChannelMessage[]
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string

  // Relations
  profiles?: {
    display_name: string
    photo_url?: string
  }
}

export interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string

  // Relations
  sender_profile?: {
    display_name: string
    photo_url?: string
  }
}

export interface ChannelMessage {
  id: string
  channel_id: string
  sender_id: string
  content: string
  created_at: string

  // Relations
  sender_profile?: {
    display_name: string
    photo_url?: string
  }
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Create a group via UI at `/groups`
- [ ] View groups list
- [ ] Click into a group detail page
- [ ] Create a channel in the group
- [ ] Join a channel
- [ ] Send a message in a text channel
- [ ] Update group details
- [ ] Add/remove members (if admin)
- [ ] Delete a channel (if host)
- [ ] Delete a group (if host)

### API Testing

```bash
# Create group
curl -X POST https://your-app.com/api/groups/setup-club \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "group": {
    "id": "...",
    "name": "The Club sltr",
    "description": "..."
  },
  "channels": [...],
  "message": "The Club sltr created successfully with all channels!"
}
```

---

## Troubleshooting

### "Column does not exist" Error

**Error:** `column "host_id" does not exist`

**Solution:** Run the schema fix migration:
```bash
psql $DATABASE_URL -f /home/user/3musketeers/supabase/migrations/20251128_fix_groups_schema_conflict.sql
```

### RLS Policy Denies Access

**Error:** `new row violates row-level security policy`

**Common causes:**
1. User is not authenticated
2. User is not the group host (for host-only operations)
3. User is not a group member (for member-only operations)

**Debug:**
```sql
-- Check user's memberships
SELECT * FROM group_members WHERE user_id = 'your-user-id';

-- Check group ownership
SELECT * FROM groups WHERE host_id = 'your-user-id';
```

### Channels Not Loading

**Check:**
1. Group exists: `SELECT * FROM groups WHERE id = 'group-id'`
2. Channels exist: `SELECT * FROM channels WHERE group_id = 'group-id'`
3. User has access: `SELECT * FROM group_members WHERE group_id = 'group-id' AND user_id = 'user-id'`

---

## Migration Status

**Current Schema Version:** 2.0.0 (Unified)

**Applied Migrations:**
- ✅ `20251021000000_create_groups_table.sql` - Initial groups schema
- ✅ `20251103_add_places_groups.sql` - Places/groups integration
- ✅ `20251126_create_channels_table.sql` - Channels system
- ✅ `20251128_fix_groups_schema_conflict.sql` - Schema unification (NEW)

**Breaking Changes:** None - backward compatible with all existing code

---

## Support

**Documentation:**
- Full remediation guide: `/docs/DATABASE_REMEDIATION_GROUPS_CHANNELS.md`
- Schema verification: `/sql/verify-groups-channels-schema.sql`
- Test data script: `/sql/test-groups-channels-data.sql`

**Questions?**
- Check the main project CLAUDE.md: `/CLAUDE.md`
- Review Supabase docs: https://supabase.com/docs

---

**Remember:** Both `host_id`/`owner_id` and `name`/`title` work interchangeably thanks to the automatic sync trigger. Use whichever makes sense for your code!
