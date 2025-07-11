#!/usr/bin/env node

import { FileWatcher } from '../../dist/index.js';
import { resolve } from 'path';

async function runFileWatcherExample() {
  try {
    console.log('👀 File Watcher Example');
    console.log('======================');

    // Directory to watch
    const watchDir = resolve('./examples/sample-posts');
    
    console.log(`Watching directory: ${watchDir}`);
    console.log('Add, modify, or update .md files to see auto-processing in action');

    // Create file watcher
    const watcher = new FileWatcher(watchDir, {
      ignoreInitial: false,   // Process existing files on startup
      skipDrafts: false,      // Process all files, including drafts
      concurrency: 1         // Process one file at a time
    });

    // Monitor queue status
    const statusInterval = setInterval(() => {
      const status = watcher.getQueueStatus();
      if (status.totalJobs > 0) {
        console.log(`📊 Queue: ${status.processingJobs} processing, ${status.pendingJobs} pending`);
      }
    }, 5000);

    console.log('\n✨ File watcher is running...');
    console.log('Press Ctrl+C to stop');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping file watcher...');
      clearInterval(statusInterval);
      watcher.stop();
      console.log('✅ File watcher stopped');
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error running file watcher example:', error);
  }
}

// Run the example
runFileWatcherExample();
