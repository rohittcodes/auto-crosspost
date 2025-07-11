# ConfigManager API

Configuration management for the Auto-CrossPost SDK.

## Static Methods

### loadConfig()

Load configuration from file or environment variables.

```typescript
import { ConfigManager } from 'auto-crosspost'

const config = await ConfigManager.loadConfig()
```

### validateConfig()

Validate configuration object.

```typescript
const isValid = ConfigManager.validateConfig(config)
```

## Configuration Structure

```typescript
interface CrossPostConfig {
  devto?: {
    apiKey: string
  }
  hashnode?: {
    token: string
    publicationId: string
  }
  // ... other platform configs
}
```

## Examples

### Loading from File

```typescript
// .crosspostrc.yml
const config = await ConfigManager.loadConfig('./.crosspostrc.yml')
```

### Loading from Environment

```typescript
// Uses DEVTO_API_KEY, HASHNODE_TOKEN, etc.
const config = await ConfigManager.loadConfig()
```

---

**Next:** [Platform Clients API](/api/platform-clients)
