import {
  BatchCrossPostResult,
  CrossPostConfig,
  CrossPostError,
  CrossPostResult,
  PlatformClient,
  PlatformPost,
  Post
} from './core/types';
import { DevToClient } from './platforms/devto/index';
import { HashnodeClient } from './platforms/hashnode/index';
import { MarkdownParser } from './utils/markdown-parser';

/**
 * Main Auto-CrossPost SDK class
 * Orchestrates cross-posting to multiple platforms
 */
export class AutoCrossPost {
  private clients: Map<string, PlatformClient> = new Map();
  private config: CrossPostConfig;
  private logger?: {
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
  };

  constructor(config: CrossPostConfig, logger?: any) {
    this.config = config;
    this.logger = logger;
    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize Dev.to client
    if (this.config.platforms.devto) {
      const client = new DevToClient(this.config.platforms.devto);
      this.clients.set('devto', client);
      this.logger?.info('Dev.to client initialized');
    }

    // Initialize Hashnode client
    if (this.config.platforms.hashnode) {
      const client = new HashnodeClient(this.config.platforms.hashnode);
      this.clients.set('hashnode', client);
      this.logger?.info('Hashnode client initialized');
    }

    if (this.clients.size === 0) {
      throw new Error('No platforms configured. Please configure at least one platform.');
    }
  }

  /**
   * Cross-post a single post to all configured platforms
   */
  async crossPost(post: Post, platforms?: string[]): Promise<BatchCrossPostResult> {
    const targetPlatforms = platforms || Array.from(this.clients.keys());
    const results: CrossPostResult[] = [];
    let successful = 0;
    let failed = 0;

    this.logger?.info(`Starting cross-post to ${ targetPlatforms.length } platforms`, {
      title: post.title,
      platforms: targetPlatforms
    });

    // Apply default configuration
    const processedPost = this.applyDefaults(post);

    for (const platformName of targetPlatforms) {
      const client = this.clients.get(platformName);

      if (!client) {
        const result: CrossPostResult = {
          platform: platformName,
          success: false,
          error: `Platform ${ platformName } not configured`
        };
        results.push(result);
        failed++;
        continue;
      }

      try {
        this.logger?.info(`Posting to ${ platformName }...`);

        // Authenticate if needed
        await client.authenticate();

        // Create the post
        const platformPost = await client.createPost(processedPost);

        const result: CrossPostResult = {
          platform: platformName,
          success: true,
          platformPost
        };

        results.push(result);
        successful++;

        this.logger?.info(`Successfully posted to ${ platformName }`, {
          platformId: platformPost.platformId,
          url: platformPost.platformUrl
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        const result: CrossPostResult = {
          platform: platformName,
          success: false,
          error: errorMessage
        };

        results.push(result);
        failed++;

        this.logger?.error(`Failed to post to ${ platformName }`, { error: errorMessage });
      }
    }

    return {
      total: targetPlatforms.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Cross-post from a markdown file
   */
  async crossPostFromFile(filePath: string, platforms?: string[]): Promise<BatchCrossPostResult> {
    try {
      const markdownFile = await MarkdownParser.parseFile(filePath);
      const post = MarkdownParser.toPost(markdownFile);

      this.logger?.info(`Parsed markdown file: ${ filePath }`, { title: post.title });

      return await this.crossPost(post, platforms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CrossPostError(`Failed to cross-post from file ${ filePath }: ${ errorMessage }`);
    }
  }

  /**
   * Cross-post from markdown content string
   */
  async crossPostFromContent(content: string, platforms?: string[]): Promise<BatchCrossPostResult> {
    try {
      const markdownFile = MarkdownParser.parseContent(content);
      const post = MarkdownParser.toPost(markdownFile);

      this.logger?.info('Parsed markdown content', { title: post.title });

      return await this.crossPost(post, platforms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CrossPostError(`Failed to cross-post from content: ${ errorMessage }`);
    }
  }

  /**
   * Update an existing post on specific platforms
   */
  async updatePost(platformId: string, post: Post, platform: string): Promise<PlatformPost> {
    const client = this.clients.get(platform);

    if (!client) {
      throw new CrossPostError(`Platform ${ platform } not configured`);
    }

    try {
      await client.authenticate();
      const processedPost = this.applyDefaults(post);
      const updatedPost = await client.updatePost(platformId, processedPost);

      this.logger?.info(`Successfully updated post on ${ platform }`, {
        platformId: updatedPost.platformId,
        url: updatedPost.platformUrl
      });

      return updatedPost;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CrossPostError(`Failed to update post on ${ platform }: ${ errorMessage }`, platform);
    }
  }

  /**
   * Delete a post from a specific platform
   */
  async deletePost(platformId: string, platform: string): Promise<boolean> {
    const client = this.clients.get(platform);

    if (!client) {
      throw new CrossPostError(`Platform ${ platform } not configured`);
    }

    try {
      await client.authenticate();
      const success = await client.deletePost(platformId);

      this.logger?.info(`Successfully deleted post from ${ platform }`, { platformId });

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CrossPostError(`Failed to delete post from ${ platform }: ${ errorMessage }`, platform);
    }
  }

  /**
   * Get a post from a specific platform
   */
  async getPost(platformId: string, platform: string): Promise<PlatformPost> {
    const client = this.clients.get(platform);

    if (!client) {
      throw new CrossPostError(`Platform ${ platform } not configured`);
    }

    try {
      await client.authenticate();
      return await client.getPost(platformId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CrossPostError(`Failed to get post from ${ platform }: ${ errorMessage }`, platform);
    }
  }

  /**
   * List posts from a specific platform
   */
  async listPosts(platform: string, options?: { page?: number; perPage?: number }): Promise<PlatformPost[]> {
    const client = this.clients.get(platform);

    if (!client) {
      throw new CrossPostError(`Platform ${ platform } not configured`);
    }

    try {
      await client.authenticate();
      return await client.listPosts(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CrossPostError(`Failed to list posts from ${ platform }: ${ errorMessage }`, platform);
    }
  }

  /**
   * Test authentication for all configured platforms
   */
  async testAuthentication(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [platformName, client] of this.clients) {
      try {
        const success = await client.authenticate();
        results[platformName] = success;
        this.logger?.info(`${ platformName } authentication successful`);
      } catch (error) {
        results[platformName] = false;
        this.logger?.error(`${ platformName } authentication failed`, { error });
      }
    }

    return results;
  }

  /**
   * Get list of configured platforms
   */
  getConfiguredPlatforms(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Apply default configuration to a post
   */
  private applyDefaults(post: Post): Post {
    const processedPost: Post = { ...post };

    // Apply default tags
    if (this.config.defaults?.tags && this.config.defaults.tags.length > 0) {
      const existingTags = post.tags || [];
      const defaultTags = this.config.defaults.tags.filter(tag =>
        !existingTags.includes(tag)
      );
      processedPost.tags = [...existingTags, ...defaultTags];
    }

    // Apply default publish status
    if (!post.publishStatus && this.config.defaults?.publishStatus) {
      processedPost.publishStatus = this.config.defaults.publishStatus;
    }

    // Apply default canonical URL
    if (!post.canonicalUrl && this.config.defaults?.canonicalUrl) {
      processedPost.canonicalUrl = this.config.defaults.canonicalUrl;
    }

    return processedPost;
  }
}
