export interface JobStatus {
  id: string;
  state: string;
  progress?: number;
  returnvalue?: any;
  failedReason?: string;
}

export class BackgroundWorkerService {
  private static instance: BackgroundWorkerService;
  private tasks: Map<string, any> = new Map();

  public static getInstance(): BackgroundWorkerService {
    if (!BackgroundWorkerService.instance) {
      BackgroundWorkerService.instance = new BackgroundWorkerService();
    }
    return BackgroundWorkerService.instance;
  }

  async addTask(type: string, tenant: string, data: any): Promise<string> {
    const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.tasks.set(taskId, { type, tenant, data, state: 'pending', createdAt: new Date() });
    
    // Process in background
    setImmediate(() => {
      this.processTask(taskId, type, tenant, data).catch(console.error);
    });
    
    return taskId;
  }

  private async processTask(taskId: string, type: string, tenant: string, data: any): Promise<void> {
    try {
      this.tasks.set(taskId, { ...this.tasks.get(taskId), state: 'processing' });
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.tasks.set(taskId, { 
        ...this.tasks.get(taskId), 
        state: 'completed', 
        completedAt: new Date(),
        returnvalue: { success: true, message: `${type} completed for ${tenant}` }
      });
    } catch (error: any) {
      this.tasks.set(taskId, { 
        ...this.tasks.get(taskId), 
        state: 'failed', 
        failedReason: error.message 
      });
    }
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const task = this.tasks.get(jobId);
    if (!task) return null;
    
    return {
      id: jobId,
      state: task.state,
      progress: task.state === 'processing' ? 50 : 100,
      returnvalue: task.returnvalue,
      failedReason: task.failedReason
    };
  }
}

export default BackgroundWorkerService;
