import matter from 'gray-matter';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import { Post, MarkdownFile } from '../core/types.js';

/**
 * Utility class for parsing markdown and MDX files with frontmatter
 */
export class MarkdownParser {
  /**
   * Parse a markdown file from disk
   */
  static async parseFile(filePath: string): Promise<MarkdownFile> {
    try {
      const content = await readFile(filePath, 'utf8');
      const extension = extname(filePath);
      
      if (!['.md', '.mdx', '.markdown'].includes(extension.toLowerCase())) {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      const parsed = matter(content);
      
      return {
        path: filePath,
        frontmatter: parsed.data,
        content: parsed.content
      };
    } catch (error) {
      throw new Error(`Failed to parse markdown file ${filePath}: ${error}`);
    }
  }

  /**
   * Parse markdown content from a string
   */
  static parseContent(content: string): MarkdownFile {
    const parsed = matter(content);
    
    return {
      path: '',
      frontmatter: parsed.data,
      content: parsed.content
    };
  }

  /**
   * Convert a MarkdownFile to a Post object
   */
  static toPost(markdownFile: MarkdownFile): Post {
    const frontmatter = markdownFile.frontmatter;
    
    // Extract title
    let title = frontmatter.title;
    if (!title) {
      // Try to extract title from the first heading in the content
      const titleMatch = markdownFile.content.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    }

    // Extract description/excerpt
    let description = frontmatter.description || frontmatter.excerpt || frontmatter.summary;
    if (!description) {
      // Try to extract first paragraph as description
      const paragraphs = markdownFile.content
        .split('\n\n')
        .filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('```'))
        .map(p => p.replace(/\n/g, ' ').trim());
      
      if (paragraphs.length > 0) {
        description = paragraphs[0].substring(0, 200);
        if (paragraphs[0].length > 200) {
          description += '...';
        }
      }
    }

    // Extract tags
    let tags = frontmatter.tags || frontmatter.categories || [];
    if (typeof tags === 'string') {
      tags = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }

    // Extract publish status
    const publishStatus = frontmatter.published === false || frontmatter.draft === true 
      ? 'draft' 
      : 'published';

    // Extract published date
    let publishedAt: Date | undefined;
    if (frontmatter.date || frontmatter.publishedAt || frontmatter.published_at) {
      const dateValue = frontmatter.date || frontmatter.publishedAt || frontmatter.published_at;
      publishedAt = new Date(dateValue);
      
      if (isNaN(publishedAt.getTime())) {
        publishedAt = undefined;
      }
    }

    // Extract canonical URL
    const canonicalUrl = frontmatter.canonical_url || frontmatter.canonicalUrl || frontmatter.canonical;

    // Extract cover image
    const coverImage = frontmatter.cover_image || frontmatter.coverImage || frontmatter.image || frontmatter.hero;

    const post: Post = {
      title,
      content: markdownFile.content,
      publishStatus
    };

    if (description) {
      post.description = description;
    }

    if (tags.length > 0) {
      post.tags = tags;
    }

    if (canonicalUrl) {
      post.canonicalUrl = canonicalUrl;
    }

    if (coverImage) {
      post.coverImage = coverImage;
    }

    if (publishedAt) {
      post.publishedAt = publishedAt;
    }

    return post;
  }

  /**
   * Validate frontmatter contains required fields for cross-posting
   */
  static validateFrontmatter(frontmatter: Record<string, any>): void {
    const errors: string[] = [];

    if (!frontmatter.title) {
      errors.push('Missing title in frontmatter');
    }

    if (frontmatter.tags && !Array.isArray(frontmatter.tags) && typeof frontmatter.tags !== 'string') {
      errors.push('Tags must be an array or comma-separated string');
    }

    if (frontmatter.published !== undefined && typeof frontmatter.published !== 'boolean') {
      errors.push('Published field must be a boolean');
    }

    if (frontmatter.draft !== undefined && typeof frontmatter.draft !== 'boolean') {
      errors.push('Draft field must be a boolean');
    }

    if (frontmatter.date && isNaN(new Date(frontmatter.date).getTime())) {
      errors.push('Invalid date format');
    }

    if (errors.length > 0) {
      throw new Error(`Frontmatter validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Extract frontmatter schema for a specific platform
   */
  static extractPlatformConfig(frontmatter: Record<string, any>, platform: string): Record<string, any> {
    const platformConfig = frontmatter[platform.toLowerCase()] || frontmatter[platform] || {};
    
    return {
      ...platformConfig,
      // Include global overrides
      ...(frontmatter.canonical_url && { canonical_url: frontmatter.canonical_url }),
      ...(frontmatter.cover_image && { cover_image: frontmatter.cover_image })
    };
  }

  /**
   * Generate frontmatter string from Post object
   */
  static generateFrontmatter(post: Post, format: 'yaml' | 'json' = 'yaml'): string {
    const frontmatter: Record<string, any> = {
      title: post.title,
      published: post.publishStatus === 'published'
    };

    if (post.description) {
      frontmatter.description = post.description;
    }

    if (post.tags && post.tags.length > 0) {
      frontmatter.tags = post.tags;
    }

    if (post.canonicalUrl) {
      frontmatter.canonical_url = post.canonicalUrl;
    }

    if (post.coverImage) {
      frontmatter.cover_image = post.coverImage;
    }

    if (post.publishedAt) {
      frontmatter.date = post.publishedAt.toISOString();
    }

    if (format === 'json') {
      return JSON.stringify(frontmatter, null, 2);
    }

    // Generate YAML frontmatter
    const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        const arrayItems = value.map(item => `  - ${item}`).join('\n');
        return `${key}:\n${arrayItems}`;
      }
      
      if (typeof value === 'string' && (value.includes('\n') || value.includes(':'))) {
        return `${key}: |
  ${value.replace(/\n/g, '\n  ')}`;
      }
      
      return `${key}: ${value}`;
    });

    return `---\n${yamlLines.join('\n')}\n---`;
  }

  /**
   * Create a complete markdown file with frontmatter
   */
  static createMarkdownFile(post: Post, frontmatterFormat: 'yaml' | 'json' = 'yaml'): string {
    const frontmatter = this.generateFrontmatter(post, frontmatterFormat);
    return `${frontmatter}\n\n${post.content}`;
  }
}
