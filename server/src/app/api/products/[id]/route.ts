import { prisma } from '@/lib/prisma';
import { success, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`products:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        prices: {
          take: 10,
          orderBy: { scrapedAt: 'desc' },
          include: {
            store: true,
          },
        },
      },
    });

    if (!product) {
      return errors.notFound('Product');
    }

    return success(product);
  } catch (err) {
    console.error('Failed to fetch product:', err);
    return errors.internal();
  }
}
