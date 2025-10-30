# Messaging System - Detailed TODO List

## Current State
- ✅ Websockets connected to backend.getsltr.com
- ✅ Typing indicators working
- ✅ Database tables created (conversations, messages)
- ✅ RLS policies set up
- ✅ Conversations list loading
- ❌ Messages not sending/saving to database
- ❌ UUID routing issue (IDs getting truncated)
- ❌ Two competing page layouts causing conflicts

## Critical Issues to Fix

### 1. Fix UUID Routing in Dynamic Route
**Problem:** When navigating to `/messages/[id]`, the UUID gets truncated from `59ef758b-5d77-4290-8763-4d97f7f70f80` to `59ef758b-4290-8763-4d97f7f70f80` (missing middle section).

**Files to check:**
- `src/app/messages/[id]/page.tsx` - Line 21 where params are unpacked
- `src/app/app/page.tsx` - Lines 116, 134 where router.push happens

**Fix needed:**
- Investigate why Next.js dynamic route is parsing UUID incorrectly
- May need to URL encode the UUID or use different route structure
- Test with `console.log(params)` to see what Next.js is actually receiving

**Test:** Navigate to `/messages/59ef758b-5d77-4290-8763-4d97f7f70f80` and verify full UUID is preserved

---

### 2. Fix Message Sending - Not Saving to Database
**Problem:** When user types and clicks Send, typing indicator clears but message doesn't appear and database table remains empty.

**Files to fix:**
- `src/app/messages/page.tsx` - Line 334-382 (sendMessage function)
- `src/app/messages/[id]/page.tsx` - Line 180-236 (handleSend function)

**Debug steps:**
1. Add console.log in sendMessage/handleSend to track execution
2. Check if conversation_id is valid
3. Verify the INSERT query is actually running
4. Check for Supabase RLS policy errors
5. Verify sender_id and receiver_id are correct UUIDs

**Potential issues:**
- RLS policy blocking INSERT (check Supabase logs)
- conversation_id not being passed correctly
- Socket.io fallback logic may not be working (lines 352-374)

**Test:** Send a message, then check Supabase → messages table for new row

---

### 3. Consolidate Page Layouts
**Problem:** Two different messaging UIs competing:
- `/messages` - List view with sidebar (works)
- `/messages/[id]` - Full screen view (broken)

**Decision needed:** Choose ONE approach:

**Option A: Keep both pages (recommended)**
- `/messages` = Conversations list ONLY (like inbox)
- `/messages/[id]` = Full conversation view (no sidebar)
- Fix: Remove sidebar from [id] page, make it full screen chat

**Option B: Single page with query params**
- Use only `/messages?conversation=id`
- Show list + selected conversation in split view
- Fix: Update handleMessage to use query params instead of route params

**Files affected:**
- `src/app/messages/page.tsx` - Conversations list page
- `src/app/messages/[id]/page.tsx` - Individual conversation page
- `src/app/app/page.tsx` - Line 102-136 (handleMessage navigation)

---

### 4. Fix Conversation Loading Error (406)
**Problem:** GET request to `/conversations` returns 406 Not Acceptable

**File:** `src/app/messages/[id]/page.tsx` - Line 131-176 (loadConversationData)

**Likely cause:**
- Query trying to use `.single()` but getting multiple rows
- Or conversation doesn't exist
- Check line 137-141 where it queries conversations table

**Fix:**
- Add error handling for missing conversation
- Verify conversation_id exists before querying
- Check if query should use `.maybeSingle()` instead of `.single()`

**Test:** Load conversation page and check if profile data appears

---

### 5. Wire Up Real-time Message Display
**Problem:** Websockets connected but new messages don't appear without refresh

**Files:**
- `src/app/messages/page.tsx` - Line 88-159 (socket event listeners)
- `src/hooks/useSocket.ts` - Line 98-103 (new_message handler)

**Current flow:**
1. User sends message
2. Socket.io emits to backend
3. Backend broadcasts to other user
4. Event listener should update UI

**Debug:**
- Check if `new_message` event is actually firing (add console.log)
- Verify setMessages is updating state (line 95)
- Check if conversationId matches (line 94)

**Test:** Open chat on two devices/browsers, send message from one, see if it appears on other

---

### 6. Fix Message Loading on Conversation Open
**Problem:** When clicking a conversation, messages don't load

**File:** `src/app/messages/[id]/page.tsx` - Line 65-98 (loadMessages)

**Current query (line 72-76):**
```javascript
const { data: messagesData, error } = await supabase
  .from('messages')
  .select('id, sender_id, receiver_id, content, created_at, read')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
```

**Check:**
1. Is conversationId valid?
2. Do messages exist in database?
3. Are RLS policies allowing SELECT?
4. Is error being logged? (line 78)

**Test:** Manually insert a test message in Supabase, then load conversation

---

## Additional Enhancements (Lower Priority)

### 7. Add Message Read Receipts
- Update `read` column when user views message
- Show "Seen" indicator in UI
- File: `src/hooks/useSocket.ts` - Line 112-117 (message_read handler)

### 8. Fix Message Status Indicators
- Currently shows sending/delivered/read status (lines 600-613 in page.tsx)
- Not updating correctly
- Need to track message states properly

### 9. Add Error Messages to UI
- Currently errors only in console
- Show user-friendly error messages when send fails
- Add retry mechanism

---

## Testing Checklist

Once fixes are complete, test this flow:

1. ✅ User A logs in
2. ✅ User A clicks "Send Message" on User B's profile
3. ✅ Conversation is created (check Supabase conversations table)
4. ✅ Chat view opens with correct URL
5. ✅ User A types message (typing indicator shows)
6. ✅ User A clicks Send
7. ✅ Message appears in chat immediately
8. ✅ Message saved to Supabase messages table
9. ✅ User B (on different device) sees message appear in real-time
10. ✅ User B can reply
11. ✅ Messages persist after refresh

---

## Quick Wins (Start Here)

1. **Add debug logging** to sendMessage function to see exactly where it fails
2. **Check Supabase logs** for RLS policy violations
3. **Manually test** the conversation creation query in Supabase SQL editor
4. **Verify** the full conversation_id is being passed to the chat page

---

## Database Schema (Reference)

Already set up correctly, just for reference:

```sql
conversations (
  id UUID PRIMARY KEY,
  user1_id UUID,
  user2_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  read BOOLEAN
)
```

---

## Environment Variables

Already set correctly, just verify they're in both Railway and Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Backend websocket URL is correctly set to `https://backend.getsltr.com`

---

## Good Luck!

The foundation is solid. Main issues are:
1. Message INSERT not working
2. UUID routing bug
3. Page layout confusion

Fix those three and messaging will work end-to-end.
