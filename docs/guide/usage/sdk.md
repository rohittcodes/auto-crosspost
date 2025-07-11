# SDK Usage

Learn how to integrate the Auto-CrossPost SDK into your applications.

## Installation

Install the SDK as a dependency in your project:

```bash
npm install auto-crosspost
# or
yarn add auto-crosspost
# or
pnpm add auto-crosspost
```

## Basic Setup

### 1. Import the SDK

```typescript
import { CrossPostSDK, ConfigManager } from 'auto-crosspost'
```

### 2. Load Configuration

```typescript
// Load from config file and environment variables
const config = await ConfigManager.loadConfig()

// Or provide configuration directly
const config = {
  platforms: {
    devto: {
      apiKey: process.env.DEVTO_API_KEY
    },
    hashnode: {
      token: process.env.HASHNODE_TOKEN,
      publicationId: process.env.HASHNODE_PUBLICATION_ID
    }
  },
  defaults: {
    publishStatus: 'draft',
    tags: ['typescript', 'javascript']
  }
}
```

### 3. Initialize SDK

```typescript
const sdk = new CrossPostSDK(config)
```

## Core Operations

### Post to All Platforms

```typescript
const post = {
  title: "Getting Started with TypeScript",
  content: "# Introduction\n\nTypeScript is a powerful...",
  description: "Learn TypeScript fundamentals",
  tags: ["typescript", "javascript", "programming"],
  publishStatus: "published" as const,
  canonicalUrl: "https://yourblog.com/typescript-guide"
}

const results = await sdk.postToAll(post)

// Handle results
results.forEach(result => {
  if (result.success) {
    console.log(`✅ Posted to ${result.platform}: ${result.platformPost?.url}`)
  } else {
    console.error(`❌ Failed to post to ${result.platform}: ${result.error?.message}`)
  }
})
```

### Post to Specific Platform

```typescript
// Post only to Dev.to
const result = await sdk.postToPlatform('devto', post)

if (result.success) {
  console.log(`Article ID: ${result.platformPost?.platformId}`)
  console.log(`URL: ${result.platformPost?.url}`)
} else {
  console.error(`Error: ${result.error?.message}`)
}
```

### Update Existing Post

```typescript
const updatedPost = {
  title: "Getting Started with TypeScript (Updated)",
  content: "# Introduction\n\nTypeScript is even more powerful...",
  tags: ["typescript", "javascript", "programming", "updated"]
}

const result = await sdk.updatePost('devto', 'existing-post-id', updatedPost)
```

### Delete Post

```typescript
await sdk.deletePost('devto', 'post-id')
```

### Retrieve Post

```typescript
const post = await sdk.getPost('hashnode', 'post-id')
console.log(post.title, post.url)
```

## Working with Markdown Files

### Parse Markdown Files

```typescript
import { MarkdownParser } from 'auto-crosspost'

const parser = new MarkdownParser()

// Parse file with frontmatter
const parsed = await parser.parseFile('./posts/my-article.md')

console.log(parsed.frontmatter) // { title: "...", tags: [...] }
console.log(parsed.content)     // Markdown content without frontmatter
```

### Convert to Post Object

```typescript
const post = {
  title: parsed.frontmatter.title || parsed.title,
  content: parsed.content,
  description: parsed.frontmatter.description || parsed.description,
  tags: parsed.frontmatter.tags || parsed.tags || [],
  publishStatus: parsed.frontmatter.published ? 'published' : 'draft',
  canonicalUrl: parsed.frontmatter.canonical_url || parsed.canonicalUrl,
  coverImage: parsed.frontmatter.cover_image
}

const results = await sdk.postToAll(post)
```

## Error Handling

### Basic Error Handling

```typescript
try {
  const results = await sdk.postToAll(post)
  
  for (const result of results) {
    if (!result.success) {
      console.error(`Failed to post to ${result.platform}:`, result.error?.message)
      
      // Check if error is retryable
      if (result.error?.retryable) {
        console.log('This error can be retried')
      }
    }
  }
} catch (error) {
  console.error('SDK Error:', error.message)
}
```

### Advanced Error Handling

```typescript
import { CrossPostError } from 'auto-crosspost'

try {
  const results = await sdk.postToAll(post)
} catch (error) {
  if (error instanceof CrossPostError) {
    switch (error.code) {
      case 'AUTH_INVALID_API_KEY':
        console.error('Invalid API key. Please check your configuration.')
        break
      case 'VALIDATION_MISSING_TITLE':
        console.error('Post title is required.')
        break
      case 'PLATFORM_RATE_LIMITED':
        console.error('Rate limited. Please wait and try again.')
        break
      default:
        console.error('Unknown error:', error.message)
    }
  }
}
```

### Retry Logic

```typescript
async function postWithRetry(sdk: CrossPostSDK, post: Post, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const results = await sdk.postToAll(post)
      return results
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

const results = await postWithRetry(sdk, post)
```

## Configuration Management

### Loading Configuration

```typescript
// Load from default locations
const config = await ConfigManager.loadConfig()

// Load from specific file
const config = await ConfigManager.loadConfig('./my-config.json')

// Load with overrides
const config = await ConfigManager.loadConfig(undefined, {
  options: {
    logLevel: 'debug'
  }
})
```

### Saving Configuration

```typescript
await ConfigManager.saveConfig(config, './saved-config.json')
```

### Merging Configurations

```typescript
const baseConfig = await ConfigManager.loadConfig('./base.json')
const environmentConfig = {
  platforms: {
    devto: { apiKey: process.env.DEVTO_API_KEY }
  }
}

const mergedConfig = ConfigManager.mergeConfigs(baseConfig, environmentConfig)
```

## Batch Processing

### Process Multiple Files

```typescript
import fs from 'fs/promises'
import path from 'path'

async function batchPost(directory: string) {
  const files = await fs.readdir(directory)
  const markdownFiles = files.filter(file => file.endsWith('.md'))
  
  const parser = new MarkdownParser()
  const sdk = new CrossPostSDK(await ConfigManager.loadConfig())
  
  for (const file of markdownFiles) {
    const filePath = path.join(directory, file)
    
    try {
      // Parse markdown
      const parsed = await parser.parseFile(filePath)
      
      // Convert to post
      const post = {
        title: parsed.frontmatter.title,
        content: parsed.content,
        tags: parsed.frontmatter.tags || [],
        publishStatus: parsed.frontmatter.published ? 'published' : 'draft'
      }
      
      // Post to platforms
      const results = await sdk.postToAll(post)
      
      console.log(`Processed ${file}:`)
      results.forEach(result => {
        console.log(`  ${result.platform}: ${result.success ? '✅' : '❌'}`)
      })
      
      // Rate limiting - wait between posts
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message)
    }
  }
}

await batchPost('./posts')
```

### Parallel Processing

```typescript
async function parallelBatchPost(directory: string, concurrency = 3) {
  const files = await fs.readdir(directory)
  const markdownFiles = files.filter(file => file.endsWith('.md'))
  
  const parser = new MarkdownParser()
  const sdk = new CrossPostSDK(await ConfigManager.loadConfig())
  
  // Process files in batches
  for (let i = 0; i < markdownFiles.length; i += concurrency) {
    const batch = markdownFiles.slice(i, i + concurrency)
    
    const promises = batch.map(async (file) => {
      const filePath = path.join(directory, file)
      const parsed = await parser.parseFile(filePath)
      
      const post = {
        title: parsed.frontmatter.title,
        content: parsed.content,
        tags: parsed.frontmatter.tags || [],
        publishStatus: 'draft' // Always draft for batch processing
      }
      
      return sdk.postToAll(post)
    })
    
    const results = await Promise.all(promises)
    console.log(`Processed batch ${Math.floor(i / concurrency) + 1}`)
    
    // Wait between batches to respect rate limits
    if (i + concurrency < markdownFiles.length) {
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}
```

## TypeScript Integration

### Type-Safe Configuration

```typescript
import type { CrossPostConfig, Post, CrossPostResult } from 'auto-crosspost'

const config: CrossPostConfig = {
  platforms: {
    devto: {
      apiKey: process.env.DEVTO_API_KEY!
    }
  },
  defaults: {
    publishStatus: 'draft',
    tags: ['typescript']
  }
}

const post: Post = {
  title: "My Post",
  content: "Content here",
  publishStatus: 'published'
}
```

### Custom Type Extensions

```typescript
// Extend the Post interface for your needs
interface CustomPost extends Post {
  author: string
  category: string
  socialMedia?: {
    twitter?: string
    linkedin?: string
  }
}

// Custom transformer function
function transformCustomPost(customPost: CustomPost): Post {
  return {
    title: customPost.title,
    content: customPost.content,
    description: `By ${customPost.author} in ${customPost.category}`,
    tags: [...(customPost.tags || []), customPost.category.toLowerCase()],
    publishStatus: customPost.publishStatus
  }
}
```

## Next.js Integration

### API Route Example

```typescript
// pages/api/crosspost.ts or app/api/crosspost/route.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { CrossPostSDK, ConfigManager } from 'auto-crosspost'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { title, content, tags, publishStatus } = req.body
    
    const config = await ConfigManager.loadConfig()
    const sdk = new CrossPostSDK(config)
    
    const results = await sdk.postToAll({
      title,
      content,
      tags,
      publishStatus
    })
    
    res.status(200).json({ results })
  } catch (error) {
    console.error('Cross-post error:', error)
    res.status(500).json({ error: 'Failed to cross-post' })
  }
}
```

### React Hook

```typescript
// hooks/useCrossPost.ts
import { useState } from 'react'
import type { Post, CrossPostResult } from 'auto-crosspost'

export function useCrossPost() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CrossPostResult[]>([])
  
  const crossPost = async (post: Post) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/crosspost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      })
      
      const data = await response.json()
      setResults(data.results)
      
      return data.results
    } catch (error) {
      console.error('Cross-post failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  return { crossPost, loading, results }
}
```

## Best Practices

### 1. Environment Variables

```typescript
// Use environment variables for sensitive data
const config = {
  platforms: {
    devto: {
      apiKey: process.env.DEVTO_API_KEY
    },
    hashnode: {
      token: process.env.HASHNODE_TOKEN
    }
  }
}
```

### 2. Error Logging

```typescript
import { logger } from 'auto-crosspost'

// Configure logging
logger.configure({
  level: 'info',
  format: 'json',
  filename: 'crosspost.log'
})

try {
  const results = await sdk.postToAll(post)
} catch (error) {
  logger.error('Cross-post failed', { error: error.message, post: post.title })
}
```

### 3. Rate Limiting

```typescript
// Add delays between API calls
await sdk.postToPlatform('devto', post)
await new Promise(resolve => setTimeout(resolve, 1000))
await sdk.postToPlatform('hashnode', post)
```

### 4. Validation

```typescript
function validatePost(post: Partial<Post>): Post {
  if (!post.title?.trim()) {
    throw new Error('Title is required')
  }
  
  if (!post.content?.trim()) {
    throw new Error('Content is required')
  }
  
  return {
    title: post.title.trim(),
    content: post.content.trim(),
    tags: post.tags?.slice(0, 4) || [], // Limit to 4 tags
    publishStatus: post.publishStatus || 'draft'
  }
}

const validatedPost = validatePost(userInput)
```

## Next Steps

- [CLI Usage](/guide/cli) - Use the command-line interface
- [Platform Setup](/guide/platforms/devto) - Configure specific platforms
- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - More usage examples
