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

export function success<T>(data: T, meta?: ApiMeta): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    data,
    error: null,
    meta: meta ?? null,
  });
}

export function paginated<T>(
  data: T[],
  options: { cursor?: string; hasNext: boolean; total?: number }
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    data,
    error: null,
    meta: {
      cursor: options.cursor,
      hasNext: options.hasNext,
      total: options.total,
    },
  });
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
