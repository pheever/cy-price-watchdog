import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApi } from '@/hooks/useApi';
import type { ApiResponse } from '@/lib/api';

describe('useApi', () => {
  it('starts in loading state', () => {
    const fetcher = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useApi(fetcher));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets data on successful response', async () => {
    const response: ApiResponse<string> = { data: 'hello', error: null, meta: null };
    const fetcher = vi.fn().mockResolvedValue(response);

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe('hello');
    expect(result.current.error).toBeNull();
  });

  it('sets error when response contains error', async () => {
    const response: ApiResponse<null> = {
      data: null,
      error: { code: 'NOT_FOUND', message: 'Product not found' },
      meta: null,
    };
    const fetcher = vi.fn().mockResolvedValue(response);

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Product not found');
  });

  it('sets error when fetcher throws', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('sets generic error when non-Error is thrown', async () => {
    const fetcher = vi.fn().mockRejectedValue('something broke');

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('An error occurred');
  });

  it('refetch re-fetches data', async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(async (): Promise<ApiResponse<string>> => {
      callCount++;
      return { data: `call-${callCount}`, error: null, meta: null };
    });

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe('call-1');

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toBe('call-2');
    });
  });

  it('refetches when deps change', async () => {
    const fetcher1 = vi.fn().mockResolvedValue({ data: 'first', error: null, meta: null });
    const fetcher2 = vi.fn().mockResolvedValue({ data: 'second', error: null, meta: null });

    let dep = 'a';
    const { result, rerender } = renderHook(() =>
      useApi(dep === 'a' ? fetcher1 : fetcher2, [dep])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe('first');

    dep = 'b';
    rerender();

    await waitFor(() => {
      expect(result.current.data).toBe('second');
    });
  });
});
