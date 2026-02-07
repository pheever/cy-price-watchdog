import { describe, it, expect } from 'vitest';
import {
  paginationSchema,
  categoryQuerySchema,
  productQuerySchema,
  priceHistorySchema,
  parseSearchParams,
  zodErrorToFields,
} from '@/lib/validation';
import { z } from 'zod';

describe('paginationSchema', () => {
  it('applies defaults when no params given', () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ limit: 20 });
    expect(result.cursor).toBeUndefined();
  });

  it('accepts valid cursor and limit', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const result = paginationSchema.parse({ cursor: uuid, limit: '50' });
    expect(result.cursor).toBe(uuid);
    expect(result.limit).toBe(50);
  });

  it('rejects non-uuid cursor', () => {
    const result = paginationSchema.safeParse({ cursor: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects limit below 1', () => {
    const result = paginationSchema.safeParse({ limit: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects limit above 100', () => {
    const result = paginationSchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('coerces string limit to number', () => {
    const result = paginationSchema.parse({ limit: '42' });
    expect(result.limit).toBe(42);
  });

  it('rejects non-integer limit', () => {
    const result = paginationSchema.safeParse({ limit: '3.5' });
    expect(result.success).toBe(false);
  });
});

describe('categoryQuerySchema', () => {
  it('applies defaults when no params given', () => {
    const result = categoryQuerySchema.parse({});
    expect(result).toEqual({ includeProducts: false });
  });

  it('accepts valid parentId', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const result = categoryQuerySchema.parse({ parentId: uuid });
    expect(result.parentId).toBe(uuid);
  });

  it('rejects non-uuid parentId', () => {
    const result = categoryQuerySchema.safeParse({ parentId: 'bad' });
    expect(result.success).toBe(false);
  });

  it('coerces includeProducts string to boolean', () => {
    expect(categoryQuerySchema.parse({ includeProducts: 'true' }).includeProducts).toBe(true);
    // z.coerce.boolean() uses Boolean(), so any non-empty string (including "false") is true
    expect(categoryQuerySchema.parse({ includeProducts: 'false' }).includeProducts).toBe(true);
    // Only empty string / falsy coerces to false
    expect(categoryQuerySchema.parse({ includeProducts: '' }).includeProducts).toBe(false);
  });
});

describe('productQuerySchema', () => {
  it('inherits pagination defaults', () => {
    const result = productQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it('accepts categoryId and search', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const result = productQuerySchema.parse({
      categoryId: uuid,
      search: 'milk',
    });
    expect(result.categoryId).toBe(uuid);
    expect(result.search).toBe('milk');
  });

  it('rejects non-uuid categoryId', () => {
    const result = productQuerySchema.safeParse({ categoryId: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects empty search string', () => {
    const result = productQuerySchema.safeParse({ search: '' });
    expect(result.success).toBe(false);
  });

  it('rejects search string over 100 chars', () => {
    const result = productQuerySchema.safeParse({ search: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('priceHistorySchema', () => {
  it('inherits pagination defaults', () => {
    const result = priceHistorySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it('accepts storeId', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const result = priceHistorySchema.parse({ storeId: uuid });
    expect(result.storeId).toBe(uuid);
  });

  it('coerces from and to strings to dates', () => {
    const result = priceHistorySchema.parse({
      from: '2025-01-01',
      to: '2025-12-31',
    });
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
  });

  it('rejects invalid date strings', () => {
    const result = priceHistorySchema.safeParse({ from: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});

describe('parseSearchParams', () => {
  it('converts URLSearchParams and validates against schema', () => {
    const params = new URLSearchParams({ limit: '10' });
    const result = parseSearchParams(params, paginationSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('returns error for invalid params', () => {
    const params = new URLSearchParams({ limit: '0' });
    const result = parseSearchParams(params, paginationSchema);
    expect(result.success).toBe(false);
  });

  it('handles empty search params with defaults', () => {
    const params = new URLSearchParams();
    const result = parseSearchParams(params, paginationSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });
});

describe('zodErrorToFields', () => {
  it('converts ZodError issues to field map', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });
    const result = schema.safeParse({ name: '', age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = zodErrorToFields(result.error);
      expect(fields).toHaveProperty('name');
      expect(fields).toHaveProperty('age');
    }
  });

  it('joins nested paths with dots', () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });
    const result = schema.safeParse({ user: { email: 'bad' } });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = zodErrorToFields(result.error);
      expect(fields).toHaveProperty('user.email');
    }
  });
});
