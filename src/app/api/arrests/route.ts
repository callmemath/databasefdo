// File: /src/app/api/arrests/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { discordWebhook } from "@/lib/discord-webhook";
import { notifyArrestCreated } from "@/lib/realtime";

// Endpoint per creare un nuovo arresto
export async function POST(req: NextRequest) {
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const data = await req.json();
    console.log("📥 Dati ricevuti nell'API:", JSON.stringify(data, null, 2));
    const { location, description, charges, citizenId, sentence, fine } = data;
    
    console.log("🔍 Dati sanzione ricevuti - sentence:", sentence, "tipo:", typeof sentence);
    console.log("🔍 Dati sanzione ricevuti - fine:", fine, "tipo:", typeof fine);
    console.log("💰 Sentence è null?", sentence === null, "| undefined?", sentence === undefined);
    console.log("💰 Fine è null?", fine === null, "| undefined?", fine === undefined);

    // Validazione dei dati
    if (!location || !description || !charges || citizenId === undefined || citizenId === null) {
      console.error("Campi mancanti:", {
        hasLocation: !!location,
        hasDescription: !!description,
        hasCharges: !!charges,
        hasCitizenId: !(citizenId === undefined || citizenId === null),
        receivedCitizenId: citizenId
      });
      return NextResponse.json(
        { error: "Tutti i campi sono obbligatori" },
        { status: 400 }
      );
    }

    // Converti citizenId in numero
    const citizenIdNumber = typeof citizenId === 'string' ? parseInt(citizenId) : citizenId;
    console.log("citizenId ricevuto:", citizenId, "convertito in:", citizenIdNumber, "tipo:", typeof citizenIdNumber);
    
    // Verifica se il cittadino esiste nella tabella users
    // Utilizziamo i metodi estesi integrati direttamente nel client Prisma
    const citizen = await prisma.findGameUserById(citizenIdNumber);

    console.log("Ricerca cittadino con ID:", citizenIdNumber, "Risultato:", citizen);

    if (!citizen) {
      return NextResponse.json(
        { error: "Cittadino non trovato" },
        { status: 404 }
      );
    }

    // Ottieni l'ID dell'ufficiale dalla sessione
    const officerId = session.user.id;

    // Estrai i nuovi campi dai dati ricevuti
    const { 
      incidentDescription, 
      seizedItems, 
      department, 
      signingOfficers, 
      accomplices 
    } = data;

    // Usa il dipartimento dell'utente o un valore predefinito
    const deptValue = department || (session.user.department as string) || 'Non specificato';
    
    // Crea il nuovo arresto utilizzando le API standard di Prisma per i campi base
    const arrest = await prisma.arrest.create({
      data: {
        location,
        description,
        charges,
        date: new Date(),
        citizenId: citizenIdNumber,
        officerId,
        department: deptValue
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true
          }
        }
      }
    });

    // Poi aggiorniamo i campi mancanti con una query SQL diretta
    if (incidentDescription || seizedItems || department || signingOfficers || accomplices) {
      try {
        const queryParts = [];
        const queryParams: any[] = [];

        if (incidentDescription) {
          queryParts.push("incidentDescription = ?");
          queryParams.push(incidentDescription);
        }
        
        if (seizedItems) {
          queryParts.push("seizedItems = ?");
          queryParams.push(seizedItems);
        }

        // Se il dipartimento è stato aggiornato manualmente, lo usiamo per l'aggiornamento
        if (department && department !== deptValue) {
          queryParts.push("department = ?");
          queryParams.push(department);
        }

        if (signingOfficers) {
          queryParts.push("signingOfficers = ?");
          queryParams.push(JSON.stringify(signingOfficers));
        }

        if (accomplices) {
          queryParts.push("accomplices = ?");
          queryParams.push(JSON.stringify(accomplices));
        }

        if (queryParts.length > 0) {
          const query = `UPDATE fdo_arrests SET ${queryParts.join(", ")} WHERE id = ?`;
          queryParams.push(arrest.id);
          
          console.log("Esecuzione query campi aggiuntivi:", query, "con parametri:", queryParams);
          
          // Esegui la query
          await prisma.$executeRawUnsafe(query, ...queryParams);
          
          console.log("Campi aggiuntivi aggiornati con successo");
        }
      } catch (error) {
        console.error("Errore durante l'aggiornamento dei campi aggiuntivi:", error);
      }
    }
    
    // Aggiorna i campi della sanzione e multa tramite query diretta
    // Eseguiamo sempre questo blocco se sentence o fine sono presenti nei dati
    try {
      console.log("Aggiornamento campi sanzione per arresto ID:", arrest.id);
      console.log("Valori da salvare - sentence:", sentence, "fine:", fine);
      
      // Costruisci la query SQL per aggiornare i campi
      let queryParams: any[] = [];
      let queryParts: string[] = [];
      
      // Aggiungi sentence anche se è null
      if (sentence !== undefined) {
        queryParts.push("sentence = ?");
        queryParams.push(sentence);
      }
      
      // Aggiungi fine anche se è 0 o null
      if (fine !== undefined) {
        queryParts.push("fine = ?");
        queryParams.push(fine);
      }
      
      if (queryParts.length > 0) {
        const query = `UPDATE fdo_arrests SET ${queryParts.join(", ")} WHERE id = ?`;
        queryParams.push(arrest.id);
        
        console.log("🔧 Esecuzione query sanzioni:", query, "con parametri:", queryParams);
        
        // Esegui la query
        await prisma.$executeRawUnsafe(query, ...queryParams);
        
        console.log("✅ Campi sanzione aggiornati con successo");
        
        // Verifica immediata del salvataggio
        const verification = await prisma.$queryRawUnsafe(
          "SELECT sentence, fine FROM fdo_arrests WHERE id = ?",
          arrest.id
        ) as any[];
        console.log("🔍 Verifica salvataggio sanzioni:", verification[0]);
      } else {
        console.log("⚠️ Nessun campo sanzione da aggiornare");
      }
    } catch (error) {
      console.error("❌ Errore durante l'aggiornamento dei campi sanzione:", error);
    }

    // Recupera l'arresto aggiornato con tutti i campi
    const updatedArrest = await prisma.arrest.findUnique({
      where: { id: arrest.id },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true
          }
        }
      }
    });
    
    // Ottieni i dati del cittadino utilizzando i metodi estesi
    const citizenData = await prisma.findGameUserById(citizenIdNumber);
    
    // Aggiungi i dati del cittadino all'oggetto arrest
    const arrestWithCitizen = {
      ...updatedArrest,
      citizen: citizenData,
      // Aggiungi manualmente i campi della sanzione perché potrebbero non essere inclusi nella risposta
      sentence: sentence || null,
      fine: fine !== undefined ? Number(fine) : null
    };

    console.log("📤 Risposta finale API con sanzioni:", {
      arrestId: arrestWithCitizen.id,
      sentence: arrestWithCitizen.sentence,
      fine: arrestWithCitizen.fine
    });

    // 🔔 Invia notifica Discord per nuovo arresto
    try {
      await discordWebhook.notifyNewArrest({
        arrestId: Number(arrest.id),
        citizenName: citizenData ? `${citizenData.firstname} ${citizenData.lastname}` : 'Sconosciuto',
        charges: charges,
        location: location,
        officerName: `${arrest.officer.name} ${arrest.officer.surname}`,
        department: deptValue,
        sentence: sentence || undefined,
        fine: fine !== undefined ? Number(fine) : undefined,
        description: description || undefined,
        incidentDescription: incidentDescription || undefined,
        seizedItems: seizedItems || undefined,
        accomplices: accomplices || undefined,
        signingOfficers: signingOfficers || undefined,
        date: arrest.date,
      });
    } catch (webhookError) {
      // Non bloccare la creazione dell'arresto se il webhook fallisce
      console.error('Errore durante l\'invio della notifica Discord:', webhookError);
    }

    // 🔴 Notifica real-time a tutti i client connessi
    try {
      notifyArrestCreated(arrestWithCitizen);
    } catch (realtimeError) {
      console.error('Errore notifica realtime:', realtimeError);
    }

    return NextResponse.json({
      arrest: arrestWithCitizen,
      message: "Arresto registrato con successo"
    }, { status: 201 });
  } catch (error) {
    console.error("Errore durante la registrazione dell'arresto:", error);
    // Mostra dettagli più specifici sull'errore
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Errore durante la registrazione dell'arresto";
    return NextResponse.json(
      { 
        error: "Errore durante la registrazione dell'arresto", 
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Endpoint per ottenere tutti gli arresti
export async function GET(req: NextRequest) {
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Ottieni i parametri di query
    const url = new URL(req.url);
    const citizenId = url.searchParams.get('citizenId');
    
    // Costruisci la query in base ai filtri
    const where = citizenId 
      ? { citizenId: parseInt(citizenId) } 
      : {};

    // Ottieni tutti gli arresti usando una query raw per includere tutti i campi
    let arrestsRaw: any[];
    
    if (citizenId) {
      arrestsRaw = await prisma.$queryRaw`
        SELECT * FROM fdo_arrests 
        WHERE citizenId = ${parseInt(citizenId)}
        ORDER BY date DESC
      `;
    } else {
      arrestsRaw = await prisma.$queryRaw`
        SELECT * FROM fdo_arrests 
        ORDER BY date DESC
      `;
    }
    
    // Carica gli officer per ogni arresto
    const arrests = await Promise.all(
      arrestsRaw.map(async (arrest) => {
        const officer = await prisma.user.findUnique({
          where: { id: arrest.officerId },
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true
          }
        });
        
        return {
          ...arrest,
          officer
        };
      })
    );
    
    // Carica i dati dei cittadini per gli arresti usando il modello GameUser
    const arrestsWithCitizens = await Promise.all(
      arrests.map(async (arrest) => {
        const citizenData = await prisma.findGameUserById(arrest.citizenId);
        
        return {
          ...arrest,
          citizen: citizenData
        };
      })
    );

    return NextResponse.json({ arrests: arrestsWithCitizens });
  } catch (error) {
    console.error("Errore durante il recupero degli arresti:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero degli arresti" },
      { status: 500 }
    );
  }
}
