/**
 * Base interfaces for the Auto-CrossPost SDK
 */

// ====================
// Core Post Interface
// ====================

export interface Post {
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  canonicalUrl?: string;
  publishStatus: 'draft' | 'published';
  coverImage?: string;
  publishedAt?: Date;
}

// ====================
// Platform-Specific Post Interface
// ====================

export interface PlatformPost {
  platformId: string;
  platform: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  canonicalUrl?: string;
  publishStatus: 'draft' | 'published';
  coverImage?: string;
  platformUrl?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  stats?: {
    views: number;
    likes: number;
    comments: number;
  };
}

// ====================
// Platform Client Interface
// ====================

export interface PlatformClient {
  name: string;
  authenticate(): Promise<boolean>;
  createPost(post: Post): Promise<PlatformPost>;
  updatePost(platformId: string, post: Post): Promise<PlatformPost>;
  deletePost(platformId: string): Promise<boolean>;
  getPost(platformId: string): Promise<PlatformPost>;
  listPosts(options?: ListPostsOptions): Promise<PlatformPost[]>;
}

// ====================
// Configuration Interfaces
// ====================

export interface CrossPostConfig {
  platforms: {
    devto?: { apiKey: string; defaultTags?: string[] };
    hashnode?: { token: string; publicationId?: string; defaultTags?: string[] };
  };
  defaults?: {
    tags?: string[];
    publishStatus?: 'draft' | 'published';
    canonicalUrl?: string;
  };
  options?: {
    autoSync?: boolean;
    watchMode?: boolean;
    retryAttempts?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
}

// ====================
// Utility Interfaces
// ====================

export interface ListPostsOptions {
  page?: number;
  perPage?: number;
  published?: boolean;
}

export interface MarkdownFile {
  path: string;
  frontmatter: Record<string, any>;
  content: string;
}

export interface CrossPostResult {
  platform: string;
  success: boolean;
  platformPost?: PlatformPost;
  error?: string;
}

export interface BatchCrossPostResult {
  total: number;
  successful: number;
  failed: number;
  results: CrossPostResult[];
}

// ====================
// Error Types
// ====================

export class CrossPostError extends Error {
  constructor(
    message: string,
    public platform?: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'CrossPostError';
  }
}

export class AuthenticationError extends CrossPostError {
  constructor(platform: string, message: string = 'Authentication failed') {
    super(message, platform, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends CrossPostError {
  constructor(platform: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${platform}`, platform, 'RATE_LIMIT');
    this.name = 'RateLimitError';
    if (retryAfter) {
      this.statusCode = retryAfter;
    }
  }
}

export class ValidationError extends CrossPostError {
  constructor(message: string, field?: string) {
    super(message, undefined, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    if (field) {
      this.statusCode = field as any; // Store field in statusCode for convenience
    }
  }
}

export class PlatformError extends CrossPostError {
  constructor(message: string, code?: string, platform?: string) {
    super(message, platform, code);
    this.name = 'PlatformError';
  }
}
