import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { discordWebhook } from '@/lib/discord-webhook';
import { notifyWantedCreated } from '@/lib/realtime';

// GET /api/wanted - Recupera tutti i ricercati
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verifica se l'utente è autenticato
    if (!session) {
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
    
    // Recupera tutti i ricercati con i dati dell'officer
    const wantedRecords = await (prisma as any).wanted.findMany({
      where,
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
      },
      orderBy: {
        insertedAt: 'desc'
      }
    });

    // Arricchisci i dati con le informazioni dei cittadini dal database IARP
    const enrichedWanted = await Promise.all(
      wantedRecords.map(async (wanted: any) => {
        // Recupera i dati del cittadino dal database IARP
        const citizen = await prisma.findGameUserById(wanted.citizenId);
        
        // Applica il filtro di ricerca se necessario
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesCitizen = citizen && (
            citizen.firstname?.toLowerCase().includes(searchLower) ||
            citizen.lastname?.toLowerCase().includes(searchLower)
          );
          const matchesWanted = 
            wanted.crimes?.toLowerCase().includes(searchLower) ||
            wanted.description?.toLowerCase().includes(searchLower);
          
          if (!matchesCitizen && !matchesWanted) {
            return null; // Filtra questo record
          }
        }

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
      })
    );

    // Rimuovi i record null (filtrati dalla ricerca)
    const filteredWanted = enrichedWanted.filter(w => w !== null);

    return NextResponse.json(filteredWanted);
  } catch (error) {
    console.error('Errore durante il recupero dei ricercati:', error);
    return NextResponse.json({ error: 'Errore durante il recupero dei ricercati' }, { status: 500 });
  }
}

// POST /api/wanted - Crea un nuovo ricercato
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verifica se l'utente è autenticato
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
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
        officerId: session.user.id
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

    // 🔴 Notifica real-time a tutti i client connessi
    try {
      notifyWantedCreated(enrichedWanted);
    } catch (realtimeError) {
      console.error('Errore notifica realtime:', realtimeError);
    }

    return NextResponse.json(enrichedWanted, { status: 201 });
  } catch (error) {
    console.error('Errore durante la creazione del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante la creazione del ricercato' }, { status: 500 });
  }
}
