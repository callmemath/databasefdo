import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Dettagli porto d'armi specifico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;

    const license = await prisma.weaponLicense.findUnique({
      where: { id },
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

    if (!license) {
      return NextResponse.json(
        { error: 'Porto d\'armi non trovato' },
        { status: 404 }
      );
    }

    // Carica i dati del cittadino dal database IARP
    let citizenData = null;
    if (license.citizenId) {
      citizenData = await prisma.findGameUserById(license.citizenId);
    }

    // Costruisci l'oggetto di risposta con i dati combinati
    const licenseWithRelations = {
      ...license,
      citizen: citizenData
    };

    return NextResponse.json({ license: licenseWithRelations });
  } catch (error) {
    console.error('Errore nel recupero del porto d\'armi:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero del porto d\'armi' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna porto d'armi
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      expiryDate,
      restrictions,
      authorizedWeapons,
      notes,
      suspensionReason,
    } = body;

    const updateData: any = {
      officerId: session.user.id,
    };

    if (status) updateData.status = status;
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);
    if (restrictions !== undefined) updateData.restrictions = restrictions;
    if (authorizedWeapons !== undefined) updateData.authorizedWeapons = authorizedWeapons;
    if (notes !== undefined) updateData.notes = notes;
    if (suspensionReason !== undefined) updateData.suspensionReason = suspensionReason;

    const license = await prisma.weaponLicense.update({
      where: { id },
      data: updateData,
      include: {
        officer: {
          select: {
            name: true,
            surname: true,
            badge: true,
            department: true,
          },
        },
      },
    });

    // Carica i dati del cittadino dal database IARP
    let citizenData = null;
    if (license.citizenId) {
      citizenData = await prisma.findGameUserById(license.citizenId);
    }

    // Costruisci l'oggetto di risposta con i dati combinati
    const licenseWithRelations = {
      ...license,
      citizen: citizenData
    };

    return NextResponse.json({ license: licenseWithRelations });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del porto d\'armi:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del porto d\'armi' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina porto d'armi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.weaponLicense.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Porto d\'armi eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del porto d\'armi:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del porto d\'armi' },
      { status: 500 }
    );
  }
}
