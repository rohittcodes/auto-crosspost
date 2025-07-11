# Types Reference

TypeScript type definitions for the Auto-CrossPost SDK.

## Core Types

### Post

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
}
```

### CrossPostConfig

```typescript
interface CrossPostConfig {
  devto?: DevtoConfig
  hashnode?: HashnodeConfig
}
```

### PlatformResult

```typescript
interface PlatformResult {
  platform: string
  success: boolean
  platformId?: string
  url?: string
  error?: string
}
```

## Platform-Specific Types

### DevtoConfig

```typescript
interface DevtoConfig {
  apiKey: string
  organizationId?: number
}
```

### HashnodeConfig

```typescript
interface HashnodeConfig {
  token: string
  publicationId: string
}
```

### DevtoPost

```typescript
interface DevtoPost {
  id: number
  title: string
  description: string
  body_markdown: string
  published: boolean
  url: string
  canonical_url?: string
  cover_image?: string
  tag_list: string[]
}
```

### HashnodePost

```typescript
interface HashnodePost {
  _id: string
  title: string
  brief: string
  contentMarkdown: string
  dateAdded: string
  slug: string
  coverImage?: string
  tags: HashnodeTag[]
}
```

## Utility Types

### BatchResult

```typescript
interface BatchResult {
  total: number
  successful: number
  failed: number
  results: PlatformResult[]
}
```

---

**Back to:** [API Overview](/api/)
