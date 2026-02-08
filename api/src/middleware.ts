import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getAllowedOrigins(): string[] {
  const domain = process.env.CORS_ORIGIN;
  if (domain) {
    return [domain, `https://www.${domain.replace('https://', '')}`];
  }
  return ['http://localhost:8080', 'http://localhost:5173'];
}

const ALLOWED_ORIGINS = getAllowedOrigins();

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = NextResponse.next();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.append('Access-Control-Allow-Origin', origin);
  }

  response.headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.append('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.append('Access-Control-Max-Age', '86400');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
