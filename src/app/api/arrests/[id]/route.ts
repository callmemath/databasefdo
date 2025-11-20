// File: /src/app/api/arrests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/arrests/[id] - Ottieni un arresto specifico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id: arrestId } = await params;
    
    // Cerca l'arresto per ID
    const arrest = await prisma.arrest.findUnique({
      where: { id: arrestId },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true,
          }
        }
      }
    });

    if (!arrest) {
      return NextResponse.json({ error: "Arresto non trovato" }, { status: 404 });
    }

    // Ottieni i dati del cittadino usando il metodo personalizzato
    const citizen = await prisma.findGameUserById(arrest.citizenId);
    
    // Recupera tutti i dati aggiuntivi direttamente dal database
    let additionalData;
    
    try {
      const data = await prisma.$queryRawUnsafe<any[]>(
        "SELECT sentence, fine, incidentDescription, seizedItems, department, signingOfficers, accomplices FROM fdo_arrests WHERE id = ?", 
        arrestId
      );
      
      if (data && data.length > 0) {
        additionalData = data[0];
      }
    } catch (error) {
      console.error("Errore nel recupero dei dati aggiuntivi:", error);
    }
    
    // Aggiungi i dati del cittadino e tutti i dati aggiuntivi all'oggetto arrest
    const arrestWithCitizen = {
      ...arrest,
      citizen,
      sentence: additionalData?.sentence || null,
      fine: additionalData?.fine || null,
      incidentDescription: additionalData?.incidentDescription || null,
      seizedItems: additionalData?.seizedItems || null,
      department: additionalData?.department || 'Non specificato',
      signingOfficers: additionalData?.signingOfficers || null,
      accomplices: additionalData?.accomplices || null
    };

    return NextResponse.json({ arrest: arrestWithCitizen });
  } catch (error) {
    console.error("Errore durante il recupero dell'arresto:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Errore durante il recupero dell'arresto";
      
    return NextResponse.json(
      { 
        error: "Errore durante il recupero dell'arresto", 
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/arrests/[id] - Aggiorna un arresto esistente
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id: arrestId } = await params;
    const body = await req.json();
    console.log("Dati ricevuti per aggiornamento:", body);
    
    // Verifica se l'arresto esiste
    const existingArrest = await prisma.arrest.findUnique({
      where: { id: arrestId }
    });
    
    if (!existingArrest) {
      return NextResponse.json({ error: "Arresto non trovato" }, { status: 404 });
    }
    
    // Prepara i dati per l'aggiornamento
    const updateData: any = {};
    
    // Aggiorna solo i campi forniti
    if (body.location) updateData.location = body.location;
    if (body.description) updateData.description = body.description;
    if (body.charges) updateData.charges = body.charges;
    // I campi aggiunti manualmente vengono gestiti separatamente con query raw
    // incidentDescription, seizedItems, department, signingOfficers, accomplices, sentence e fine
    // vengono gestiti separatamente con query raw
    
    // Aggiorna l'arresto
    const updatedArrest = await prisma.arrest.update({
      where: { id: arrestId },
      data: updateData,
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true,
          }
        }
      }
    });
    
    // Aggiorna tutti i campi aggiuntivi tramite query diretta
    // Estrai tutti i campi aggiuntivi dai dati
    const { 
      sentence, 
      fine, 
      incidentDescription, 
      seizedItems, 
      department, 
      signingOfficers, 
      accomplices 
    } = body;
    
    try {
      console.log("Aggiornamento campi aggiuntivi per arresto ID:", arrestId);
      
      // Costruisci la query SQL per aggiornare i campi
      let queryParams: any[] = [];
      let queryParts: string[] = [];
      
      if (sentence !== undefined) {
        queryParts.push("sentence = ?");
        queryParams.push(sentence);
      }
      
      if (fine !== undefined) {
        queryParts.push("fine = ?");
        queryParams.push(fine);
      }
      
      if (incidentDescription !== undefined) {
        queryParts.push("incidentDescription = ?");
        queryParams.push(incidentDescription);
      }
      
      if (seizedItems !== undefined) {
        queryParts.push("seizedItems = ?");
        queryParams.push(seizedItems);
      }
      
      if (department !== undefined) {
        queryParts.push("department = ?");
        queryParams.push(department);
      }
      
      if (signingOfficers !== undefined) {
        queryParts.push("signingOfficers = ?");
        queryParams.push(JSON.stringify(signingOfficers));
      }
      
      if (accomplices !== undefined) {
        queryParts.push("accomplices = ?");
        queryParams.push(JSON.stringify(accomplices));
      }
      
      if (queryParts.length > 0) {
        queryParams.push(arrestId);
        
        // Esegui la query
        const updateQuery = `UPDATE fdo_arrests SET ${queryParts.join(", ")} WHERE id = ?`;
        console.log("Esecuzione query:", updateQuery, "con parametri:", queryParams);
        await prisma.$executeRawUnsafe(updateQuery, ...queryParams);
        
        console.log("Campi aggiuntivi aggiornati con successo");
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento dei campi aggiuntivi:", error);
    }
    
    // Recupera l'arresto aggiornato completo
    const refreshedArrest = await prisma.arrest.findUnique({
      where: { id: arrestId },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true,
          }
        }
      }
    });

    // Ottieni i dati del cittadino usando il metodo personalizzato
    const citizen = await prisma.findGameUserById(refreshedArrest!.citizenId);
    
    // Recupera tutti i dati aggiuntivi aggiornati direttamente dal database
    let additionalData;
    try {
      const data = await prisma.$queryRawUnsafe<any[]>(
        "SELECT sentence, fine, incidentDescription, seizedItems, department, signingOfficers, accomplices FROM fdo_arrests WHERE id = ?", 
        arrestId
      );
      
      if (data && data.length > 0) {
        additionalData = data[0];
      }
    } catch (error) {
      console.error("Errore nel recupero dei dati aggiuntivi:", error);
    }
    
    // Aggiungi i dati del cittadino e tutti i dati aggiuntivi all'oggetto arrest
    const arrestWithCitizen = {
      ...refreshedArrest,
      citizen,
      sentence: additionalData?.sentence || null,
      fine: additionalData?.fine || null,
      incidentDescription: additionalData?.incidentDescription || null,
      seizedItems: additionalData?.seizedItems || null,
      department: additionalData?.department || 'Non specificato',
      signingOfficers: additionalData?.signingOfficers || null,
      accomplices: additionalData?.accomplices || null
    };
    
    return NextResponse.json({
      arrest: arrestWithCitizen,
      message: "Arresto aggiornato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'arresto:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Errore durante l'aggiornamento dell'arresto";
      
    return NextResponse.json(
      { 
        error: "Errore durante l'aggiornamento dell'arresto", 
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/arrests/[id] - Elimina un arresto
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id: arrestId } = await params;
    
    // Verifica se l'arresto esiste
    const existingArrest = await prisma.arrest.findUnique({
      where: { id: arrestId }
    });
    
    if (!existingArrest) {
      return NextResponse.json({ error: "Arresto non trovato" }, { status: 404 });
    }
    
    // Elimina l'arresto
    await prisma.arrest.delete({
      where: { id: arrestId }
    });
    
    return NextResponse.json({
      message: "Arresto eliminato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'arresto:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Errore durante l'eliminazione dell'arresto";
      
    return NextResponse.json(
      { 
        error: "Errore durante l'eliminazione dell'arresto", 
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
