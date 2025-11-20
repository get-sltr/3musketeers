/**
 * Data Gatherer
 * Collects user behavioral data from database
 *
 * @module services/analyzer
 */

import { Logger } from 'winston';
import { DatabaseClient } from '../../shared/database/client';
import { AnalysisError } from '../../shared/types/eros.types';

export interface UserData {
  userId: string;
  profile: any;
  favorites: any[];
  favoritedProfiles: any[];
  blocks: any[];
  blockedProfiles: any[];
  messages: any[];
  messageThreads: any[];
  activityLog: any[];
  profileViews: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  conversationsStarted: number;
  messagesReceived: number;
  mutualFavorites: number;
  reportedCount: number;
  daysActiveLastWeek: number;
}

export class DataGatherer {
  constructor(
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  /**
   * Gather all behavioral data for a user
   */
  public async gatherUserData(userId: string): Promise<UserData | null> {
    this.logger.debug('Gathering user data', { userId });

    try {
      // Parallel data fetching for performance
      const [
        profile,
        favorites,
        blocks,
        messages,
        activityMetrics
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserFavorites(userId),
        this.getUserBlocks(userId),
        this.getUserMessages(userId),
        this.getActivityMetrics(userId)
      ]);

      if (!profile) {
        this.logger.warn('User profile not found', { userId });
        return null;
      }

      // Fetch profiles of favorited users
      const favoritedProfiles = await this.getProfiles(
        favorites.map(f => f.favorited_user_id)
      );

      // Fetch profiles of blocked users
      const blockedProfiles = await this.getProfiles(
        blocks.map(b => b.blocked_user_id)
      );

      // Group messages into threads
      const messageThreads = this.groupMessagesIntoThreads(messages);

      return {
        userId,
        profile,
        favorites,
        favoritedProfiles,
        blocks,
        blockedProfiles,
        messages,
        messageThreads,
        activityLog: [], // Populated from activity tracking if available
        ...activityMetrics
      };

    } catch (error) {
      this.logger.error('Failed to gather user data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new AnalysisError(`Failed to gather data for user ${userId}`, {
        originalError: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string) {
    const { data, error } = await this.db.getClient()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return data;
  }

  /**
   * Get user's favorited profiles
   */
  private async getUserFavorites(userId: string) {
    const { data, error } = await this.db.getClient()
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's blocked profiles
   */
  private async getUserBlocks(userId: string) {
    const { data, error } = await this.db.getClient()
      .from('blocks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's messages
   */
  private async getUserMessages(userId: string) {
    const { data, error } = await this.db.getClient()
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(500); // Last 500 messages

    if (error) throw error;
    return data || [];
  }

  /**
   * Get activity metrics
   */
  private async getActivityMetrics(userId: string) {
    // These queries can be optimized with materialized views in production
    const client = this.db.getClient();

    // Count sent messages
    const { count: sentCount } = await client
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', userId);

    // Count received messages
    const { count: receivedCount } = await client
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId);

    // Count profile views (if tracked)
    const { count: viewCount } = await client
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('viewer_id', userId);

    // Count conversations started
    const { data: conversationsData } = await client
      .from('messages')
      .select('receiver_id')
      .eq('sender_id', userId)
      .order('created_at', { ascending: true });

    const uniqueConversations = new Set(
      conversationsData?.map(m => m.receiver_id) || []
    ).size;

    // Count mutual favorites
    const { data: mutualData } = await client
      .from('favorites')
      .select('favorited_user_id')
      .eq('user_id', userId);

    const favoritedIds = mutualData?.map(f => f.favorited_user_id) || [];

    const { data: mutualFavs } = favoritedIds.length > 0 ? await client
      .from('favorites')
      .select('user_id')
      .in('user_id', favoritedIds)
      .eq('favorited_user_id', userId) : { data: [] };

    // Days active last week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: recentActivity } = await client
      .from('users')
      .select('last_active_at')
      .eq('id', userId)
      .single();

    const daysActive = recentActivity?.last_active_at
      ? Math.min(7, Math.floor((Date.now() - new Date(recentActivity.last_active_at).getTime()) / (24 * 60 * 60 * 1000)))
      : 0;

    // Reports against user
    const { count: reportCount } = await client
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('reported_user_id', userId);

    return {
      profileViews: viewCount || 0,
      totalMessagesSent: sentCount || 0,
      totalMessagesReceived: receivedCount || 0,
      conversationsStarted: uniqueConversations,
      messagesReceived: receivedCount || 0,
      mutualFavorites: mutualFavs?.length || 0,
      reportedCount: reportCount || 0,
      daysActiveLastWeek: 7 - daysActive
    };
  }

  /**
   * Get profiles by IDs
   */
  private async getProfiles(userIds: string[]) {
    if (userIds.length === 0) return [];

    const { data, error } = await this.db.getClient()
      .from('users')
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  }

  /**
   * Group messages into conversation threads
   */
  private groupMessagesIntoThreads(messages: any[]): any[] {
    const threads = new Map<string, any[]>();

    messages.forEach(message => {
      // Create thread key from sender/receiver pair (normalized)
      const participants = [message.sender_id, message.receiver_id].sort();
      const threadKey = participants.join('_');

      if (!threads.has(threadKey)) {
        threads.set(threadKey, []);
      }

      threads.get(threadKey)!.push(message);
    });

    return Array.from(threads.values()).map(threadMessages => ({
      participants: [threadMessages[0].sender_id, threadMessages[0].receiver_id],
      messages: threadMessages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
      messageCount: threadMessages.length,
      firstMessage: threadMessages[0],
      lastMessage: threadMessages[threadMessages.length - 1]
    }));
  }
}
