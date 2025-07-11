# Platform Integration Guides

Learn how to set up and configure Auto-CrossPost with different blogging platforms.

## Supported Platforms

### [Dev.to](/guide/platforms/devto)
- Popular developer blogging platform
- Simple API key authentication
- Supports markdown and cover images
- Built-in tagging system

### [Hashnode](/guide/platforms/hashnode)
- Developer-focused blogging platform
- GraphQL API with Personal Access Token
- Rich metadata support
- Custom publication domains

## Quick Setup

Each platform requires different authentication methods:

```typescript
import { AutoCrosspost } from 'auto-crosspost';

const crosspost = new AutoCrosspost({
  platforms: {
    devto: {
      apiKey: 'your-devto-api-key'
    },
    hashnode: {
      token: 'your-hashnode-token',
      publication: 'your-publication-id'
    }
  }
});
```

## Platform-Specific Features

| Feature | Dev.to | Hashnode |
|---------|--------|----------|
| Markdown Support | ✅ | ✅ |
| Cover Images | ✅ | ✅ |
| Tags | ✅ | ✅ |
| Custom URLs | ✅ | ✅ |
| Drafts | ✅ | ✅ |
| Publication Date | ✅ | ✅ |

## Getting API Keys

- **Dev.to**: Go to Settings → Account → DEV Community API Keys
- **Hashnode**: Go to Settings → Developer → Personal Access Token

## Next Steps

1. Choose your platforms
2. Follow the specific setup guides
3. Configure your project
4. Start cross-posting!

For detailed setup instructions, see the individual platform guides.
