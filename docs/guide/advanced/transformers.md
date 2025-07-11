# Custom Transformers

Learn how to create custom content transformers for platform-specific formatting and advanced content processing.

## Overview

Custom transformers allow you to modify content before it's posted to specific platforms. This is useful for:

- Platform-specific formatting requirements
- Content adaptation (shortening, expanding)
- Custom metadata extraction
- Image processing and optimization
- Link transformation
- Custom syntax conversion

## Built-in Transformers

The SDK includes several built-in transformers:

### MarkdownTransformer

Processes standard markdown content:

```typescript
import { MarkdownTransformer } from 'auto-crosspost'

const transformer = new MarkdownTransformer()

const transformed = await transformer.transform({
  content: "# Hello World\n\nThis is **bold** text.",
  platform: 'devto'
})

console.log(transformed.content) // Platform-optimized markdown
```

### ImageTransformer

Handles image processing and optimization:

```typescript
import { ImageTransformer } from 'auto-crosspost'

const transformer = new ImageTransformer({
  cdnBaseUrl: 'https://cdn.yourdomain.com',
  optimization: {
    quality: 85,
    format: 'webp',
    sizes: [400, 800, 1200]
  }
})

const transformed = await transformer.transform({
  content: "![Alt text](./local-image.jpg)",
  platform: 'hashnode'
})

// Images are uploaded to CDN and URLs are replaced
```

### LinkTransformer

Transforms links for SEO and tracking:

```typescript
import { LinkTransformer } from 'auto-crosspost'

const transformer = new LinkTransformer({
  baseUrl: 'https://yourblog.com',
  utmParams: {
    source: 'auto-crosspost',
    medium: 'social',
    campaign: 'blog-promotion'
  }
})
```

## Creating Custom Transformers

### Basic Transformer Interface

All transformers must implement the `ContentTransformer` interface:

```typescript
interface ContentTransformer {
  name: string
  transform(input: TransformInput): Promise<TransformOutput>
}

interface TransformInput {
  content: string
  title?: string
  description?: string
  tags?: string[]
  platform: string
  metadata?: Record<string, any>
}

interface TransformOutput {
  content: string
  title?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, any>
}
```

### Simple Text Transformer

```typescript
import { ContentTransformer, TransformInput, TransformOutput } from 'auto-crosspost'

export class SimpleTextTransformer implements ContentTransformer {
  readonly name = 'simple-text'

  async transform(input: TransformInput): Promise<TransformOutput> {
    let { content, title, description, tags } = input

    // Add platform-specific prefix
    if (input.platform === 'devto') {
      content = `*Originally published on [My Blog](https://myblog.com)*\n\n${content}`
    }

    // Modify title for specific platforms
    if (input.platform === 'hashnode' && title) {
      title = `${title} | My Blog`
    }

    // Platform-specific tag transformations
    if (tags && input.platform === 'devto') {
      // Dev.to has a 4-tag limit
      tags = tags.slice(0, 4)
    }

    return {
      content,
      title,
      description,
      tags
    }
  }
}
```

### Advanced Code Block Transformer

```typescript
export class CodeBlockTransformer implements ContentTransformer {
  readonly name = 'code-block'

  private readonly platformConfigs = {
    devto: {
      supportsSyntaxHighlighting: true,
      supportedLanguages: ['javascript', 'typescript', 'python', 'go', 'rust'],
      fallbackLanguage: 'text'
    },
    hashnode: {
      supportsSyntaxHighlighting: true,
      supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'c', 'cpp'],
      fallbackLanguage: 'text'
    }
  }

  async transform(input: TransformInput): Promise<TransformOutput> {
    const config = this.platformConfigs[input.platform]
    if (!config) {
      return input
    }

    const content = this.transformCodeBlocks(input.content, config)

    return {
      ...input,
      content
    }
  }

  private transformCodeBlocks(content: string, config: any): string {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g

    return content.replace(codeBlockRegex, (match, language, code) => {
      // Use fallback if language not supported
      if (language && !config.supportedLanguages.includes(language)) {
        language = config.fallbackLanguage
      }

      // Add line numbers for longer code blocks
      const lines = code.trim().split('\n')
      if (lines.length > 10) {
        const numberedLines = lines.map((line, index) => 
          `${(index + 1).toString().padStart(2, ' ')} | ${line}`
        ).join('\n')
        
        return `\`\`\`${language}\n${numberedLines}\n\`\`\``
      }

      return `\`\`\`${language}\n${code.trim()}\n\`\`\``
    })
  }
}
```

### SEO Optimizer Transformer

```typescript
export class SEOOptimizerTransformer implements ContentTransformer {
  readonly name = 'seo-optimizer'

  private readonly seoConfig = {
    maxTitleLength: 60,
    maxDescriptionLength: 160,
    targetKeywordDensity: 0.02,
    minContentLength: 300
  }

  async transform(input: TransformInput): Promise<TransformOutput> {
    let { title, description, content, tags } = input

    // Optimize title
    title = this.optimizeTitle(title, tags)

    // Generate or optimize description
    description = this.optimizeDescription(description, content)

    // Add structured data
    const optimizedContent = this.addStructuredData(content, {
      title,
      description,
      tags,
      platform: input.platform
    })

    // Add internal links
    const linkedContent = this.addInternalLinks(optimizedContent)

    return {
      ...input,
      title,
      description,
      content: linkedContent
    }
  }

  private optimizeTitle(title: string, tags: string[] = []): string {
    if (!title) return title

    // Truncate if too long
    if (title.length > this.seoConfig.maxTitleLength) {
      title = title.substring(0, this.seoConfig.maxTitleLength - 3) + '...'
    }

    // Add primary tag if not present
    const primaryTag = tags[0]
    if (primaryTag && !title.toLowerCase().includes(primaryTag.toLowerCase())) {
      // Try to fit the tag in the title
      const availableSpace = this.seoConfig.maxTitleLength - title.length - 3
      if (availableSpace >= primaryTag.length) {
        title = `${title} | ${primaryTag}`
      }
    }

    return title
  }

  private optimizeDescription(description: string, content: string): string {
    if (description && description.length <= this.seoConfig.maxDescriptionLength) {
      return description
    }

    // Extract first paragraph as description
    const firstParagraph = content
      .replace(/^#.*$/gm, '') // Remove headers
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .split('\n\n')[0]
      .replace(/[*_`]/g, '') // Remove markdown formatting
      .trim()

    if (firstParagraph.length <= this.seoConfig.maxDescriptionLength) {
      return firstParagraph
    }

    // Truncate at word boundary
    const truncated = firstParagraph.substring(0, this.seoConfig.maxDescriptionLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    return truncated.substring(0, lastSpace) + '...'
  }

  private addStructuredData(content: string, metadata: any): string {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: metadata.title,
      description: metadata.description,
      keywords: metadata.tags?.join(', '),
      author: {
        '@type': 'Person',
        name: 'Your Name'
      }
    }

    // Add structured data comment for platforms that support it
    if (metadata.platform === 'hashnode') {
      return `<!-- ${JSON.stringify(structuredData)} -->\n\n${content}`
    }

    return content
  }

  private addInternalLinks(content: string): string {
    // Define related articles mapping
    const relatedArticles = {
      'typescript': [
        { title: 'TypeScript Best Practices', url: '/typescript-best-practices' },
        { title: 'Advanced TypeScript Patterns', url: '/advanced-typescript' }
      ],
      'javascript': [
        { title: 'Modern JavaScript Features', url: '/modern-javascript' },
        { title: 'JavaScript Performance Tips', url: '/js-performance' }
      ]
    }

    // Add related links section
    const tags = content.match(/#(\w+)/g)?.map(tag => tag.slice(1)) || []
    const relevantLinks = tags.flatMap(tag => relatedArticles[tag] || [])

    if (relevantLinks.length > 0) {
      const linksSection = '\n\n## Related Articles\n\n' +
        relevantLinks.slice(0, 3).map(link => `- [${link.title}](${link.url})`).join('\n')
      
      return content + linksSection
    }

    return content
  }
}
```

### Social Media Optimizer

```typescript
export class SocialMediaOptimizer implements ContentTransformer {
  readonly name = 'social-media-optimizer'

  private readonly platformLimits = {
    devto: {
      titleMaxLength: 128,
      excerptMaxLength: 300,
      hashtagLimit: 4
    },
    hashnode: {
      titleMaxLength: 255,
      excerptMaxLength: 500,
      hashtagLimit: 10
    }
  }

  async transform(input: TransformInput): Promise<TransformOutput> {
    const limits = this.platformLimits[input.platform]
    if (!limits) return input

    let { title, description, content, tags } = input

    // Optimize title for social sharing
    title = this.optimizeForSocial(title, limits.titleMaxLength)

    // Create engaging excerpt
    description = this.createEngagingExcerpt(description || content, limits.excerptMaxLength)

    // Optimize hashtags
    tags = this.optimizeHashtags(tags, limits.hashtagLimit)

    // Add call-to-action
    content = this.addCallToAction(content, input.platform)

    // Add social sharing metadata
    const metadata = {
      ...input.metadata,
      socialOptimized: true,
      ogTitle: title,
      ogDescription: description,
      twitterCard: 'summary_large_image'
    }

    return {
      title,
      description,
      content,
      tags,
      metadata
    }
  }

  private optimizeForSocial(title: string, maxLength: number): string {
    if (!title || title.length <= maxLength) return title

    // Find good breaking point
    const truncated = title.substring(0, maxLength - 3)
    const lastSpace = truncated.lastIndexOf(' ')
    
    return truncated.substring(0, lastSpace) + '...'
  }

  private createEngagingExcerpt(content: string, maxLength: number): string {
    // Remove markdown formatting
    const cleanContent = content
      .replace(/^#+\s+/gm, '')  // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
      .replace(/\*(.*?)\*/g, '$1')  // Italic
      .replace(/`(.*?)`/g, '$1')  // Code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
      .trim()

    // Find the first interesting sentence
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    if (sentences.length === 0) return cleanContent.substring(0, maxLength)

    let excerpt = sentences[0].trim()
    
    // Add more sentences if there's space
    for (let i = 1; i < sentences.length && excerpt.length < maxLength - 50; i++) {
      const nextSentence = sentences[i].trim()
      if (excerpt.length + nextSentence.length + 2 <= maxLength) {
        excerpt += '. ' + nextSentence
      } else {
        break
      }
    }

    // Add engaging ending
    if (excerpt.length < maxLength - 20) {
      excerpt += ' 🚀'
    }

    return excerpt
  }

  private optimizeHashtags(tags: string[] = [], limit: number): string[] {
    // Sort by popularity/relevance (simplified)
    const popularTags = ['javascript', 'typescript', 'react', 'nodejs', 'webdev']
    
    const sortedTags = tags.sort((a, b) => {
      const aIndex = popularTags.indexOf(a)
      const bIndex = popularTags.indexOf(b)
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return 0
    })

    return sortedTags.slice(0, limit)
  }

  private addCallToAction(content: string, platform: string): string {
    const ctas = {
      devto: '\n\n---\n\n💬 What are your thoughts? Share them in the comments below!\n\n🔔 Follow for more web development tips and tutorials.',
      hashnode: '\n\n---\n\n👏 If you found this helpful, please give it a like and share with fellow developers!\n\n🚀 Subscribe to stay updated with the latest content.'
    }

    const cta = ctas[platform]
    return cta ? content + cta : content
  }
}
```

## Using Custom Transformers

### Register with SDK

```typescript
import { CrossPostSDK } from 'auto-crosspost'
import { 
  SimpleTextTransformer, 
  CodeBlockTransformer, 
  SEOOptimizerTransformer,
  SocialMediaOptimizer 
} from './transformers'

const sdk = new CrossPostSDK(config)

// Register transformers
sdk.addTransformer(new SimpleTextTransformer())
sdk.addTransformer(new CodeBlockTransformer())
sdk.addTransformer(new SEOOptimizerTransformer())
sdk.addTransformer(new SocialMediaOptimizer())

// Transformers are applied in registration order
const results = await sdk.postToAll(post)
```

### Platform-Specific Transformers

```typescript
// Apply transformer only to specific platforms
sdk.addTransformer(new SimpleTextTransformer(), ['devto'])
sdk.addTransformer(new SocialMediaOptimizer(), ['hashnode'])

// Or configure per platform
const devtoTransformers = [
  new CodeBlockTransformer(),
  new SimpleTextTransformer()
]

const hashnodeTransformers = [
  new SEOOptimizerTransformer(),
  new SocialMediaOptimizer()
]

sdk.configurePlatformTransformers('devto', devtoTransformers)
sdk.configurePlatformTransformers('hashnode', hashnodeTransformers)
```

### Conditional Transformation

```typescript
export class ConditionalTransformer implements ContentTransformer {
  readonly name = 'conditional'

  async transform(input: TransformInput): Promise<TransformOutput> {
    const { content, tags, platform } = input

    // Only transform if specific conditions are met
    if (tags?.includes('tutorial') && platform === 'devto') {
      return this.transformTutorial(input)
    }

    if (content.includes('```') && platform === 'hashnode') {
      return this.transformCodeExample(input)
    }

    return input
  }

  private transformTutorial(input: TransformInput): TransformOutput {
    const tutorialHeader = `> 📚 **Tutorial Alert!** This is a step-by-step guide.\n\n`
    
    return {
      ...input,
      content: tutorialHeader + input.content
    }
  }

  private transformCodeExample(input: TransformInput): TransformOutput {
    const codeNotice = `\n\n💡 **Pro Tip:** Try running these code examples in your own environment!`
    
    return {
      ...input,
      content: input.content + codeNotice
    }
  }
}
```

## Advanced Transformation Patterns

### Async Image Processing

```typescript
export class AsyncImageProcessor implements ContentTransformer {
  readonly name = 'async-image-processor'

  private imageService: ImageProcessingService

  constructor(imageService: ImageProcessingService) {
    this.imageService = imageService
  }

  async transform(input: TransformInput): Promise<TransformOutput> {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    const images: Array<{ alt: string, src: string, match: string }> = []
    
    let match
    while ((match = imageRegex.exec(input.content)) !== null) {
      images.push({
        alt: match[1],
        src: match[2],
        match: match[0]
      })
    }

    // Process images in parallel
    const processedImages = await Promise.all(
      images.map(async (img) => {
        try {
          const optimized = await this.imageService.optimizeImage(img.src, {
            quality: 85,
            format: 'webp',
            width: 800
          })
          
          return {
            ...img,
            optimizedSrc: optimized.url,
            optimizedAlt: this.optimizeAltText(img.alt)
          }
        } catch (error) {
          console.warn(`Failed to optimize image ${img.src}:`, error)
          return img
        }
      })
    )

    // Replace images in content
    let optimizedContent = input.content
    processedImages.forEach((img) => {
      const newImage = `![${img.optimizedAlt || img.alt}](${img.optimizedSrc || img.src})`
      optimizedContent = optimizedContent.replace(img.match, newImage)
    })

    return {
      ...input,
      content: optimizedContent
    }
  }

  private optimizeAltText(alt: string): string {
    if (!alt || alt.trim().length === 0) {
      return 'Image'
    }

    // Ensure alt text is descriptive
    if (alt.length < 10) {
      return `Illustration: ${alt}`
    }

    return alt
  }
}
```

### Content Analytics Transformer

```typescript
export class ContentAnalyticsTransformer implements ContentTransformer {
  readonly name = 'content-analytics'

  async transform(input: TransformInput): Promise<TransformOutput> {
    const analytics = this.analyzeContent(input.content)
    
    // Add analytics metadata
    const metadata = {
      ...input.metadata,
      analytics: {
        wordCount: analytics.wordCount,
        readingTime: analytics.readingTime,
        complexity: analytics.complexity,
        sentiment: analytics.sentiment,
        topics: analytics.topics
      }
    }

    // Add reading time to content for user-facing platforms
    let content = input.content
    if (input.platform === 'devto' || input.platform === 'hashnode') {
      const readingTimeNote = `*📖 Reading time: ${analytics.readingTime} minutes*\n\n`
      content = readingTimeNote + content
    }

    return {
      ...input,
      content,
      metadata
    }
  }

  private analyzeContent(content: string): ContentAnalytics {
    const plainText = this.stripMarkdown(content)
    const words = plainText.split(/\s+/).filter(word => word.length > 0)
    
    return {
      wordCount: words.length,
      readingTime: Math.ceil(words.length / 200), // Average reading speed
      complexity: this.calculateComplexity(words),
      sentiment: this.analyzeSentiment(plainText),
      topics: this.extractTopics(plainText)
    }
  }

  private stripMarkdown(content: string): string {
    return content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/>\s+/gm, '')
  }

  private calculateComplexity(words: string[]): 'simple' | 'moderate' | 'complex' {
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    
    if (avgLength < 4.5) return 'simple'
    if (avgLength < 6) return 'moderate'
    return 'complex'
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'amazing', 'love']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'difficult', 'problem']
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(word => positiveWords.includes(word)).length
    const negativeCount = words.filter(word => negativeWords.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private extractTopics(text: string): string[] {
    // Extract potential topics from text
    const topicKeywords = {
      'javascript': ['javascript', 'js', 'node', 'npm'],
      'typescript': ['typescript', 'ts', 'type'],
      'react': ['react', 'jsx', 'component'],
      'web-development': ['html', 'css', 'browser', 'frontend'],
      'backend': ['server', 'api', 'database', 'backend']
    }

    const words = text.toLowerCase().split(/\s+/)
    const topics: string[] = []

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => words.includes(keyword))) {
        topics.push(topic)
      }
    })

    return topics
  }
}

interface ContentAnalytics {
  wordCount: number
  readingTime: number
  complexity: 'simple' | 'moderate' | 'complex'
  sentiment: 'positive' | 'neutral' | 'negative'
  topics: string[]
}
```

## Configuration and Best Practices

### Transformer Configuration

```typescript
// config/transformers.ts
import { TransformerConfig } from 'auto-crosspost'

export const transformerConfig: TransformerConfig = {
  // Global transformer settings
  global: {
    enabled: true,
    order: ['seo-optimizer', 'code-block', 'social-media-optimizer', 'simple-text']
  },
  
  // Platform-specific settings
  platforms: {
    devto: {
      transformers: ['code-block', 'simple-text'],
      settings: {
        'code-block': {
          addLineNumbers: true,
          maxLines: 50
        }
      }
    },
    hashnode: {
      transformers: ['seo-optimizer', 'social-media-optimizer'],
      settings: {
        'seo-optimizer': {
          addStructuredData: true,
          optimizeImages: true
        }
      }
    }
  }
}
```

### Testing Transformers

```typescript
// tests/transformers.test.ts
import { SimpleTextTransformer } from '../src/transformers'

describe('SimpleTextTransformer', () => {
  const transformer = new SimpleTextTransformer()

  test('adds platform prefix for Dev.to', async () => {
    const input = {
      content: '# Hello World',
      platform: 'devto'
    }

    const result = await transformer.transform(input)
    
    expect(result.content).toContain('Originally published on')
  })

  test('limits tags for Dev.to', async () => {
    const input = {
      content: '# Test',
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      platform: 'devto'
    }

    const result = await transformer.transform(input)
    
    expect(result.tags).toHaveLength(4)
  })
})
```

### Performance Optimization

```typescript
export class OptimizedTransformer implements ContentTransformer {
  readonly name = 'optimized'
  
  private cache = new Map<string, TransformOutput>()

  async transform(input: TransformInput): Promise<TransformOutput> {
    // Create cache key from input
    const cacheKey = this.createCacheKey(input)
    
    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Perform transformation
    const result = await this.performTransformation(input)
    
    // Cache result (with size limit)
    if (this.cache.size < 1000) {
      this.cache.set(cacheKey, result)
    }

    return result
  }

  private createCacheKey(input: TransformInput): string {
    return `${input.platform}:${input.content.substring(0, 100)}`
  }

  private async performTransformation(input: TransformInput): Promise<TransformOutput> {
    // Actual transformation logic here
    return input
  }
}
```

## Next Steps

- [Error Handling](/guide/advanced/error-handling) - Advanced error handling strategies
- [Batch Processing](/guide/advanced/batch-processing) - Process multiple posts efficiently
- [API Reference](/api/) - Complete transformer API documentation
