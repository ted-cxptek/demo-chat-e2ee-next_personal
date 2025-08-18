import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register'];
  
  // Check if the path is public
  const isPublicPath = publicPaths.includes(pathname);
  
  // Get the token from cookies
  const token = request.cookies.get('auth-storage')?.value;
  console.log("🚀 ~ middleware ~ token:", token)
  
  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is authenticated and trying to access auth pages
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
