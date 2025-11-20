import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ActivityTracker } from '../../shared/services/activity-tracker';
import { Logger } from 'winston';
import { createLogger } from '../../shared/utils/logger';

export interface HeartbeatRequest {
  userId: string;
  appActive: boolean;
  screenOn: boolean;
}

export interface HeartbeatResponse {
  success: boolean;
  idleTime: number; // milliseconds
  processingPhase: 'active' | 'phase1' | 'phase2' | 'phase3';
  timestamp: Date;
}

export interface ActivityStatusResponse {
  userId: string;
  lastInteraction: Date;
  idleTime: number;
  processingPhase: 'active' | 'phase1' | 'phase2' | 'phase3';
  sessionDuration: number;
}

export class ActivityRoutes {
  private logger: Logger;
  private activityTracker: ActivityTracker;

  constructor(activityTracker: ActivityTracker) {
    this.logger = createLogger('ActivityRoutes');
    this.activityTracker = activityTracker;
  }

  /**
   * Register activity routes
   */
  public registerRoutes(fastify: FastifyInstance, prefix: string): void {
    // Heartbeat endpoint - called every 30 seconds from client
    fastify.post(`${prefix}/heartbeat`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleHeartbeat(request, reply);
    });

    // Get activity status - check current idle time and phase
    fastify.get(`${prefix}/activity/status`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getActivityStatus(request, reply);
    });

    // Get queue stats for admin - see how many users in each phase
    fastify.get(`${prefix}/activity/stats`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getActivityStats(request, reply);
    });

    this.logger.info('Activity routes registered');
  }

  /**
   * Handle heartbeat - record user activity and return current phase
   */
  private async handleHeartbeat(request: FastifyRequest, reply: FastifyReply): Promise<HeartbeatResponse> {
    try {
      // Verify JWT auth
      if (!request.user) {
        reply.code(401);
        return {
          success: false,
          idleTime: 0,
          processingPhase: 'active',
          timestamp: new Date()
        };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const body = (request.body as HeartbeatRequest) || {};

      // Record the activity
      this.activityTracker.recordActivity(userId);

      // Get current idle time and phase
      const idleTime = this.activityTracker.getIdleTime(userId);
      const phase = this.activityTracker.getProcessingPhase(userId);

      this.logger.debug('Heartbeat recorded', {
        userId,
        idleTime,
        phase,
        appActive: body.appActive,
        screenOn: body.screenOn
      });

      return {
        success: true,
        idleTime,
        processingPhase: phase,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Heartbeat error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(500);
      return {
        success: false,
        idleTime: 0,
        processingPhase: 'active',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get current activity status for authenticated user
   */
  private async getActivityStatus(request: FastifyRequest, reply: FastifyReply): Promise<ActivityStatusResponse | { success: false; error: string }> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const activityInfo = this.activityTracker.getActivityInfo(userId);

      if (!activityInfo) {
        reply.code(404);
        return { success: false, error: 'No activity recorded for user' };
      }

      const sessionDuration = Date.now() - activityInfo.sessionStart.getTime();

      return {
        userId,
        lastInteraction: activityInfo.lastInteraction,
        idleTime: activityInfo.idleTime,
        processingPhase: this.activityTracker.getProcessingPhase(userId),
        sessionDuration
      };
    } catch (error) {
      this.logger.error('Activity status error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(500);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get activity stats - admin only
   */
  private async getActivityStats(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      // Optional: Check if user has admin role
      // For now, just return stats

      const stats = this.activityTracker.getStats();

      return {
        success: true,
        stats: {
          totalActiveUsers: stats.totalActive,
          phase1Users: stats.phase1Count,
          phase2Users: stats.phase2Count,
          phase3Users: stats.phase3Count,
          totalTrackedUsers: stats.totalActive + stats.phase1Count + stats.phase2Count + stats.phase3Count,
          timestamp: new Date(),
          description: {
            totalActiveUsers: 'Users currently active (idle < 10 min)',
            phase1Users: 'Users idle 10-30 minutes (5% CPU usage)',
            phase2Users: 'Users idle 30-60 minutes (15% CPU usage)',
            phase3Users: 'Users idle 60+ minutes (100% CPU usage, intensive matching)'
          }
        }
      };
    } catch (error) {
      this.logger.error('Activity stats error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(500);
      return { success: false, error: 'Internal server error' };
    }
  }
}
