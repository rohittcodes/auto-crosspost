import * as chokidar from 'chokidar';
import { join } from 'path';
import { MarkdownParser } from '../utils/markdown-parser.ts';
import { CrossPostQueue, QueueJobData } from './queue.ts';

export interface WatcherOptions {
  concurrency?: number;
  ignoreInitial?: boolean;
  skipDrafts?: boolean;
}

export class FileWatcher {
  private watcher: chokidar.FSWatcher;
  private queue: CrossPostQueue;
  private options: WatcherOptions;

  constructor(directory: string, options: WatcherOptions = {}) {
    this.options = options;
    this.queue = new CrossPostQueue({
      concurrency: options.concurrency || 1
    });

    this.watcher = chokidar.watch(join(directory, '*.md'), {
      persistent: true,
      ignoreInitial: options.ignoreInitial !== false // Default to true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.watcher.on('add', (filePath: string) => {
      console.log(`New file detected: ${ filePath }`);
      this.processFile(filePath);
    });

    this.watcher.on('change', (filePath: string) => {
      console.log(`File changed: ${ filePath }`);
      this.processFile(filePath);
    });

    this.watcher.on('error', (error: unknown) => {
      console.error('File watcher error:', error);
    });

    this.queue.on('jobCompleted', (job) => {
      console.log(`✅ Auto-posted: ${ job.data.post?.title || 'Unknown' }`);
    });

    this.queue.on('jobFailed', (job) => {
      console.error(`❌ Auto-post failed: ${ job.error }`);
    });
  }

  private async processFile(filePath: string) {
    try {
      const parsed = await MarkdownParser.parseFile(filePath);

      // Skip drafts if configured
      if (this.options.skipDrafts && !parsed.frontmatter.published) {
        console.log(`Skipping draft: ${ filePath }`);
        return;
      }

      // Only process published posts by default
      if (!parsed.frontmatter.published) {
        console.log(`Skipping unpublished post: ${ filePath }`);
        return;
      }

      const jobData: QueueJobData = {
        type: 'crosspost',
        post: {
          title: parsed.frontmatter.title,
          content: parsed.content,
          description: parsed.frontmatter.description,
          tags: parsed.frontmatter.tags || [],
          publishStatus: 'published',
          canonicalUrl: parsed.frontmatter.canonical_url,
          coverImage: parsed.frontmatter.cover_image
        }
      };

      await this.queue.addJob(jobData);

    } catch (error) {
      console.error(`Error processing ${ filePath }:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  getQueueStatus() {
    return this.queue.getStatus();
  }

  clearQueue() {
    this.queue.clear();
  }

  stop() {
    this.watcher.close();
    this.queue.stop();
  }
}
