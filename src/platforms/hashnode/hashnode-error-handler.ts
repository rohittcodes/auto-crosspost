import {
  AuthenticationError,
  PlatformError,
  ValidationError
} from '../../core/types.ts';

/**
 * Handles Hashnode-specific error transformation and mapping
 */
export class HashnodeErrorHandler {

  /**
   * Transform various error types to appropriate platform errors
   */
  static transformError(error: any): Error {
    // Handle GraphQL errors
    if (error.response && error.response.errors) {
      const gqlErrors = error.response.errors;
      const firstError = gqlErrors[0];

      if (firstError.extensions?.code === 'UNAUTHENTICATED') {
        return new AuthenticationError('Invalid Hashnode token');
      }

      if (firstError.extensions?.code === 'FORBIDDEN') {
        return new AuthenticationError('Hashnode access forbidden');
      }

      if (firstError.extensions?.code === 'BAD_USER_INPUT') {
        return new ValidationError(`Hashnode validation error: ${ firstError.message }`);
      }

      return new PlatformError(
        `Hashnode GraphQL error: ${ firstError.message }`,
        'GRAPHQL_ERROR',
        'Hashnode'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return new PlatformError(
        'Hashnode request timeout',
        'TIMEOUT',
        'Hashnode'
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new PlatformError(
        'Hashnode connection failed',
        'CONNECTION_ERROR',
        'Hashnode'
      );
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      return new PlatformError(
        'Hashnode rate limit exceeded',
        'RATE_LIMIT',
        'Hashnode'
      );
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      return new PlatformError(
        'Hashnode server error',
        'SERVER_ERROR',
        'Hashnode'
      );
    }

    // Default error
    return new PlatformError(
      `Hashnode unexpected error: ${ error.message }`,
      'UNKNOWN',
      'Hashnode'
    );
  }

  /**
   * Check if an error is retryable
   */
  static isRetryableError(error: any): boolean {
    // Don't retry authentication or validation errors
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return false;
    }

    // Retry server errors and timeouts
    if (error instanceof PlatformError) {
      return ['SERVER_ERROR', 'TIMEOUT', 'CONNECTION_ERROR', 'RATE_LIMIT'].includes(error.code || '');
    }

    // Retry HTTP 5xx errors
    if (error.response?.status >= 500) {
      return true;
    }

    // Retry network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return true;
    }

    return false;
  }

  /**
   * Get retry delay for rate limiting
   */
  static getRetryDelay(error: any): number {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        return parseInt(retryAfter) * 1000; // Convert to milliseconds
      }
      return 60000; // Default 1 minute for rate limiting
    }

    return 0; // No specific delay needed
  }
}
