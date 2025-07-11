# Build and Distribution Guide

## Overview

The Auto-CrossPost SDK uses TypeScript and compiles to JavaScript for distribution on npm. This guide explains the build process and distribution configuration.

## Build Process

### Build Configuration

1. **`tsconfig.json`** - Development configuration with `noEmit: true`
2. **`tsconfig.build.json`** - Production build configuration that extends base config
3. **Build scripts** - Automated compilation and post-processing

### Build Steps

The build process (`npm run build`) performs these steps:

1. **Clean**: Removes existing `dist/` directory
2. **Compile**: TypeScript compilation using `tsconfig.build.json`
3. **Post-process**: Adds shebang lines to CLI executables

```bash
npm run build
# Equivalent to:
# npm run clean && tsc --project tsconfig.build.json && npm run fix-cli-shebang
```

### Generated Files Structure

```
dist/
├── index.js                 # Main SDK entry point
├── index.d.ts              # TypeScript declarations
├── auto-crosspost.js       # Core SDK class
├── auto-crosspost.d.ts     # TypeScript declarations
├── cli/
│   ├── index.js            # Main CLI (with shebang)
│   └── batch.js            # Batch CLI (with shebang)
├── core/
│   ├── types.js
│   ├── base-client.js
│   └── ...
├── platforms/
│   ├── devto/
│   └── hashnode/
├── config/
└── utils/
```

## Distribution Configuration

### Package.json Configuration

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "crosspost": "./dist/cli/index.js",
    "crosspost-batch": "./dist/cli/batch.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

### NPM Registry Configuration

- **Access**: Public package
- **Registry**: https://registry.npmjs.org/
- **Files included**: Only `dist/`, `README.md`, and `LICENSE`

## Ignore Files

### `.npmignore`

Controls what gets excluded from npm package:
- Source files (`src/`, `tests/`, `examples/`, `docs/`)
- Development files (configs, scripts)
- Build artifacts (maps, cache files)
- Environment files

### `.gitignore`

Controls what gets excluded from git repository:
- `node_modules/`
- `dist/` (build output)
- Environment files
- IDE files

## Build Scripts

### Available Scripts

```bash
# Build for production
npm run build

# Build and watch for changes
npm run build:watch

# Clean build directory
npm run clean

# Development with watch mode
npm run dev

# Test before publishing
npm run prepublishOnly
```

### Development Workflow

1. **Development**: Use `npm run dev` for watch mode
2. **Testing**: Run `npm test` and `npm run lint`
3. **Building**: Use `npm run build` for production build
4. **Publishing**: `npm publish` (runs prepublishOnly automatically)

## CLI Executable Configuration

### Shebang Handling

CLI files need shebang lines for proper execution:
- Automatically added by `scripts/fix-shebang.js`
- Applied to `dist/cli/index.js` and `dist/cli/batch.js`
- Enables direct execution: `npx crosspost` or `./node_modules/.bin/crosspost`

### Binary Configuration

```json
{
  "bin": {
    "crosspost": "./dist/cli/index.js",
    "crosspost-batch": "./dist/cli/batch.js"
  }
}
```

## Publishing Process

### Pre-publish Checklist

1. **Tests pass**: `npm test`
2. **Linting passes**: `npm run lint`
3. **Build succeeds**: `npm run build`
4. **Files are correct**: Check `dist/` contents

### Publishing Commands

```bash
# Test the package locally
npm pack

# Publish to npm
npm publish

# Publish with specific tag
npm publish --tag beta
```

### Version Management

```bash
# Bump version
npm version patch|minor|major

# Publish with version bump
npm version patch && npm publish
```

## Distribution Verification

### Testing Local Package

```bash
# Create tarball for testing
npm pack

# Test installation
npm install auto-crosspost-0.1.0.tgz

# Test CLI commands
npx crosspost --help
```

### Verifying Published Package

```bash
# Check package contents
npm view auto-crosspost files

# Install and test
npm install auto-crosspost
node -e "console.log(require('auto-crosspost'))"
```

## Troubleshooting

### Common Build Issues

1. **TypeScript errors**: Check `tsconfig.build.json` configuration
2. **Missing files**: Verify `files` field in `package.json`
3. **CLI not executable**: Ensure shebang script runs correctly
4. **Large package size**: Review `.npmignore` exclusions

### Build Optimization

- Declaration maps for better IDE support
- Source maps excluded from distribution
- Comments removed in production build
- Only essential files included in package

## File Size Monitoring

The package includes size monitoring scripts:

```bash
# Check file sizes
npm run check-file-sizes

# Enforce modularity rules
npm run enforce-modularity
```

Keep distribution package under 1MB for optimal download speeds.
