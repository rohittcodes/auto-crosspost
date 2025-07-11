#!/usr/bin/env node

/**
 * GitHub Actions Workflow Validator
 * 
 * Validates Auto-CrossPost GitHub Actions workflows and configurations
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface WorkflowFile {
  name: string;
  on: any;
  jobs: any;
}

class WorkflowValidator {
  private workflowsDir: string;

  constructor(workflowsDir: string = '.github/workflows') {
    this.workflowsDir = workflowsDir;
  }

  async validateWorkflow(workflowPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Check if file exists
      await access(workflowPath);

      // Read and parse workflow
      const content = await readFile(workflowPath, 'utf-8');
      const workflow = this.parseYaml(content);

      // Validate structure
      this.validateStructure(workflow, result);
      this.validateTriggers(workflow, result);
      this.validateJobs(workflow, result);
      this.validateSecrets(workflow, result);
      this.validatePaths(workflow, result);

    } catch (error) {
      result.valid = false;
      result.errors.push(`Failed to read workflow file: ${error}`);
    }

    return result;
  }

  private parseYaml(content: string): WorkflowFile {
    // Simple YAML parsing for basic validation
    // In production, use a proper YAML parser like js-yaml
    try {
      const lines = content.split('\n');
      const workflow: any = {};

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed.includes(':') && !trimmed.startsWith('-')) {
          const [key, value] = trimmed.split(':').map(s => s.trim());
          
          if (line.indexOf(key) === 0) {
            // Top level
            workflow[key] = value || {};
          }
        }
      }

      return workflow;
    } catch (error) {
      throw new Error(`Invalid YAML syntax: ${error}`);
    }
  }

  private validateStructure(workflow: WorkflowFile, result: ValidationResult): void {
    // Required fields
    if (!workflow.name) {
      result.errors.push('Workflow must have a name');
      result.valid = false;
    }

    if (!workflow.on) {
      result.errors.push('Workflow must have triggers (on:)');
      result.valid = false;
    }

    if (!workflow.jobs) {
      result.errors.push('Workflow must have jobs');
      result.valid = false;
    }
  }

  private validateTriggers(workflow: WorkflowFile, result: ValidationResult): void {
    if (!workflow.on) return;

    const validTriggers = ['push', 'pull_request', 'schedule', 'workflow_dispatch'];
    const hasValidTrigger = validTriggers.some(trigger => 
      typeof workflow.on === 'string' ? workflow.on === trigger : trigger in workflow.on
    );

    if (!hasValidTrigger) {
      result.warnings.push('Consider using standard triggers: push, pull_request, schedule, or workflow_dispatch');
    }

    // Check for path filters
    if (workflow.on.push && !workflow.on.push.paths) {
      result.suggestions.push('Consider adding path filters to only trigger on markdown file changes');
    }
  }

  private validateJobs(workflow: WorkflowFile, result: ValidationResult): void {
    if (!workflow.jobs) return;

    // Check for Auto-CrossPost specific steps
    const jobNames = Object.keys(workflow.jobs);
    
    for (const jobName of jobNames) {
      const job = workflow.jobs[jobName];
      
      if (!job.steps) {
        result.errors.push(`Job '${jobName}' must have steps`);
        result.valid = false;
        continue;
      }

      this.validateJobSteps(job.steps, result, jobName);
    }
  }

  private validateJobSteps(steps: any[], result: ValidationResult, jobName: string): void {
    const hasCheckout = steps.some(step => 
      step.uses && step.uses.includes('actions/checkout')
    );

    const hasNodeSetup = steps.some(step => 
      step.uses && step.uses.includes('actions/setup-node')
    );

    const hasAutoCrossPost = steps.some(step => 
      step.run && step.run.includes('auto-crosspost')
    );

    if (!hasCheckout) {
      result.warnings.push(`Job '${jobName}' should include actions/checkout`);
    }

    if (!hasNodeSetup) {
      result.warnings.push(`Job '${jobName}' should include actions/setup-node`);
    }

    if (!hasAutoCrossPost) {
      result.errors.push(`Job '${jobName}' should install and use auto-crosspost`);
      result.valid = false;
    }
  }

  private validateSecrets(workflow: WorkflowFile, result: ValidationResult): void {
    const workflowContent = JSON.stringify(workflow);
    
    const requiredSecrets = [];
    
    if (workflowContent.includes('DEVTO_API_KEY')) {
      requiredSecrets.push('DEVTO_API_KEY');
    }
    
    if (workflowContent.includes('HASHNODE_ACCESS_TOKEN')) {
      requiredSecrets.push('HASHNODE_ACCESS_TOKEN');
    }
    
    if (workflowContent.includes('HASHNODE_PUBLICATION_ID')) {
      requiredSecrets.push('HASHNODE_PUBLICATION_ID');
    }

    if (requiredSecrets.length > 0) {
      result.suggestions.push(
        `Ensure these secrets are configured in GitHub: ${requiredSecrets.join(', ')}`
      );
    }

    // Check for hardcoded secrets (security issue)
    const suspiciousPatterns = [
      /api[_-]?key["\s]*:["\s]*[a-zA-Z0-9]{20,}/i,
      /token["\s]*:["\s]*[a-zA-Z0-9]{20,}/i,
      /password["\s]*:["\s]*[^"]+/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(workflowContent)) {
        result.errors.push('❌ SECURITY ISSUE: Possible hardcoded credentials detected');
        result.valid = false;
      }
    }
  }

  private validatePaths(workflow: WorkflowFile, result: ValidationResult): void {
    const commonBlogDirs = ['posts', 'content', 'blog', 'articles', 'src/content'];
    const workflowContent = JSON.stringify(workflow);

    const hasPathFilter = commonBlogDirs.some(dir => 
      workflowContent.includes(`${dir}/**/*.md`)
    );

    if (!hasPathFilter) {
      result.suggestions.push(
        'Consider adding path filters for common blog directories: ' + 
        commonBlogDirs.map(dir => `${dir}/**/*.md`).join(', ')
      );
    }
  }

  async validateRepository(): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check if .github/workflows directory exists
    if (!existsSync(this.workflowsDir)) {
      result.errors.push(`Workflows directory not found: ${this.workflowsDir}`);
      result.valid = false;
      return result;
    }

    // Check for common blog directories
    const blogDirs = ['posts', 'content', 'blog', 'articles'];
    const existingDirs = blogDirs.filter(dir => existsSync(dir));

    if (existingDirs.length === 0) {
      result.warnings.push('No common blog directories found. Consider creating: posts/, content/, or blog/');
    } else {
      result.suggestions.push(`Found blog directories: ${existingDirs.join(', ')}`);
    }

    // Check for configuration files
    const configFiles = [
      'crosspost.config.json',
      'crosspost.config.js',
      '.crosspostrc.json',
      '.crosspostrc.yml'
    ];

    const existingConfigs = configFiles.filter(file => existsSync(file));
    
    if (existingConfigs.length === 0) {
      result.suggestions.push('Consider adding a configuration file for Auto-CrossPost');
    }

    return result;
  }

  printValidationResult(result: ValidationResult, filename?: string): void {
    const prefix = filename ? `[${filename}] ` : '';

    if (result.valid) {
      console.log(chalk.green(`✅ ${prefix}Validation passed!`));
    } else {
      console.log(chalk.red(`❌ ${prefix}Validation failed!`));
    }

    if (result.errors.length > 0) {
      console.log(chalk.red('\n🚨 Errors:'));
      result.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
    }

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
    }

    if (result.suggestions.length > 0) {
      console.log(chalk.blue('\n💡 Suggestions:'));
      result.suggestions.forEach(suggestion => console.log(chalk.blue(`  • ${suggestion}`)));
    }

    console.log(''); // Empty line
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const workflowFile = args[1];

  const validator = new WorkflowValidator();

  try {
    switch (command) {
      case 'workflow':
        if (!workflowFile) {
          console.log(chalk.red('Please specify a workflow file to validate'));
          console.log('Usage: node validator.js workflow <workflow-file>');
          process.exit(1);
        }
        
        const workflowResult = await validator.validateWorkflow(workflowFile);
        validator.printValidationResult(workflowResult, workflowFile);
        
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
        const { readdir } = await import('fs/promises');
        try {
          const workflowFiles = await readdir('.github/workflows');
          
          for (const file of workflowFiles) {
            if (file.endsWith('.yml') || file.endsWith('.yaml')) {
              const filePath = join('.github/workflows', file);
              const fileResult = await validator.validateWorkflow(filePath);
              validator.printValidationResult(fileResult, file);
              
              if (!fileResult.valid) {
                allRepoResult.valid = false;
              }
            }
          }
        } catch (error) {
          console.log(chalk.yellow('No workflow files found to validate'));
        }
        
        if (!allRepoResult.valid) {
          process.exit(1);
        }
        break;

      default:
        console.log(chalk.yellow(`
🔍 Auto-CrossPost Workflow Validator

Usage:
  node validator.js [command] [options]

Commands:
  workflow <file>  Validate a specific workflow file
  repository       Validate repository structure for Auto-CrossPost
  all             Validate repository and all workflow files

Examples:
  node validator.js workflow .github/workflows/crosspost.yml
  node validator.js repository
  node validator.js all
        `));
    }
  } catch (error) {
    console.error(chalk.red('Validation failed:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { WorkflowValidator };
