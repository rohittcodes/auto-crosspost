# Auto-CrossPost SDK - Complete Planning Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Workflow Analysis](#current-workflow-analysis)
3. [Platform API Research](#platform-api-research)
4. [Architecture Design](#architecture-design)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Technical Specifications](#technical-specifications)
7. [Development Phases](#development-phases)
8. [Testing Strategy](#testing-strategy)
9. [Deployment & Integration](#deployment--integration)
10. [Future Enhancements](#future-enhancements)

## Project Overview

### What We're Building
A TypeScript SDK that automatically cross-posts markdown/MDX blog posts from a personal portfolio website to multiple blogging platforms:
- **Dev.to** (via REST API)
- **Hashnode** (via GraphQL API)

### Target User Workflow
1. Write blog posts in MDX format in portfolio project
2. Push to GitHub → Vercel deployment
3. SDK automatically detects new/changed posts
4. Cross-posts to multiple platforms with proper attribution
5. Maintains canonical URLs and SEO best practices

### Key Benefits
- **Automation**: No manual cross-posting required
- **Consistency**: Same content across all platforms
- **SEO Friendly**: Proper canonical URLs and attribution
- **Flexible**: Configurable for different platforms and preferences
- **Developer Friendly**: TypeScript-first with excellent DX

## Current Workflow Analysis

### Your Current Setup
```
Portfolio Project (Next.js + TypeScript)
├── content/blog/
│   ├── post-1.mdx
│   ├── post-2.mdx
│   └── ...
├── pages/blog/
├── components/
└── package.json
```

### Current Process
1. Write MDX files in `content/blog/`
2. Commit and push to GitHub
3. Vercel auto-deploys
4. Manual cross-posting to platforms (time-consuming)

### Pain Points
- Manual cross-posting is repetitive
- Inconsistent formatting across platforms
- No automation for new posts
- Time-consuming process
- Risk of forgetting to cross-post

## Platform API Research

### 1. Dev.to API
**Status**: ✅ Fully Supported
- **Base URL**: `https://dev.to/api`
- **Authentication**: API Key in header
- **Rate Limits**: 1000 requests/hour
- **Endpoints**:
  - `POST /api/articles` - Create article
  - `PUT /api/articles/:id` - Update article
  - `GET /api/articles/me` - Get user articles
  - `DELETE /api/articles/:id` - Delete article

**API Key Setup**:
1. Go to https://dev.to/settings/account
2. Generate API key
3. Use in header: `api-key: YOUR_API_KEY`

### 2. Hashnode API
**Status**: ✅ Fully Supported
- **Base URL**: `https://api.hashnode.com`
- **Authentication**: Personal Access Token
- **API Type**: GraphQL
- **Rate Limits**: 1000 requests/hour

**Token Setup**:
1. Go to https://hashnode.com/settings/developer
2. Generate Personal Access Token
3. Use in header: `Authorization: Bearer YOUR_TOKEN`

**Key GraphQL Mutations**:
```graphql
mutation CreatePublicationStory($input: CreateStoryInput!) {
  createPublicationStory(input: $input) {
    story {
      _id
      title
      slug
      url
    }
  }
}
```



## Architecture Design

### Project Structure
```
auto-crosspost/
├── src/
│   ├── core/
│   │   ├── types.ts              # Common interfaces and types
│   │   ├── base-client.ts        # Abstract base client
│   │   ├── markdown-parser.ts    # MDX/Markdown parsing
│   │   └── content-transformer.ts # Platform-specific transformations
│   ├── platforms/
│   │   ├── devto/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── transformer.ts
│   │   ├── hashnode/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── transformer.ts

│   ├── utils/
│   │   ├── file-reader.ts        # MDX file reading utilities
│   │   ├── image-handler.ts      # Image upload management
│   │   ├── logger.ts             # Structured logging
│   │   └── config.ts             # Configuration management
│   ├── cli/
│   │   ├── index.ts              # CLI entry point
│   │   ├── commands/
│   │   │   ├── post.ts
│   │   │   ├── batch.ts
│   │   │   └── status.ts
│   │   └── utils.ts
│   └── index.ts                  # Main SDK entry point
├── examples/
│   ├── nextjs-integration.ts
│   ├── cli-usage.ts
│   └── webhook-integration.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── api-reference.md
│   ├── platform-setup.md
│   └── troubleshooting.md
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Core Interfaces

```typescript
// Base post interface
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

// Platform-specific post interface
interface PlatformPost extends Post {
  platformId?: string;
  platformUrl?: string;
  lastSynced?: Date;
}

// Platform client interface
interface PlatformClient {
  name: string;
  authenticate(): Promise<boolean>;
  createPost(post: Post): Promise<PlatformPost>;
  updatePost(platformId: string, post: Post): Promise<PlatformPost>;
  deletePost(platformId: string): Promise<boolean>;
  getPost(platformId: string): Promise<PlatformPost>;
  listPosts(): Promise<PlatformPost[]>;
}

// SDK configuration
interface CrossPostConfig {
  platforms: {
    devto?: { apiKey: string };
    hashnode?: { token: string; publicationId?: string };
  };
  defaults?: {
    tags?: string[];
    publishStatus?: 'draft' | 'published';
    canonicalUrl?: string;
  };
  options?: {
    autoSync?: boolean;
    watchMode?: boolean;
    retryAttempts?: number;
  };
}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Set up project structure and core functionality

**Tasks**:
- [ ] Initialize TypeScript project with proper configuration
- [ ] Set up testing framework (Jest)
- [ ] Create core types and interfaces
- [ ] Implement base client abstract class
- [ ] Create markdown parser utilities
- [ ] Set up logging and error handling
- [ ] Create configuration management

**Deliverables**:
- Basic project structure
- Core types and interfaces
- Base client implementation
- Markdown parsing utilities

### Phase 2: Platform Integration (Week 2-3)
**Goal**: Implement platform-specific clients

**Tasks**:
- [ ] **Dev.to Integration** (Priority 1)
  - [ ] Implement Dev.to client
  - [ ] Create content transformer
  - [ ] Add authentication handling
  - [ ] Implement CRUD operations
  - [ ] Add rate limiting

- [ ] **Hashnode Integration** (Priority 2)
  - [ ] Implement GraphQL client
  - [ ] Create content transformer
  - [ ] Add authentication handling
  - [ ] Implement CRUD operations
  - [ ] Handle publication selection



**Deliverables**:
- Working Dev.to integration
- Working Hashnode integration

### Phase 3: SDK Core (Week 4)
**Goal**: Build the main SDK functionality

**Tasks**:
- [ ] Implement main SDK class
- [ ] Create cross-posting orchestrator
- [ ] Add batch processing capabilities
- [ ] Implement file watching (optional)
- [ ] Add retry logic and error handling
- [ ] Create status tracking

**Deliverables**:
- Complete SDK with all platform integrations
- Batch processing functionality
- Error handling and retry logic

### Phase 4: CLI & Integration (Week 5)
**Goal**: Create CLI tool and Next.js integration

**Tasks**:
- [ ] Build CLI tool with commands:
  - [ ] `crosspost post <file>` - Post single file
  - [ ] `crosspost batch <directory>` - Batch post
  - [ ] `crosspost status` - Check posting status
  - [ ] `crosspost sync` - Sync all platforms
- [ ] Create Next.js integration example
- [ ] Add webhook support for automatic triggering
- [ ] Create configuration file support

**Deliverables**:
- CLI tool with all commands
- Next.js integration example
- Configuration file support

### Phase 5: Testing & Documentation (Week 6)
**Goal**: Comprehensive testing and documentation

**Tasks**:
- [ ] Write unit tests for all components
- [ ] Create integration tests
- [ ] Add end-to-end tests
- [ ] Write comprehensive documentation
- [ ] Create troubleshooting guide
- [ ] Add examples and tutorials

**Deliverables**:
- Complete test suite
- Comprehensive documentation
- Examples and tutorials

## Technical Specifications

### Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "graphql": "^16.8.0",
    "graphql-request": "^6.1.0",
    "gray-matter": "^4.0.3",
    "remark": "^15.0.0",
    "remark-html": "^16.0.0",
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

### Configuration File Format

```yaml
# .crosspostrc.yml
platforms:
  devto:
    apiKey: "your-devto-api-key"
    defaultTags: ["typescript", "nextjs"]
  
  hashnode:
    token: "your-hashnode-token"
    publicationId: "your-publication-id"
    defaultTags: ["typescript", "nextjs"]
  


defaults:
  publishStatus: "draft"
  canonicalUrl: "https://your-portfolio.com/blog/{slug}"
  tags: ["typescript", "nextjs"]

options:
  autoSync: true
  watchMode: false
  retryAttempts: 3
  logLevel: "info"
```

### Usage Examples

#### Basic SDK Usage
```typescript
import { CrossPostSDK } from 'auto-crosspost';

const sdk = new CrossPostSDK({
  platforms: {
    devto: { apiKey: process.env.DEVTO_API_KEY },
    hashnode: { token: process.env.HASHNODE_TOKEN }
  },
  defaults: {
    publishStatus: 'draft',
    canonicalUrl: 'https://myportfolio.com/blog/{slug}'
  }
});

// Cross-post a single file
await sdk.crossPost({
  filePath: './content/blog/my-post.mdx',
  platforms: ['devto', 'hashnode'],
  options: {
    tags: ['typescript', 'nextjs'],
    publishStatus: 'published'
  }
});
```

#### CLI Usage
```bash
# Post single file
npx auto-crosspost post ./content/blog/my-post.mdx

# Batch post all files in directory
npx auto-crosspost batch ./content/blog/

# Check status of all posts
npx auto-crosspost status

# Sync all platforms
npx auto-crosspost sync
```

#### Next.js Integration
```typescript
// pages/api/crosspost.ts
import { CrossPostSDK } from 'auto-crosspost';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sdk = new CrossPostSDK({
    // configuration
  });

  try {
    const result = await sdk.crossPost({
      filePath: req.body.filePath,
      platforms: req.body.platforms,
      options: req.body.options
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Development Phases

### Phase 1: Foundation (Week 1)
**Focus**: Project setup and core architecture

**Daily Breakdown**:
- **Day 1**: Project initialization, TypeScript config, basic structure
- **Day 2**: Core types and interfaces, base client abstract class
- **Day 3**: Markdown parser utilities, content transformation base
- **Day 4**: Logging system, error handling, configuration management
- **Day 5**: Testing setup, basic unit tests for core components

**Success Criteria**:
- Project structure is complete
- Core types are defined
- Base client can be extended
- Markdown parsing works correctly
- Basic tests pass

### Phase 2: Platform Integration (Week 2-3)
**Focus**: Individual platform implementations

**Week 2 - Dev.to Integration**:
- **Day 1**: Dev.to client implementation
- **Day 2**: Content transformer for Dev.to
- **Day 3**: Authentication and rate limiting
- **Day 4**: CRUD operations implementation
- **Day 5**: Testing Dev.to integration

**Week 3 - Hashnode Integration**:
- **Day 1-2**: Hashnode GraphQL client
- **Day 3-4**: Content transformer and CRUD operations
- **Day 5**: Integration testing and bug fixes

**Success Criteria**:
- Dev.to integration works end-to-end
- Hashnode integration works end-to-end
- All platform tests pass

### Phase 3: SDK Core (Week 4)
**Focus**: Main SDK functionality and orchestration

**Daily Breakdown**:
- **Day 1**: Main SDK class implementation
- **Day 2**: Cross-posting orchestrator
- **Day 3**: Batch processing capabilities
- **Day 4**: Retry logic and error handling
- **Day 5**: Status tracking and monitoring

**Success Criteria**:
- SDK can cross-post to multiple platforms
- Batch processing works correctly
- Error handling is robust
- Status tracking is accurate

### Phase 4: CLI & Integration (Week 5)
**Focus**: User interface and integration examples

**Daily Breakdown**:
- **Day 1-2**: CLI tool implementation
- **Day 3**: Next.js integration example
- **Day 4**: Webhook support
- **Day 5**: Configuration file support

**Success Criteria**:
- CLI tool is fully functional
- Next.js integration works
- Configuration files are supported
- All examples work correctly

### Phase 5: Testing & Documentation (Week 6)
**Focus**: Quality assurance and documentation

**Daily Breakdown**:
- **Day 1-2**: Comprehensive unit tests
- **Day 3**: Integration and e2e tests
- **Day 4**: Documentation writing
- **Day 5**: Examples and tutorials

**Success Criteria**:
- Test coverage > 90%
- Documentation is complete
- Examples are working
- Ready for production use

## Testing Strategy

### Unit Tests
- **Core Components**: Types, base client, markdown parser
- **Platform Clients**: Individual platform implementations
- **Utilities**: File reader, image handler, logger
- **Transformers**: Content transformation logic

### Integration Tests
- **End-to-End**: Full cross-posting workflow
- **Platform APIs**: Real API calls with test accounts
- **Error Scenarios**: Rate limiting, authentication failures
- **Batch Processing**: Multiple files and platforms

### Test Environment
- **Mock APIs**: For development and CI
- **Test Accounts**: Real platform accounts for integration tests
- **Test Data**: Sample MDX files and expected outputs

## Deployment & Integration

### Package Distribution
- **NPM Package**: Publish to npm registry
- **GitHub Releases**: Tagged releases with changelog
- **Documentation**: GitHub Pages or Vercel deployment

### Integration Options

#### 1. Next.js Portfolio Integration
```typescript
// lib/crosspost.ts
import { CrossPostSDK } from 'auto-crosspost';

export async function crossPostNewArticles() {
  const sdk = new CrossPostSDK({
    // configuration from environment variables
  });
  
  // Find new articles since last sync
  const newArticles = await findNewArticles();
  
  for (const article of newArticles) {
    await sdk.crossPost({
      filePath: article.path,
      platforms: ['devto', 'hashnode'],
      options: {
        canonicalUrl: `https://your-portfolio.com/blog/${article.slug}`,
        tags: article.frontmatter.tags
      }
    });
  }
}
```

#### 2. GitHub Actions Integration
```yaml
# .github/workflows/crosspost.yml
name: Auto Cross-Post

on:
  push:
    paths:
      - 'content/blog/**'

jobs:
  crosspost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g auto-crosspost
      - run: auto-crosspost batch ./content/blog/
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_TOKEN: ${{ secrets.HASHNODE_TOKEN }}
```

#### 3. Vercel Integration
```typescript
// api/crosspost.ts
import { CrossPostSDK } from 'auto-crosspost';

export default async function handler(req, res) {
  // Handle webhook from Vercel deployment
  const sdk = new CrossPostSDK({
    // configuration
  });
  
  // Cross-post new articles
  await sdk.crossPostBatch({
    directory: './content/blog/',
    platforms: ['devto', 'hashnode']
  });
  
  res.status(200).json({ success: true });
}
```

## Future Enhancements

### Phase 6: Advanced Features (Future)
- **Analytics Integration**: Track performance across platforms
- **SEO Optimization**: Automatic meta tag generation
- **Image Optimization**: Automatic image compression and CDN
- **Scheduling**: Schedule posts for optimal timing
- **A/B Testing**: Test different titles/content across platforms

### Phase 7: Platform Expansion (Future)
- **Substack**: Newsletter integration
- **LinkedIn**: Professional network posting
- **Twitter/X**: Thread generation from posts
- **YouTube**: Video script generation
- **Podcast**: Audio script generation

### Phase 8: AI Integration (Future)
- **Content Optimization**: AI-powered title and description generation
- **Tag Suggestions**: Automatic tag recommendations
- **Cross-Platform Optimization**: Platform-specific content adaptation
- **Trend Analysis**: Identify trending topics for content

## Success Metrics

### Technical Metrics
- **Test Coverage**: > 90%
- **Build Time**: < 2 minutes
- **Bundle Size**: < 1MB
- **API Response Time**: < 500ms average

### User Experience Metrics
- **Setup Time**: < 5 minutes for basic setup
- **Cross-Post Time**: < 30 seconds per post
- **Error Rate**: < 1% of posts fail
- **User Satisfaction**: > 4.5/5 rating

### Business Metrics
- **Adoption Rate**: 1000+ downloads in first month
- **Active Users**: 100+ daily active users
- **Community Engagement**: GitHub stars, issues, PRs
- **Platform Coverage**: Support for 5+ platforms

## Risk Assessment & Mitigation

### Technical Risks
1. **API Changes**: Platform APIs may change
   - **Mitigation**: Abstract interfaces, version compatibility
2. **Rate Limiting**: API rate limits may be exceeded
   - **Mitigation**: Implement exponential backoff, queue system
3. **Authentication Issues**: Tokens may expire or be revoked
   - **Mitigation**: Clear error messages, easy re-authentication

### Business Risks
1. **Platform Shutdown**: Platforms may discontinue APIs
   - **Mitigation**: Modular architecture, easy to add/remove platforms
2. **Content Ownership**: Platforms may claim content ownership
   - **Mitigation**: Clear documentation, canonical URLs
3. **Competition**: Other tools may emerge
   - **Mitigation**: Focus on developer experience, open source

## Conclusion

This comprehensive planning document outlines a 5-week development roadmap for the Auto-CrossPost SDK. The project will deliver a robust, TypeScript-first solution that automates cross-posting across multiple blogging platforms while maintaining SEO best practices and developer experience.

The phased approach ensures steady progress with clear deliverables at each stage, while the modular architecture allows for easy expansion and maintenance. The focus on testing, documentation, and user experience will result in a production-ready tool that solves real problems for content creators.

**Next Steps**:
1. Review and approve this planning document
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular progress reviews and adjustments

**Timeline**: 5 weeks to production-ready SDK (reduced from 6 weeks due to removing Medium integration)
**Team**: 1 developer (you)
**Budget**: Open source, minimal costs
**Risk Level**: Low to Medium (well-defined scope, proven technologies) 