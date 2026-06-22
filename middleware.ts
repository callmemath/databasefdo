import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SITE_ACCESS_COOKIE, clearSiteAccessCookie } from '@/lib/auth-access';

const PUBLIC_PAGES = new Set(['/login']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPage = PUBLIC_PAGES.has(pathname);
  const isAuthApi = pathname.startsWith('/api/auth');
  const isDiscordApi = pathname.startsWith('/api/discord');
  const hasSiteAccessCookie = Boolean(request.cookies.get(SITE_ACCESS_COOKIE)?.value);
  
  // Consenti l'accesso alle pagine pubbliche
  if (isPublicPage) {
    return NextResponse.next();
  }

  // Consenti SOLO le API di autenticazione NextAuth senza controllo
  // /api/discord deve usare il suo token speciale nell'env
  if (isAuthApi) {
    return NextResponse.next();
  }

  // Consenti le API Discord (usano il proprio sistema di autenticazione con Bearer token)
  if (isDiscordApi) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!hasSiteAccessCookie || !token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Le API route fanno la propria autenticazione via getApiAuthContext — skip DB validation.
  // Solo le navigazioni di pagina controllano la revoca account contro il DB.
  if (!pathname.startsWith('/api/')) {
    const validationResponse = await fetch(new URL('/api/auth/validate', request.url), {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    });

    if (!validationResponse.ok) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      const response = NextResponse.redirect(url);
      response.headers.append('Set-Cookie', clearSiteAccessCookie());
      return response;
    }
  }
  
  // Per le API (escluse quelle di auth), restituisci 401 se non autenticato
  if (pathname.startsWith('/api/')) {
    // Se autenticato, consenti l'accesso all'API
    return NextResponse.next();
  }
  
  // Per le pagine normali, reindirizza al login se non autenticato
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
