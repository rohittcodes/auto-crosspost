# GitHub Copilot Modular Code Rules for Auto-CrossPost SDK

## File Size and Modularity Rules

### 🎯 **Primary Rule: Maximum 400 Lines Per File**
- **Hard Limit**: No file should exceed 400 lines of code (excluding comments and whitespace)
- **Soft Limit**: Aim for 200-300 lines per file for optimal maintainability
- **When approaching 300+ lines**: Start planning to split the file into smaller modules

### 📁 **File Organization Principles**

#### **Single Responsibility Principle (SRP)**
- Each file should have ONE clear purpose and responsibility
- If a file handles multiple concerns, split it into separate files
- Example: Don't mix API client logic with data transformation logic

#### **Suggested File Splitting Patterns**

**For Large Classes (>300 lines):**
```typescript
// Instead of one large file:
// platforms/devto/devto-client.ts (600+ lines)

// Split into:
// platforms/devto/devto-client.ts (main class, <200 lines)
// platforms/devto/devto-api.ts (API calls, <150 lines)
// platforms/devto/devto-transformer.ts (data transformation, <150 lines)
// platforms/devto/devto-validator.ts (validation logic, <100 lines)
```

**For Utility Files (>400 lines):**
```typescript
// Instead of:
// utils/markdown-parser.ts (500+ lines)

// Split into:
// utils/markdown/parser.ts (core parsing, <200 lines)
// utils/markdown/frontmatter.ts (frontmatter handling, <150 lines)
// utils/markdown/transformer.ts (content transformation, <150 lines)
// utils/markdown/validator.ts (validation, <100 lines)
```

### 🏗️ **Modular Architecture Patterns**

#### **1. Composition Over Inheritance**
```typescript
// ✅ Good: Compose functionality
class DevToClient {
  constructor(
    private api: DevToApi,
    private transformer: DevToTransformer,
    private validator: DevToValidator
  ) {}
}

// ❌ Avoid: Large inheritance chains
class DevToClient extends BaseClient {
  // 500+ lines of mixed concerns
}
```

#### **2. Factory Pattern for Complex Objects**
```typescript
// ✅ Create separate factory files when constructors get complex
// factories/client-factory.ts (<100 lines)
export class ClientFactory {
  static createDevToClient(config: DevToConfig): DevToClient
  static createHashnodeClient(config: HashnodeConfig): HashnodeClient
}
```

#### **3. Strategy Pattern for Algorithms**
```typescript
// ✅ Separate strategies into individual files
// strategies/content-strategy.ts (<50 lines each)
export interface ContentStrategy {
  transform(content: string): string;
}

// strategies/devto-content-strategy.ts
// strategies/hashnode-content-strategy.ts
```

### 📦 **Module Export Patterns**

#### **Barrel Exports for Clean Imports**
```typescript
// platforms/devto/index.ts
export { DevToClient } from './devto-client';
export { DevToApi } from './devto-api';
export { DevToTransformer } from './devto-transformer';
export * from './types';
```

#### **Namespace Exports for Related Functionality**
```typescript
// utils/index.ts
export * as Markdown from './markdown';
export * as Validation from './validation';
export * as Http from './http';
```

### 🔧 **Code Splitting Guidelines**

#### **When to Split a File:**
1. **Line Count**: Approaching 300+ lines
2. **Multiple Classes**: More than one main class
3. **Mixed Concerns**: Handling different responsibilities
4. **Complex Methods**: Methods longer than 50 lines
5. **High Cognitive Load**: Difficult to understand at a glance

#### **How to Split Effectively:**

**1. Extract Constants and Types**
```typescript
// constants/devto-constants.ts (<50 lines)
export const DEVTO_API_BASE = 'https://dev.to/api';
export const DEVTO_MAX_TAGS = 4;
export const DEVTO_TAG_MAX_LENGTH = 20;

// types/devto-types.ts (<100 lines)
export interface DevToPost { /* ... */ }
export interface DevToArticle { /* ... */ }
```

**2. Extract Utility Functions**
```typescript
// utils/devto-utils.ts (<100 lines)
export const sanitizeDevToTag = (tag: string): string => { /* ... */ };
export const validateDevToPost = (post: Post): void => { /* ... */ };
```

**3. Extract API Interfaces**
```typescript
// interfaces/devto-api.interface.ts (<100 lines)
export interface IDevToApi {
  createArticle(post: DevToPost): Promise<DevToArticle>;
  updateArticle(id: string, post: DevToPost): Promise<DevToArticle>;
  // ... other methods
}
```

### 📝 **Implementation Rules**

#### **Class Size Limits**
- **Main Classes**: Max 200 lines
- **Utility Classes**: Max 150 lines
- **Configuration Classes**: Max 100 lines
- **Type Definition Files**: Max 200 lines

#### **Method Size Limits**
- **Public Methods**: Max 30 lines
- **Private Methods**: Max 50 lines
- **Complex Algorithms**: Extract to separate utility functions

#### **File Naming Conventions**
```
// Clear, descriptive names indicating file purpose
devto-client.ts          // Main client class
devto-api.service.ts     // API service layer
devto-content.transformer.ts  // Content transformation
devto-post.validator.ts  // Validation logic
devto.constants.ts       // Constants
devto.types.ts          // Type definitions
```

### 🧪 **Testing Modularity**
- Each module should have its own test file
- Test files should mirror the modular structure
- Mock dependencies between modules clearly

### 📊 **Monitoring and Maintenance**

#### **Automated Checks**
```json
// package.json scripts for monitoring file sizes
{
  "scripts": {
    "check-file-sizes": "find src -name '*.ts' -exec wc -l {} + | sort -nr",
    "lint-modularity": "eslint src --rule 'max-lines: [error, 400]'"
  }
}
```

#### **Code Review Checklist**
- [ ] No file exceeds 400 lines
- [ ] Each file has a single, clear responsibility
- [ ] Complex classes are properly decomposed
- [ ] Related functionality is grouped in modules
- [ ] Imports/exports are clean and logical

### 🚀 **Benefits of This Approach**
1. **Maintainability**: Easier to understand and modify code
2. **Testability**: Smaller units are easier to test
3. **Reusability**: Modular components can be reused
4. **Team Collaboration**: Multiple developers can work on different modules
5. **Performance**: Better tree-shaking and code splitting
6. **Debugging**: Easier to locate and fix issues

### ⚡ **Quick Refactoring Triggers**
When Copilot suggests these patterns, immediately consider splitting:
- Methods with multiple responsibilities
- Classes handling more than one domain concept
- Files with mixed imports (UI + business logic + data access)
- Functions with more than 5 parameters
- Deeply nested conditional logic (>3 levels)

## Implementation Priority
1. **Immediate**: Apply to any file currently >400 lines
2. **Short-term**: Apply to files >300 lines
3. **Ongoing**: Apply to new code as it's written
4. **Maintenance**: Regular review and refactoring of existing code

This modular approach ensures the Auto-CrossPost SDK remains maintainable, testable, and scalable as it grows.
