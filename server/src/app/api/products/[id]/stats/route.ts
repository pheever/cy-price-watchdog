import { prisma } from '@/lib/prisma';
import { success, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface StoreStatsRow {
  storeId: string;
  storeName: string;
  storeChain: string | null;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  latestPrice: number;
  priceCount: number;
}

interface DistrictStatsRow {
  district: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  storeCount: number;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`product-stats:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  try {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return errors.notFound('Product');
    }

    // Get the latest scrape timestamp for this product
    const latestPrice = await prisma.price.findFirst({
      where: { productId: id },
      orderBy: { scrapedAt: 'desc' },
      select: { scrapedAt: true },
    });

    if (!latestPrice) {
      return success({
        current: null,
        byStore: [],
        byDistrict: [],
      });
    }

    // Get all prices from the latest scrape (within 1 hour window to account for scrape duration)
    const scrapeWindow = new Date(latestPrice.scrapedAt);
    scrapeWindow.setHours(scrapeWindow.getHours() - 1);

    // Current price stats (from latest scrape across all stores)
    const currentStats = await prisma.price.aggregate({
      where: {
        productId: id,
        scrapedAt: { gte: scrapeWindow },
      },
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
      _count: { price: true },
    });

    // Get per-store statistics (all-time for each store)
    const storeStats = await prisma.$queryRaw<StoreStatsRow[]>`
      SELECT
        s.id as "storeId",
        COALESCE(s."nameEnglish", s.name) as "storeName",
        s.chain as "storeChain",
        MIN(p.price)::float as "minPrice",
        MAX(p.price)::float as "maxPrice",
        AVG(p.price)::float as "avgPrice",
        (
          SELECT p2.price::float
          FROM "Price" p2
          WHERE p2."storeId" = s.id AND p2."productId" = ${id}
          ORDER BY p2."scrapedAt" DESC
          LIMIT 1
        ) as "latestPrice",
        COUNT(p.id)::int as "priceCount"
      FROM "Price" p
      JOIN "Store" s ON p."storeId" = s.id
      WHERE p."productId" = ${id}
      GROUP BY s.id, s.name, s."nameEnglish", s.chain
      ORDER BY "latestPrice" ASC
    `;

    // Get per-district statistics (current prices only, from latest scrape)
    const districtStats = await prisma.$queryRaw<DistrictStatsRow[]>`
      SELECT
        s.district as "district",
        MIN(p.price)::float as "minPrice",
        MAX(p.price)::float as "maxPrice",
        AVG(p.price)::float as "avgPrice",
        COUNT(DISTINCT s.id)::int as "storeCount"
      FROM "Price" p
      JOIN "Store" s ON p."storeId" = s.id
      WHERE p."productId" = ${id}
        AND p."scrapedAt" >= ${scrapeWindow}
        AND s.district IS NOT NULL
      GROUP BY s.district
      ORDER BY "avgPrice" ASC
    `;

    return success({
      current: {
        min: currentStats._min.price ? Number(currentStats._min.price) : null,
        max: currentStats._max.price ? Number(currentStats._max.price) : null,
        avg: currentStats._avg.price ? Number(currentStats._avg.price) : null,
        storeCount: currentStats._count.price,
        scrapedAt: latestPrice.scrapedAt,
      },
      byStore: storeStats.map((store: StoreStatsRow) => ({
        storeId: store.storeId,
        storeName: store.storeName,
        storeChain: store.storeChain,
        current: store.latestPrice,
        min: store.minPrice,
        max: store.maxPrice,
        avg: store.avgPrice,
        priceCount: store.priceCount,
      })),
      byDistrict: districtStats.map((district: DistrictStatsRow) => ({
        district: district.district,
        min: district.minPrice,
        max: district.maxPrice,
        avg: district.avgPrice,
        storeCount: district.storeCount,
      })),
    });
  } catch (err) {
    console.error('Failed to fetch product stats:', err);
    return errors.internal();
  }
}
