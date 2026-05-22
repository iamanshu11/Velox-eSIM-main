import { jwtDecode } from 'jwt-decode';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type UserRole = 'CUSTOMER' | 'RESELLER' | 'ADMIN' | 'SUPER_ADMIN';

const getDefaultDashboardRoute = (role: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'CUSTOMER':
    case 'RESELLER':
    default:
      return '/dashboard';
  }
};

const getRouteOwner = (pathname: string): 'ADMIN' | 'COMMON' | null => {
  if (
    pathname === '/' ||
    pathname.startsWith('/esim') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/magazine') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/how-it-works') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/contact')
  ) {
    return null;
  }
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return null;
  }
  if (pathname.startsWith('/checkout')) {
    return 'COMMON';
  }
  if (pathname.startsWith('/admin')) {
    return 'ADMIN';
  }
  if (pathname.startsWith('/dashboard')) {
    return 'COMMON';
  }

  return 'COMMON';
};

const isAuthRoute = (pathname: string): boolean => {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  );
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  const accessToken = request.cookies.get('accessToken')?.value || null;
  let userRole: UserRole | null = null;
  if (accessToken) {
    try {
      const decoded = jwtDecode<any>(accessToken);
      if (decoded && typeof decoded === 'object' && decoded.role) {
        userRole = decoded.role as UserRole;
      }
    } catch {
      userRole = null;
    }
  }

  const routeOwner = getRouteOwner(pathname);
  const isAuth = isAuthRoute(pathname);
  if (accessToken && userRole && isAuth) {
    return NextResponse.redirect(
      new URL(getDefaultDashboardRoute(userRole), request.url)
    );
  }
  if (routeOwner === null) {
    return NextResponse.next();
  }
  if (routeOwner === 'ADMIN' && userRole) {
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole), request.url));
    }
  }
  if (routeOwner === 'COMMON' && pathname.startsWith('/dashboard') && userRole) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole), request.url));
    }
  }
  if (!accessToken && routeOwner !== null) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)',
  ],
};
