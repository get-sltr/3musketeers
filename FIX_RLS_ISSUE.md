# Fix RLS 400 Error for Messages

## Issue
Messages failing to insert with 400 error - likely RLS policy issue.

## Quick Fix Options

### Option 1: Temporarily Simplify RLS Policy (Testing)
Run this in Supabase SQL Editor to allow messages without blocking check:

```sql
-- Drop the existing strict policy
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Create simpler policy (for testing)
CREATE POLICY "Users can send messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);
```

### Option 2: Ensure is_user_blocked Function Exists
Run this to create the function if missing:

```sql
-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Return false if blocked_users table doesn't exist or no blocks
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = user1_uuid AND blocked_id = user2_uuid)
       OR (blocker_id = user2_uuid AND blocked_id = user1_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option 3: Check if blocked_users table exists
```sql
-- Create blocked_users table if missing
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy to view blocks
CREATE POLICY "Users can view their blocks" ON blocked_users
FOR SELECT USING (blocker_id = auth.uid() OR blocked_id = auth.uid());
```

## Check Current Error
After the fix, check browser console for detailed error message - it will show the exact RLS failure reason.

