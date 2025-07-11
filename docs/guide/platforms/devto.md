# Dev.to Integration

Complete guide for integrating with Dev.to platform.

## Overview

Dev.to (dev.to) is a community of developers where you can share your articles and connect with other developers. The Auto-CrossPost SDK provides seamless integration with Dev.to's REST API.

## Getting Started

### 1. Get Your API Key

1. Go to [Dev.to Settings](https://dev.to/settings/account)
2. Navigate to "Account" → "DEV Community API Keys"
3. Generate a new API key
4. Copy the key for configuration

::: warning Security Note
Keep your API key secure and never commit it to version control. Use environment variables instead.
:::

### 2. Configure Dev.to

Add your Dev.to configuration:

```json
{
  "platforms": {
    "devto": {
      "apiKey": "your-devto-api-key",
      "defaultTags": ["typescript", "javascript"]
    }
  }
}
```

Or use environment variables:

```bash
DEVTO_API_KEY=your_devto_api_key
```

## Features

### Supported Operations

- ✅ **Create Articles**: Publish new articles with full metadata
- ✅ **Update Articles**: Modify existing articles
- ✅ **Delete Articles**: Remove published articles
- ✅ **Get Articles**: Retrieve article information
- ✅ **Draft Management**: Save and publish drafts
- ✅ **Cover Images**: Upload and set cover images
- ✅ **Tags**: Add up to 4 tags per article
- ✅ **Series**: Organize articles into series
- ✅ **Canonical URLs**: Set canonical URLs for SEO

### Article Metadata

Dev.to supports rich frontmatter in your markdown:

```markdown
---
title: "Getting Started with TypeScript"
description: "A comprehensive guide to TypeScript fundamentals"
tags: ["typescript", "javascript", "programming", "tutorial"]
canonical_url: "https://yourblog.com/typescript-guide"
cover_image: "https://example.com/cover.jpg"
series: "TypeScript Mastery"
published: true
---

# Getting Started with TypeScript

Your article content here...
```

## Configuration Options

### Basic Configuration

```typescript
interface DevToConfig {
  apiKey: string           // Required: Your Dev.to API key
  defaultTags?: string[]   // Optional: Default tags for all posts
}
```

### Advanced Configuration

```json
{
  "platforms": {
    "devto": {
      "apiKey": "your-api-key",
      "defaultTags": ["typescript", "webdev"],
      "options": {
        "autoPublish": false,
        "defaultSeries": "My Blog Series",
        "defaultCoverImage": "https://example.com/default-cover.jpg"
      }
    }
  }
}
```

## Content Guidelines

### Title Requirements

- Maximum 255 characters
- Should be descriptive and engaging
- Avoid excessive capitalization or special characters

### Content Formatting

Dev.to supports standard Markdown with some extensions:

```markdown
# Headers (H1-H6)

**Bold text** and *italic text*

`inline code` and code blocks:

```javascript
console.log("Hello, Dev.to!")
```

> Blockquotes for highlighting important information

- Bullet lists
1. Numbered lists

[Links](https://example.com) and images:
![Alt text](https://example.com/image.jpg)
```

### Tags

- Maximum 4 tags per article
- Tags should be lowercase
- Use existing popular tags when possible
- Common tags: `javascript`, `typescript`, `react`, `nodejs`, `webdev`, `programming`, `tutorial`, `beginners`

### Cover Images

- Recommended size: 1000x420 pixels
- Supported formats: JPG, PNG, GIF
- Maximum file size: 25MB
- Images should be relevant to your content

## API Usage

### Post a New Article

```typescript
import { CrossPostSDK } from 'auto-crosspost'

const sdk = new CrossPostSDK(config)

const result = await sdk.postToPlatform('devto', {
  title: "Building REST APIs with Node.js",
  content: "# Introduction\n\nIn this tutorial...",
  description: "Learn how to build scalable REST APIs",
  tags: ["nodejs", "api", "javascript", "tutorial"],
  publishStatus: "published",
  canonicalUrl: "https://yourblog.com/nodejs-api"
})

if (result.success) {
  console.log(`Article published: ${result.platformPost?.url}`)
}
```

### Update an Existing Article

```typescript
const result = await sdk.updatePost('devto', 'article-id', {
  title: "Building REST APIs with Node.js (Updated)",
  content: "# Introduction\n\nIn this updated tutorial...",
  tags: ["nodejs", "api", "javascript", "tutorial", "updated"]
})
```

### Handle Drafts

```typescript
// Save as draft
const draftResult = await sdk.postToPlatform('devto', {
  title: "Work in Progress",
  content: "# Coming Soon\n\nThis article is being written...",
  publishStatus: "draft"
})

// Later, publish the draft
const publishResult = await sdk.updatePost('devto', draftResult.platformPost?.platformId, {
  publishStatus: "published"
})
```

## Error Handling

Common errors and how to handle them:

### Authentication Errors

```typescript
try {
  const result = await sdk.postToPlatform('devto', post)
} catch (error) {
  if (error.code === 'AUTH_INVALID_API_KEY') {
    console.error('Invalid Dev.to API key. Please check your configuration.')
  }
}
```

### Validation Errors

```typescript
if (error.code === 'VALIDATION_INVALID_TAGS') {
  console.error('Dev.to allows maximum 4 tags per article')
}

if (error.code === 'VALIDATION_CONTENT_TOO_LONG') {
  console.error('Article content exceeds Dev.to limits')
}
```

### Rate Limiting

```typescript
if (error.code === 'PLATFORM_RATE_LIMITED') {
  console.log('Rate limited. Retrying in 60 seconds...')
  await new Promise(resolve => setTimeout(resolve, 60000))
  // Retry the operation
}
```

## Best Practices

### Content Strategy

1. **Write Engaging Titles**: Use descriptive, keyword-rich titles
2. **Add Cover Images**: Visual content increases engagement
3. **Use Relevant Tags**: Help users discover your content
4. **Include Code Examples**: Dev.to audience loves practical examples
5. **Engage with Comments**: Respond to reader feedback

### SEO Optimization

1. **Set Canonical URLs**: Point to your original blog for SEO
2. **Use Consistent Tags**: Build authority in specific topics
3. **Cross-link Articles**: Reference your other articles
4. **Optimize Descriptions**: Write compelling meta descriptions

### Technical Tips

1. **Test with Drafts**: Always test with draft posts first
2. **Monitor Rate Limits**: Respect API rate limits (1000 req/hour)
3. **Handle Errors Gracefully**: Implement proper error handling
4. **Cache API Responses**: Reduce unnecessary API calls

## Troubleshooting

### Common Issues

#### API Key Invalid
```bash
Error: Invalid API key
```
**Solution**: Verify your API key in Dev.to settings and update configuration.

#### Article Not Found
```bash
Error: Article not found
```
**Solution**: Check that the article ID is correct and the article exists.

#### Tag Limit Exceeded
```bash
Error: Too many tags
```
**Solution**: Dev.to allows maximum 4 tags per article.

#### Content Too Long
```bash
Error: Content exceeds maximum length
```
**Solution**: Dev.to has content length limits. Consider breaking into multiple articles.

### Debug Mode

Enable debug logging to troubleshoot issues:

```json
{
  "options": {
    "logLevel": "debug"
  }
}
```

This will output detailed API request/response information.

## Rate Limits

Dev.to API rate limits:

- **1000 requests per hour** per API key
- **30 requests per minute** for article creation
- **10 requests per minute** for article updates

The SDK automatically handles rate limiting with exponential backoff retry logic.

## Migration Guide

### From Manual Posting

If you're currently posting manually to Dev.to:

1. **Export Existing Articles**: Use Dev.to's export feature
2. **Convert to Markdown**: Ensure proper frontmatter format
3. **Test with Drafts**: Always test automation with draft posts
4. **Gradual Migration**: Start with new articles, then migrate old ones

### From Other Tools

When migrating from other cross-posting tools:

1. **Map Configuration**: Convert existing config to Auto-CrossPost format
2. **Update Frontmatter**: Ensure compatibility with Auto-CrossPost parsing
3. **Test Thoroughly**: Verify all features work as expected

## Examples

### Basic Article

```typescript
import { CrossPostSDK, MarkdownParser } from 'auto-crosspost'

// Parse markdown file
const parser = new MarkdownParser()
const parsed = await parser.parseFile('./posts/my-article.md')

// Create SDK instance
const sdk = new CrossPostSDK(config)

// Post to Dev.to
const result = await sdk.postToPlatform('devto', {
  title: parsed.frontmatter.title,
  content: parsed.content,
  description: parsed.frontmatter.description,
  tags: parsed.frontmatter.tags,
  publishStatus: parsed.frontmatter.published ? 'published' : 'draft',
  canonicalUrl: parsed.frontmatter.canonical_url
})

console.log(`Posted to Dev.to: ${result.platformPost?.url}`)
```

### Series Management

```typescript
// Post articles in a series
const seriesArticles = [
  'intro-to-typescript.md',
  'advanced-typescript.md',
  'typescript-in-practice.md'
]

for (const [index, filename] of seriesArticles.entries()) {
  const parsed = await parser.parseFile(`./posts/${filename}`)
  
  const result = await sdk.postToPlatform('devto', {
    title: parsed.frontmatter.title,
    content: parsed.content,
    tags: ['typescript', 'tutorial', 'series'],
    publishStatus: 'published',
    // Add series information in frontmatter
    metadata: {
      series: 'TypeScript Mastery',
      part: index + 1
    }
  })
  
  console.log(`Part ${index + 1} posted: ${result.platformPost?.url}`)
}
```

## Next Steps

- [Hashnode Integration](/guide/platforms/hashnode) - Set up Hashnode platform
- [Configuration Guide](/guide/configuration) - Advanced configuration options
- [API Reference](/api/) - Complete API documentation
