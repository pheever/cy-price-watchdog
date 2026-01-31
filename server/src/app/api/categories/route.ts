import { prisma } from '@/lib/prisma';
import { success, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';
import { parseSearchParams, categoryQuerySchema, zodErrorToFields } from '@/lib/validation';

export async function GET(request: Request) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`categories:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(searchParams, categoryQuerySchema);

  if (!parsed.success) {
    return errors.validation(zodErrorToFields(parsed.error));
  }

  const { parentId, includeProducts } = parsed.data;

  try {
    const categories = await prisma.category.findMany({
      where: parentId ? { parentId } : { parentId: null },
      include: {
        children: true,
        products: includeProducts,
      },
      orderBy: { name: 'asc' },
    });

    return success(categories);
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    return errors.internal();
  }
}
