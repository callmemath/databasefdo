import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { discordWebhook } from '@/lib/discord-webhook';
import { getApiAuthContext } from '@/lib/api-auth';

// GET - Lista tutti i porto d'armi con filtri
export async function GET(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);
    
    if (!auth.isAuthorized) {
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

    // Try/catch: fallback senza issueDate/expiryDate se il client Prisma non è ancora rigenerato
    let licenses: any[] = [];
    try {
      licenses = await prisma.weaponLicense.findMany({
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
    } catch {
      licenses = await prisma.weaponLicense.findMany({
        where,
        select: {
          id: true,
          licenseNumber: true,
          licenseType: true,
          status: true,
          issuingAuthority: true,
          restrictions: true,
          authorizedWeapons: true,
          notes: true,
          suspensionReason: true,
          citizenId: true,
          createdAt: true,
          updatedAt: true,
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
    }

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
// POST - Crea una nuova RICHIESTA di porto d'armi (status: pending)
// La licenza diventa attiva solo quando l'operatore crea il documento in iarp-legal-docs
export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);
    
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!auth.officerId) {
      return NextResponse.json(
        { error: 'Configurazione mancante: imposta FDO_TABLET_OFFICER_ID per richieste con token API' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      licenseNumber,
      citizenId,
      licenseType,
      notes,
    } = body;

    // Validazione campi obbligatori per la richiesta
    if (!licenseNumber || !citizenId || !licenseType) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: licenseNumber, citizenId, licenseType' },
        { status: 400 }
      );
    }

    const parsedCitizenId = Number(citizenId);
    if (!Number.isInteger(parsedCitizenId) || parsedCitizenId <= 0) {
      return NextResponse.json(
        { error: 'citizenId non valido' },
        { status: 400 }
      );
    }

    // Verifica se il cittadino esiste nel database IARP
    const citizen = await prisma.findGameUserById(parsedCitizenId);

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
        { error: 'Numero richiesta già esistente' },
        { status: 400 }
      );
    }

    // L'autorità emittente viene sempre determinata lato server in base all'operatore autenticato
    const officer = await prisma.user.findUnique({
      where: { id: auth.officerId },
      select: { id: true, department: true },
    });

    if (!officer) {
      return NextResponse.json(
        {
          error: 'Operatore non trovato. Verifica x-tablet-user-id oppure FDO_TABLET_OFFICER_ID (deve essere un ID utente valido fdo_users.id).',
        },
        { status: 400 }
      );
    }

    const issuingAuthority = officer?.department?.trim()
      ? `Forze dell'Ordine - ${officer.department.trim()}`
      : 'Forze dell\'Ordine di San Andreas';

    const baseData = {
      licenseNumber,
      citizenId: parsedCitizenId,
      licenseType,
      issuingAuthority,
      notes,
      status: 'pending',
    };

    // Sintassi relazione Prisma 6 (checked create input): usa officer.connect invece di officerId scalare
    const officerConnect = { officer: { connect: { id: officer.id } } };

    let license;
    try {
      // Richiesta pending: le date vengono assegnate solo in attivazione.
      license = await prisma.weaponLicense.create({
        data: {
          ...baseData,
          ...officerConnect,
          issueDate: null as unknown as Date,
          expiryDate: null as unknown as Date,
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
    } catch (createError) {
      // Se il DB non è migrato (NOT NULL), blocca la creazione: niente date placeholder.
      if (
        createError instanceof Prisma.PrismaClientKnownRequestError &&
        (createError.code === 'P2011' || createError.code === 'P2012')
      ) {
        return NextResponse.json(
          {
            error:
              'Database non allineato: issueDate/expiryDate devono essere nullable. Applica la migrazione prima di creare richieste pending.',
          },
          { status: 500 }
        );
      } else {
        throw createError;
      }
    }

    const licenseWithCitizen = {
      ...license,
      citizen
    };

    return NextResponse.json({ license: licenseWithCitizen }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione della richiesta porto d\'armi:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Numero richiesta già esistente' },
          { status: 400 }
        );
      }

      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Relazione non valida: verifica operatore e cittadino' },
          { status: 400 }
        );
      }

      if (error.code === 'P2011' || error.code === 'P2012') {
        return NextResponse.json(
          { error: 'Schema DB non allineato: applica le migration Prisma (issueDate/expiryDate nullable)' },
          { status: 500 }
        );
      }
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Errore nella creazione della richiesta porto d'armi: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Errore nella creazione della richiesta porto d\'armi' },
      { status: 500 }
    );
  }
}
