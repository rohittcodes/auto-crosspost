import pLimit from 'p-limit';
import { MarkdownParser } from '../utils/markdown-parser.js';
import { AutoCrossPost } from '../auto-crosspost.js';
import { Post, CrossPostResult } from './types.js';
import { ConfigManager } from '../config/index.js';

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
  private limit: any;
  private options: BatchOptions;

  constructor(options: BatchOptions = {}) {
    this.concurrency = options.concurrency || 3;
    this.delayMs = options.delay || 1000;
    this.options = options;
    this.limit = pLimit(this.concurrency);
  }

  async processFiles(files: string[]): Promise<BatchResult[]> {
    console.log(`Processing ${files.length} files with concurrency ${this.concurrency}`);

    const parser = new MarkdownParser();
    const config = await ConfigManager.loadConfig();
    const sdk = new AutoCrossPost(config);
    
    const promises = files.map(filePath => 
      this.limit(async () => {
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
