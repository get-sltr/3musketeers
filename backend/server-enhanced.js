// Enhanced Backend Security Implementation
// This will replace the current backend/server.js with enhanced security

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "https://getsltr.com",
      process.env.DEV_FRONTEND_URL || "http://localhost:3000"
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));

// Enhanced rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth attempts
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit file uploads
  message: {
    error: "Too many file uploads, please try again later.",
    retryAfter: "1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/upload', uploadLimiter);

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Enhanced file upload configuration
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'video/mp4', 
      'video/webm',
      'application/pdf',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Input validation middleware
const validateMessage = [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message content must be between 1 and 1000 characters'),
  body('conversationId').isUUID().withMessage('Invalid conversation ID'),
  body('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type')
];

const validateProfile = [
  body('display_name').trim().isLength({ min: 1, max: 50 }).withMessage('Display name must be between 1 and 50 characters'),
  body('age').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters')
];

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
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files per request.' });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

// Store active users and typing status
const activeUsers = new Map();
const typingUsers = new Map();

// Socket.io connection handling with enhanced security
const io = socketIo(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Enhanced user authentication
  socket.on('authenticate', async (data) => {
    try {
      const { userId, token } = data;
      
      if (!token || !userId) {
        socket.emit('auth_error', { message: 'Missing authentication data' });
        return;
      }

      // Verify user with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user || user.id !== userId) {
        socket.emit('auth_error', { message: 'Invalid authentication' });
        return;
      }

      // Store user info
      activeUsers.set(socket.id, {
        userId: user.id,
        socketId: socket.id,
        username: user.user_metadata?.username || 'Unknown',
        online: true,
        lastSeen: new Date(),
        ipAddress: socket.handshake.address
      });

      // Join user to their personal room
      socket.join(`user_${user.id}`);
      
      // Notify user is online
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

  // Enhanced real-time messaging with validation
  socket.on('send_message', async (data) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Validate message data
      const { conversationId, content, messageType = 'text', fileUrl = null } = data;
      
      if (!conversationId || !content) {
        socket.emit('message_error', { message: 'Missing required message data' });
        return;
      }

      if (content.length > 1000) {
        socket.emit('message_error', { message: 'Message too long' });
        return;
      }

      // Check if user is part of conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        socket.emit('message_error', { message: 'Conversation not found' });
        return;
      }

      if (conversation.user1_id !== user.userId && conversation.user2_id !== user.userId) {
        socket.emit('message_error', { message: 'Not authorized for this conversation' });
        return;
      }

      // Determine receiver (the other user in conversation)
      const receiverId = conversation.user1_id === user.userId 
        ? conversation.user2_id 
        : conversation.user1_id;

      // Save message to database with receiver_id
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

      // Message payload for real-time events
      const messagePayload = {
        id: message.id,
        conversationId: conversationId,
        senderId: user.userId,
        sender_id: user.userId,
        receiverId: receiverId,
        receiver_id: receiverId,
        content: content,
        messageType: messageType,
        message_type: messageType,
        fileUrl: fileUrl,
        file_url: fileUrl,
        createdAt: message.created_at,
        created_at: message.created_at,
        senderName: user.username
      };

      // Emit to conversation participants (if they're in the conversation room)
      io.to(`conversation_${conversationId}`).emit('new_message', messagePayload);

      // ALSO emit to receiver's personal room (for notifications even if not in conversation)
      io.to(`user_${receiverId}`).emit('new_message', messagePayload);

      // Store notification in database for offline users
      // Check if receiver is online
      const receiverOnline = Array.from(activeUsers.values()).some(u => u.userId === receiverId);
      
      if (!receiverOnline) {
        // Store notification for offline user (we can use messages table since receiver_id is set)
        // The unread messages will serve as notifications when user comes online
        console.log(`📬 Storing notification for offline user: ${receiverId}`);
      }

      // Emit message delivered status
      socket.emit('message_delivered', { messageId: message.id });
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Enhanced typing indicators
  socket.on('typing_start', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { conversationId } = data;
    if (!conversationId) return;

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
    if (!conversationId) return;

    typingUsers.delete(`${user.userId}_${conversationId}`);

    socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
      userId: user.userId,
      conversationId: conversationId
    });
  });

  // Enhanced message read status
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

  // Join conversation room with validation
  socket.on('join_conversation', async (data) => {
    const { conversationId } = data;
    const user = activeUsers.get(socket.id);
    
    if (!user || !conversationId) return;

    // Verify user is part of conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!error && conversation && 
        (conversation.user1_id === user.userId || conversation.user2_id === user.userId)) {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    }
  });

  // Leave conversation room
  socket.on('leave_conversation', (data) => {
    const { conversationId } = data;
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.id} left conversation ${conversationId}`);
  });

  // Enhanced WebRTC signaling
  socket.on('call_offer', (data) => {
    const { targetUserId, offer, conversationId } = data;
    const user = activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_offer', {
      fromUserId: user.userId,
      offer: offer,
      conversationId: conversationId
    });
  });

  socket.on('call_answer', (data) => {
    const { targetUserId, answer } = data;
    const user = activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_answer', {
      fromUserId: user.userId,
      answer: answer
    });
  });

  socket.on('call_ice_candidate', (data) => {
    const { targetUserId, candidate } = data;
    const user = activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_ice_candidate', {
      fromUserId: user.userId,
      candidate: candidate
    });
  });

  socket.on('call_end', (data) => {
    const { targetUserId, conversationId } = data;
    const user = activeUsers.get(socket.id);
    
    if (!user) return;
    
    socket.to(`user_${targetUserId}`).emit('call_end', {
      fromUserId: user.userId,
      conversationId: conversationId
    });
  });

  // Enhanced location updates
  socket.on('location_update', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { latitude, longitude, conversationId } = data;
    
    // Validate coordinates
    if (!latitude || !longitude || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return;
    }
    
    // Broadcast location to conversation participants
    socket.to(`conversation_${conversationId}`).emit('user_location_update', {
      userId: user.userId,
      username: user.username,
      latitude: latitude,
      longitude: longitude,
      timestamp: new Date().toISOString()
    });
  });

  // Enhanced file sharing
  socket.on('file_share', async (data) => {
    try {
      const { conversationId, fileName, fileType, fileSize } = data;
      const user = activeUsers.get(socket.id);
      
      if (!user) return;

      // Validate file data
      if (!fileName || !fileType || !fileSize) {
        return;
      }

      // Check file size limit
      if (fileSize > 10 * 1024 * 1024) { // 10MB
        socket.emit('file_error', { message: 'File too large' });
        return;
      }

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

  // Enhanced disconnect handling
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
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
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Enhanced API routes with validation and authentication

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeUsers: activeUsers.size,
    typingUsers: typingUsers.size,
    version: '2.0.0'
  });
});

// Enhanced file upload endpoint
app.post('/api/upload', upload.single('file'), authenticateUser, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user.id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Enhanced profile management
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/user/profile', authenticateUser, validateProfile, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(req.body)
      .eq('id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Apply error handling middleware
app.use(errorHandler);

// Clean up typing indicators every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, typingData] of typingUsers.entries()) {
    if (now - typingData.timestamp > 30000) { // 30 seconds timeout
      typingUsers.delete(key);
    }
  }
}, 30000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 SLTR Enhanced Backend running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || "https://getsltr.com"}`);
  console.log(`🛡️ Enhanced security features enabled`);
});


