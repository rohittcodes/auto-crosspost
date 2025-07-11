# Auto-CrossPost SDK

A TypeScript SDK for automatically cross-posting markdown/MDX blog posts to multiple platforms including Dev.to and Hashnode.

## Features

- 🚀 **Multi-platform support**: Dev.to and Hashnode integration
- 📝 **Markdown parsing**: Full frontmatter support with automatic content extraction
- 🔄 **Retry logic**: Built-in retry mechanisms with exponential backoff
- 🏷️ **Tag management**: Platform-specific tag validation and transformation
- 📊 **Comprehensive logging**: Detailed logging for debugging and monitoring
- 🎯 **TypeScript first**: Full type safety and IntelliSense support
- 🧪 **Highly testable**: Modular architecture with dependency injection
- 🛡️ **Error handling**: Robust error handling with custom error types
- 📦 **Batch processing**: Process multiple posts with concurrency control
- 👀 **File watching**: Automatically process new/changed posts
- ⏰ **Scheduling**: Cron-based scheduling for recurring operations
- 🎛️ **Queue management**: Advanced job queue with retry logic

## Installation

```bash
npm install auto-crosspost
```

## Quick Start

### 1. Configuration

Create a configuration file `crosspost.config.json`:

```json
{
  "platforms": {
    "devto": {
      "apiKey": "your-devto-api-key",
      "defaultTags": ["webdev", "programming"]
    },
    "hashnode": {
      "token": "your-hashnode-token",
      "publicationId": "your-publication-id",
      "defaultTags": ["webdev", "programming"]
    }
  },
  "defaults": {
    "publishStatus": "published",
    "tags": ["crosspost"]
  },
  "options": {
    "logLevel": "info",
    "retryAttempts": 3
  }
}
```

### 2. Basic Usage

```typescript
import { AutoCrossPost } from 'auto-crosspost';
import config from './crosspost.config.json';

const sdk = new AutoCrossPost(config);

// Cross-post from a markdown file
const result = await sdk.crossPostFromFile('./my-blog-post.md');

console.log(`Posted to ${result.successful} platforms successfully!`);
```

### 3. CLI Usage

Generate a configuration file:
```bash
npx auto-crosspost config
```

Cross-post a markdown file:
```bash
npx auto-crosspost post ./my-blog-post.md
```

Test platform authentication:
```bash
npx auto-crosspost test
```

List posts from a platform:
```bash
npx auto-crosspost list devto --limit 5
```

### 4. GitHub Actions Integration

Automate your cross-posting with GitHub Actions. Add this workflow to `.github/workflows/crosspost.yml`:

```yaml
name: Auto CrossPost

on:
  push:
    branches: [main]
    paths: ['posts/**/*.md']

jobs:
  crosspost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g auto-crosspost
      - name: Cross-post changed files
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          echo '{"platforms":{"devto":{"apiKey":"'$DEVTO_API_KEY'"},"hashnode":{"accessToken":"'$HASHNODE_ACCESS_TOKEN'","publicationId":"'$HASHNODE_PUBLICATION_ID'"}}}' > config.json
          git diff --name-only HEAD~1 HEAD -- '*.md' | xargs -I {} auto-crosspost post "{}" --config config.json
```

Generate workflows with the built-in generator:
```bash
npx auto-crosspost github-actions generate basic
npx auto-crosspost github-actions validate workflow .github/workflows/crosspost.yml
```

See our [GitHub Actions Examples](./examples/github-actions/) for more advanced workflows.

## API Reference

### AutoCrossPost Class

#### Constructor
```typescript
new AutoCrossPost(config: CrossPostConfig, logger?: Logger)
```

#### Methods

##### `crossPost(post: Post, platforms?: string[]): Promise<BatchCrossPostResult>`
Cross-post a post object to specified platforms.

##### `crossPostFromFile(filePath: string, platforms?: string[]): Promise<BatchCrossPostResult>`
Cross-post from a markdown file.

##### `crossPostFromContent(content: string, platforms?: string[]): Promise<BatchCrossPostResult>`
Cross-post from markdown content string.

##### `updatePost(platformId: string, post: Post, platform: string): Promise<PlatformPost>`
Update an existing post on a specific platform.

##### `deletePost(platformId: string, platform: string): Promise<boolean>`
Delete a post from a specific platform.

##### `getPost(platformId: string, platform: string): Promise<PlatformPost>`
Retrieve a post from a specific platform.

##### `listPosts(platform: string, options?: ListOptions): Promise<PlatformPost[]>`
List posts from a specific platform.

##### `testAuthentication(): Promise<Record<string, boolean>>`
Test authentication for all configured platforms.

### Frontmatter Support

The SDK supports rich frontmatter in your markdown files:

```yaml
---
title: "My Awesome Blog Post"
description: "A comprehensive guide to building awesome things"
tags: ["javascript", "typescript", "webdev"]
published: true
date: "2025-01-15"
canonical_url: "https://myblog.com/awesome-post"
cover_image: "https://myblog.com/images/cover.jpg"

# Platform-specific overrides
devto:
  tags: ["javascript", "beginners"]
hashnode:
  subtitle: "Learn the fundamentals"
---
```

### Error Handling

The SDK provides detailed error types for better debugging:

```typescript
import { CrossPostError, AuthenticationError, ValidationError } from 'auto-crosspost';

try {
  await sdk.crossPostFromFile('./post.md');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof CrossPostError) {
    console.error('Cross-post error:', error.message, error.platform);
  }
}
```

## Platform-Specific Features

### Dev.to
- REST API integration
- Support for organization posting
- Tag validation (max 4 tags, alphanumeric only)
- Article analytics (views, reactions, comments)

### Hashnode
- GraphQL API integration
- Publication support
- Rich metadata handling
- Advanced tag management

## Advanced Usage

### Custom Logger Integration

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'crosspost.log' })
  ]
});

const sdk = new AutoCrossPost(config, logger);
```

### Platform-Specific Posting

```typescript
// Post only to Dev.to
await sdk.crossPost(post, ['devto']);

// Post only to Hashnode
await sdk.crossPost(post, ['hashnode']);
```

### Batch Operations

```typescript
const posts = [post1, post2, post3];
const results = await Promise.all(
  posts.map(post => sdk.crossPost(post))
);
```

## Batch Processing

For processing multiple posts at once:

```typescript
import { BatchProcessor, BatchProgressReporter } from 'auto-crosspost';

// Create batch processor
const processor = new BatchProcessor({
  concurrency: 3,    // Process 3 files simultaneously
  delay: 1000,       // Wait 1 second between requests
  skipDrafts: true   // Skip unpublished posts
});

// Process multiple files
const files = ['post1.md', 'post2.md', 'post3.md'];
const results = await processor.processFiles(files);

// Track progress
const reporter = new BatchProgressReporter(files.length);
results.forEach(result => reporter.reportProgress(result));
reporter.printFinalReport();
```

### File Watching

Automatically process posts when files change:

```typescript
import { FileWatcher } from 'auto-crosspost';

const watcher = new FileWatcher('./posts', {
  ignoreInitial: false,  // Process existing files on startup
  skipDrafts: true,      // Skip draft posts
  concurrency: 2         // Process 2 files at once
});

// Watcher will automatically queue and process new/changed posts
console.log('Watching for file changes...');
```

### Scheduling

Schedule recurring batch operations:

```typescript
import { CrossPostScheduler } from 'auto-crosspost';

const scheduler = new CrossPostScheduler({
  batchOptions: {
    concurrency: 2,
    delay: 2000,
    skipDrafts: true
  }
});

// Schedule daily at 9:00 AM
scheduler.scheduleDaily('09:00', './posts');

// Schedule weekly on Monday at 10:00 AM
scheduler.scheduleWeekly(1, '10:00', './posts');

// Custom cron expression
scheduler.scheduleCustom('0 */6 * * *', './posts'); // Every 6 hours
```

### Queue Management

Use the job queue for complex workflows:

```typescript
import { CrossPostQueue } from 'auto-crosspost';

const queue = new CrossPostQueue({ concurrency: 5 });

// Listen for events
queue.on('jobCompleted', (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

queue.on('jobFailed', (job) => {
  console.log(`❌ Job failed: ${job.error}`);
});

// Add jobs
await queue.addJob({
  type: 'crosspost',
  post: {
    title: 'My Post',
    content: 'Post content...',
    tags: ['demo'],
    publishStatus: 'published'
  }
});

// Monitor status
const status = queue.getStatus();
console.log(`Processing: ${status.processingJobs}, Pending: ${status.pendingJobs}`);
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## API Keys Setup

### Dev.to API Key
1. Go to [Dev.to Settings](https://dev.to/settings/extensions)
2. Generate a new API key
3. Add it to your configuration file

### Hashnode Token
1. Go to [Hashnode Settings](https://hashnode.com/settings/developer)
2. Generate a personal access token
3. Find your publication ID from your publication's settings
4. Add both to your configuration file

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/rohittcodes/auto-crosspost/issues)
- Documentation: [Full documentation](https://github.com/rohittcodes/auto-crosspost/wiki)

---

Made with ❤️ for the developer community
