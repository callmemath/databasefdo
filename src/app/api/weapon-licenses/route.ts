import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { discordWebhook } from '@/lib/discord-webhook';

// GET - Lista tutti i porto d'armi con filtri
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const citizenId = searchParams.get('citizenId');
    const status = searchParams.get('status');
    const licenseType = searchParams.get('licenseType');
    const search = searchParams.get('q');

    const where: any = {};

    if (citizenId) {
      where.citizenId = parseInt(citizenId);
    }

    if (status) {
      where.status = status;
    }

    if (licenseType) {
      where.licenseType = licenseType;
    }

    if (search) {
      where.OR = [
        { licenseNumber: { contains: search } },
        { citizen: { firstname: { contains: search } } },
        { citizen: { lastname: { contains: search } } },
      ];
    }

    const licenses = await prisma.weaponLicense.findMany({
      where,
      include: {
        citizen: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            dateofbirth: true,
          },
        },
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('Errore nel recupero dei porto d\'armi:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei porto d\'armi' },
      { status: 500 }
    );
  }
}

// POST - Crea un nuovo porto d'armi
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const {
      licenseNumber,
      citizenId,
      licenseType,
      issueDate,
      expiryDate,
      issuingAuthority,
      restrictions,
      authorizedWeapons,
      notes,
    } = body;

    // Validazione
    if (!licenseNumber || !citizenId || !licenseType || !issueDate || !expiryDate) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      );
    }

    // Verifica se il cittadino esiste
    const citizen = await prisma.gameUser.findUnique({
      where: { id: parseInt(citizenId) },
    });

    if (!citizen) {
      return NextResponse.json(
        { error: 'Cittadino non trovato' },
        { status: 404 }
      );
    }

    // Verifica se il numero di licenza esiste già
    const existingLicense = await prisma.weaponLicense.findUnique({
      where: { licenseNumber },
    });

    if (existingLicense) {
      return NextResponse.json(
        { error: 'Numero porto d\'armi già esistente' },
        { status: 400 }
      );
    }

    const license = await prisma.weaponLicense.create({
      data: {
        licenseNumber,
        citizenId: parseInt(citizenId),
        licenseType,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        issuingAuthority,
        restrictions,
        authorizedWeapons,
        notes,
        status: 'active',
        officerId: session.user.id,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            dateofbirth: true,
          },
        },
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

    // 🔔 Invia notifica Discord per nuova licenza porto d'armi
    try {
      await discordWebhook.notifyNewWeaponLicense({
        licenseId: Number(license.id),
        citizenName: `${license.citizen.firstname} ${license.citizen.lastname}`,
        type: licenseType,
        validUntil: new Date(expiryDate),
        issuedBy: `${license.officer.name} ${license.officer.surname}`,
      });
    } catch (webhookError) {
      // Non bloccare la creazione della licenza se il webhook fallisce
      console.error('Errore durante l\'invio della notifica Discord:', webhookError);
    }

    return NextResponse.json({ license }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del porto d\'armi:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del porto d\'armi' },
      { status: 500 }
    );
  }
}
