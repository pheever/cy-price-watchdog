import { prisma } from '@/lib/prisma';
import { success, errors } from '@/lib/response';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(`stores:${clientId}`);
  if (!rateLimit.allowed) {
    return errors.rateLimit();
  }

  try {
    const stores = await prisma.store.findMany({
      orderBy: { name: 'asc' },
    });

    return success(stores);
  } catch (err) {
    console.error('Failed to fetch stores:', err);
    return errors.internal();
  }
}
