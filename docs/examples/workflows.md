# Custom Workflows

## GitHub Actions Workflow

Automatically cross-post when content is pushed to your repository:

```yaml
name: Auto Cross-Post

on:
  push:
    paths:
      - 'content/posts/**'
  workflow_dispatch:

jobs:
  crosspost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install auto-crosspost
      
      - name: Cross-post new articles
        run: |
          npx crosspost-batch ./content/posts/ \
            --devto-api-key "${{ secrets.DEVTO_API_KEY }}" \
            --hashnode-token "${{ secrets.HASHNODE_TOKEN }}"
```

## Scheduled Cross-posting

Use cron jobs or scheduled functions:

```typescript
// Scheduled function (Vercel, Netlify, etc.)
import { AutoCrosspost } from 'auto-crosspost';

export default async function scheduledCrosspost() {
  const crosspost = new AutoCrosspost(config);
  
  // Check for scheduled posts
  const scheduledPosts = await getScheduledPosts();
  
  for (const post of scheduledPosts) {
    if (post.publishDate <= new Date()) {
      await crosspost.postFromFile(post.filePath);
      await markAsPublished(post.id);
    }
  }
}
```

## Content Management Integration

### With CMS Webhooks

```typescript
// Webhook handler for CMS updates
export async function handleCMSWebhook(data: CMSWebhookData) {
  if (data.action === 'publish') {
    const markdown = await convertToMarkdown(data.content);
    await crosspost.postFromContent(markdown, {
      title: data.title,
      tags: data.tags
    });
  }
}
```

### With Git Hooks

```bash
#!/bin/sh
# .git/hooks/post-commit

# Check for new markdown files
git diff --name-only HEAD~1 HEAD | grep '\.md$' | while read file; do
  if [ -f "$file" ]; then
    npx crosspost post "$file"
  fi
done
```

For more workflow examples, see the [main examples](/examples/) page.
