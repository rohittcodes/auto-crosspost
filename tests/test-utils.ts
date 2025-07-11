import { Post, PlatformPost } from '../src/core/types';

/**
 * Test data factory for creating mock posts and platform posts
 * Provides consistent test data across all test suites
 */

export const createMockPost = (overrides: Partial<Post> = {}): Post => {
  return {
    title: 'Test Blog Post',
    content: `# Test Blog Post

This is a test blog post content with some **markdown** formatting.

## Code Example

\`\`\`typescript
const hello = 'world';
console.log(hello);
\`\`\`

End of test content.`,
    description: 'A test blog post for the Auto-CrossPost SDK',
    tags: ['test', 'typescript', 'blogging'],
    canonicalUrl: 'https://example.com/blog/test-post',
    publishStatus: 'published',
    coverImage: 'https://example.com/images/test-cover.jpg',
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
};

export const createMockDevToPost = (overrides: Partial<PlatformPost> = {}): PlatformPost => {
  return {
    platformId: 'devto-123456',
    platform: 'Dev.to',
    title: 'Test Blog Post',
    content: '# Test Blog Post\n\nThis is test content.',
    description: 'A test blog post',
    tags: ['test', 'typescript'],
    canonicalUrl: 'https://example.com/blog/test-post',
    publishStatus: 'published',
    platformUrl: 'https://dev.to/username/test-blog-post-123456',
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    stats: {
      views: 150,
      likes: 12,
      comments: 5,
    },
    ...overrides,
  };
};

export const createMockHashnodePost = (overrides: Partial<PlatformPost> = {}): PlatformPost => {
  return {
    platformId: 'hashnode-abc123',
    platform: 'Hashnode',
    title: 'Test Blog Post',
    content: '# Test Blog Post\n\nThis is test content.',
    description: 'A test blog post',
    tags: ['test', 'typescript'],
    canonicalUrl: 'https://example.com/blog/test-post',
    publishStatus: 'published',
    platformUrl: 'https://username.hashnode.dev/test-blog-post',
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    stats: {
      views: 200,
      likes: 18,
      comments: 8,
    },
    ...overrides,
  };
};

export const createMockMarkdownFile = (frontmatter: Record<string, any> = {}, content: string = ''): string => {
  const defaultFrontmatter = {
    title: 'Test Blog Post',
    description: 'A test blog post',
    publishedAt: '2024-01-15',
    tags: ['test', 'typescript'],
    ...frontmatter,
  };

  const frontmatterYaml = Object.entries(defaultFrontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n  - ${value.join('\n  - ')}`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join('\n');

  const defaultContent = content || `# ${defaultFrontmatter.title}

This is a test blog post with some content.

## Features
- Markdown support
- Code blocks
- Lists

\`\`\`typescript
const example = 'Hello, world!';
\`\`\`

That's all for now!`;

  return `---
${frontmatterYaml}
---

${defaultContent}`;
};

export const createMockConfig = () => {
  return {
    platforms: {
      devto: {
        apiKey: 'test-devto-api-key',
        baseUrl: 'https://dev.to/api',
      },
      hashnode: {
        token: 'test-hashnode-token',
        publicationId: 'test-publication-id',
      },
    },
    retryAttempts: 3,
    retryDelay: 1000,
  };
};

export const createMockLogger = () => {
  return {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
};

// API Response Mocks
export const mockDevToApiResponses = {
  createArticle: {
    id: 123456,
    title: 'Test Blog Post',
    description: 'A test blog post',
    url: 'https://dev.to/username/test-blog-post-123456',
    slug: 'test-blog-post-123456',
    published: true,
    published_at: '2024-01-15T10:00:00Z',
    tag_list: ['test', 'typescript'],
    canonical_url: 'https://example.com/blog/test-post',
    cover_image: 'https://example.com/images/test-cover.jpg',
    body_markdown: '# Test Blog Post\n\nContent here.',
    public_reactions_count: 12,
    comments_count: 5,
    page_views_count: 150,
  },
  
  updateArticle: {
    id: 123456,
    title: 'Updated Test Blog Post',
    description: 'An updated test blog post',
    url: 'https://dev.to/username/updated-test-blog-post-123456',
    slug: 'updated-test-blog-post-123456',
    published: true,
    published_at: '2024-01-15T10:00:00Z',
    tag_list: ['test', 'typescript', 'updated'],
    canonical_url: 'https://example.com/blog/test-post',
    cover_image: 'https://example.com/images/test-cover.jpg',
    body_markdown: '# Updated Test Blog Post\n\nUpdated content here.',
    public_reactions_count: 15,
    comments_count: 7,
    page_views_count: 200,
  },
};

export const mockHashnodeApiResponses = {
  createPost: {
    publishPost: {
      post: {
        id: 'hashnode-abc123',
        title: 'Test Blog Post',
        subtitle: 'A test blog post',
        url: 'https://username.hashnode.dev/test-blog-post',
        slug: 'test-blog-post',
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        content: {
          markdown: '# Test Blog Post\n\nContent here.',
        },
        tags: [
          { id: 'tag1', name: 'test', slug: 'test' },
          { id: 'tag2', name: 'typescript', slug: 'typescript' },
        ],
        canonicalUrl: 'https://example.com/blog/test-post',
        coverImage: { url: 'https://example.com/images/test-cover.jpg' },
        views: 200,
        reactionCount: 18,
        responseCount: 8,
      },
    },
  },
  
  me: {
    me: {
      id: 'user123',
      username: 'testuser',
      name: 'Test User',
    },
  },
};
