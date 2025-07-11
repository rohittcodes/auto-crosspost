import { PlatformPost, Post } from '../../core/types.ts';
import { HashnodeArticle, HashnodePost } from './types.ts';

/**
 * Transforms data between common Post format and Hashnode-specific formats
 */
export class HashnodeTransformer {

  /**
   * Transform a Post to Hashnode format
   */
  static toHashnodePost(post: Post, publicationId: string): HashnodePost {
    const hashnodePost: HashnodePost = {
      title: post.title,
      contentMarkdown: post.content,
      publicationId
    };

    if (post.description) {
      hashnodePost.subtitle = post.description;
    }

    if (post.coverImage) {
      hashnodePost.coverImageURL = post.coverImage;
    }

    if (post.canonicalUrl) {
      hashnodePost.originalArticleURL = post.canonicalUrl;
    }

    if (post.tags && post.tags.length > 0) {
      // Transform tags to Hashnode format
      hashnodePost.tags = post.tags.map(tag => ({
        slug: this.sanitizeTag(tag),
        name: tag
      }));
    }

    if (post.publishedAt) {
      hashnodePost.publishedAt = post.publishedAt.toISOString();
    }

    return hashnodePost;
  }

  /**
   * Transform a Hashnode article to PlatformPost format
   */
  static toPlatformPost(article: HashnodeArticle): PlatformPost {
    const platformPost: PlatformPost = {
      platformId: article.id,
      platform: 'Hashnode',
      title: article.title,
      content: article.content.markdown,
      publishStatus: 'published', // Hashnode posts are published when retrieved
      platformUrl: article.url,
      publishedAt: new Date(article.publishedAt),
      stats: {
        views: article.views,
        likes: article.reactionCount,
        comments: article.responseCount
      }
    };

    if (article.subtitle) {
      platformPost.description = article.subtitle;
    }

    if (article.tags && article.tags.length > 0) {
      platformPost.tags = article.tags.map(tag => tag.name);
    }

    if (article.canonicalUrl) {
      platformPost.canonicalUrl = article.canonicalUrl;
    }

    if (article.coverImage?.url) {
      platformPost.coverImage = article.coverImage.url;
    }

    if (article.updatedAt) {
      platformPost.updatedAt = new Date(article.updatedAt);
    }

    return platformPost;
  }

  /**
   * Sanitize a tag for Hashnode format
   */
  private static sanitizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50); // Hashnode tag length limit
  }

  /**
   * Transform multiple articles to platform posts
   */
  static toPlatformPosts(articles: HashnodeArticle[]): PlatformPost[] {
    return articles.map(article => this.toPlatformPost(article));
  }

  /**
   * Validate Hashnode-specific constraints
   */
  static validateForHashnode(post: Post): string[] {
    const errors: string[] = [];

    if (post.title.length > 250) {
      errors.push('Hashnode post title cannot exceed 250 characters');
    }

    if (post.tags && post.tags.length > 5) {
      errors.push('Hashnode posts can have maximum 5 tags');
    }

    if (post.tags) {
      for (const tag of post.tags) {
        if (tag.length > 50) {
          errors.push('Hashnode tag cannot exceed 50 characters');
        }
      }
    }

    return errors;
  }
}
