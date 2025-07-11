import { GraphQLClient } from 'graphql-request';
import {
  HashnodePost,
  HashnodeArticle,
  HashnodePublication,
  HashnodeUser
} from './types';

/**
 * Low-level API interface for Hashnode GraphQL operations
 */
export class HashnodeApi {
  private client: GraphQLClient;

  constructor(token: string) {
    this.client = new GraphQLClient('https://gql.hashnode.com', {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
  }

  async getCurrentUser(): Promise<HashnodeUser> {
    const query = `
      query Me {
        me {
          id
          username
          name
        }
      }
    `;

    const response: { me: HashnodeUser } = await this.client.request(query);
    return response.me;
  }

  async createPost(input: HashnodePost): Promise<HashnodeArticle> {
    const mutation = `
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post {
            id
            title
            subtitle
            brief
            slug
            url
            publishedAt
            updatedAt
            coverImage {
              url
            }
            content {
              markdown
            }
            tags {
              id
              name
              slug
            }
            author {
              id
              username
              name
            }
            views
            reactionCount
            responseCount
            canonicalUrl
          }
        }
      }
    `;

    const response = await this.client.request<{ publishPost: { post: HashnodeArticle } }>(
      mutation,
      { input }
    );

    return response.publishPost.post;
  }

  async updatePost(id: string, input: Partial<HashnodePost>): Promise<HashnodeArticle> {
    const mutation = `
      mutation UpdatePost($input: UpdatePostInput!) {
        updatePost(input: $input) {
          post {
            id
            title
            subtitle
            brief
            slug
            url
            publishedAt
            updatedAt
            coverImage {
              url
            }
            content {
              markdown
            }
            tags {
              id
              name
              slug
            }
            author {
              id
              username
              name
            }
            views
            reactionCount
            responseCount
            canonicalUrl
          }
        }
      }
    `;

    const updateInput = {
      id,
      ...input
    };

    const response = await this.client.request<{ updatePost: { post: HashnodeArticle } }>(
      mutation,
      { input: updateInput }
    );

    return response.updatePost.post;
  }

  async getPost(id: string): Promise<HashnodeArticle> {
    const query = `
      query Post($id: ObjectId!) {
        post(id: $id) {
          id
          title
          subtitle
          brief
          slug
          url
          publishedAt
          updatedAt
          coverImage {
            url
          }
          content {
            markdown
          }
          tags {
            id
            name
            slug
          }
          author {
            id
            username
            name
          }
          views
          reactionCount
          responseCount
          canonicalUrl
        }
      }
    `;

    const response = await this.client.request<{ post: HashnodeArticle }>(
      query,
      { id }
    );

    return response.post;
  }

  async deletePost(id: string): Promise<void> {
    const mutation = `
      mutation RemovePost($input: RemovePostInput!) {
        removePost(input: $input) {
          post {
            id
          }
        }
      }
    `;

    await this.client.request(mutation, {
      input: { id }
    });
  }

  async getPublicationPosts(publicationId: string, first: number = 20, after?: string): Promise<HashnodePublication> {
    const query = `
      query Publication($host: String!, $first: Int!, $after: String) {
        publication(host: $host) {
          posts(first: $first, after: $after) {
            totalDocuments
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                title
                subtitle
                brief
                slug
                url
                publishedAt
                updatedAt
                coverImage {
                  url
                }
                content {
                  markdown
                }
                tags {
                  id
                  name
                  slug
                }
                author {
                  id
                  username
                  name
                }
                views
                reactionCount
                responseCount
                canonicalUrl
              }
            }
          }
        }
      }
    `;

    const response = await this.client.request<{ publication: HashnodePublication }>(
      query,
      { 
        host: publicationId,
        first,
        ...(after && { after })
      }
    );

    return response.publication;
  }
}
