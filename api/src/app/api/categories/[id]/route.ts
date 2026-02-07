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
  const rateLimit = checkRateLimit(`categories:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          take: 20,
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      return errors.notFound('Category');
    }

    return success(category);
  } catch (err) {
    console.error('Failed to fetch category:', err);
    return errors.internal();
  }
}
