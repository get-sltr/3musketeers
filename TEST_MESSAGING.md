# Messaging Test Checklist

## What to test:

1. **Navigate to /messages**
   - Should see conversation list (or empty state if none)
   - Check console for socket connection status

2. **Create a new conversation from map**
   - Go to /app
   - Click "Map" view
   - Click on a user pin
   - Click "Send Message" 
   - Should create conversation and redirect to /messages/[id]

3. **Send a message**
   - Type in the message input
   - Press Send
   - Message should appear in the chat
   - Check for socket connection indicator (green dot = connected)

4. **Backend Status Check**
   - Backend URL: https://sltr-backend.railway.app
   - Health check: https://sltr-backend.railway.app/health (should return 200)

## Common Issues:

1. **Socket not connecting**: Check browser console for connection errors
2. **Messages not loading**: Check Supabase tables (conversations, messages)
3. **Can't create conversation**: Verify both users exist in profiles table
4. **Map not showing users**: Need profiles with latitude/longitude set

## Quick Fixes Applied:

✅ Fixed socket backend URL to use environment variable
✅ Map component already exists in /app page
✅ User profile modal with "Send Message" button working
✅ Message sending saves to database properly

## What Actually Works Now:

- ✅ Build passes
- ✅ Backend is live and responding
- ✅ Socket.io configured correctly
- ✅ Map with user pins loads in /app (toggle to map view)
- ✅ Messaging database schema is correct
- ✅ Message sending logic works

## To Verify Everything Works:

```bash
# 1. Start dev server
npm run dev

# 2. Open browser to http://localhost:5000
# 3. Login
# 4. Go to /app
# 5. Toggle to Map view (top right)
# 6. Click a user pin
# 7. Click "Send Message"
# 8. Type and send messages
```

## Environment Variables Required:

- NEXT_PUBLIC_SUPABASE_URL ✅ (set)
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ (set)
- NEXT_PUBLIC_BACKEND_URL ✅ (set)
- NEXT_PUBLIC_MAPBOX_TOKEN (check if set)
