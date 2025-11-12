// EROS Battery-Efficient Scheduler
// Runs analysis when device is idle, charging, or has good battery

export interface EROSSchedulerConfig {
  minBatteryLevel: number;  // Don't run below this % (default: 20%)
  preferCharging: boolean;   // Prefer when charging (default: true)
  maxConcurrentAnalyses: number;  // Limit parallel requests (default: 1)
  throttleDelay: number;     // Min ms between analyses (default: 5000)
  useIdleDetection: boolean; // Only run when user idle (default: true)
}

const DEFAULT_CONFIG: EROSSchedulerConfig = {
  minBatteryLevel: 20,
  preferCharging: true,
  maxConcurrentAnalyses: 1,
  throttleDelay: 5000,  // 5 seconds
  useIdleDetection: true
};

class EROSScheduler {
  private config: EROSSchedulerConfig;
  private analysisQueue: Array<() => Promise<any>> = [];
  private isProcessing: boolean = false;
  private lastAnalysisTime: number = 0;
  private activeAnalyses: number = 0;

  constructor(config: Partial<EROSSchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if conditions are good for EROS analysis
   */
  private async canRunAnalysis(): Promise<{ allowed: boolean; reason?: string }> {
    // Check battery level (if Battery API available)
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();

        // Battery too low
        if (battery.level * 100 < this.config.minBatteryLevel) {
          return {
            allowed: false,
            reason: `Battery too low (${Math.floor(battery.level * 100)}% < ${this.config.minBatteryLevel}%)`
          };
        }

        // Prefer charging if enabled
        if (this.config.preferCharging && !battery.charging) {
          // Still allow if battery is high
          if (battery.level < 0.5) {  // Less than 50%
            return {
              allowed: false,
              reason: `Device not charging and battery < 50%`
            };
          }
        }
      } catch (e) {
        // Battery API not available - allow analysis
        console.log('Battery API not available, proceeding with analysis');
      }
    }

    // Check if too many concurrent analyses
    if (this.activeAnalyses >= this.config.maxConcurrentAnalyses) {
      return {
        allowed: false,
        reason: `Too many concurrent analyses (${this.activeAnalyses}/${this.config.maxConcurrentAnalyses})`
      };
    }

    // Check throttle delay
    const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime;
    if (timeSinceLastAnalysis < this.config.throttleDelay) {
      return {
        allowed: false,
        reason: `Throttled (${timeSinceLastAnalysis}ms < ${this.config.throttleDelay}ms)`
      };
    }

    // Check if user is idle (if Idle Detection API available)
    if (this.config.useIdleDetection && 'requestIdleCallback' in window) {
      // User is active, defer analysis
      const isIdle = await this.checkUserIdle();
      if (!isIdle) {
        return {
          allowed: false,
          reason: 'User is active, deferring to idle time'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user is idle using Idle Detection API
   */
  private async checkUserIdle(): Promise<boolean> {
    return new Promise((resolve) => {
      // If user hasn't interacted in 2 seconds, consider idle
      let lastInteraction = Date.now();

      const updateLastInteraction = () => {
        lastInteraction = Date.now();
      };

      // Listen for user interactions
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach(event => {
        document.addEventListener(event, updateLastInteraction, { once: true, passive: true });
      });

      // Check after 2 seconds
      setTimeout(() => {
        const timeSinceInteraction = Date.now() - lastInteraction;
        const isIdle = timeSinceInteraction >= 2000;  // 2 seconds

        // Cleanup
        events.forEach(event => {
          document.removeEventListener(event, updateLastInteraction);
        });

        resolve(isIdle);
      }, 2000);
    });
  }

  /**
   * Schedule EROS analysis with battery awareness
   */
  async scheduleAnalysis<T>(
    analysisFunc: () => Promise<T>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedAnalysis = async () => {
        try {
          this.activeAnalyses++;
          this.lastAnalysisTime = Date.now();

          const result = await analysisFunc();

          this.activeAnalyses--;
          resolve(result);
        } catch (error) {
          this.activeAnalyses--;
          reject(error);
        }
      };

      // Add to queue based on priority
      if (priority === 'high') {
        this.analysisQueue.unshift(queuedAnalysis);
      } else {
        this.analysisQueue.push(queuedAnalysis);
      }

      // Start processing queue
      this.processQueue();
    });
  }

  /**
   * Process queued analyses when conditions are good
   */
  private async processQueue() {
    if (this.isProcessing || this.analysisQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.analysisQueue.length > 0) {
      // Check if we can run analysis
      const { allowed, reason } = await this.canRunAnalysis();

      if (!allowed) {
        console.log(`⚡ EROS deferred: ${reason}`);

        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5s
        continue;
      }

      // Run next analysis
      const analysis = this.analysisQueue.shift();
      if (analysis) {
        await analysis();
      }

      // Small delay between analyses
      await new Promise(resolve => setTimeout(resolve, 1000));  // 1s gap
    }

    this.isProcessing = false;
  }

  /**
   * Run analysis immediately (bypass queue) - use sparingly!
   */
  async runImmediately<T>(analysisFunc: () => Promise<T>): Promise<T> {
    const { allowed, reason } = await this.canRunAnalysis();

    if (!allowed) {
      console.warn(`⚡ EROS forced run despite: ${reason}`);
    }

    this.activeAnalyses++;
    this.lastAnalysisTime = Date.now();

    try {
      const result = await analysisFunc();
      this.activeAnalyses--;
      return result;
    } catch (error) {
      this.activeAnalyses--;
      throw error;
    }
  }

  /**
   * Get current battery status
   */
  async getBatteryStatus(): Promise<{
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  } | null> {
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        return {
          level: Math.floor(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EROSSchedulerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear analysis queue
   */
  clearQueue() {
    this.analysisQueue = [];
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queued: this.analysisQueue.length,
      active: this.activeAnalyses,
      processing: this.isProcessing,
      lastAnalysis: this.lastAnalysisTime
    };
  }
}

// Singleton instance
export const erosScheduler = new EROSScheduler();

// Export factory for custom instances
export function createEROSScheduler(config?: Partial<EROSSchedulerConfig>) {
  return new EROSScheduler(config);
}
