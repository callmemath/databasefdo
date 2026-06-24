import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const citizenId = searchParams.get('citizenId');
    const status = searchParams.get('status');
    const search = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (citizenId) where.citizenId = parseInt(citizenId);
    if (status) where.status = status;

    const officerSelect = { select: { id: true, name: true, surname: true, badge: true, department: true } };

    const [total, registrations] = await Promise.all([
      prisma.vatRegistration.count({ where }),
      prisma.vatRegistration.findMany({
        where,
        include: { officer: officerSelect },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const citizenIds = [...new Set(registrations.map((r: any) => r.citizenId).filter(Boolean))] as number[];
    const citizenMap = await prisma.findGameUsersByIds(citizenIds);

    let registrationsWithCitizens = registrations.map((r: any) => ({
      ...r,
      citizen: r.citizenId ? (citizenMap.get(r.citizenId) || null) : null,
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      registrationsWithCitizens = registrationsWithCitizens.filter((r: any) => {
        const numMatch = r.registrationNumber.toLowerCase().includes(searchLower);
        const nameMatch = r.citizen
          ? `${r.citizen.firstname} ${r.citizen.lastname}`.toLowerCase().includes(searchLower)
          : false;
        return numMatch || nameMatch;
      });
    }

    return NextResponse.json({ registrations: registrationsWithCitizens, total, page, limit }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Errore recupero partite IVA:', error);
    return NextResponse.json({ error: 'Errore nel recupero delle partite IVA' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    if (!auth.officerId) {
      return NextResponse.json(
        { error: 'Configurazione mancante: imposta FDO_TABLET_OFFICER_ID' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { registrationNumber, citizenId, businessName, businessType, taxRegime, notes } = body;

    if (!registrationNumber || !citizenId || !businessName || !businessType || !taxRegime) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: registrationNumber, citizenId, businessName, businessType, taxRegime' },
        { status: 400 }
      );
    }

    const parsedCitizenId = Number(citizenId);
    if (!Number.isInteger(parsedCitizenId) || parsedCitizenId <= 0) {
      return NextResponse.json({ error: 'citizenId non valido' }, { status: 400 });
    }

    const citizen = await prisma.findGameUserById(parsedCitizenId);
    if (!citizen) {
      return NextResponse.json({ error: 'Cittadino non trovato' }, { status: 404 });
    }

    const existing = await prisma.vatRegistration.findUnique({ where: { registrationNumber } });
    if (existing) {
      return NextResponse.json({ error: 'Numero registrazione già esistente' }, { status: 400 });
    }

    const officer = await prisma.user.findUnique({
      where: { id: auth.officerId },
      select: { id: true, department: true },
    });
    if (!officer) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 400 });
    }

    const issuingAuthority = officer.department?.trim()
      ? `Guardia di Finanza - ${officer.department.trim()}`
      : 'Guardia di Finanza di San Andreas';

    const registration = await prisma.vatRegistration.create({
      data: {
        registrationNumber,
        citizenId: parsedCitizenId,
        businessName,
        businessType,
        taxRegime,
        issuingAuthority,
        notes,
        status: 'pending',
        issueDate: null as unknown as Date,
        officer: { connect: { id: officer.id } },
      },
      include: {
        officer: { select: { name: true, surname: true, badge: true, department: true } },
      },
    });

    return NextResponse.json({ registration: { ...registration, citizen } }, { status: 201 });
  } catch (error) {
    console.error('Errore creazione partita IVA:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Numero registrazione già esistente' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Errore nella creazione della partita IVA' }, { status: 500 });
  }
}
