import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
      // Nota: Non possiamo più filtrare direttamente per firstname/lastname
      // perché citizen non è più una relazione. Filtreremo solo per numero licenza
      where.licenseNumber = { contains: search };
    }

    const licenses = await prisma.weaponLicense.findMany({
      where,
      include: {
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

    // Carica i dati dei cittadini dal database IARP
    const licensesWithCitizens = await Promise.all(
      licenses.map(async (license) => {
        let citizenData = null;
        if (license.citizenId) {
          citizenData = await prisma.findGameUserById(license.citizenId);
        }
        return {
          ...license,
          citizen: citizenData
        };
      })
    );

    // Se c'è una ricerca per nome, filtra i risultati dopo aver caricato i dati dei cittadini
    let filteredLicenses = licensesWithCitizens;
    if (search && !where.licenseNumber) {
      const searchLower = search.toLowerCase();
      filteredLicenses = licensesWithCitizens.filter((license) => {
        if (!license.citizen) return false;
        const fullName = `${license.citizen.firstname} ${license.citizen.lastname}`.toLowerCase();
        return fullName.includes(searchLower);
      });
    }

    return NextResponse.json({ licenses: filteredLicenses });
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

    // Verifica se il cittadino esiste nel database IARP
    const citizen = await prisma.findGameUserById(parseInt(citizenId));

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
    const licenseWithCitizen = {
      ...license,
      citizen
    };

    // 🔔 Invia notifica Discord per nuova licenza porto d'armi
    try {
      await discordWebhook.notifyNewWeaponLicense({
        licenseId: Number(licenseWithCitizen.id),
        citizenName: `${citizen.firstname} ${citizen.lastname}`,
        type: licenseType,
        validUntil: new Date(expiryDate),
        issuedBy: `${licenseWithCitizen.officer.name} ${licenseWithCitizen.officer.surname}`,
      });
    } catch (webhookError) {
      // Non bloccare la creazione della licenza se il webhook fallisce
      console.error('Errore durante l\'invio della notifica Discord:', webhookError);
    }

    return NextResponse.json({ license: licenseWithCitizen }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del porto d\'armi:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del porto d\'armi' },
      { status: 500 }
    );
  }
}
