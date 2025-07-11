# Command Line Interface

Complete guide to using the Auto-CrossPost CLI tool.

## Installation

Install the CLI globally for system-wide access:

```bash
npm install -g auto-crosspost
```

Or use locally in your project:

```bash
npm install auto-crosspost
npx crosspost --help
```

## Commands Overview

The CLI provides several commands for managing your cross-posting workflow:

```bash
crosspost <command> [options]

Commands:
  crosspost post <file>      Post a single markdown file
  crosspost batch <dir>      Post multiple files from directory
  crosspost update <id>      Update an existing post
  crosspost delete <id>      Delete a post from platforms
  crosspost status           Check posting status and statistics
  crosspost sync             Sync posts across platforms
  crosspost init             Initialize configuration
  crosspost validate         Validate configuration and setup

Options:
  -c, --config <file>        Configuration file path
  -p, --platforms <list>     Target platforms (devto,hashnode)
  -d, --draft                Save as draft
  -v, --verbose              Verbose logging
  -h, --help                 Display help
```

## Post Command

Post a single markdown file to configured platforms.

### Basic Usage

```bash
# Post to all configured platforms
crosspost post ./posts/my-article.md

# Post to specific platforms
crosspost post ./posts/my-article.md --platforms devto,hashnode

# Save as draft
crosspost post ./posts/my-article.md --draft

# Use custom config
crosspost post ./posts/my-article.md --config ./my-config.json
```

### Options

```bash
Options:
  -p, --platforms <list>     Comma-separated list of platforms
  -d, --draft                Save as draft instead of publishing
  -f, --force                Force repost even if already posted
  -w, --watch                Watch file for changes and auto-repost
  -t, --tags <list>          Override tags from frontmatter
  -c, --config <file>        Custom configuration file
  -v, --verbose              Enable verbose logging
```

### Examples

```bash
# Post with specific tags
crosspost post ./posts/tutorial.md --tags "javascript,tutorial,beginners"

# Watch mode for development
crosspost post ./posts/draft.md --draft --watch

# Force repost with custom config
crosspost post ./posts/updated.md --force --config ./production.config.json
```

## Batch Command

Post multiple markdown files from a directory.

### Basic Usage

```bash
# Post all markdown files in directory
crosspost batch ./posts

# Post with filtering
crosspost batch ./posts --pattern "*.tutorial.md"

# Dry run to see what would be posted
crosspost batch ./posts --dry-run
```

### Options

```bash
Options:
  -p, --pattern <glob>       File pattern to match (default: "*.md")
  -r, --recursive            Include subdirectories
  -d, --draft                Save all as drafts
  -f, --force                Force repost existing articles
  -w, --watch                Watch directory for changes
  -l, --limit <number>       Maximum number of files to process
  -s, --sort <method>        Sort order (name, date, size)
  --parallel <number>        Number of parallel operations (default: 3)
  --delay <ms>               Delay between posts (default: 1000ms)
```

### Examples

```bash
# Process all markdown files recursively
crosspost batch ./content --recursive --pattern "**/*.md"

# Limited parallel processing with delay
crosspost batch ./posts --parallel 2 --delay 2000

# Watch mode for continuous publishing
crosspost batch ./posts --watch --draft

# Sort by date and limit to 10 files
crosspost batch ./posts --sort date --limit 10
```

## Update Command

Update existing posts on platforms.

### Basic Usage

```bash
# Update specific post
crosspost update devto:123456 ./posts/updated-article.md

# Update across all platforms
crosspost update all:my-slug ./posts/updated-article.md

# Update metadata only
crosspost update hashnode:abc123 --title "New Title" --tags "updated,tags"
```

### Platform ID Formats

```bash
# Platform-specific IDs
devto:123456           # Dev.to article ID
hashnode:abc123        # Hashnode post ID

# Global identifiers
all:my-article-slug    # Update on all platforms using slug
local:./path/to/file   # Update using local file mapping
```

### Options

```bash
Options:
  --title <text>             Override title
  --tags <list>              Override tags
  --description <text>       Override description
  --canonical <url>          Override canonical URL
  --publish                  Change draft to published
  --unpublish                Change published to draft
  -f, --force                Force update even if no changes
```

## Delete Command

Delete posts from platforms.

### Basic Usage

```bash
# Delete from specific platform
crosspost delete devto:123456

# Delete from all platforms
crosspost delete all:my-article-slug

# Confirm before deletion
crosspost delete hashnode:abc123 --confirm
```

### Options

```bash
Options:
  -y, --yes                  Skip confirmation prompt
  --backup                   Create backup before deletion
  --soft                     Soft delete (unpublish instead of delete)
```

## Status Command

Check the status of your posts and platform connections.

### Basic Usage

```bash
# Show overall status
crosspost status

# Show detailed statistics
crosspost status --detailed

# Check specific platforms
crosspost status --platforms devto
```

### Sample Output

```bash
Auto-CrossPost Status Report
============================

Platform Connections:
✅ Dev.to        Connected (API key valid)
✅ Hashnode      Connected (Token valid)

Published Posts:
📝 Dev.to        15 articles
📝 Hashnode      12 articles

Recent Activity:
• 2024-01-15: Posted "TypeScript Tips" to Dev.to
• 2024-01-14: Updated "React Hooks" on Hashnode
• 2024-01-13: Posted "Node.js Guide" to all platforms

Rate Limits:
• Dev.to:        890/1000 requests remaining
• Hashnode:      950/1000 requests remaining
```

### Options

```bash
Options:
  -d, --detailed             Show detailed statistics
  -p, --platforms <list>     Check specific platforms only
  -j, --json                 Output in JSON format
  --rate-limits              Show current rate limit status
```

## Sync Command

Synchronize posts across platforms to ensure consistency.

### Basic Usage

```bash
# Sync all posts
crosspost sync

# Sync specific platform
crosspost sync --platform devto

# Dry run to see what would be synced
crosspost sync --dry-run
```

### Sync Operations

- **Missing Posts**: Post to platforms where article doesn't exist
- **Content Differences**: Update posts with newer content
- **Metadata Sync**: Ensure tags, titles, and descriptions match
- **Status Sync**: Align draft/published status

### Options

```bash
Options:
  -p, --platform <name>      Sync specific platform only
  --dry-run                  Show sync plan without executing
  --force                    Force sync even if content matches
  --direction <way>          Sync direction (bidirectional, to-platforms, from-platforms)
  --conflicts <strategy>     Conflict resolution (newer, local, remote, prompt)
```

## Init Command

Initialize configuration and set up your workspace.

### Basic Usage

```bash
# Interactive setup
crosspost init

# Quick setup with defaults
crosspost init --quick

# Setup for specific platforms
crosspost init --platforms devto,hashnode
```

### Interactive Setup

The init command walks you through:

1. **Platform Selection**: Choose which platforms to configure
2. **API Key Input**: Secure entry of API keys and tokens
3. **Default Settings**: Configure default tags, publish status, etc.
4. **File Structure**: Set up directory structure for posts
5. **Configuration Save**: Choose config file location and format

### Generated Files

```bash
.crosspostrc.json          # Main configuration file
.env.example              # Environment variables template
.gitignore                # Git ignore patterns for sensitive files
posts/                    # Default posts directory
  ├── drafts/             # Draft posts
  ├── published/          # Published posts
  └── templates/          # Post templates
```

### Options

```bash
Options:
  -f, --format <type>        Config format (json, yaml, js)
  -p, --platforms <list>     Platforms to configure
  --quick                    Use default settings
  --overwrite                Overwrite existing configuration
```

## Validate Command

Validate your configuration and platform connections.

### Basic Usage

```bash
# Validate everything
crosspost validate

# Validate specific aspects
crosspost validate --config
crosspost validate --platforms
crosspost validate --files
```

### Validation Checks

- **Configuration**: Syntax, required fields, value ranges
- **Platform Connections**: API key validity, permissions
- **File Structure**: Markdown syntax, frontmatter format
- **Content**: Title/content requirements, tag limits
- **Network**: Connectivity, rate limits, API status

### Sample Output

```bash
Configuration Validation
========================
✅ Configuration file found and valid
✅ All required fields present
✅ API keys format valid

Platform Validation
===================
✅ Dev.to connection successful
✅ Hashnode connection successful
✅ All platforms ready for posting

Content Validation
==================
✅ 15 markdown files found
⚠️  2 files missing title in frontmatter
❌ 1 file exceeds Dev.to character limit

Rate Limit Check
===============
✅ Dev.to: 950/1000 requests available
✅ Hashnode: 980/1000 requests available
```

## Global Options

Options available for all commands:

```bash
Global Options:
  -c, --config <file>        Configuration file path
  -v, --verbose              Enable verbose logging
  -q, --quiet                Suppress non-error output
  --no-color                 Disable colored output
  --log-level <level>        Set log level (debug, info, warn, error)
  --log-file <file>          Write logs to file
  -h, --help                 Show help
  --version                  Show version
```

## Configuration

### CLI-Specific Configuration

Add CLI-specific options to your config file:

```json
{
  "cli": {
    "defaultPlatforms": ["devto", "hashnode"],
    "autoWatch": false,
    "confirmDeletions": true,
    "parallelLimit": 3,
    "defaultDelay": 1000,
    "logLevel": "info",
    "colorOutput": true
  }
}
```

### Environment Variables

Override config with environment variables:

```bash
CROSSPOST_CONFIG=./my-config.json
CROSSPOST_LOG_LEVEL=debug
CROSSPOST_DEFAULT_PLATFORMS=devto,hashnode
CROSSPOST_AUTO_WATCH=true
```

## Error Handling

The CLI provides detailed error messages and exit codes:

### Exit Codes

- `0`: Success
- `1`: General error
- `2`: Configuration error
- `3`: Authentication error
- `4`: Validation error
- `5`: Network error
- `6`: Rate limit exceeded

### Error Examples

```bash
# Configuration error
Error: Configuration file not found: ./missing.json
Use 'crosspost init' to create a configuration file.

# Authentication error
Error: Invalid Dev.to API key
Please check your API key in the configuration.

# Validation error
Error: Post title is required
Check the frontmatter in your markdown file.
```

## Automation

### CI/CD Integration

Use in continuous integration:

```yaml
# GitHub Actions example
- name: Cross-post articles
  run: |
    crosspost batch ./posts --platforms devto,hashnode
  env:
    DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
    HASHNODE_TOKEN: ${{ secrets.HASHNODE_TOKEN }}
```

### Script Integration

```bash
#!/bin/bash
# Auto-post script

# Check for new posts
if [ -n "$(git diff --name-only HEAD~1 posts/)" ]; then
  echo "New posts detected, cross-posting..."
  crosspost batch ./posts --pattern "*$(date +%Y-%m-%d)*.md"
fi
```

### Cron Jobs

```bash
# Post drafts daily at 9 AM
0 9 * * * cd /path/to/blog && crosspost batch ./drafts --publish
```

## Troubleshooting

### Common Issues

#### Command Not Found
```bash
crosspost: command not found
```
**Solution**: Install globally with `npm install -g auto-crosspost`

#### Permission Errors
```bash
Error: Permission denied
```
**Solution**: Check file permissions or run with appropriate privileges

#### API Rate Limits
```bash
Error: Rate limit exceeded
```
**Solution**: Wait for rate limit reset or reduce parallel operations

### Debug Mode

Enable detailed logging:

```bash
crosspost post ./article.md --verbose --log-level debug
```

### Get Help

```bash
# General help
crosspost --help

# Command-specific help
crosspost post --help
crosspost batch --help

# Version information
crosspost --version
```

## Next Steps

- [SDK Usage](/guide/usage/sdk) - Use the SDK programmatically
- [Configuration](/guide/configuration) - Advanced configuration options
- [Platform Guides](/guide/platforms/) - Platform-specific documentation
