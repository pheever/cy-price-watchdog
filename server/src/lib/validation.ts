import { z } from 'zod';

// Pagination schema
export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Category query params
export const categoryQuerySchema = z.object({
  parentId: z.string().uuid().optional(),
  includeProducts: z.coerce.boolean().default(false),
});

export type CategoryQueryParams = z.infer<typeof categoryQuerySchema>;

// Product query params
export const productQuerySchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  search: z.string().min(1).max(100).optional(),
});

export type ProductQueryParams = z.infer<typeof productQuerySchema>;

// Price history query params
export const priceHistorySchema = paginationSchema.extend({
  storeId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type PriceHistoryParams = z.infer<typeof priceHistorySchema>;

// Helper to parse and validate query params
export function parseSearchParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): z.SafeParseReturnType<unknown, z.infer<T>> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return schema.safeParse(params);
}

// Convert Zod errors to field errors
export function zodErrorToFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    fields[path] = issue.message;
  }
  return fields;
}
