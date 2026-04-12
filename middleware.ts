import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function hasValidTabletApiToken(request: NextRequest): boolean {
  const expectedToken = process.env.FDO_TABLET_API_TOKEN || process.env.TABLET_API_TOKEN;
  if (!expectedToken) {
    return false;
  }

  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : null;
  const xApiToken = request.headers.get('x-api-token')?.trim() || null;

  return bearerToken === expectedToken || xApiToken === expectedToken;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Consenti l'accesso alla pagina di login
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Consenti SOLO le API di autenticazione NextAuth senza controllo
  // /api/discord deve usare il suo token speciale nell'env
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Consenti le API Discord (usano il proprio sistema di autenticazione con Bearer token)
  if (pathname.startsWith('/api/discord')) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Per le API (escluse quelle di auth), restituisci 401 se non autenticato
  if (pathname.startsWith('/api/')) {
    if (hasValidTabletApiToken(request)) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    // Se autenticato, consenti l'accesso all'API
    return NextResponse.next();
  }
  
  // Per le pagine normali, reindirizza al login se non autenticato
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Se l'utente è autenticato e sta cercando di accedere alla root, reindirizza alla dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // L'utente è autenticato, consenti l'accesso
  return NextResponse.next();
}

// Esegui il middleware su tutte le rotte tranne risorse statiche
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
