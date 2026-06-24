import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthContext } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAuthorized } = await getApiAuthContext(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, color, order } = body as {
      name?: string;
      color?: string;
      order?: number;
    };

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (color !== undefined) data.color = color;
    if (order !== undefined) data.order = order;

    const category = await prisma.crimeCategory.update({
      where: { id },
      data,
      include: { crimes: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json({ category });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Categoria non trovata' }, { status: 404 });
    }
    if (prismaError.code === 'P2002') {
      return NextResponse.json({ error: 'Una categoria con questo nome esiste già' }, { status: 409 });
    }
    console.error('Errore nell\'aggiornamento della categoria:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAuthorized } = await getApiAuthContext(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.crimeCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Categoria non trovata' }, { status: 404 });
    }
    console.error('Errore nell\'eliminazione della categoria:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
