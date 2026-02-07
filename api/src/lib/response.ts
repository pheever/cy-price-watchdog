import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiMeta {
  cursor?: string;
  hasNext?: boolean;
  total?: number;
  cached?: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta | null;
}

export interface ResponseOptions {
  cacheSeconds?: number;
}

// 30 minutes default cache
const DEFAULT_CACHE_SECONDS = 30 * 60;

function getCacheHeaders(seconds: number): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
  };
}

export function success<T>(data: T, meta?: ApiMeta, options?: ResponseOptions): NextResponse<ApiResponse<T>> {
  const cacheSeconds = options?.cacheSeconds ?? DEFAULT_CACHE_SECONDS;
  return NextResponse.json(
    {
      data,
      error: null,
      meta: meta ?? null,
    },
    {
      headers: getCacheHeaders(cacheSeconds),
    }
  );
}

export function paginated<T>(
  data: T[],
  options: { cursor?: string; hasNext: boolean; total?: number },
  responseOptions?: ResponseOptions
): NextResponse<ApiResponse<T[]>> {
  const cacheSeconds = responseOptions?.cacheSeconds ?? DEFAULT_CACHE_SECONDS;
  return NextResponse.json(
    {
      data,
      error: null,
      meta: {
        cursor: options.cursor,
        hasNext: options.hasNext,
        total: options.total,
      },
    },
    {
      headers: getCacheHeaders(cacheSeconds),
    }
  );
}

export function error(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      data: null,
      error: { code, message, fields },
      meta: null,
    },
    { status }
  );
}

export const errors = {
  notFound: (resource: string) =>
    error('NOT_FOUND', `${resource} not found`, 404),

  badRequest: (message: string, fields?: Record<string, string>) =>
    error('BAD_REQUEST', message, 400, fields),

  validation: (fields: Record<string, string>) =>
    error('VALIDATION_ERROR', 'Validation failed', 400, fields),

  internal: (message = 'Internal server error') =>
    error('INTERNAL_ERROR', message, 500),

  rateLimit: () =>
    error('RATE_LIMIT', 'Too many requests', 429),
};
