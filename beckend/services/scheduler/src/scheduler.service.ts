import { QueueManager } from './queue-manager';
import { WorkerPool } from './worker-pool';
import { JobExecutor } from './job-executor';
import {
  AnalysisPriority,
  AnalysisStatus,
  ErosAnalysisQueue
} from '../../../shared/types/eros.types';

export class SchedulerService {
  private queueManager: QueueManager;
  private workerPool: WorkerPool;
  private jobExecutor: JobExecutor;

  constructor() {
    this.queueManager = new QueueManager();
    this.workerPool = new WorkerPool();
    this.jobExecutor = new JobExecutor();
  }

  async start(): Promise<void> {
    console.log('Starting EROS Scheduler Service...');
    await this.workerPool.start();
    await this.processQueue();
  }

  async stop(): Promise<void> {
    console.log('Stopping EROS Scheduler Service...');
    await this.workerPool.stop();
  }

  async queueAnalysis(
    userId: string,
    priority: AnalysisPriority = AnalysisPriority.NORMAL
  ): Promise<string> {
    const jobId = await this.queueManager.enqueue(userId, priority);
    return jobId;
  }

  private async processQueue(): Promise<void> {
    setInterval(async () => {
      const availableWorkers = this.workerPool.getAvailableWorkerCount();

      if (availableWorkers > 0) {
        const jobs = await this.queueManager.getNextJobs(availableWorkers);

        for (const job of jobs) {
          await this.processJob(job);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private async processJob(job: ErosAnalysisQueue): Promise<void> {
    const worker = this.workerPool.acquireWorker();

    if (!worker) {
      return;
    }

    try {
      await this.queueManager.markAsProcessing(job.id, worker.id);
      await this.jobExecutor.execute(job);
      await this.queueManager.markAsCompleted(job.id);
    } catch (error) {
      await this.queueManager.markAsFailed(
        job.id,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      this.workerPool.releaseWorker(worker.id);
    }
  }
}
