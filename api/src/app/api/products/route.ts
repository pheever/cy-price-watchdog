import { prisma } from '@/lib/prisma';
import { paginated, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';
import { parseSearchParams, productQuerySchema, zodErrorToFields } from '@/lib/validation';

export async function GET(request: Request) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`products:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(searchParams, productQuerySchema);

  if (!parsed.success) {
    return errors.validation(zodErrorToFields(parsed.error));
  }

  const { cursor, limit, categoryId, search } = parsed.data;

  try {
    // Build where clause
    const where: {
      categoryId?: string;
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { nameEnglish: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEnglish: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch one extra to determine hasNext
    const products = await prisma.product.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    const hasNext = products.length > limit;
    const data = hasNext ? products.slice(0, -1) : products;
    const nextCursor = hasNext && data.length > 0 ? data[data.length - 1]?.id : undefined;

    return paginated(data, {
      cursor: nextCursor,
      hasNext,
    });
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return errors.internal();
  }
}
