import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getApiAuthContext } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

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

    const registration = await prisma.vatRegistration.findUnique({
      where: { id },
      include: {
        officer: {
          select: { id: true, name: true, surname: true, badge: true, department: true, rank: true },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Partita IVA non trovata' }, { status: 404 });
    }

    const citizen = registration.citizenId ? await prisma.findGameUserById(registration.citizenId) : null;

    return NextResponse.json({ registration: { ...registration, citizen } });
  } catch (error) {
    console.error('Errore recupero partita IVA:', error);
    return NextResponse.json({ error: 'Errore nel recupero della partita IVA' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getApiAuthContext(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, suspensionReason } = body;

    const updateData: any = { officerId: auth.officerId };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (suspensionReason !== undefined) updateData.suspensionReason = suspensionReason;

    const registration = await prisma.vatRegistration.update({
      where: { id },
      data: updateData,
      include: {
        officer: { select: { name: true, surname: true, badge: true, department: true } },
      },
    });

    const citizen = registration.citizenId ? await prisma.findGameUserById(registration.citizenId) : null;

    return NextResponse.json({ registration: { ...registration, citizen } });
  } catch (error) {
    console.error('Errore aggiornamento partita IVA:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento della partita IVA" }, { status: 500 });
  }
}

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
    await prisma.vatRegistration.delete({ where: { id } });

    return NextResponse.json({ message: 'Partita IVA eliminata con successo' });
  } catch (error) {
    console.error('Errore eliminazione partita IVA:', error);
    return NextResponse.json({ error: "Errore nell'eliminazione della partita IVA" }, { status: 500 });
  }
}
