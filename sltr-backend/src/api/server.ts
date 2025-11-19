import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';
import { ErosAssistantService } from '../services/eros-assistant.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.getsltr.com';

const erosService = new ErosAssistantService();

// Middleware
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
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
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', req.user.id)
      .single();

    if (error || !user || !['pro', 'founder'].includes(user.subscription_tier)) {
      return res.status(403).json({
        error: 'Pro subscription required',
        upgrade_url: `${FRONTEND_URL}/upgrade`
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
