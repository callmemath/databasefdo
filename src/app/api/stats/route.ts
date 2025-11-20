// File: /src/app/api/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Cache in memoria per le statistiche (5 minuti)
let statsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti in millisecondi

// GET /api/stats - Ottieni statistiche generali per il dashboard
export async function GET(req: NextRequest) {
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Controlla se abbiamo dati in cache validi
    const now = Date.now();
    if (statsCache && (now - statsCache.timestamp) < CACHE_DURATION) {
      console.log('Statistiche servite da cache');
      return NextResponse.json(statsCache.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=300', // 5 minuti
        }
      });
    }

    // Calcola le statistiche in parallelo per massima velocità
    const [
      totalUsers,
      totalArrests,
      totalReports,
      recentArrests,
      recentReports,
      arrestsByDepartment,
      reportsByType
    ] = await Promise.all([
      // Numero totale di utenti
      prisma.user.count(),
      
      // Numero totale di arresti
      prisma.arrest.count(),
      
      // Numero totale di rapporti
      prisma.report.count(),
      
      // Arresti recenti (ultimi 5)
      prisma.arrest.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          officer: {
            select: {
              id: true,
              name: true,
              surname: true,
              department: true
            }
          }
        }
      }),
      
      // Rapporti recenti (ultimi 5)
      prisma.report.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          officer: {
            select: {
              id: true,
              name: true,
              surname: true,
              department: true
            }
          }
        }
      }),
      
      // Arresti per dipartimento - query ottimizzata
      prisma.arrest.groupBy({
        by: ['department'],
        _count: {
          _all: true
        },
        where: {
          department: {
            not: ''
          }
        }
      }),
      
      // Rapporti per tipo
      prisma.report.groupBy({
        by: ['type'],
        _count: {
          _all: true
        }
      })
    ]);

    // Formatta i dati per i grafici
    const departmentArrestStats = arrestsByDepartment.map((item) => ({
      department: item.department || 'Non specificato',
      count: item._count._all
    }));
    
    const reportTypeStats = reportsByType.map((item: { type: string; _count: { _all: number } }) => ({
      type: item.type,
      count: item._count._all
    }));

    // Calcola le statistiche per mese (ultimi 6 mesi) - query ottimizzata
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Ottieni gli arresti degli ultimi 6 mesi
    const recentMonthlyArrests = await prisma.arrest.groupBy({
      by: ['date'],
      _count: {
        _all: true
      },
      where: {
        date: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Formatta i dati mensili
    const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", 
                         "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
    
    const monthlyStats: Record<string, number> = {};
    
    recentMonthlyArrests.forEach((item: { date: Date; _count: { _all: number } }) => {
      const date = new Date(item.date);
      const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = 0;
      }
      
      monthlyStats[monthYear] += item._count._all;
    });
    
    const monthlyArrestStats = Object.entries(monthlyStats).map(([month, count]) => ({
      month,
      count
    }));

    // Carica i dati dei cittadini per gli arresti recenti
    const arrestsWithCitizens = await Promise.all(
      recentArrests.map(async (arrest) => {
        let citizenData = null;
        if (arrest.citizenId) {
          citizenData = await prisma.findGameUserById(arrest.citizenId);
        }
        return {
          ...arrest,
          citizen: citizenData
        };
      })
    );

    // Carica i dati dei cittadini per i report recenti
    const reportsWithCitizens = await Promise.all(
      recentReports.map(async (report) => {
        let citizenData = null;
        let accusedData = null;
        if (report.citizenId) {
          citizenData = await prisma.findGameUserById(report.citizenId);
        }
        if (report.accusedId) {
          accusedData = await prisma.findGameUserById(report.accusedId);
        }
        return {
          ...report,
          citizen: citizenData,
          accused: accusedData
        };
      })
    );

    const responseData = {
      counts: {
        users: totalUsers,
        arrests: totalArrests,
        reports: totalReports
      },
      recent: {
        arrests: arrestsWithCitizens,
        reports: reportsWithCitizens
      },
      charts: {
        departmentArrestStats,
        reportTypeStats,
        monthlyArrestStats
      }
    };

    // Salva in cache
    statsCache = {
      data: responseData,
      timestamp: now
    };

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=300', // 5 minuti
      }
    });
  } catch (error) {
    console.error("Errore durante il recupero delle statistiche:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero delle statistiche" },
      { status: 500 }
    );
  }
}
