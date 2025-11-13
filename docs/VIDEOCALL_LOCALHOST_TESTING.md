# VideoCall Localhost Testing Guide

**Status:** DISABLED in production until Nov 11th Launch at 11:00 AM  
**Localhost Testing:** Available for development only

---

## 🧪 Overview

The `VideoCall.tsx.disabled` component uses **Supabase Realtime** for signaling and has been disabled until the Nov 9th launch date. However, it's available for **localhost testing** to allow development and testing before launch.

---

## 🚀 Quick Start

### 1. Ensure You're on Localhost

The component **only works** when accessing via:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

It will **NOT work** on:
- Production domains (getsltr.com)
- Staging environments
- Any other hostname

### 2. Access the Test Component

The disabled VideoCall component is available via the `VideoCallLocalhost` component, which can be imported and used in your test pages.

### 3. Test Route (Optional)

You can create a test route at `/test/video-call` to test the component:

```typescript
// src/app/test/video-call/page.tsx
'use client'

import VideoCallLocalhost from '@/components/VideoCallLocalhost'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TestVideoCallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const conversationId = searchParams.get('conversationId') || 'test-conversation'
  const otherUserId = searchParams.get('otherUserId') || 'test-user-id'
  const otherUserName = searchParams.get('otherUserName') || 'Test User'
  
  return (
    <VideoCallLocalhost
      conversationId={conversationId}
      otherUserId={otherUserId}
      otherUserName={otherUserName}
      onEndCall={() => router.push('/messages')}
    />
  )
}
```

---

## 📋 Testing Checklist

### Basic Functionality
- [ ] Component loads on localhost
- [ ] Component shows error on non-localhost
- [ ] Camera/mic permissions requested
- [ ] Local video stream displays
- [ ] Remote video stream displays (when connected)
- [ ] Mute/unmute works
- [ ] Video on/off works
- [ ] End call works

### WebRTC Connection
- [ ] Peer connection establishes
- [ ] Offer/answer exchange works
- [ ] ICE candidates exchange
- [ ] Remote stream received
- [ ] Connection state changes handled

### Supabase Realtime
- [ ] Channel subscribes successfully
- [ ] Signals broadcast correctly
- [ ] Signals received from other user
- [ ] Channel cleanup on unmount

### Error Handling
- [ ] Permission denied handled gracefully
- [ ] Network errors handled
- [ ] Connection failures handled
- [ ] Error messages displayed clearly

### UI/UX
- [ ] Loading states display correctly
- [ ] Connection status updates
- [ ] Controls are responsive
- [ ] Localhost badge visible
- [ ] Picture-in-picture layout works

---

## 🔧 Configuration

### Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Supabase Realtime Setup

The component uses Supabase Realtime channels. Ensure:
1. Realtime is enabled in your Supabase project
2. Channel name format: `call-${conversationId}`
3. Broadcast event: `signal`

---

## 🐛 Known Issues

See `VIDEOCALL_DISABLED_REVIEW.md` for comprehensive list of issues, including:

1. **Missing TURN servers** - May fail behind strict NATs
2. **No connection state monitoring** - Drops may not be detected
3. **Channel cleanup missing** - Potential memory leaks
4. **No error recovery** - Failed calls can't retry

---

## 🚫 Production Safety

### Safety Mechanisms

1. **Hostname Check**: Component checks `window.location.hostname === 'localhost'`
2. **Early Return**: Returns error UI if not localhost
3. **Dynamic Import**: Only loads on client-side
4. **Disabled File**: Original `.disabled` file remains untouched

### Verification

To verify it's disabled in production:
1. Check that `VideoCallLocalhost` is not imported in production code
2. Check that `LazyVideoCall` still points to active `VideoCall.tsx`
3. Test on production domain - should show error

---

## 📝 Usage in Messages Page (Testing Only)

If you want to test the disabled version in the messages page, you can temporarily modify `LazyWrapper.tsx`:

```typescript
// ONLY FOR LOCALHOST TESTING - REMOVE BEFORE LAUNCH
export const LazyVideoCall = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? lazy(() => import('./VideoCallLocalhost'))
  : lazy(() => import('./VideoCall'))
```

**⚠️ WARNING:** This should be **reverted before Nov 9th launch**. The disabled component should NOT be used in production.

---

## 🔍 Debugging

### Enable Debug Logs

Add this to see detailed logs:

```typescript
// In VideoCallLocalhost component
useEffect(() => {
  console.log('🔍 VideoCallLocalhost Debug:', {
    isLocalhost,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    conversationId,
    otherUserId
  })
}, [isLocalhost, conversationId, otherUserId])
```

### Check Supabase Realtime

1. Open Supabase Dashboard
2. Go to Realtime logs
3. Monitor channel subscriptions
4. Check for broadcast events

### Check WebRTC

1. Open browser DevTools
2. Go to Network tab
3. Filter for WebRTC
4. Check peer connection state
5. Monitor ICE candidates

---

## 📅 Timeline

### Before Nov 11 at 11:00 AM
- ✅ Keep disabled in production
- ✅ Test on localhost only
- ✅ Fix critical issues
- ✅ Prepare for launch

### Nov 11 Launch (11:00 AM)
- Enable after fixes complete
- Monitor closely
- Have rollback plan

### Post-Launch
- Monitor performance
- Gather feedback
- Iterate improvements

---

## 🆘 Troubleshooting

### "Component Unavailable" Error
- **Cause**: Not accessing via localhost
- **Fix**: Use `http://localhost:3000` or `http://127.0.0.1:3000`

### "Failed to start video call"
- **Cause**: Camera/mic permissions denied
- **Fix**: Grant permissions in browser settings

### "No remote video"
- **Cause**: WebRTC connection not established
- **Fix**: Check network, firewall, NAT traversal

### "Channel subscription failed"
- **Cause**: Supabase Realtime not enabled
- **Fix**: Enable Realtime in Supabase dashboard

---

## 📚 Related Documentation

- `VIDEOCALL_DISABLED_REVIEW.md` - Comprehensive code review
- `src/components/VideoCall.tsx.disabled` - Disabled component source
- `src/components/VideoCallLocalhost.tsx` - Localhost wrapper component
- `src/components/VideoCall.tsx` - Active production component

---

*Last updated: Before Nov 9th launch*

