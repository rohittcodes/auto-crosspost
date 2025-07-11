import axios, { AxiosInstance } from 'axios';
import { BaseClient } from '../../core/base-client';
import {
  Post,
  PlatformClient,
  PlatformPost,
  ListPostsOptions,
  AuthenticationError,
  ValidationError,
  PlatformError
} from '../../core/types';
import { DevToConfig, DevToPost, DevToArticle } from './types';

export class DevToClient extends BaseClient implements PlatformClient {
  public readonly name = 'Dev.to';
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: DevToConfig) {
    super(config);
    this.apiKey = config.apiKey;
    
    this.client = axios.create({
      baseURL: 'https://dev.to/api',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
        'User-Agent': 'auto-crosspost/1.0'
      },
      timeout: config.timeout || 30000
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      response => response,
      error => {
        const platformError = this.transformError(error);
        this.logger?.error('Dev.to API error', { error: platformError });
        throw platformError;
      }
    );
  }

  public async authenticate(): Promise<boolean> {
    try {
      const response = await this.client.get('/users/me');
      this.logger?.info('Dev.to authentication successful', { 
        username: response.data.username 
      });
      return true;
    } catch (error) {
      this.logger?.error('Dev.to authentication failed', { error });
      throw new AuthenticationError('Invalid Dev.to API key');
    }
  }

  public async createPost(post: Post): Promise<PlatformPost> {
    this.validatePost(post);
    
    const devtoPost = this.transformToDevToPost(post);
    
    const response = await this.executeWithRetry(async () => {
      return await this.client.post('/articles', {
        article: devtoPost
      });
    });

    const createdArticle: DevToArticle = response.data;
    
    this.logger?.info('Dev.to post created successfully', { 
      id: createdArticle.id,
      title: createdArticle.title 
    });

    return this.transformToPlatformPost(createdArticle);
  }

  public async updatePost(platformId: string, post: Post): Promise<PlatformPost> {
    this.validatePost(post);
    
    const devtoPost = this.transformToDevToPost(post);
    
    const response = await this.executeWithRetry(async () => {
      return await this.client.put(`/articles/${platformId}`, {
        article: devtoPost
      });
    });

    const updatedArticle: DevToArticle = response.data;
    
    this.logger?.info('Dev.to post updated successfully', { 
      id: updatedArticle.id,
      title: updatedArticle.title 
    });

    return this.transformToPlatformPost(updatedArticle);
  }

  public async getPost(platformId: string): Promise<PlatformPost> {
    const response = await this.executeWithRetry(async () => {
      return await this.client.get(`/articles/${platformId}`);
    });

    const article: DevToArticle = response.data;
    return this.transformToPlatformPost(article);
  }

  public async deletePost(platformId: string): Promise<boolean> {
    await this.executeWithRetry(async () => {
      return await this.client.delete(`/articles/${platformId}`);
    });

    this.logger?.info('Dev.to post deleted successfully', { id: platformId });
    return true;
  }

  public async listPosts(_options?: ListPostsOptions): Promise<PlatformPost[]> {
    return this.getAllPosts();
  }

  public async getAllPosts(): Promise<PlatformPost[]> {
    const response = await this.executeWithRetry(async () => {
      return await this.client.get('/articles/me');
    });

    const articles: DevToArticle[] = response.data;
    return articles.map(article => this.transformToPlatformPost(article));
  }

  private transformToDevToPost(post: Post): DevToPost {
    const devtoPost: DevToPost = {
      title: post.title,
      body_markdown: post.content,
      published: post.publishStatus === 'published'
    };

    if (post.description) {
      devtoPost.description = post.description;
    }
    
    if (post.tags) {
      devtoPost.tags = post.tags.join(', ');
    }
    
    if (post.canonicalUrl) {
      devtoPost.canonical_url = post.canonicalUrl;
    }
    
    if (post.coverImage) {
      devtoPost.main_image = post.coverImage;
    }

    return devtoPost;
  }

  private transformToPlatformPost(article: DevToArticle): PlatformPost {
    const platformPost: PlatformPost = {
      platformId: article.id.toString(),
      platform: this.name,
      title: article.title,
      content: article.body_markdown || '',
      publishStatus: article.published ? 'published' : 'draft',
      platformUrl: article.url,
      stats: {
        views: article.page_views_count || 0,
        likes: article.positive_reactions_count || 0,
        comments: article.comments_count || 0
      }
    };

    if (article.description) {
      platformPost.description = article.description;
    }

    if (article.tag_list && article.tag_list.length > 0) {
      platformPost.tags = article.tag_list;
    }

    if (article.canonical_url) {
      platformPost.canonicalUrl = article.canonical_url;
    }

    if (article.cover_image) {
      platformPost.coverImage = article.cover_image;
    }

    if (article.published_at) {
      platformPost.publishedAt = new Date(article.published_at);
    }

    if (article.edited_at) {
      platformPost.updatedAt = new Date(article.edited_at);
    }

    return platformPost;
  }

  protected validatePost(post: Post): void {
    super.validatePost(post);

    // Dev.to specific validation
    if (post.title.length > 100) {
      throw new ValidationError('Dev.to post title cannot exceed 100 characters');
    }

    if (post.tags && post.tags.length > 4) {
      throw new ValidationError('Dev.to posts can have maximum 4 tags');
    }

    if (post.tags) {
      for (const tag of post.tags) {
        if (tag.length > 20) {
          throw new ValidationError('Dev.to tag cannot exceed 20 characters');
        }
        if (!/^[a-zA-Z0-9]+$/.test(tag)) {
          throw new ValidationError('Dev.to tags can only contain alphanumeric characters');
        }
      }
    }
  }

  protected transformError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return new AuthenticationError('Invalid Dev.to API key');
        case 403:
          return new AuthenticationError('Dev.to API access forbidden');
        case 422:
          return new ValidationError(`Dev.to validation error: ${data.error || 'Invalid data'}`);
        case 429:
          return new PlatformError('Dev.to rate limit exceeded', 'RATE_LIMIT');
        case 500:
        case 502:
        case 503:
        case 504:
          return new PlatformError('Dev.to server error', 'SERVER_ERROR');
        default:
          return new PlatformError(`Dev.to API error: ${data.error || 'Unknown error'}`, 'API_ERROR');
      }
    }

    if (error.code === 'ECONNABORTED') {
      return new PlatformError('Dev.to request timeout', 'TIMEOUT');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new PlatformError('Dev.to connection failed', 'CONNECTION_ERROR');
    }

    return new PlatformError(`Dev.to unexpected error: ${error.message}`, 'UNKNOWN');
  }
}
