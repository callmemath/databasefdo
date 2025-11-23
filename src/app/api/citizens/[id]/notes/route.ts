import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Usa PrismaClient diretto per accedere al modello CitizenNote
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
    
    const notes = await (prisma as any).citizenNote.findMany({
      where: {
        citizenId: BigInt(citizenId),
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
    
    const serializedNotes = notes.map((note: any) => ({
      ...note,
      citizenId: note.citizenId.toString(),
    }));

    return NextResponse.json({ notes: serializedNotes });
  } catch (error) {
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

    const note = await (prisma as any).citizenNote.create({
      data: {
        content: content.trim(),
        citizenId: BigInt(citizenId),
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

    // Converti BigInt in stringa per JSON
    const serializedNote = {
      ...note,
      citizenId: note.citizenId.toString(),
    };

    return NextResponse.json({ note: serializedNote }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nella creazione della nota' },
      { status: 500 }
    );
  }
}
