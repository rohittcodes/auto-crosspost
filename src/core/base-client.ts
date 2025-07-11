import { CrossPostError, ListPostsOptions, PlatformClient, PlatformPost, Post } from './types.ts';

/**
 * Abstract base class for platform clients
 * Provides common functionality and enforces interface compliance
 */
export abstract class BaseClient implements PlatformClient {
  abstract readonly name: string;

  protected constructor(
    protected config: Record<string, any>,
    protected logger?: { log: (...args: any[]) => void; info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void; }
  ) {
    this.logger = logger || {
      log: () => { },
      info: () => { },
      warn: () => { },
      error: () => { }
    };
  }

  // Abstract methods that must be implemented by platform-specific clients
  abstract authenticate(): Promise<boolean>;
  abstract createPost(post: Post): Promise<PlatformPost>;
  abstract updatePost(platformId: string, post: Post): Promise<PlatformPost>;
  abstract deletePost(platformId: string): Promise<boolean>;
  abstract getPost(platformId: string): Promise<PlatformPost>;

  // Default implementation that can be overridden
  async listPosts(_options?: ListPostsOptions): Promise<PlatformPost[]> {
    // Default implementation - platforms can override this
    throw new Error(`listPosts not implemented for ${ this.name }`);
  }

  // Common utility methods
  protected async handleApiCall<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger?.error(`[${ this.name }] ${ context } failed:`, error);
      throw this.transformError(error, context);
    }
  }

  protected transformError(error: any, context: string): CrossPostError {
    if (error instanceof CrossPostError) {
      return error;
    }

    // Handle common HTTP errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message || 'Unknown error';

      if (status === 401 || status === 403) {
        return new CrossPostError(
          `Authentication failed: ${ message }`,
          this.name,
          'AUTH_ERROR',
          status
        );
      }

      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        return new CrossPostError(
          `Rate limit exceeded: ${ message }`,
          this.name,
          'RATE_LIMIT',
          retryAfter ? parseInt(retryAfter) * 1000 : 60000
        );
      }

      if (status >= 400 && status < 500) {
        return new CrossPostError(
          `Client error: ${ message }`,
          this.name,
          'CLIENT_ERROR',
          status
        );
      }

      if (status >= 500) {
        return new CrossPostError(
          `Server error: ${ message }`,
          this.name,
          'SERVER_ERROR',
          status
        );
      }
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new CrossPostError(
        `Network error: ${ error.message }`,
        this.name,
        'NETWORK_ERROR'
      );
    }

    // Default error
    return new CrossPostError(
      `${ context } failed: ${ error.message || 'Unknown error' }`,
      this.name,
      'UNKNOWN_ERROR'
    );
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof CrossPostError) {
          if (error.code === 'AUTH_ERROR' ||
            (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429)) {
            throw error;
          }

          // For rate limiting, wait for the specified time
          if (error.code === 'RATE_LIMIT' && error.statusCode) {
            const delay = error.statusCode;
            this.logger?.warn(`[${ this.name }] Rate limited, waiting ${ delay }ms`);
            await this.sleep(delay);
            continue;
          }
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        this.logger?.warn(`[${ this.name }] Attempt ${ attempt + 1 } failed, retrying in ${ delay }ms`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  protected async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    return this.retryWithBackoff(operation);
  }

  protected validatePost(post: Post): void {
    if (!post.title || post.title.trim().length === 0) {
      throw new CrossPostError('Post title is required', this.name, 'VALIDATION_ERROR');
    }

    if (!post.content || post.content.trim().length === 0) {
      throw new CrossPostError('Post content is required', this.name, 'VALIDATION_ERROR');
    }

    if (post.tags && post.tags.length > 5) {
      throw new CrossPostError('Maximum 5 tags allowed', this.name, 'VALIDATION_ERROR');
    }
  }

  protected sanitizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '')
      .slice(0, 25); // Most platforms have tag length limits
  }

  protected formatCanonicalUrl(url?: string): string | undefined {
    if (url) {
      return url;
    }

    // This would be set by the main SDK based on configuration
    return undefined;
  }
}
