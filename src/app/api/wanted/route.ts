import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { discordWebhook } from '@/lib/discord-webhook';

// Istanza del client Prisma
const prisma = new PrismaClient();

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

    // Costruisci la query SQL in base ai filtri
    let whereClause = "";
    const params: any[] = [];
    
    if (status) {
      whereClause += " AND w.status = ?";
      params.push(status);
    }
    
    if (dangerLevel) {
      whereClause += " AND w.dangerLevel = ?";
      params.push(dangerLevel);
    }
    
    if (search) {
      whereClause += " AND (u.firstname LIKE ? OR u.lastname LIKE ? OR w.crimes LIKE ? OR w.description LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Esegui la query con i parametri
    const wantedPersons = await prisma.$queryRawUnsafe(`
      SELECT 
        w.*,
        u.firstname AS citizen_firstname,
        u.lastname AS citizen_lastname,
        u.dateofbirth AS citizen_dateofbirth,
        u.sex AS citizen_gender,
        u.height AS citizen_height,
        u.phone_number AS citizen_phone,
        o.name AS officer_name,
        o.surname AS officer_surname,
        o.badge AS officer_badge
      FROM fdo_wanted w
      LEFT JOIN users u ON w.citizenId = u.id
      LEFT JOIN fdo_users o ON w.officerId = o.id
      WHERE 1=1 ${whereClause}
      ORDER BY w.insertedAt DESC
    `, ...params);

    return NextResponse.json(wantedPersons);
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

    // Crea il nuovo ricercato con query parametrizzata
    await prisma.$executeRawUnsafe(`
      INSERT INTO fdo_wanted (
        id, 
        citizenId, 
        crimes, 
        description, 
        lastSeen, 
        dangerLevel, 
        bounty, 
        status, 
        notes, 
        imageUrl, 
        officerId, 
        insertedAt, 
        updatedAt
      ) VALUES (
        CONCAT('clq', LOWER(HEX(RANDOM_BYTES(8)))),
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        NOW(),
        NOW()
      )
    `, 
    data.citizenId,
    data.crimes,
    data.description,
    data.lastSeen || null,
    data.dangerLevel,
    data.bounty || null,
    data.status || 'active',
    data.notes || null,
    data.imageUrl || null,
    session.user.id
    );

    // Recupera l'ultimo record inserito
    const insertedRecord = await prisma.$queryRawUnsafe(`
      SELECT 
        w.*,
        u.firstname AS citizen_firstname,
        u.lastname AS citizen_lastname,
        u.dateofbirth AS citizen_dateofbirth,
        u.sex AS citizen_gender,
        u.height AS citizen_height,
        u.phone_number AS citizen_phone,
        o.name AS officer_name,
        o.surname AS officer_surname,
        o.badge AS officer_badge
      FROM fdo_wanted w
      LEFT JOIN users u ON w.citizenId = u.id
      LEFT JOIN fdo_users o ON w.officerId = o.id
      WHERE w.officerId = ?
      ORDER BY w.insertedAt DESC 
      LIMIT 1
    `, session.user.id) as any[];

    const newWanted = insertedRecord[0];

    // 🔔 Invia notifica Discord per nuovo ricercato
    try {
      await discordWebhook.notifyNewWanted({
        wantedId: Number(newWanted.id.replace(/[^0-9]/g, '') || 0),
        citizenName: `${newWanted.citizen_firstname || ''} ${newWanted.citizen_lastname || ''}`.trim() || 'Sconosciuto',
        charges: data.crimes,
        severity: data.dangerLevel,
        officerName: `${newWanted.officer_name || ''} ${newWanted.officer_surname || ''}`.trim() || 'Sconosciuto',
        reward: data.bounty ? Number(data.bounty) : undefined,
      });
    } catch (webhookError) {
      // Non bloccare la creazione del ricercato se il webhook fallisce
      console.error('Errore durante l\'invio della notifica Discord:', webhookError);
    }

    return NextResponse.json(insertedRecord[0], { status: 201 });
  } catch (error) {
    console.error('Errore durante la creazione del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante la creazione del ricercato' }, { status: 500 });
  }
}
