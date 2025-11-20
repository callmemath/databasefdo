// File: /src/app/api/reports/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/reports/[id] - Ottieni un report specifico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    
    const report = await prisma.report.findUnique({
      where: { id },
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
        },
      }
    });

    if (!report) {
      return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
    }

    // Carica i dati del cittadino e dell'accusato dal database IARP
    let citizenData = null;
    if (report.citizenId) {
      citizenData = await prisma.findGameUserById(report.citizenId);
    }
    
    let accusedData = null;
    if (report.accusedId) {
      accusedData = await prisma.findGameUserById(report.accusedId);
    }

    // Costruisci l'oggetto di risposta con i dati combinati
    const reportWithRelations = {
      ...report,
      citizen: citizenData,
      accused: accusedData
    };

    if (!report) {
      return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
    }

    return NextResponse.json(reportWithRelations);
  } catch (error) {
    console.error("Errore durante il recupero del report:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero del report" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Aggiorna una denuncia specifica
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

    const { id: reportId } = await params;
    
    // Verifica che la denuncia esista
    const reportData = await prisma.$queryRaw`
      SELECT * FROM fdo_reports
      WHERE id = ${reportId}
    `;
    
    const reportArray = reportData as any[];
    if (!reportArray.length) {
      return NextResponse.json({ error: "Denuncia non trovata" }, { status: 404 });
    }

    // Ottieni i dati aggiornati dalla richiesta
    const data = await req.json();
    const { 
      title, 
      description, 
      type, 
      location,
      priority,
      citizenId, 
      accusedId, 
      isAnonymous = false
    } = data;

    // Validazione base dei dati
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

    // Prepara i dati di aggiornamento
    const updatedAt = new Date();

    // Aggiorna la denuncia
    await prisma.$executeRaw`
      UPDATE fdo_reports
      SET
        title = ${title},
        description = ${description},
        type = ${type},
        location = ${location},
        citizenId = ${validatedCitizenId},
        accusedId = ${validatedAccusedId},
        isAnonymous = ${isAnonymous},
        updatedAt = ${updatedAt}
      WHERE id = ${reportId}
    `;

    // Ottieni la denuncia aggiornata
    const updatedReportData = await prisma.$queryRaw`
      SELECT * FROM fdo_reports
      WHERE id = ${reportId}
    `;
    
    const updatedReportArray = updatedReportData as any[];
    const updatedReport = updatedReportArray[0];

    // Ottieni i dati dell'ufficiale
    const officer = await prisma.user.findUnique({
      where: { id: updatedReport.officerId },
      select: {
        id: true,
        name: true,
        surname: true,
        badge: true,
        department: true,
        rank: true,
      }
    });

    // Carica i dati del cittadino e dell'accusato
    let citizenData = null;
    if (updatedReport.citizenId) {
      citizenData = await prisma.findGameUserById(updatedReport.citizenId);
    }
    
    let accusedData = null;
    if (updatedReport.accusedId) {
      accusedData = await prisma.findGameUserById(updatedReport.accusedId);
    }
    
    // Costruisci l'oggetto di risposta
    const reportWithRelations = {
      ...updatedReport,
      officer,
      citizen: citizenData,
      accused: accusedData
    };

    return NextResponse.json({
      report: reportWithRelations,
      message: "Denuncia aggiornata con successo"
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della denuncia:", error);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della denuncia" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Elimina una denuncia specifica
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

    const { id: reportId } = await params;
    
    // Verifica che la denuncia esista
    const reportData = await prisma.$queryRaw`
      SELECT * FROM fdo_reports
      WHERE id = ${reportId}
    `;
    
    const reportArray = reportData as any[];
    if (!reportArray.length) {
      return NextResponse.json({ error: "Denuncia non trovata" }, { status: 404 });
    }

    // Elimina la denuncia
    await prisma.$executeRaw`
      DELETE FROM fdo_reports
      WHERE id = ${reportId}
    `;
    
    return NextResponse.json({
      message: "Denuncia eliminata con successo"
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione della denuncia:", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della denuncia" },
      { status: 500 }
    );
  }
}
