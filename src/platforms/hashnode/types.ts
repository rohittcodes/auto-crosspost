// Hashnode platform-specific types and interfaces

export interface HashnodeConfig {
  token: string;
  publicationId?: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

export interface HashnodePost {
  title: string;
  contentMarkdown: string;
  publicationId: string;
  tags?: HashnodeTagInput[];
  subtitle?: string;
  coverImageURL?: string;
  slug?: string;
  originalArticleURL?: string;
  publishedAt?: string;
  metaTags?: {
    title?: string;
    description?: string;
    image?: string;
  };
  disableComments?: boolean;
  enableTableOfContent?: boolean;
}

export interface HashnodeTagInput {
  slug: string;
  name: string;
}

export interface HashnodeTag {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  tagline?: string;
  info?: {
    text: string;
  };
  postsCount: number;
  followersCount: number;
}

export interface HashnodePublication {
  id: string;
  title: string;
  url: string;
  author: HashnodeUser;
  isTeam: boolean;
  favicon?: string;
  headerColor?: string;
  metaTags?: string;
  preferences: {
    logo?: string;
    darkMode?: {
      logo?: string;
      enabled: boolean;
    };
    navbarItems: Array<{
      id: string;
      type: string;
      label: string;
      url?: string;
    }>;
  };
  posts?: {
    totalDocuments: number;
    edges: Array<{
      node: HashnodeArticle;
    }>;
  };
}

export interface HashnodeUser {
  id: string;
  username: string;
  name: string;
  tagline?: string;
  profilePicture?: string;
  socialMediaLinks?: {
    website?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    stackoverflow?: string;
    linkedin?: string;
    youtube?: string;
  };
  badges?: Array<{
    id: string;
    name: string;
    description?: string;
    image?: string;
  }>;
}

export interface HashnodeArticle {
  id: string;
  title: string;
  subtitle?: string;
  brief: string;
  slug: string;
  url: string;
  publishedAt: string;
  updatedAt?: string;
  coverImage?: {
    url: string;
    attribution?: string;
  };
  content: {
    markdown: string;
    html: string;
    text: string;
  };
  tags: HashnodeTag[];
  author: HashnodeUser;
  publication?: HashnodePublication;
  views: number;
  reactionCount: number;
  responseCount: number;
  featured: boolean;
  featuredAt?: string;
  preferences: {
    disableComments: boolean;
    stickCoverToBottom: boolean;
    isDelisted: boolean;
  };
  seo?: {
    title?: string;
    description?: string;
  };
  canonicalUrl?: string;
}

export interface HashnodeApiError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: {
    code: string;
    exception?: {
      stacktrace: string[];
    };
  };
}

export interface HashnodeGraphQLResponse<T> {
  data?: T;
  errors?: HashnodeApiError[];
}
