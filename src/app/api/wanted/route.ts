import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { discordWebhook } from '@/lib/discord-webhook';
import { getApiAuthContext } from '@/lib/api-auth';

// GET /api/wanted - Recupera tutti i ricercati
export async function GET(request: Request) {
  try {
    const auth = await getApiAuthContext(request);

    // Verifica se l'utente è autenticato
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Opzioni di filtro dalla query string
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dangerLevel = searchParams.get('dangerLevel') || '';

    // Costruisci il filtro per Prisma
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (dangerLevel) {
      where.dangerLevel = dangerLevel;
    }
    
    const reqUrl = new URL(request.url);
    const page = parseInt(reqUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(reqUrl.searchParams.get('limit') || '100'), 500);
    const skip = (page - 1) * limit;

    const [total, wantedRecords] = await Promise.all([
      (prisma as any).wanted.count({ where }),
      (prisma as any).wanted.findMany({
        where,
        include: {
          officer: {
            select: { id: true, name: true, surname: true, badge: true, rank: true, department: true }
          }
        },
        orderBy: { insertedAt: 'desc' },
        skip,
        take: limit,
      })
    ]);

    // Batch IARP lookup — 1 full-scan invece di N
    const citizenIds = [...new Set(wantedRecords.map((w: any) => w.citizenId))] as number[];
    const citizenMap = await prisma.findGameUsersByIds(citizenIds);

    let enrichedWanted = wantedRecords.map((wanted: any) => {
      const citizen = citizenMap.get(wanted.citizenId);
      return {
        ...wanted,
        citizen_firstname: citizen?.firstname || 'Sconosciuto',
        citizen_lastname: citizen?.lastname || '',
        citizen_dateofbirth: citizen?.dateofbirth || null,
        citizen_gender: citizen?.sex || null,
        citizen_height: citizen?.height || null,
        citizen_phone: citizen?.phone_number || null,
        officer_name: wanted.officer?.name || 'Sconosciuto',
        officer_surname: wanted.officer?.surname || '',
        officer_badge: wanted.officer?.badge || null,
      };
    });

    // Filtro ricerca su nome e testo dopo enrichment
    if (search) {
      const searchLower = search.toLowerCase();
      enrichedWanted = enrichedWanted.filter((w: any) =>
        w.citizen_firstname.toLowerCase().includes(searchLower) ||
        w.citizen_lastname.toLowerCase().includes(searchLower) ||
        w.crimes?.toLowerCase().includes(searchLower) ||
        w.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ wanted: enrichedWanted, total, page, limit }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
    });
  } catch (error) {
    console.error('Errore durante il recupero dei ricercati:', error);
    return NextResponse.json({ error: 'Errore durante il recupero dei ricercati' }, { status: 500 });
  }
}

// POST /api/wanted - Crea un nuovo ricercato
export async function POST(request: Request) {
  try {
    const auth = await getApiAuthContext(request);

    // Verifica se l'utente è autenticato
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!auth.officerId) {
      return NextResponse.json(
        { error: 'Configurazione mancante: imposta FDO_TABLET_OFFICER_ID per richieste con token API' },
        { status: 500 }
      );
    }

    // Recupera i dati dalla richiesta
    const data = await request.json();

    // Controlla che i campi obbligatori siano presenti
    if (!data.citizenId || !data.crimes || !data.description || !data.dangerLevel) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Converti citizenId in numero
    const citizenIdNumber = typeof data.citizenId === 'string' 
      ? parseInt(data.citizenId) 
      : data.citizenId;

    // Verifica che il cittadino esista nel database IARP
    const citizen = await prisma.findGameUserById(citizenIdNumber);
    
    if (!citizen) {
      return NextResponse.json({ error: 'Cittadino non trovato' }, { status: 404 });
    }

    // Crea il nuovo ricercato usando Prisma
    const newWanted = await (prisma as any).wanted.create({
      data: {
        citizenId: citizenIdNumber,
        crimes: data.crimes,
        description: data.description,
        lastSeen: data.lastSeen || null,
        dangerLevel: data.dangerLevel,
        bounty: data.bounty ? parseInt(data.bounty.toString()) : null,
        status: data.status || 'active',
        notes: data.notes || null,
        imageUrl: data.imageUrl || null,
        officerId: auth.officerId
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            rank: true,
            department: true
          }
        }
      }
    });

    // Arricchisci con i dati del cittadino
    const enrichedWanted = {
      ...newWanted,
      citizen_firstname: citizen.firstname || 'Sconosciuto',
      citizen_lastname: citizen.lastname || '',
      citizen_dateofbirth: citizen.dateofbirth || null,
      citizen_gender: citizen.sex || null,
      citizen_height: citizen.height || null,
      citizen_phone: citizen.phone_number || null,
      officer_name: newWanted.officer?.name || 'Sconosciuto',
      officer_surname: newWanted.officer?.surname || '',
      officer_badge: newWanted.officer?.badge || null,
    };

    // 🔔 Invia notifica Discord per nuovo ricercato
    try {
      await discordWebhook.notifyNewWanted({
        wantedId: Number(newWanted.id.replace(/[^0-9]/g, '') || 0),
        citizenName: `${citizen.firstname || ''} ${citizen.lastname || ''}`.trim() || 'Sconosciuto',
        charges: data.crimes,
        severity: data.dangerLevel,
        officerName: `${newWanted.officer?.name || ''} ${newWanted.officer?.surname || ''}`.trim() || 'Sconosciuto',
        reward: data.bounty ? Number(data.bounty) : undefined,
      });
    } catch (webhookError) {
      // Non bloccare la creazione del ricercato se il webhook fallisce
      console.error('Errore durante l\'invio della notifica Discord:', webhookError);
    }

    return NextResponse.json(enrichedWanted, { status: 201 });
  } catch (error) {
    console.error('Errore durante la creazione del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante la creazione del ricercato' }, { status: 500 });
  }
}
