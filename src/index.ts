// Main SDK exports
export { AutoCrossPost } from './auto-crosspost';

// Core types and interfaces
export * from './core/types';

// Batch processing services
export {
  BatchProcessor, BatchProgressReporter, CrossPostQueue, CrossPostScheduler, FileWatcher
} from './core/index.js';

// Platform clients
export * from './platforms/index.js';

// Utilities
export { ConfigManager } from './config/index.js';
export { MarkdownParser } from './utils/markdown-parser.js';

// GitHub Actions utilities
export * from './utils/github-actions/index.js';

// Version info
export const VERSION = '0.1.0';
