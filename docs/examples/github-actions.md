# GitHub Actions Examples

This page provides comprehensive examples for integrating Auto-CrossPost with GitHub Actions. Each example includes complete workflow files, configuration instructions, and usage scenarios.

## Quick Start Guide

### 1. Choose Your Workflow Type

| Workflow Type | Use Case | Best For |
|---------------|----------|----------|
| **Basic** | Simple cross-posting on push | Personal blogs, small projects |
| **Conditional** | Only post files with `crosspost: true` | Controlled publishing, draft management |
| **Batch** | Scheduled bulk processing | Large content libraries, rate limit management |
| **Monorepo** | Multiple blogs in one repository | Multi-brand companies, documentation sites |

### 2. Set Up Repository Secrets

All workflows require these GitHub secrets:

```bash
# Required for Dev.to integration
DEVTO_API_KEY=your_devto_api_key

# Required for Hashnode integration  
HASHNODE_ACCESS_TOKEN=your_hashnode_token
HASHNODE_PUBLICATION_ID=your_publication_id

# Optional for notifications
SLACK_WEBHOOK_URL=your_slack_webhook
DISCORD_WEBHOOK_URL=your_discord_webhook
```

### 3. Copy and Customize

1. Choose an example workflow below
2. Copy the YAML content to `.github/workflows/crosspost.yml`
3. Customize the configuration for your needs
4. Commit and push to trigger the workflow

## Basic Workflows

### Simple Cross-posting

**File:** `.github/workflows/basic-crosspost.yml`

Automatically cross-posts any markdown file changes to all configured platforms.

```yaml
name: Auto CrossPost - Basic

on:
  push:
    branches: [main]
    paths: 
      - 'posts/**/*.md'
      - 'content/**/*.md'
      - 'blog/**/*.md'

jobs:
  crosspost:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - run: npm install -g auto-crosspost
      
      - name: Configure platforms
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          cat > config.json << EOF
          {
            "platforms": {
              "devto": { "apiKey": "$DEVTO_API_KEY" },
              "hashnode": { 
                "accessToken": "$HASHNODE_ACCESS_TOKEN",
                "publicationId": "$HASHNODE_PUBLICATION_ID"
              }
            }
          }
          EOF
      
      - name: Cross-post changed files
        run: |
          git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md' | while read file; do
            [ -f "$file" ] && crosspost post "$file" --config config.json
          done
```

**Best for:** Personal blogs, simple setups, immediate publishing

### Conditional Cross-posting

**File:** `.github/workflows/conditional-crosspost.yml`

Only cross-posts files that have `crosspost: true` in their frontmatter.

```yaml
name: Auto CrossPost - Conditional

on:
  push:
    branches: [main]
    paths: ['**/*.md']

jobs:
  conditional-crosspost:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - run: |
          npm install -g auto-crosspost
          npm install gray-matter
      
      - name: Check frontmatter and cross-post
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          # Create frontmatter checker
          cat > check.js << 'EOF'
          const fs = require('fs');
          const matter = require('gray-matter');
          const { exec } = require('child_process');
          
          async function processFile(file) {
            if (!fs.existsSync(file)) return;
            
            const { data } = matter(fs.readFileSync(file, 'utf8'));
            
            if (data.crosspost === true || data.published === true) {
              console.log(`📝 Cross-posting: ${file}`);
              
              const config = {
                platforms: {
                  devto: { apiKey: process.env.DEVTO_API_KEY },
                  hashnode: { 
                    accessToken: process.env.HASHNODE_ACCESS_TOKEN,
                    publicationId: process.env.HASHNODE_PUBLICATION_ID
                  }
                }
              };
              
              fs.writeFileSync('config.json', JSON.stringify(config));
              
              return new Promise((resolve, reject) => {
                exec(`crosspost post "${file}" --config config.json`, (error, stdout) => {
                  if (error) reject(error);
                  else { console.log(stdout); resolve(); }
                });
              });
            } else {
              console.log(`⏭️ Skipping: ${file} (crosspost not enabled)`);
            }
          }
          
          // Process all changed files
          const files = process.argv.slice(2);
          Promise.all(files.map(processFile)).catch(console.error);
          EOF
          
          # Get changed files and process them
          CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md')
          [ -n "$CHANGED_FILES" ] && echo "$CHANGED_FILES" | xargs node check.js
```

**Best for:** Content teams, draft management, selective publishing

## Scheduled Workflows

### Batch Processing

**File:** `.github/workflows/batch-crosspost.yml`

Runs on a schedule to process posts in batches, respecting rate limits.

```yaml
name: Auto CrossPost - Batch

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:      # Manual trigger

jobs:
  batch-crosspost:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - run: npm install -g auto-crosspost
      
      - name: Batch cross-post
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          cat > config.json << EOF
          {
            "platforms": {
              "devto": { "apiKey": "$DEVTO_API_KEY" },
              "hashnode": { 
                "accessToken": "$HASHNODE_ACCESS_TOKEN",
                "publicationId": "$HASHNODE_PUBLICATION_ID"
              }
            },
            "batch": {
              "enabled": true,
              "delay": 30000,
              "maxConcurrent": 2
            }
          }
          EOF
          
          crosspost batch posts/ --config config.json
```

**Best for:** Large content libraries, rate limit management, scheduled publishing

## Advanced Workflows

### Monorepo Support

**File:** `.github/workflows/monorepo-crosspost.yml`

Handles multiple blogs within a single repository structure.

```yaml
name: Auto CrossPost - Monorepo

on:
  push:
    branches: [main]
    paths: ['apps/*/blog/**/*.md', 'packages/*/content/**/*.md']

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - name: Detect changed blog directories
        id: set-matrix
        run: |
          CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md')
          
          # Extract unique app directories
          APPS=$(echo "$CHANGED_FILES" | grep -E '^(apps|packages)/' | cut -d'/' -f1-2 | sort | uniq)
          
          # Build matrix
          MATRIX="[]"
          for app in $APPS; do
            if [ -d "$app" ]; then
              APP_NAME=$(basename "$app")
              MATRIX=$(echo "$MATRIX" | jq --arg dir "$app" --arg name "$APP_NAME" \
                '. += [{"directory": $dir, "app": $name}]')
            fi
          done
          
          echo "matrix={\"include\":$MATRIX}" >> $GITHUB_OUTPUT

  crosspost:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.matrix != '{"include":[]}' }}
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - run: npm install -g auto-crosspost
      
      - name: Cross-post for ${{ matrix.app }}
        working-directory: ${{ matrix.directory }}
        env:
          DEVTO_API_KEY: ${{ secrets[format('DEVTO_API_KEY_{0}', matrix.app)] || secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets[format('HASHNODE_TOKEN_{0}', matrix.app)] || secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets[format('HASHNODE_PUB_{0}', matrix.app)] || secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          # Create app-specific config
          cat > config.json << EOF
          {
            "platforms": {
              "devto": { "apiKey": "$DEVTO_API_KEY" },
              "hashnode": { 
                "accessToken": "$HASHNODE_ACCESS_TOKEN",
                "publicationId": "$HASHNODE_PUBLICATION_ID"
              }
            }
          }
          EOF
          
          # Process changed files in this directory
          git diff --name-only HEAD~1 HEAD -- '${{ matrix.directory }}/**/*.md' | \
            sed 's|^${{ matrix.directory }}/||' | \
            xargs -I {} crosspost post "{}" --config config.json
```

**Best for:** Multi-brand companies, documentation sites, team blogs

### With Notifications

**File:** `.github/workflows/with-notifications.yml`

Includes comprehensive notification support for Slack, Discord, and email.

```yaml
name: Auto CrossPost - With Notifications

on:
  push:
    branches: [main]
    paths: ['**/*.md']

jobs:
  crosspost-notify:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - run: npm install -g auto-crosspost
      
      - name: Cross-post with tracking
        id: crosspost
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          # Create config and track results
          cat > config.json << EOF
          {
            "platforms": {
              "devto": { "apiKey": "$DEVTO_API_KEY" },
              "hashnode": { 
                "accessToken": "$HASHNODE_ACCESS_TOKEN",
                "publicationId": "$HASHNODE_PUBLICATION_ID"
              }
            }
          }
          EOF
          
          SUCCESS_COUNT=0
          FAILED_COUNT=0
          RESULTS=""
          
          git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md' | while read file; do
            if [ -f "$file" ] && crosspost post "$file" --config config.json; then
              SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
              RESULTS="$RESULTS✅ $file\n"
            else
              FAILED_COUNT=$((FAILED_COUNT + 1))
              RESULTS="$RESULTS❌ $file\n"
            fi
          done
          
          echo "success_count=$SUCCESS_COUNT" >> $GITHUB_OUTPUT
          echo "failed_count=$FAILED_COUNT" >> $GITHUB_OUTPUT
          echo -e "results=$RESULTS" >> $GITHUB_OUTPUT
      
      - name: Notify Slack
        if: always() && secrets.SLACK_WEBHOOK_URL
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            📊 Cross-posting Results:
            ✅ Success: ${{ steps.crosspost.outputs.success_count }}
            ❌ Failed: ${{ steps.crosspost.outputs.failed_count }}
            
            ${{ steps.crosspost.outputs.results }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Notify Discord
        if: always() && secrets.DISCORD_WEBHOOK_URL
        run: |
          STATUS="${{ job.status }}"
          COLOR=$([ "$STATUS" = "success" ] && echo "65280" || echo "16711680")
          
          curl -H "Content-Type: application/json" \
            -d "{
              \"embeds\": [{
                \"title\": \"Cross-posting $STATUS\",
                \"color\": $COLOR,
                \"fields\": [
                  {\"name\": \"Success\", \"value\": \"${{ steps.crosspost.outputs.success_count }}\", \"inline\": true},
                  {\"name\": \"Failed\", \"value\": \"${{ steps.crosspost.outputs.failed_count }}\", \"inline\": true}
                ]
              }]
            }" \
            "${{ secrets.DISCORD_WEBHOOK_URL }}"
```

**Best for:** Team collaboration, monitoring, production deployments

## Platform-Specific Examples

### Dev.to Only

For users who only want to cross-post to Dev.to:

```yaml
name: Dev.to CrossPost

on:
  push:
    branches: [main]
    paths: ['posts/**/*.md']

jobs:
  devto:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g auto-crosspost
      - name: Post to Dev.to
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
        run: |
          echo '{"platforms":{"devto":{"apiKey":"'$DEVTO_API_KEY'"}}}' > config.json
          git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md' | \
            xargs -I {} crosspost post "{}" --config config.json --platform devto
```

### Hashnode Only

For users who only want to cross-post to Hashnode:

```yaml
name: Hashnode CrossPost

on:
  push:
    branches: [main]
    paths: ['posts/**/*.md']

jobs:
  hashnode:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g auto-crosspost
      - name: Post to Hashnode
        env:
          HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          cat > config.json << EOF
          {
            "platforms": {
              "hashnode": {
                "accessToken": "$HASHNODE_ACCESS_TOKEN",
                "publicationId": "$HASHNODE_PUBLICATION_ID"
              }
            }
          }
          EOF
          
          git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md' | \
            xargs -I {} crosspost post "{}" --config config.json --platform hashnode
```

## Testing and Validation

### Dry Run Workflow

Test your configuration without actually posting:

```yaml
name: Test CrossPost

on:
  pull_request:
    paths: ['**/*.md']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g auto-crosspost
      - name: Dry run test
        run: |
          echo '{"platforms":{"devto":{"apiKey":"test"}}}' > config.json
          git diff --name-only origin/main HEAD -- '*.md' '**/*.md' | \
            xargs -I {} crosspost post "{}" --config config.json --dry-run
```

### Workflow Validation

Validate your workflows before committing:

```bash
# Install validator
npm install -g auto-crosspost

# Validate workflow file
npx auto-crosspost validate workflow .github/workflows/crosspost.yml

# Validate repository structure
npx auto-crosspost validate repository

# Validate everything
npx auto-crosspost validate all
```

## Troubleshooting

### Common Issues

1. **Workflow doesn't trigger**
   - Check `paths` filters match your directory structure
   - Ensure you're pushing to the correct branch
   - Verify file extensions (`.md` vs `.mdx`)

2. **Authentication errors**
   - Verify secrets are correctly named and set
   - Check API key permissions on platform
   - Ensure secrets don't have extra spaces

3. **File not found errors**
   - Check file paths in diff command
   - Verify working directory settings
   - Ensure files exist and are committed

4. **Rate limiting**
   - Add delays between posts (`sleep 10`)
   - Use batch mode with limits
   - Consider scheduled workflows instead of push triggers

### Debug Tips

```yaml
- name: Debug information
  run: |
    echo "Changed files:"
    git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md'
    echo "Working directory: $(pwd)"
    echo "Files in directory:"
    find . -name "*.md" | head -10
```

## Getting Help

- 📖 [Configuration Guide](./configuration.md)
- 🔧 [CLI Usage](./cli.md)
- 🐛 [Troubleshooting](./troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/rohittcodes/auto-crosspost/discussions)
- 🐛 [Issue Tracker](https://github.com/rohittcodes/auto-crosspost/issues)
