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

    const reqUrl = new URL(request.url);
    const page = parseInt(reqUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(reqUrl.searchParams.get('limit') || '50'), 200);
    const skip = (page - 1) * limit;

    const officerSelect = { select: { id: true, name: true, surname: true, badge: true, department: true } };

    let licenses: any[] = [];
    let total = 0;
    try {
      [total, licenses] = await Promise.all([
        prisma.weaponLicense.count({ where }),
        prisma.weaponLicense.findMany({
          where,
          include: { officer: officerSelect },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        })
      ]);
    } catch {
      [total, licenses] = await Promise.all([
        prisma.weaponLicense.count({ where }),
        prisma.weaponLicense.findMany({
          where,
          select: {
            id: true, licenseNumber: true, licenseType: true, status: true,
            issuingAuthority: true, restrictions: true, authorizedWeapons: true,
            notes: true, suspensionReason: true, citizenId: true, createdAt: true, updatedAt: true,
            officer: officerSelect,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        })
      ]);
    }

    // Batch IARP lookup — 1 full-scan invece di N
    const citizenIds = [...new Set(licenses.map((l: any) => l.citizenId).filter(Boolean))] as number[];
    const citizenMap = await prisma.findGameUsersByIds(citizenIds);

    let licensesWithCitizens = licenses.map((license: any) => ({
      ...license,
      citizen: license.citizenId ? (citizenMap.get(license.citizenId) || null) : null,
    }));

    // Filtro per nome cittadino dopo enrichment
    if (search && !where.licenseNumber) {
      const searchLower = search.toLowerCase();
      licensesWithCitizens = licensesWithCitizens.filter((l: any) => {
        if (!l.citizen) return false;
        return `${l.citizen.firstname} ${l.citizen.lastname}`.toLowerCase().includes(searchLower);
      });
    }

    return NextResponse.json({ licenses: licensesWithCitizens, total, page, limit }, {
      headers: { 'Cache-Control': 'no-store' }
    });
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
      // Se il DB non è ancora migrato, le date pending non possono essere null.
      // In quel caso non usiamo placeholder: chiediamo di applicare la migrazione.
      if (
        createError instanceof Prisma.PrismaClientKnownRequestError &&
        (createError.code === 'P2011' || createError.code === 'P2012')
      ) {
        return NextResponse.json(
          {
            error: 'Il database non è ancora migrato per supportare le richieste pending senza date. Applica la migrazione di fdo_weapon_licenses e rigenera Prisma.',
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
