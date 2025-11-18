/**
 * Custom error classes following the error handling pattern from LLMs/error-handling-exception.md
 * Each error includes an HTTP status code and follows the pattern of returning errors as values
 */

/**
 *
 */
export class ForbiddenError extends Error {
  statusCode = 403 as const;

  /**
   *
   */
  constructor(public message = 'Forbidden') {
    super(message);
    this.name = 'Forbidden';
  }
}

/**
 *
 */
export class NotFoundError extends Error {
  message = 'Not found';
  name = 'NotFound';
  statusCode = 404 as const;
}

/**
 *
 */
export class UnauthorizedError extends Error {
  message = 'Unauthorized';
  name = 'Unauthorized';
  statusCode = 401 as const;
}

/**
 *
 */
export class UnexpectedFetchError extends Error {
  message = 'Could not fetch data';
  name = 'UnexpectedFetchError';
  statusCode = 500 as const;
}

/**
 *
 */
export class ValidationError<T> extends Error {
  statusCode = 400 as const;

  /**
   *
   */
  constructor(public errors: T) {
    super('Validation Error');
    this.name = 'ValidationError';
  }
}
