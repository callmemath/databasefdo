import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthContext } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { isAuthorized } = await getApiAuthContext(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const crimes = await prisma.crime.findMany({
      include: {
        category: true,
      },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    });

    return NextResponse.json({ crimes });
  } catch (error) {
    console.error('Errore nel recupero dei reati:', error);
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
    const { name, description, sentence, fine, articleCode, categoryId, order } = body as {
      name: string;
      description: string;
      sentence: string;
      fine?: number;
      articleCode?: string | null;
      categoryId: string;
      order?: number;
    };

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 });
    }
    if (!sentence || sentence.trim() === '') {
      return NextResponse.json({ error: 'La pena è obbligatoria' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'La categoria è obbligatoria' }, { status: 400 });
    }

    const crime = await prisma.crime.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? '',
        sentence: sentence.trim(),
        fine: fine ?? 0,
        articleCode: articleCode?.trim() || null,
        categoryId,
        order: order ?? 0,
      },
      include: { category: true },
    });

    return NextResponse.json({ crime }, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2003') {
      return NextResponse.json({ error: 'Categoria non trovata' }, { status: 404 });
    }
    console.error('Errore nella creazione del reato:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
