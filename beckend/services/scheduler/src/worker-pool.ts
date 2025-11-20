export interface Worker {
  id: string;
  status: 'idle' | 'busy';
  currentJobId?: string;
  startedAt?: Date;
}

export class WorkerPool {
  private workers: Map<string, Worker> = new Map();
  private maxWorkers: number;

  constructor(maxWorkers: number = 5) {
    this.maxWorkers = maxWorkers;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const workerId = `worker_${i}`;
      this.workers.set(workerId, {
        id: workerId,
        status: 'idle'
      });
    }
  }

  async start(): Promise<void> {
    console.log(`Worker pool started with ${this.maxWorkers} workers`);
  }

  async stop(): Promise<void> {
    // Wait for all workers to finish current jobs
    const busyWorkers = Array.from(this.workers.values()).filter(w => w.status === 'busy');

    if (busyWorkers.length > 0) {
      console.log(`Waiting for ${busyWorkers.length} workers to finish...`);
      // TODO: Implement graceful shutdown with timeout
    }
  }

  acquireWorker(): Worker | null {
    const idleWorker = Array.from(this.workers.values()).find(w => w.status === 'idle');

    if (idleWorker) {
      idleWorker.status = 'busy';
      idleWorker.startedAt = new Date();
      return idleWorker;
    }

    return null;
  }

  releaseWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = 'idle';
      worker.currentJobId = undefined;
      worker.startedAt = undefined;
    }
  }

  getAvailableWorkerCount(): number {
    return Array.from(this.workers.values()).filter(w => w.status === 'idle').length;
  }

  getWorkerStatus(): Worker[] {
    return Array.from(this.workers.values());
  }
}
