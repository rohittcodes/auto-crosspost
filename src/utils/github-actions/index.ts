/**
 * GitHub Actions Utilities for Auto-CrossPost
 * 
 * This module provides utilities for integrating Auto-CrossPost with GitHub Actions,
 * including workflow generators and validators.
 */

export { GitHubActionsGenerator } from './generator';
export { WorkflowValidator } from './validator';

// Type definitions for GitHub Actions workflows
export interface WorkflowConfig {
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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Default configurations for common use cases
export const DEFAULT_CONFIGS = {
  basic: {
    name: 'Auto CrossPost - Basic',
    trigger: 'push' as const,
    platforms: ['devto', 'hashnode'] as const,
    notifications: {},
    directories: ['posts', 'content', 'blog'],
    conditional: false,
    batchMode: false
  },
  
  conditional: {
    name: 'Auto CrossPost - Conditional',
    trigger: 'push' as const,
    platforms: ['devto', 'hashnode'] as const,
    notifications: {},
    directories: ['posts', 'content', 'blog'],
    conditional: true,
    batchMode: false
  },
  
  scheduled: {
    name: 'Auto CrossPost - Scheduled',
    trigger: 'schedule' as const,
    platforms: ['devto', 'hashnode'] as const,
    notifications: {},
    directories: ['posts'],
    conditional: false,
    batchMode: true
  },
  
  full: {
    name: 'Auto CrossPost - Full Featured',
    trigger: 'all' as const,
    platforms: ['devto', 'hashnode'] as const,
    notifications: { slack: true, discord: true },
    directories: ['posts', 'content', 'blog'],
    conditional: true,
    batchMode: false
  }
} as const;

// GitHub Actions secrets requirements
export const REQUIRED_SECRETS = {
  devto: ['DEVTO_API_KEY'],
  hashnode: ['HASHNODE_ACCESS_TOKEN', 'HASHNODE_PUBLICATION_ID'],
  notifications: {
    slack: ['SLACK_WEBHOOK_URL'],
    discord: ['DISCORD_WEBHOOK_URL']
  }
} as const;

// Common blog directory patterns
export const COMMON_BLOG_DIRECTORIES = [
  'posts',
  'content',
  'blog',
  'articles',
  'src/content',
  'src/posts',
  'docs/blog',
  '_posts'
] as const;

// Path patterns for different file types
export const PATH_PATTERNS = {
  markdown: '**/*.md',
  mdx: '**/*.mdx',
  all: ['**/*.md', '**/*.mdx']
} as const;
