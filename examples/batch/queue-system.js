#!/usr/bin/env node

import { CrossPostQueue } from '../../dist/index.js';
import { MarkdownParser } from '../../dist/index.js';
import { readdir } from 'fs/promises';
import { resolve, join } from 'path';

async function runQueueExample() {
  try {
    console.log('🎯 Queue System Example');
    console.log('=======================');

    // Create queue with custom concurrency
    const queue = new CrossPostQueue({ concurrency: 2 });

    // Set up event listeners
    queue.on('jobAdded', (job) => {
      console.log(`📥 Job added: ${job.id}`);
    });

    queue.on('jobStarted', (job) => {
      console.log(`🚀 Job started: ${job.id} (${job.data.post?.title || 'Unknown'})`);
    });

    queue.on('jobCompleted', (job) => {
      console.log(`✅ Job completed: ${job.id}`);
    });

    queue.on('jobFailed', (job) => {
      console.log(`❌ Job failed: ${job.id} - ${job.error}`);
    });

    queue.on('jobRetry', (job) => {
      console.log(`🔄 Job retry: ${job.id} (attempt ${job.attempts})`);
    });

    queue.on('processingStarted', () => {
      console.log('⏳ Queue processing started');
    });

    queue.on('processingCompleted', () => {
      console.log('🎉 Queue processing completed');
    });

    // Load sample posts
    const postsDir = resolve('./examples/sample-posts');
    const files = await readdir(postsDir);
    const markdownFiles = files
      .filter(file => file.endsWith('.md'))
      .map(file => join(postsDir, file));

    if (markdownFiles.length === 0) {
      console.log('No markdown files found. Creating demo jobs instead...');
      
      // Create demo jobs
      for (let i = 1; i <= 5; i++) {
        await queue.addJob({
          type: 'crosspost',
          post: {
            title: `Demo Post ${i}`,
            content: `This is demo content for post ${i}`,
            tags: ['demo', 'test'],
            publishStatus: 'published'
          }
        });
      }
    } else {
      console.log(`Adding ${markdownFiles.length} files to queue...`);
      
      // Process each file and add to queue
      for (const filePath of markdownFiles) {
        try {
          const parsed = await MarkdownParser.parseFile(filePath);
          
          await queue.addJob({
            type: 'crosspost',
            post: {
              title: parsed.frontmatter.title,
              content: parsed.content,
              description: parsed.frontmatter.description,
              tags: parsed.frontmatter.tags || [],
              publishStatus: parsed.frontmatter.published ? 'published' : 'draft'
            }
          });
        } catch (error) {
          console.error(`Error parsing ${filePath}:`, error.message);
        }
      }
    }

    // Monitor queue status
    const statusInterval = setInterval(() => {
      const status = queue.getStatus();
      console.log(`📊 Status: ${status.processingJobs} processing, ${status.pendingJobs} pending, ${status.totalJobs} total`);
    }, 2000);

    // Wait for processing to complete
    await new Promise((resolve) => {
      queue.on('processingCompleted', () => {
        clearInterval(statusInterval);
        resolve();
      });
    });

    console.log('\n🎯 Queue processing finished!');

  } catch (error) {
    console.error('❌ Error running queue example:', error);
  }
}

// Run the example
runQueueExample();
