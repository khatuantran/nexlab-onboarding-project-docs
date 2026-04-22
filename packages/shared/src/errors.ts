/**
 * Canonical error codes — single source of truth for BE + FE.
 * Xem .specs/error-codes.md cho HTTP status mapping + semantics.
 */
export const ErrorCode = {
  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMITED: "RATE_LIMITED",
  // Resources
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  PROJECT_SLUG_TAKEN: "PROJECT_SLUG_TAKEN",
  FEATURE_NOT_FOUND: "FEATURE_NOT_FOUND",
  FEATURE_SLUG_TAKEN: "FEATURE_SLUG_TAKEN",
  INVALID_SECTION_TYPE: "INVALID_SECTION_TYPE",
  SECTION_TOO_LARGE: "SECTION_TOO_LARGE",
  // Search
  SEARCH_QUERY_EMPTY: "SEARCH_QUERY_EMPTY",
  SEARCH_QUERY_TOO_LONG: "SEARCH_QUERY_TOO_LONG",
  // Uploads
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  // Cross-cutting
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorShape {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessShape<T> {
  data: T;
}
