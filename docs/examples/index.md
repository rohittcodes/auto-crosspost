# Examples

Comprehensive examples to help you get the most out of Auto-CrossPost SDK.

## Quick Examples

### Basic Post

```typescript
import { CrossPostSDK, ConfigManager } from 'auto-crosspost'

// Load configuration
const config = await ConfigManager.loadConfig()
const sdk = new CrossPostSDK(config)

// Post to all platforms
const results = await sdk.postToAll({
  title: "My First Cross-Post",
  content: "# Hello World\n\nThis is my first cross-posted article!",
  tags: ["javascript", "typescript", "tutorial"],
  publishStatus: "published"
})

console.log('Posted to', results.length, 'platforms')
```

### Process Markdown File

```typescript
import { MarkdownParser } from 'auto-crosspost'

const parser = new MarkdownParser()
const parsed = await parser.parseFile('./posts/my-article.md')

const results = await sdk.postToAll({
  title: parsed.frontmatter.title,
  content: parsed.content,
  tags: parsed.frontmatter.tags,
  publishStatus: parsed.frontmatter.published ? 'published' : 'draft'
})
```

## Complete Examples

### 1. Blog Automation Script

A complete script for automating blog post cross-posting:

```typescript
#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import { CrossPostSDK, MarkdownParser, ConfigManager } from 'auto-crosspost'

class BlogAutomation {
  private sdk: CrossPostSDK
  private parser: MarkdownParser

  constructor(config: any) {
    this.sdk = new CrossPostSDK(config)
    this.parser = new MarkdownParser()
  }

  async processDirectory(directory: string) {
    console.log(`🔍 Scanning ${directory} for markdown files...`)
    
    const files = await fs.readdir(directory)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    console.log(`📝 Found ${markdownFiles.length} markdown files`)

    for (const file of markdownFiles) {
      await this.processFile(path.join(directory, file))
      
      // Rate limiting - wait 2 seconds between posts
      await this.delay(2000)
    }
  }

  async processFile(filePath: string) {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`)
    
    try {
      // Parse markdown file
      const parsed = await this.parser.parseFile(filePath)
      
      // Validate required fields
      if (!parsed.frontmatter.title) {
        console.log('⚠️  Skipping: No title in frontmatter')
        return
      }

      // Create post object
      const post = {
        title: parsed.frontmatter.title,
        content: parsed.content,
        description: parsed.frontmatter.description,
        tags: parsed.frontmatter.tags || [],
        publishStatus: parsed.frontmatter.published ? 'published' : 'draft',
        canonicalUrl: parsed.frontmatter.canonical_url,
        coverImage: parsed.frontmatter.cover_image
      }

      // Cross-post to all platforms
      const results = await this.sdk.postToAll(post)

      // Report results
      console.log(`📊 Results for "${post.title}":`)
      results.forEach(result => {
        const status = result.success ? '✅' : '❌'
        const message = result.success 
          ? `Posted: ${result.platformPost?.url}`
          : `Error: ${result.error?.message}`
        
        console.log(`   ${status} ${result.platform}: ${message}`)
      })

      // Update frontmatter with platform IDs
      if (results.some(r => r.success)) {
        await this.updateFrontmatter(filePath, results)
      }

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message)
    }
  }

  async updateFrontmatter(filePath: string, results: any[]) {
    // Update the markdown file with platform IDs for future updates
    const content = await fs.readFile(filePath, 'utf-8')
    const platformIds: any = {}
    
    results.forEach(result => {
      if (result.success) {
        platformIds[result.platform] = result.platformPost.platformId
      }
    })

    // Simple frontmatter update (you might want to use a proper YAML parser)
    const updatedContent = content.replace(
      /^---\n([\s\S]*?)\n---/,
      (match, frontmatter) => {
        return `---\n${frontmatter}\nplatform_ids: ${JSON.stringify(platformIds)}\n---`
      }
    )

    await fs.writeFile(filePath, updatedContent)
    console.log('📝 Updated frontmatter with platform IDs')
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Main execution
async function main() {
  try {
    const config = await ConfigManager.loadConfig()
    const automation = new BlogAutomation(config)
    
    const directory = process.argv[2] || './posts'
    await automation.processDirectory(directory)
    
    console.log('\n🎉 Automation complete!')
  } catch (error) {
    console.error('💥 Automation failed:', error.message)
    process.exit(1)
  }
}

main()
```

### 2. Next.js Blog Integration

Complete Next.js integration with API routes and React components:

```typescript
// lib/crosspost.ts
import { CrossPostSDK, ConfigManager } from 'auto-crosspost'

let sdkInstance: CrossPostSDK | null = null

export async function getSDK() {
  if (!sdkInstance) {
    const config = await ConfigManager.loadConfig()
    sdkInstance = new CrossPostSDK(config)
  }
  return sdkInstance
}

// pages/api/crosspost.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSDK } from '../../lib/crosspost'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, content, tags, publishStatus, description } = req.body

    // Validate input
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' })
    }

    const sdk = await getSDK()
    const results = await sdk.postToAll({
      title,
      content,
      description,
      tags: tags || [],
      publishStatus: publishStatus || 'draft'
    })

    res.status(200).json({ 
      success: true, 
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })
  } catch (error) {
    console.error('Cross-post API error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cross-post article' 
    })
  }
}

// components/CrossPostForm.tsx
import { useState } from 'react'

interface CrossPostFormProps {
  onSuccess?: (results: any[]) => void
  onError?: (error: string) => void
}

export function CrossPostForm({ onSuccess, onError }: CrossPostFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    tags: '',
    publishStatus: 'draft'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/crosspost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess?.(data.results)
        setFormData({ title: '', content: '', description: '', tags: '', publishStatus: 'draft' })
      } else {
        onError?.(data.error)
      }
    } catch (error) {
      onError?.('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content (Markdown)
        </label>
        <textarea
          id="content"
          rows={12}
          value={formData.content}
          onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="# Your Article Title

Your article content in Markdown format..."
          required
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          value={formData.tags}
          onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="javascript, typescript, tutorial"
        />
      </div>

      <div>
        <label htmlFor="publishStatus" className="block text-sm font-medium text-gray-700">
          Publish Status
        </label>
        <select
          id="publishStatus"
          value={formData.publishStatus}
          onChange={e => setFormData(prev => ({ ...prev, publishStatus: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Cross-posting...' : 'Cross-post Article'}
      </button>
    </form>
  )
}

// pages/admin/crosspost.tsx
import { useState } from 'react'
import { CrossPostForm } from '../../components/CrossPostForm'

export default function CrossPostPage() {
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string>('')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Cross-post Article</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
          <CrossPostForm
            onSuccess={(results) => {
              setResults(results)
              setError('')
            }}
            onError={(error) => {
              setError(error)
              setResults([])
            }}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-md p-4 ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{result.platform}</h3>
                    <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                  
                  {result.success ? (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Posted: <a 
                          href={result.platformPost.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {result.platformPost.url}
                        </a>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-red-600">{result.error?.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. GitHub Actions Workflow

Automate cross-posting with GitHub Actions:

```yaml
# .github/workflows/crosspost.yml
name: Cross-post Blog Articles

on:
  push:
    branches: [main]
    paths: ['posts/**/*.md']
  
  # Allow manual triggering
  workflow_dispatch:
    inputs:
      force:
        description: 'Force repost all articles'
        type: boolean
        default: false

jobs:
  crosspost:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          # Fetch full history to detect new/changed files
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Auto-CrossPost SDK
        run: npm install auto-crosspost

      - name: Detect changed files
        id: changes
        run: |
          if [ "${{ github.event.inputs.force }}" = "true" ]; then
            echo "files=$(find posts -name '*.md' | tr '\n' ' ')" >> $GITHUB_OUTPUT
          else
            echo "files=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep '^posts/.*\.md$' | tr '\n' ' ')" >> $GITHUB_OUTPUT
          fi

      - name: Cross-post articles
        if: steps.changes.outputs.files != ''
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          HASHNODE_TOKEN: ${{ secrets.HASHNODE_TOKEN }}
          HASHNODE_PUBLICATION_ID: ${{ secrets.HASHNODE_PUBLICATION_ID }}
        run: |
          cat > crosspost-action.js << 'EOF'
          const { CrossPostSDK, MarkdownParser, ConfigManager } = require('auto-crosspost');
          const fs = require('fs').promises;
          
          async function main() {
            const files = process.argv[2].split(' ').filter(Boolean);
            console.log(`Processing ${files.length} files:`, files);
            
            if (files.length === 0) {
              console.log('No files to process');
              return;
            }
            
            const config = await ConfigManager.loadConfig();
            const sdk = new CrossPostSDK(config);
            const parser = new MarkdownParser();
            
            for (const file of files) {
              console.log(`\nProcessing: ${file}`);
              
              try {
                const parsed = await parser.parseFile(file);
                
                if (!parsed.frontmatter.title) {
                  console.log('⚠️  Skipping: No title');
                  continue;
                }
                
                const post = {
                  title: parsed.frontmatter.title,
                  content: parsed.content,
                  tags: parsed.frontmatter.tags || [],
                  publishStatus: parsed.frontmatter.published ? 'published' : 'draft'
                };
                
                const results = await sdk.postToAll(post);
                
                results.forEach(result => {
                  const status = result.success ? '✅' : '❌';
                  console.log(`${status} ${result.platform}: ${result.success ? 'Posted' : result.error?.message}`);
                });
                
                // Wait between posts
                await new Promise(resolve => setTimeout(resolve, 2000));
                
              } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
              }
            }
          }
          
          main().catch(console.error);
          EOF
          
          node crosspost-action.js "${{ steps.changes.outputs.files }}"

      - name: Comment on PR
        if: github.event_name == 'pull_request' && steps.changes.outputs.files != ''
        uses: actions/github-script@v7
        with:
          script: |
            const files = '${{ steps.changes.outputs.files }}'.split(' ').filter(Boolean);
            
            const comment = `## 📝 Cross-post Results
            
            Processed ${files.length} markdown file(s):
            
            ${files.map(file => `- \`${file}\``).join('\n')}
            
            Check the [action logs](${context.payload.repository.html_url}/actions/runs/${context.runId}) for detailed results.`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 4. Express.js Webhook Handler

Handle webhooks from your CMS or blog platform:

```typescript
// server.ts
import express from 'express'
import { CrossPostSDK, MarkdownParser, ConfigManager } from 'auto-crosspost'

const app = express()
app.use(express.json())

class WebhookHandler {
  private sdk: CrossPostSDK
  private parser: MarkdownParser

  constructor(config: any) {
    this.sdk = new CrossPostSDK(config)
    this.parser = new MarkdownParser()
  }

  // Handle webhook from Strapi, Contentful, etc.
  async handleCMSWebhook(req: express.Request, res: express.Response) {
    try {
      const { event, data } = req.body

      if (event === 'entry.publish' && data.model === 'blog-post') {
        await this.processNewPost(data.entry)
        res.json({ success: true, message: 'Post cross-posted successfully' })
      } else {
        res.json({ success: true, message: 'Event ignored' })
      }
    } catch (error) {
      console.error('Webhook error:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Handle GitHub webhook for new blog posts
  async handleGitHubWebhook(req: express.Request, res: express.Response) {
    try {
      const { action, commits } = req.body

      if (action === 'push') {
        const markdownFiles = commits
          .flatMap((commit: any) => [...commit.added, ...commit.modified])
          .filter((file: string) => file.endsWith('.md') && file.startsWith('posts/'))

        for (const file of markdownFiles) {
          await this.processMarkdownFile(file)
        }

        res.json({ success: true, processed: markdownFiles.length })
      } else {
        res.json({ success: true, message: 'Action ignored' })
      }
    } catch (error) {
      console.error('GitHub webhook error:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  }

  private async processNewPost(entry: any) {
    const post = {
      title: entry.title,
      content: entry.content,
      description: entry.description,
      tags: entry.tags || [],
      publishStatus: entry.published ? 'published' : 'draft',
      canonicalUrl: entry.canonical_url
    }

    const results = await this.sdk.postToAll(post)
    
    console.log(`Cross-posted "${post.title}" to ${results.length} platforms`)
    results.forEach(result => {
      console.log(`${result.platform}: ${result.success ? '✅' : '❌'}`)
    })

    return results
  }

  private async processMarkdownFile(filePath: string) {
    // In a real scenario, you'd fetch the file content from GitHub API
    // For this example, we assume the file is available locally
    
    try {
      const parsed = await this.parser.parseFile(filePath)
      
      const post = {
        title: parsed.frontmatter.title,
        content: parsed.content,
        tags: parsed.frontmatter.tags || [],
        publishStatus: parsed.frontmatter.published ? 'published' : 'draft'
      }

      return await this.sdk.postToAll(post)
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error)
      throw error
    }
  }
}

async function setupServer() {
  const config = await ConfigManager.loadConfig()
  const webhookHandler = new WebhookHandler(config)

  // CMS webhook endpoint
  app.post('/webhook/cms', (req, res) => webhookHandler.handleCMSWebhook(req, res))

  // GitHub webhook endpoint
  app.post('/webhook/github', (req, res) => webhookHandler.handleGitHubWebhook(req, res))

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`🚀 Webhook server running on port ${port}`)
  })
}

setupServer().catch(console.error)
```

### 5. Custom Platform Integration

Example of extending the SDK with a custom platform:

```typescript
// custom-platform.ts
import { PlatformClient, Post, PlatformPost, CrossPostResult } from 'auto-crosspost'
import axios, { AxiosInstance } from 'axios'

interface LinkedInConfig {
  accessToken: string
  personId: string
}

export class LinkedInPlatform implements PlatformClient {
  readonly name = 'linkedin'
  private client: AxiosInstance
  private config: LinkedInConfig

  constructor(config: LinkedInConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    })
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.client.get(`/people/${this.config.personId}`)
      return response.status === 200
    } catch {
      return false
    }
  }

  async createPost(post: Post): Promise<CrossPostResult> {
    try {
      const linkedInPost = this.transformPost(post)
      
      const response = await this.client.post('/ugcPosts', linkedInPost)
      
      const platformPost: PlatformPost = {
        platformId: response.data.id,
        url: `https://linkedin.com/feed/update/${response.data.id}`,
        title: post.title,
        slug: response.data.id,
        publishStatus: post.publishStatus,
        tags: post.tags || [],
        publishedAt: new Date()
      }

      return {
        platform: this.name,
        success: true,
        platformPost
      }
    } catch (error) {
      return {
        platform: this.name,
        success: false,
        error: {
          code: 'LINKEDIN_API_ERROR',
          message: error.message,
          platform: this.name,
          retryable: error.response?.status >= 500
        }
      }
    }
  }

  async updatePost(platformId: string, post: Post): Promise<CrossPostResult> {
    // LinkedIn doesn't support updating posts
    return {
      platform: this.name,
      success: false,
      error: {
        code: 'OPERATION_NOT_SUPPORTED',
        message: 'LinkedIn does not support updating posts',
        platform: this.name,
        retryable: false
      }
    }
  }

  async deletePost(platformId: string): Promise<void> {
    await this.client.delete(`/ugcPosts/${platformId}`)
  }

  async getPost(platformId: string): Promise<PlatformPost> {
    const response = await this.client.get(`/ugcPosts/${platformId}`)
    
    return {
      platformId: response.data.id,
      url: `https://linkedin.com/feed/update/${response.data.id}`,
      title: response.data.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text,
      slug: response.data.id,
      publishStatus: 'published',
      tags: [],
      publishedAt: new Date(response.data.created.time)
    }
  }

  private transformPost(post: Post) {
    return {
      author: `urn:li:person:${this.config.personId}`,
      lifecycleState: post.publishStatus === 'published' ? 'PUBLISHED' : 'DRAFT',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `${post.title}\n\n${post.description || ''}\n\n${post.tags?.map(tag => `#${tag}`).join(' ') || ''}`
          },
          shareMediaCategory: 'ARTICLE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }
  }
}

// Usage with custom platform
import { CrossPostSDK } from 'auto-crosspost'

const customConfig = {
  platforms: {
    devto: { apiKey: 'your-devto-key' },
    linkedin: { 
      accessToken: 'your-linkedin-token',
      personId: 'your-person-id'
    }
  }
}

// Extend SDK with custom platform
const sdk = new CrossPostSDK(customConfig)
sdk.addPlatform('linkedin', new LinkedInPlatform(customConfig.platforms.linkedin))

// Now you can cross-post to LinkedIn too
const results = await sdk.postToAll(post)
```

## CLI Examples

See the [CLI Examples](/examples/cli) page for command-line usage examples.

## Next.js Examples

See the [Next.js Integration](/examples/nextjs) page for complete Next.js integration examples.

## More Examples

- [Custom Workflows](/examples/workflows) - Advanced automation workflows
- [Platform Integration](/guide/platforms/) - Platform-specific examples
- [API Reference](/api/) - Complete API documentation
