import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '../lib/api';

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[] = []
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetcher();
      if (response.error) {
        setState({ data: null, error: response.error.message, loading: false });
      } else {
        setState({ data: response.data, error: null, loading: false });
      }
    } catch (err) {
      setState({
        data: null,
        error: err instanceof Error ? err.message : 'An error occurred',
        loading: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
