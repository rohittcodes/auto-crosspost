import { AutoCrossPost, DevToConfig, HashnodeConfig, Post } from '../src/index';

// Mock configuration for testing
const testConfig = {
  platforms: {
    devto: {
      apiKey: 'test-key',
      defaultTags: ['test']
    } as DevToConfig,
    hashnode: {
      token: 'test-token',
      publicationId: 'test-pub-id',
      defaultTags: ['test']
    } as HashnodeConfig
  },
  defaults: {
    publishStatus: 'draft' as const,
    tags: ['auto-crosspost']
  }
};

// Sample post for testing
const testPost: Post = {
  title: 'Test Post',
  content: '# Test Post\n\nThis is a test post for the Auto-CrossPost SDK.',
  description: 'A simple test post',
  tags: ['testing', 'sdk'],
  publishStatus: 'draft',
  canonicalUrl: 'https://example.com/test-post'
};

// Test the SDK initialization
console.log('🧪 Testing Auto-CrossPost SDK...');

try {
  const sdk = new AutoCrossPost(testConfig, {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  });

  console.log('✅ SDK initialized successfully');
  console.log('📋 Configured platforms:', sdk.getConfiguredPlatforms());
  
  // Test markdown parsing
  const markdownContent = `---
title: "Sample Blog Post"
description: "This is a sample blog post"
tags: ["javascript", "typescript", "programming"]
published: true
date: "2025-01-01"
canonical_url: "https://example.com/sample-post"
cover_image: "https://example.com/cover.jpg"
---

# Sample Blog Post

This is the content of the sample blog post.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Conclusion

Thank you for reading!`;

  const { MarkdownParser } = await import('../src/utils/markdown-parser');
  const markdownFile = MarkdownParser.parseContent(markdownContent);
  const parsedPost = MarkdownParser.toPost(markdownFile);
  
  console.log('✅ Markdown parsing successful');
  console.log('📝 Parsed post:', {
    title: parsedPost.title,
    tags: parsedPost.tags,
    publishStatus: parsedPost.publishStatus
  });

  console.log('\n🎉 All tests passed! The SDK is ready to use.');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
