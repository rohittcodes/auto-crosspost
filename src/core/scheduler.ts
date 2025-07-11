import { readdir } from 'fs/promises';
import * as cron from 'node-cron';
import { join } from 'path';
import { BatchOptions, BatchProcessor } from './batch-processor.ts';

export interface SchedulerOptions {
  batchOptions?: BatchOptions;
}

export class CrossPostScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private options: SchedulerOptions;

  constructor(options: SchedulerOptions = {}) {
    this.options = options;
  }

  scheduleDaily(time: string, directory: string): string {
    // Parse time format HH:MM
    const [hour, minute] = time.split(':').map(Number);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time format. Use HH:MM (24-hour format)');
    }

    const task = cron.schedule(`${ minute } ${ hour } * * *`, async () => {
      console.log(`Running daily cross-post at ${ time }`);
      await this.processPendingPosts(directory);
    });

    const jobId = `daily-${ time.replace(':', '-') }`;
    this.jobs.set(jobId, task);

    console.log(`Scheduled daily job: ${ jobId }`);
    return jobId;
  }

  scheduleWeekly(day: number, time: string, directory: string): string {
    // Validate day (0-6, Sunday-Saturday)
    if (day < 0 || day > 6) {
      throw new Error('Invalid day. Use 0-6 (Sunday-Saturday)');
    }

    // Parse time format HH:MM
    const [hour, minute] = time.split(':').map(Number);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time format. Use HH:MM (24-hour format)');
    }

    const task = cron.schedule(`${ minute } ${ hour } * * ${ day }`, async () => {
      console.log(`Running weekly cross-post on day ${ day } at ${ time }`);
      await this.processPendingPosts(directory);
    });

    const jobId = `weekly-${ day }-${ time.replace(':', '-') }`;
    this.jobs.set(jobId, task);

    console.log(`Scheduled weekly job: ${ jobId }`);
    return jobId;
  }

  scheduleCustom(cronExpression: string, directory: string, jobId?: string): string {
    if (!cron.validate(cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`Running custom scheduled cross-post: ${ cronExpression }`);
      await this.processPendingPosts(directory);
    });

    const id = jobId || `custom-${ Date.now() }`;
    this.jobs.set(id, task);

    console.log(`Scheduled custom job: ${ id }`);
    return id;
  }

  private async processPendingPosts(directory: string) {
    try {
      const processor = new BatchProcessor(this.options.batchOptions || {
        concurrency: 2,
        delay: 2000,
        skipDrafts: true
      });

      const files = await readdir(directory);
      const markdownFiles = files
        .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
        .map(f => join(directory, f));

      if (markdownFiles.length === 0) {
        console.log('No markdown files found to process');
        return;
      }

      console.log(`Processing ${ markdownFiles.length } files`);
      const results = await processor.processFiles(markdownFiles);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Scheduled job completed: ${ successful } successful, ${ failed } failed`);

      // Log details for failed jobs
      results.filter(r => !r.success).forEach(result => {
        console.error(`Failed: ${ result.file } - ${ result.error }`);
      });

    } catch (error) {
      console.error('Scheduled job failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  getActiveJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  isJobActive(jobId: string): boolean {
    return this.jobs.has(jobId);
  }

  stopJob(jobId: string): boolean {
    const task = this.jobs.get(jobId);
    if (task) {
      task.stop();
      this.jobs.delete(jobId);
      console.log(`Stopped job: ${ jobId }`);
      return true;
    }
    return false;
  }

  stopAll(): void {
    console.log(`Stopping ${ this.jobs.size } scheduled jobs`);
    this.jobs.forEach((task, jobId) => {
      task.stop();
      console.log(`Stopped job: ${ jobId }`);
    });
    this.jobs.clear();
  }

  getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((_task, jobId) => {
      status[jobId] = true; // Job exists and is scheduled
    });
    return status;
  }
}
