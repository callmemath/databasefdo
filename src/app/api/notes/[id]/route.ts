import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/notes/[id] - Update a note
export async function PUT(
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
    const noteId = resolvedParams.id;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Il contenuto della nota è obbligatorio' },
        { status: 400 }
      );
    }

    // Verifica che la nota esista e appartenga all'utente
    const existingNote = await prisma.citizenNote.findUnique({
      where: { id: noteId }
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Nota non trovata' },
        { status: 404 }
      );
    }

    if (existingNote.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Non hai il permesso di modificare questa nota' },
        { status: 403 }
      );
    }

    const updatedNote = await prisma.citizenNote.update({
      where: { id: noteId },
      data: {
        content: content.trim()
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

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della nota:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della nota' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
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
    const noteId = resolvedParams.id;

    // Verifica che la nota esista e appartenga all'utente
    const existingNote = await prisma.citizenNote.findUnique({
      where: { id: noteId }
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Nota non trovata' },
        { status: 404 }
      );
    }

    if (existingNote.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Non hai il permesso di eliminare questa nota' },
        { status: 403 }
      );
    }

    await prisma.citizenNote.delete({
      where: { id: noteId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione della nota:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della nota' },
      { status: 500 }
    );
  }
}
