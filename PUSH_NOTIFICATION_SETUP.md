# Push Notification Setup - Complete ✅

## ✅ What's Been Implemented

### 1. **Frontend** (`src/hooks/useNotifications.ts`)
- ✅ Service worker registration (`/sw.js`)
- ✅ Notification permission requests
- ✅ Push subscription with VAPID keys
- ✅ Auto-subscription when permission granted
- ✅ Saves subscriptions to backend

### 2. **Backend** (`backend/server.js`)
- ✅ Installed `web-push` library
- ✅ VAPID keys generated and configured
- ✅ Push subscription endpoints (`/api/push/*`)
- ✅ Auto-sends push when messages arrive
- ✅ Cleans up invalid subscriptions

### 3. **Database**
- ✅ Migration file created: `supabase/migrations/20251104_push_subscriptions.sql`
- ⚠️ **NEEDS TO RUN IN SUPABASE**

### 4. **Configuration**
- ✅ Backend `.env` updated with VAPID keys
- ✅ Frontend `.env.local` updated with public VAPID key

## 🔧 Next Steps

### Step 1: Run the Database Migration
Copy and run this SQL in your Supabase SQL Editor:

```sql
-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();
```

### Step 2: Restart Backend Server
```bash
cd backend
npm run dev
```

### Step 3: Restart Frontend Dev Server
```bash
npm run dev
```

### Step 4: Test Push Notifications

1. **Open the app in browser** (http://localhost:5000)
2. **Login** as a user
3. **Allow notifications** when prompted
4. Check console - should see:
   - ✅ Service Worker registered
   - ✅ Push subscription saved
5. **Send a message** from another account
6. **Should receive push notification!**

## 🎯 API Endpoints

### Get VAPID Public Key
```
GET /api/push/vapid-public-key
```

### Subscribe to Push
```
POST /api/push/subscribe
Body: {
  userId: "uuid",
  subscription: { endpoint, keys: { p256dh, auth } }
}
```

### Send Push (Manual)
```
POST /api/push/send
Body: {
  userId: "uuid",
  title: "Message Title",
  body: "Message content",
  data: { url: "/messages/123", conversationId: "123" }
}
```

## 🔄 How It Works

1. User opens app → Service worker registers
2. Permission granted → Subscribes to push
3. Subscription saved to `push_subscriptions` table
4. Message sent → Backend triggers `sendPushNotification()`
5. Backend fetches user's subscriptions
6. Push sent to all devices via web-push
7. Service worker receives push → Shows notification
8. User clicks → Opens conversation

## 🛠️ Troubleshooting

### No notification permission prompt?
- Check browser settings
- HTTPS required (or localhost)
- Clear site data and reload

### Subscription fails?
- Check backend is running
- Verify VAPID keys in both .env files
- Check browser console for errors

### Push not received?
- Verify subscription exists in DB
- Check backend logs for errors
- Ensure service worker is active
- Test with `/api/push/send` endpoint

## 📝 Environment Variables

### Backend (backend/.env)
```
VAPID_PUBLIC_KEY=BOul5iFiwneS_iE2V3k6jQFzJsKk9HmIa88WRxEv0ps-ouN_CsNjUz-RWDppTS44Q9ze-JanQzKOTKnW8NAb8F4
VAPID_PRIVATE_KEY=Jcg8zts3kZfhRv0beU-IYOY1WgADOxRAzsdeaT5LeNY
VAPID_SUBJECT=mailto:support@getsltr.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_VAPID_KEY=BOul5iFiwneS_iE2V3k6jQFzJsKk9HmIa88WRxEv0ps-ouN_CsNjUz-RWDppTS44Q9ze-JanQzKOTKnW8NAb8F4
```

## 🚀 Production Deployment

### Railway (Backend)
Add these environment variables:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

### Vercel (Frontend)
Add this environment variable:
- `NEXT_PUBLIC_VAPID_KEY`

**⚠️ IMPORTANT**: Keep VAPID private key secret! Never expose in frontend code.
