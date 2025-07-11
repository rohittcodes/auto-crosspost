# Configuration

Learn how to configure Auto-CrossPost SDK for your specific needs.

## Configuration Methods

Auto-CrossPost SDK supports multiple configuration methods, loaded in order of precedence:

1. **Explicit configuration** (highest priority)
2. **Environment variables**
3. **Local config file**
4. **Global config file**
5. **Default configuration** (lowest priority)

## Configuration File

Create a configuration file in your project root. Supported formats:

- `.crosspostrc.json`
- `.crosspostrc.yml` or `.crosspostrc.yaml`
- `crosspost.config.js`
- `crosspost.config.ts`

### JSON Configuration

```json
{
  "platforms": {
    "devto": {
      "apiKey": "your-devto-api-key"
    },
    "hashnode": {
      "token": "your-hashnode-token",
      "publicationId": "your-publication-id"
    }
  },
  "defaults": {
    "publishStatus": "draft",
    "tags": ["typescript", "javascript"],
    "canonicalUrl": "https://yourblog.com/blog/{slug}"
  },
  "options": {
    "retryAttempts": 3,
    "logLevel": "info",
    "autoSync": false,
    "watchMode": false
  }
}
```

### YAML Configuration

```yaml
platforms:
  devto:
    apiKey: your-devto-api-key
  hashnode:
    token: your-hashnode-token
    publicationId: your-publication-id

defaults:
  publishStatus: draft
  tags:
    - typescript
    - javascript
  canonicalUrl: https://yourblog.com/blog/{slug}

options:
  retryAttempts: 3
  logLevel: info
  autoSync: false
  watchMode: false
```

### JavaScript/TypeScript Configuration

```typescript
// crosspost.config.ts
import { CrossPostConfig } from 'auto-crosspost'

export default {
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
    tags: ['typescript', 'javascript'],
    canonicalUrl: 'https://yourblog.com/blog/{slug}'
  },
  options: {
    retryAttempts: 3,
    logLevel: 'info'
  }
} satisfies CrossPostConfig
```

## Environment Variables

Set these environment variables for automatic configuration:

```bash
# Platform API Keys
DEVTO_API_KEY=your_devto_api_key
HASHNODE_TOKEN=your_hashnode_token
HASHNODE_PUBLICATION_ID=your_publication_id

# Global Options
CROSSPOST_RETRY_ATTEMPTS=3
CROSSPOST_LOG_LEVEL=info
CROSSPOST_AUTO_SYNC=false
CROSSPOST_DEFAULT_CANONICAL_URL=https://yourblog.com
```

## Configuration Options

### Platforms

#### Dev.to Configuration

```typescript
{
  platforms: {
    devto: {
      apiKey: string         // Required: Your Dev.to API key
      defaultTags?: string[] // Optional: Default tags for all posts
    }
  }
}
```

#### Hashnode Configuration

```typescript
{
  platforms: {
    hashnode: {
      token: string            // Required: Your Hashnode personal access token
      publicationId?: string   // Optional: Your publication ID (required for posting)
      defaultTags?: string[]   // Optional: Default tags for all posts
    }
  }
}
```

### Defaults

Set default values applied to all posts:

```typescript
{
  defaults: {
    tags?: string[]                        // Default tags
    publishStatus?: 'draft' | 'published'  // Default publish status
    canonicalUrl?: string                  // Default canonical URL template
  }
}
```

### Options

Global behavior options:

```typescript
{
  options: {
    retryAttempts?: number       // Number of retry attempts (0-10, default: 3)
    logLevel?: 'debug' | 'info' | 'warn' | 'error'  // Logging level
    autoSync?: boolean           // Enable automatic syncing
    watchMode?: boolean          // Enable file watching
  }
}
```

## Using ConfigManager

Load and manage configuration programmatically:

```typescript
import { ConfigManager } from 'auto-crosspost'

// Load configuration from various sources
const config = await ConfigManager.loadConfig()

// Load from specific file
const config = await ConfigManager.loadConfig('./my-config.json')

// Load with explicit overrides
const config = await ConfigManager.loadConfig(undefined, {
  platforms: {
    devto: { apiKey: 'override-key' }
  }
})

// Save configuration
await ConfigManager.saveConfig(config, './saved-config.json')

// Generate sample configuration
const sampleConfig = ConfigManager.generateSampleConfig()

// Merge multiple configurations
const merged = ConfigManager.mergeConfigs(config1, config2, config3)
```

## Security Best Practices

### Protect Your API Keys

1. **Never commit API keys to version control**
2. **Use environment variables for sensitive data**
3. **Use `.env` files for local development**
4. **Add sensitive files to `.gitignore`**

```gitignore
# Add to .gitignore
.env
.env.local
.crosspostrc.json
**/api-keys.json
```

### Configuration File Security

When saving configuration files:

- Sensitive data is automatically replaced with placeholders
- Original values are preserved in memory
- Use environment variables for production

```json
{
  "platforms": {
    "devto": {
      "apiKey": "<DEVTO_API_KEY>"
    },
    "hashnode": {
      "token": "<HASHNODE_TOKEN>"
    }
  }
}
```

## Validation

All configuration is automatically validated:

- **Platform Requirements**: Ensures required API keys are present
- **Type Safety**: Validates data types and formats
- **Range Validation**: Checks numeric values are within acceptable ranges
- **Enum Validation**: Ensures string values match expected options

Common validation errors:

```bash
# Missing API key
Configuration validation failed: Dev.to API key is required

# Invalid retry attempts
Configuration validation failed: Retry attempts must be between 0 and 10

# Invalid log level
Configuration validation failed: Log level must be one of: debug, info, warn, error
```

## Next Steps

- [Platform Setup](/guide/platforms/devto) - Configure specific platforms
- [SDK Usage](/guide/usage/sdk) - Use configuration in your code
- [CLI Usage](/guide/usage/cli) - CLI configuration options
