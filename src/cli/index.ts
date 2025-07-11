#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { resolve, join } from 'path';
import { AutoCrossPost, CrossPostConfig } from '../index';

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

// GitHub Actions command group
const githubActionsCmd = program
  .command('github-actions')
  .alias('ga')
  .description('GitHub Actions integration utilities');

// Generate GitHub Actions workflow
githubActionsCmd
  .command('generate')
  .description('Generate GitHub Actions workflow files')
  .argument('<type>', 'workflow type (basic, conditional, batch, full, monorepo)')
  .option('-o, --output <dir>', 'output directory', '.github/workflows')
  .action(async (type: string, options: any) => {
    try {
      const { GitHubActionsGenerator } = await import('../utils/github-actions/index.js');
      
      const generator = new GitHubActionsGenerator(options.output);
      
      const configs = {
        basic: {
          name: 'Auto CrossPost - Basic',
          trigger: 'push' as const,
          platforms: ['devto', 'hashnode'] as ('devto' | 'hashnode')[],
          notifications: {},
          directories: ['posts', 'content', 'blog'],
          conditional: false,
          batchMode: false
        },
        conditional: {
          name: 'Auto CrossPost - Conditional',
          trigger: 'push' as const,
          platforms: ['devto', 'hashnode'] as ('devto' | 'hashnode')[],
          notifications: {},
          directories: ['posts', 'content', 'blog'],
          conditional: true,
          batchMode: false
        },
        batch: {
          name: 'Auto CrossPost - Scheduled',
          trigger: 'schedule' as const,
          platforms: ['devto', 'hashnode'] as ('devto' | 'hashnode')[],
          notifications: {},
          directories: ['posts'],
          conditional: false,
          batchMode: true
        },
        full: {
          name: 'Auto CrossPost - Full Featured',
          trigger: 'all' as const,
          platforms: ['devto', 'hashnode'] as ('devto' | 'hashnode')[],
          notifications: { slack: true, discord: true },
          directories: ['posts', 'content', 'blog'],
          conditional: true,
          batchMode: false
        },
        monorepo: {
          name: 'Auto CrossPost - Monorepo',
          trigger: 'push' as const,
          platforms: ['devto', 'hashnode'] as ('devto' | 'hashnode')[],
          notifications: {},
          directories: ['apps/*/blog', 'packages/*/content'],
          conditional: false,
          batchMode: false
        }
      };
      
      const config = configs[type as keyof typeof configs];
      if (!config) {
        console.log(chalk.red(`❌ Unknown workflow type: ${type}`));
        console.log(chalk.yellow('Available types: basic, conditional, batch, full, monorepo'));
        process.exit(1);
      }
      
      await generator.generateWorkflow(config);
      
      if (type === 'basic' || type === 'full') {
        await generator.generateSecretsTemplate();
      }
      
      console.log(chalk.green(`✅ Generated ${type} workflow`));
      console.log(chalk.blue('💡 Next steps:'));
      console.log('  1. Set up required secrets in GitHub repository settings');
      console.log('  2. Customize the workflow for your directory structure');
      console.log('  3. Commit and push to trigger the workflow');
      
    } catch (error) {
      console.error(chalk.red(`❌ Error generating workflow: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Validate GitHub Actions workflow
githubActionsCmd
  .command('validate')
  .description('Validate GitHub Actions workflows and repository structure')
  .argument('<target>', 'validation target (workflow <file>, repository, all)')
  .argument('[file]', 'workflow file path (required for workflow validation)')
  .action(async (target: string, file?: string) => {
    try {
      const { WorkflowValidator } = await import('../utils/github-actions/index.js');
      
      const validator = new WorkflowValidator();
      
      switch (target) {
        case 'workflow':
          if (!file) {
            console.log(chalk.red('❌ Workflow file path required'));
            console.log('Usage: crosspost github-actions validate workflow <file>');
            process.exit(1);
          }
          
          const workflowResult = await validator.validateWorkflow(file);
          validator.printValidationResult(workflowResult, file);
          
          if (!workflowResult.valid) {
            process.exit(1);
          }
          break;
          
        case 'repository':
        case 'repo':
          const repoResult = await validator.validateRepository();
          validator.printValidationResult(repoResult, 'Repository');
          
          if (!repoResult.valid) {
            process.exit(1);
          }
          break;
          
        case 'all':
          // Validate repository
          const allRepoResult = await validator.validateRepository();
          validator.printValidationResult(allRepoResult, 'Repository');
          
          // Find and validate all workflow files
          try {
            const { readdir } = await import('fs/promises');
            const workflowFiles = await readdir('.github/workflows');
            
            for (const workflowFile of workflowFiles) {
              if (workflowFile.endsWith('.yml') || workflowFile.endsWith('.yaml')) {
                const filePath = join('.github/workflows', workflowFile);
                const fileResult = await validator.validateWorkflow(filePath);
                validator.printValidationResult(fileResult, workflowFile);
                
                if (!fileResult.valid) {
                  allRepoResult.valid = false;
                }
              }
            }
          } catch (error) {
            console.log(chalk.yellow('⚠️ No workflow files found to validate'));
          }
          
          if (!allRepoResult.valid) {
            process.exit(1);
          }
          break;
          
        default:
          console.log(chalk.red(`❌ Unknown validation target: ${target}`));
          console.log(chalk.yellow('Available targets: workflow, repository, all'));
          process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// GitHub Actions secrets template
githubActionsCmd
  .command('secrets')
  .description('Generate GitHub secrets template')
  .option('-o, --output <file>', 'output file', 'github-secrets-template.md')
  .action(async (_options: any) => {
    try {
      const { GitHubActionsGenerator } = await import('../utils/github-actions/index.js');
      
      const generator = new GitHubActionsGenerator();
      await generator.generateSecretsTemplate();
      
      console.log(chalk.green('✅ Generated GitHub secrets template'));
      console.log(chalk.blue('💡 Use this template to set up secrets in your GitHub repository'));
      
    } catch (error) {
      console.error(chalk.red(`❌ Error generating secrets template: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
