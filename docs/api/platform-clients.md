# Platform Clients API

Platform-specific client implementations.

## Dev.to Client

```typescript
import { DevtoClient } from 'auto-crosspost'

const client = new DevtoClient({ apiKey: 'your-api-key' })
```

### Methods

- `authenticate()`: Verify API credentials
- `createArticle(post)`: Create a new article
- `updateArticle(id, post)`: Update existing article
- `getArticles()`: Get user's articles

## Hashnode Client

```typescript
import { HashnodeClient } from 'auto-crosspost'

const client = new HashnodeClient({ 
  token: 'your-token',
  publicationId: 'your-publication-id'
})
```

### Methods

- `authenticate()`: Verify API credentials
- `createPost(post)`: Create a new post
- `updatePost(id, post)`: Update existing post
- `getPosts()`: Get publication posts

## Common Interface

All platform clients implement the `PlatformClient` interface:

```typescript
interface PlatformClient {
  name: string
  authenticate(): Promise<boolean>
  createPost(post: Post): Promise<PlatformPost>
  updatePost(platformId: string, post: Post): Promise<PlatformPost>
  deletePost(platformId: string): Promise<boolean>
  getPost(platformId: string): Promise<PlatformPost | null>
  getUserPosts(): Promise<PlatformPost[]>
}
```

---

**Next:** [Types Reference](/api/types)
