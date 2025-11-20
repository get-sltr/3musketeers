import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Logger } from 'winston';
import { createLogger } from '../../shared/utils/logger';
import { DatabaseClient } from '../../shared/database/client';
import { ActivityTracker } from '../../shared/services/activity-tracker';
import { CacheManager } from '../../shared/services/cache-manager';
import { HaltingWorkerPool } from '../../services/scheduler/src/halting-worker-pool';
import { AdaptiveScheduler } from '../../services/scheduler/src/adaptive-scheduler';

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    activityTracker: ComponentHealth;
    workerPool: ComponentHealth;
    scheduler: ComponentHealth;
  };
  metrics: {
    activeUsers: number;
    phase1Users: number;
    phase2Users: number;
    phase3Users: number;
    activeWorkers: number;
    cpuUsage: number;
    cacheMemoryMB: number;
  };
}

export interface ComponentHealth {
  healthy: boolean;
  message: string;
  responseTime: number; // ms
}

export class HealthRoutes {
  private logger: Logger;
  private db: DatabaseClient;
  private activityTracker: ActivityTracker;
  private cache: CacheManager;
  private workerPool: HaltingWorkerPool;
  private scheduler: AdaptiveScheduler;

  constructor(
    db: DatabaseClient,
    activityTracker: ActivityTracker,
    cache: CacheManager,
    workerPool: HaltingWorkerPool,
    scheduler: AdaptiveScheduler
  ) {
    this.logger = createLogger('HealthRoutes');
    this.db = db;
    this.activityTracker = activityTracker;
    this.cache = cache;
    this.workerPool = workerPool;
    this.scheduler = scheduler;
  }

  /**
   * Register health check routes
   */
  public registerRoutes(fastify: FastifyInstance, prefix: string): void {
    // Main health check
    fastify.get(`${prefix}/health`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getHealth(request, reply);
    });

    // Detailed health check (admin)
    fastify.get(`${prefix}/health/detailed`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getDetailedHealth(request, reply);
    });

    // Quick status check (lightweight)
    fastify.get(`${prefix}/health/quick`, async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date()
      };
    });

    this.logger.info('Health check routes registered');
  }

  /**
   * Get overall health status
   */
  private async getHealth(request: FastifyRequest, reply: FastifyReply): Promise<HealthResponse> {
    try {
      const startTime = Date.now();
      const components = await this.checkAllComponents();
      const metrics = this.collectMetrics();

      // Determine overall status
      const allHealthy = Object.values(components).every(c => c.healthy);
      const status = allHealthy ? 'healthy' : 'degraded';

      return {
        status,
        timestamp: new Date(),
        uptime: process.uptime(),
        components,
        metrics
      };
    } catch (error) {
      this.logger.error('Health check error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(503); // Service Unavailable
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        components: {
          database: { healthy: false, message: 'Unknown', responseTime: 0 },
          cache: { healthy: false, message: 'Unknown', responseTime: 0 },
          activityTracker: { healthy: false, message: 'Unknown', responseTime: 0 },
          workerPool: { healthy: false, message: 'Unknown', responseTime: 0 },
          scheduler: { healthy: false, message: 'Unknown', responseTime: 0 }
        },
        metrics: {
          activeUsers: 0,
          phase1Users: 0,
          phase2Users: 0,
          phase3Users: 0,
          activeWorkers: 0,
          cpuUsage: 0,
          cacheMemoryMB: 0
        }
      };
    }
  }

  /**
   * Get detailed health information (more checks)
   */
  private async getDetailedHealth(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const components = await this.checkAllComponents();
      const metrics = this.collectMetrics();
      const cacheStats = await this.cache.getStats();

      return {
        status: Object.values(components).every(c => c.healthy) ? 'healthy' : 'degraded',
        timestamp: new Date(),
        uptime: process.uptime(),
        components,
        metrics,
        cache: {
          connected: cacheStats.connected,
          memoryUsageMB: Math.round(cacheStats.memoryUsage / 1024 / 1024),
          keysStored: cacheStats.keysCount
        },
        scheduler: this.scheduler.getStats()
      };
    } catch (error) {
      this.logger.error('Detailed health check error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(503);
      return { status: 'unhealthy', error: 'Failed to retrieve health details' };
    }
  }

  /**
   * Check all components
   */
  private async checkAllComponents(): Promise<{
    database: ComponentHealth;
    cache: ComponentHealth;
    activityTracker: ComponentHealth;
    workerPool: ComponentHealth;
    scheduler: ComponentHealth;
  }> {
    // Run all checks in parallel
    const [dbHealth, cacheHealth, activityHealth, workerHealth, schedulerHealth] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkActivityTracker(),
      this.checkWorkerPool(),
      this.checkScheduler()
    ]);

    return {
      database: this.resolvePromise(dbHealth, 'Database'),
      cache: this.resolvePromise(cacheHealth, 'Cache'),
      activityTracker: this.resolvePromise(activityHealth, 'Activity Tracker'),
      workerPool: this.resolvePromise(workerHealth, 'Worker Pool'),
      scheduler: this.resolvePromise(schedulerHealth, 'Scheduler')
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
      await this.db.healthCheck();
      return {
        healthy: true,
        message: 'Database connection healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCache(): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
      const health = await this.cache.healthCheck();
      return {
        healthy: health.healthy,
        message: health.message,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check activity tracker health
   */
  private async checkActivityTracker(): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
      const stats = this.activityTracker.getStats();
      const healthy = stats.totalActive + stats.phase1Count + stats.phase2Count + stats.phase3Count >= 0;

      return {
        healthy,
        message: `${stats.totalActive + stats.phase1Count + stats.phase2Count + stats.phase3Count} users tracked`,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check worker pool health
   */
  private async checkWorkerPool(): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
      const stats = this.workerPool.getStats();
      const healthy = stats.activeWorkers <= stats.maxWorkers && stats.cpuUsage <= 100;

      return {
        healthy,
        message: `${stats.activeWorkers}/${stats.maxWorkers} workers active, ${stats.cpuUsage}% CPU`,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check scheduler health
   */
  private async checkScheduler(): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
      const stats = this.scheduler.getStats();
      return {
        healthy: stats.isRunning,
        message: stats.isRunning ? 'Scheduler running' : 'Scheduler not running',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Collect metrics
   */
  private collectMetrics(): {
    activeUsers: number;
    phase1Users: number;
    phase2Users: number;
    phase3Users: number;
    activeWorkers: number;
    cpuUsage: number;
    cacheMemoryMB: number;
  } {
    const activityStats = this.activityTracker.getStats();
    const workerStats = this.workerPool.getStats();

    return {
      activeUsers: activityStats.totalActive,
      phase1Users: activityStats.phase1Count,
      phase2Users: activityStats.phase2Count,
      phase3Users: activityStats.phase3Count,
      activeWorkers: workerStats.activeWorkers,
      cpuUsage: workerStats.cpuUsage,
      cacheMemoryMB: 0 // Will be populated in detailed check
    };
  }

  /**
   * Resolve PromiseSettledResult to ComponentHealth
   */
  private resolvePromise(result: PromiseSettledResult<ComponentHealth>, componentName: string): ComponentHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        healthy: false,
        message: `${componentName} check failed: ${result.reason}`,
        responseTime: 0
      };
    }
  }
}
