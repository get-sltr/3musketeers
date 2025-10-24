# SLTR Real-time Backend

Enterprise-grade real-time backend for SLTR app with Socket.io, WebRTC, and file sharing.

## Features

- ✅ **Real-time messaging** with Socket.io
- ✅ **Live typing indicators** ("John is typing...")
- ✅ **Message status** (delivered, read, seen)
- ✅ **File sharing** (photos, albums, videos)
- ✅ **WebRTC video calling** with signaling
- ✅ **Live location updates** for maps
- ✅ **Online/offline status**
- ✅ **Message reactions** and emoji responses
- ✅ **Rate limiting** and security
- ✅ **File upload** with validation

## Socket.io Events

### Client → Server
- `authenticate` - User authentication
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_message_read` - Mark message as read
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `call_offer` - WebRTC call offer
- `call_answer` - WebRTC call answer
- `call_ice_candidate` - ICE candidate exchange
- `call_end` - End video call
- `location_update` - Update user location
- `file_share` - Share file in conversation

### Server → Client
- `authenticated` - Authentication success
- `auth_error` - Authentication failed
- `new_message` - New message received
- `message_delivered` - Message delivery confirmation
- `message_read` - Message read confirmation
- `user_typing` - User started typing
- `user_stop_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline
- `call_offer` - Incoming call offer
- `call_answer` - Call answer received
- `call_ice_candidate` - ICE candidate received
- `call_end` - Call ended
- `user_location_update` - User location updated
- `file_shared` - File shared in conversation

## API Endpoints

- `POST /api/upload` - File upload
- `GET /api/health` - Health check
- `GET /uploads/:filename` - Serve uploaded files

## Environment Variables

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=https://getsltr.com
BACKEND_URL=https://your-railway-app.railway.app
PORT=3001
NODE_ENV=production
```

## Deployment

1. **Railway Setup:**
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

2. **Local Development:**
   ```bash
   npm install
   npm run dev
   ```

## Security Features

- **Helmet** for security headers
- **CORS** configuration
- **Rate limiting** (100 requests per 15 minutes)
- **File type validation**
- **File size limits** (10MB)
- **Authentication** with Supabase

## Real-time Features

### Typing Indicators
- Real-time detection when users start/stop typing
- Automatic timeout after 30 seconds
- Multiple users typing simultaneously
- Clean UI with "John is typing..." messages

### Message Status
- **Delivered** - Message sent to server
- **Read** - Message opened by recipient
- **Seen** - Message viewed with timestamp
- **Online/Offline** - User presence status

### File Sharing
- **Photo uploads** with preview
- **Video sharing** with thumbnails
- **Album sharing** in conversations
- **File type validation** and size limits
- **Real-time notifications** when files are shared

### Video Calling
- **WebRTC signaling** server
- **Call offers/answers** exchange
- **ICE candidate** handling
- **Call end** notifications
- **Multi-user** call support

## Performance

- **Connection pooling** for database
- **Memory-efficient** user tracking
- **Automatic cleanup** of typing indicators
- **Rate limiting** to prevent abuse
- **File upload** optimization

## Monitoring

- **Health check** endpoint
- **Active users** tracking
- **Typing users** monitoring
- **Connection status** logging
- **Error handling** and logging
