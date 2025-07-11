// Dev.to platform-specific types and interfaces

export interface DevToConfig {
  apiKey: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

export interface DevToPost {
  title: string;
  body_markdown: string;
  published: boolean;
  description?: string;
  tags?: string;
  canonical_url?: string;
  main_image?: string;
  organization_id?: number;
}

export interface DevToArticle {
  id: number;
  title: string;
  description: string;
  body_markdown?: string;
  published: boolean;
  published_at?: string;
  edited_at?: string;
  url: string;
  canonical_url?: string;
  cover_image?: string;
  tag_list: string[];
  page_views_count?: number;
  positive_reactions_count?: number;
  comments_count?: number;
  user: {
    username: string;
    name: string;
    profile_image: string;
  };
  organization?: {
    name: string;
    username: string;
    slug: string;
  };
}

export interface DevToUser {
  id: number;
  username: string;
  name: string;
  summary?: string;
  twitter_username?: string;
  github_username?: string;
  website_url?: string;
  location?: string;
  profile_image: string;
}

export interface DevToApiError {
  error: string;
  status: number;
}
