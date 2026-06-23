// File: /src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { discordWebhook } from "@/lib/discord-webhook";
import { getApiAuthContext } from "@/lib/api-auth";

// Endpoint per creare un nuovo rapporto
export async function POST(req: NextRequest) {
  try {
    // Verifica autenticazione tramite sessione o token tablet
    const auth = await getApiAuthContext(req);
    
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    if (!auth.officerId) {
      return NextResponse.json(
        { error: "Configurazione mancante: imposta FDO_TABLET_OFFICER_ID per richieste con token API" },
        { status: 500 }
      );
    }

    const data = await req.json();
    const { title, description, citizenId, accusedId, type, location, isAnonymous = false } = data;

    // Validazione dei dati
    if (!title || !description || !type || !location) {
      return NextResponse.json(
        { error: "I campi titolo, descrizione, tipo e luogo sono obbligatori" },
        { status: 400 }
      );
    }

    // Se è specificato un ID cittadino, verifica che esista
    let validatedCitizenId = null;
    if (citizenId) {
      const citizenIdNumber = parseInt(citizenId);
      const citizen = await prisma.findGameUserById(citizenIdNumber);

      if (!citizen) {
        return NextResponse.json(
          { error: "Cittadino non trovato" },
          { status: 404 }
        );
      }
      
      validatedCitizenId = citizenIdNumber;
    }
    
    // Se è specificato un ID dell'accusato, verifica che esista
    let validatedAccusedId = null;
    if (accusedId) {
      const accusedIdNumber = parseInt(accusedId);
      const accused = await prisma.findGameUserById(accusedIdNumber);

      if (!accused) {
        return NextResponse.json(
          { error: "Accusato non trovato" },
          { status: 404 }
        );
      }
      
      validatedAccusedId = accusedIdNumber;
    }

    // Ottieni l'ID dell'ufficiale dalla sessione o da configurazione tablet
    const officerId = auth.officerId;

    // Crea il nuovo rapporto
    // Usiamo prisma.$queryRaw per aggirare i problemi con il tipo
    const reportData = {
      id: `rep_${Date.now()}`,
      title,
      description,
      type,
      location,
      isAnonymous,
      officerId,
      citizenId: validatedCitizenId,
      accusedId: validatedAccusedId,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Creiamo il report usando una query SQL
    await prisma.$executeRaw`
      INSERT INTO fdo_reports (
        id, title, description, type, location, isAnonymous,
        officerId, citizenId, accusedId, date, createdAt, updatedAt
      )
      VALUES (
        ${reportData.id}, ${reportData.title}, ${reportData.description},
        ${reportData.type}, ${reportData.location}, ${reportData.isAnonymous},
        ${reportData.officerId}, ${reportData.citizenId}, ${reportData.accusedId},
        ${reportData.date}, ${reportData.createdAt}, ${reportData.updatedAt}
      )
    `;
    
    // Otteniamo i dati dell'ufficiale
    const officer = await prisma.user.findUnique({
      where: { id: officerId },
      select: {
        id: true,
        name: true,
        surname: true,
        badge: true,
        department: true,
        rank: true,
      }
    });
    
    // Creiamo manualmente l'oggetto report
    const report = {
      ...reportData,
      officer
    };
    
    // Se c'è un cittadino, caricalo manualmente
    let citizenData = null;
    if (validatedCitizenId) {
      citizenData = await prisma.findGameUserById(validatedCitizenId);
    }
    
    // Se c'è un accusato, caricalo manualmente
    let accusedData = null;
    if (validatedAccusedId) {
      accusedData = await prisma.findGameUserById(validatedAccusedId);
    }
    
    // Aggiungi i dati del cittadino e dell'accusato alla risposta
    const reportWithRelations = {
      ...report,
      citizen: citizenData,
      accused: accusedData
    };

    // 🔔 Invia notifica Discord per nuova denuncia
    try {
      await discordWebhook.notifyNewReport({
        reportId: Number(reportData.id.replace('rep_', '')),
        title: title,
        type: type,
        location: location,
        citizenName: citizenData ? `${citizenData.firstname} ${citizenData.lastname}` : undefined,
        accusedName: accusedData ? `${accusedData.firstname} ${accusedData.lastname}` : undefined,
        officerName: officer ? `${officer.name} ${officer.surname}` : 'Sconosciuto',
        isAnonymous: isAnonymous,
      });
    } catch (webhookError) {
      // Non bloccare la creazione della denuncia se il webhook fallisce
      console.error('Errore durante l\'invio della notifica Discord:', webhookError);
    }

    return NextResponse.json({
      report: reportWithRelations,
      message: "Rapporto creato con successo"
    }, { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione del rapporto:", error);
    return NextResponse.json(
      { error: "Errore durante la creazione del rapporto" },
      { status: 500 }
    );
  }
}

// Endpoint per ottenere tutti i rapporti
export async function GET(req: NextRequest) {
  try {
    // Verifica autenticazione tramite sessione o token tablet
    const auth = await getApiAuthContext(req);
    
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const reqUrl = new URL(req.url);
    const citizenId = reqUrl.searchParams.get('citizenId');
    const type = reqUrl.searchParams.get('type');
    const page = parseInt(reqUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(reqUrl.searchParams.get('limit') || '50'), 200);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (citizenId) where.citizenId = parseInt(citizenId);
    if (type) where.type = type;

    // Singola query con officer incluso — elimina N+1 officer loop + $queryRaw senza LIMIT
    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          officer: {
            select: { id: true, name: true, surname: true, badge: true, department: true, rank: true }
          }
        }
      })
    ]);

    // Batch IARP lookup — cittadini + accusati in 1 full-scan
    const allCitizenIds = [
      ...reports.map((r: any) => r.citizenId).filter(Boolean),
      ...reports.map((r: any) => r.accusedId).filter(Boolean),
    ] as number[];
    const citizenMap = await prisma.findGameUsersByIds([...new Set(allCitizenIds)]);

    const reportsWithRelations = reports.map((report: any) => ({
      ...report,
      citizen: report.citizenId ? (citizenMap.get(report.citizenId) || null) : null,
      accused: report.accusedId ? (citizenMap.get(report.accusedId) || null) : null,
    }));

    return NextResponse.json({ reports: reportsWithRelations, total, page, limit }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error("Errore durante il recupero dei rapporti:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero dei rapporti" },
      { status: 500 }
    );
  }
}
