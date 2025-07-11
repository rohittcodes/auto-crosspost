import { AutoCrossPost } from '../../src/auto-crosspost';
import { createMockConfig, createMockLogger, createMockPost } from '../test-utils';
import { DevToClient } from '../../src/platforms/devto';
import { HashnodeClient } from '../../src/platforms/hashnode';

// Mock the platform clients
jest.mock('../../src/platforms/devto');
jest.mock('../../src/platforms/hashnode');

const MockedDevToClient = DevToClient as jest.MockedClass<typeof DevToClient>;
const MockedHashnodeClient = HashnodeClient as jest.MockedClass<typeof HashnodeClient>;

describe('AutoCrossPost', () => {
  let autoCrossPost: AutoCrossPost;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockConfig: ReturnType<typeof createMockConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    
    // Setup mock implementations
    MockedDevToClient.prototype.authenticate = jest.fn().mockResolvedValue(true);
    MockedDevToClient.prototype.createPost = jest.fn();
    MockedHashnodeClient.prototype.authenticate = jest.fn().mockResolvedValue(true);
    MockedHashnodeClient.prototype.createPost = jest.fn();
  });

  describe('constructor', () => {
    it('should initialize with valid configuration', () => {
      expect(() => {
        autoCrossPost = new AutoCrossPost(mockConfig, mockLogger);
      }).not.toThrow();
    });

    it('should throw error when no platforms are configured', () => {
      const emptyConfig = { platforms: {}, retryAttempts: 3, retryDelay: 1000 };

      expect(() => {
        new AutoCrossPost(emptyConfig, mockLogger);
      }).toThrow('No platforms configured');
    });

    it('should initialize only configured platforms', () => {
      const devToOnlyConfig = {
        platforms: {
          devto: mockConfig.platforms.devto,
        },
        retryAttempts: 3,
        retryDelay: 1000,
      };

      autoCrossPost = new AutoCrossPost(devToOnlyConfig, mockLogger);

      expect(MockedDevToClient).toHaveBeenCalledWith(devToOnlyConfig.platforms.devto);
      expect(MockedHashnodeClient).not.toHaveBeenCalled();
    });
  });

  describe('crossPost', () => {
    beforeEach(() => {
      autoCrossPost = new AutoCrossPost(mockConfig, mockLogger);
    });

    it('should cross-post to all platforms successfully', async () => {
      const mockPost = createMockPost();
      const mockDevToResult = {
        platformId: 'devto-123',
        platform: 'Dev.to',
        title: mockPost.title,
        content: mockPost.content,
        publishStatus: 'published' as const,
        platformUrl: 'https://dev.to/user/test-123',
        publishedAt: new Date(),
      };
      const mockHashnodeResult = {
        platformId: 'hashnode-456',
        platform: 'Hashnode',
        title: mockPost.title,
        content: mockPost.content,
        publishStatus: 'published' as const,
        platformUrl: 'https://user.hashnode.dev/test',
        publishedAt: new Date(),
      };

      MockedDevToClient.prototype.createPost = jest.fn().mockResolvedValue(mockDevToResult);
      MockedHashnodeClient.prototype.createPost = jest.fn().mockResolvedValue(mockHashnodeResult);

      const result = await autoCrossPost.crossPost(mockPost);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].platform).toBe('devto');
      expect(result.results[1].success).toBe(true);
      expect(result.results[1].platform).toBe('hashnode');
    });

    it('should handle partial failures gracefully', async () => {
      const mockPost = createMockPost();
      const mockDevToResult = {
        platformId: 'devto-123',
        platform: 'Dev.to',
        title: mockPost.title,
        content: mockPost.content,
        publishStatus: 'published' as const,
        platformUrl: 'https://dev.to/user/test-123',
        publishedAt: new Date(),
      };
      const hashnodeError = new Error('Hashnode failed');

      MockedDevToClient.prototype.createPost = jest.fn().mockResolvedValue(mockDevToResult);
      MockedHashnodeClient.prototype.createPost = jest.fn().mockRejectedValue(hashnodeError);

      const result = await autoCrossPost.crossPost(mockPost);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].platform).toBe('devto');
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].platform).toBe('hashnode');
      expect(result.results[1].error).toBe('Hashnode failed');
    });

    it('should handle unconfigured platforms', async () => {
      const mockPost = createMockPost();

      const result = await autoCrossPost.crossPost(mockPost, ['unsupported']);

      expect(result.total).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('Platform unsupported not configured');
    });

    it('should allow targeting specific platforms', async () => {
      const mockPost = createMockPost();
      const mockDevToResult = {
        platformId: 'devto-123',
        platform: 'Dev.to',
        title: mockPost.title,
        content: mockPost.content,
        publishStatus: 'published' as const,
        platformUrl: 'https://dev.to/user/test-123',
        publishedAt: new Date(),
      };

      MockedDevToClient.prototype.createPost = jest.fn().mockResolvedValue(mockDevToResult);

      const result = await autoCrossPost.crossPost(mockPost, ['devto']);

      expect(result.total).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].platform).toBe('devto');
      expect(MockedHashnodeClient.prototype.createPost).not.toHaveBeenCalled();
    });
  });

  describe('crossPostFromContent', () => {
    beforeEach(() => {
      autoCrossPost = new AutoCrossPost(mockConfig, mockLogger);
    });

    it('should parse content and cross-post successfully', async () => {
      const markdownContent = `---
title: "Test Post from Content"
description: "A test post"
tags: ["test", "markdown"]
---

# Test Post from Content

This is test content.`;

      const mockDevToResult = {
        platformId: 'devto-123',
        platform: 'Dev.to',
        title: 'Test Post from Content',
        content: '# Test Post from Content\n\nThis is test content.',
        publishStatus: 'published' as const,
        platformUrl: 'https://dev.to/user/test-123',
        publishedAt: new Date(),
      };

      MockedDevToClient.prototype.createPost = jest.fn().mockResolvedValue(mockDevToResult);
      MockedHashnodeClient.prototype.createPost = jest.fn().mockResolvedValue({
        ...mockDevToResult,
        platform: 'Hashnode',
        platformId: 'hashnode-456',
      });

      const result = await autoCrossPost.crossPostFromContent(markdownContent);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(MockedDevToClient.prototype.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post from Content',
          content: '# Test Post from Content\n\nThis is test content.',
        })
      );
    });
  });

  describe('updatePost', () => {
    beforeEach(() => {
      autoCrossPost = new AutoCrossPost(mockConfig, mockLogger);
    });

    it('should update an existing post successfully', async () => {
      const mockPost = createMockPost({ title: 'Updated Post' });
      const mockUpdatedResult = {
        platformId: 'devto-123',
        platform: 'Dev.to',
        title: 'Updated Post',
        content: mockPost.content,
        publishStatus: 'published' as const,
        platformUrl: 'https://dev.to/user/updated-123',
        publishedAt: new Date(),
      };

      MockedDevToClient.prototype.updatePost = jest.fn().mockResolvedValue(mockUpdatedResult);

      const result = await autoCrossPost.updatePost('devto-123', mockPost, 'devto');

      expect(result).toEqual(mockUpdatedResult);
      expect(MockedDevToClient.prototype.authenticate).toHaveBeenCalled();
      expect(MockedDevToClient.prototype.updatePost).toHaveBeenCalledWith('devto-123', mockPost);
    });

    it('should throw error for unconfigured platform', async () => {
      const mockPost = createMockPost();

      await expect(autoCrossPost.updatePost('123', mockPost, 'unsupported'))
        .rejects
        .toThrow('Platform unsupported not configured');
    });
  });

  describe('deletePost', () => {
    beforeEach(() => {
      autoCrossPost = new AutoCrossPost(mockConfig, mockLogger);
    });

    it('should delete a post successfully', async () => {
      MockedDevToClient.prototype.deletePost = jest.fn().mockResolvedValue(true);

      const result = await autoCrossPost.deletePost('devto-123', 'devto');

      expect(result).toBe(true);
      expect(MockedDevToClient.prototype.authenticate).toHaveBeenCalled();
      expect(MockedDevToClient.prototype.deletePost).toHaveBeenCalledWith('devto-123');
    });

    it('should throw error for unconfigured platform', async () => {
      await expect(autoCrossPost.deletePost('123', 'unsupported'))
        .rejects
        .toThrow('Platform unsupported not configured');
    });
  });
});
