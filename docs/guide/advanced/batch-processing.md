# Batch Processing

Learn how to efficiently process multiple posts, implement queuing systems, and handle large-scale cross-posting operations.

## Overview

Batch processing enables you to:

- Process multiple markdown files simultaneously
- Implement efficient queuing and scheduling
- Handle rate limiting across multiple posts
- Monitor progress and manage failures
- Scale cross-posting operations

## Basic Batch Operations

### Process Multiple Files

```typescript
import { CrossPostSDK, MarkdownParser } from 'auto-crosspost'
import fs from 'fs/promises'
import path from 'path'

async function batchProcessFiles(directory: string) {
  const files = await fs.readdir(directory)
  const markdownFiles = files.filter(file => file.endsWith('.md'))
  
  console.log(`Found ${markdownFiles.length} markdown files`)

  const parser = new MarkdownParser()
  const sdk = new CrossPostSDK(await ConfigManager.loadConfig())
  
  const results = []

  for (const file of markdownFiles) {
    const filePath = path.join(directory, file)
    
    try {
      console.log(`Processing: ${file}`)
      
      // Parse markdown
      const parsed = await parser.parseFile(filePath)
      
      // Skip if not published
      if (!parsed.frontmatter.published) {
        console.log(`Skipping draft: ${file}`)
        continue
      }

      // Convert to post
      const post = {
        title: parsed.frontmatter.title,
        content: parsed.content,
        description: parsed.frontmatter.description,
        tags: parsed.frontmatter.tags || [],
        publishStatus: 'published' as const,
        canonicalUrl: parsed.frontmatter.canonical_url
      }

      // Cross-post
      const postResults = await sdk.postToAll(post)
      
      results.push({
        file,
        results: postResults,
        success: postResults.every(r => r.success)
      })

      // Rate limiting - wait between posts
      await delay(2000)

    } catch (error) {
      console.error(`Error processing ${file}:`, error.message)
      results.push({
        file,
        error: error.message,
        success: false
      })
    }
  }

  return results
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

### Parallel Processing with Concurrency Control

```typescript
import pLimit from 'p-limit'

class BatchProcessor {
  private concurrency: number
  private delay: number
  private limit: any

  constructor(options: BatchOptions = {}) {
    this.concurrency = options.concurrency || 3
    this.delay = options.delay || 1000
    this.limit = pLimit(this.concurrency)
  }

  async processFiles(files: string[]): Promise<BatchResult[]> {
    console.log(`Processing ${files.length} files with concurrency ${this.concurrency}`)

    const parser = new MarkdownParser()
    const sdk = new CrossPostSDK(await ConfigManager.loadConfig())
    
    const promises = files.map(filePath => 
      this.limit(async () => {
        try {
          const result = await this.processFile(filePath, parser, sdk)
          
          // Add delay between requests to respect rate limits
          if (this.delay > 0) {
            await delay(this.delay)
          }
          
          return result
        } catch (error) {
          return {
            file: filePath,
            error: error.message,
            success: false,
            timestamp: new Date()
          }
        }
      })
    )

    return Promise.all(promises)
  }

  private async processFile(
    filePath: string, 
    parser: MarkdownParser, 
    sdk: CrossPostSDK
  ): Promise<BatchResult> {
    const startTime = Date.now()
    
    // Parse markdown
    const parsed = await parser.parseFile(filePath)
    
    // Create post object
    const post = {
      title: parsed.frontmatter.title,
      content: parsed.content,
      description: parsed.frontmatter.description,
      tags: parsed.frontmatter.tags || [],
      publishStatus: parsed.frontmatter.published ? 'published' : 'draft' as const
    }

    // Cross-post to all platforms
    const results = await sdk.postToAll(post)
    
    const duration = Date.now() - startTime
    const success = results.every(r => r.success)

    return {
      file: path.basename(filePath),
      results,
      success,
      duration,
      timestamp: new Date()
    }
  }
}

interface BatchOptions {
  concurrency?: number
  delay?: number
  retryFailures?: boolean
  skipDrafts?: boolean
}

interface BatchResult {
  file: string
  results?: any[]
  error?: string
  success: boolean
  duration?: number
  timestamp: Date
}
```

## Advanced Queue System

### Job Queue Implementation

```typescript
import { EventEmitter } from 'events'

class CrossPostQueue extends EventEmitter {
  private queue: QueueJob[] = []
  private processing = false
  private concurrency = 2
  private activeJobs = new Set<string>()

  constructor(options: QueueOptions = {}) {
    super()
    this.concurrency = options.concurrency || 2
  }

  async addJob(job: QueueJobData): Promise<string> {
    const id = this.generateJobId()
    
    const queueJob: QueueJob = {
      id,
      data: job,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: job.maxAttempts || 3
    }

    this.queue.push(queueJob)
    this.emit('jobAdded', queueJob)

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing()
    }

    return id
  }

  async addBatch(jobs: QueueJobData[]): Promise<string[]> {
    const jobIds = await Promise.all(
      jobs.map(job => this.addJob(job))
    )

    this.emit('batchAdded', { count: jobs.length, jobIds })
    return jobIds
  }

  private async startProcessing() {
    if (this.processing) return
    
    this.processing = true
    this.emit('processingStarted')

    while (this.queue.length > 0 || this.activeJobs.size > 0) {
      // Process jobs up to concurrency limit
      while (this.activeJobs.size < this.concurrency && this.queue.length > 0) {
        const job = this.queue.shift()!
        this.processJob(job)
      }

      // Wait a bit before checking again
      await delay(100)
    }

    this.processing = false
    this.emit('processingCompleted')
  }

  private async processJob(job: QueueJob) {
    this.activeJobs.add(job.id)
    job.status = 'processing'
    job.startedAt = new Date()
    
    this.emit('jobStarted', job)

    try {
      const result = await this.executeJob(job)
      
      job.status = 'completed'
      job.completedAt = new Date()
      job.result = result
      
      this.emit('jobCompleted', job)
    } catch (error) {
      job.attempts++
      job.error = error.message

      if (job.attempts < job.maxAttempts) {
        // Retry job
        job.status = 'pending'
        job.retryAt = new Date(Date.now() + this.calculateRetryDelay(job.attempts))
        
        // Add back to queue for retry
        this.queue.push(job)
        this.emit('jobRetry', job)
      } else {
        job.status = 'failed'
        job.completedAt = new Date()
        this.emit('jobFailed', job)
      }
    } finally {
      this.activeJobs.delete(job.id)
    }
  }

  private async executeJob(job: QueueJob): Promise<any> {
    const sdk = new CrossPostSDK(await ConfigManager.loadConfig())
    
    switch (job.data.type) {
      case 'crosspost':
        return sdk.postToAll(job.data.post)
      
      case 'crosspost-platform':
        return sdk.postToPlatform(job.data.platform, job.data.post)
      
      case 'update':
        return sdk.updatePost(job.data.platform, job.data.platformId, job.data.post)
      
      case 'delete':
        return sdk.deletePost(job.data.platform, job.data.platformId)
      
      default:
        throw new Error(`Unknown job type: ${job.data.type}`)
    }
  }

  private calculateRetryDelay(attempts: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempts - 1), 30000)
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getStatus(): QueueStatus {
    return {
      totalJobs: this.queue.length + this.activeJobs.size,
      pendingJobs: this.queue.filter(j => j.status === 'pending').length,
      processingJobs: this.activeJobs.size,
      processing: this.processing
    }
  }

  getJob(id: string): QueueJob | undefined {
    return this.queue.find(job => job.id === id)
  }

  clear() {
    this.queue = []
    this.emit('queueCleared')
  }
}

interface QueueOptions {
  concurrency?: number
}

interface QueueJobData {
  type: 'crosspost' | 'crosspost-platform' | 'update' | 'delete'
  post?: any
  platform?: string
  platformId?: string
  maxAttempts?: number
}

interface QueueJob {
  id: string
  data: QueueJobData
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  retryAt?: Date
  attempts: number
  maxAttempts: number
  result?: any
  error?: string
}

interface QueueStatus {
  totalJobs: number
  pendingJobs: number
  processingJobs: number
  processing: boolean
}
```

### Using the Queue System

```typescript
async function batchProcessWithQueue() {
  const queue = new CrossPostQueue({ concurrency: 3 })
  
  // Listen to events
  queue.on('jobCompleted', (job) => {
    console.log(`✅ Job ${job.id} completed`)
  })
  
  queue.on('jobFailed', (job) => {
    console.error(`❌ Job ${job.id} failed: ${job.error}`)
  })
  
  queue.on('processingCompleted', () => {
    console.log('🎉 All jobs completed!')
  })

  // Add jobs to queue
  const files = await fs.readdir('./posts')
  const markdownFiles = files.filter(f => f.endsWith('.md'))
  
  for (const file of markdownFiles) {
    const parsed = await new MarkdownParser().parseFile(`./posts/${file}`)
    
    await queue.addJob({
      type: 'crosspost',
      post: {
        title: parsed.frontmatter.title,
        content: parsed.content,
        tags: parsed.frontmatter.tags || [],
        publishStatus: 'published'
      }
    })
  }

  // Monitor progress
  const statusInterval = setInterval(() => {
    const status = queue.getStatus()
    console.log(`Progress: ${status.processingJobs} processing, ${status.pendingJobs} pending`)
  }, 5000)

  // Wait for completion
  await new Promise<void>((resolve) => {
    queue.on('processingCompleted', () => {
      clearInterval(statusInterval)
      resolve()
    })
  })
}
```

## Progress Tracking and Monitoring

### Progress Reporter

```typescript
class BatchProgressReporter {
  private startTime: Date
  private totalJobs: number
  private completedJobs: number = 0
  private failedJobs: number = 0
  private results: BatchResult[] = []

  constructor(totalJobs: number) {
    this.totalJobs = totalJobs
    this.startTime = new Date()
  }

  reportProgress(result: BatchResult) {
    this.results.push(result)
    
    if (result.success) {
      this.completedJobs++
    } else {
      this.failedJobs++
    }

    this.printProgress()
  }

  private printProgress() {
    const processed = this.completedJobs + this.failedJobs
    const percentage = Math.round((processed / this.totalJobs) * 100)
    const elapsed = Date.now() - this.startTime.getTime()
    const rate = processed / (elapsed / 1000)
    const eta = Math.round((this.totalJobs - processed) / rate)

    console.log(
      `Progress: ${processed}/${this.totalJobs} (${percentage}%) | ` +
      `✅ ${this.completedJobs} ❌ ${this.failedJobs} | ` +
      `Rate: ${rate.toFixed(1)}/s | ETA: ${eta}s`
    )
  }

  getFinalReport(): BatchReport {
    const totalTime = Date.now() - this.startTime.getTime()
    
    return {
      totalJobs: this.totalJobs,
      completedJobs: this.completedJobs,
      failedJobs: this.failedJobs,
      successRate: (this.completedJobs / this.totalJobs) * 100,
      totalTime,
      averageTime: totalTime / this.totalJobs,
      results: this.results
    }
  }
}

interface BatchReport {
  totalJobs: number
  completedJobs: number
  failedJobs: number
  successRate: number
  totalTime: number
  averageTime: number
  results: BatchResult[]
}
```

### Real-time Dashboard

```typescript
import { WebSocketServer } from 'ws'

class BatchDashboard {
  private wss: WebSocketServer
  private stats: DashboardStats = {
    jobsProcessed: 0,
    jobsSuccessful: 0,
    jobsFailed: 0,
    currentRate: 0,
    platforms: {}
  }

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port })
    console.log(`Dashboard server running on ws://localhost:${port}`)
  }

  updateStats(result: BatchResult) {
    this.stats.jobsProcessed++
    
    if (result.success) {
      this.stats.jobsSuccessful++
      
      // Update platform stats
      result.results?.forEach(r => {
        if (!this.stats.platforms[r.platform]) {
          this.stats.platforms[r.platform] = { successful: 0, failed: 0 }
        }
        
        if (r.success) {
          this.stats.platforms[r.platform].successful++
        } else {
          this.stats.platforms[r.platform].failed++
        }
      })
    } else {
      this.stats.jobsFailed++
    }

    // Broadcast to all connected clients
    this.broadcast({
      type: 'stats-update',
      data: this.stats
    })
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message)
    
    this.wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(messageStr)
      }
    })
  }
}

interface DashboardStats {
  jobsProcessed: number
  jobsSuccessful: number
  jobsFailed: number
  currentRate: number
  platforms: Record<string, { successful: number, failed: number }>
}
```

## Scheduling and Automation

### Cron-based Scheduler

```typescript
import cron from 'node-cron'

class CrossPostScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map()

  scheduleDaily(time: string, directory: string) {
    const task = cron.schedule(`0 ${time} * * *`, async () => {
      console.log(`Running daily cross-post at ${time}`)
      await this.processPendingPosts(directory)
    }, { scheduled: false })

    const jobId = `daily-${time}`
    this.jobs.set(jobId, task)
    task.start()

    return jobId
  }

  scheduleWeekly(day: number, time: string, directory: string) {
    const task = cron.schedule(`0 ${time} * * ${day}`, async () => {
      console.log(`Running weekly cross-post on day ${day} at ${time}`)
      await this.processPendingPosts(directory)
    }, { scheduled: false })

    const jobId = `weekly-${day}-${time}`
    this.jobs.set(jobId, task)
    task.start()

    return jobId
  }

  private async processPendingPosts(directory: string) {
    try {
      const processor = new BatchProcessor({
        concurrency: 2,
        delay: 2000
      })

      const files = await fs.readdir(directory)
      const markdownFiles = files
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(directory, f))

      const results = await processor.processFiles(markdownFiles)
      
      const successful = results.filter(r => r.success).length
      console.log(`Scheduled job completed: ${successful}/${results.length} successful`)
      
    } catch (error) {
      console.error('Scheduled job failed:', error)
    }
  }

  stopJob(jobId: string) {
    const task = this.jobs.get(jobId)
    if (task) {
      task.stop()
      this.jobs.delete(jobId)
    }
  }

  stopAll() {
    this.jobs.forEach(task => task.stop())
    this.jobs.clear()
  }
}
```

### File Watcher

```typescript
import chokidar from 'chokidar'

class FileWatcher {
  private watcher: chokidar.FSWatcher
  private queue: CrossPostQueue

  constructor(directory: string, options: WatcherOptions = {}) {
    this.queue = new CrossPostQueue({ 
      concurrency: options.concurrency || 1 
    })

    this.watcher = chokidar.watch(path.join(directory, '*.md'), {
      persistent: true,
      ignoreInitial: options.ignoreInitial || true
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.watcher.on('add', (filePath) => {
      console.log(`New file detected: ${filePath}`)
      this.processFile(filePath)
    })

    this.watcher.on('change', (filePath) => {
      console.log(`File changed: ${filePath}`)
      this.processFile(filePath)
    })

    this.queue.on('jobCompleted', (job) => {
      console.log(`✅ Auto-posted: ${job.data.post?.title}`)
    })

    this.queue.on('jobFailed', (job) => {
      console.error(`❌ Auto-post failed: ${job.error}`)
    })
  }

  private async processFile(filePath: string) {
    try {
      const parser = new MarkdownParser()
      const parsed = await parser.parseFile(filePath)

      // Only process published posts
      if (!parsed.frontmatter.published) {
        return
      }

      await this.queue.addJob({
        type: 'crosspost',
        post: {
          title: parsed.frontmatter.title,
          content: parsed.content,
          description: parsed.frontmatter.description,
          tags: parsed.frontmatter.tags || [],
          publishStatus: 'published'
        }
      })

    } catch (error) {
      console.error(`Error processing ${filePath}:`, error)
    }
  }

  stop() {
    this.watcher.close()
  }
}

interface WatcherOptions {
  concurrency?: number
  ignoreInitial?: boolean
}
```

## Performance Optimization

### Memory-Efficient Processing

```typescript
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

class MemoryEfficientProcessor {
  async processLargeFile(filePath: string): Promise<void> {
    const fileStream = createReadStream(filePath)
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    let currentPost: string[] = []
    let inFrontmatter = false
    let frontmatterEnd = false

    for await (const line of rl) {
      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true
        } else if (!frontmatterEnd) {
          frontmatterEnd = true
          // Process accumulated post
          await this.processAccumulatedPost(currentPost)
          currentPost = []
        }
      }

      currentPost.push(line)

      // Process post when we hit a separator or end
      if (line === '<!-- POST_SEPARATOR -->' || frontmatterEnd) {
        if (currentPost.length > 0) {
          await this.processAccumulatedPost(currentPost)
          currentPost = []
        }
        inFrontmatter = false
        frontmatterEnd = false
      }
    }

    // Process final post
    if (currentPost.length > 0) {
      await this.processAccumulatedPost(currentPost)
    }
  }

  private async processAccumulatedPost(lines: string[]) {
    const content = lines.join('\n')
    const parser = new MarkdownParser()
    
    try {
      const parsed = parser.parseContent(content)
      
      if (parsed.frontmatter.published) {
        const sdk = new CrossPostSDK(await ConfigManager.loadConfig())
        await sdk.postToAll({
          title: parsed.frontmatter.title,
          content: parsed.content,
          tags: parsed.frontmatter.tags || [],
          publishStatus: 'published'
        })
      }
    } catch (error) {
      console.error('Error processing post:', error)
    }
  }
}
```

### Batch Optimization Strategies

```typescript
class OptimizedBatchProcessor {
  private rateLimitManager = new RateLimitManager()
  private cache = new Map<string, any>()

  async processWithOptimizations(files: string[]): Promise<BatchResult[]> {
    // 1. Pre-filter files
    const validFiles = await this.preFilterFiles(files)
    
    // 2. Group by content similarity for better caching
    const groups = this.groupSimilarContent(validFiles)
    
    // 3. Process groups with optimized strategies
    const results: BatchResult[] = []
    
    for (const group of groups) {
      const groupResults = await this.processGroup(group)
      results.push(...groupResults)
    }

    return results
  }

  private async preFilterFiles(files: string[]): Promise<string[]> {
    const validFiles: string[] = []
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file)
        
        // Skip very large files (>1MB)
        if (stats.size > 1024 * 1024) {
          console.warn(`Skipping large file: ${file}`)
          continue
        }

        // Check if file was modified recently
        const isRecent = Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000
        if (isRecent) {
          validFiles.push(file)
        }
      } catch (error) {
        console.warn(`Error checking file ${file}:`, error)
      }
    }

    return validFiles
  }

  private groupSimilarContent(files: string[]): string[][] {
    // Simple grouping by directory
    const groups = new Map<string, string[]>()
    
    files.forEach(file => {
      const dir = path.dirname(file)
      if (!groups.has(dir)) {
        groups.set(dir, [])
      }
      groups.get(dir)!.push(file)
    })

    return Array.from(groups.values())
  }

  private async processGroup(files: string[]): Promise<BatchResult[]> {
    // Process files in the group with shared context
    const parser = new MarkdownParser()
    const sdk = new CrossPostSDK(await ConfigManager.loadConfig())
    
    const results: BatchResult[] = []
    
    for (const file of files) {
      // Check cache first
      const cacheKey = await this.getCacheKey(file)
      if (this.cache.has(cacheKey)) {
        console.log(`Using cached result for ${file}`)
        results.push(this.cache.get(cacheKey))
        continue
      }

      // Rate limiting
      await this.rateLimitManager.waitIfNeeded()

      // Process file
      try {
        const result = await this.processFile(file, parser, sdk)
        results.push(result)
        
        // Cache successful results
        if (result.success) {
          this.cache.set(cacheKey, result)
        }
      } catch (error) {
        results.push({
          file,
          error: error.message,
          success: false,
          timestamp: new Date()
        })
      }
    }

    return results
  }

  private async getCacheKey(file: string): Promise<string> {
    const stats = await fs.stat(file)
    return `${file}-${stats.mtime.getTime()}-${stats.size}`
  }
}

class RateLimitManager {
  private lastRequest = 0
  private requestCount = 0
  private windowStart = Date.now()
  private readonly maxRequestsPerWindow = 50
  private readonly windowDuration = 60000 // 1 minute

  async waitIfNeeded() {
    const now = Date.now()
    
    // Reset window if needed
    if (now - this.windowStart > this.windowDuration) {
      this.requestCount = 0
      this.windowStart = now
    }

    // Check if we've hit the rate limit
    if (this.requestCount >= this.maxRequestsPerWindow) {
      const waitTime = this.windowDuration - (now - this.windowStart)
      console.log(`Rate limit reached, waiting ${waitTime}ms`)
      await delay(waitTime)
      this.requestCount = 0
      this.windowStart = Date.now()
    }

    // Ensure minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequest
    const minDelay = 200 // 200ms between requests
    
    if (timeSinceLastRequest < minDelay) {
      await delay(minDelay - timeSinceLastRequest)
    }

    this.lastRequest = Date.now()
    this.requestCount++
  }
}
```

## CLI Integration

### Enhanced Batch CLI

```typescript
#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program
  .name('auto-crosspost-batch')
  .description('Batch cross-posting utilities')
  .version('1.0.0')

program
  .command('process')
  .description('Process multiple markdown files')
  .argument('<directory>', 'Directory containing markdown files')
  .option('-c, --concurrency <number>', 'Number of concurrent operations', '3')
  .option('-d, --delay <number>', 'Delay between operations (ms)', '1000')
  .option('--dry-run', 'Show what would be processed without executing')
  .option('--filter <pattern>', 'File pattern to filter', '*.md')
  .option('--dashboard', 'Start real-time dashboard')
  .action(async (directory, options) => {
    if (options.dashboard) {
      const dashboard = new BatchDashboard(8080)
      console.log('Dashboard available at ws://localhost:8080')
    }

    const processor = new BatchProcessor({
      concurrency: parseInt(options.concurrency),
      delay: parseInt(options.delay)
    })

    const files = await glob(path.join(directory, options.filter))
    
    if (options.dryRun) {
      console.log(`Would process ${files.length} files:`)
      files.forEach(file => console.log(`  ${file}`))
      return
    }

    const results = await processor.processFiles(files)
    
    console.log('\n📊 Batch Processing Complete')
    console.log(`Total: ${results.length}`)
    console.log(`Successful: ${results.filter(r => r.success).length}`)
    console.log(`Failed: ${results.filter(r => !r.success).length}`)
  })

program
  .command('watch')
  .description('Watch directory for changes and auto-process')
  .argument('<directory>', 'Directory to watch')
  .option('--ignore-initial', 'Ignore existing files on startup')
  .action(async (directory, options) => {
    const watcher = new FileWatcher(directory, {
      ignoreInitial: options.ignoreInitial
    })

    console.log(`👀 Watching ${directory} for changes...`)
    console.log('Press Ctrl+C to stop')

    process.on('SIGINT', () => {
      watcher.stop()
      process.exit(0)
    })
  })

program
  .command('schedule')
  .description('Schedule recurring batch operations')
  .argument('<directory>', 'Directory to process')
  .option('--daily <time>', 'Daily at specified time (HH:MM)', '09:00')
  .option('--weekly <day>', 'Weekly on specified day (0-6)', '1')
  .action(async (directory, options) => {
    const scheduler = new CrossPostScheduler()

    if (options.daily) {
      const [hour, minute] = options.daily.split(':')
      scheduler.scheduleDaily(`${minute} ${hour}`, directory)
      console.log(`📅 Scheduled daily processing at ${options.daily}`)
    }

    if (options.weekly) {
      const [hour, minute] = options.daily.split(':')
      scheduler.scheduleWeekly(parseInt(options.weekly), `${minute} ${hour}`, directory)
      console.log(`📅 Scheduled weekly processing on day ${options.weekly} at ${options.daily}`)
    }

    console.log('Scheduler running... Press Ctrl+C to stop')
    
    process.on('SIGINT', () => {
      scheduler.stopAll()
      process.exit(0)
    })
  })

program.parse()
```

## Best Practices

### 1. Resource Management
- Implement concurrency limits to avoid overwhelming APIs
- Use memory-efficient streaming for large files
- Implement proper cleanup for long-running processes

### 2. Error Recovery
- Implement retry logic with exponential backoff
- Queue failed jobs for later processing
- Provide detailed error reporting and recovery options

### 3. Monitoring
- Track processing rates and success metrics
- Implement health checks for long-running processes
- Provide real-time progress updates

### 4. Performance
- Use caching for repeated operations
- Batch similar operations together
- Implement rate limiting to respect API limits

### 5. Scalability
- Design for horizontal scaling with queue systems
- Implement distributed processing for large datasets
- Use persistent storage for job queues

## Next Steps

- [Custom Transformers](/guide/advanced/transformers) - Transform content for different platforms
- [Error Handling](/guide/advanced/error-handling) - Handle errors gracefully in batch operations
- [API Reference](/api/) - Complete batch processing API documentation
