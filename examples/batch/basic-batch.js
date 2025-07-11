#!/usr/bin/env node

import { BatchProcessor, BatchProgressReporter } from '../../dist/index.js';
import { readdir } from 'fs/promises';
import { resolve, join } from 'path';

async function runBasicBatchExample() {
  try {
    console.log('🚀 Basic Batch Processing Example');
    console.log('================================');

    // Directory containing markdown files
    const postsDir = resolve('./examples/sample-posts');
    
    // Get all markdown files
    const files = await readdir(postsDir);
    const markdownFiles = files
      .filter(file => file.endsWith('.md'))
      .map(file => join(postsDir, file));

    if (markdownFiles.length === 0) {
      console.log('No markdown files found in ./examples/sample-posts');
      console.log('Please add some .md files to test batch processing');
      return;
    }

    console.log(`Found ${markdownFiles.length} markdown files`);

    // Create progress reporter
    const reporter = new BatchProgressReporter(markdownFiles.length);

    // Create batch processor with custom options
    const processor = new BatchProcessor({
      concurrency: 2,        // Process 2 files at once
      delay: 1000,          // Wait 1 second between requests
      skipDrafts: true      // Skip unpublished posts
    });

    console.log('\n⏳ Starting batch processing...');

    // Process all files
    const results = await processor.processFiles(markdownFiles);

    // Report progress for each result
    results.forEach(result => {
      reporter.reportProgress(result);
    });

    // Print final report
    console.log('\n📊 Final Report:');
    reporter.printFinalReport();

    // Show detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      console.log(`${status} ${result.file} ${duration}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.success && result.results) {
        result.results.forEach(platformResult => {
          const platformStatus = platformResult.success ? '✅' : '❌';
          console.log(`   ${platformStatus} ${platformResult.platform}`);
          if (platformResult.platformPost?.platformUrl) {
            console.log(`      URL: ${platformResult.platformPost.platformUrl}`);
          }
        });
      }
    });

  } catch (error) {
    console.error('❌ Error running batch example:', error);
  }
}

// Run the example
runBasicBatchExample();
