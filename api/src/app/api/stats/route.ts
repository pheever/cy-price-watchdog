import { prisma } from '@/lib/prisma';
import { success, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`stats:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  try {
    // Get counts
    const [categoryCount, productCount, storeCount, priceCount] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.store.count(),
      prisma.price.count(),
    ]);

    // Get latest scrape time
    const latestPrice = await prisma.price.findFirst({
      orderBy: { scrapedAt: 'desc' },
      select: { scrapedAt: true },
    });

    // Get price range
    const priceStats = await prisma.price.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
    });

    return success({
      counts: {
        categories: categoryCount,
        products: productCount,
        stores: storeCount,
        priceRecords: priceCount,
      },
      lastScrapedAt: latestPrice?.scrapedAt ?? null,
      priceRange: {
        min: priceStats._min.price?.toString() ?? null,
        max: priceStats._max.price?.toString() ?? null,
        avg: priceStats._avg.price?.toString() ?? null,
      },
    });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    return errors.internal();
  }
}
