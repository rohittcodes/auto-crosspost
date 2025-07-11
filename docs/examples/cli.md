# CLI Examples

## Basic CLI Usage

### Single Post

```bash
# Post a single markdown file
auto-crosspost post ./blog-post.md

# Post with specific platforms
auto-crosspost post ./blog-post.md --platforms devto,hashnode

# Post as draft
auto-crosspost post ./blog-post.md --draft
```

### Batch Processing

```bash
# Post all markdown files in a directory
auto-crosspost-batch ./posts/

# Watch for changes and auto-post
auto-crosspost-batch ./posts/ --watch

# Process with custom configuration
auto-crosspost-batch ./posts/ --config ./crosspost.config.js
```

## Advanced Examples

### Custom Configuration

```bash
# Use custom config file
auto-crosspost post ./post.md --config ./my-config.yml

# Override platform settings
auto-crosspost post ./post.md --devto-api-key "new-key"
```

### Scheduling

```bash
# Schedule post for later
auto-crosspost post ./post.md --schedule "2024-01-15T10:00:00Z"

# Post with delay
auto-crosspost post ./post.md --delay "2h"
```

For more examples, see the [main examples](/examples/) page.
