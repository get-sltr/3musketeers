import { Logger } from 'winston';
import { createLogger } from '../utils/logger';
import { DatabaseClient } from '../database/client';

export interface UserActivity {
  userId: string;
  lastInteraction: Date;
  sessionStart: Date;
  idleTime: number; // milliseconds
}

export interface ActivityThreshold {
  phase1: number; // 10 minutes in ms = 600000
  phase2: number; // 30 minutes in ms = 1800000
  phase3: number; // 60 minutes in ms = 3600000
}

export class ActivityTracker {
  private activities: Map<string, UserActivity> = new Map();
  private logger: Logger;
  private db: DatabaseClient;
  private thresholds: ActivityThreshold;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(db: DatabaseClient, thresholds?: Partial<ActivityThreshold>) {
    this.logger = createLogger('ActivityTracker');
    this.db = db;
    this.thresholds = {
      phase1: 600000, // 10 minutes
      phase2: 1800000, // 30 minutes
      phase3: 3600000, // 60 minutes
      ...thresholds
    };

    // Cleanup stale activities every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupStaleActivities(), 5 * 60 * 1000);
  }

  /**
   * Record user activity (called on heartbeat)
   */
  public recordActivity(userId: string): UserActivity {
    const now = new Date();
    const existing = this.activities.get(userId);

    const activity: UserActivity = {
      userId,
      lastInteraction: now,
      sessionStart: existing?.sessionStart || now,
      idleTime: 0
    };

    this.activities.set(userId, activity);
    this.logger.debug('Activity recorded', { userId, timestamp: now });

    return activity;
  }

  /**
   * Get current idle time for a user (in milliseconds)
   */
  public getIdleTime(userId: string): number {
    const activity = this.activities.get(userId);
    if (!activity) return Infinity; // No activity recorded = very inactive

    const now = Date.now();
    const idle = now - activity.lastInteraction.getTime();

    return idle;
  }

  /**
   * Determine processing phase based on idle time
   */
  public getProcessingPhase(userId: string): 'active' | 'phase1' | 'phase2' | 'phase3' {
    const idleTime = this.getIdleTime(userId);

    if (idleTime < this.thresholds.phase1) {
      return 'active'; // Still active
    } else if (idleTime < this.thresholds.phase2) {
      return 'phase1'; // 10-30 minutes
    } else if (idleTime < this.thresholds.phase3) {
      return 'phase2'; // 30-60 minutes
    } else {
      return 'phase3'; // 60+ minutes
    }
  }

  /**
   * Get all users in a specific phase
   */
  public getUsersByPhase(phase: 'active' | 'phase1' | 'phase2' | 'phase3'): string[] {
    const result: string[] = [];

    for (const [userId, _] of this.activities) {
      if (this.getProcessingPhase(userId) === phase) {
        result.push(userId);
      }
    }

    return result;
  }

  /**
   * Check if user just became active (was inactive, now active)
   */
  public didUserBecomeActive(userId: string): boolean {
    const activity = this.activities.get(userId);
    if (!activity) return false;

    // If idle time is 0 (just recorded), user became active
    return (Date.now() - activity.lastInteraction.getTime()) < 1000;
  }

  /**
   * Get activity info for user
   */
  public getActivityInfo(userId: string): UserActivity | null {
    const activity = this.activities.get(userId);
    if (!activity) return null;

    const idleTime = this.getIdleTime(userId);
    const phase = this.getProcessingPhase(userId);

    this.logger.debug('Activity info', { userId, idleTime, phase });

    return {
      ...activity,
      idleTime
    };
  }

  /**
   * Remove user activity (logout)
   */
  public removeActivity(userId: string): void {
    this.activities.delete(userId);
    this.logger.debug('Activity removed', { userId });
  }

  /**
   * Get processing stats
   */
  public getStats(): {
    totalActive: number;
    phase1Count: number;
    phase2Count: number;
    phase3Count: number;
  } {
    let active = 0;
    let phase1 = 0;
    let phase2 = 0;
    let phase3 = 0;

    for (const userId of this.activities.keys()) {
      const phase = this.getProcessingPhase(userId);
      switch (phase) {
        case 'active':
          active++;
          break;
        case 'phase1':
          phase1++;
          break;
        case 'phase2':
          phase2++;
          break;
        case 'phase3':
          phase3++;
          break;
      }
    }

    return { totalActive: active, phase1Count: phase1, phase2Count: phase2, phase3Count: phase3 };
  }

  /**
   * Clean up stale activities (no heartbeat for > 2 hours)
   */
  private cleanupStaleActivities(): void {
    const now = Date.now();
    const maxIdleTime = 2 * 60 * 60 * 1000; // 2 hours

    let cleaned = 0;
    for (const [userId, activity] of this.activities) {
      const idleTime = now - activity.lastInteraction.getTime();
      if (idleTime > maxIdleTime) {
        this.activities.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('Cleaned stale activities', { count: cleaned });
    }
  }

  /**
   * Shutdown - clear intervals
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.activities.clear();
    this.logger.info('ActivityTracker shutdown');
  }
}

/**
 * Singleton instance
 */
let instance: ActivityTracker | null = null;

export function initActivityTracker(db: DatabaseClient, thresholds?: Partial<ActivityThreshold>): ActivityTracker {
  instance = new ActivityTracker(db, thresholds);
  return instance;
}

export function getActivityTracker(): ActivityTracker {
  if (!instance) {
    throw new Error('ActivityTracker not initialized. Call initActivityTracker first.');
  }
  return instance;
}
