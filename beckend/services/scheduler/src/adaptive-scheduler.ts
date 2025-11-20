import { Logger } from 'winston';
import { createLogger } from '../../shared/utils/logger';
import { ActivityTracker } from '../../shared/services/activity-tracker';
import { HaltingWorkerPool } from './halting-worker-pool';
import { DatabaseClient } from '../../shared/database/client';
import { AnalysisStatus } from '../../shared/types/eros.types';

export interface SchedulerConfig {
  pollIntervalMs: number; // How often to check for new jobs (5000 = 5 sec)
  phase1BatchSize: number; // 5% CPU = 10-20 users
  phase2BatchSize: number; // 15% CPU = 50-100 users
  phase3BatchSize: number; // 100% CPU = 200-300 users
}

export class AdaptiveScheduler {
  private logger: Logger;
  private activityTracker: ActivityTracker;
  private workerPool: HaltingWorkerPool;
  private db: DatabaseClient;
  private config: SchedulerConfig;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private jobsProcessed: Map<string, number> = new Map(); // Track job stats

  constructor(
    activityTracker: ActivityTracker,
    workerPool: HaltingWorkerPool,
    db: DatabaseClient,
    config?: Partial<SchedulerConfig>
  ) {
    this.logger = createLogger('AdaptiveScheduler');
    this.activityTracker = activityTracker;
    this.workerPool = workerPool;
    this.db = db;
    this.config = {
      pollIntervalMs: 5000, // 5 seconds
      phase1BatchSize: 15,
      phase2BatchSize: 75,
      phase3BatchSize: 250,
      ...config
    };
  }

  /**
   * Start the scheduler
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Adaptive Scheduler started', { pollIntervalMs: this.config.pollIntervalMs });

    // Start polling for jobs
    this.pollInterval = setInterval(() => {
      this.processPendingJobs().catch(error => {
        this.logger.error('Error processing jobs', {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }, this.config.pollIntervalMs);
  }

  /**
   * Stop the scheduler
   */
  public async stop(): Promise<void> {
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    await this.workerPool.shutdown();
    this.logger.info('Adaptive Scheduler stopped');
  }

  /**
   * Main processing loop - check phases and dispatch jobs
   */
  private async processPendingJobs(): Promise<void> {
    try {
      // Get stats
      const stats = this.activityTracker.getStats();
      const workerStats = this.workerPool.getStats();

      // Log every 30 iterations (150 seconds)
      if (!this.jobsProcessed.has('lastLog') || (Date.now() - (this.jobsProcessed.get('lastLog') || 0)) > 150000) {
        this.logger.info('Scheduler status', {
          activeUsers: stats.totalActive,
          phase1: stats.phase1Count,
          phase2: stats.phase2Count,
          phase3: stats.phase3Count,
          activeWorkers: workerStats.activeWorkers,
          cpuUsage: workerStats.cpuUsage,
          avgJobDuration: Math.round(workerStats.averageJobDuration)
        });
        this.jobsProcessed.set('lastLog', Date.now());
      }

      // Process each phase
      await this.processPhase('phase3', this.config.phase3BatchSize);
      await this.processPhase('phase2', this.config.phase2BatchSize);
      await this.processPhase('phase1', this.config.phase1BatchSize);
    } catch (error) {
      this.logger.error('Processing error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Process jobs for a specific phase
   */
  private async processPhase(phase: 'phase1' | 'phase2' | 'phase3', batchSize: number): Promise<void> {
    try {
      // Get users in this phase
      const usersInPhase = this.activityTracker.getUsersByPhase(phase);

      if (usersInPhase.length === 0) {
        return;
      }

      // Check if worker pool can accept more jobs
      if (!this.workerPool.canAcceptJob(phase)) {
        this.logger.debug('Worker pool full for phase', { phase });
        return;
      }

      // Get pending jobs for this phase from queue
      const pendingJobs = await this.getPendingJobsForPhase(phase, batchSize);

      if (pendingJobs.length === 0) {
        return;
      }

      // Submit jobs to worker pool
      for (const job of pendingJobs) {
        await this.submitJobToWorkerPool(job, phase);
      }
    } catch (error) {
      this.logger.error('Phase processing error', {
        phase,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get pending jobs for a phase from database queue
   */
  private async getPendingJobsForPhase(phase: 'phase1' | 'phase2' | 'phase3', limit: number): Promise<any[]> {
    try {
      // Query jobs from eros_analysis_queue with status = pending
      const { data, error } = await this.db.getClient()
        .from('eros_analysis_queue')
        .select('*')
        .eq('status', AnalysisStatus.PENDING)
        .in('priority', ['high', 'normal', 'low']) // Adjust based on phase
        .order('priority', { ascending: false })
        .order('queued_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error getting pending jobs', {
        phase,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Submit a job to the worker pool
   */
  private async submitJobToWorkerPool(job: any, phase: 'phase1' | 'phase2' | 'phase3'): Promise<void> {
    try {
      // Mark job as processing
      await this.db.getClient()
        .from('eros_analysis_queue')
        .update({ status: AnalysisStatus.PROCESSING, started_at: new Date() })
        .eq('id', job.id);

      // Create processor function
      const processor = async (signal: AbortSignal) => {
        await this.executeJob(job, signal);
      };

      // Submit to worker pool
      await this.workerPool.submitJob(job.id, job.user_id, phase, processor);

      // Mark as complete
      await this.db.getClient()
        .from('eros_analysis_queue')
        .update({ status: AnalysisStatus.COMPLETED, completed_at: new Date() })
        .eq('id', job.id);

      this.logger.debug('Job completed', { jobId: job.id, userId: job.user_id, phase });
    } catch (error) {
      // Check if aborted (user became active)
      if (error instanceof Error && error.name === 'AbortError') {
        // Job was halted - mark for retry
        await this.db.getClient()
          .from('eros_analysis_queue')
          .update({ status: AnalysisStatus.PENDING })
          .eq('id', job.id);

        this.logger.debug('Job halted (user became active), marked for retry', { jobId: job.id });
      } else {
        // Real error - increment attempt count
        const newAttempts = (job.attempt_count || 0) + 1;

        if (newAttempts >= (job.max_attempts || 3)) {
          await this.db.getClient()
            .from('eros_analysis_queue')
            .update({ status: AnalysisStatus.FAILED, error_message: error instanceof Error ? error.message : String(error) })
            .eq('id', job.id);

          this.logger.error('Job failed after max attempts', { jobId: job.id, attempts: newAttempts });
        } else {
          await this.db.getClient()
            .from('eros_analysis_queue')
            .update({ status: AnalysisStatus.PENDING, attempt_count: newAttempts })
            .eq('id', job.id);

          this.logger.warn('Job failed, marked for retry', { jobId: job.id, attempts: newAttempts });
        }
      }
    }
  }

  /**
   * Execute a single job
   */
  private async executeJob(job: any, signal: AbortSignal): Promise<void> {
    // This is where the actual analysis/matching happens
    // For now, simulate work
    return new Promise((resolve, reject) => {
      // Check abort signal periodically
      const checkInterval = setInterval(() => {
        if (signal.aborted) {
          clearInterval(checkInterval);
          reject(new Error('AbortError'));
        }
      }, 100);

      // Simulate work (in real implementation, call analyzer/matcher services)
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 2000); // 2 second job
    });
  }

  /**
   * Get scheduler stats
   */
  public getStats(): {
    isRunning: boolean;
    activityStats: any;
    workerStats: any;
  } {
    return {
      isRunning: this.isRunning,
      activityStats: this.activityTracker.getStats(),
      workerStats: this.workerPool.getStats()
    };
  }

  /**
   * Queue a user for analysis (called when profile updates)
   */
  public async queueUserForAnalysis(userId: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<string> {
    try {
      const { data, error } = await this.db.getClient()
        .from('eros_analysis_queue')
        .insert({
          user_id: userId,
          status: AnalysisStatus.PENDING,
          priority,
          queued_at: new Date(),
          attempt_count: 0,
          max_attempts: 3
        })
        .select('id');

      if (error) {
        throw error;
      }

      const jobId = data?.[0]?.id;
      this.logger.debug('User queued for analysis', { userId, priority, jobId });

      return jobId;
    } catch (error) {
      this.logger.error('Error queueing user', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
let instance: AdaptiveScheduler | null = null;

export function initScheduler(
  activityTracker: ActivityTracker,
  workerPool: HaltingWorkerPool,
  db: DatabaseClient,
  config?: Partial<SchedulerConfig>
): AdaptiveScheduler {
  instance = new AdaptiveScheduler(activityTracker, workerPool, db, config);
  return instance;
}

export function getScheduler(): AdaptiveScheduler {
  if (!instance) {
    throw new Error('AdaptiveScheduler not initialized. Call initScheduler first.');
  }
  return instance;
}
