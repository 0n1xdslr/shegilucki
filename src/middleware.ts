import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { cifrarUrl, descifrarUrl } from '@/lib/bloqueOcho';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Si la ruta empieza con "/c/", es una ruta cifrada. La desciframos y reescribimos internamente.
  if (pathname.startsWith('/c/')) {
    const response = await updateSession(request);
    
    // Si el middleware de Supabase redirige (ej: no autenticado -> /login), devolvemos esa redirección.
    if (response.headers.has('location')) {
      return response;
    }

    // Si está autenticado, reescribimos a la ruta real descifrada
    const decryptedPath = descifrarUrl(pathname);
    const url = request.nextUrl.clone();
    url.pathname = decryptedPath;

    return NextResponse.rewrite(url);
  }

  // 2. Si es una ruta sin cifrar y requiere protección, la redirigimos a su versión cifrada
  const isIgnored = 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/';

  if (!isIgnored) {
    const encryptedPath = cifrarUrl(pathname);
    const url = request.nextUrl.clone();
    url.pathname = encryptedPath;
    return NextResponse.redirect(url);
  }

  // 3. De lo contrario, procesamos normalmente (rutas ignoradas, login, callbacks)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
