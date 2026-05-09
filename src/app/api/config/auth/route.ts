import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const COOKIE_NAME = 'config_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 ore

function getSecret(): string {
  return (process.env.CONFIG_PASSWORD ?? '') + (process.env.NEXTAUTH_SECRET ?? '');
}

function createToken(): string {
  const ts = Date.now().toString();
  const hmac = crypto.createHmac('sha256', getSecret()).update(ts).digest('hex');
  return `${ts}.${hmac}`;
}

function verifyToken(token: string): boolean {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;
  const ts = token.slice(0, dotIndex);
  const hmac = token.slice(dotIndex + 1);
  if (!ts || !hmac) return false;

  const age = Date.now() - parseInt(ts, 10);
  if (isNaN(age) || age > COOKIE_MAX_AGE * 1000 || age < 0) return false;

  const expected = crypto.createHmac('sha256', getSecret()).update(ts).digest('hex');
  const hmacBuf = Buffer.from(hmac, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (hmacBuf.length !== expectedBuf.length || hmacBuf.length === 0) return false;
  return crypto.timingSafeEqual(hmacBuf, expectedBuf);
}

// GET – verifica se la sessione di configurazione è attiva
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie && verifyToken(cookie)) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// POST – login con password di configurazione
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (!process.env.CONFIG_PASSWORD) {
    return NextResponse.json(
      { error: 'CONFIG_PASSWORD non configurata sul server' },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  if (!body.password || body.password !== process.env.CONFIG_PASSWORD) {
    return NextResponse.json({ error: 'Password non valida' }, { status: 401 });
  }

  const token = createToken();
  const res = NextResponse.json({ authenticated: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return res;
}

// DELETE – logout dalla configurazione
export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
