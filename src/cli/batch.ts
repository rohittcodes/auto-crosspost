#!/usr/bin/env node

import { Command } from 'commander';
import { resolve, join } from 'path';
import { readdir } from 'fs/promises';
import chalk from 'chalk';
import { 
  BatchProcessor, 
  CrossPostQueue, 
  FileWatcher, 
  CrossPostScheduler,
  BatchProgressReporter 
} from '../core/index.js';

const program = new Command();

program
  .name('crosspost-batch')
  .description('Batch cross-posting utilities')
  .version('1.0.0');

// Batch process command
program
  .command('process')
  .description('Process multiple markdown files')
  .argument('<directory>', 'Directory containing markdown files')
  .option('-c, --concurrency <number>', 'Number of concurrent operations', '3')
  .option('-d, --delay <number>', 'Delay between operations (ms)', '1000')
  .option('--dry-run', 'Show what would be processed without executing')
  .option('--filter <pattern>', 'File pattern to filter', '*.md')
  .option('--skip-drafts', 'Skip draft posts')
  .action(async (directory: string, options: any) => {
    try {
      const absoluteDir = resolve(directory);
      console.log(chalk.blue(`📁 Processing directory: ${absoluteDir}`));

      // Get files
      const allFiles = await readdir(absoluteDir);
      const pattern = options.filter.replace('*', '');
      const markdownFiles = allFiles
        .filter(file => file.endsWith(pattern))
        .map(file => join(absoluteDir, file));

      if (markdownFiles.length === 0) {
        console.log(chalk.yellow('No markdown files found'));
        return;
      }

      console.log(chalk.green(`Found ${markdownFiles.length} files`));

      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - showing files that would be processed:'));
        markdownFiles.forEach(file => console.log(`  ${file}`));
        return;
      }

      // Setup progress reporting
      const reporter = new BatchProgressReporter(markdownFiles.length);

      // Configure batch processor
      const processor = new BatchProcessor({
        concurrency: parseInt(options.concurrency),
        delay: parseInt(options.delay),
        skipDrafts: options.skipDrafts
      });

      console.log(chalk.blue('🚀 Starting batch processing...'));

      // Process files
      const results = await processor.processFiles(markdownFiles);

      // Report each result
      results.forEach(result => reporter.reportProgress(result));

      // Print final report
      reporter.printFinalReport();

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Watch command
program
  .command('watch')
  .description('Watch directory for changes and auto-process')
  .argument('<directory>', 'Directory to watch')
  .option('--ignore-initial', 'Ignore existing files on startup')
  .option('--skip-drafts', 'Skip draft posts')
  .option('-c, --concurrency <number>', 'Number of concurrent operations', '1')
  .action(async (directory: string, options: any) => {
    try {
      const absoluteDir = resolve(directory);
      console.log(chalk.blue(`👀 Watching ${absoluteDir} for changes...`));

      const watcher = new FileWatcher(absoluteDir, {
        ignoreInitial: options.ignoreInitial,
        skipDrafts: options.skipDrafts,
        concurrency: parseInt(options.concurrency)
      });

      // Print status periodically
      setInterval(() => {
        const status = watcher.getQueueStatus();
        if (status.totalJobs > 0) {
          console.log(
            chalk.cyan(`Queue status: ${status.processingJobs} processing, ${status.pendingJobs} pending`)
          );
        }
      }, 10000);

      console.log(chalk.green('File watcher started. Press Ctrl+C to stop'));

      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping file watcher...'));
        watcher.stop();
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {});

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Schedule command
program
  .command('schedule')
  .description('Schedule recurring batch operations')
  .argument('<directory>', 'Directory to process')
  .option('--daily <time>', 'Daily at specified time (HH:MM)')
  .option('--weekly <day>', 'Weekly on specified day (0-6, Sunday-Saturday)')
  .option('--weekly-time <time>', 'Time for weekly schedule (HH:MM)', '09:00')
  .option('--cron <expression>', 'Custom cron expression')
  .option('-c, --concurrency <number>', 'Number of concurrent operations', '2')
  .option('--job-id <id>', 'Custom job ID for cron schedules')
  .action(async (directory: string, options: any) => {
    try {
      const absoluteDir = resolve(directory);
      const scheduler = new CrossPostScheduler({
        batchOptions: {
          concurrency: parseInt(options.concurrency),
          delay: 2000,
          skipDrafts: true
        }
      });

      let jobId: string;

      if (options.daily) {
        jobId = scheduler.scheduleDaily(options.daily, absoluteDir);
        console.log(chalk.green(`📅 Scheduled daily processing at ${options.daily}`));
      } else if (options.weekly !== undefined) {
        const day = parseInt(options.weekly);
        const time = options.weeklyTime;
        jobId = scheduler.scheduleWeekly(day, time, absoluteDir);
        console.log(chalk.green(`📅 Scheduled weekly processing on day ${day} at ${time}`));
      } else if (options.cron) {
        jobId = scheduler.scheduleCustom(options.cron, absoluteDir, options.jobId);
        console.log(chalk.green(`📅 Scheduled custom job: ${options.cron}`));
      } else {
        console.error(chalk.red('Please specify --daily, --weekly, or --cron option'));
        process.exit(1);
      }

      console.log(chalk.blue(`Job ID: ${jobId}`));
      console.log(chalk.green('Scheduler running... Press Ctrl+C to stop'));

      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping scheduler...'));
        scheduler.stopAll();
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {});

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Queue command
program
  .command('queue')
  .description('Manage the job queue')
  .option('--status', 'Show queue status')
  .option('--clear', 'Clear the queue')
  .option('-c, --concurrency <number>', 'Number of concurrent operations', '3')
  .action(async (options: any) => {
    try {
      const queue = new CrossPostQueue({
        concurrency: parseInt(options.concurrency)
      });

      if (options.status) {
        const status = queue.getStatus();
        console.log(chalk.blue('📊 Queue Status:'));
        console.log(`Total Jobs: ${status.totalJobs}`);
        console.log(`Pending: ${status.pendingJobs}`);
        console.log(`Processing: ${status.processingJobs}`);
        console.log(`Active: ${status.processing ? 'Yes' : 'No'}`);
      }

      if (options.clear) {
        queue.clear();
        console.log(chalk.green('✅ Queue cleared'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program.parse();
