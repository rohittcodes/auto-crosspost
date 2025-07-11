# Next.js Integration

Complete guide for integrating Auto-CrossPost SDK with Next.js applications.

## Overview

Next.js is a popular React framework that provides server-side rendering, API routes, and many other features. This guide shows you how to integrate the Auto-CrossPost SDK into your Next.js blog or content management system.

## Installation

First, install the Auto-CrossPost SDK in your Next.js project:

```bash
npm install auto-crosspost
# or
yarn add auto-crosspost
# or
pnpm add auto-crosspost
```

## Basic Setup

### 1. Environment Variables

Create a `.env.local` file in your Next.js project root:

```bash
# .env.local
DEVTO_API_KEY=your_devto_api_key
HASHNODE_TOKEN=your_hashnode_token
HASHNODE_PUBLICATION_ID=your_publication_id

# Optional: Configuration
CROSSPOST_LOG_LEVEL=info
CROSSPOST_AUTO_SYNC=false
```

### 2. Configuration File

Create a configuration file in your project:

```typescript
// lib/crosspost-config.ts
import { CrossPostConfig } from 'auto-crosspost'

export const crosspostConfig: CrossPostConfig = {
  platforms: {
    devto: {
      apiKey: process.env.DEVTO_API_KEY!
    },
    hashnode: {
      token: process.env.HASHNODE_TOKEN!,
      publicationId: process.env.HASHNODE_PUBLICATION_ID
    }
  },
  defaults: {
    publishStatus: 'draft',
    tags: ['nextjs', 'javascript', 'react']
  },
  options: {
    logLevel: (process.env.CROSSPOST_LOG_LEVEL as any) || 'info',
    retryAttempts: 3
  }
}
```

### 3. SDK Instance

Create a singleton SDK instance:

```typescript
// lib/crosspost.ts
import { CrossPostSDK } from 'auto-crosspost'
import { crosspostConfig } from './crosspost-config'

let sdkInstance: CrossPostSDK | null = null

export function getCrossPostSDK(): CrossPostSDK {
  if (!sdkInstance) {
    sdkInstance = new CrossPostSDK(crosspostConfig)
  }
  return sdkInstance
}

// For server-side usage
export async function createCrossPostSDK(): Promise<CrossPostSDK> {
  return new CrossPostSDK(crosspostConfig)
}
```

## API Routes

### Basic Cross-Post API Route

```typescript
// pages/api/crosspost.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCrossPostSDK } from '../../lib/crosspost'

interface CrossPostRequestBody {
  title: string
  content: string
  description?: string
  tags?: string[]
  publishStatus?: 'draft' | 'published'
  canonicalUrl?: string
  coverImage?: string
}

interface CrossPostResponse {
  success: boolean
  results?: any[]
  error?: string
  summary?: {
    total: number
    successful: number
    failed: number
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CrossPostResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { 
      title, 
      content, 
      description, 
      tags = [], 
      publishStatus = 'draft',
      canonicalUrl,
      coverImage 
    }: CrossPostRequestBody = req.body

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      })
    }

    const sdk = getCrossPostSDK()
    
    const results = await sdk.postToAll({
      title,
      content,
      description,
      tags,
      publishStatus,
      canonicalUrl,
      coverImage
    })

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }

    res.status(200).json({ 
      success: true, 
      results,
      summary
    })
  } catch (error) {
    console.error('Cross-post API error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cross-post article' 
    })
  }
}
```

### App Router API Route

```typescript
// app/api/crosspost/route.ts (App Router)
import { NextRequest, NextResponse } from 'next/server'
import { getCrossPostSDK } from '@/lib/crosspost'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, description, tags = [], publishStatus = 'draft' } = body

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const sdk = getCrossPostSDK()
    const results = await sdk.postToAll({
      title,
      content,
      description,
      tags,
      publishStatus
    })

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })
  } catch (error) {
    console.error('Cross-post error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cross-post article' },
      { status: 500 }
    )
  }
}
```

### Advanced API Routes

```typescript
// pages/api/crosspost/[action].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCrossPostSDK } from '../../../lib/crosspost'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query
  const sdk = getCrossPostSDK()

  try {
    switch (action) {
      case 'post':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' })
        }
        
        const { platform, ...postData } = req.body
        
        if (platform === 'all') {
          const results = await sdk.postToAll(postData)
          return res.json({ results })
        } else {
          const result = await sdk.postToPlatform(platform, postData)
          return res.json({ result })
        }

      case 'update':
        if (req.method !== 'PUT') {
          return res.status(405).json({ error: 'Method not allowed' })
        }
        
        const { platform: updatePlatform, platformId, ...updateData } = req.body
        const updateResult = await sdk.updatePost(updatePlatform, platformId, updateData)
        return res.json({ result: updateResult })

      case 'delete':
        if (req.method !== 'DELETE') {
          return res.status(405).json({ error: 'Method not allowed' })
        }
        
        const { platform: deletePlatform, platformId: deleteId } = req.body
        await sdk.deletePost(deletePlatform, deleteId)
        return res.json({ success: true })

      case 'status':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' })
        }
        
        // Return platform status, rate limits, etc.
        const status = {
          platforms: ['devto', 'hashnode'],
          connected: true,
          rateLimits: {
            devto: { remaining: 950, total: 1000 },
            hashnode: { remaining: 980, total: 1000 }
          }
        }
        return res.json(status)

      default:
        return res.status(404).json({ error: 'Action not found' })
    }
  } catch (error) {
    console.error(`API error for action ${action}:`, error)
    return res.status(500).json({ error: error.message })
  }
}
```

## React Components

### Cross-Post Form Component

```typescript
// components/CrossPostForm.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CrossPostFormProps {
  initialData?: {
    title?: string
    content?: string
    description?: string
    tags?: string[]
  }
  onSuccess?: (results: any[]) => void
  onError?: (error: string) => void
}

export function CrossPostForm({ initialData, onSuccess, onError }: CrossPostFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    description: initialData?.description || '',
    tags: initialData?.tags?.join(', ') || '',
    publishStatus: 'draft' as 'draft' | 'published',
    canonicalUrl: '',
    coverImage: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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
        setResults(data.results)
        onSuccess?.(data.results)
      } else {
        setError(data.error)
        onError?.(data.error)
      }
    } catch (err) {
      const errorMessage = 'Network error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter article title"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <Input
            id="description"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of your article"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Content (Markdown) *
          </label>
          <Textarea
            id="content"
            rows={15}
            value={formData.content}
            onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="# Your Article Title

Write your article content in Markdown format..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              Tags (comma-separated)
            </label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="javascript, typescript, tutorial"
            />
          </div>

          <div>
            <label htmlFor="publishStatus" className="block text-sm font-medium mb-2">
              Publish Status
            </label>
            <Select
              value={formData.publishStatus}
              onValueChange={value => setFormData(prev => ({ ...prev, publishStatus: value as 'draft' | 'published' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="canonicalUrl" className="block text-sm font-medium mb-2">
              Canonical URL
            </label>
            <Input
              id="canonicalUrl"
              type="url"
              value={formData.canonicalUrl}
              onChange={e => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
              placeholder="https://yourblog.com/article-slug"
            />
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium mb-2">
              Cover Image URL
            </label>
            <Input
              id="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={e => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
              placeholder="https://example.com/cover.jpg"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Cross-posting...' : 'Cross-post Article'}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Results</h3>
          {results.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.platform}
                  </Badge>
                  <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
              </div>
              
              {result.success ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <a 
                      href={result.platformPost.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Article →
                    </a>
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {result.platformPost.platformId}
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
  )
}
```

### Cross-Post Status Component

```typescript
// components/CrossPostStatus.tsx
'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PlatformStatus {
  platform: string
  connected: boolean
  rateLimits: {
    remaining: number
    total: number
  }
  lastPost?: string
}

export function CrossPostStatus() {
  const [status, setStatus] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/crosspost/status')
      const data = await response.json()
      
      // Transform data to expected format
      const platformStatus: PlatformStatus[] = data.platforms.map((platform: string) => ({
        platform,
        connected: data.connected,
        rateLimits: data.rateLimits[platform] || { remaining: 0, total: 1000 }
      }))
      
      setStatus(platformStatus)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading status...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {status.map((platform) => (
        <Card key={platform.platform}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="capitalize">{platform.platform}</span>
              <Badge variant={platform.connected ? 'default' : 'destructive'}>
                {platform.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Rate Limit</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(platform.rateLimits.remaining / platform.rateLimits.total) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm">
                    {platform.rateLimits.remaining}/{platform.rateLimits.total}
                  </span>
                </div>
              </div>
              
              {platform.lastPost && (
                <div>
                  <p className="text-sm text-gray-600">Last Post</p>
                  <p className="text-sm">{new Date(platform.lastPost).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

## Custom Hooks

### useCrossPost Hook

```typescript
// hooks/useCrossPost.ts
import { useState, useCallback } from 'react'

interface Post {
  title: string
  content: string
  description?: string
  tags?: string[]
  publishStatus?: 'draft' | 'published'
  canonicalUrl?: string
  coverImage?: string
}

interface CrossPostResult {
  platform: string
  success: boolean
  platformPost?: any
  error?: any
}

export function useCrossPost() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CrossPostResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const crossPost = useCallback(async (post: Post) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/crosspost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
        return data.results
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cross-post'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const crossPostToPlatform = useCallback(async (platform: string, post: Post) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/crosspost/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, ...post })
      })
      
      const data = await response.json()
      
      if (data.result.success) {
        return data.result
      } else {
        throw new Error(data.result.error?.message || 'Failed to post')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cross-post'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    crossPost,
    crossPostToPlatform,
    loading,
    results,
    error,
    reset
  }
}
```

### useMarkdownProcessor Hook

```typescript
// hooks/useMarkdownProcessor.ts
import { useState, useCallback } from 'react'
import { MarkdownParser } from 'auto-crosspost'

export function useMarkdownProcessor() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processMarkdown = useCallback(async (content: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const parser = new MarkdownParser()
      const parsed = parser.parseContent(content)
      
      return {
        frontmatter: parsed.frontmatter,
        content: parsed.content,
        title: parsed.title,
        description: parsed.description,
        tags: parsed.tags,
        slug: parsed.slug
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process markdown'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const processFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const content = await file.text()
      return await processMarkdown(content)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [processMarkdown])

  return {
    processMarkdown,
    processFile,
    loading,
    error
  }
}
```

## Pages and Layouts

### Cross-Post Management Page

```typescript
// pages/admin/crosspost.tsx (Pages Router)
import { useState } from 'react'
import Head from 'next/head'
import { CrossPostForm } from '@/components/CrossPostForm'
import { CrossPostStatus } from '@/components/CrossPostStatus'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CrossPostPage() {
  const [activeTab, setActiveTab] = useState('compose')

  return (
    <>
      <Head>
        <title>Cross-post Articles | Admin</title>
        <meta name="description" content="Cross-post articles to multiple platforms" />
      </Head>
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Cross-post Manager
          </h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="compose" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
                  <CrossPostForm
                    onSuccess={(results) => {
                      console.log('Cross-post successful:', results)
                      // Handle success (show notification, redirect, etc.)
                    }}
                    onError={(error) => {
                      console.error('Cross-post failed:', error)
                      // Handle error (show notification, etc.)
                    }}
                  />
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">Platform Status</h2>
                  <CrossPostStatus />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="status" className="mt-6">
              <CrossPostStatus />
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Cross-post History</h2>
                <p className="text-gray-600">
                  Cross-post history feature coming soon...
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
```

### App Router Page

```typescript
// app/admin/crosspost/page.tsx (App Router)
import { CrossPostForm } from '@/components/CrossPostForm'
import { CrossPostStatus } from '@/components/CrossPostStatus'

export default function CrossPostPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Cross-post Manager
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
            <CrossPostForm />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Platform Status</h2>
            <CrossPostStatus />
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Middleware Integration

### Cross-Post Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin/crosspost')) {
    // Add authentication logic here
    const isAuthenticated = checkAuth(request)
    
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/crosspost')) {
    const response = NextResponse.next()
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  }
  
  return NextResponse.next()
}

function checkAuth(request: NextRequest): boolean {
  // Implement your authentication logic
  const token = request.cookies.get('auth-token')
  return !!token
}

export const config = {
  matcher: ['/admin/crosspost/:path*', '/api/crosspost/:path*']
}
```

## Server Actions (App Router)

```typescript
// app/actions/crosspost.ts
'use server'

import { getCrossPostSDK } from '@/lib/crosspost'
import { revalidatePath } from 'next/cache'

export async function crossPostAction(formData: FormData) {
  try {
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()) || []
    const publishStatus = (formData.get('publishStatus') as 'draft' | 'published') || 'draft'
    
    if (!title || !content) {
      throw new Error('Title and content are required')
    }
    
    const sdk = getCrossPostSDK()
    const results = await sdk.postToAll({
      title,
      content,
      tags,
      publishStatus
    })
    
    // Revalidate relevant pages
    revalidatePath('/admin/crosspost')
    
    return { success: true, results }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

## Webhooks Integration

### Content Management System Webhooks

```typescript
// pages/api/webhooks/cms.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCrossPostSDK } from '@/lib/crosspost'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook signature (example for Strapi)
    const signature = req.headers['x-strapi-signature'] as string
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(JSON.stringify(req.body))
      .digest('hex')

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const { event, model, entry } = req.body

    // Only process published blog posts
    if (event === 'entry.publish' && model === 'blog-post' && entry.published) {
      const sdk = getCrossPostSDK()
      
      const results = await sdk.postToAll({
        title: entry.title,
        content: entry.content,
        description: entry.description,
        tags: entry.tags?.map((tag: any) => tag.name) || [],
        publishStatus: 'published',
        canonicalUrl: `${process.env.SITE_URL}/blog/${entry.slug}`
      })

      console.log(`Cross-posted "${entry.title}" to ${results.length} platforms`)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
// lib/error-handler.ts
export function handleCrossPostError(error: any) {
  console.error('Cross-post error:', error)
  
  // Send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // errorTracker.captureException(error)
  }
  
  // Return user-friendly message
  if (error.code === 'AUTH_INVALID_API_KEY') {
    return 'Invalid API credentials. Please check your configuration.'
  }
  
  if (error.code === 'PLATFORM_RATE_LIMITED') {
    return 'Rate limit exceeded. Please try again later.'
  }
  
  return 'An unexpected error occurred. Please try again.'
}
```

### 2. Caching

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache'

export const getCachedPlatformStatus = unstable_cache(
  async () => {
    // Fetch platform status
    return {
      devto: { connected: true, rateLimits: { remaining: 950, total: 1000 } },
      hashnode: { connected: true, rateLimits: { remaining: 980, total: 1000 } }
    }
  },
  ['platform-status'],
  { revalidate: 300 } // Cache for 5 minutes
)
```

### 3. Type Safety

```typescript
// types/crosspost.ts
export interface CrossPostFormData {
  title: string
  content: string
  description?: string
  tags: string[]
  publishStatus: 'draft' | 'published'
  canonicalUrl?: string
  coverImage?: string
}

export interface CrossPostApiResponse {
  success: boolean
  results?: CrossPostResult[]
  error?: string
  summary?: {
    total: number
    successful: number
    failed: number
  }
}
```

## Deployment Considerations

### Environment Variables

Ensure these environment variables are set in production:

```bash
# Platform API Keys
DEVTO_API_KEY=your_devto_api_key
HASHNODE_TOKEN=your_hashnode_token
HASHNODE_PUBLICATION_ID=your_publication_id

# Application Settings
NEXTAUTH_SECRET=your_nextauth_secret
WEBHOOK_SECRET=your_webhook_secret
SITE_URL=https://yourdomain.com

# Optional
CROSSPOST_LOG_LEVEL=warn
NODE_ENV=production
```

### Vercel Deployment

```json
// vercel.json
{
  "functions": {
    "pages/api/crosspost/**": {
      "maxDuration": 30
    }
  },
  "env": {
    "CROSSPOST_LOG_LEVEL": "info"
  }
}
```

## Next Steps

- [CLI Usage](/guide/cli) - Command-line interface
- [API Reference](/api/) - Complete API documentation
- [Platform Guides](/guide/platforms/) - Platform-specific setup
- [Examples](/examples/) - More integration examples
