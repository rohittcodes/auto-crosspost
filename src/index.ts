// Main SDK exports
export { AutoCrossPost } from './auto-crosspost.ts';

// Core types and interfaces
export * from './core/types.ts';

// Batch processing services
export {
  BatchProcessor, BatchProgressReporter, CrossPostQueue, CrossPostScheduler, FileWatcher
} from './core/index.js';

// Platform clients
export * from './platforms/index.js';

// Utilities
export { ConfigManager } from './config/index.js';
export { MarkdownParser } from './utils/markdown-parser.js';

// Version info
export const VERSION = '0.1.0';
