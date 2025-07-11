# CLI Examples

## Basic CLI Usage

### Single Post

```bash
# Post a single markdown file
crosspost post ./blog-post.md

# Post with specific platforms
crosspost post ./blog-post.md --platforms devto,hashnode

# Post as draft
crosspost post ./blog-post.md --draft
```

### Batch Processing

```bash
# Post all markdown files in a directory
crosspost-batch ./posts/

# Watch for changes and auto-post
crosspost-batch ./posts/ --watch

# Process with custom configuration
crosspost-batch ./posts/ --config ./crosspost.config.js
```

## Advanced Examples

### Custom Configuration

```bash
# Use custom config file
crosspost post ./post.md --config ./my-config.yml

# Override platform settings
crosspost post ./post.md --devto-api-key "new-key"
```

### Scheduling

```bash
# Schedule post for later
crosspost post ./post.md --schedule "2024-01-15T10:00:00Z"

# Post with delay
crosspost post ./post.md --delay "2h"
```

For more examples, see the [main examples](/examples/) page.
