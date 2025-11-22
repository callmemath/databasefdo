import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/citizens/[id]/notes - Get all notes for a citizen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autenticato' },
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

    const notes = await prisma.citizenNote.findMany({
      where: {
        citizenId: citizenId
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Errore nel recupero delle note:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle note' },
      { status: 500 }
    );
  }
}

// POST /api/citizens/[id]/notes - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
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

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Il contenuto della nota è obbligatorio' },
        { status: 400 }
      );
    }

    const note = await prisma.citizenNote.create({
      data: {
        citizenId,
        content: content.trim(),
        createdBy: user.id
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true
          }
        }
      }
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione della nota:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della nota' },
      { status: 500 }
    );
  }
}
