#!/usr/bin/env node

/**
 * GitHub Actions Configuration Generator
 *
 * This utility helps users generate GitHub Actions workflows
 * for Auto-CrossPost integration based on their needs.
 */

import chalk from 'chalk';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

interface WorkflowConfig {
  name: string;
  trigger: 'push' | 'schedule' | 'manual' | 'all';
  platforms: ('devto' | 'hashnode')[];
  notifications: {
    slack?: boolean;
    discord?: boolean;
    github?: boolean;
  };
  directories: string[];
  conditional: boolean;
  batchMode: boolean;
}

class GitHubActionsGenerator {
  private outputDir: string;

  constructor(outputDir: string = '.github/workflows') {
    this.outputDir = outputDir;
  }

  async generateWorkflow(config: WorkflowConfig): Promise<void> {
    const workflow = this.buildWorkflow(config);
    const filename = `${ config.name.toLowerCase().replace(/\s+/g, '-') }.yml`;
    const filepath = join(this.outputDir, filename);

    // Ensure directory exists
    await this.ensureDirectory(dirname(filepath));

    // Write workflow file
    await writeFile(filepath, workflow);

    console.log(chalk.green(`✅ Generated workflow: ${ filepath }`));
  }

  private buildWorkflow(config: WorkflowConfig): string {
    const triggers = this.buildTriggers(config);
    const steps = this.buildSteps(config);

    return `name: ${ config.name }

${ triggers }

jobs:
  crosspost:
    runs-on: ubuntu-latest

    steps:
${ steps.map(step => this.indentStep(step)).join('\n\n') }
`;
  }

  private buildTriggers(config: WorkflowConfig): string {
    const pathsFilter = config.directories.map(dir => `${ dir }/**/*.md`).join('\n      - ');

    switch (config.trigger) {
      case 'push':
        return `on:
  push:
    branches: [main]
    paths:
      - ${ pathsFilter }`;

      case 'schedule':
        return `on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:`;

      case 'manual':
        return `on:
  workflow_dispatch:
    inputs:
      directory:
        description: 'Directory to process'
        required: false
        default: '${ config.directories[0] || 'posts' }'`;

      case 'all':
        return `on:
  push:
    branches: [main]
    paths:
      - ${ pathsFilter }
  schedule:
    - cron: '0 9 * * *'
  workflow_dispatch:`;

      default:
        return `on:
  push:
    branches: [main]`;
    }
  }

  private buildPlatformsConfig(platforms: string[]): string {
    const configs: string[] = [];

    if (platforms.includes('devto')) {
      configs.push(`"devto": {
        "apiKey": "$DEVTO_API_KEY"
      }`);
    }

    if (platforms.includes('hashnode')) {
      configs.push(`"hashnode": {
        "accessToken": "$HASHNODE_ACCESS_TOKEN",
        "publicationId": "$HASHNODE_PUBLICATION_ID"
      }`);
    }

    return `{
    "platforms": {
      ${ configs.join(',\n      ') }
    },
    "defaults": {
      "publishStatus": "published"
    },
    "logging": {
      "level": "info"
    }
  }`;
  }

  private buildSteps(config: WorkflowConfig): string[] {
    const steps: string[] = [];

    // Checkout step
    steps.push(`- name: Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 2`);

    // Node.js setup
    steps.push(`- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'`);

    // Install dependencies
    const dependencies = ['npm install -g auto-crosspost'];
    if (config.conditional) {
      dependencies.push('npm install gray-matter');
    }

    steps.push(`- name: Install dependencies
  run: |
    ${ dependencies.join('\n    ') }`);

    // Configuration step
    steps.push(`- name: Create configuration file
  env:
    ${ this.buildEnvVars(config.platforms) }
  run: |
    cat > crosspost.config.json << EOF
    ${ this.buildPlatformsConfig(config.platforms) }
    EOF`);

    // Processing steps
    if (config.conditional) {
      steps.push(...this.buildConditionalSteps(config));
    } else if (config.batchMode) {
      steps.push(...this.buildBatchSteps(config));
    } else {
      steps.push(...this.buildBasicSteps(config));
    }

    // Notification steps
    if (config.notifications.slack) {
      steps.push(...this.buildSlackNotifications());
    }
    if (config.notifications.discord) {
      steps.push(...this.buildDiscordNotifications());
    }

    return steps;
  }

  private buildEnvVars(platforms: string[]): string {
    const vars: string[] = [];

    if (platforms.includes('devto')) {
      vars.push('DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}');
    }

    if (platforms.includes('hashnode')) {
      vars.push('HASHNODE_ACCESS_TOKEN: ${{ secrets.HASHNODE_ACCESS_TOKEN }}');
      vars.push('HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}');
    }

    return vars.join('\n    ');
  }

  private buildBasicSteps(_config: WorkflowConfig): string[] {
    return [
      `- name: Get changed files
  id: changed-files
  run: |
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md')
    echo "files=$CHANGED_FILES" >> $GITHUB_OUTPUT`,

      `- name: Cross-post changed files
  if: steps.changed-files.outputs.files != ''
  run: |
    for file in \${{ steps.changed-files.outputs.files }}; do
      if [ -f "$file" ]; then
        echo "📝 Cross-posting: $file"
        auto-crosspost post "$file" --config crosspost.config.json
      fi
    done`
    ];
  }

  private buildConditionalSteps(_config: WorkflowConfig): string[] {
    return [
      `- name: Create frontmatter checker
  run: |
    cat > check-frontmatter.js << 'EOF'
    const fs = require('fs');
    const matter = require('gray-matter');

    async function checkAndCrossPost(filePath) {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);

      if (data.crosspost === true || data.published === true) {
        console.log(\`📝 Cross-posting: \${filePath}\`);
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        await execAsync(\`auto-crosspost post "\${filePath}" --config crosspost.config.json\`);
      }
    }

    Promise.all(process.argv.slice(2).map(checkAndCrossPost));
    EOF`,

      `- name: Process changed files
  run: |
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD -- '*.md' '**/*.md')
    if [ -n "$CHANGED_FILES" ]; then
      echo "$CHANGED_FILES" | xargs node check-frontmatter.js
    fi`
    ];
  }

  private buildBatchSteps(config: WorkflowConfig): string[] {
    return [
      `- name: Batch cross-post
  run: |
    for dir in ${ config.directories.join(' ') }; do
      if [ -d "$dir" ]; then
        echo "📁 Processing directory: $dir"
        auto-crosspost batch "$dir" --config crosspost.config.json
      fi
    done`
    ];
  }

  private buildSlackNotifications(): string[] {
    return [
      `- name: Notify Slack on Success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: '✅ Blog posts cross-posted successfully!'
  env:
    SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}`,

      `- name: Notify Slack on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: '❌ Cross-posting failed!'
  env:
    SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}`
    ];
  }

  private buildDiscordNotifications(): string[] {
    return [
      `- name: Notify Discord
  if: always()
  run: |
    STATUS="\${{ job.status }}"
    if [ "$STATUS" = "success" ]; then
      MESSAGE="✅ Blog posts cross-posted successfully!"
      COLOR="65280"
    else
      MESSAGE="❌ Cross-posting failed!"
      COLOR="16711680"
    fi

    curl -H "Content-Type: application/json" \\
      -d "{\"embeds\":[{\"title\":\"$MESSAGE\",\"color\":$COLOR}]}" \\
      "\${{ secrets.DISCORD_WEBHOOK_URL }}"`
    ];
  }

  private indentStep(step: string): string {
    return step.split('\n').map(line => `      ${ line }`).join('\n');
  }

  private async ensureDirectory(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  async generateSecretsTemplate(): Promise<void> {
    const template = `# GitHub Secrets Template for Auto-CrossPost

Add these secrets to your GitHub repository:
Settings > Secrets and variables > Actions > Repository secrets

## Required Secrets

### Dev.to Integration
DEVTO_API_KEY
  Description: Your Dev.to API key
  How to get: Go to https://dev.to/settings/extensions
  Example: dKE2wKzqDkVFJhzWjC_example_key

### Hashnode Integration
HASHNODE_ACCESS_TOKEN
  Description: Your Hashnode Personal Access Token
  How to get: Go to https://hashnode.com/settings/developer
  Example: 7a1b2c3d-example-token-4e5f-6789-abcdef123456

HASHNODE_PUBLICATION_ID
  Description: Your Hashnode publication ID
  How to get: From your publication settings URL
  Example: 507f1f77bcf86cd799439011

## Optional Secrets (for notifications)

SLACK_WEBHOOK_URL
  Description: Slack webhook URL for notifications
  How to get: Create webhook in Slack app settings

DISCORD_WEBHOOK_URL
  Description: Discord webhook URL for notifications
  How to get: Server Settings > Integrations > Webhooks

## Environment Variables Alternative

Instead of individual secrets, you can use a single config:

CROSSPOST_CONFIG
  Description: Complete JSON configuration
  Example: {"platforms":{"devto":{"apiKey":"..."}}}
`;

    await writeFile('github-secrets-template.md', template);
    console.log(chalk.blue('📋 Generated secrets template: github-secrets-template.md'));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const generator = new GitHubActionsGenerator();

  switch (command) {
    case 'basic':
      await generator.generateWorkflow({
        name: 'Auto CrossPost - Basic',
        trigger: 'push',
        platforms: ['devto', 'hashnode'],
        notifications: {},
        directories: ['posts', 'content', 'blog'],
        conditional: false,
        batchMode: false
      });
      break;

    case 'conditional':
      await generator.generateWorkflow({
        name: 'Auto CrossPost - Conditional',
        trigger: 'push',
        platforms: ['devto', 'hashnode'],
        notifications: {},
        directories: ['posts', 'content', 'blog'],
        conditional: true,
        batchMode: false
      });
      break;

    case 'batch':
      await generator.generateWorkflow({
        name: 'Auto CrossPost - Batch',
        trigger: 'schedule',
        platforms: ['devto', 'hashnode'],
        notifications: {},
        directories: ['posts'],
        conditional: false,
        batchMode: true
      });
      break;

    case 'full':
      await generator.generateWorkflow({
        name: 'Auto CrossPost - Full Featured',
        trigger: 'all',
        platforms: ['devto', 'hashnode'],
        notifications: { slack: true, discord: true },
        directories: ['posts', 'content', 'blog'],
        conditional: true,
        batchMode: false
      });
      break;

    case 'secrets':
      await generator.generateSecretsTemplate();
      break;

    default:
      console.log(chalk.yellow(`
🔧 Auto-CrossPost GitHub Actions Generator

Usage:
  node github-actions-generator.js [command]

Commands:
  basic       Generate basic workflow (post on push)
  conditional Generate conditional workflow (frontmatter-based)
  batch       Generate batch workflow (scheduled)
  full        Generate full-featured workflow (all options)
  secrets     Generate secrets template file

Examples:
  node github-actions-generator.js basic
  node github-actions-generator.js secrets
      `));
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { GitHubActionsGenerator };

