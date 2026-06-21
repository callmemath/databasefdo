// File: /src/app/api/citizens/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiAuthContext } from "@/lib/api-auth";

function getCitizenIdCandidates(identifier?: string | null, fallbackId?: number): number[] {
  const maxInt = 2147483647;
  const ids = new Set<number>();

  if (Number.isInteger(fallbackId) && (fallbackId as number) > 0) {
    ids.add(fallbackId as number);
  }

  if (!identifier) {
    return Array.from(ids);
  }

  const parts = identifier.split(':');
  const hashPart = parts.length > 1 ? parts[1] : identifier;

  if (/^[0-9a-fA-F]+$/.test(hashPart)) {
    const numericPart = hashPart.substring(0, 8).padEnd(8, '0');
    const rawValue = Number.parseInt(numericPart, 16);
    if (!Number.isNaN(rawValue)) {
      const currentId = (rawValue % maxInt) + 1;
      if (currentId > 0) ids.add(currentId);

      const legacyId = rawValue % maxInt;
      if (legacyId > 0) ids.add(legacyId);
    }
  }

  for (const len of [6, 7, 8]) {
    const chunk = hashPart.substring(0, len);
    if (/^[0-9a-fA-F]+$/.test(chunk)) {
      const parsed = Number.parseInt(chunk, 16);
      if (Number.isInteger(parsed) && parsed > 0) {
        ids.add(parsed);
      }
    }
  }

  return Array.from(ids);
}

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
    const citizenIdCandidates = getCitizenIdCandidates(citizen.identifier, citizenId);
    
    // Includi anche gli arresti e i rapporti associati
    const arrests = await prisma.arrest.findMany({
      where: {
        citizenId: {
          in: citizenIdCandidates,
        },
      },
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
    const reports = await prisma.report.findMany({
      where: {
        citizenId: {
          in: citizenIdCandidates,
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        description: true,
        type: true,
        location: true,
        isAnonymous: true,
        createdAt: true,
        updatedAt: true,
        officerId: true,
        citizenId: true,
        accusedId: true,
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    // Rapporti in cui il cittadino è accusato
    const accusedReports = await prisma.report.findMany({
      where: {
        accusedId: {
          in: citizenIdCandidates,
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        description: true,
        type: true,
        location: true,
        isAnonymous: true,
        createdAt: true,
        updatedAt: true,
        officerId: true,
        citizenId: true,
        accusedId: true,
        officer: {
          select: {
            id: true,
            name: true,
            surname: true,
            badge: true,
            department: true,
            rank: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
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
      where: {
        citizenId: {
          in: citizenIdCandidates,
        },
      },
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
