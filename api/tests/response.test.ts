import { describe, it, expect } from 'vitest';
import { success, paginated, error, errors } from '@/lib/response';

describe('success', () => {
  it('returns data with default cache headers', async () => {
    const resp = success({ id: 1, name: 'test' });

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.data).toEqual({ id: 1, name: 'test' });
    expect(body.error).toBeNull();
    expect(body.meta).toBeNull();

    const cacheControl = resp.headers.get('Cache-Control');
    expect(cacheControl).toContain('s-maxage=1800');
    expect(cacheControl).toContain('stale-while-revalidate=3600');
  });

  it('includes meta when provided', async () => {
    const resp = success('data', { cursor: 'abc', hasNext: true });
    const body = await resp.json();
    expect(body.meta).toEqual({ cursor: 'abc', hasNext: true });
  });

  it('uses custom cache seconds', () => {
    const resp = success('data', undefined, { cacheSeconds: 60 });
    const cacheControl = resp.headers.get('Cache-Control');
    expect(cacheControl).toContain('s-maxage=60');
    expect(cacheControl).toContain('stale-while-revalidate=120');
  });
});

describe('paginated', () => {
  it('returns array data with pagination meta', async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const resp = paginated(items, { hasNext: true, cursor: 'next-id' });

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.data).toEqual(items);
    expect(body.error).toBeNull();
    expect(body.meta).toEqual({
      cursor: 'next-id',
      hasNext: true,
    });
  });

  it('handles last page with no cursor', async () => {
    const resp = paginated([{ id: 3 }], { hasNext: false });
    const body = await resp.json();
    expect(body.meta?.hasNext).toBe(false);
  });

  it('includes total when provided', async () => {
    const resp = paginated([], { hasNext: false, total: 42 });
    const body = await resp.json();
    expect(body.meta?.total).toBe(42);
  });

  it('uses default cache headers', () => {
    const resp = paginated([], { hasNext: false });
    expect(resp.headers.get('Cache-Control')).toContain('s-maxage=1800');
  });

  it('uses custom cache seconds', () => {
    const resp = paginated([], { hasNext: false }, { cacheSeconds: 10 });
    expect(resp.headers.get('Cache-Control')).toContain('s-maxage=10');
  });
});

describe('error', () => {
  it('returns error body with status code', async () => {
    const resp = error('CUSTOM_ERROR', 'Something went wrong', 418);

    expect(resp.status).toBe(418);
    const body = await resp.json();
    expect(body.data).toBeNull();
    expect(body.meta).toBeNull();
    expect(body.error).toEqual({
      code: 'CUSTOM_ERROR',
      message: 'Something went wrong',
    });
  });

  it('includes field errors when provided', async () => {
    const resp = error('BAD', 'Invalid', 400, { name: 'required' });
    const body = await resp.json();
    expect(body.error?.fields).toEqual({ name: 'required' });
  });
});

describe('errors helpers', () => {
  it('notFound returns 404', async () => {
    const resp = errors.notFound('Product');
    expect(resp.status).toBe(404);
    const body = await resp.json();
    expect(body.error?.code).toBe('NOT_FOUND');
    expect(body.error?.message).toBe('Product not found');
  });

  it('badRequest returns 400', async () => {
    const resp = errors.badRequest('Invalid input');
    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.error?.code).toBe('BAD_REQUEST');
    expect(body.error?.message).toBe('Invalid input');
  });

  it('badRequest includes fields', async () => {
    const resp = errors.badRequest('Invalid', { field: 'msg' });
    const body = await resp.json();
    expect(body.error?.fields).toEqual({ field: 'msg' });
  });

  it('validation returns 400 with fields', async () => {
    const resp = errors.validation({ email: 'invalid email' });
    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.error?.code).toBe('VALIDATION_ERROR');
    expect(body.error?.message).toBe('Validation failed');
    expect(body.error?.fields).toEqual({ email: 'invalid email' });
  });

  it('internal returns 500 with default message', async () => {
    const resp = errors.internal();
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.error?.code).toBe('INTERNAL_ERROR');
    expect(body.error?.message).toBe('Internal server error');
  });

  it('internal accepts custom message', async () => {
    const resp = errors.internal('DB down');
    const body = await resp.json();
    expect(body.error?.message).toBe('DB down');
  });

  it('rateLimit returns 429', async () => {
    const resp = errors.rateLimit();
    expect(resp.status).toBe(429);
    const body = await resp.json();
    expect(body.error?.code).toBe('RATE_LIMIT');
    expect(body.error?.message).toBe('Too many requests');
  });
});
