import { NextRequest } from 'next/server';
import authMiddleware from 'next-auth/middleware';

// Explicitly define the proxy function to satisfy Next.js 16 / Turbopack
export default function proxy(req: NextRequest, event: any) {
  return authMiddleware(req as any, event);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};