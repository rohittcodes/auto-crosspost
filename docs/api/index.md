# API Reference

Complete API documentation for the Auto-CrossPost SDK.

## Core Classes

### CrossPostSDK

The main SDK class for managing cross-posting operations.

```typescript
import { CrossPostSDK } from 'auto-crosspost'

const sdk = new CrossPostSDK(config)
```

#### Constructor

```typescript
constructor(config: CrossPostConfig)
```

Creates a new SDK instance with the provided configuration.

**Parameters:**
- `config` (`CrossPostConfig`): Configuration object

#### Methods

##### postToAll

```typescript
async postToAll(post: Post): Promise<CrossPostResult[]>
```

Post content to all configured platforms.

**Parameters:**
- `post` (`Post`): The post data to publish

**Returns:**
- `Promise<CrossPostResult[]>`: Array of results from each platform

**Example:**
```typescript
const results = await sdk.postToAll({
  title: "My Blog Post",
  content: "# Hello World\n\nThis is my post content.",
  tags: ["javascript", "typescript"],
  publishStatus: "published"
})
```

##### postToPlatform

```typescript
async postToPlatform(platformName: string, post: Post): Promise<CrossPostResult>
```

Post content to a specific platform.

**Parameters:**
- `platformName` (`string`): Name of the platform ('devto' | 'hashnode')
- `post` (`Post`): The post data to publish

**Returns:**
- `Promise<CrossPostResult>`: Result from the platform

##### updatePost

```typescript
async updatePost(platformName: string, platformId: string, post: Post): Promise<CrossPostResult>
```

Update an existing post on a platform.

**Parameters:**
- `platformName` (`string`): Name of the platform
- `platformId` (`string`): Platform-specific post ID
- `post` (`Post`): Updated post data

**Returns:**
- `Promise<CrossPostResult>`: Result from the platform

##### deletePost

```typescript
async deletePost(platformName: string, platformId: string): Promise<void>
```

Delete a post from a platform.

**Parameters:**
- `platformName` (`string`): Name of the platform
- `platformId` (`string`): Platform-specific post ID

##### getPost

```typescript
async getPost(platformName: string, platformId: string): Promise<PlatformPost>
```

Retrieve a post from a platform.

**Parameters:**
- `platformName` (`string`): Name of the platform
- `platformId` (`string`): Platform-specific post ID

**Returns:**
- `Promise<PlatformPost>`: The post data from the platform

### MarkdownParser

Parse markdown files and extract metadata.

```typescript
import { MarkdownParser } from 'auto-crosspost'

const parser = new MarkdownParser()
```

#### Methods

##### parseFile

```typescript
async parseFile(filePath: string): Promise<ParsedMarkdown>
```

Parse a markdown file from the filesystem.

**Parameters:**
- `filePath` (`string`): Path to the markdown file

**Returns:**
- `Promise<ParsedMarkdown>`: Parsed content and metadata

##### parseContent

```typescript
parseContent(content: string): ParsedMarkdown
```

Parse markdown content string.

**Parameters:**
- `content` (`string`): Raw markdown content

**Returns:**
- `ParsedMarkdown`: Parsed content and metadata

##### extractFrontmatter

```typescript
extractFrontmatter(content: string): { data: Record<string, any>, content: string }
```

Extract frontmatter from markdown content.

**Parameters:**
- `content` (`string`): Raw markdown content

**Returns:**
- Object with `data` (frontmatter) and `content` (body)

### ConfigManager

Manage configuration loading and saving.

```typescript
import { ConfigManager } from 'auto-crosspost'
```

#### Static Methods

##### loadConfig

```typescript
static async loadConfig(filePath?: string, overrides?: Partial<CrossPostConfig>): Promise<CrossPostConfig>
```

Load configuration from various sources.

**Parameters:**
- `filePath` (`string`, optional): Specific config file path
- `overrides` (`Partial<CrossPostConfig>`, optional): Configuration overrides

**Returns:**
- `Promise<CrossPostConfig>`: Loaded and merged configuration

##### saveConfig

```typescript
static async saveConfig(config: CrossPostConfig, filePath: string): Promise<void>
```

Save configuration to a file.

**Parameters:**
- `config` (`CrossPostConfig`): Configuration to save
- `filePath` (`string`): Target file path

##### generateSampleConfig

```typescript
static generateSampleConfig(): CrossPostConfig
```

Generate a sample configuration object.

**Returns:**
- `CrossPostConfig`: Sample configuration with placeholders

##### mergeConfigs

```typescript
static mergeConfigs(...configs: Partial<CrossPostConfig>[]): CrossPostConfig
```

Merge multiple configuration objects.

**Parameters:**
- `...configs` (`Partial<CrossPostConfig>[]`): Configuration objects to merge

**Returns:**
- `CrossPostConfig`: Merged configuration

## Types

### CrossPostConfig

Main configuration interface.

```typescript
interface CrossPostConfig {
  platforms: {
    devto?: DevToConfig
    hashnode?: HashnodeConfig
  }
  defaults?: {
    tags?: string[]
    publishStatus?: 'draft' | 'published'
    canonicalUrl?: string
  }
  options?: {
    retryAttempts?: number
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    autoSync?: boolean
    watchMode?: boolean
  }
}
```

### Post

Core post data structure.

```typescript
interface Post {
  title: string
  content: string
  description?: string
  tags?: string[]
  canonicalUrl?: string
  publishStatus: 'draft' | 'published'
  coverImage?: string
  publishedAt?: Date
  slug?: string
}
```

### CrossPostResult

Result from a cross-posting operation.

```typescript
interface CrossPostResult {
  platform: string
  success: boolean
  platformPost?: PlatformPost
  error?: CrossPostError
  metadata?: {
    operation: 'create' | 'update' | 'delete'
    duration: number
    retryCount: number
  }
}
```

### PlatformPost

Platform-specific post data.

```typescript
interface PlatformPost {
  platformId: string
  url: string
  title: string
  slug: string
  publishStatus: 'draft' | 'published'
  publishedAt?: Date
  tags: string[]
  viewCount?: number
  likeCount?: number
  commentCount?: number
}
```

### ParsedMarkdown

Parsed markdown content and metadata.

```typescript
interface ParsedMarkdown {
  frontmatter: Record<string, any>
  content: string
  title?: string
  description?: string
  tags?: string[]
  slug?: string
  publishedAt?: Date
  canonicalUrl?: string
}
```

### DevToConfig

Dev.to platform configuration.

```typescript
interface DevToConfig {
  apiKey: string
  defaultTags?: string[]
}
```

### HashnodeConfig

Hashnode platform configuration.

```typescript
interface HashnodeConfig {
  token: string
  publicationId?: string
  defaultTags?: string[]
}
```

### CrossPostError

Error information from cross-posting operations.

```typescript
interface CrossPostError {
  code: string
  message: string
  platform: string
  originalError?: any
  retryable: boolean
}
```

## Error Codes

Common error codes returned by the SDK:

### Authentication Errors
- `AUTH_INVALID_API_KEY`: Invalid API key provided
- `AUTH_TOKEN_EXPIRED`: Authentication token has expired
- `AUTH_INSUFFICIENT_PERMISSIONS`: Insufficient permissions for operation

### Validation Errors
- `VALIDATION_MISSING_TITLE`: Post title is required
- `VALIDATION_MISSING_CONTENT`: Post content is required
- `VALIDATION_INVALID_TAGS`: Invalid tag format or count
- `VALIDATION_CONTENT_TOO_LONG`: Content exceeds platform limits

### Platform Errors
- `PLATFORM_NOT_CONFIGURED`: Platform not configured in settings
- `PLATFORM_API_ERROR`: General API error from platform
- `PLATFORM_RATE_LIMITED`: Rate limit exceeded
- `PLATFORM_POST_NOT_FOUND`: Post not found on platform

### Network Errors
- `NETWORK_CONNECTION_ERROR`: Unable to connect to platform
- `NETWORK_TIMEOUT`: Request timed out
- `NETWORK_DNS_ERROR`: DNS resolution failed

### File System Errors
- `FILE_NOT_FOUND`: Markdown file not found
- `FILE_READ_ERROR`: Unable to read file
- `FILE_INVALID_FORMAT`: Invalid file format

## Usage Examples

### Basic SDK Usage

```typescript
import { CrossPostSDK, ConfigManager } from 'auto-crosspost'

// Load configuration
const config = await ConfigManager.loadConfig()

// Create SDK instance
const sdk = new CrossPostSDK(config)

// Post to all platforms
const results = await sdk.postToAll({
  title: "Getting Started with TypeScript",
  content: "# Introduction\n\nTypeScript is...",
  tags: ["typescript", "javascript", "programming"],
  publishStatus: "published"
})

// Check results
results.forEach(result => {
  if (result.success) {
    console.log(`Posted to ${result.platform}: ${result.platformPost?.url}`)
  } else {
    console.error(`Failed to post to ${result.platform}: ${result.error?.message}`)
  }
})
```

### Error Handling

```typescript
try {
  const results = await sdk.postToAll(post)
  
  for (const result of results) {
    if (!result.success && result.error?.retryable) {
      console.log(`Retrying ${result.platform}...`)
      // Implement retry logic
    }
  }
} catch (error) {
  if (error.code === 'VALIDATION_MISSING_TITLE') {
    console.error('Please provide a title for your post')
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

### File Processing

```typescript
import { MarkdownParser } from 'auto-crosspost'

const parser = new MarkdownParser()

// Parse markdown file
const parsed = await parser.parseFile('./posts/my-post.md')

// Convert to post
const post: Post = {
  title: parsed.title || parsed.frontmatter.title,
  content: parsed.content,
  tags: parsed.tags || parsed.frontmatter.tags,
  publishStatus: parsed.frontmatter.published ? 'published' : 'draft',
  canonicalUrl: parsed.canonicalUrl
}

// Post to platforms
const results = await sdk.postToAll(post)
```

## Next Steps

- [Platform Guides](/guide/platforms/) - Platform-specific documentation
- [Examples](/examples/) - Complete usage examples
- [CLI Reference](/guide/cli/) - Command-line interface documentation
