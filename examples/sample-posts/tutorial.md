---
title: "Getting Started with Auto-CrossPost SDK"
description: "Learn how to use the Auto-CrossPost SDK to automatically publish your blog posts to multiple platforms"
tags: ["tutorial", "blogging", "automation"]
published: true
canonical_url: "https://myblog.com/auto-crosspost-tutorial"
cover_image: "https://example.com/cover.jpg"
---

# Getting Started with Auto-CrossPost SDK

The Auto-CrossPost SDK makes it easy to automatically publish your blog posts to multiple platforms like Dev.to and Hashnode.

## Installation

```bash
npm install auto-crosspost
```

## Basic Usage

```typescript
import { AutoCrossPost } from 'auto-crosspost';

const sdk = new AutoCrossPost(config);
await sdk.crossPostFromFile('my-post.md');
```

## Batch Processing

For processing multiple posts:

```typescript
import { BatchProcessor } from 'auto-crosspost';

const processor = new BatchProcessor({
  concurrency: 3,
  delay: 1000
});

const results = await processor.processFiles(markdownFiles);
```

That's it! Your posts will be automatically published to all configured platforms.
