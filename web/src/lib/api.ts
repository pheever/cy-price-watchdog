const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { cursor?: string; hasNext?: boolean; total?: number } | null;
}

export interface Category {
  id: string;
  externalId: number;
  code: string;
  name: string;
  nameEnglish: string;
  parentId: string | null;
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

export interface Product {
  id: string;
  externalId: number;
  code: string;
  name: string;
  nameEnglish: string;
  unit: string | null;
  categoryId: string;
  category?: Category;
  prices?: Price[];
}

export interface Store {
  id: string;
  externalId: number;
  name: string;
  nameEnglish: string | null;
  chain: string | null;
}

export interface Price {
  id: string;
  productId: string;
  storeId: string;
  price: string;
  scrapedAt: string;
  store?: Store;
}

export interface Stats {
  counts: {
    categories: number;
    products: number;
    stores: number;
    priceRecords: number;
  };
  lastScrapedAt: string | null;
  priceRange: {
    min: string | null;
    max: string | null;
    avg: string | null;
  };
}

export interface StoreStats {
  storeId: string;
  storeName: string;
  storeChain: string | null;
  current: number;
  min: number;
  max: number;
  avg: number;
  priceCount: number;
}

export interface DistrictStats {
  district: string;
  min: number;
  max: number;
  avg: number;
  storeCount: number;
}

export interface ProductStats {
  current: {
    min: number | null;
    max: number | null;
    avg: number | null;
    storeCount: number;
    scrapedAt: string;
  } | null;
  byStore: StoreStats[];
  byDistrict: DistrictStats[];
}

async function fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  return response.json() as Promise<ApiResponse<T>>;
}

export const api = {
  getStats: () => fetchApi<Stats>('/stats'),
  getCategories: (parentId?: string) =>
    fetchApi<Category[]>(`/categories${parentId ? `?parentId=${parentId}` : ''}`),
  getCategory: (id: string) => fetchApi<Category>(`/categories/${id}`),
  getProducts: (params?: { cursor?: string; limit?: number; categoryId?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchApi<Product[]>(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id: string) => fetchApi<Product>(`/products/${id}`),
  getProductPrices: (id: string, params?: { cursor?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchApi<Price[]>(`/products/${id}/prices${query ? `?${query}` : ''}`);
  },
  getProductStats: (id: string) => fetchApi<ProductStats>(`/products/${id}/stats`),
  getStores: () => fetchApi<Store[]>('/stores'),
};
