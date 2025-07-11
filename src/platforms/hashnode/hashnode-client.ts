import { BaseClient } from '../../core/base-client.js';
import {
  Post,
  PlatformClient,
  PlatformPost,
  ListPostsOptions,
  ValidationError
} from '../../core/types.js';
import { HashnodeConfig } from './types.js';
import { HashnodeApi } from './hashnode-api.js';
import { HashnodeTransformer } from './hashnode-transformer.js';
import { HashnodeErrorHandler } from './hashnode-error-handler.js';

/**
 * Hashnode platform client
 * Orchestrates API calls, data transformation, and error handling
 */
export class HashnodeClient extends BaseClient implements PlatformClient {
  public readonly name = 'Hashnode';
  private api: HashnodeApi;
  private publicationId?: string;

  constructor(config: HashnodeConfig) {
    super(config);
    this.api = new HashnodeApi(config.token);
    
    if (config.publicationId) {
      this.publicationId = config.publicationId;
    }
  }

  public async authenticate(): Promise<boolean> {
    try {
      const user = await this.api.getCurrentUser();
      
      if (!user) {
        throw new ValidationError('Invalid Hashnode token');
      }

      this.logger?.info('Hashnode authentication successful', { 
        username: user.username 
      });
      
      return true;
    } catch (error) {
      this.logger?.error('Hashnode authentication failed', { error });
      throw HashnodeErrorHandler.transformError(error);
    }
  }

  public async createPost(post: Post): Promise<PlatformPost> {
    this.validatePost(post);
    
    if (!this.publicationId) {
      throw new ValidationError('Hashnode publication ID is required');
    }

    try {
      const hashnodePost = HashnodeTransformer.toHashnodePost(post, this.publicationId);
      
      const createdArticle = await this.executeWithRetry(async () => {
        return await this.api.createPost(hashnodePost);
      });
      
      this.logger?.info('Hashnode post created successfully', { 
        id: createdArticle.id,
        title: createdArticle.title,
        url: createdArticle.url
      });

      return HashnodeTransformer.toPlatformPost(createdArticle);
    } catch (error) {
      throw HashnodeErrorHandler.transformError(error);
    }
  }

  public async updatePost(platformId: string, post: Post): Promise<PlatformPost> {
    this.validatePost(post);
    
    if (!this.publicationId) {
      throw new ValidationError('Hashnode publication ID is required');
    }

    try {
      const hashnodePost = HashnodeTransformer.toHashnodePost(post, this.publicationId);
      
      const updatedArticle = await this.executeWithRetry(async () => {
        return await this.api.updatePost(platformId, hashnodePost);
      });
      
      this.logger?.info('Hashnode post updated successfully', { 
        id: updatedArticle.id,
        title: updatedArticle.title,
        url: updatedArticle.url
      });

      return HashnodeTransformer.toPlatformPost(updatedArticle);
    } catch (error) {
      throw HashnodeErrorHandler.transformError(error);
    }
  }

  public async getPost(platformId: string): Promise<PlatformPost> {
    try {
      const article = await this.executeWithRetry(async () => {
        return await this.api.getPost(platformId);
      });

      return HashnodeTransformer.toPlatformPost(article);
    } catch (error) {
      throw HashnodeErrorHandler.transformError(error);
    }
  }

  public async deletePost(platformId: string): Promise<boolean> {
    try {
      await this.executeWithRetry(async () => {
        return await this.api.deletePost(platformId);
      });

      this.logger?.info('Hashnode post deleted successfully', { id: platformId });
      return true;
    } catch (error) {
      throw HashnodeErrorHandler.transformError(error);
    }
  }

  public async listPosts(options?: ListPostsOptions): Promise<PlatformPost[]> {
    if (!this.publicationId) {
      throw new ValidationError('Hashnode publication ID is required to list posts');
    }

    try {
      const first = options?.perPage || 20;
      const publication = await this.executeWithRetry(async () => {
        return await this.api.getPublicationPosts(this.publicationId!, first);
      });

      if (!publication?.posts) {
        return [];
      }

      const articles = publication.posts.edges.map(edge => edge.node);
      return HashnodeTransformer.toPlatformPosts(articles);
    } catch (error) {
      throw HashnodeErrorHandler.transformError(error);
    }
  }

  protected validatePost(post: Post): void {
    super.validatePost(post);

    // Use the transformer's validation method
    const errors = HashnodeTransformer.validateForHashnode(post);
    
    if (errors.length > 0) {
      throw new ValidationError(errors[0]);
    }
  }

  protected transformError(error: any): Error {
    return HashnodeErrorHandler.transformError(error);
  }
}
