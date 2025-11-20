// File: /src/app/api/citizens/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/citizens/[id] - Ottieni i dettagli di un cittadino specifico
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

    const { id } = await params;
    const citizenId = parseInt(id);
    
    if (isNaN(citizenId)) {
      return NextResponse.json({ error: "ID cittadino non valido" }, { status: 400 });
    }
    
    // Utilizziamo i metodi estesi integrati direttamente nel client Prisma
    const citizen = await prisma.findGameUserById(citizenId);
    
    // Includi anche gli arresti e i rapporti associati
    const arrests = await prisma.arrest.findMany({
      where: { citizenId },
      select: {
        id: true,
        date: true,
        location: true,
        description: true,
        charges: true,
        sentence: true,
        fine: true,
        createdAt: true,
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
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Rapporti in cui il cittadino è il denunciante
    const reportsData = await prisma.$queryRaw`
      SELECT r.*, 
        u.id as officer_id, u.name as officer_name, u.surname as officer_surname, 
        u.badge as officer_badge, u.department as officer_department, u.rank as officer_rank
      FROM fdo_reports r
      LEFT JOIN fdo_users u ON r.officerId = u.id
      WHERE r.citizenId = ${citizenId}
      ORDER BY r.date DESC
    `;
    
    // Trasformiamo i dati grezzi in un formato più strutturato
    const reports = Array.isArray(reportsData) ? reportsData.map((report: any) => ({
      id: report.id,
      title: report.title,
      date: report.date,
      description: report.description,
      type: report.type,
      location: report.location,
      isAnonymous: report.isAnonymous === 1, // Converti da 0/1 a boolean
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      officerId: report.officerId,
      citizenId: report.citizenId,
      accusedId: report.accusedId,
      officer: {
        id: report.officer_id,
        name: report.officer_name,
        surname: report.officer_surname,
        badge: report.officer_badge,
        department: report.officer_department,
        rank: report.officer_rank
      }
    })) : [];
    
    // Rapporti in cui il cittadino è accusato
    const accusedReportsData = await prisma.$queryRaw`
      SELECT r.*, 
        u.id as officer_id, u.name as officer_name, u.surname as officer_surname, 
        u.badge as officer_badge, u.department as officer_department, u.rank as officer_rank
      FROM fdo_reports r
      LEFT JOIN fdo_users u ON r.officerId = u.id
      WHERE r.accusedId = ${citizenId}
      ORDER BY r.date DESC
    `;
    
    // Trasformiamo i dati grezzi in un formato più strutturato
    const accusedReports = Array.isArray(accusedReportsData) ? accusedReportsData.map((report: any) => ({
      id: report.id,
      title: report.title,
      date: report.date,
      description: report.description,
      type: report.type,
      location: report.location,
      isAnonymous: report.isAnonymous === 1, // Converti da 0/1 a boolean
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      officerId: report.officerId,
      citizenId: report.citizenId,
      accusedId: report.accusedId,
      officer: {
        id: report.officer_id,
        name: report.officer_name,
        surname: report.officer_surname,
        badge: report.officer_badge,
        department: report.officer_department,
        rank: report.officer_rank
      }
    })) : [];
    
    // Per i report in cui il cittadino è accusato, carichiamo anche i dati del denunciante
    const enrichedAccusedReports = await Promise.all(accusedReports.map(async (report) => {
      const result = { ...report };
      
      if (report.citizenId) {
        const citizen = await prisma.findGameUserById(report.citizenId);
        if (citizen) {
          // Aggiungiamo il denunciante ai dati del report
          (result as any).citizen = citizen;
        }
      }
      
      return result;
    }));
    
    // Carica i porto d'armi del cittadino
    const weaponLicenses = await prisma.weaponLicense.findMany({
      where: { citizenId },
      select: {
        id: true,
        licenseNumber: true,
        licenseType: true,
        status: true,
        issueDate: true,
        expiryDate: true,
        issuingAuthority: true,
        restrictions: true,
        authorizedWeapons: true,
        notes: true,
        createdAt: true,
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!citizen) {
      return NextResponse.json({ error: "Cittadino non trovato" }, { status: 404 });
    }
    
    // Combina i risultati
    const citizenWithDetails = {
      ...citizen, // non serve più prendere il primo elemento perché findGameUserById restituisce già l'oggetto
      arrests,
      reports,
      accusedReports: enrichedAccusedReports,
      weaponLicenses
    };

    return NextResponse.json({ citizen: citizenWithDetails });
  } catch (error) {
    console.error("Errore durante il recupero del cittadino:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero del cittadino" },
      { status: 500 }
    );
  }
}
