# Error Handling

Comprehensive guide to handling errors, implementing retry logic, and building resilient cross-posting applications.

## Overview

Robust error handling is crucial for reliable cross-posting operations. This guide covers:

- Understanding different error types
- Implementing retry strategies
- Graceful degradation
- Monitoring and alerting
- Recovery patterns

## Error Types

### Authentication Errors

Authentication failures occur when API credentials are invalid or expired:

```typescript
import { CrossPostError } from 'auto-crosspost'

try {
  const result = await sdk.postToPlatform('devto', post)
} catch (error) {
  if (error instanceof CrossPostError && error.code === 'AUTH_INVALID_API_KEY') {
    console.error('Invalid Dev.to API key')
    // Handle credential renewal
    await renewCredentials('devto')
    // Retry operation
  }
}
```

**Common authentication error codes:**
- `AUTH_INVALID_API_KEY` - Invalid or malformed API key
- `AUTH_TOKEN_EXPIRED` - Authentication token has expired
- `AUTH_INSUFFICIENT_PERMISSIONS` - Insufficient permissions for operation
- `AUTH_RATE_LIMITED` - Authentication rate limit exceeded

### Validation Errors

Content validation failures occur when post data doesn't meet platform requirements:

```typescript
try {
  const result = await sdk.postToAll(post)
} catch (error) {
  switch (error.code) {
    case 'VALIDATION_MISSING_TITLE':
      console.error('Post title is required')
      break
    case 'VALIDATION_INVALID_TAGS':
      console.error('Invalid tags format or count')
      break
    case 'VALIDATION_CONTENT_TOO_LONG':
      console.error('Content exceeds platform limits')
      break
  }
}
```

**Common validation error codes:**
- `VALIDATION_MISSING_TITLE` - Post title is missing or empty
- `VALIDATION_MISSING_CONTENT` - Post content is missing or empty
- `VALIDATION_INVALID_TAGS` - Tags format or count is invalid
- `VALIDATION_CONTENT_TOO_LONG` - Content exceeds platform character limits
- `VALIDATION_INVALID_URL` - Canonical URL format is invalid

### Network Errors

Network-related failures including timeouts and connectivity issues:

```typescript
import { NetworkError } from 'auto-crosspost'

try {
  const result = await sdk.postToPlatform('hashnode', post)
} catch (error) {
  if (error instanceof NetworkError) {
    if (error.retryable) {
      console.log('Network error - retrying...')
      await retryWithBackoff(() => sdk.postToPlatform('hashnode', post))
    } else {
      console.error('Permanent network failure:', error.message)
    }
  }
}
```

**Network error codes:**
- `NETWORK_CONNECTION_ERROR` - Unable to connect to platform
- `NETWORK_TIMEOUT` - Request timed out
- `NETWORK_DNS_ERROR` - DNS resolution failed
- `NETWORK_SSL_ERROR` - SSL/TLS handshake failed

### Platform Errors

Platform-specific API errors:

```typescript
try {
  const result = await sdk.postToPlatform('devto', post)
} catch (error) {
  if (error.code === 'PLATFORM_RATE_LIMITED') {
    const retryAfter = error.retryAfter || 60
    console.log(`Rate limited. Retrying after ${retryAfter} seconds`)
    await delay(retryAfter * 1000)
    // Retry operation
  }
}
```

**Platform error codes:**
- `PLATFORM_API_ERROR` - General platform API error
- `PLATFORM_RATE_LIMITED` - Rate limit exceeded
- `PLATFORM_MAINTENANCE` - Platform under maintenance
- `PLATFORM_POST_NOT_FOUND` - Post not found on platform
- `PLATFORM_DUPLICATE_CONTENT` - Duplicate content detected

## Error Handling Strategies

### Basic Try-Catch Pattern

```typescript
async function basicErrorHandling() {
  try {
    const results = await sdk.postToAll({
      title: "My Article",
      content: "Article content...",
      publishStatus: "published"
    })

    // Process successful results
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ Posted to ${result.platform}: ${result.platformPost?.url}`)
      } else {
        console.error(`❌ Failed to post to ${result.platform}: ${result.error?.message}`)
      }
    })

  } catch (error) {
    console.error('Cross-posting failed:', error.message)
    
    // Log error for monitoring
    logger.error('Cross-post error', {
      error: error.message,
      code: error.code,
      stack: error.stack
    })
    
    // Notify user or take corrective action
    await notifyUser('Cross-posting failed. Please try again later.')
  }
}
```

### Result-Based Error Handling

Handle errors per platform using result objects:

```typescript
async function resultBasedErrorHandling() {
  const results = await sdk.postToAll(post)
  
  const successful: string[] = []
  const failed: Array<{ platform: string, error: any }> = []

  results.forEach(result => {
    if (result.success) {
      successful.push(result.platform)
      console.log(`✅ ${result.platform}: ${result.platformPost?.url}`)
    } else {
      failed.push({ platform: result.platform, error: result.error })
      console.error(`❌ ${result.platform}: ${result.error?.message}`)
    }
  })

  // Handle partial failures
  if (failed.length > 0 && successful.length > 0) {
    console.log(`Partial success: ${successful.length}/${results.length} platforms`)
    
    // Retry failed platforms
    for (const failure of failed) {
      if (failure.error?.retryable) {
        await retryPlatform(failure.platform, post)
      }
    }
  }

  return { successful, failed }
}
```

### Comprehensive Error Handler

```typescript
class CrossPostErrorHandler {
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }

  async handleError(error: any, context: ErrorContext): Promise<ErrorHandlingResult> {
    const errorInfo = this.classifyError(error)
    
    switch (errorInfo.category) {
      case 'authentication':
        return this.handleAuthError(error, context)
      
      case 'validation':
        return this.handleValidationError(error, context)
      
      case 'network':
        return this.handleNetworkError(error, context)
      
      case 'platform':
        return this.handlePlatformError(error, context)
      
      case 'rate_limit':
        return this.handleRateLimitError(error, context)
      
      default:
        return this.handleUnknownError(error, context)
    }
  }

  private classifyError(error: any): ErrorClassification {
    if (error.code?.startsWith('AUTH_')) {
      return { category: 'authentication', severity: 'high', retryable: false }
    }
    
    if (error.code?.startsWith('VALIDATION_')) {
      return { category: 'validation', severity: 'medium', retryable: false }
    }
    
    if (error.code?.startsWith('NETWORK_')) {
      return { category: 'network', severity: 'medium', retryable: true }
    }
    
    if (error.code === 'PLATFORM_RATE_LIMITED') {
      return { category: 'rate_limit', severity: 'low', retryable: true }
    }
    
    return { category: 'unknown', severity: 'high', retryable: false }
  }

  private async handleAuthError(error: any, context: ErrorContext): Promise<ErrorHandlingResult> {
    // Log authentication failure
    logger.error('Authentication failed', {
      platform: context.platform,
      code: error.code,
      message: error.message
    })

    // Attempt credential refresh if possible
    if (context.platform && this.canRefreshCredentials(context.platform)) {
      try {
        await this.refreshCredentials(context.platform)
        return {
          action: 'retry',
          delay: 0,
          message: 'Credentials refreshed, retrying...'
        }
      } catch (refreshError) {
        return {
          action: 'fail',
          message: 'Failed to refresh credentials',
          requiresManualIntervention: true
        }
      }
    }

    return {
      action: 'fail',
      message: 'Authentication failed - check API credentials',
      requiresManualIntervention: true
    }
  }

  private async handleValidationError(error: any, context: ErrorContext): Promise<ErrorHandlingResult> {
    // Validation errors are usually not retryable
    logger.warn('Validation failed', {
      platform: context.platform,
      code: error.code,
      post: context.post?.title
    })

    // Attempt auto-correction for some validation errors
    if (error.code === 'VALIDATION_INVALID_TAGS' && context.post) {
      const correctedPost = this.autoCorrectTags(context.post, context.platform)
      if (correctedPost) {
        return {
          action: 'retry',
          delay: 0,
          correctedPost,
          message: 'Auto-corrected tags, retrying...'
        }
      }
    }

    return {
      action: 'fail',
      message: `Validation failed: ${error.message}`,
      requiresManualIntervention: true
    }
  }

  private async handleNetworkError(error: any, context: ErrorContext): Promise<ErrorHandlingResult> {
    const retryCount = context.retryCount || 0
    
    if (retryCount >= this.retryConfig.maxRetries) {
      return {
        action: 'fail',
        message: 'Maximum retry attempts exceeded'
      }
    }

    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelay
    )

    logger.info('Network error - retrying', {
      platform: context.platform,
      retryCount,
      delay
    })

    return {
      action: 'retry',
      delay,
      message: `Network error - retrying in ${delay}ms`
    }
  }

  private async handleRateLimitError(error: any, context: ErrorContext): Promise<ErrorHandlingResult> {
    const retryAfter = error.retryAfter || 60
    const delay = retryAfter * 1000

    logger.info('Rate limited - backing off', {
      platform: context.platform,
      retryAfter
    })

    return {
      action: 'retry',
      delay,
      message: `Rate limited - retrying after ${retryAfter}s`
    }
  }

  private autoCorrectTags(post: any, platform: string): any | null {
    const platformLimits = {
      devto: { maxTags: 4 },
      hashnode: { maxTags: 10 }
    }

    const limit = platformLimits[platform]?.maxTags
    if (!limit || !post.tags || post.tags.length <= limit) {
      return null
    }

    return {
      ...post,
      tags: post.tags.slice(0, limit)
    }
  }
}

interface ErrorContext {
  platform?: string
  post?: any
  retryCount?: number
  operation?: string
}

interface ErrorClassification {
  category: 'authentication' | 'validation' | 'network' | 'platform' | 'rate_limit' | 'unknown'
  severity: 'low' | 'medium' | 'high'
  retryable: boolean
}

interface ErrorHandlingResult {
  action: 'retry' | 'fail' | 'skip'
  delay?: number
  message: string
  correctedPost?: any
  requiresManualIntervention?: boolean
}
```

## Retry Strategies

### Exponential Backoff

```typescript
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryCondition = (error) => error.retryable !== false
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry if not retryable or on final attempt
      if (!retryCondition(error) || attempt === maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      )

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay
      const totalDelay = delay + jitter

      console.log(`Attempt ${attempt + 1} failed, retrying in ${Math.round(totalDelay)}ms`)
      await new Promise(resolve => setTimeout(resolve, totalDelay))
    }
  }

  throw lastError
}

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: any) => boolean
}
```

### Platform-Specific Retry Logic

```typescript
class PlatformRetryManager {
  private retryConfigs = {
    devto: {
      maxRetries: 5,
      baseDelay: 2000,
      rateLimitBackoff: 60000,
      retryableErrors: ['NETWORK_TIMEOUT', 'PLATFORM_API_ERROR']
    },
    hashnode: {
      maxRetries: 3,
      baseDelay: 1000,
      rateLimitBackoff: 30000,
      retryableErrors: ['NETWORK_TIMEOUT', 'PLATFORM_RATE_LIMITED']
    }
  }

  async retryPlatformOperation(
    platform: string,
    operation: () => Promise<any>
  ): Promise<any> {
    const config = this.retryConfigs[platform]
    if (!config) {
      throw new Error(`No retry config for platform: ${platform}`)
    }

    return retryWithExponentialBackoff(operation, {
      maxRetries: config.maxRetries,
      baseDelay: config.baseDelay,
      retryCondition: (error) => {
        // Platform-specific retry logic
        if (error.code === 'PLATFORM_RATE_LIMITED') {
          return true // Always retry rate limits
        }
        
        return config.retryableErrors.includes(error.code)
      }
    })
  }
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold = 5,
    private timeout = 60000,
    private resetTimeout = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'open'
      setTimeout(() => {
        this.state = 'half-open'
      }, this.resetTimeout)
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Usage with SDK
const devtoCircuitBreaker = new CircuitBreaker(3, 30000, 60000)

async function postToDevToWithCircuitBreaker(post: Post) {
  return devtoCircuitBreaker.execute(async () => {
    return sdk.postToPlatform('devto', post)
  })
}
```

## Graceful Degradation

### Partial Failure Handling

```typescript
async function crossPostWithGracefulDegradation(post: Post) {
  const results = await sdk.postToAll(post)
  
  const successfulPlatforms = results.filter(r => r.success)
  const failedPlatforms = results.filter(r => !r.success)

  if (successfulPlatforms.length === 0) {
    throw new Error('Failed to post to any platform')
  }

  if (failedPlatforms.length > 0) {
    console.warn(`Partial failure: ${failedPlatforms.length} platforms failed`)
    
    // Queue failed platforms for retry
    await queueFailedPosts(failedPlatforms, post)
    
    // Notify about partial success
    await sendPartialSuccessNotification(successfulPlatforms, failedPlatforms)
  }

  return {
    successful: successfulPlatforms,
    failed: failedPlatforms,
    totalSuccess: successfulPlatforms.length === results.length
  }
}
```

### Fallback Strategies

```typescript
class FallbackManager {
  private fallbackChain: string[] = ['devto', 'hashnode', 'local-storage']

  async postWithFallback(post: Post): Promise<any> {
    let lastError: any

    for (const platform of this.fallbackChain) {
      try {
        if (platform === 'local-storage') {
          return this.saveToLocalStorage(post)
        }

        const result = await sdk.postToPlatform(platform, post)
        if (result.success) {
          return result
        }
      } catch (error) {
        lastError = error
        console.warn(`Failed to post to ${platform}:`, error.message)
      }
    }

    throw new Error(`All platforms failed. Last error: ${lastError?.message}`)
  }

  private async saveToLocalStorage(post: Post): Promise<any> {
    const drafts = JSON.parse(localStorage.getItem('crosspost-drafts') || '[]')
    drafts.push({
      ...post,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    })
    localStorage.setItem('crosspost-drafts', JSON.stringify(drafts))
    
    return {
      success: true,
      platform: 'local-storage',
      message: 'Saved to local storage for later posting'
    }
  }
}
```

## Monitoring and Alerting

### Error Metrics Collection

```typescript
class ErrorMetrics {
  private metrics = {
    totalErrors: 0,
    errorsByPlatform: new Map<string, number>(),
    errorsByType: new Map<string, number>(),
    errorsByHour: new Map<string, number>()
  }

  recordError(error: any, platform?: string) {
    this.metrics.totalErrors++

    if (platform) {
      const platformErrors = this.metrics.errorsByPlatform.get(platform) || 0
      this.metrics.errorsByPlatform.set(platform, platformErrors + 1)
    }

    if (error.code) {
      const typeErrors = this.metrics.errorsByType.get(error.code) || 0
      this.metrics.errorsByType.set(error.code, typeErrors + 1)
    }

    const hour = new Date().getHours().toString()
    const hourErrors = this.metrics.errorsByHour.get(hour) || 0
    this.metrics.errorsByHour.set(hour, hourErrors + 1)
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorsByPlatform: Object.fromEntries(this.metrics.errorsByPlatform),
      errorsByType: Object.fromEntries(this.metrics.errorsByType),
      errorsByHour: Object.fromEntries(this.metrics.errorsByHour)
    }
  }

  reset() {
    this.metrics = {
      totalErrors: 0,
      errorsByPlatform: new Map(),
      errorsByType: new Map(),
      errorsByHour: new Map()
    }
  }
}
```

### Health Checks

```typescript
class PlatformHealthChecker {
  private healthStatus = new Map<string, HealthStatus>()

  async checkPlatformHealth(platform: string): Promise<HealthStatus> {
    try {
      const start = Date.now()
      
      // Simple health check - try to authenticate
      const isHealthy = await this.performHealthCheck(platform)
      const responseTime = Date.now() - start

      const status: HealthStatus = {
        platform,
        healthy: isHealthy,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: isHealthy ? 0 : this.getConsecutiveFailures(platform) + 1
      }

      this.healthStatus.set(platform, status)
      return status
    } catch (error) {
      const status: HealthStatus = {
        platform,
        healthy: false,
        responseTime: -1,
        lastCheck: new Date(),
        consecutiveFailures: this.getConsecutiveFailures(platform) + 1,
        error: error.message
      }

      this.healthStatus.set(platform, status)
      return status
    }
  }

  private async performHealthCheck(platform: string): Promise<boolean> {
    try {
      // Platform-specific health checks
      switch (platform) {
        case 'devto':
          const response = await fetch('https://dev.to/api/articles/me', {
            headers: { 'api-key': process.env.DEVTO_API_KEY! }
          })
          return response.ok
        
        case 'hashnode':
          // GraphQL health check query
          const healthQuery = `query { me { id } }`
          const result = await this.executeGraphQLQuery(healthQuery)
          return !result.errors
        
        default:
          return false
      }
    } catch {
      return false
    }
  }

  getOverallHealth(): OverallHealth {
    const statuses = Array.from(this.healthStatus.values())
    const healthy = statuses.filter(s => s.healthy).length
    const total = statuses.length

    return {
      overall: healthy === total ? 'healthy' : healthy > 0 ? 'degraded' : 'unhealthy',
      platforms: Object.fromEntries(this.healthStatus),
      healthyCount: healthy,
      totalCount: total
    }
  }
}

interface HealthStatus {
  platform: string
  healthy: boolean
  responseTime: number
  lastCheck: Date
  consecutiveFailures: number
  error?: string
}

interface OverallHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  platforms: Record<string, HealthStatus>
  healthyCount: number
  totalCount: number
}
```

### Alert System

```typescript
class AlertManager {
  private alertChannels: AlertChannel[] = []

  addChannel(channel: AlertChannel) {
    this.alertChannels.push(channel)
  }

  async sendAlert(alert: Alert) {
    const promises = this.alertChannels.map(channel => 
      channel.send(alert).catch(error => 
        console.error(`Failed to send alert via ${channel.name}:`, error)
      )
    )

    await Promise.allSettled(promises)
  }

  async checkForAlerts(metrics: any, health: OverallHealth) {
    const alerts: Alert[] = []

    // High error rate
    if (metrics.totalErrors > 10) {
      alerts.push({
        level: 'warning',
        title: 'High Error Rate',
        message: `${metrics.totalErrors} errors in the last hour`,
        timestamp: new Date()
      })
    }

    // Platform degradation
    if (health.overall === 'degraded') {
      alerts.push({
        level: 'warning',
        title: 'Platform Degradation',
        message: `${health.totalCount - health.healthyCount} platforms are unhealthy`,
        timestamp: new Date()
      })
    }

    // Complete failure
    if (health.overall === 'unhealthy') {
      alerts.push({
        level: 'critical',
        title: 'All Platforms Down',
        message: 'All platforms are currently unhealthy',
        timestamp: new Date()
      })
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert)
    }

    return alerts
  }
}

interface Alert {
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: Date
}

interface AlertChannel {
  name: string
  send(alert: Alert): Promise<void>
}

// Email alert channel
class EmailAlertChannel implements AlertChannel {
  readonly name = 'email'

  constructor(private emailService: any) {}

  async send(alert: Alert): Promise<void> {
    await this.emailService.send({
      to: 'admin@example.com',
      subject: `[${alert.level.toUpperCase()}] ${alert.title}`,
      body: `${alert.message}\n\nTime: ${alert.timestamp.toISOString()}`
    })
  }
}

// Slack alert channel
class SlackAlertChannel implements AlertChannel {
  readonly name = 'slack'

  constructor(private webhookUrl: string) {}

  async send(alert: Alert): Promise<void> {
    const color = {
      info: '#36a64f',
      warning: '#ff9f00',
      critical: '#ff0000'
    }[alert.level]

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: alert.title,
          text: alert.message,
          timestamp: Math.floor(alert.timestamp.getTime() / 1000)
        }]
      })
    })
  }
}
```

## Recovery Patterns

### Automatic Recovery

```typescript
class AutoRecoveryManager {
  private recoveryQueue = new Map<string, RecoveryJob>()

  async scheduleRecovery(failedOperation: FailedOperation) {
    const jobId = `${failedOperation.platform}-${Date.now()}`
    
    const job: RecoveryJob = {
      id: jobId,
      operation: failedOperation,
      attempts: 0,
      maxAttempts: 5,
      nextRetry: Date.now() + this.calculateDelay(0),
      createdAt: new Date()
    }

    this.recoveryQueue.set(jobId, job)
    console.log(`Scheduled recovery job ${jobId}`)
  }

  async processRecoveryQueue() {
    const now = Date.now()
    const readyJobs = Array.from(this.recoveryQueue.values())
      .filter(job => job.nextRetry <= now)

    for (const job of readyJobs) {
      try {
        await this.executeRecoveryJob(job)
        this.recoveryQueue.delete(job.id)
        console.log(`Recovery job ${job.id} completed successfully`)
      } catch (error) {
        await this.handleRecoveryFailure(job, error)
      }
    }
  }

  private async executeRecoveryJob(job: RecoveryJob) {
    const { operation } = job
    
    switch (operation.type) {
      case 'post':
        return sdk.postToPlatform(operation.platform, operation.data)
      case 'update':
        return sdk.updatePost(operation.platform, operation.platformId, operation.data)
      case 'delete':
        return sdk.deletePost(operation.platform, operation.platformId)
      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
  }

  private async handleRecoveryFailure(job: RecoveryJob, error: any) {
    job.attempts++

    if (job.attempts >= job.maxAttempts) {
      console.error(`Recovery job ${job.id} exceeded max attempts`)
      this.recoveryQueue.delete(job.id)
      await this.notifyManualIntervention(job, error)
    } else {
      job.nextRetry = Date.now() + this.calculateDelay(job.attempts)
      console.log(`Recovery job ${job.id} failed, retrying at ${new Date(job.nextRetry)}`)
    }
  }

  private calculateDelay(attempts: number): number {
    return Math.min(1000 * Math.pow(2, attempts), 60000) // Cap at 1 minute
  }
}

interface RecoveryJob {
  id: string
  operation: FailedOperation
  attempts: number
  maxAttempts: number
  nextRetry: number
  createdAt: Date
}

interface FailedOperation {
  type: 'post' | 'update' | 'delete'
  platform: string
  data?: any
  platformId?: string
}
```

## Best Practices Summary

### 1. Error Classification
- Always classify errors by type and severity
- Implement appropriate retry logic for each error type
- Use structured error codes for programmatic handling

### 2. Retry Strategy
- Use exponential backoff with jitter
- Implement maximum retry limits
- Respect platform-specific rate limits

### 3. Monitoring
- Collect error metrics and trends
- Implement health checks for all platforms
- Set up alerting for critical failures

### 4. Graceful Degradation
- Handle partial failures gracefully
- Implement fallback mechanisms
- Provide user feedback on operation status

### 5. Recovery
- Implement automatic recovery for retryable errors
- Queue failed operations for later retry
- Provide manual intervention paths for non-retryable errors

## Next Steps

- [Batch Processing](/guide/advanced/batch-processing) - Handle multiple posts efficiently
- [Custom Transformers](/guide/advanced/transformers) - Transform content for different platforms
- [API Reference](/api/) - Complete error handling API documentation
