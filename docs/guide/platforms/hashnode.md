# Hashnode Integration

Complete guide for integrating with Hashnode platform.

## Overview

Hashnode is a free developer blogging platform that allows you to publish articles on your custom domain and grow your developer brand. The Auto-CrossPost SDK provides seamless integration with Hashnode's GraphQL API.

## Getting Started

### 1. Get Your Personal Access Token

1. Go to [Hashnode Settings](https://hashnode.com/settings)
2. Navigate to "Developer" → "Personal Access Tokens"
3. Click "Generate New Token"
4. Give it a descriptive name (e.g., "Auto-CrossPost SDK")
5. Copy the token for configuration

### 2. Get Your Publication ID (Optional)

If you want to publish to a specific publication:

1. Go to your Hashnode dashboard
2. Navigate to your publication settings
3. Find the Publication ID in the URL or settings
4. Copy the ID for configuration

::: warning Security Note
Keep your personal access token secure and never commit it to version control. Use environment variables instead.
:::

### 3. Configure Hashnode

Add your Hashnode configuration:

```json
{
  "platforms": {
    "hashnode": {
      "token": "your-hashnode-personal-access-token",
      "publicationId": "your-publication-id",
      "defaultTags": ["typescript", "javascript"]
    }
  }
}
```

Or use environment variables:

```bash
HASHNODE_TOKEN=your_hashnode_token
HASHNODE_PUBLICATION_ID=your_publication_id
```

## Features

### Supported Operations

- ✅ **Create Articles**: Publish new articles with full metadata
- ✅ **Update Articles**: Modify existing articles  
- ✅ **Delete Articles**: Remove published articles
- ✅ **Get Articles**: Retrieve article information
- ✅ **Draft Management**: Save and publish drafts
- ✅ **Cover Images**: Upload and set cover images
- ✅ **Tags**: Add unlimited tags per article
- ✅ **Series**: Organize articles into series
- ✅ **Canonical URLs**: Set canonical URLs for SEO
- ✅ **Custom Slugs**: Set custom URL slugs
- ✅ **Publication Publishing**: Publish to specific publications

### Article Metadata

Hashnode supports rich frontmatter in your markdown:

```markdown
---
title: "Getting Started with TypeScript"
subtitle: "A comprehensive guide to TypeScript fundamentals"
tags: ["typescript", "javascript", "programming", "tutorial", "beginners"]
canonical_url: "https://yourblog.com/typescript-guide"
cover_image: "https://example.com/cover.jpg"
series: "TypeScript Mastery"
slug: "getting-started-typescript"
published: true
publication_id: "your-publication-id"
---

# Getting Started with TypeScript

Your article content here...
```

## Configuration Options

### Basic Configuration

```typescript
interface HashnodeConfig {
  token: string              // Required: Your Hashnode personal access token
  publicationId?: string     // Optional: Publication ID to publish to
  defaultTags?: string[]     // Optional: Default tags for all posts
}
```

### Advanced Configuration

```json
{
  "platforms": {
    "hashnode": {
      "token": "your-token",
      "publicationId": "your-publication-id",
      "defaultTags": ["webdev", "programming"],
      "options": {
        "autoPublish": false,
        "defaultSeries": "My Blog Series",
        "defaultCoverImage": "https://example.com/default-cover.jpg",
        "enableComments": true,
        "hideFromHashnodeFeed": false
      }
    }
  }
}
```

## Content Guidelines

### Title Requirements

- Maximum 255 characters
- Should be descriptive and engaging
- No special formatting required (Hashnode handles display)

### Content Formatting

Hashnode supports standard Markdown with extensions:

```markdown
# Headers (H1-H6)

**Bold text** and *italic text*

`inline code` and code blocks with syntax highlighting:

```javascript
console.log("Hello, Hashnode!")
```

> Blockquotes for highlighting important information

- Bullet lists
1. Numbered lists

[Links](https://example.com) and images:
![Alt text](https://example.com/image.jpg)

Tables:
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

Math expressions (LaTeX):
$$E = mc^2$$

Inline math: $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$
```

### Tags

- Unlimited tags per article
- Tags should be lowercase and descriptive
- Use existing popular tags when possible
- Common tags: `javascript`, `typescript`, `react`, `nodejs`, `webdev`, `programming`, `tutorial`, `beginners`

### Cover Images

- Recommended size: 1600x840 pixels (1.9:1 ratio)
- Supported formats: JPG, PNG, GIF, WebP
- Maximum file size: 25MB
- Images should be relevant and high-quality

## API Usage

### Post a New Article

```typescript
import { CrossPostSDK } from 'auto-crosspost'

const sdk = new CrossPostSDK(config)

const result = await sdk.postToPlatform('hashnode', {
  title: "Building GraphQL APIs with Node.js",
  content: "# Introduction\n\nIn this tutorial...",
  subtitle: "Learn how to build scalable GraphQL APIs",
  tags: ["nodejs", "graphql", "api", "tutorial"],
  publishStatus: "published",
  canonicalUrl: "https://yourblog.com/graphql-api",
  coverImage: "https://example.com/graphql-cover.jpg",
  slug: "building-graphql-apis-nodejs"
})

if (result.success) {
  console.log(`Article published: ${result.platformPost?.url}`)
}
```

### Update an Existing Article

```typescript
const result = await sdk.updatePost('hashnode', 'post-id', {
  title: "Building GraphQL APIs with Node.js (Updated)",
  content: "# Introduction\n\nIn this updated tutorial...",
  tags: ["nodejs", "graphql", "api", "tutorial", "updated"]
})
```

### Publish to Specific Publication

```typescript
const result = await sdk.postToPlatform('hashnode', {
  title: "Team Article",
  content: "# Team Content\n\nThis will be published to our publication...",
  tags: ["team", "announcement"],
  publishStatus: "published",
  metadata: {
    publicationId: "your-publication-id"
  }
})
```

### Handle Series

```typescript
// Create first article in series
const firstPost = await sdk.postToPlatform('hashnode', {
  title: "TypeScript Basics - Part 1: Introduction",
  content: "# Introduction to TypeScript\n\n...",
  tags: ["typescript", "series", "beginners"],
  metadata: {
    series: "TypeScript Mastery"
  }
})

// Add second article to same series
const secondPost = await sdk.postToPlatform('hashnode', {
  title: "TypeScript Basics - Part 2: Types",
  content: "# Understanding TypeScript Types\n\n...",
  tags: ["typescript", "series", "types"],
  metadata: {
    series: "TypeScript Mastery"
  }
})
```

## Error Handling

Common errors and how to handle them:

### Authentication Errors

```typescript
try {
  const result = await sdk.postToPlatform('hashnode', post)
} catch (error) {
  if (error.code === 'AUTH_INVALID_TOKEN') {
    console.error('Invalid Hashnode token. Please check your configuration.')
  }
}
```

### Validation Errors

```typescript
if (error.code === 'VALIDATION_MISSING_TITLE') {
  console.error('Article title is required')
}

if (error.code === 'VALIDATION_INVALID_PUBLICATION') {
  console.error('Invalid publication ID provided')
}
```

### GraphQL Errors

```typescript
if (error.code === 'GRAPHQL_ERROR') {
  console.error('GraphQL API error:', error.details)
  // Check if it's a rate limit or server error
  if (error.retryable) {
    console.log('This error can be retried')
  }
}
```

## Best Practices

### Content Strategy

1. **Write Comprehensive Titles**: Include keywords and be descriptive
2. **Add Subtitles**: Provide additional context with subtitles
3. **Use High-Quality Cover Images**: Visual content increases engagement
4. **Organize with Series**: Group related articles together
5. **Tag Strategically**: Use relevant and popular tags
6. **Engage with Community**: Respond to comments and feedback

### SEO Optimization

1. **Set Canonical URLs**: Point to your original blog for SEO
2. **Use Custom Slugs**: Create SEO-friendly URL structures
3. **Optimize Cover Images**: Use descriptive alt text and proper sizing
4. **Cross-link Articles**: Reference your other articles within content
5. **Consistent Tagging**: Build authority in specific topics

### Technical Tips

1. **Test with Drafts**: Always test with draft posts first
2. **Monitor Rate Limits**: Respect GraphQL API rate limits
3. **Handle Errors Gracefully**: Implement proper error handling
4. **Cache Responses**: Reduce unnecessary API calls
5. **Use Publications**: Leverage team publications for broader reach

## GraphQL Schema

Hashnode uses GraphQL. Here are key schema elements:

### Mutations

```graphql
# Create a new post
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    post {
      id
      title
      url
      slug
      publishedAt
    }
  }
}

# Update existing post
mutation UpdatePost($input: UpdatePostInput!) {
  updatePost(input: $input) {
    post {
      id
      title
      url
    }
  }
}

# Delete post
mutation RemovePost($input: RemovePostInput!) {
  removePost(input: $input) {
    post {
      id
    }
  }
}
```

### Queries

```graphql
# Get post by ID
query GetPost($id: ObjectId!) {
  post(id: $id) {
    id
    title
    content
    url
    slug
    tags
    publishedAt
    author {
      name
      username
    }
  }
}

# Get user's posts
query GetUserPosts($username: String!, $page: Int!) {
  user(username: $username) {
    posts(page: $page) {
      nodes {
        id
        title
        url
        publishedAt
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Invalid Token
```bash
Error: Invalid personal access token
```
**Solution**: Verify your token in Hashnode settings and update configuration.

#### Publication Not Found
```bash
Error: Publication not found
```
**Solution**: Check that the publication ID is correct and you have permission to publish.

#### Slug Already Exists
```bash
Error: Post with this slug already exists
```
**Solution**: Use a different slug or update the existing post instead.

#### Content Too Long
```bash
Error: Content exceeds maximum length
```
**Solution**: Hashnode has generous limits, but consider breaking very long content into series.

### Debug Mode

Enable debug logging to troubleshoot issues:

```json
{
  "options": {
    "logLevel": "debug"
  }
}
```

This will output detailed GraphQL request/response information.

## Rate Limits

Hashnode GraphQL API rate limits:

- **1000 requests per hour** per token
- **100 requests per minute** for mutations
- **200 requests per minute** for queries

The SDK automatically handles rate limiting with exponential backoff retry logic.

## Migration Guide

### From Manual Posting

If you're currently posting manually to Hashnode:

1. **Export Existing Articles**: Use Hashnode's export feature or API
2. **Convert to Markdown**: Ensure proper frontmatter format
3. **Test with Drafts**: Always test automation with draft posts
4. **Gradual Migration**: Start with new articles, then migrate old ones

### From Other Platforms

When migrating content from other platforms:

1. **Update Image URLs**: Ensure images are accessible
2. **Convert Syntax**: Adapt platform-specific syntax to Hashnode
3. **Map Tags**: Convert tags to Hashnode's format
4. **Test Series**: Verify series organization works correctly

## Examples

### Basic Article Posting

```typescript
import { CrossPostSDK, MarkdownParser } from 'auto-crosspost'

// Parse markdown file
const parser = new MarkdownParser()
const parsed = await parser.parseFile('./posts/my-article.md')

// Create SDK instance
const sdk = new CrossPostSDK(config)

// Post to Hashnode
const result = await sdk.postToPlatform('hashnode', {
  title: parsed.frontmatter.title,
  content: parsed.content,
  subtitle: parsed.frontmatter.subtitle,
  tags: parsed.frontmatter.tags,
  publishStatus: parsed.frontmatter.published ? 'published' : 'draft',
  canonicalUrl: parsed.frontmatter.canonical_url,
  coverImage: parsed.frontmatter.cover_image,
  slug: parsed.frontmatter.slug
})

console.log(`Posted to Hashnode: ${result.platformPost?.url}`)
```

### Series Management

```typescript
// Create a series of related articles
const seriesName = "Advanced TypeScript Patterns"
const articles = [
  {
    title: "Advanced TypeScript Patterns - Part 1: Conditional Types",
    file: "conditional-types.md"
  },
  {
    title: "Advanced TypeScript Patterns - Part 2: Mapped Types", 
    file: "mapped-types.md"
  },
  {
    title: "Advanced TypeScript Patterns - Part 3: Template Literal Types",
    file: "template-literals.md"
  }
]

for (const [index, article] of articles.entries()) {
  const parsed = await parser.parseFile(`./posts/${article.file}`)
  
  const result = await sdk.postToPlatform('hashnode', {
    title: article.title,
    content: parsed.content,
    tags: ['typescript', 'advanced', 'patterns', 'series'],
    publishStatus: 'published',
    metadata: {
      series: seriesName
    }
  })
  
  console.log(`Part ${index + 1} posted: ${result.platformPost?.url}`)
  
  // Wait between posts to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 2000))
}
```

### Publication Team Posting

```typescript
// Post to team publication
const teamConfig = {
  platforms: {
    hashnode: {
      token: process.env.HASHNODE_TOKEN,
      publicationId: process.env.TEAM_PUBLICATION_ID
    }
  }
}

const teamSDK = new CrossPostSDK(teamConfig)

const result = await teamSDK.postToPlatform('hashnode', {
  title: "Team Announcement: New Product Launch",
  content: "# Exciting News!\n\nWe're thrilled to announce...",
  tags: ['announcement', 'product', 'team'],
  publishStatus: 'published',
  coverImage: 'https://team.com/announcement-cover.jpg'
})
```

## Next Steps

- [Dev.to Integration](/guide/platforms/devto) - Set up Dev.to platform
- [Configuration Guide](/guide/configuration) - Advanced configuration options
- [API Reference](/api/) - Complete API documentation
