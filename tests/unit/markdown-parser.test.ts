import { MarkdownParser } from '../../src/utils/markdown-parser';
import { createMockMarkdownFile } from '../test-utils';

describe('MarkdownParser', () => {
  describe('parseContent', () => {
    it('should parse markdown with frontmatter correctly', () => {
      const markdown = createMockMarkdownFile({
        title: 'Test Post',
        description: 'A test post',
        tags: ['test', 'markdown'],
        publishedAt: '2024-01-15',
      });

      const result = MarkdownParser.parseContent(markdown);

      expect(result).toBeDefined();
      expect(result.frontmatter.title).toBe('Test Post');
      expect(result.frontmatter.description).toBe('A test post');
      expect(result.frontmatter.tags).toEqual(['test', 'markdown']);
      expect(result.content).toContain('# Test Post');
    });

    it('should handle markdown without frontmatter', () => {
      const markdown = '# Simple Post\n\nThis is just content.';

      const result = MarkdownParser.parseContent(markdown);

      expect(result).toBeDefined();
      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(markdown);
    });

    it('should extract frontmatter and content separately', () => {
      const markdown = createMockMarkdownFile(
        { description: 'A test post' },
        '# Content Title\n\nContent here.'
      );

      const result = MarkdownParser.parseContent(markdown);

      expect(result.frontmatter.description).toBe('A test post');
      expect(result.content).toContain('# Content Title');
      expect(result.content).toContain('Content here.');
    });
  });

  describe('toPost', () => {
    it('should convert MarkdownFile to Post correctly', () => {
      const markdownFile = MarkdownParser.parseContent(createMockMarkdownFile({
        title: 'Test Post',
        description: 'A test post',
        tags: ['test', 'markdown'],
        publishedAt: '2024-01-15',
        canonicalUrl: 'https://example.com/test-post',
        coverImage: 'https://example.com/cover.jpg',
      }));

      const post = MarkdownParser.toPost(markdownFile);

      expect(post.title).toBe('Test Post');
      expect(post.description).toBe('A test post');
      expect(post.tags).toEqual(['test', 'markdown']);
      expect(post.publishedAt).toBeInstanceOf(Date);
      expect(post.canonicalUrl).toBe('https://example.com/test-post');
      expect(post.coverImage).toBe('https://example.com/cover.jpg');
      expect(post.publishStatus).toBe('published');
    });

    it('should extract title from content if not in frontmatter', () => {
      const markdownFile = MarkdownParser.parseContent(createMockMarkdownFile(
        { description: 'A test post' }, // No title in frontmatter
        '# Extracted Title\n\nContent here.'
      ));

      const post = MarkdownParser.toPost(markdownFile);

      expect(post.title).toBe('Extracted Title');
    });

    it('should handle invalid date formats gracefully', () => {
      const markdownFile = MarkdownParser.parseContent(createMockMarkdownFile({
        publishedAt: 'invalid-date',
      }));

      const post = MarkdownParser.toPost(markdownFile);

      expect(post.publishedAt).toBeUndefined();
    });

    it('should handle boolean publish status', () => {
      const publishedMarkdown = MarkdownParser.parseContent(createMockMarkdownFile({
        published: true,
      }));

      const draftMarkdown = MarkdownParser.parseContent(createMockMarkdownFile({
        published: false,
      }));

      const publishedPost = MarkdownParser.toPost(publishedMarkdown);
      const draftPost = MarkdownParser.toPost(draftMarkdown);

      expect(publishedPost.publishStatus).toBe('published');
      expect(draftPost.publishStatus).toBe('draft');
    });

    it('should handle string publish status', () => {
      const publishedMarkdown = MarkdownParser.parseContent(createMockMarkdownFile({
        publishStatus: 'published',
      }));

      const draftMarkdown = MarkdownParser.parseContent(createMockMarkdownFile({
        publishStatus: 'draft',
      }));

      const publishedPost = MarkdownParser.toPost(publishedMarkdown);
      const draftPost = MarkdownParser.toPost(draftMarkdown);

      expect(publishedPost.publishStatus).toBe('published');
      expect(draftPost.publishStatus).toBe('draft');
    });

    it('should default to draft status when not specified', () => {
      const markdownFile = MarkdownParser.parseContent(createMockMarkdownFile({}));

      const post = MarkdownParser.toPost(markdownFile);

      expect(post.publishStatus).toBe('draft');
    });

    it('should preserve all content including frontmatter content', () => {
      const content = '# Test Post\n\nThis is **bold** content with `code`.';
      const markdownFile = MarkdownParser.parseContent(createMockMarkdownFile(
        { title: 'Frontmatter Title' },
        content
      ));

      const post = MarkdownParser.toPost(markdownFile);

      expect(post.content).toBe(content);
      expect(post.title).toBe('Frontmatter Title'); // Should use frontmatter title over extracted
    });
  });

  describe('validateFrontmatter', () => {
    it('should validate required frontmatter fields', () => {
      const validFrontmatter = {
        title: 'Test Post',
        tags: ['test', 'typescript'],
        published: true,
      };

      expect(() => MarkdownParser.validateFrontmatter(validFrontmatter)).not.toThrow();
    });

    it('should throw error for missing title', () => {
      const invalidFrontmatter = {
        tags: ['test'],
        published: true,
      };

      expect(() => MarkdownParser.validateFrontmatter(invalidFrontmatter))
        .toThrow('Missing title in frontmatter');
    });

    it('should validate tags format', () => {
      const invalidTagsFrontmatter = {
        title: 'Test Post',
        tags: 'not-an-array-or-string',
        published: true,
      };

      expect(() => MarkdownParser.validateFrontmatter(invalidTagsFrontmatter))
        .toThrow('Tags must be an array or comma-separated string');
    });

    it('should validate boolean fields', () => {
      const invalidBooleanFrontmatter = {
        title: 'Test Post',
        published: 'not-a-boolean',
      };

      expect(() => MarkdownParser.validateFrontmatter(invalidBooleanFrontmatter))
        .toThrow('Published field must be a boolean');
    });
  });

  describe('generateFrontmatter', () => {
    it('should generate YAML frontmatter correctly', () => {
      const post = {
        title: 'Test Post',
        content: '# Content',
        description: 'A test post',
        tags: ['test', 'typescript'],
        publishStatus: 'published' as const,
        canonicalUrl: 'https://example.com/test',
        coverImage: 'https://example.com/cover.jpg',
        publishedAt: new Date('2024-01-15T10:00:00Z'),
      };

      const frontmatter = MarkdownParser.generateFrontmatter(post);

      expect(frontmatter).toContain('title: Test Post');
      expect(frontmatter).toContain('published: true');
      expect(frontmatter).toContain('description: A test post');
      expect(frontmatter).toContain('tags:\n  - test\n  - typescript');
      expect(frontmatter).toContain('canonical_url: https://example.com/test');
    });

    it('should generate JSON frontmatter when specified', () => {
      const post = {
        title: 'Test Post',
        content: '# Content',
        publishStatus: 'published' as const,
      };

      const frontmatter = MarkdownParser.generateFrontmatter(post, 'json');

      const parsed = JSON.parse(frontmatter);
      expect(parsed.title).toBe('Test Post');
      expect(parsed.published).toBe(true);
    });
  });
});
