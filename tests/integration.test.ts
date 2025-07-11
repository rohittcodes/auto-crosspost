/**
 * Simple integration test
 * Tests the core functionality without complex mocking
 */

import { MarkdownParser } from '../src/utils/markdown-parser';
import { createMockMarkdownFile } from './test-utils';

describe('Integration Tests', () => {
  it('should parse markdown and convert to post', () => {
    const markdown = createMockMarkdownFile({
      title: 'Integration Test Post',
      description: 'Testing the integration',
      tags: ['test', 'integration'],
    });

    const markdownFile = MarkdownParser.parseContent(markdown);
    const post = MarkdownParser.toPost(markdownFile);

    expect(post.title).toBe('Integration Test Post');
    expect(post.description).toBe('Testing the integration');
    expect(post.tags).toEqual(['test', 'integration']);
    expect(post.content).toContain('# Integration Test Post');
  });

  it('should validate frontmatter correctly', () => {
    const validFrontmatter = {
      title: 'Valid Post',
      tags: ['test'],
      published: true,
    };

    expect(() => MarkdownParser.validateFrontmatter(validFrontmatter)).not.toThrow();
  });

  it('should generate frontmatter from post', () => {
    const post = {
      title: 'Test Post',
      content: '# Test Content',
      publishStatus: 'published' as const,
      tags: ['test', 'example'],
    };

    const frontmatter = MarkdownParser.generateFrontmatter(post);

    expect(frontmatter).toContain('title: Test Post');
    expect(frontmatter).toContain('published: true');
    expect(frontmatter).toContain('tags:');
    expect(frontmatter).toContain('- test');
    expect(frontmatter).toContain('- example');
  });
});
