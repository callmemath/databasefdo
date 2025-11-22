import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Usa una singola istanza globale di PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// PATCH: Modifica una nota esistente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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
    const { noteId } = resolvedParams;

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Il contenuto della nota è obbligatorio' },
        { status: 400 }
      );
    }

    // Verifica che la nota esista e appartenga all'utente corrente
    const existingNote = await (prisma as any).citizenNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Nota non trovata' },
        { status: 404 }
      );
    }

    if (existingNote.officerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non sei autorizzato a modificare questa nota' },
        { status: 403 }
      );
    }

    // Aggiorna la nota
    const note = await (prisma as any).citizenNote.update({
      where: { id: noteId },
      data: {
        content: content.trim(),
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

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Errore nella modifica della nota:', error);
    return NextResponse.json(
      { error: 'Errore nella modifica della nota' },
      { status: 500 }
    );
  }
}

// DELETE: Elimina una nota
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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
    const { noteId } = resolvedParams;

    // Verifica che la nota esista e appartenga all'utente corrente
    const existingNote = await (prisma as any).citizenNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Nota non trovata' },
        { status: 404 }
      );
    }

    if (existingNote.officerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non sei autorizzato a eliminare questa nota' },
        { status: 403 }
      );
    }

    // Elimina la nota
    await (prisma as any).citizenNote.delete({
      where: { id: noteId },
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
