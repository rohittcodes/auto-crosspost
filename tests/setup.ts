/**
 * Jest test setup configuration
 * Configures test environment and global utilities
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test utilities
global.console = {
  ...global.console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Custom matchers for better test assertions
expect.extend({
  toBeValidPost(received: any) {
    const isValid = received &&
      typeof received.title === 'string' &&
      typeof received.content === 'string' &&
      received.title.length > 0 &&
      received.content.length > 0;

    return {
      message: () => 
        `expected ${received} to be a valid Post object with title and content`,
      pass: isValid,
    };
  },

  toBeValidPlatformPost(received: any) {
    const isValid = received &&
      typeof received.platformId === 'string' &&
      typeof received.platform === 'string' &&
      typeof received.title === 'string' &&
      received.platformId.length > 0;

    return {
      message: () => 
        `expected ${received} to be a valid PlatformPost object`,
      pass: isValid,
    };
  },
});

export {};
