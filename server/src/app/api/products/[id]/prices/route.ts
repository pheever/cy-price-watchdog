import { prisma } from '@/lib/prisma';
import { paginated, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';
import { parseSearchParams, priceHistorySchema, zodErrorToFields } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`prices:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(searchParams, priceHistorySchema);

  if (!parsed.success) {
    return errors.validation(zodErrorToFields(parsed.error));
  }

  const { cursor, limit, storeId, from, to } = parsed.data;

  try {
    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return errors.notFound('Product');
    }

    // Build where clause
    const where: {
      productId: string;
      storeId?: string;
      scrapedAt?: { gte?: Date; lte?: Date };
    } = { productId: id };

    if (storeId) {
      where.storeId = storeId;
    }

    if (from || to) {
      where.scrapedAt = {};
      if (from) where.scrapedAt.gte = from;
      if (to) where.scrapedAt.lte = to;
    }

    // Fetch prices
    const prices = await prisma.price.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        store: true,
      },
      orderBy: { scrapedAt: 'desc' },
    });

    const hasNext = prices.length > limit;
    const data = hasNext ? prices.slice(0, -1) : prices;
    const nextCursor = hasNext && data.length > 0 ? data[data.length - 1]?.id : undefined;

    return paginated(data, {
      cursor: nextCursor,
      hasNext,
    });
  } catch (err) {
    console.error('Failed to fetch price history:', err);
    return errors.internal();
  }
}
