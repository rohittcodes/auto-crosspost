import { AutoCrossPost } from '../auto-crosspost.ts';
import { ConfigManager } from '../config/index.ts';
import { MarkdownParser } from '../utils/markdown-parser.ts';
import { CrossPostResult, Post } from './types.ts';

// Simple concurrency control without p-limit
class ConcurrencyLimiter {
  private running = 0;
  private queue: (() => Promise<any>)[] = [];

  constructor(private limit: number) {}

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processNext();
        }
      });
      this.processNext();
    });
  }

  private processNext() {
    if (this.running < this.limit && this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    }
  }
}

export interface BatchOptions {
  concurrency?: number;
  delay?: number;
  retryFailures?: boolean;
  skipDrafts?: boolean;
}

export interface BatchResult {
  file: string;
  results?: CrossPostResult[];
  error?: string;
  success: boolean;
  duration?: number;
  timestamp: Date;
}

export class BatchProcessor {
  private concurrency: number;
  private delayMs: number;
  private limiter: ConcurrencyLimiter;
  private options: BatchOptions;

  constructor(options: BatchOptions = {}) {
    this.concurrency = options.concurrency || 3;
    this.delayMs = options.delay || 1000;
    this.options = options;
    this.limiter = new ConcurrencyLimiter(this.concurrency);
  }

  async processFiles(files: string[]): Promise<BatchResult[]> {
    console.log(`Processing ${ files.length } files with concurrency ${ this.concurrency }`);

    const parser = new MarkdownParser();
    const config = await ConfigManager.loadConfig();
    const sdk = new AutoCrossPost(config);

    const promises = files.map(filePath =>
      this.limiter.add(async () => {
        try {
          const result = await this.processFile(filePath, parser, sdk);

          // Add delay between requests to respect rate limits
          if (this.delayMs > 0) {
            await this.delay(this.delayMs);
          }

          return result;
        } catch (error) {
          return {
            file: filePath,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            timestamp: new Date()
          };
        }
      })
    );

    return Promise.all(promises);
  }

  private async processFile(
    filePath: string,
    _parser: MarkdownParser,
    sdk: AutoCrossPost
  ): Promise<BatchResult> {
    const startTime = Date.now();

    // Parse markdown
    const parsed = await MarkdownParser.parseFile(filePath);

    // Skip drafts if configured
    if (this.options.skipDrafts && !parsed.frontmatter.published) {
      return {
        file: this.getFileName(filePath),
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: 'Skipped draft'
      };
    }

    // Create post object
    const post: Post = {
      title: parsed.frontmatter.title,
      content: parsed.content,
      description: parsed.frontmatter.description,
      tags: parsed.frontmatter.tags || [],
      publishStatus: parsed.frontmatter.published ? 'published' : 'draft',
      canonicalUrl: parsed.frontmatter.canonical_url,
      coverImage: parsed.frontmatter.cover_image
    };

    // Cross-post to all platforms
    const batchResult = await sdk.crossPost(post);

    const duration = Date.now() - startTime;
    const success = batchResult.successful > 0 && batchResult.failed === 0;

    return {
      file: this.getFileName(filePath),
      results: batchResult.results,
      success,
      duration,
      timestamp: new Date()
    };
  }

  private getFileName(filePath: string): string {
    return filePath.split(/[/\\]/).pop() || filePath;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
