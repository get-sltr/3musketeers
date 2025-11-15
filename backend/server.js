// SLTR Backend v3.0 - PRODUCTION READY
// ✅ All security fixes applied
// ✅ Redis integration for scaling
// ✅ Supabase Storage for file uploads
// ✅ receiver_id fix for messaging

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient: createRedisClient } = require('redis');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const app = express();
const server = http.createServer(app);

// Trust proxy for Railway deployment (behind load balancer)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "https://getsltr.com",
      "https://www.getsltr.com",
      process.env.DEV_FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001"
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow SLTR Vercel deployments
    if ((origin.includes('getsltr') || origin.includes('sltr-s-projects') || origin.includes('3musketeers')) && origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};
app.set('trust proxy', 1); // Trust the first proxy (Railway load balancer)

// Security middleware (removed unnecessary CSP for JSON API)
app.use(helmet({crossOriginEmbedderPolicy: false}));
app.use(cors(corsOptions));



// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts." },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many file uploads." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/upload', uploadLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push notifications enabled');
}

// REDIS SETUP for scaling
let redisClient, redisPubClient, redisSubClient;

async function setupRedis() {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  Redis not configured - running in single-server mode');
    return false;
  }

  try {
    // Create Redis clients
    redisClient = createRedisClient({ url: process.env.REDIS_URL });
    redisPubClient = redisClient.duplicate();
    redisSubClient = redisClient.duplicate();

    // Connect all clients
    await redisClient.connect();
    await redisPubClient.connect();
    await redisSubClient.connect();

    console.log('✅ Redis connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.warn('⚠️  Falling back to single-server mode');
    return false;
  }
}

// MULTER SETUP - Using memory storage for Supabase upload
const upload = multer({ 
  storage: multer.memoryStorage(), // Store in memory, not disk
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'video/mp4', 
      'video/webm'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

// REDIS HELPER FUNCTIONS
async function setActiveUser(socketId, userData) {
  if (redisClient) {
    await redisClient.hSet('activeUsers', socketId, JSON.stringify(userData));
  }
}

async function getActiveUser(socketId) {
  if (redisClient) {
    const data = await redisClient.hGet('activeUsers', socketId);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

async function removeActiveUser(socketId) {
  if (redisClient) {
    await redisClient.hDel('activeUsers', socketId);
  }
}

async function setTypingUser(key, data) {
  if (redisClient) {
    await redisClient.setEx(`typing:${key}`, 30, JSON.stringify(data));
  }
}

async function removeTypingUser(key) {
  if (redisClient) {
    await redisClient.del(`typing:${key}`);
  }
}

// Fallback in-memory storage (if Redis not available)
const activeUsers = new Map();
const typingUsers = new Map();

// Socket.io setup
const io = socketIo(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize Socket.io with Redis adapter (if available)
async function initSocketIO() {
  const redisConnected = await setupRedis();
  
  if (redisConnected && redisPubClient && redisSubClient) {
    io.adapter(createAdapter(redisPubClient, redisSubClient));
    console.log('✅ Socket.io Redis adapter enabled - multi-server ready');
  } else {
    console.log('ℹ️  Socket.io running in single-server mode');
  }
}

// Push notification helper
async function sendPushNotification(userId, senderName, messageContent, conversationId) {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) return;

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) return;

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

    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      return webpush.sendNotification(pushSubscription, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        });
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('authenticate', async (data) => {
    try {
      const { userId, token } = data;
      
      if (!token || !userId) {
        socket.emit('auth_error', { message: 'Missing authentication data' });
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user || user.id !== userId) {
        socket.emit('auth_error', { message: 'Invalid authentication' });
        return;
      }

      const userData = {
        userId: user.id,
        socketId: socket.id,
        username: user.user_metadata?.username || 'Unknown',
        online: true,
        lastSeen: new Date().toISOString()
      };

      // Store in Redis or fallback to memory
      if (redisClient) {
        await setActiveUser(socket.id, userData);
      } else {
        activeUsers.set(socket.id, userData);
      }

      // Update database
      await supabase
        .from('profiles')
        .update({ online: true, last_seen: new Date().toISOString() })
        .eq('id', user.id);

      socket.join(`user_${user.id}`);
      
      socket.broadcast.emit('user_online', {
        userId: user.id,
        username: user.user_metadata?.username
      });

      socket.emit('authenticated', { success: true });
      console.log(`User authenticated: ${user.id}`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      // Get user from Redis or memory
      const user = redisClient 
        ? await getActiveUser(socket.id)
        : activeUsers.get(socket.id);
      
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const { conversationId, content, messageType = 'text', fileUrl = null } = data;
      
      if (!conversationId || !content) {
        socket.emit('message_error', { message: 'Missing required data' });
        return;
      }

      if (content.length > 1000) {
        socket.emit('message_error', { message: 'Message too long' });
        return;
      }

      // Get conversation and determine receiver
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        socket.emit('message_error', { message: 'Conversation not found' });
        return;
      }

      // Security check
      if (conversation.user1_id !== user.userId && conversation.user2_id !== user.userId) {
        socket.emit('message_error', { message: 'Not authorized' });
        return;
      }

      // Determine receiver - CRITICAL FIX
      const receiverId = conversation.user1_id === user.userId 
        ? conversation.user2_id 
        : conversation.user1_id;

      // Save message WITH receiver_id
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.userId,
          receiver_id: receiverId,  // FIXED: receiver_id included
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

      // Broadcast message
      io.to(`conversation_${conversationId}`).emit('new_message', {
        id: message.id,
        conversationId,
        senderId: user.userId,
        receiverId,
        content,
        messageType,
        fileUrl,
        createdAt: message.created_at,
        senderName: user.username
      });

      // Send push notification
      sendPushNotification(receiverId, user.username, content, conversationId);

      socket.emit('message_delivered', { messageId: message.id });
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing_start', async (data) => {
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user) return;

    const { conversationId } = data;
    if (!conversationId) return;

    const typingData = {
      userId: user.userId,
      username: user.username,
      conversationId,
      timestamp: Date.now()
    };

    if (redisClient) {
      await setTypingUser(`${user.userId}_${conversationId}`, typingData);
    } else {
      typingUsers.set(`${user.userId}_${conversationId}`, typingData);
    }

    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: user.userId,
      username: user.username,
      conversationId
    });
  });

  socket.on('typing_stop', async (data) => {
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user) return;

    const { conversationId } = data;
    if (!conversationId) return;

    if (redisClient) {
      await removeTypingUser(`${user.userId}_${conversationId}`);
    } else {
      typingUsers.delete(`${user.userId}_${conversationId}`);
    }

    socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
      userId: user.userId,
      conversationId
    });
  });

  socket.on('mark_message_read', async (data) => {
    try {
      const { messageId, conversationId } = data;
      const user = redisClient 
        ? await getActiveUser(socket.id)
        : activeUsers.get(socket.id);
      
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString(),
          read_by: user.userId
        })
        .eq('id', messageId);

      if (!error) {
        socket.to(`conversation_${conversationId}`).emit('message_read', {
          messageId,
          readBy: user.userId,
          readAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  socket.on('join_conversation', async (data) => {
    const { conversationId } = data;
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user || !conversationId) return;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (!error && conversation && 
        (conversation.user1_id === user.userId || conversation.user2_id === user.userId)) {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    }
  });

  socket.on('leave_conversation', (data) => {
    const { conversationId } = data;
    socket.leave(`conversation_${conversationId}`);
  });

  // WebRTC signaling
  socket.on('call_offer', async (data) => {
    const { targetUserId, offer, conversationId } = data;
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_offer', {
      fromUserId: user.userId,
      offer,
      conversationId
    });
  });

  socket.on('call_answer', async (data) => {
    const { targetUserId, answer } = data;
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_answer', {
      fromUserId: user.userId,
      answer
    });
  });

  socket.on('call_ice_candidate', async (data) => {
    const { targetUserId, candidate } = data;
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_ice_candidate', {
      fromUserId: user.userId,
      candidate
    });
  });

  socket.on('call_end', async (data) => {
    const { targetUserId, conversationId } = data;
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_end', {
      fromUserId: user.userId,
      conversationId
    });
  });

  socket.on('location_update', async (data) => {
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (!user) return;

    const { latitude, longitude, conversationId } = data;
    
    if (!latitude || !longitude || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return;
    }
    
    socket.to(`conversation_${conversationId}`).emit('user_location_update', {
      userId: user.userId,
      username: user.username,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('file_share', async (data) => {
    try {
      const { conversationId, fileName, fileType, fileSize } = data;
      const user = redisClient 
        ? await getActiveUser(socket.id)
        : activeUsers.get(socket.id);
      
      if (!user || !fileName || !fileType || !fileSize) return;

      if (fileSize > 10 * 1024 * 1024) {
        socket.emit('file_error', { message: 'File too large' });
        return;
      }

      socket.to(`conversation_${conversationId}`).emit('file_shared', {
        fromUserId: user.userId,
        fromUsername: user.username,
        fileName,
        fileType,
        fileSize,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('File share error:', error);
    }
  });

  socket.on('disconnect', async () => {
    const user = redisClient 
      ? await getActiveUser(socket.id)
      : activeUsers.get(socket.id);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          online: false,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.userId);

      socket.broadcast.emit('user_offline', {
        userId: user.userId,
        username: user.username
      });
      
      if (redisClient) {
        await removeActiveUser(socket.id);
      } else {
        activeUsers.delete(socket.id);
      }
      
      console.log(`User disconnected: ${socket.id}`);
    }
  });
});

// API Routes

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'SLTR Realtime Backend',
    version: '3.0.0-PRODUCTION',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '3.0.0-PRODUCTION',
    redis: redisClient ? 'connected' : 'not configured'
  });
});

// FIXED: File upload with Supabase Storage
app.post('/api/upload', authenticateUser, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${req.user.id}/${uuidv4()}${ext}`;
    const bucketName = process.env.SUPABASE_BUCKET_NAME || 'uploads';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    res.json({
      success: true,
      fileUrl: publicUrlData.publicUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user.id
    });
  } catch (error) {
    next(error);
  }
});

// Push notification endpoints
app.get('/api/push/vapid-public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ error: 'Missing userId or subscription' });
    }

    const { error } = await supabase
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

app.use(errorHandler);

// Cleanup for non-Redis mode
if (!redisClient) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, typingData] of typingUsers.entries()) {
      if (now - typingData.timestamp > 30000) {
        typingUsers.delete(key);
      }
    }
  }, 30000);
}

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  await initSocketIO();
  
  server.listen(PORT, () => {
    console.log(`🚀 SLTR Backend v3.0-PRODUCTION running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
    console.log(`✅ All security fixes applied`);
    console.log(`✅ Supabase Storage enabled`);
    console.log(`✅ Redis: ${redisClient ? 'ENABLED - Multi-server ready' : 'NOT CONFIGURED - Single-server mode'}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
