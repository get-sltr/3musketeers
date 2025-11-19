# Quick Fix for Realtime Errors

## Problem
WebSocket connections are failing with "bad response from server"

## Immediate Solution

### 1. Set users online on page load (without websockets)

Run in Supabase SQL Editor:
```sql
-- Create function to auto-set users online on any profile query
CREATE OR REPLACE FUNCTION set_user_online()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_active on any profile read
  UPDATE profiles 
  SET online = true, last_active = NOW()
  WHERE id = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Or simpler: just manually set yourself online now
UPDATE profiles 
SET online = true, last_active = NOW()
WHERE email = 'kminn121@gmail.com';
```

### 2. Disable Grammarly (causing CORS errors)

Add to your browser extension settings:
- Disable Grammarly on localhost
- Or add this to `.env.local`:
```
NEXT_PUBLIC_DISABLE_GRAMMARLY=true
```

### 3. Check Supabase Realtime Settings

Go to Supabase Dashboard → Settings → API:
- Check if Realtime is enabled
- Verify your project URL matches in `.env.local`
- Check if you have rate limits hit

### 4. Simpler Fix - Use Polling Instead

Add this to `src/app/app/page.tsx` (around line 138):
```typescript
// Auto-update online status every 30 seconds (without websockets)
useEffect(() => {
  const updateOnlineStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ online: true, last_active: new Date().toISOString() })
        .eq('id', user.id)
    }
  }

  updateOnlineStatus() // Run immediately
  const interval = setInterval(updateOnlineStatus, 30000) // Every 30s

  return () => clearInterval(interval)
}, [])
```

## Why This Happens

1. **Supabase Realtime quota exceeded** - free tier has limits
2. **Network/firewall blocking WebSockets**
3. **CORS issues** from browser extensions (Grammarly)

## Test

After applying fix:
```sql
-- Check if you're online
SELECT display_name, online, last_active 
FROM profiles 
WHERE email = 'kminn121@gmail.com';
```

Should show `online: true`
