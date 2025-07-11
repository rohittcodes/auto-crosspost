import { CrossPostQueue, QueueJob, QueueJobData } from '../../src/core/queue.js';
import { createMockPost } from '../test-utils.js';

describe('CrossPostQueue', () => {
  let queue: CrossPostQueue;

  beforeEach(() => {
    queue = new CrossPostQueue({
      concurrency: 2
    });
  });

  afterEach(() => {
    queue.stop();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultQueue = new CrossPostQueue();
      expect(defaultQueue).toBeInstanceOf(CrossPostQueue);
    });

    it('should initialize with custom options', () => {
      const customQueue = new CrossPostQueue({
        concurrency: 5
      });
      expect(customQueue).toBeInstanceOf(CrossPostQueue);
    });
  });

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      const post = createMockPost();
      const jobData: QueueJobData = {
        type: 'crosspost',
        post,
        maxAttempts: 3
      };
      
      const jobId = await queue.addJob(jobData);

      expect(typeof jobId).toBe('string');
      expect(jobId).toHaveLength(36); // UUID length
    });

    it('should queue multiple jobs', async () => {
      const post1 = createMockPost({ title: 'Post 1' });
      const post2 = createMockPost({ title: 'Post 2' });
      
      const jobData1: QueueJobData = { type: 'crosspost', post: post1 };
      const jobData2: QueueJobData = { type: 'crosspost', post: post2 };
      
      const jobId1 = await queue.addJob(jobData1);
      const jobId2 = await queue.addJob(jobData2);

      expect(jobId1).not.toBe(jobId2);
    });
  });

  describe('job processing', () => {
    it('should process jobs and emit events', (done) => {
      const post = createMockPost();
      const jobData: QueueJobData = { type: 'crosspost', post };
      let jobStarted = false;

      queue.on('job:started', (job: QueueJob) => {
        expect(job.data.post).toEqual(post);
        expect(job.status).toBe('processing');
        jobStarted = true;
      });

      queue.on('job:completed', () => {
        expect(jobStarted).toBe(true);
        done();
      });

      // Adding a job automatically starts processing
      queue.addJob(jobData);
    });

    it('should handle job failures and retry', (done) => {
      const post = createMockPost();
      const jobData: QueueJobData = { type: 'crosspost', post, maxAttempts: 3 };
      let attemptCount = 0;
      let jobFailed = false;

      // Mock a job that fails twice then succeeds
      const originalProcessor = (queue as any).processJob;
      (queue as any).processJob = async (job: QueueJob) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Simulated failure');
        }
        return originalProcessor?.call(queue, job);
      };

      queue.on('job:retry', (job: QueueJob, error: Error) => {
        expect(error.message).toBe('Simulated failure');
        expect(job.attempts).toBeGreaterThan(0);
      });

      queue.on('job:failed', () => {
        // This should not be called since we succeed on 3rd attempt
        jobFailed = true;
      });

      queue.on('job:completed', () => {
        expect(jobFailed).toBe(false);
        expect(attemptCount).toBe(3);
        done();
      });

      queue.addJob(jobData);
    });

    it('should fail job after max retry attempts', (done) => {
      const post = createMockPost();
      const jobData: QueueJobData = { type: 'crosspost', post, maxAttempts: 2 };

      // Mock a job that always fails
      (queue as any).processJob = async () => {
        throw new Error('Persistent failure');
      };

      queue.on('job:failed', (job: QueueJob, error: Error) => {
        expect(error.message).toBe('Persistent failure');
        expect(job.status).toBe('failed');
        expect(job.attempts).toBe(2); // maxAttempts
        done();
      });

      queue.addJob(jobData);
    });
  });

  describe('queue management', () => {
    it('should start processing automatically and stop when requested', () => {
      expect(queue.getStatus().processing).toBe(false);
      
      // Adding a job starts processing automatically
      const jobData: QueueJobData = { type: 'crosspost', post: createMockPost() };
      queue.addJob(jobData);
      
      expect(queue.getStatus().processing).toBe(true);
      
      queue.stop();
      expect(queue.getStatus().processing).toBe(false);
    });

    it('should clear all jobs', async () => {
      const post1 = createMockPost({ title: 'Post 1' });
      const post2 = createMockPost({ title: 'Post 2' });
      
      const jobData1: QueueJobData = { type: 'crosspost', post: post1 };
      const jobData2: QueueJobData = { type: 'crosspost', post: post2 };
      
      await queue.addJob(jobData1);
      await queue.addJob(jobData2);
      
      expect(queue.getStatus().totalJobs).toBe(2);
      
      queue.clear();
      expect(queue.getStatus().totalJobs).toBe(0);
    });
  });

  describe('job status tracking', () => {
    it('should track job status correctly', async () => {
      const post = createMockPost();
      const jobData: QueueJobData = { type: 'crosspost', post };
      
      const jobId = await queue.addJob(jobData);
      
      const job = queue.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe('pending');
      expect(job?.id).toBe(jobId);
    });

    it('should provide queue statistics', async () => {
      const post1 = createMockPost({ title: 'Post 1' });
      const post2 = createMockPost({ title: 'Post 2' });
      
      const jobData1: QueueJobData = { type: 'crosspost', post: post1 };
      const jobData2: QueueJobData = { type: 'crosspost', post: post2 };
      
      await queue.addJob(jobData1);
      await queue.addJob(jobData2);
      
      const status = queue.getStatus();
      expect(status.totalJobs).toBe(2);
      expect(status.pendingJobs).toBe(2);
      expect(status.processingJobs).toBe(0);
    });
  });

  describe('concurrency control', () => {
    it('should respect concurrency limits', (done) => {
      const concurrencyQueue = new CrossPostQueue({ concurrency: 1 });
      let activeJobs = 0;
      let maxActiveJobs = 0;

      const originalProcessor = (concurrencyQueue as any).processJob;
      (concurrencyQueue as any).processJob = async (job: QueueJob) => {
        activeJobs++;
        maxActiveJobs = Math.max(maxActiveJobs, activeJobs);
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 50));
        
        activeJobs--;
        return originalProcessor?.call(concurrencyQueue, job);
      };

      concurrencyQueue.on('job:completed', () => {
        const status = concurrencyQueue.getStatus();
        if (status.totalJobs >= 3 && status.processingJobs === 0) {
          expect(maxActiveJobs).toBe(1); // Should never exceed concurrency limit
          concurrencyQueue.stop();
          done();
        }
      });

      // Add multiple jobs - processing starts automatically
      const jobData1: QueueJobData = { type: 'crosspost', post: createMockPost({ title: 'Post 1' }) };
      const jobData2: QueueJobData = { type: 'crosspost', post: createMockPost({ title: 'Post 2' }) };
      const jobData3: QueueJobData = { type: 'crosspost', post: createMockPost({ title: 'Post 3' }) };
      
      concurrencyQueue.addJob(jobData1);
      concurrencyQueue.addJob(jobData2);
      concurrencyQueue.addJob(jobData3);
    });
  });

  describe('event system', () => {
    it('should emit all expected events', (done) => {
      const post = createMockPost();
      const jobData: QueueJobData = { type: 'crosspost', post };
      const events: string[] = [];

      queue.on('job:added', () => events.push('added'));
      queue.on('job:started', () => events.push('started'));
      queue.on('job:completed', () => {
        events.push('completed');
        
        expect(events).toEqual(['added', 'started', 'completed']);
        done();
      });

      // Adding job starts processing automatically
      queue.addJob(jobData);
    });
  });
});
