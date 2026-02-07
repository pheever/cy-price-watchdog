import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
    status,
  });
}

const successResponse = { data: 'ok', error: null, meta: null };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('api.getStats', () => {
  it('fetches /api/stats', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getStats();

    expect(fetch).toHaveBeenCalledWith('/api/stats');
  });
});

describe('api.getCategories', () => {
  it('fetches /api/categories without parentId', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getCategories();

    expect(fetch).toHaveBeenCalledWith('/api/categories');
  });

  it('fetches with parentId query param', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getCategories('abc-123');

    expect(fetch).toHaveBeenCalledWith('/api/categories?parentId=abc-123');
  });
});

describe('api.getCategory', () => {
  it('fetches /api/categories/:id', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getCategory('cat-1');

    expect(fetch).toHaveBeenCalledWith('/api/categories/cat-1');
  });
});

describe('api.getProducts', () => {
  it('fetches /api/products with no params', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProducts();

    expect(fetch).toHaveBeenCalledWith('/api/products');
  });

  it('fetches with all params', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProducts({
      cursor: 'cur-1',
      limit: 50,
      categoryId: 'cat-2',
      search: 'milk',
    });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('cursor')).toBe('cur-1');
    expect(params.get('limit')).toBe('50');
    expect(params.get('categoryId')).toBe('cat-2');
    expect(params.get('search')).toBe('milk');
  });

  it('omits undefined params', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProducts({ limit: 10 });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('limit')).toBe('10');
    expect(params.has('cursor')).toBe(false);
    expect(params.has('categoryId')).toBe(false);
    expect(params.has('search')).toBe(false);
  });

  it('passes empty object as no query string', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProducts({});

    expect(fetch).toHaveBeenCalledWith('/api/products');
  });
});

describe('api.getProduct', () => {
  it('fetches /api/products/:id', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProduct('prod-1');

    expect(fetch).toHaveBeenCalledWith('/api/products/prod-1');
  });
});

describe('api.getProductPrices', () => {
  it('fetches /api/products/:id/prices with no params', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProductPrices('prod-1');

    expect(fetch).toHaveBeenCalledWith('/api/products/prod-1/prices');
  });

  it('fetches with cursor and limit', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProductPrices('prod-1', { cursor: 'c-1', limit: 25 });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('cursor')).toBe('c-1');
    expect(params.get('limit')).toBe('25');
  });
});

describe('api.getProductStats', () => {
  it('fetches /api/products/:id/stats', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getProductStats('prod-1');

    expect(fetch).toHaveBeenCalledWith('/api/products/prod-1/stats');
  });
});

describe('api.getStores', () => {
  it('fetches /api/stores', async () => {
    globalThis.fetch = mockFetch(successResponse);

    await api.getStores();

    expect(fetch).toHaveBeenCalledWith('/api/stores');
  });
});

describe('fetchApi response handling', () => {
  it('returns parsed JSON response', async () => {
    const mockData = {
      data: { counts: { products: 10 } },
      error: null,
      meta: null,
    };
    globalThis.fetch = mockFetch(mockData);

    const result = await api.getStats();

    expect(result).toEqual(mockData);
  });

  it('returns error response from server', async () => {
    const mockData = {
      data: null,
      error: { code: 'NOT_FOUND', message: 'Not found' },
      meta: null,
    };
    globalThis.fetch = mockFetch(mockData, 404);

    const result = await api.getStats();

    expect(result.error).toEqual({ code: 'NOT_FOUND', message: 'Not found' });
    expect(result.data).toBeNull();
  });
});
