#!/usr/bin/env node

import { CrossPostScheduler } from '../../dist/index.js';
import { resolve } from 'path';

async function runSchedulerExample() {
  try {
    console.log('📅 Scheduler Example');
    console.log('===================');

    // Directory containing posts to process
    const postsDir = resolve('./examples/sample-posts');
    
    console.log(`Posts directory: ${postsDir}`);

    // Create scheduler with batch options
    const scheduler = new CrossPostScheduler({
      batchOptions: {
        concurrency: 2,
        delay: 1000,
        skipDrafts: true
      }
    });

    // Schedule daily processing at 9:00 AM
    const dailyJobId = scheduler.scheduleDaily('09:00', postsDir);
    console.log(`✅ Scheduled daily job: ${dailyJobId}`);

    // Schedule weekly processing on Monday (1) at 10:00 AM
    const weeklyJobId = scheduler.scheduleWeekly(1, '10:00', postsDir);
    console.log(`✅ Scheduled weekly job: ${weeklyJobId}`);

    // Schedule custom cron job (every 5 minutes for demo)
    const customJobId = scheduler.scheduleCustom('*/5 * * * *', postsDir, 'demo-5min');
    console.log(`✅ Scheduled custom job: ${customJobId}`);

    // Show active jobs
    console.log('\n📋 Active Jobs:');
    const activeJobs = scheduler.getActiveJobs();
    activeJobs.forEach(jobId => {
      console.log(`  • ${jobId}`);
    });

    // Show job status
    console.log('\n📊 Job Status:');
    const jobStatus = scheduler.getJobStatus();
    Object.entries(jobStatus).forEach(([jobId, active]) => {
      console.log(`  ${active ? '✅' : '❌'} ${jobId}`);
    });

    console.log('\n✨ Scheduler is running...');
    console.log('Jobs will run according to their schedules');
    console.log('Press Ctrl+C to stop');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping scheduler...');
      scheduler.stopAll();
      console.log('✅ All scheduled jobs stopped');
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error running scheduler example:', error);
  }
}

// Run the example
runSchedulerExample();
