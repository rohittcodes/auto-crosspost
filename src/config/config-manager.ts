import { access, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { CrossPostConfig } from '../core/types.ts';

/**
 * Configuration manager for Auto-CrossPost SDK
 * Handles loading, saving, and validating configuration files
 */
export class ConfigManager {
  private static readonly CONFIG_FILENAMES = [
    '.crosspostrc.json',
    '.crosspostrc.yml',
    '.crosspostrc.yaml',
    'crosspost.config.js',
    'crosspost.config.ts',
  ];

  private static readonly GLOBAL_CONFIG_PATH = join(homedir(), '.crosspostrc.json');

  /**
   * Load configuration from various sources in order of precedence:
   * 1. Explicit config object
   * 2. Environment variables
   * 3. Local config file
   * 4. Global config file
   * 5. Default configuration
   */
  static async loadConfig(
    configPath?: string,
    explicitConfig?: Partial<CrossPostConfig>
  ): Promise<CrossPostConfig> {
    let config: Partial<CrossPostConfig> = {};

    // 1. Start with default configuration
    config = this.getDefaultConfig();

    // 2. Load from global config file
    try {
      const globalConfig = await this.loadConfigFile(this.GLOBAL_CONFIG_PATH);
      config = { ...config, ...globalConfig };
    } catch (error) {
      // Global config is optional
    }

    // 3. Load from local config file
    if (configPath) {
      const localConfig = await this.loadConfigFile(configPath);
      config = { ...config, ...localConfig };
    } else {
      // Search for config files in current directory
      for (const filename of this.CONFIG_FILENAMES) {
        try {
          const localConfig = await this.loadConfigFile(filename);
          config = { ...config, ...localConfig };
          break; // Use first found config file
        } catch (error) {
          // Continue searching
        }
      }
    }

    // 4. Apply environment variables
    const envConfig = this.loadFromEnvironment();
    config = { ...config, ...envConfig };

    // 5. Apply explicit configuration (highest precedence)
    if (explicitConfig) {
      config = { ...config, ...explicitConfig };
    }

    // Validate the final configuration
    this.validateConfig(config as CrossPostConfig);

    return config as CrossPostConfig;
  }

  /**
   * Save configuration to a file
   */
  static async saveConfig(
    config: CrossPostConfig,
    filePath: string = this.GLOBAL_CONFIG_PATH
  ): Promise<void> {
    try {
      // Create directory if it doesn't exist
      const dir = dirname(filePath);
      await access(dir).catch(async () => {
        const { mkdir } = await import('fs/promises');
        await mkdir(dir, { recursive: true });
      });

      // Remove sensitive data before saving
      const sanitizedConfig = this.sanitizeConfig(config);

      const configJson = JSON.stringify(sanitizedConfig, null, 2);
      await writeFile(filePath, configJson, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save configuration: ${ error }`);
    }
  }

  /**
   * Load configuration from a specific file
   */
  private static async loadConfigFile(filePath: string): Promise<Partial<CrossPostConfig>> {
    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf8');

      if (filePath.endsWith('.json')) {
        return JSON.parse(content);
      }

      if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
        // Dynamic import for YAML support
        try {
          const yaml = await import('js-yaml');
          return yaml.load(content) as Partial<CrossPostConfig>;
        } catch (importError) {
          // Fallback: try to parse as simple key-value pairs if js-yaml package is not available
          try {
            return this.parseSimpleYaml(content);
          } catch (parseError) {
            throw new Error(
              `YAML parsing failed. Content might be too complex for simple parser. ` +
              `Error: ${ parseError }. Try using JSON format (.crosspostrc.json) instead.`
            );
          }
        }
      }

      if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        // Dynamic import for JS/TS config files
        const configModule = await import(filePath);
        return configModule.default || configModule;
      }

      throw new Error(`Unsupported config file format: ${ filePath }`);
    } catch (error) {
      throw new Error(`Failed to load config file ${ filePath }: ${ error }`);
    }
  }

  /**
   * Load configuration from environment variables
   */
  private static loadFromEnvironment(): Partial<CrossPostConfig> {
    const config: Partial<CrossPostConfig> = {
      platforms: {},
    };

    // Dev.to configuration
    if (process.env.DEVTO_API_KEY) {
      config.platforms!.devto = {
        apiKey: process.env.DEVTO_API_KEY,
      };
    }

    // Hashnode configuration
    if (process.env.HASHNODE_TOKEN) {
      config.platforms!.hashnode = {
        token: process.env.HASHNODE_TOKEN,
        ...(process.env.HASHNODE_PUBLICATION_ID && {
          publicationId: process.env.HASHNODE_PUBLICATION_ID,
        }),
      };
    }

    // Global settings
    const options: any = {};

    if (process.env.CROSSPOST_RETRY_ATTEMPTS) {
      options.retryAttempts = parseInt(process.env.CROSSPOST_RETRY_ATTEMPTS, 10);
    }

    if (process.env.CROSSPOST_LOG_LEVEL) {
      options.logLevel = process.env.CROSSPOST_LOG_LEVEL;
    }

    if (process.env.CROSSPOST_AUTO_SYNC === 'true') {
      options.autoSync = true;
    }

    if (Object.keys(options).length > 0) {
      config.options = options;
    }

    if (process.env.CROSSPOST_DEFAULT_CANONICAL_URL) {
      config.defaults = {
        canonicalUrl: process.env.CROSSPOST_DEFAULT_CANONICAL_URL,
      };
    }

    return config;
  }

  /**
   * Get default configuration
   */
  private static getDefaultConfig(): CrossPostConfig {
    return {
      platforms: {},
      defaults: {
        publishStatus: 'draft',
      },
      options: {
        retryAttempts: 3,
        logLevel: 'info',
        autoSync: false,
        watchMode: false,
      },
    };
  }

  /**
   * Validate configuration object
   */
  private static validateConfig(config: CrossPostConfig): void {
    const errors: string[] = [];

    // Check if at least one platform is configured
    if (!config.platforms || Object.keys(config.platforms).length === 0) {
      errors.push('At least one platform must be configured');
    }

    // Validate Dev.to configuration
    if (config.platforms.devto) {
      if (!config.platforms.devto.apiKey) {
        errors.push('Dev.to API key is required');
      }
    }

    // Validate Hashnode configuration
    if (config.platforms.hashnode) {
      if (!config.platforms.hashnode.token) {
        errors.push('Hashnode token is required');
      }
    }

    // Validate retry settings
    if (config.options?.retryAttempts !== undefined &&
      (config.options.retryAttempts < 0 || config.options.retryAttempts > 10)) {
      errors.push('Retry attempts must be between 0 and 10');
    }

    // Validate log level
    if (config.options?.logLevel &&
      !['debug', 'info', 'warn', 'error'].includes(config.options.logLevel)) {
      errors.push('Log level must be one of: debug, info, warn, error');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${ errors.join(', ') }`);
    }
  }

  /**
   * Remove sensitive data from configuration before saving
   */
  private static sanitizeConfig(config: CrossPostConfig): Partial<CrossPostConfig> {
    const sanitized = JSON.parse(JSON.stringify(config));

    // Replace sensitive values with placeholders
    if (sanitized.platforms?.devto?.apiKey) {
      sanitized.platforms.devto.apiKey = '<DEVTO_API_KEY>';
    }

    if (sanitized.platforms?.hashnode?.token) {
      sanitized.platforms.hashnode.token = '<HASHNODE_TOKEN>';
    }

    return sanitized;
  }

  /**
   * Generate a sample configuration file
   */
  static generateSampleConfig(): CrossPostConfig {
    return {
      platforms: {
        devto: {
          apiKey: '<YOUR_DEVTO_API_KEY>',
        },
        hashnode: {
          token: '<YOUR_HASHNODE_TOKEN>',
          publicationId: '<YOUR_HASHNODE_PUBLICATION_ID>',
        },
      },
      defaults: {
        publishStatus: 'draft',
        canonicalUrl: 'https://yourblog.com',
      },
      options: {
        retryAttempts: 3,
        logLevel: 'info',
        autoSync: false,
        watchMode: false,
      },
    };
  }

  /**
   * Create an interactive configuration wizard
   */
  static async createConfigWizard(): Promise<CrossPostConfig> {
    // This would be implemented with a CLI prompt library like inquirer
    // For now, return a sample config
    return this.generateSampleConfig();
  }

  /**
   * Merge multiple configuration objects
   */
  static mergeConfigs(...configs: Partial<CrossPostConfig>[]): CrossPostConfig {
    const merged: Partial<CrossPostConfig> = {
      platforms: {},
      defaults: {},
      options: {},
    };

    for (const config of configs) {
      if (config.platforms) {
        merged.platforms = { ...merged.platforms, ...config.platforms };
      }

      if (config.defaults) {
        merged.defaults = { ...merged.defaults, ...config.defaults };
      }

      if (config.options) {
        merged.options = { ...merged.options, ...config.options };
      }
    }

    return merged as CrossPostConfig;
  }

  /**
   * Simple YAML parser for basic key-value configurations
   * Fallback when the yaml package is not available
   */
  private static parseSimpleYaml(content: string): Partial<CrossPostConfig> {
    const lines = content.split('\n');
    const result: any = {};
    let currentSection: any = result;
    let sectionStack: any[] = [result];
    let indentStack: number[] = [0];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Calculate indentation
      const indent = line.length - line.trimStart().length;

      // Handle indentation changes
      while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
        indentStack.pop();
        sectionStack.pop();
      }

      currentSection = sectionStack[sectionStack.length - 1];

      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();

        if (value === '' || value === '{}' || value === '[]') {
          // This is a section header
          currentSection[key.trim()] = {};
          sectionStack.push(currentSection[key.trim()]);
          indentStack.push(indent);
        } else {
          // This is a key-value pair
          let parsedValue: any = value;

          // Try to parse as different types
          if (value === 'true') parsedValue = true;
          else if (value === 'false') parsedValue = false;
          else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10);
          else if (value.startsWith('"') && value.endsWith('"')) {
            parsedValue = value.slice(1, -1);
          }

          currentSection[key.trim()] = parsedValue;
        }
      } else if (trimmed.startsWith('- ')) {
        // Handle simple arrays
        const arrayValue = trimmed.slice(2).trim();
        const parentKey = Object.keys(currentSection).pop();
        if (parentKey && !Array.isArray(currentSection[parentKey])) {
          currentSection[parentKey] = [];
        }
        if (parentKey) {
          currentSection[parentKey].push(arrayValue);
        }
      }
    }

    return result;
  }
}
