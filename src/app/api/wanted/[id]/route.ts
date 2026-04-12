import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getApiAuthContext } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

// GET /api/wanted/[id] - Recupera un singolo ricercato
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verifica se l'utente è autenticato
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;

    // Recupera il ricercato con i dati dell'officer dal database FDO
    const wanted = await (prisma as any).wanted.findUnique({
      where: { id },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            rank: true,
            department: true,
          }
        }
      }
    });

    if (!wanted) {
      return NextResponse.json({ error: 'Ricercato non trovato' }, { status: 404 });
    }

    // Arricchisci con i dati del cittadino dal database IARP
    const citizen = await prisma.findGameUserById(wanted.citizenId);

    return NextResponse.json({
      ...wanted,
      citizen: citizen ? {
        id: citizen.id,
        firstname: citizen.firstname || null,
        lastname: citizen.lastname || null,
        dateofbirth: citizen.dateofbirth || null,
        sex: citizen.sex || null,
        height: citizen.height || null,
        phone_number: citizen.phone_number || null,
      } : null,
    });
  } catch (error) {
    console.error('Errore durante il recupero del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante il recupero del ricercato' }, { status: 500 });
  }
}

// PUT /api/wanted/[id] - Aggiorna un ricercato
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getApiAuthContext(request);

    // Verifica se l'utente è autenticato
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Costruisci i dati da aggiornare
    const updateData: any = {};
    if (data.crimes !== undefined) updateData.crimes = data.crimes;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.lastSeen !== undefined) updateData.lastSeen = data.lastSeen;
    if (data.dangerLevel !== undefined) updateData.dangerLevel = data.dangerLevel;
    if (data.bounty !== undefined) updateData.bounty = data.bounty;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const updated = await (prisma as any).wanted.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante l\'aggiornamento del ricercato' }, { status: 500 });
  }
}

// DELETE /api/wanted/[id] - Elimina un ricercato
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verifica se l'utente è autenticato
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;

    await (prisma as any).wanted.delete({ where: { id } });

    return NextResponse.json({ message: 'Ricercato eliminato con successo' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante l\'eliminazione del ricercato' }, { status: 500 });
  }
}
