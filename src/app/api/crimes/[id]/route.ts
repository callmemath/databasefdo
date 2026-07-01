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
    const { name, description, sentence, fine, articleCode, categoryId, order } = body as {
      name?: string;
      description?: string;
      sentence?: string;
      fine?: number;
      articleCode?: string | null;
      categoryId?: string;
      order?: number;
    };

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description.trim();
    if (sentence !== undefined) data.sentence = sentence.trim();
    if (fine !== undefined) data.fine = fine;
    if (articleCode !== undefined) data.articleCode = articleCode?.trim() || null;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (order !== undefined) data.order = order;

    const crime = await prisma.crime.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json({ crime });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Reato non trovato' }, { status: 404 });
    }
    console.error('Errore nell\'aggiornamento del reato:', error);
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
    await prisma.crime.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Reato non trovato' }, { status: 404 });
    }
    console.error('Errore nell\'eliminazione del reato:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
