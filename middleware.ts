import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Se l'utente sta cercando di accedere alla pagina di login, consentiamo l'accesso
  if (pathname === '/login') {
    return NextResponse.next();
  }
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Reindirizza alla pagina di login se non autenticato
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

// Esegui il middleware su tutte le rotte tranne quelle specificate
export const config = {
  matcher: ['/((?!api/auth|api/discord|_next/static|_next/image|favicon.ico).*)'],
};
