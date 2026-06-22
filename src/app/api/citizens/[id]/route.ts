// File: /src/app/api/citizens/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiAuthContext } from "@/lib/api-auth";

// GET /api/citizens/[id] - Ottieni i dettagli di un cittadino specifico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione tramite sessione o token tablet
    const auth = await getApiAuthContext(req);
    
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const numericCitizenId = Number.parseInt(id, 10);
    const isNumericId = !Number.isNaN(numericCitizenId) && String(numericCitizenId) === id;

    // Prima proviamo il lookup per identifier reale; se il parametro è il vecchio ID numerico,
    // manteniamo la compatibilità con il formato già in uso altrove.
    let citizen = isNumericId
      ? await prisma.findGameUserById(numericCitizenId)
      : await prisma.findGameUserByIdentifier(id);

    if (!citizen && isNumericId) {
      citizen = await prisma.findGameUserByIdentifier(id);
    }

    if (!citizen) {
      return NextResponse.json({ error: "Cittadino non trovato" }, { status: 404 });
    }

    const citizenId = citizen.id;
    
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
    
    // Batch lookup denuncianti — 1 full-scan invece di N
    const accusedReportCitizenIds = [...new Set(
      accusedReports.map(r => r.citizenId).filter(Boolean) as number[]
    )];
    const accusedReportCitizenMap = accusedReportCitizenIds.length > 0
      ? await prisma.findGameUsersByIds(accusedReportCitizenIds)
      : new Map();

    const enrichedAccusedReports = accusedReports.map(report => ({
      ...report,
      citizen: report.citizenId ? (accusedReportCitizenMap.get(report.citizenId) || null) : null,
    }));
    
    // Carica i porto d'armi del cittadino
    // Try/catch: se il client Prisma non è ancora rigenerato dopo la migrazione delle date
    // nullable, il primo tentativo (con issueDate/expiryDate) potrebbe fallire.
    // In tal caso si ritenta senza quei campi finché non viene eseguito `prisma generate`.
    let weaponLicenses: any[] = [];
    try {
      weaponLicenses = await prisma.weaponLicense.findMany({
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
        orderBy: { createdAt: 'desc' }
      });
    } catch {
      // Fallback senza campi potenzialmente null (client non ancora rigenerato)
      weaponLicenses = await prisma.weaponLicense.findMany({
        where: { citizenId },
        select: {
          id: true,
          licenseNumber: true,
          licenseType: true,
          status: true,
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
        orderBy: { createdAt: 'desc' }
      });
    }
    
    // Combina i risultati
    const citizenWithDetails = {
      ...citizen,
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
