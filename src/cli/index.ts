#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { AutoCrossPost, CrossPostConfig } from '../index.ts';

const program = new Command();

program
  .name('crosspost')
  .description('Auto-CrossPost CLI - Cross-post your markdown content to multiple platforms')
  .version('0.1.0');

// Post command
program
  .command('post')
  .description('Cross-post a markdown file to all configured platforms')
  .argument('<file>', 'markdown file to cross-post')
  .option('-p, --platforms <platforms...>', 'specific platforms to post to')
  .option('-c, --config <config>', 'configuration file path', 'crosspost.config.json')
  .option('--dry-run', 'show what would be posted without actually posting')
  .action(async (file: string, options: any) => {
    try {
      const config = await loadConfig(options.config);
      const sdk = new AutoCrossPost(config, createLogger());

      console.log(chalk.blue(`📝 Cross-posting: ${ file }`));

      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - no actual posting will occur'));
        // In dry run, just parse and show what would be posted
        const markdownFile = await import('../utils/markdown-parser').then(m => m.MarkdownParser.parseFile(resolve(file)));
        const post = await import('../utils/markdown-parser').then(m => m.MarkdownParser.toPost(markdownFile));

        console.log(chalk.green('\n📄 Parsed content:'));
        console.log(`Title: ${ post.title }`);
        console.log(`Description: ${ post.description || 'None' }`);
        console.log(`Tags: ${ post.tags?.join(', ') || 'None' }`);
        console.log(`Status: ${ post.publishStatus }`);
        return;
      }

      const result = await sdk.crossPostFromFile(resolve(file), options.platforms);

      console.log(chalk.green(`\n✅ Cross-posting completed!`));
      console.log(`Total platforms: ${ result.total }`);
      console.log(`Successful: ${ chalk.green(result.successful) }`);
      console.log(`Failed: ${ chalk.red(result.failed) }`);

      for (const platformResult of result.results) {
        if (platformResult.success) {
          console.log(chalk.green(`  ✓ ${ platformResult.platform }: ${ platformResult.platformPost?.platformUrl || 'Success' }`));
        } else {
          console.log(chalk.red(`  ✗ ${ platformResult.platform }: ${ platformResult.error }`));
        }
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${ error instanceof Error ? error.message : 'Unknown error' }`));
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test authentication for all configured platforms')
  .option('-c, --config <config>', 'configuration file path', 'crosspost.config.json')
  .action(async (options: any) => {
    try {
      const config = await loadConfig(options.config);
      const sdk = new AutoCrossPost(config, createLogger());

      console.log(chalk.blue('🔐 Testing platform authentication...'));

      const results = await sdk.testAuthentication();

      console.log(chalk.green('\n🔍 Authentication results:'));
      for (const [platform, success] of Object.entries(results)) {
        if (success) {
          console.log(chalk.green(`  ✓ ${ platform }: Authenticated`));
        } else {
          console.log(chalk.red(`  ✗ ${ platform }: Authentication failed`));
        }
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${ error instanceof Error ? error.message : 'Unknown error' }`));
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List posts from a specific platform')
  .argument('<platform>', 'platform name (devto, hashnode)')
  .option('-c, --config <config>', 'configuration file path', 'crosspost.config.json')
  .option('--limit <limit>', 'number of posts to retrieve', '10')
  .action(async (platform: string, options: any) => {
    try {
      const config = await loadConfig(options.config);
      const sdk = new AutoCrossPost(config, createLogger());

      console.log(chalk.blue(`📚 Fetching posts from ${ platform }...`));

      const posts = await sdk.listPosts(platform, {
        perPage: parseInt(options.limit)
      });

      console.log(chalk.green(`\n📄 Found ${ posts.length } posts:`));
      for (const post of posts) {
        console.log(`  • ${ post.title } (${ post.platformId })`);
        console.log(`    Status: ${ post.publishStatus } | Views: ${ post.stats?.views || 0 }`);
        if (post.platformUrl) {
          console.log(`    URL: ${ post.platformUrl }`);
        }
        console.log('');
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${ error instanceof Error ? error.message : 'Unknown error' }`));
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Generate a sample configuration file')
  .option('-o, --output <output>', 'output file path', 'crosspost.config.json')
  .action(async (options: any) => {
    const sampleConfig: CrossPostConfig = {
      platforms: {
        devto: {
          apiKey: 'your-devto-api-key',
          defaultTags: ['webdev', 'programming']
        },
        hashnode: {
          token: 'your-hashnode-token',
          publicationId: 'your-publication-id',
          defaultTags: ['webdev', 'programming']
        }
      },
      defaults: {
        publishStatus: 'published',
        tags: ['crosspost']
      },
      options: {
        logLevel: 'info',
        retryAttempts: 3
      }
    };

    try {
      const { writeFile } = await import('fs/promises');
      await writeFile(options.output, JSON.stringify(sampleConfig, null, 2));
      console.log(chalk.green(`✅ Configuration file created: ${ options.output }`));
      console.log(chalk.yellow('⚠️  Remember to update the API keys and tokens!'));
    } catch (error) {
      console.error(chalk.red(`❌ Error creating config file: ${ error instanceof Error ? error.message : 'Unknown error' }`));
      process.exit(1);
    }
  });

// Helper functions
async function loadConfig(configPath: string): Promise<CrossPostConfig> {
  try {
    const configContent = await readFile(resolve(configPath), 'utf8');
    const config = JSON.parse(configContent) as CrossPostConfig;

    // Validate required configuration
    if (!config.platforms || Object.keys(config.platforms).length === 0) {
      throw new Error('No platforms configured. Run "crosspost config" to generate a sample configuration.');
    }

    return config;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${ configPath }. Run "crosspost config" to generate one.`);
    }
    throw error;
  }
}

function createLogger() {
  return {
    log: (...args: any[]) => console.log(...args),
    info: (...args: any[]) => console.log(chalk.blue('[INFO]'), ...args),
    warn: (...args: any[]) => console.log(chalk.yellow('[WARN]'), ...args),
    error: (...args: any[]) => console.log(chalk.red('[ERROR]'), ...args)
  };
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

program.parse();
