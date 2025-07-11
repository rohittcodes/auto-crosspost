# Installation

Get Auto-CrossPost SDK installed and ready to use in your project.

## Prerequisites

- **Node.js** 16.0 or higher
- **npm**, **yarn**, or **pnpm**

## Package Installation

::: code-group

```bash [npm]
npm install auto-crosspost
```

```bash [yarn]
yarn add auto-crosspost
```

```bash [pnpm]
pnpm add auto-crosspost
```

:::

## CLI Installation

For global CLI usage, install the package globally:

::: code-group

```bash [npm]
npm install -g auto-crosspost
```

```bash [yarn]
yarn global add auto-crosspost
```

```bash [pnpm]
pnpm add -g auto-crosspost
```

:::

Or use it directly with npx:

```bash
npx auto-crosspost --help
```

## TypeScript Support

Auto-CrossPost SDK is built with TypeScript and includes type definitions out of the box. No additional `@types` packages are needed.

```typescript
import { AutoCrossPost, ConfigManager } from 'auto-crosspost'
// Full TypeScript support available immediately
```

## Development Installation

If you want to contribute to the project or run it from source:

```bash
# Clone the repository
git clone https://github.com/rohittcodes/auto-crosspost.git
cd auto-crosspost

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Verify Installation

Verify that Auto-CrossPost is installed correctly:

```bash
npx auto-crosspost --version
```

You should see the version number of the installed package.

## Next Steps

Now that you have Auto-CrossPost installed, let's get it configured:

- [Quick Start Guide](/guide/getting-started) - Get up and running in 5 minutes
- [Configuration](/guide/configuration) - Learn about all configuration options
- [Platform Setup](/guide/platforms/devto) - Set up your platform integrations
