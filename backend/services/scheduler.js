// EROS Scheduler Service
// Monitors user activity and triggers off-peak processing
// CLEAN • RELIABLE • SCALABLE • FUNCTIONAL • SUSTAINABLE

const { createClient } = require('@supabase/supabase-js');

// Constants for processing phases
const PHASE_THRESHOLDS = {
  PHASE_1: 10 * 60 * 1000,  // 10 minutes idle
  PHASE_2: 30 * 60 * 1000,  // 30 minutes idle
  PHASE_3: 60 * 60 * 1000,  // 60 minutes idle
};

const CPU_LIMITS = {
  PHASE_1: 0.05,  // 5% CPU
  PHASE_2: 0.15,  // 15% CPU
  PHASE_3: 0.80,  // 80% CPU
};

/**
 * Sanitize environment variable - remove quotes, trim whitespace, handle newlines
 */
function sanitizeEnvVar(value) {
  if (!value) return null;
  return value
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .replace(/\\n/g, '')          // Remove escaped newlines
    .replace(/\n/g, '')           // Remove actual newlines
    .trim();                       // Trim whitespace
}

/**
 * Validate and create Supabase client with proper error handling
 */
function createSupabaseClient(configUrl, configKey) {
  const url = sanitizeEnvVar(configUrl || process.env.SUPABASE_URL);
  const key = sanitizeEnvVar(configKey || process.env.SUPABASE_ANON_KEY);

  // Log diagnostics on startup
  console.log('📋 EROS Scheduler - Supabase Diagnostics:');
  console.log(`   - SUPABASE_URL: ${url ? '✅ Set (' + url.substring(0, 30) + '...)' : '❌ NOT SET'}`);
  console.log(`   - SUPABASE_ANON_KEY: ${key ? '✅ Set (' + key.substring(0, 20) + '...)' : '❌ NOT SET'}`);

  if (!url || !key) {
    console.error('❌ EROS Scheduler: Missing Supabase credentials!');
    console.error('   Required: SUPABASE_URL and SUPABASE_ANON_KEY');
    return null;
  }

  // Validate URL format
  if (!url.includes('supabase')) {
    console.error('❌ EROS Scheduler: Invalid SUPABASE_URL format');
    return null;
  }

  // Validate key format (should start with eyJ for JWT)
  if (!key.startsWith('eyJ')) {
    console.error('❌ EROS Scheduler: Invalid SUPABASE_ANON_KEY format (should be JWT)');
    return null;
  }

  console.log('✅ EROS Scheduler: Supabase credentials validated');
  return createClient(url, key);
}

class ErosScheduler {
  constructor(config = {}) {
    this.supabase = createSupabaseClient(config.supabaseUrl, config.supabaseKey);

    if (!this.supabase) {
      console.error('❌ EROS Scheduler: Failed to initialize Supabase client');
      console.error('   Scheduler will not be able to fetch user activity');
    }

    this.redis = config.redis || null;
    this.running = false;
    this.checkInterval = config.checkInterval || 30000; // 30 seconds
    this.intervalId = null;
    this.workers = new Map(); // Track active workers
    this.jobQueue = []; // In-memory queue (can be moved to Redis)
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.running) {
      console.warn('⚠️  EROS Scheduler already running');
      return;
    }

    console.log('🚀 EROS Scheduler starting...');
    this.running = true;
    this.intervalId = setInterval(() => this.checkUserActivity(), this.checkInterval);
    console.log('✅ EROS Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.running) return;

    console.log('🛑 EROS Scheduler stopping...');
    this.running = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop all workers
    for (const [userId, worker] of this.workers.entries()) {
      this.stopWorker(userId);
    }

    console.log('✅ EROS Scheduler stopped');
  }

  /**
   * Check all users' activity and trigger processing
   */
  async checkUserActivity() {
    if (!this.running) return;

    // Skip if Supabase client not initialized
    if (!this.supabase) {
      console.warn('⚠️  EROS Scheduler: Skipping activity check - Supabase not initialized');
      return;
    }

    try {
      const now = Date.now();

      // Get all users with their last activity
      const { data: profiles, error } = await this.supabase
        .from('profiles')
        .select('id, last_active, online')
        .not('last_active', 'is', null);

      if (error) {
        console.error('❌ Error fetching user activity:', error.message);
        return;
      }

      if (!profiles || profiles.length === 0) return;

      // Check each user's idle time
      for (const profile of profiles) {
        const lastActive = new Date(profile.last_active).getTime();
        const idleTime = now - lastActive;

        // Skip if user is currently online/active
        if (profile.online && idleTime < PHASE_THRESHOLDS.PHASE_1) {
          continue;
        }

        // Determine processing phase
        const phase = this.determinePhase(idleTime);
        
        if (phase) {
          await this.scheduleProcessing(profile.id, phase, idleTime);
        }
      }
    } catch (error) {
      console.error('❌ EROS Scheduler error:', error);
    }
  }

  /**
   * Determine which processing phase based on idle time
   */
  determinePhase(idleTime) {
    if (idleTime >= PHASE_THRESHOLDS.PHASE_3) {
      return 'PHASE_3';
    } else if (idleTime >= PHASE_THRESHOLDS.PHASE_2) {
      return 'PHASE_2';
    } else if (idleTime >= PHASE_THRESHOLDS.PHASE_1) {
      return 'PHASE_1';
    }
    return null;
  }

  /**
   * Schedule processing for a user
   */
  async scheduleProcessing(userId, phase, idleTime) {
    // Check if already processing
    if (this.workers.has(userId)) {
      const worker = this.workers.get(userId);
      
      // Upgrade phase if needed
      if (this.shouldUpgradePhase(worker.phase, phase)) {
        console.log(`⬆️  Upgrading ${userId} from ${worker.phase} to ${phase}`);
        worker.phase = phase;
        worker.cpuLimit = CPU_LIMITS[phase];
      }
      return;
    }

    // Create job
    const job = {
      userId,
      phase,
      idleTime,
      cpuLimit: CPU_LIMITS[phase],
      createdAt: Date.now(),
      priority: this.calculatePriority(phase),
    };

    // Add to queue
    this.jobQueue.push(job);
    this.jobQueue.sort((a, b) => b.priority - a.priority); // High priority first

    console.log(`📋 Queued ${phase} processing for user ${userId.substring(0, 8)}... (idle: ${Math.round(idleTime / 60000)}m)`);

    // Process queue
    await this.processQueue();
  }

  /**
   * Process the job queue
   */
  async processQueue() {
    // Limit concurrent workers (scalable limit)
    const maxWorkers = this.getMaxWorkers();
    
    while (this.jobQueue.length > 0 && this.workers.size < maxWorkers) {
      const job = this.jobQueue.shift();
      await this.startWorker(job);
    }
  }

  /**
   * Start a worker for a user
   */
  async startWorker(job) {
    const { userId, phase, cpuLimit } = job;

    const worker = {
      userId,
      phase,
      cpuLimit,
      startedAt: Date.now(),
      status: 'running',
    };

    this.workers.set(userId, worker);

    console.log(`🔄 Starting ${phase} worker for ${userId.substring(0, 8)}... (CPU limit: ${cpuLimit * 100}%)`);

    // Run worker (non-blocking)
    this.runWorker(worker).catch(error => {
      console.error(`❌ Worker error for ${userId}:`, error.message);
      this.stopWorker(userId);
    });
  }

  /**
   * Run worker - actual processing happens here
   */
  async runWorker(worker) {
    const { userId, phase } = worker;

    try {
      // Import services dynamically
      const analyzerService = require('./analyzer');
      const matcherService = require('./matcher');

      // Phase 1: Light pattern extraction
      if (phase === 'PHASE_1') {
        await analyzerService.lightAnalysis(userId);
      }

      // Phase 2: Medium batch analysis
      if (phase === 'PHASE_2') {
        await analyzerService.mediumAnalysis(userId);
      }

      // Phase 3: Heavy analysis + match generation
      if (phase === 'PHASE_3') {
        await analyzerService.deepAnalysis(userId);
        await matcherService.generateDailyMatches(userId);
      }

      console.log(`✅ ${phase} worker completed for ${userId.substring(0, 8)}...`);
    } catch (error) {
      console.error(`❌ Worker processing error:`, error);
      throw error;
    } finally {
      this.stopWorker(userId);
    }
  }

  /**
   * Stop a worker
   */
  stopWorker(userId) {
    if (this.workers.has(userId)) {
      this.workers.delete(userId);
      console.log(`🛑 Worker stopped for ${userId.substring(0, 8)}...`);
    }
  }

  /**
   * Check if we should upgrade processing phase
   */
  shouldUpgradePhase(currentPhase, newPhase) {
    const phases = ['PHASE_1', 'PHASE_2', 'PHASE_3'];
    return phases.indexOf(newPhase) > phases.indexOf(currentPhase);
  }

  /**
   * Calculate job priority (higher = more important)
   */
  calculatePriority(phase) {
    const basePriority = {
      PHASE_1: 1,
      PHASE_2: 2,
      PHASE_3: 3,
    };
    return basePriority[phase] || 0;
  }

  /**
   * Get max concurrent workers based on system resources
   */
  getMaxWorkers() {
    // Scalable: adjust based on available CPU cores
    const cpuCount = require('os').cpus().length;
    return Math.max(2, Math.floor(cpuCount / 2));
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.running,
      activeWorkers: this.workers.size,
      queuedJobs: this.jobQueue.length,
      workers: Array.from(this.workers.entries()).map(([userId, worker]) => ({
        userId: userId.substring(0, 8) + '...',
        phase: worker.phase,
        cpuLimit: worker.cpuLimit,
        runtime: Math.round((Date.now() - worker.startedAt) / 1000) + 's',
      })),
    };
  }

  /**
   * Halt processing for a user (when they become active)
   */
  async haltUserProcessing(userId) {
    // Remove from queue
    this.jobQueue = this.jobQueue.filter(job => job.userId !== userId);
    
    // Stop worker if running
    if (this.workers.has(userId)) {
      this.stopWorker(userId);
      console.log(`⏸️  Halted processing for ${userId.substring(0, 8)}... (user became active)`);
      return true;
    }
    
    return false;
  }
}

// Singleton instance
let schedulerInstance = null;

/**
 * Get scheduler instance
 */
function getScheduler(config) {
  if (!schedulerInstance) {
    schedulerInstance = new ErosScheduler(config);
  }
  return schedulerInstance;
}

module.exports = {
  ErosScheduler,
  getScheduler,
  PHASE_THRESHOLDS,
  CPU_LIMITS,
};
