const { AutoCrossPost, MarkdownParser } = require('./dist/index');

console.log('🧪 Testing Auto-CrossPost SDK...');

const testConfig = {
  platforms: {
    devto: {
      apiKey: 'test-key',
      defaultTags: ['test']
    },
    hashnode: {
      token: 'test-token',
      publicationId: 'test-pub-id', 
      defaultTags: ['test']
    }
  },
  defaults: {
    publishStatus: 'draft',
    tags: ['auto-crosspost']
  }
};

try {
  const sdk = new AutoCrossPost(testConfig, {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  });

  console.log('✅ SDK initialized successfully');
  console.log('📋 Configured platforms:', sdk.getConfiguredPlatforms());
  
  const markdownContent = `---
title: "Test Post"
tags: ["test", "sdk"]
published: true
---

# Test Content

This is a test post.`;

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
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
