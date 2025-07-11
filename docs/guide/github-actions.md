# GitHub Actions Integration

Auto-CrossPost can be seamlessly integrated with GitHub Actions to automatically cross-post your blog posts whenever you commit new content to your repository. This guide will show you how to set up automated cross-posting workflows.

## Quick Start

### 1. Basic Workflow Setup

Create `.github/workflows/auto-crosspost.yml` in your repository:

```yaml
name: Auto CrossPost

on:
  push:
    branches: [main]
    paths: ['posts/**/*.md', 'content/**/*.md', 'blog/**/*.md']

jobs:
  crosspost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install Auto-CrossPost
        run: npm install -g auto-crosspost
        
      - name: Setup Configuration
        run: |
          echo '{
            "platforms": {
              "devto": {
                "apiKey": "${{ secrets.DEVTO_API_KEY }}"
              },
              "hashnode": {
                "accessToken": "${{ secrets.HASHNODE_ACCESS_TOKEN }}",
                "publicationId": "${{ secrets.HASHNODE_PUBLICATION_ID }}"
              }
            }
          }' > crosspost.config.json
          
      - name: Cross-post changed files
        run: |
          # Get changed markdown files
          git diff --name-only HEAD~1 HEAD -- '*.md' | while read file; do
            if [ -f "$file" ]; then
              echo "Cross-posting $file"
              crosspost post "$file" --config crosspost.config.json
            fi
          done
```

### 2. Required Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

- `DEVTO_API_KEY`: Your Dev.to API key
- `HASHNODE_ACCESS_TOKEN`: Your Hashnode Personal Access Token
- `HASHNODE_PUBLICATION_ID`: Your Hashnode publication ID

## Advanced Workflows

### Conditional Cross-posting

Only cross-post files with specific frontmatter:

```yaml
name: Conditional CrossPost

on:
  push:
    branches: [main]
    paths: ['posts/**/*.md']

jobs:
  crosspost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm install -g auto-crosspost
          npm install js-yaml
          
      - name: Setup Configuration
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          cat > crosspost.config.json << EOF
          {
            "platforms": {
              "devto": {
                "apiKey": "$DEVTO_API_KEY"
              },
              "hashnode": {
                "accessToken": "$HASHNODE_ACCESS_TOKEN",
                "publicationId": "$HASHNODE_PUBLICATION_ID"
              }
            }
          }
          EOF
          
      - name: Cross-post new/modified posts
        run: |
          # Create a script to check frontmatter
          cat > check_and_post.js << 'EOF'
          const fs = require('fs');
          const yaml = require('js-yaml');
          const { exec } = require('child_process');
          
          const file = process.argv[2];
          if (!fs.existsSync(file)) process.exit(0);
          
          const content = fs.readFileSync(file, 'utf8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          
          if (frontmatterMatch) {
            try {
              const frontmatter = yaml.load(frontmatterMatch[1]);
              if (frontmatter.crosspost === true || frontmatter.published === true) {
                console.log(`Cross-posting ${file}`);
                exec(`crosspost post "${file}" --config crosspost.config.json`, (error, stdout, stderr) => {
                  if (error) {
                    console.error(`Error: ${error}`);
                    process.exit(1);
                  }
                  console.log(stdout);
                });
              } else {
                console.log(`Skipping ${file} (crosspost not enabled)`);
              }
            } catch (e) {
              console.error(`Error parsing frontmatter in ${file}`);
            }
          }
          EOF
          
          # Check changed files
          git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md' | while read file; do
            node check_and_post.js "$file"
          done
```

### Batch Processing Workflow

For repositories with many posts:

```yaml
name: Batch CrossPost

on:
  schedule:
    - cron: '0 9 * * *'  # Run daily at 9 AM UTC
  workflow_dispatch:     # Allow manual trigger

jobs:
  batch-crosspost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install Auto-CrossPost
        run: npm install -g auto-crosspost
        
      - name: Setup Configuration
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          cat > crosspost.config.json << EOF
          {
            "platforms": {
              "devto": {
                "apiKey": "$DEVTO_API_KEY"
              },
              "hashnode": {
                "accessToken": "$HASHNODE_ACCESS_TOKEN",
                "publicationId": "$HASHNODE_PUBLICATION_ID"
              }
            },
            "batch": {
              "enabled": true,
              "delay": 30000,
              "retries": 3
            }
          }
          EOF
          
      - name: Batch cross-post
        run: crosspost batch posts/ --config crosspost.config.json
```

## Configuration Options

### Environment-based Configuration

Use environment variables for sensitive data:

```yaml
- name: Cross-post with environment config
  env:
    CROSSPOST_DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
    CROSSPOST_HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
    CROSSPOST_HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
  run: crosspost post "$file"
```

### Custom Configuration File

```yaml
- name: Use custom config
  run: |
    echo '${{ secrets.CROSSPOST_CONFIG }}' > my-config.json
    crosspost post "$file" --config my-config.json
```

## Error Handling and Notifications

### Basic Error Handling

```yaml
- name: Cross-post with error handling
  run: |
    if ! crosspost post "$file" --config crosspost.config.json; then
      echo "❌ Cross-posting failed for $file"
      exit 1
    else
      echo "✅ Successfully cross-posted $file"
    fi
```

### Slack Notifications

```yaml
- name: Notify on Success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: '✅ Successfully cross-posted blog posts'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

- name: Notify on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: '❌ Failed to cross-post blog posts'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## File Structure Examples

### Blog in Repository Root

```
your-repo/
├── .github/
│   └── workflows/
│       └── auto-crosspost.yml
├── posts/
│   ├── my-first-post.md
│   └── advanced-tutorial.md
└── crosspost.config.json
```

### Blog in Subdirectory

```
your-repo/
├── .github/
│   └── workflows/
│       └── auto-crosspost.yml
├── src/
├── docs/
└── blog/
    ├── content/
    │   ├── post-1.md
    │   └── post-2.md
    └── crosspost.config.json
```

### Monorepo Setup

```
your-monorepo/
├── .github/
│   └── workflows/
│       ├── blog-crosspost.yml
│       └── docs-crosspost.yml
├── apps/
│   └── blog/
│       ├── posts/
│       └── crosspost.config.json
└── packages/
```

## Frontmatter Requirements

Ensure your markdown files have proper frontmatter:

```markdown
---
title: "My Awesome Blog Post"
description: "A comprehensive guide to..."
tags: ["javascript", "tutorial", "webdev"]
canonical_url: "https://myblog.com/my-awesome-post"
published: true
crosspost: true
cover_image: "https://myblog.com/images/cover.jpg"
---

# My Awesome Blog Post

Your content here...
```

## Troubleshooting

### Common Issues

1. **API Rate Limits**: Add delays between posts
2. **Authentication Errors**: Check your API keys and tokens
3. **File Not Found**: Ensure file paths are correct
4. **Frontmatter Parsing**: Validate YAML syntax

### Debug Mode

Enable debug logging:

```yaml
- name: Debug cross-posting
  run: crosspost post "$file" --debug --config crosspost.config.json
```

### Dry Run Testing

Test without actually posting:

```yaml
- name: Test cross-posting (dry run)
  run: crosspost post "$file" --dry-run --config crosspost.config.json
```

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use GitHub Secrets** for all sensitive information
3. **Limit workflow permissions** to minimum required
4. **Review workflow runs** regularly for errors
5. **Rotate API keys** periodically

## Performance Optimization

### Parallel Processing

```yaml
- name: Cross-post multiple files in parallel
  run: |
    git diff --name-only HEAD~1 HEAD -- '*.md' | xargs -P 3 -I {} sh -c 'crosspost post "{}" --config crosspost.config.json'
```

### Caching Dependencies

```yaml
- name: Cache Node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    
- name: Install Auto-CrossPost
  run: npm install -g auto-crosspost
```

## Examples and Templates

The Auto-CrossPost repository includes a comprehensive set of GitHub Actions examples:

### Basic Examples
- **[basic-crosspost.yml](../../examples/github-actions/basic-crosspost.yml)** - Simple workflow that posts on every push
- **[conditional-crosspost.yml](../../examples/github-actions/conditional-crosspost.yml)** - Only posts files with `crosspost: true` frontmatter
- **[batch-crosspost.yml](../../examples/github-actions/batch-crosspost.yml)** - Scheduled batch processing

### Platform-Specific Examples
- **[devto-only.yml](../../examples/github-actions/devto-only.yml)** - Cross-post only to Dev.to
- **[hashnode-only.yml](../../examples/github-actions/hashnode-only.yml)** - Cross-post only to Hashnode

### Advanced Examples
- **[monorepo-crosspost.yml](../../examples/github-actions/monorepo-crosspost.yml)** - Handle multiple blogs in a monorepo
- **[with-notifications.yml](../../examples/github-actions/with-notifications.yml)** - Includes Slack/Discord notifications

### Quick Setup with Generator

Use the built-in workflow generator to create customized workflows:

```bash
# Install Auto-CrossPost
npm install -g auto-crosspost

# Generate basic workflow
npx auto-crosspost generate github-actions basic

# Generate conditional workflow
npx auto-crosspost generate github-actions conditional

# Generate full-featured workflow
npx auto-crosspost generate github-actions full

# Generate secrets template
npx auto-crosspost generate github-actions secrets
```

## Workflow Validation

Validate your GitHub Actions workflows with the built-in validator:

```bash
# Validate a specific workflow
npx auto-crosspost validate workflow .github/workflows/crosspost.yml

# Validate repository structure
npx auto-crosspost validate repository

# Validate everything
npx auto-crosspost validate all
```

The validator checks for:
- ✅ Required workflow structure
- ✅ Proper secret usage
- ✅ Auto-CrossPost integration
- ⚠️ Security issues (hardcoded credentials)
- 💡 Best practice recommendations

## Utilities and Tools

Auto-CrossPost provides several utilities to make GitHub Actions integration easier:

### Workflow Generator
```typescript
import { GitHubActionsGenerator } from 'auto-crosspost/utils/github-actions';

const generator = new GitHubActionsGenerator();
await generator.generateWorkflow({
  name: 'My Custom Workflow',
  trigger: 'push',
  platforms: ['devto', 'hashnode'],
  notifications: { slack: true },
  directories: ['posts', 'articles'],
  conditional: true,
  batchMode: false
});
```

### Workflow Validator
```typescript
import { WorkflowValidator } from 'auto-crosspost/utils/github-actions';

const validator = new WorkflowValidator();
const result = await validator.validateWorkflow('.github/workflows/crosspost.yml');

if (!result.valid) {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}
```

## Next Steps

- [Configuration Guide](./configuration.md)
- [CLI Usage](./cli.md)
- [Troubleshooting](./troubleshooting.md)
