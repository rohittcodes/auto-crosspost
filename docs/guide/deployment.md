# 🚀 Deployment Guide for Auto-CrossPost SDK

## Pre-Deployment Checklist

### 1. Build Verification
```bash
# Ensure clean build
npm run build

# Verify dist structure
dir dist /s  # Windows
ls -la dist  # Mac/Linux

# Test package locally
npm pack --dry-run
```

### 2. Quality Checks
```bash
# Run all tests
npm test

# Check code quality
npm run lint

# Verify modularity
npm run enforce-modularity
```

### 3. Version Management
```bash
# Update version (choose one)
npm version patch   # 0.1.0 → 0.1.1 (bug fixes)
npm version minor   # 0.1.0 → 0.2.0 (new features)
npm version major   # 0.1.0 → 1.0.0 (breaking changes)
```

## Deployment Options

### Option 1: NPM Registry (Public Package)

#### Step 1: Setup NPM Account
```bash
# Login to npm
npm login

# Verify login
npm whoami
```

#### Step 2: Package Configuration
Your `package.json` is already configured:
```json
{
  "name": "auto-crosspost",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

#### Step 3: Publish
```bash
# First time publish
npm publish

# Or publish with tag
npm publish --tag beta
npm publish --tag alpha
```

#### Step 4: Verify Publication
```bash
# Check package on npm
npm view auto-crosspost

# Test installation
npm install auto-crosspost -g
crosspost --help
```

### Option 2: GitHub Packages

#### Step 1: Setup GitHub Package Registry
```bash
# Login to GitHub registry
npm login --scope=@rohittcodes --registry=https://npm.pkg.github.com
```

#### Step 2: Update Package Name
```json
{
  "name": "@rohittcodes/auto-crosspost",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

#### Step 3: Publish to GitHub
```bash
npm publish
```

### Option 3: Private Registry

#### For Private NPM Registry
```bash
# Set registry
npm config set registry https://your-private-registry.com

# Publish
npm publish
```

## Post-Deployment Verification

### 1. Installation Test
```bash
# Global installation
npm install -g auto-crosspost

# Test CLI
crosspost --help
crosspost-batch --help
```

### 2. SDK Integration Test
```bash
# Create test project
mkdir test-integration
cd test-integration
npm init -y
npm install auto-crosspost

# Test import
node -e "console.log(require('auto-crosspost'))"
```

### 3. TypeScript Support Test
```typescript
// test.ts
import { AutoCrosspost } from 'auto-crosspost';

const crosspost = new AutoCrosspost({
  platforms: {
    devto: { apiKey: 'test' },
    hashnode: { token: 'test' }
  }
});
```

## Continuous Deployment Setup

### GitHub Actions Workflow
Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [published]

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build package
        run: npm run build
      
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
```

### Release Process
```bash
# 1. Create release branch
git checkout -b release/v0.1.0

# 2. Update version
npm version patch

# 3. Push and create PR
git push origin release/v0.1.0

# 4. After merge, create GitHub release
# This triggers auto-publish via GitHub Actions
```

## Distribution Channels

### 1. NPM Package Manager
- **URL**: https://www.npmjs.com/package/auto-crosspost
- **Install**: `npm install auto-crosspost`
- **Global CLI**: `npm install -g auto-crosspost`

### 2. GitHub Packages
- **URL**: https://github.com/rohittcodes/auto-crosspost/packages
- **Install**: `npm install @rohittcodes/auto-crosspost`

### 3. Direct Download
- **Tarball**: `npm pack` creates `auto-crosspost-0.1.0.tgz`
- **GitHub Releases**: Attach tarball to GitHub releases

## Package Size Optimization

### Current Size Analysis
```bash
# Check package size
npm pack --dry-run

# Analyze bundle size
du -sh dist/  # Mac/Linux
dir dist /-c  # Windows
```

### Size Optimization Tips
1. **Source maps**: Already excluded in production build
2. **Comments**: Already removed via `removeComments: true`
3. **Tree shaking**: Users can import specific modules
4. **Dependencies**: All dev dependencies properly excluded

## Monitoring & Maintenance

### 1. Package Statistics
- **NPM Stats**: https://npm-stat.com/charts.html?package=auto-crosspost
- **Download tracking**: Built into npm registry

### 2. Version Management
```bash
# Check outdated dependencies
npm outdated

# Update dependencies
npm update

# Audit security
npm audit
npm audit fix
```

### 3. User Feedback
- **GitHub Issues**: Bug reports and feature requests
- **NPM Support**: Package-specific support

## Rollback Strategy

### If Issues Are Found
```bash
# Unpublish recent version (within 24 hours)
npm unpublish auto-crosspost@0.1.1

# Or deprecate version
npm deprecate auto-crosspost@0.1.1 "Please use version 0.1.0"

# Publish fixed version
npm version patch
npm publish
```

## Success Metrics

### Track These Metrics
- **Download counts**: Weekly/monthly downloads
- **GitHub stars**: Community adoption
- **Issues/PRs**: Community engagement
- **Usage examples**: Real-world implementations

Your Auto-CrossPost SDK is now ready for deployment! 🎉

**Next Steps:**
1. Run `npm publish` to deploy to npm registry
2. Create GitHub release for version tracking
3. Update documentation with installation instructions
4. Share with the community for feedback
