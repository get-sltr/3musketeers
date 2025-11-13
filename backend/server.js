// Backend v1.1 - with receiver_id fix
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const app = express();
const server = http.createServer(app);
// Allow both production and local dev URLs, plus Vercel preview deployments
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://getsltr.com",
  process.env.DEV_FRONTEND_URL || "http://localhost:3001",
  "http://localhost:3001", // Always allow localhost in dev
  "http://getsltr.com:3001", // Local hostname mapping
  "http://localhost:3000", // Frontend dev server
  "https://www.getsltr.com", // With www
  "https://getsltr.com" // Production domain
];

// CORS function to allow Vercel preview URLs
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview deployments (*.vercel.app)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow Railway preview deployments if needed
    if (origin.includes('.railway.app')) {
      return callback(null, true);
    }
    
    // Reject all other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Initialize Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing Supabase credentials!');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Configure web-push for push notifications
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
  console.error('❌ CRITICAL: Missing VAPID credentials for push notifications!');
  console.error('Required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT');
  process.exit(1);
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
console.log('✅ Web Push notifications enabled');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Store active users and typing status
const activeUsers = new Map();
const typingUsers = new Map();

// Helper function to send push notifications
async function sendPushNotification(userId, senderName, messageContent, conversationId) {
  try {
    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return; // No subscriptions, skip silently
    }

    const payload = JSON.stringify({
      title: `New message from ${senderName}`,
      body: messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: `message-${conversationId}`,
      data: {
        url: `/messages/${conversationId}`,
        conversationId: conversationId
      }
    });

    // Send to all user's devices
    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, payload)
        .catch(err => {
          console.error('Push notification error:', err.message);
          // If subscription is invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        });
    });

    await Promise.all(sendPromises);
    console.log(`📬 Push notification sent to user ${userId}`);
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User authentication and joining
  socket.on('authenticate', async (data) => {
    try {
      const { userId, token } = data;
      
      // Verify user with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        socket.emit('auth_error', { message: 'Invalid authentication' });
        return;
      }

      // Store user info
      activeUsers.set(socket.id, {
        userId: user.id,
        socketId: socket.id,
        username: user.user_metadata?.username || 'Unknown',
        online: true,
        lastSeen: new Date()
      });

      // Update user online status in database
      await supabase
        .from('profiles')
        .update({ 
          online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id);
      
      // Join user to their personal room
      socket.join(`user_${user.id}`);
      
      // Notify user is online
      socket.broadcast.emit('user_online', {
        userId: user.id,
        username: user.user_metadata?.username
      });

      socket.emit('authenticated', { success: true });
      console.log(`User authenticated: ${user.id} - set online in database`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  // Real-time messaging
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, messageType = 'text', fileUrl = null } = data;
      const user = activeUsers.get(socket.id);
      
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Get conversation to determine receiver
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        console.error('Conversation not found:', convError);
        socket.emit('message_error', { message: 'Conversation not found' });
        return;
      }

      // Determine receiver (the other user in conversation)
      const receiverId = conversation.user1_id === user.userId 
        ? conversation.user2_id 
        : conversation.user1_id;

      // Save message to database
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.userId,
          receiver_id: receiverId,
          content: content,
          message_type: messageType,
          file_url: fileUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Message save error:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
        return;
      }

      // Emit to conversation participants
      io.to(`conversation_${conversationId}`).emit('new_message', {
        id: message.id,
        conversationId: conversationId,
        senderId: user.userId,
        content: content,
        messageType: messageType,
        fileUrl: fileUrl,
        createdAt: message.created_at,
        senderName: user.username
      });

      // Send push notification to receiver
      sendPushNotification(receiverId, user.username, content, conversationId);

      // Emit message delivered status
      socket.emit('message_delivered', { messageId: message.id });
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { conversationId } = data;
    typingUsers.set(`${user.userId}_${conversationId}`, {
      userId: user.userId,
      username: user.username,
      conversationId: conversationId,
      timestamp: Date.now()
    });

    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: user.userId,
      username: user.username,
      conversationId: conversationId
    });
  });

  socket.on('typing_stop', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { conversationId } = data;
    typingUsers.delete(`${user.userId}_${conversationId}`);

    socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
      userId: user.userId,
      conversationId: conversationId
    });
  });

  // Message read status
  socket.on('mark_message_read', async (data) => {
    try {
      const { messageId, conversationId } = data;
      const user = activeUsers.get(socket.id);
      
      if (!user) return;

      // Update message as read in database
      const { error } = await supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString(),
          read_by: user.userId
        })
        .eq('id', messageId);

      if (!error) {
        // Notify sender that message was read
        socket.to(`conversation_${conversationId}`).emit('message_read', {
          messageId: messageId,
          readBy: user.userId,
          readAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // Join conversation room
  socket.on('join_conversation', (data) => {
    const { conversationId } = data;
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (data) => {
    const { conversationId } = data;
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.id} left conversation ${conversationId}`);
  });

  // WebRTC signaling for video calls
  socket.on('call_offer', (data) => {
    const { targetUserId, offer, conversationId } = data;
    socket.to(`user_${targetUserId}`).emit('call_offer', {
      fromUserId: activeUsers.get(socket.id)?.userId,
      offer: offer,
      conversationId: conversationId
    });
  });

  socket.on('call_answer', (data) => {
    const { targetUserId, answer } = data;
    socket.to(`user_${targetUserId}`).emit('call_answer', {
      fromUserId: activeUsers.get(socket.id)?.userId,
      answer: answer
    });
  });

  socket.on('call_ice_candidate', (data) => {
    const { targetUserId, candidate } = data;
    socket.to(`user_${targetUserId}`).emit('call_ice_candidate', {
      fromUserId: activeUsers.get(socket.id)?.userId,
      candidate: candidate
    });
  });

  socket.on('call_end', (data) => {
    const { targetUserId, conversationId } = data;
    socket.to(`user_${targetUserId}`).emit('call_end', {
      fromUserId: activeUsers.get(socket.id)?.userId,
      conversationId: conversationId
    });
  });

  // Location updates for live maps
  socket.on('location_update', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { latitude, longitude, conversationId } = data;
    
    // Broadcast location to conversation participants
    socket.to(`conversation_${conversationId}`).emit('user_location_update', {
      userId: user.userId,
      username: user.username,
      latitude: latitude,
      longitude: longitude,
      timestamp: new Date().toISOString()
    });
  });

  // File sharing
  socket.on('file_share', async (data) => {
    try {
      const { conversationId, fileName, fileType, fileSize } = data;
      const user = activeUsers.get(socket.id);
      
      if (!user) return;

      // Notify conversation participants about file share
      socket.to(`conversation_${conversationId}`).emit('file_shared', {
        fromUserId: user.userId,
        fromUsername: user.username,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('File share error:', error);
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      // Update user offline status in database
      await supabase
        .from('profiles')
        .update({ 
          online: false,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.userId);
      
      // Notify that user went offline
      socket.broadcast.emit('user_offline', {
        userId: user.userId,
        username: user.username
      });
      
      // Clean up typing status
      for (const [key, typingData] of typingUsers.entries()) {
        if (typingData.userId === user.userId) {
          typingUsers.delete(key);
        }
      }
      
      activeUsers.delete(socket.id);
      console.log(`User disconnected: ${socket.id} - set offline in database`);
    } else {
      console.log(`User disconnected: ${socket.id}`);
    }
  });
});

// DEPRECATED: File upload endpoint (now using Supabase Storage)
// This endpoint is disabled to prevent local file storage issues
app.post('/api/upload', (req, res) => {
  res.status(410).json({
    error: 'This endpoint is deprecated. Use Supabase Storage instead.',
    message: 'File uploads now go directly to Supabase Storage from the client.'
  });
});

// DEPRECATED: Serve uploaded files (now using Supabase Storage)
// app.use('/uploads', express.static('uploads'));

// Push notification endpoints
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ error: 'Missing userId or subscription' });
    }

    // Save subscription to Supabase
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Failed to save subscription:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

app.post('/api/push/send', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: data || {}
    });

    // Send to all user's devices
    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, payload)
        .catch(err => {
          console.error('Push send error:', err);
          // If subscription is invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        });
    });

    await Promise.all(sendPromises);
    res.json({ success: true, sent: subscriptions.length });
  } catch (error) {
    console.error('Push send error:', error);
    res.status(500).json({ error: 'Failed to send push notification' });
  }
});

// Health check endpoints (both root and /api/health for Railway)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'SLTR Realtime Backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeUsers: activeUsers.size,
    typingUsers: typingUsers.size
  });
});

// Clean up typing indicators every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, typingData] of typingUsers.entries()) {
    if (now - typingData.timestamp > 30000) { // 30 seconds timeout
      typingUsers.delete(key);
    }
  }
}, 30000);

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 SLTR Real-time Backend running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || "https://getsltr.com"}`);
});
