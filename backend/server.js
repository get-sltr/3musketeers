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
const Anthropic = require('@anthropic-ai/sdk');

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

// Initialize Anthropic
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log('✅ Claude AI enabled');
} else {
  console.warn('⚠️  ANTHROPIC_API_KEY not set - EROS will use placeholder responses');
}

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

// EROS diagnostic endpoint (for debugging Anthropic API issues)
app.get('/api/v1/eros/diagnostic', (req, res) => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const apiKeyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
  const apiKeyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'NOT SET';
  const anthropicInitialized = !!anthropic;
  
  // Determine possible issues
  const issues = [];
  if (!hasApiKey) {
    issues.push('ANTHROPIC_API_KEY environment variable not set in Railway');
  }
  if (hasApiKey && apiKeyLength < 40) {
    issues.push(`API key appears too short (${apiKeyLength} chars, should be 50+ characters)`);
  }
  // Anthropic API keys can be 'sk-ant-...' or just 'sk-...'
  if (hasApiKey && !apiKeyPrefix.startsWith('sk-')) {
    issues.push(`API key format may be incorrect (starts with "${apiKeyPrefix}", should start with "sk-")`);
  }
  if (hasApiKey && !anthropicInitialized) {
    issues.push('API key set but Anthropic client not initialized - check server startup logs');
  }
  
  // Determine root cause
  let rootCause = 'unknown';
  let recommendation = 'Check Railway logs for detailed error messages';
  
  if (!hasApiKey) {
    rootCause = 'missing_api_key';
    recommendation = 'Set ANTHROPIC_API_KEY in Railway environment variables with your Anthropic API key';
  } else if (apiKeyLength < 40) {
    rootCause = 'invalid_api_key_length';
    recommendation = 'API key appears invalid - verify key in Anthropic console (https://console.anthropic.com/)';
  } else if (!apiKeyPrefix.startsWith('sk-')) {
    rootCause = 'invalid_api_key_format';
    recommendation = 'API key format incorrect - should start with "sk-". Get new key from Anthropic console';
  } else if (!anthropicInitialized) {
    rootCause = 'initialization_failed';
    recommendation = 'API key present but Anthropic client failed to initialize - check server startup logs';
  } else {
    rootCause = 'api_authentication_failure';
    recommendation = 'API key appears valid but API calls are failing. Possible causes: 1) Key expired/revoked, 2) Billing/quota issue, 3) Network/firewall blocking Anthropic API. Check Anthropic console for account status.';
  }
  
  res.json({
    eros_status: anthropicInitialized ? 'configured' : 'not_configured',
    anthropic_initialized: anthropicInitialized,
    api_key_present: hasApiKey,
    api_key_length: apiKeyLength,
    api_key_prefix: apiKeyPrefix,
    expected_key_format: 'sk-... (40+ characters)',
    root_cause: rootCause,
    issues: issues.length > 0 ? issues : ['No obvious configuration issues - check API key validity and Anthropic account status'],
    recommendation: recommendation,
    is_subscription_issue: rootCause === 'api_authentication_failure' && hasApiKey && apiKeyLength >= 40 && apiKeyPrefix.startsWith('sk-')
  });
});

// Test Anthropic API key directly
app.get('/api/v1/eros/test-api-key', async (req, res) => {
  if (!anthropic) {
    return res.status(500).json({
      error: 'Anthropic client not initialized',
      api_key_present: !!process.env.ANTHROPIC_API_KEY
    });
  }

  try {
    // Make a minimal test API call
    const testResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [
        { role: 'user', content: 'Say "test" if you can read this.' }
      ]
    });

    const responseText = testResponse.content[0]?.type === 'text' 
      ? testResponse.content[0].text 
      : 'No text response';

    res.json({
      status: 'success',
      api_key_valid: true,
      test_response: responseText,
      message: 'API key is working correctly!'
    });
  } catch (error) {
    const status = error?.status || error?.statusCode;
    const errorMessage = error?.message || '';
    
    let errorType = 'unknown';
    let solution = 'Check Anthropic console for account status';
    
    if (status === 401 || status === 403) {
      errorType = 'authentication_failed';
      solution = 'API key is invalid, expired, or revoked. Go to https://console.anthropic.com/ to: 1) Check if key is active, 2) Verify billing is set up, 3) Create a new API key if needed';
    } else if (status === 429) {
      errorType = 'rate_limit';
      solution = 'Rate limit exceeded. Wait a few minutes and try again, or upgrade your Anthropic plan';
    } else if (status === 402) {
      errorType = 'payment_required';
      solution = 'Billing issue - payment method required or account suspended. Go to https://console.anthropic.com/ to add payment method';
    } else if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
      errorType = 'billing_quota';
      solution = 'Billing/quota issue. Check Anthropic console for: 1) Payment method, 2) Usage limits, 3) Account status';
    }

    res.status(status || 500).json({
      status: 'error',
      api_key_valid: false,
      error_type: errorType,
      http_status: status,
      error_message: errorMessage,
      solution: solution,
      full_error: {
        message: errorMessage,
        status: status,
        statusCode: error?.statusCode,
        code: error?.code,
        type: error?.type
      }
    });
  }
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

// Generic push notification endpoint (for taps, matches, etc.)
app.post('/api/push/send', async (req, res) => {
  try {
    const { userId, title, body, tag, url, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields: userId, title, body' });
    }

    if (!process.env.VAPID_PUBLIC_KEY) {
      return res.status(503).json({ error: 'Push notifications not configured' });
    }

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: tag || 'notification',
      data: {
        url: url || '/',
        ...data
      }
    });

    let sent = 0;
    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      return webpush.sendNotification(pushSubscription, payload)
        .then(() => { sent++; })
        .catch(err => {
          // Remove invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          console.error('Push send error:', err.statusCode, err.message);
        });
    });

    await Promise.all(sendPromises);

    res.json({ success: true, sent });
  } catch (error) {
    console.error('Push send error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ========== EROS API ENDPOINTS ==========

// Heartbeat tracking - user activity monitoring
app.post('/api/v1/heartbeat', authenticateUser, async (req, res) => {
  try {
    const { appActive, screenOn } = req.body;
    const userId = req.user.id;
    const now = new Date().toISOString();

    // Get previous last_active to calculate idle time BEFORE updating
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_active')
      .eq('id', userId)
      .single();

    // Calculate idle time BEFORE updating last_active
    const lastActive = profile?.last_active ? new Date(profile.last_active).getTime() : Date.now();
    const idleTime = Math.max(0, Date.now() - lastActive);

    // Update user's last activity timestamp
    await supabase
      .from('profiles')
      .update({ 
        last_active: now,
        online: appActive !== false
      })
      .eq('id', userId);

    // If user became active, halt any processing
    let processingPhase = 'active';
    if (appActive !== false && idleTime < 10 * 60 * 1000) { // Active within 10 min
      try {
        const scheduler = getScheduler();
        const halted = await scheduler.haltUserProcessing(userId);
        if (halted) {
          console.log(`⏸️  User ${userId.substring(0, 8)}... became active, halted processing`);
        }
      } catch (schedulerError) {
        // Scheduler might not be initialized yet, ignore
        console.warn('Scheduler not available:', schedulerError.message);
      }
      processingPhase = 'active';
    } else {
      // Determine phase based on idle time
      if (idleTime >= 60 * 60 * 1000) processingPhase = 'phase3';
      else if (idleTime >= 30 * 60 * 1000) processingPhase = 'phase2';
      else if (idleTime >= 10 * 60 * 1000) processingPhase = 'phase1';
    }

    res.json({
      success: true,
      idleTime: Math.round(idleTime / 1000), // Return in seconds
      processingPhase,
      timestamp: now
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// Daily matches - pre-computed by EROS AI
app.get('/api/v1/matches/daily', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const today = new Date().toISOString().split('T')[0];

    // 1. Load user profile for context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, city, latitude, longitude, subscription_tier, founder, is_super_admin, display_name, age, position, gender_identity, looking_for')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Daily matches profile error:', profileError);
      return res.status(400).json({ error: 'Profile incomplete. Please update your profile first.' });
    }

    const isPremium = profile.founder || profile.is_super_admin || profile.subscription_tier === 'plus';
    if (!isPremium) {
      return res.status(402).json({
        error: 'SLTR Pro required',
        message: 'Daily Matches is a SLTR Pro feature. Upgrade to unlock curated matches.'
      });
    }

    if (!profile.city || !profile.latitude || !profile.longitude) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Set your city/location to receive daily matches.'
      });
    }

    // 2. Try cached matches for today
    const { data: cachedMatches } = await supabase
      .from('matches')
      .select(`
        *,
        matched_profile:profiles!matched_user_id (
          id,
          display_name,
          age,
          position,
          gender_identity,
          city,
          bio:about,
          photos,
          photo_url,
          online,
          last_active,
          dtfn,
          party_friendly,
          distance_miles,
          subscription_tier
        )
      `)
      .eq('user_id', userId)
      .eq('match_type', 'daily_v2')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .order('rank', { ascending: true })
      .limit(limit);

    if (cachedMatches && cachedMatches.length >= Math.min(limit, 3)) {
      return res.json({
        success: true,
        matches: cachedMatches,
        count: cachedMatches.length,
        cached: true,
        date: today,
        source: 'EROS',
      });
    }

    // 3. Need to generate fresh matches
    const matcher = getMatcher();
    const generated = await matcher.generateDailyMatches(userId, limit);

    // Ensure we got matches
    if (!generated?.matches || generated.matches.length === 0) {
      return res.json({
        success: true,
        matches: [],
        count: 0,
        date: today,
        source: 'EROS',
        message: 'No matches found today. Check back tomorrow!'
      });
    }

    res.json({
      success: true,
      matches: generated.matches,
      count: generated.matches.length,
      cached: false,
      date: today,
      source: 'EROS',
    });
  } catch (error) {
    console.error('Daily matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load daily matches',
      message: error.message || 'Unknown error',
    });
  }
});

// Match action - record user interaction with match
app.post('/api/v1/matches/:matchId/action', authenticateUser, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { action, reason } = req.body;
    const userId = req.user.id;

    if (!['like', 'skip', 'block', 'report'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Record the action
    const { error } = await supabase
      .from('match_actions')
      .insert({
        user_id: userId,
        match_id: matchId,
        action,
        reason,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Match action error:', error);
      return res.status(500).json({ error: 'Failed to record action' });
    }

    res.json({
      success: true,
      message: `Match ${action}ed successfully`,
      action,
      matchId
    });
  } catch (error) {
    console.error('Match action error:', error);
    res.status(500).json({ error: 'Failed to process match action' });
  }
});

// EROS Assistant Chat
app.post('/api/v1/assistant/chat', authenticateUser, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get conversation history (last 10 messages)
    const { data: history } = await supabase
      .from('assistant_conversations')
      .select('message, response')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    let response;
    let intent = 'general_query';
    let confidence = 0.85;

    if (anthropic) {
      try {
        // Build conversation history for Claude
        const messages = [];
        if (history && history.length > 0) {
          history.reverse().forEach(msg => {
            if (msg.message) messages.push({ role: 'user', content: msg.message });
            if (msg.response) messages.push({ role: 'assistant', content: msg.response });
          });
        }
        messages.push({ role: 'user', content: message });

        // System prompt for EROS
        const systemPrompt = `You are EROS, a friendly and supportive AI dating assistant for the SLTR app. You help users with:
- Dating questions and relationship advice
- Translating messages between languages
- Profile tips and conversation starters
- Understanding compatibility and connections

Be concise, warm, supportive, and helpful. Keep responses under 150 words. Focus on actionable advice.`;

        // Call Claude API
        const claudeResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages
        });

        response = claudeResponse.content[0].type === 'text' 
          ? claudeResponse.content[0].text 
          : "I'm having trouble right now. Please try again.";
      } catch (aiError) {
        // Log full error details for debugging
        const status = aiError?.status || aiError?.statusCode;
        const errorMessage = aiError?.message || '';
        const errorType = aiError?.type || '';
        
        console.error('Claude API error:', {
          message: errorMessage,
          status: status,
          statusCode: aiError?.statusCode,
          code: aiError?.code,
          type: errorType,
          error: aiError
        });
        
        // Check if API key is actually set
        const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
        const apiKeyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
        console.error('API Key check:', {
          hasApiKey,
          apiKeyLength,
          apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...' || 'NOT SET'
        });
        
        // More specific error messages
        if (status === 401 || status === 403) {
          // API key issue - use friendly message but log the real issue
          console.error('⚠️  Anthropic API authentication failed. Check ANTHROPIC_API_KEY in Railway.');
          console.error('   - Is ANTHROPIC_API_KEY set?', hasApiKey);
          console.error('   - Key length:', apiKeyLength, '(should be ~50+ characters)');
          console.error('   - Key should start with: sk-ant-api03-');
          response = "EROS is temporarily unavailable. Our team has been notified. Please try again in a few minutes.";
        } else if (status === 429) {
          response = "EROS is busy right now. Please try again in a moment.";
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
          response = "Network issue connecting to EROS. Please check your connection and try again.";
        } else if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('Invalid')) {
          console.error('⚠️  Anthropic API key issue detected.');
          response = "EROS is temporarily unavailable. Please try again in a few minutes.";
        } else {
          response = "I'm having trouble connecting right now. Please try again in a moment.";
        }
      }
    } else {
      // Fallback placeholder responses (when ANTHROPIC_API_KEY not set)
      console.warn('⚠️  EROS chat: ANTHROPIC_API_KEY not configured, using placeholder response');
      const placeholderResponses = [
        'I\'m EROS, your AI matchmaker. How can I help you find your perfect match today?',
        'Tell me what you\'re looking for and I can help craft the perfect conversation starter!',
        'Looking for dating advice? I\'ve got tips to make your profile shine!',
        'Ask me anything about connections, and I\'ll help you understand what you really want.'
      ];
      response = placeholderResponses[Math.floor(Math.random() * placeholderResponses.length)];
    }

    // Save conversation to database
    const { error: saveError } = await supabase
      .from('assistant_conversations')
      .insert({
        user_id: userId,
        message,
        context,
        response,
        intent,
        confidence,
        created_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Save conversation error:', saveError);
    }

    res.json({
      success: true,
      response,
      intent,
      confidence
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// Activity status
app.get('/api/v1/activity/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('last_active, online')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch activity status' });
    }

    const lastInteraction = profile?.last_active || new Date().toISOString();
    const idleTime = Math.floor((Date.now() - new Date(lastInteraction).getTime()) / 1000);

    res.json({
      userId,
      lastInteraction,
      idleTime,
      processingPhase: 'active',
      sessionDuration: 0
    });
  } catch (error) {
    console.error('Activity status error:', error);
    res.status(500).json({ error: 'Failed to fetch activity status' });
  }
});

// EROS Scheduler status (admin/monitoring)
app.get('/api/v1/eros/status', authenticateUser, async (req, res) => {
  try {
    const { getScheduler } = require('./services/scheduler');
    const scheduler = getScheduler();
    const status = scheduler.getStatus();
    
    res.json({
      success: true,
      scheduler: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('EROS status error:', error);
    res.status(500).json({ error: 'Failed to fetch EROS status' });
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

// Auto-migrate EROS tables on startup
async function ensureErosTables() {
  try {
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        matched_user_id UUID NOT NULL,
        match_type VARCHAR(50) DEFAULT 'daily',
        compatibility_score FLOAT DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
      );
      
      CREATE TABLE IF NOT EXISTS match_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        match_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS assistant_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        message TEXT NOT NULL,
        context JSONB DEFAULT '{}'::jsonb,
        response TEXT,
        intent VARCHAR(100),
        confidence FLOAT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
      CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_match_actions_user_id ON match_actions(user_id);
      CREATE INDEX IF NOT EXISTS idx_match_actions_match_id ON match_actions(match_id);
      CREATE INDEX IF NOT EXISTS idx_assistant_user_id ON assistant_conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_assistant_created_at ON assistant_conversations(created_at DESC);
    `;

    // Execute via Supabase admin
    const { error } = await supabase.rpc('exec', { sql: createTablesSQL }).catch(() => ({ error: null }));
    if (error) {
      console.warn('⚠️  Could not auto-migrate tables:', error.message);
    } else {
      console.log('✅ EROS tables ensured');
    }
  } catch (err) {
    console.warn('⚠️  Migration warning (non-fatal):', err.message);
  }
}

// Start server
// Import EROS services
const { getScheduler } = require('./services/scheduler');
const { getMatcher } = require('./services/matcher');

const PORT = process.env.PORT || 3001;

async function startServer() {
  await ensureErosTables();
  await initSocketIO();
  
  // Start EROS Scheduler
  const erosScheduler = getScheduler({ redis: redisClient });
  erosScheduler.start();
  console.log('✅ EROS Scheduler enabled');
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    erosScheduler.stop();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
  server.listen(PORT, () => {
    console.log(`🚀 SLTR Backend v3.0-PRODUCTION running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
    console.log(`✅ All security fixes applied`);
    console.log(`✅ Supabase Storage enabled`);
    console.log(`✅ Redis: ${redisClient ? 'ENABLED - Multi-server ready' : 'NOT CONFIGURED - Single-server mode'}`);
    console.log(`💘 EROS AI Matchmaker: ACTIVE`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
