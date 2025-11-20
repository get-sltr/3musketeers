import { createClient, RedisClientType } from 'redis';
import { Logger } from 'winston';
import { createLogger } from '../utils/logger';

export interface CacheConfig {
  url: string;
  ttl: {
    matches: number; // 24h = 86400
    recommendations: number; // 24h = 86400
    conversations: number; // 7d = 604800
    profiles: number; // 12h = 43200
  };
}

export class CacheManager {
  private client: RedisClientType;
  private logger: Logger;
  private config: CacheConfig;
  private isConnected: boolean = false;

  constructor(config: CacheConfig) {
    this.logger = createLogger('CacheManager');
    this.config = config;
    this.client = createClient({ url: config.url });

    // Handle connection events
    this.client.on('error', (err) => {
      this.logger.error('Redis error', { error: err.message });
    });

    this.client.on('connect', () => {
      this.logger.info('Redis connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      this.logger.warn('Redis disconnected');
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.info('CacheManager initialized');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    await this.client.quit();
    this.logger.info('CacheManager disconnected');
  }

  /**
   * Cache daily matches for a user
   */
  public async setDailyMatches(userId: string, matches: any[], ttl?: number): Promise<void> {
    try {
      const key = `matches:daily:${userId}`;
      const ttlSeconds = ttl || this.config.ttl.matches;

      await this.client.setEx(key, ttlSeconds, JSON.stringify(matches));
      this.logger.debug('Daily matches cached', { userId, count: matches.length, ttl: ttlSeconds });
    } catch (error) {
      this.logger.error('Error caching daily matches', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get cached daily matches for a user
   */
  public async getDailyMatches(userId: string): Promise<any[] | null> {
    try {
      const key = `matches:daily:${userId}`;
      const cached = await this.client.get(key);

      if (cached) {
        this.logger.debug('Daily matches cache hit', { userId });
        return JSON.parse(cached);
      }

      this.logger.debug('Daily matches cache miss', { userId });
      return null;
    } catch (error) {
      this.logger.error('Error retrieving daily matches', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Cache recommendations for a user
   */
  public async setRecommendations(userId: string, recommendations: any[], ttl?: number): Promise<void> {
    try {
      const key = `recommendations:${userId}`;
      const ttlSeconds = ttl || this.config.ttl.recommendations;

      await this.client.setEx(key, ttlSeconds, JSON.stringify(recommendations));
      this.logger.debug('Recommendations cached', { userId, count: recommendations.length });
    } catch (error) {
      this.logger.error('Error caching recommendations', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get cached recommendations
   */
  public async getRecommendations(userId: string): Promise<any[] | null> {
    try {
      const key = `recommendations:${userId}`;
      const cached = await this.client.get(key);

      if (cached) {
        this.logger.debug('Recommendations cache hit', { userId });
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      this.logger.error('Error retrieving recommendations', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Cache user profile
   */
  public async setProfile(userId: string, profile: any, ttl?: number): Promise<void> {
    try {
      const key = `profile:${userId}`;
      const ttlSeconds = ttl || this.config.ttl.profiles;

      await this.client.setEx(key, ttlSeconds, JSON.stringify(profile));
      this.logger.debug('Profile cached', { userId });
    } catch (error) {
      this.logger.error('Error caching profile', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get cached profile
   */
  public async getProfile(userId: string): Promise<any | null> {
    try {
      const key = `profile:${userId}`;
      const cached = await this.client.get(key);

      if (cached) {
        this.logger.debug('Profile cache hit', { userId });
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      this.logger.error('Error retrieving profile', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Cache conversation history
   */
  public async setConversation(userId: string, conversationId: string, messages: any[], ttl?: number): Promise<void> {
    try {
      const key = `conversation:${userId}:${conversationId}`;
      const ttlSeconds = ttl || this.config.ttl.conversations;

      await this.client.setEx(key, ttlSeconds, JSON.stringify(messages));
      this.logger.debug('Conversation cached', { userId, conversationId });
    } catch (error) {
      this.logger.error('Error caching conversation', {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get cached conversation
   */
  public async getConversation(userId: string, conversationId: string): Promise<any[] | null> {
    try {
      const key = `conversation:${userId}:${conversationId}`;
      const cached = await this.client.get(key);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      this.logger.error('Error retrieving conversation', {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Invalidate cache for a user
   */
  public async invalidateUserCache(userId: string): Promise<void> {
    try {
      const pattern = `*:${userId}*`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.debug('User cache invalidated', { userId, count: keys.length });
      }
    } catch (error) {
      this.logger.error('Error invalidating user cache', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Invalidate specific cache key
   */
  public async invalidateKey(key: string): Promise<void> {
    try {
      await this.client.del(key);
      this.logger.debug('Cache key invalidated', { key });
    } catch (error) {
      this.logger.error('Error invalidating cache key', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get cache stats
   */
  public async getStats(): Promise<{
    connected: boolean;
    memoryUsage: number;
    keysCount: number;
  }> {
    try {
      const info = await this.client.info('memory');
      const keysInfo = await this.client.info('keyspace');

      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      const keysMatch = keysInfo.match(/keys=(\d+)/);
      const keys = keysMatch ? parseInt(keysMatch[1]) : 0;

      return {
        connected: this.isConnected,
        memoryUsage: memory,
        keysCount: keys
      };
    } catch (error) {
      this.logger.error('Error getting cache stats', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        connected: this.isConnected,
        memoryUsage: 0,
        keysCount: 0
      };
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      await this.client.ping();
      return { healthy: true, message: 'Redis connection healthy' };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Singleton instance
 */
let instance: CacheManager | null = null;

export async function initCacheManager(config: CacheConfig): Promise<CacheManager> {
  instance = new CacheManager(config);
  await instance.connect();
  return instance;
}

export function getCacheManager(): CacheManager {
  if (!instance) {
    throw new Error('CacheManager not initialized. Call initCacheManager first.');
  }
  return instance;
}
