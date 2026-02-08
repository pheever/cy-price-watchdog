import { prisma } from '@/lib/prisma';
import { success, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CheapestProductRow {
  productId: string;
  name: string;
  nameEnglish: string;
  minPrice: number;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`category-stats:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  try {
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      return errors.notFound('Category');
    }

    // Collect product IDs from this category and its subcategories (one level deep)
    const subcategories = await prisma.category.findMany({
      where: { parentId: id },
      select: { id: true },
    });

    const categoryIds = [id, ...subcategories.map((c: { id: string }) => c.id)];

    const productIds = await prisma.product.findMany({
      where: { categoryId: { in: categoryIds } },
      select: { id: true },
    });

    const productIdList = productIds.map((p: { id: string }) => p.id);

    if (productIdList.length === 0) {
      return success({
        productCount: 0,
        scrapedAt: null,
        cheapest: [],
      });
    }

    // Get the latest scrape timestamp across all products in this category
    const latestPrice = await prisma.price.findFirst({
      where: { productId: { in: productIdList } },
      orderBy: { scrapedAt: 'desc' },
      select: { scrapedAt: true },
    });

    if (!latestPrice) {
      return success({
        productCount: productIdList.length,
        scrapedAt: null,
        cheapest: [],
      });
    }

    // Get all prices from the latest scrape (within 1 hour window)
    const scrapeWindow = new Date(latestPrice.scrapedAt);
    scrapeWindow.setHours(scrapeWindow.getHours() - 1);

    // For each product, get its MIN price from the latest scrape window, sorted ascending, top 10
    const cheapest = await prisma.$queryRaw<CheapestProductRow[]>`
      SELECT
        pr.id as "productId",
        pr.name as "name",
        pr."nameEnglish" as "nameEnglish",
        MIN(p.price)::float as "minPrice"
      FROM "Price" p
      JOIN "Product" pr ON p."productId" = pr.id
      WHERE p."productId" = ANY(${productIdList})
        AND p."scrapedAt" >= ${scrapeWindow}
      GROUP BY pr.id, pr.name, pr."nameEnglish"
      ORDER BY "minPrice" ASC
      LIMIT 10
    `;

    return success({
      productCount: productIdList.length,
      scrapedAt: latestPrice.scrapedAt,
      cheapest,
    });
  } catch (err) {
    console.error('Failed to fetch category stats:', err);
    return errors.internal();
  }
}
