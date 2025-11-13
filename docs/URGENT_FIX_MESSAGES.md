# URGENT: Fix Message 400 Error

## Error
```
column "blocked_id" does not exist
hint: "Perhaps you meant to reference the column \"blocked_users.blocker_id\"."
```

## Quick Fix (Temporary)
Run this SQL in Supabase to allow messages to work immediately:

```sql
-- Temporarily remove blocking check from message RLS policy
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

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

This will allow messages to send immediately. We'll fix the blocking check later once the schema is corrected.

## Permanent Fix (After Testing)
1. Check actual `blocked_users` table schema:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'blocked_users';
```

2. If `blocked_id` doesn't exist, either:
   - Add the column: `ALTER TABLE blocked_users ADD COLUMN blocked_id UUID;`
   - Or update the function to use correct column names

3. Then re-add blocking check to RLS policy

