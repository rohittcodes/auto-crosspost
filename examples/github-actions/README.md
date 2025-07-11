# GitHub Actions Examples

This directory contains example GitHub Actions workflows for integrating Auto-CrossPost into your CI/CD pipeline.

## Available Examples

### Basic Workflows
- [`basic-crosspost.yml`](./basic-crosspost.yml) - Simple workflow that posts on every push
- [`conditional-crosspost.yml`](./conditional-crosspost.yml) - Only posts files with `crosspost: true` frontmatter
- [`batch-crosspost.yml`](./batch-crosspost.yml) - Scheduled batch processing

### Advanced Workflows
- [`monorepo-crosspost.yml`](./monorepo-crosspost.yml) - Handle multiple blogs in a monorepo
- [`multi-environment.yml`](./multi-environment.yml) - Different configs for staging/production
- [`with-notifications.yml`](./with-notifications.yml) - Includes Slack/Discord notifications

### Platform-Specific
- [`devto-only.yml`](./devto-only.yml) - Cross-post only to Dev.to
- [`hashnode-only.yml`](./hashnode-only.yml) - Cross-post only to Hashnode

### Utility Workflows
- [`validate-posts.yml`](./validate-posts.yml) - Validate markdown and frontmatter
- [`sync-status.yml`](./sync-status.yml) - Check synchronization status

## Usage

1. Choose the workflow that best fits your needs
2. Copy the YAML file to `.github/workflows/` in your repository
3. Set up the required secrets in your GitHub repository settings
4. Customize the configuration as needed
5. Commit and push to trigger the workflow

## Required Secrets

All workflows require these GitHub secrets:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `DEVTO_API_KEY` | Your Dev.to API key | Dev.to integration |
| `HASHNODE_ACCESS_TOKEN` | Your Hashnode Personal Access Token | Hashnode integration |
| `HASHNODE_PUBLICATION_ID` | Your Hashnode publication ID | Hashnode integration |

### Optional Secrets

| Secret Name | Description | Used In |
|-------------|-------------|---------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Notification workflows |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications | Notification workflows |
| `CROSSPOST_CONFIG` | Complete configuration JSON | Custom config workflows |

## Configuration Examples

### Minimal Configuration

```json
{
  "platforms": {
    "devto": {
      "apiKey": "your-api-key"
    }
  }
}
```

### Full Configuration

```json
{
  "platforms": {
    "devto": {
      "apiKey": "your-api-key",
      "organizationId": "your-org-id"
    },
    "hashnode": {
      "accessToken": "your-access-token",
      "publicationId": "your-publication-id"
    }
  },
  "defaults": {
    "tags": ["automation", "blog"],
    "publishStatus": "published"
  },
  "batch": {
    "enabled": true,
    "delay": 30000,
    "maxConcurrent": 3,
    "retries": 3
  },
  "logging": {
    "level": "info"
  }
}
```

## Frontmatter Examples

### Basic Post

```yaml
---
title: "Getting Started with Auto-CrossPost"
description: "Learn how to automatically cross-post your blog content"
tags: ["automation", "blogging", "tutorial"]
published: true
crosspost: true
---
```

### Advanced Post

```yaml
---
title: "Advanced GitHub Actions Workflows"
description: "Deep dive into complex CI/CD patterns"
tags: ["github-actions", "cicd", "automation"]
canonical_url: "https://myblog.com/advanced-github-actions"
cover_image: "https://myblog.com/images/github-actions-cover.jpg"
published: true
crosspost: true
platforms:
  devto:
    series: "GitHub Actions Mastery"
  hashnode:
    subtitle: "Part 3 of our CI/CD series"
---
```

## Troubleshooting

### Common Issues

1. **Workflow doesn't trigger**: Check your `paths` filter and branch settings
2. **API authentication fails**: Verify your secrets are set correctly
3. **File not found**: Ensure file paths match your repository structure
4. **Rate limiting**: Add delays between API calls

### Debug Tips

1. Enable debug logging with `--debug` flag
2. Use `--dry-run` to test without posting
3. Check workflow logs for detailed error messages
4. Validate your frontmatter syntax

## Best Practices

1. **Use path filters** to only trigger on relevant file changes
2. **Set up proper error handling** and notifications
3. **Test with dry runs** before enabling live posting
4. **Monitor API usage** to avoid rate limits
5. **Use conditional logic** to control when posts are published

## Contributing

Have a useful workflow example? Please contribute by:

1. Adding your workflow file to this directory
2. Including clear documentation and comments
3. Testing thoroughly before submitting
4. Following the naming convention: `{purpose}-{platform}.yml`

## Support

For issues with these examples:

1. Check the [Troubleshooting Guide](../docs/guide/troubleshooting.md)
2. Review workflow logs in GitHub Actions
3. Open an issue with the specific workflow and error details
