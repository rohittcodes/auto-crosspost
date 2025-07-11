# Troubleshooting

Common issues and solutions when using Auto-CrossPost SDK.

## Authentication Issues

### Dev.to API Key Not Working

**Problem**: Getting 401 Unauthorized errors
**Solution**: 
1. Verify your API key is correct
2. Check it's not expired
3. Ensure you have publishing permissions

```bash
# Test your API key
curl -H "api-key: YOUR_API_KEY" https://dev.to/api/articles/me
```

### Hashnode Token Invalid

**Problem**: GraphQL authentication errors
**Solution**:
1. Generate a new Personal Access Token
2. Verify publication ID is correct
3. Check token permissions

## Common Errors

### File Not Found

```
Error: ENOENT: no such file or directory
```

**Solution**: Verify file path is correct and file exists.

### Network Timeouts

**Problem**: Requests timing out
**Solution**: 
1. Check internet connection
2. Retry with exponential backoff
3. Use smaller batch sizes

### Rate Limiting

**Problem**: Too many requests error
**Solution**:
1. Implement delays between posts
2. Use batch processing with limits
3. Check platform rate limit documentation

## Configuration Issues

### Invalid Frontmatter

**Problem**: Markdown parsing errors
**Solution**: Ensure valid YAML frontmatter:

```yaml
---
title: "Your Title"
tags: ["tag1", "tag2"]
published: true
---
```

### Missing Required Fields

**Problem**: Platform rejecting posts
**Solution**: Check required fields for each platform:

- **Dev.to**: title, body_markdown
- **Hashnode**: title, contentMarkdown

## Performance Issues

### Slow Processing

**Solutions**:
1. Use concurrent processing
2. Implement caching
3. Optimize image uploads

### Memory Usage

**Solutions**:
1. Process files in batches
2. Stream large files
3. Clean up temporary files

## Getting Help

1. Check the [Configuration Guide](/guide/configuration)
2. Review [Platform Setup](/guide/platforms/)
3. [Open an issue](https://github.com/rohittcodes/auto-crosspost/issues) on GitHub

## Debug Mode

Enable debug logging:

```typescript
const crosspost = new AutoCrosspost({
  debug: true,
  // ... other config
});
```

Or via CLI:

```bash
crosspost post article.md --debug
```
