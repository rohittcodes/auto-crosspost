import { BatchProcessor } from '../../src/core/batch-processor.ts';
import { MarkdownParser } from '../../src/utils/markdown-parser.ts';
import { AutoCrossPost } from '../../src/auto-crosspost.ts';
import { ConfigManager } from '../../src/config/index.ts';
import { createMockConfig } from '../test-utils.ts';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Mock dependencies
jest.mock('../../src/utils/markdown-parser.ts');
jest.mock('../../src/auto-crosspost.ts');
jest.mock('../../src/config/index.ts');

const MockedMarkdownParser = MarkdownParser as jest.MockedClass<typeof MarkdownParser>;
const MockedAutoCrossPost = AutoCrossPost as jest.MockedClass<typeof AutoCrossPost>;
const MockedConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;

describe('BatchProcessor', () => {
  let batchProcessor: BatchProcessor;
  let testDir: string;
  let testFiles: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup test directory
    testDir = join(process.cwd(), 'temp-test-batch');
    mkdirSync(testDir, { recursive: true });
    
    // Create test markdown files
    testFiles = [
      join(testDir, 'post1.md'),
      join(testDir, 'post2.md'),
      join(testDir, 'draft.md')
    ];
    
    writeFileSync(testFiles[0], '---\ntitle: Post 1\npublished: true\n---\n# Post 1\nContent');
    writeFileSync(testFiles[1], '---\ntitle: Post 2\npublished: true\n---\n# Post 2\nContent');
    writeFileSync(testFiles[2], '---\ntitle: Draft\npublished: false\n---\n# Draft\nContent');

    // Mock implementations
    MockedConfigManager.loadConfig = jest.fn().mockResolvedValue(createMockConfig());
    MockedMarkdownParser.parseFile = jest.fn().mockResolvedValue({
      frontmatter: { title: 'Test', published: true },
      content: '# Test\nContent'
    });
    
    MockedAutoCrossPost.prototype.crossPost = jest.fn().mockResolvedValue({
      total: 2,
      successful: 2,
      failed: 0,
      results: [
        { platform: 'devto', success: true, platformPost: {} },
        { platform: 'hashnode', success: true, platformPost: {} }
      ]
    });

    batchProcessor = new BatchProcessor({
      concurrency: 2,
      delay: 100,
      skipDrafts: true
    });
  });

  afterEach(() => {
    // Cleanup test directory
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const processor = new BatchProcessor();
      expect(processor).toBeInstanceOf(BatchProcessor);
    });

    it('should initialize with custom options', () => {
      const processor = new BatchProcessor({
        concurrency: 5,
        delay: 200,
        skipDrafts: false
      });
      expect(processor).toBeInstanceOf(BatchProcessor);
    });
  });

  describe('processFiles', () => {
    it('should process multiple files successfully', async () => {
      const results = await batchProcessor.processFiles(testFiles.slice(0, 2));

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].file).toBe('post1.md');
      expect(results[1].file).toBe('post2.md');
    });

    it('should skip drafts when configured', async () => {
      MockedMarkdownParser.parseFile = jest.fn()
        .mockResolvedValueOnce({
          frontmatter: { title: 'Published', published: true },
          content: '# Published'
        })
        .mockResolvedValueOnce({
          frontmatter: { title: 'Draft', published: false },
          content: '# Draft'
        });

      const results = await batchProcessor.processFiles([testFiles[0], testFiles[2]]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[1].error).toBe('Skipped draft');
    });

    it('should handle processing errors gracefully', async () => {
      MockedMarkdownParser.parseFile = jest.fn()
        .mockResolvedValueOnce({
          frontmatter: { title: 'Success', published: true },
          content: '# Success'
        })
        .mockRejectedValueOnce(new Error('Parse failed'));

      const results = await batchProcessor.processFiles(testFiles.slice(0, 2));

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Parse failed');
    });

    it('should respect concurrency limits', async () => {
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      MockedAutoCrossPost.prototype.crossPost = jest.fn().mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        concurrentCalls--;
        return {
          total: 1,
          successful: 1,
          failed: 0,
          results: [{ platform: 'devto', success: true, platformPost: {} }]
        };
      });

      await batchProcessor.processFiles(testFiles);

      expect(maxConcurrentCalls).toBeLessThanOrEqual(2); // Concurrency limit is 2
    });

    it('should add delays between requests', async () => {
      const startTime = Date.now();
      const processor = new BatchProcessor({ concurrency: 1, delay: 100 });

      await processor.processFiles(testFiles.slice(0, 2));
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should take at least 100ms delay between files
      expect(totalTime).toBeGreaterThan(100);
    });
  });

  describe('file path handling', () => {
    it('should extract filename from full path', async () => {
      const results = await batchProcessor.processFiles([testFiles[0]]);

      expect(results[0].file).toBe('post1.md');
      expect(results[0].file).not.toContain(testDir);
    });
  });

  describe('error scenarios', () => {
    it('should handle SDK initialization failure', async () => {
      const configError = new Error('Config failed');
      
      // Create a new batch processor instance for this test
      const failingProcessor = new BatchProcessor();
      
      // Mock ConfigManager.loadConfig to throw an error
      MockedConfigManager.loadConfig = jest.fn().mockRejectedValue(configError);

      // Expect the processFiles call to reject with the config error
      await expect(failingProcessor.processFiles([testFiles[0]])).rejects.toThrow('Config failed');
    });

    it('should handle cross-posting failures', async () => {
      MockedAutoCrossPost.prototype.crossPost = jest.fn().mockResolvedValue({
        total: 1,
        successful: 0,
        failed: 1,
        results: [{ platform: 'devto', success: false, error: 'API Error' }]
      });

      const results = await batchProcessor.processFiles([testFiles[0]]);

      expect(results[0].success).toBe(false);
    });
  });
});
