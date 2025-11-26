import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';
import { ErosAssistantService } from '../services/eros-assistant';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const erosService = new ErosAssistantService();

// CORS configuration - allow SLTR domains
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'https://getsltr.com',
      'https://www.getsltr.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    // Allow no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow exact matches
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Allow Vercel preview deployments
    if (origin.includes('vercel.app') && (origin.includes('getsltr') || origin.includes('sltr') || origin.includes('3musketeers'))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting
const erosLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 EROS questions per day
  message: 'Daily EROS limit reached. Try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Require Pro subscription
const requirePro = async (req: any, res: any, next: any) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier, founder')
      .eq('id', req.user.id)
      .single();

    // Founders always have access
    if (profile?.founder) {
      return next();
    }

    // Check subscription tier
    if (error || !profile || !['plus', 'pro', 'founder'].includes(profile.subscription_tier)) {
      return res.status(403).json({
        error: 'SLTR Pro subscription required',
        upgrade_url: 'https://getsltr.com/sltr-plus'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Subscription check failed' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// EROS Chat endpoint
app.post('/api/eros/chat', requireAuth, requirePro, erosLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await erosService.chat({
      user_id: (req as any).user.id,
      message
    });

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      success: false,
      response: "I'm having trouble right now. Please try again in a moment.",
      conversation_id: ''
    });
  }
});

// Get daily matches
app.get('/api/matches/daily', requireAuth, requirePro, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const today = new Date().toISOString().split('T')[0];

    const { data: matches, error } = await supabase
      .from('eros_daily_matches')
      .select(`
        *,
        profile:match_user_id (
          id,
          display_name,
          age,
          bio,
          photos
        )
      `)
      .eq('user_id', userId)
      .eq('match_date', today)
      .order('rank', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      matches: matches || [],
      date: today,
      count: matches?.length || 0
    });
  } catch (error) {
    console.error('Daily matches error:', error);
    res.status(500).json({ error: 'Failed to fetch daily matches' });
  }
});

// Error handler
app.use((err: Error, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SLTR EROS API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
