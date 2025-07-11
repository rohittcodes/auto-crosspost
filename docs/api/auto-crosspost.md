# AutoCrossPost API

Main SDK class for cross-posting content.

## Constructor

```typescript
import { AutoCrossPost } from 'auto-crosspost'

const crossPoster = new AutoCrossPost(config)
```

## Methods

### postToAll()

Post content to all configured platforms.

```typescript
async postToAll(post: Post): Promise<PlatformResult[]>
```

### postToPlatform()

Post content to a specific platform.

```typescript
async postToPlatform(platform: string, post: Post): Promise<PlatformResult>
```

## Example

```typescript
import { AutoCrossPost } from 'auto-crosspost'

const crossPoster = new AutoCrossPost({
  devto: { apiKey: 'your-api-key' },
  hashnode: { token: 'your-token', publicationId: 'your-publication-id' }
})

const result = await crossPoster.postToAll({
  title: 'My Blog Post',
  content: '# Hello World\n\nThis is my content.',
  tags: ['javascript', 'tutorial']
})
```

---

**Next:** [ConfigManager API](/api/config-manager)
