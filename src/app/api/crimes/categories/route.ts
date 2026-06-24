import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthContext } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { isAuthorized } = await getApiAuthContext(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const categories = await prisma.crimeCategory.findMany({
      include: {
        crimes: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Errore nel recupero delle categorie:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { isAuthorized } = await getApiAuthContext(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color, order } = body as {
      name: string;
      color?: string;
      order?: number;
    };

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 });
    }

    const category = await prisma.crimeCategory.create({
      data: {
        name: name.trim(),
        color: color ?? 'blue',
        order: order ?? 0,
      },
      include: { crimes: true },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      return NextResponse.json({ error: 'Una categoria con questo nome esiste già' }, { status: 409 });
    }
    console.error('Errore nella creazione della categoria:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
