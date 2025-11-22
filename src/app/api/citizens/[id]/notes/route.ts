import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Recupera tutte le note di un cittadino
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const citizenId = parseInt(resolvedParams.id);

    if (isNaN(citizenId)) {
      return NextResponse.json(
        { error: 'ID cittadino non valido' },
        { status: 400 }
      );
    }

    // Recupera tutte le note del cittadino, ordinate per data (più recenti prima)
    const notes = await prisma.citizenNote.findMany({
      where: {
        citizenId: citizenId,
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Errore nel recupero delle note:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle note' },
      { status: 500 }
    );
  }
}

// POST: Crea una nuova nota per un cittadino
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const citizenId = parseInt(resolvedParams.id);

    if (isNaN(citizenId)) {
      return NextResponse.json(
        { error: 'ID cittadino non valido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Il contenuto della nota è obbligatorio' },
        { status: 400 }
      );
    }

    // Crea la nuova nota
    const note = await prisma.citizenNote.create({
      data: {
        content: content.trim(),
        citizenId: citizenId,
        officerId: session.user.id,
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true,
          },
        },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione della nota:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della nota' },
      { status: 500 }
    );
  }
}
