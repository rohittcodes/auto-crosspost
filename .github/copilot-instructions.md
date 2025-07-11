# GitHub Copilot Instructions for Auto-CrossPost SDK

## Project Context
This is the Auto-CrossPost SDK project - a TypeScript SDK that automatically cross-posts markdown/MDX blog posts from a personal portfolio website to multiple blogging platforms (Dev.to and Hashnode).

## Project Structure & Architecture
When working on this project, consider the following structure:

```
auto-crosspost/
├── src/
│   ├── core/           # Core types, base client, markdown parser, transformers
│   ├── platforms/      # Platform-specific implementations (devto, hashnode)
│   ├── utils/          # File reader, image handler, logger, config
│   ├── cli/            # CLI commands and utilities
│   └── index.ts        # Main SDK entry point
├── examples/           # Integration examples
├── tests/              # Unit, integration, e2e tests
└── docs/              # Documentation
```

## Key Technologies & Dependencies
- **Language**: TypeScript 5.0+
- **HTTP Client**: Axios for REST APIs
- **GraphQL Client**: graphql-request for Hashnode
- **Markdown Processing**: gray-matter, remark, remark-html
- **CLI Framework**: commander
- **Logging**: winston
- **Testing**: Jest with ts-jest

## Platform-Specific Guidelines

### Dev.to Integration
- Uses REST API with API key authentication
- Base URL: `https://dev.to/api`
- Rate limit: 1000 requests/hour
- Key endpoints: POST/PUT/GET/DELETE for articles
- Content format: Markdown with frontmatter

### Hashnode Integration
- Uses GraphQL API with Personal Access Token
- Base URL: `https://api.hashnode.com`
- Rate limit: 1000 requests/hour
- Key mutations: CreatePublicationStory, UpdateStory
- Content format: Markdown with rich metadata

## Code Style & Patterns

### File Size and Modularity Rules ⭐
- **CRITICAL**: No file should exceed 400 lines of code
- **Target**: Keep files between 200-300 lines for optimal maintainability
- **When approaching 300+ lines**: Immediately split into smaller modules
- **Single Responsibility**: Each file should have ONE clear purpose

### Modular Architecture Enforcement
```typescript
// ✅ Good: Small, focused files
// platforms/devto/devto-client.ts (<200 lines)
// platforms/devto/devto-api.ts (<150 lines) 
// platforms/devto/devto-transformer.ts (<150 lines)

// ❌ Avoid: Large monolithic files
// platforms/devto/devto-client.ts (600+ lines)
```

### Interface Design
Always define clear interfaces following this pattern:
```typescript
interface Post {
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  canonicalUrl?: string;
  publishStatus: 'draft' | 'published';
  coverImage?: string;
  publishedAt?: Date;
}

interface PlatformClient {
  name: string;
  authenticate(): Promise<boolean>;
  createPost(post: Post): Promise<PlatformPost>;
  updatePost(platformId: string, post: Post): Promise<PlatformPost>;
  // ... other CRUD operations
}
```

### Error Handling
Implement comprehensive error handling with retry logic:
- Use exponential backoff for rate limiting
- Provide clear error messages with context
- Log errors with appropriate levels (info, warn, error)
- Implement graceful degradation for partial failures

### Configuration Management
Support multiple configuration methods:
- Environment variables
- Configuration files (.crosspostrc.yml)
- Programmatic configuration
- CLI arguments

## Development Phases & Priorities

### Current Phase Awareness
The project follows a 5-week development roadmap:
1. **Week 1**: Foundation (types, base client, markdown parser)
2. **Week 2-3**: Platform Integration (Dev.to then Hashnode)
3. **Week 4**: SDK Core (orchestrator, batch processing)
4. **Week 5**: CLI & Integration (commands, Next.js example)
5. **Week 6**: Testing & Documentation

### Implementation Order
1. Core types and base client first
2. Dev.to integration (higher priority)
3. Hashnode integration second
4. CLI tool and integrations last

## Testing Requirements
- **Unit Tests**: All core components, platform clients, utilities
- **Integration Tests**: End-to-end workflows, real API calls
- **Mock Strategy**: Use test accounts for platform APIs
- **Coverage Goal**: >90% test coverage

## Security & Best Practices
- Never hardcode API keys or tokens
- Use environment variables for sensitive data
- Implement proper rate limiting and retry logic
- Validate all inputs and sanitize content
- Follow principle of least privilege for API permissions

## CLI Design Patterns
Implement these CLI commands following commander.js patterns:
- `crosspost post <file>` - Post single file
- `crosspost batch <directory>` - Batch post
- `crosspost status` - Check posting status
- `crosspost sync` - Sync all platforms

## Next.js Integration Patterns
Support seamless integration with Next.js projects:
- API routes for webhook handling
- Utility functions for content discovery
- Type-safe configuration interfaces
- Build-time and runtime integration options

## Content Processing Guidelines
- Parse MDX/Markdown using gray-matter for frontmatter
- Transform content appropriately for each platform
- Handle images and media assets
- Maintain canonical URLs for SEO
- Preserve code syntax highlighting

## Logging & Monitoring
Implement structured logging:
- Use winston for logging
- Support different log levels (debug, info, warn, error)
- Include correlation IDs for tracking requests
- Log performance metrics and API response times

## Future-Proofing Considerations
- Design modular architecture for easy platform addition
- Abstract platform-specific logic behind interfaces
- Support plugin architecture for extensibility
- Maintain backward compatibility for configuration

## Common Patterns to Suggest
1. **Factory Pattern**: For creating platform clients
2. **Strategy Pattern**: For content transformation
3. **Observer Pattern**: For status tracking
4. **Builder Pattern**: For configuration setup
5. **Template Method**: For common API operations

## Specific File Contexts

### When working on core/ files:
- Focus on reusability and abstraction
- Define clear interfaces and types
- Implement robust error handling
- Consider all supported platforms
- **KEEP FILES UNDER 400 LINES** - split into multiple files if needed

### When working on platforms/ files:
- Follow platform-specific API patterns
- Implement comprehensive error mapping
- Handle rate limiting appropriately
- Transform content to platform requirements
- **SPLIT LARGE CLIENTS**: Separate API, transformer, and validator concerns

### When working on cli/ files:
- Follow commander.js best practices
- Provide helpful error messages
- Support both interactive and non-interactive modes
- Include progress indicators for long operations
- **MODULARIZE COMMANDS**: Each major command in separate file

### When working on tests/ files:
- Test both success and error scenarios
- Mock external API calls appropriately
- Use descriptive test names and organize by feature
- Include integration tests with real APIs
- **MIRROR SOURCE STRUCTURE**: Test files should match source modularity

### When working on utils/ files:
- **CRITICAL**: Split utilities into focused modules (parsing, validation, transformation)
- Each utility function should be in appropriately named file
- Avoid mixing different types of utilities in same file
- Keep utility files under 200 lines each

## File Size Monitoring & Enforcement

### Automated File Size Checking
Add these scripts to package.json for monitoring:
```json
{
  "scripts": {
    "check-file-sizes": "find src -name '*.ts' -exec wc -l {} + | sort -nr | head -20",
    "lint-file-size": "eslint src --rule 'max-lines: [error, 400]'",
    "modularity-check": "node scripts/check-modularity.js"
  }
}
```

### Refactoring Triggers (Immediate Action Required)
When any file exceeds these limits:
- **400+ lines**: IMMEDIATE refactoring required
- **300+ lines**: Plan refactoring in next iteration
- **200+ lines**: Consider if splitting would improve clarity

### Common Splitting Patterns
1. **Large Clients**: Split into client + api + transformer + validator
2. **Complex Parsers**: Split into parser + extractor + validator + formatter
3. **Multi-Command CLI**: Split each command into separate file
4. **Large Type Files**: Group related types into focused files

## Performance Considerations
- Implement batching for multiple posts
- Use connection pooling for HTTP requests
- Cache authentication tokens appropriately
- Optimize markdown parsing and transformation
- Consider parallel processing for independent operations

This project aims to provide a seamless, developer-friendly experience for automated cross-posting while maintaining high code quality and comprehensive testing.
