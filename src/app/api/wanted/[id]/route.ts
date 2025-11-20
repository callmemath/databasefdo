import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Istanza del client Prisma
const prisma = new PrismaClient();

// GET /api/wanted/[id] - Recupera un singolo ricercato
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verifica se l'utente è autenticato
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;

    // Recupera il ricercato con le relazioni
    const query = `
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
      WHERE w.id = ?
    `;

    const wantedPersons = await prisma.$queryRawUnsafe(query, id) as any[];

    if (!wantedPersons || wantedPersons.length === 0) {
      return NextResponse.json({ error: 'Ricercato non trovato' }, { status: 404 });
    }

    return NextResponse.json(wantedPersons[0]);
  } catch (error) {
    console.error('Errore durante il recupero del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante il recupero del ricercato' }, { status: 500 });
  }
}

// PUT /api/wanted/[id] - Aggiorna un ricercato
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verifica se l'utente è autenticato
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Verifica se il ricercato esiste
    const checkQuery = `SELECT COUNT(*) AS count FROM fdo_wanted WHERE id = ?`;
    const checkResult = await prisma.$queryRawUnsafe(checkQuery, id) as any[];
    
    if (!checkResult || checkResult.length === 0 || checkResult[0].count === 0) {
      return NextResponse.json({ error: 'Ricercato non trovato' }, { status: 404 });
    }

    // Costruisci la query di aggiornamento
    const updateFields = [];
    const updateParams = [];

    if (data.crimes !== undefined) {
      updateFields.push('crimes = ?');
      updateParams.push(data.crimes);
    }
    
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(data.description);
    }
    
    if (data.lastSeen !== undefined) {
      updateFields.push('lastSeen = ?');
      updateParams.push(data.lastSeen);
    }
    
    if (data.dangerLevel !== undefined) {
      updateFields.push('dangerLevel = ?');
      updateParams.push(data.dangerLevel);
    }
    
    if (data.bounty !== undefined) {
      updateFields.push('bounty = ?');
      updateParams.push(data.bounty);
    }
    
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(data.status);
    }
    
    if (data.notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(data.notes);
    }
    
    if (data.imageUrl !== undefined) {
      updateFields.push('imageUrl = ?');
      updateParams.push(data.imageUrl);
    }

    // Aggiungi sempre updatedAt
    updateFields.push('updatedAt = NOW()');

    // Se non ci sono campi da aggiornare, restituisci un errore
    if (updateFields.length === 1) { // Solo updatedAt
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    // Crea la query di aggiornamento
    const updateQuery = `
      UPDATE fdo_wanted 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    // Aggiungi l'ID come ultimo parametro
    updateParams.push(id);

    // Esegui la query di aggiornamento
    await prisma.$executeRawUnsafe(updateQuery, ...updateParams);

    // Recupera il record aggiornato
    const getUpdatedQuery = `SELECT * FROM fdo_wanted WHERE id = ?`;
    const updatedRecords = await prisma.$queryRawUnsafe(getUpdatedQuery, id) as any[];

    return NextResponse.json(updatedRecords[0]);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante l\'aggiornamento del ricercato' }, { status: 500 });
  }
}

// DELETE /api/wanted/[id] - Elimina un ricercato
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verifica se l'utente è autenticato
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;

    // Verifica se il ricercato esiste
    const checkQuery = `SELECT COUNT(*) AS count FROM fdo_wanted WHERE id = ?`;
    const checkResult = await prisma.$queryRawUnsafe(checkQuery, id) as any[];
    
    if (!checkResult || checkResult.length === 0 || checkResult[0].count === 0) {
      return NextResponse.json({ error: 'Ricercato non trovato' }, { status: 404 });
    }

    // Elimina il ricercato
    const deleteQuery = `DELETE FROM fdo_wanted WHERE id = ?`;
    await prisma.$executeRawUnsafe(deleteQuery, id);

    return NextResponse.json({ message: 'Ricercato eliminato con successo' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione del ricercato:', error);
    return NextResponse.json({ error: 'Errore durante l\'eliminazione del ricercato' }, { status: 500 });
  }
}
