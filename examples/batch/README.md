# Batch Processing Examples

This directory contains examples of how to use the Auto-CrossPost SDK's batch processing features.

## Examples

- `basic-batch.js` - Simple batch processing of multiple files
- `queue-system.js` - Using the job queue for complex workflows
- `file-watcher.js` - Automatically process files when they change
- `scheduler.js` - Schedule recurring batch operations
- `advanced-batch.js` - Advanced batch processing with progress tracking

## Running Examples

Make sure you have the SDK built and configured:

```bash
npm run build
```

Set up your configuration file (`crosspost.config.json`):

```json
{
  "platforms": {
    "devto": {
      "apiKey": "your-devto-api-key"
    },
    "hashnode": {
      "accessToken": "your-hashnode-token",
      "publicationId": "your-publication-id"
    }
  }
}
```

Then run any example:

```bash
node examples/basic-batch.js
```
