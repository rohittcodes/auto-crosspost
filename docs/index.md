---
layout: home

hero:
  name: "Auto-CrossPost SDK"
  text: "Automate Your Blog Distribution"
  tagline: Cross-post your markdown content to multiple platforms with zero configuration
  image:
    src: /hero-graphic.svg
    alt: Auto-CrossPost SDK - One SDK, Multiple Platforms
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/rohittcodes/auto-crosspost

features:
  - icon: 🚀
    title: Zero Configuration
    details: Works out of the box with sensible defaults. Just provide your API keys and start cross-posting.
  - icon: 🔗
    title: Multiple Platforms
    details: Currently supports Dev.to and Hashnode, with more platforms coming soon.
  - icon: 📝
    title: Markdown First
    details: Parse frontmatter, transform content, and maintain canonical URLs automatically.
  - icon: ⚡
    title: TypeScript Ready
    details: Built with TypeScript for excellent developer experience and type safety.
  - icon: 🛠️
    title: CLI & SDK
    details: Use as a command-line tool or integrate into your existing workflow with the SDK.
  - icon: 🔄
    title: Batch Processing
    details: Process multiple posts at once with smart error handling and retry logic.
---

## Quick Start

Get up and running in minutes:

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

## Basic Usage

```typescript
import { AutoCrossPost } from 'auto-crosspost'

const sdk = new AutoCrossPost({
  platforms: {
    devto: { apiKey: process.env.DEVTO_API_KEY },
    hashnode: { 
      token: process.env.HASHNODE_TOKEN,
      publicationId: process.env.HASHNODE_PUBLICATION_ID 
    }
  }
})

// Cross-post from a markdown file
const result = await sdk.crossPostFromFile('./my-blog-post.md')
console.log('Posted to:', result.results.map(r => r.platform))
```

## CLI Usage

```bash
# Post a single file
npx auto-crosspost post ./content/my-post.md

# Post all files in a directory
npx auto-crosspost batch ./content/blog/

# Check posting status
npx auto-crosspost status
```

## Why Auto-CrossPost?

### Before 😓
- Manual copy-paste to each platform
- Inconsistent formatting
- Forgetting to cross-post
- Time-consuming process

### After 🎉
- One command posts everywhere
- Consistent formatting
- Never miss a platform
- Focus on writing, not distribution

---

## Trusted by Developers

> "Auto-CrossPost saved me hours every week. I can focus on writing instead of manual distribution."
> — **Developer**

> "The TypeScript support and CLI make it perfect for both development and CI/CD workflows."
> — **DevOps Engineer**

---

<div class="vp-doc" style="text-align: center; margin-top: 2rem;">
  <a href="/guide/getting-started" class="vp-button vp-button-brand">Get Started →</a>
</div>
