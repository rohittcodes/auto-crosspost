# Next.js Integration

## Setup

Install the Auto-CrossPost SDK in your Next.js project:

```bash
npm install auto-crosspost
```

## API Route Integration

Create an API route for webhook-based posting:

```typescript
// pages/api/crosspost.ts (Pages Router)
// or app/api/crosspost/route.ts (App Router)

import { AutoCrosspost } from 'auto-crosspost';
import { NextApiRequest, NextApiResponse } from 'next';

const crosspost = new AutoCrosspost({
  platforms: {
    devto: {
      apiKey: process.env.DEVTO_API_KEY!
    },
    hashnode: {
      token: process.env.HASHNODE_TOKEN!,
      publication: process.env.HASHNODE_PUBLICATION!
    }
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filePath, platforms } = req.body;
    const result = await crosspost.postFromFile(filePath, { platforms });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Build-time Integration

Cross-post during the build process:

```typescript
// scripts/crosspost-build.ts
import { AutoCrosspost } from 'auto-crosspost';
import { glob } from 'glob';

async function crosspostPosts() {
  const crosspost = new AutoCrosspost(config);
  const posts = await glob('content/posts/*.md');
  
  for (const post of posts) {
    await crosspost.postFromFile(post);
  }
}

crosspostPosts();
```

## Environment Variables

```env
DEVTO_API_KEY=your_devto_api_key
HASHNODE_TOKEN=your_hashnode_token
HASHNODE_PUBLICATION=your_publication_id
```

For more integration examples, see the [main examples](/examples/) page.
