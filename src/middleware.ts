import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// BUG-4: fallback secret removido — JWT_SECRET é obrigatório em produção
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token: string) {
  if (!process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as any;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const accessToken = request.cookies.get('access_token')?.value;
  const path = nextUrl.pathname;

  const isPublicRoute =
    path === '/login' ||
    path === '/' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/denuncia') ||
    path.startsWith('/r/') ||
    path.startsWith('/acesso');

  if (!accessToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (accessToken) {
    const payload = await verifyToken(accessToken);

    if (!payload) {
      if (!isPublicRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        return response;
      }
      return NextResponse.next();
    }

    if (path === '/login') {
      const target = payload.role === 'EMPLOYEE' ? '/portal' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (path.startsWith('/dashboard') && payload.role === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/portal', request.url));
    }

    if (path.startsWith('/portal') && payload.role !== 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|images|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
  ],
};
