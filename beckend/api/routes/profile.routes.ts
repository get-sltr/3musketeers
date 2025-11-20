import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Logger } from 'winston';
import { createLogger } from '../../shared/utils/logger';
import { DatabaseClient } from '../../shared/database/client';
import { CacheManager } from '../../shared/services/cache-manager';
import { AdaptiveScheduler } from '../../services/scheduler/src/adaptive-scheduler';

export interface ProfileUpdateRequest {
  name?: string;
  bio?: string;
  photos?: string[];
  age?: number;
  location?: { latitude: number; longitude: number; city: string; country: string };
  interests?: string[];
  preferences?: any;
}

export class ProfileRoutes {
  private logger: Logger;
  private db: DatabaseClient;
  private cache: CacheManager;
  private scheduler: AdaptiveScheduler;

  constructor(db: DatabaseClient, cache: CacheManager, scheduler: AdaptiveScheduler) {
    this.logger = createLogger('ProfileRoutes');
    this.db = db;
    this.cache = cache;
    this.scheduler = scheduler;
  }

  public registerRoutes(fastify: FastifyInstance, prefix: string): void {
    // Get current user profile
    fastify.get(`${prefix}/users/profile`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getCurrentProfile(request, reply);
    });

    // Update current user profile
    fastify.put(`${prefix}/users/profile`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.updateProfile(request, reply);
    });

    // Get other user profile
    fastify.get(`${prefix}/users/:userId/profile`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getOtherProfile(request, reply);
    });

    this.logger.info('Profile routes registered');
  }

  private async getCurrentProfile(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;

      // Try cache first
      const cached = await this.cache.getProfile(userId);
      if (cached) {
        this.logger.debug('Profile cache hit', { userId });
        return { success: true, profile: cached };
      }

      // Get from database
      const { data: profile, error } = await this.db.getClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        reply.code(404);
        return { success: false, error: 'Profile not found' };
      }

      // Cache it
      await this.cache.setProfile(userId, profile);

      return { success: true, profile };
    } catch (error) {
      this.logger.error('Get profile error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, error: 'Failed to fetch profile' };
    }
  }

  private async updateProfile(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const updates = request.body as ProfileUpdateRequest;

      // Update database
      const { data: profile, error } = await this.db.getClient()
        .from('users')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.logger.error('Profile update error', { userId, error: error.message });
        reply.code(500);
        return { success: false, error: 'Failed to update profile' };
      }

      // Invalidate cache
      await this.cache.invalidateKey(`profile:${userId}`);

      // Queue user for analysis (to reprocess with new data)
      try {
        await this.scheduler.queueUserForAnalysis(userId, 'high');
      } catch (e) {
        this.logger.warn('Failed to queue user for analysis', { userId });
      }

      this.logger.info('Profile updated', { userId });

      return { success: true, profile, message: 'Profile updated successfully' };
    } catch (error) {
      this.logger.error('Update profile error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  private async getOtherProfile(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const targetUserId = (request.params as any).userId;

      if (!targetUserId) {
        reply.code(400);
        return { success: false, error: 'User ID is required' };
      }

      // Try cache
      const cached = await this.cache.getProfile(targetUserId);
      if (cached) {
        return { success: true, profile: cached };
      }

      // Get from database (only public fields)
      const { data: profile, error } = await this.db.getClient()
        .from('users')
        .select('id, name, age, bio, photos, location, interests, created_at')
        .eq('id', targetUserId)
        .single();

      if (error || !profile) {
        reply.code(404);
        return { success: false, error: 'Profile not found' };
      }

      // Cache it
      await this.cache.setProfile(targetUserId, profile, 3600); // 1 hour for public profiles

      return { success: true, profile };
    } catch (error) {
      this.logger.error('Get other profile error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, error: 'Failed to fetch profile' };
    }
  }
}
