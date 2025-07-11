# Quick Start

Get up and running with Auto-CrossPost SDK in under 5 minutes.

## 1. Installation

First, install the package:

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

## 2. Get Your API Keys

You'll need API keys from the platforms you want to cross-post to:

### Dev.to API Key
1. Go to [Dev.to Settings](https://dev.to/settings/account)
2. Scroll down to "DEV Community API Keys"
3. Generate a new API key
4. Copy the key (it starts with `dev_`)

### Hashnode Token
1. Go to [Hashnode Developer Settings](https://hashnode.com/settings/developer)
2. Generate a new Personal Access Token
3. Copy the token
4. Find your Publication ID from your blog's settings

## 3. Set Up Environment Variables

Create a `.env` file in your project root:

```env
DEVTO_API_KEY=your_devto_api_key_here
HASHNODE_TOKEN=your_hashnode_token_here
HASHNODE_PUBLICATION_ID=your_publication_id_here
```

::: warning Security Note
Never commit your `.env` file to version control. Add it to your `.gitignore`:

```gitignore
.env
.env.local
```
:::

## 4. Create Your First Post

Create a markdown file with frontmatter:

```markdown
---
title: "My First Cross-Post"
description: "Learning how to use Auto-CrossPost SDK"
tags: ["javascript", "automation", "blogging"]
published: true
---

# My First Cross-Post

This is my first blog post using Auto-CrossPost SDK!

## What I've Learned

- How to set up API keys
- How to create markdown with frontmatter
- How to cross-post to multiple platforms

Pretty cool, right?
```

## 5. Cross-Post Your Content

### Option A: Using the SDK

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

// Cross-post from a file
const result = await sdk.crossPostFromFile('./my-first-post.md')

console.log('Success!', {
  posted: result.successful,
  failed: result.failed,
  platforms: result.results.map(r => r.platform)
})
```

### Option B: Using the CLI

```bash
npx auto-crosspost post ./my-first-post.md
```

## 6. Check Your Results

After running the cross-post:

1. **Check Dev.to** - Go to your [Dev.to dashboard](https://dev.to/dashboard)
2. **Check Hashnode** - Go to your Hashnode blog dashboard
3. **Review the output** - Check the console for success/error messages

## What's Next?

🎉 Congratulations! You've successfully cross-posted your first article.

### Next Steps:
- [Configuration Guide](/guide/configuration) - Learn about all configuration options
- [Platform Setup](/guide/platforms/devto) - Detailed platform configuration
- [CLI Usage](/guide/cli) - Explore all CLI commands
- [SDK Usage](/guide/usage/sdk) - Advanced SDK usage patterns

### Common Next Actions:
- Set up batch processing for multiple posts
- Configure default tags and settings
- Integrate with your existing workflow
- Set up automated cross-posting with GitHub Actions

## Troubleshooting

### Common Issues:

**API Key Issues:**
```bash
Error: Authentication failed for devto
```
- Double-check your API key is correct
- Ensure the key has the right permissions
- Check that environment variables are loaded

**File Not Found:**
```bash
Error: Failed to load config file
```
- Check the file path is correct
- Ensure the markdown file exists
- Verify file permissions

**Platform Errors:**
```bash
Error: Hashnode validation error
```
- Check your publication ID is correct
- Verify the content meets platform requirements
- Review the error message for specific details

Need more help? Check our [troubleshooting guide](/guide/troubleshooting) or [open an issue](https://github.com/rohittcodes/auto-crosspost/issues).
