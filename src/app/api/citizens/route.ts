// File: /src/app/api/citizens/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Cache per memorizzare i risultati delle ricerche recenti
const searchCache = new Map<string, { results: any, timestamp: number }>();
const CACHE_TTL = 60000; // 60 secondi di validità della cache

// Endpoint per cercare cittadini
export async function GET(req: NextRequest) {
  console.log("========== CITIZENS API CHIAMATA ==========");
  console.log("URL:", req.url);
  console.log("Timestamp:", new Date().toISOString());
  
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    console.log("Sessione:", session ? "Presente" : "Assente");
    
    if (!session || !session.user) {
      console.log("ERRORE: Non autorizzato - sessione mancante");
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Ottieni i parametri di ricerca
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q') || "";
    const page = parseInt(url.searchParams.get('page') || "1");
    const limit = Math.min(parseInt(url.searchParams.get('limit') || "10"), 50); // Limita a massimo 50 per evitare overload
    const skip = (page - 1) * limit;
    
    // Ignora parametri di cache-busting come timestamp
    const cacheKey = `${searchQuery}-${page}-${limit}`;
    
    // Verifica se abbiamo già questa ricerca in cache
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`[CACHE HIT] Usando risultati in cache per: "${searchQuery}" (page: ${page}, limit: ${limit})`);
      return NextResponse.json(cachedResult.results);
    }
    
    console.log(`[CACHE MISS] Cercando cittadini con query: "${searchQuery}" (page: ${page}, limit: ${limit})`);
    
    // Prepara la query di ricerca avanzata in modo più efficiente
    let searchWhere = {};
    
    if (searchQuery.trim()) {
      // Estrai termini significativi (ignorando termini troppo brevi)
      const searchTerms = searchQuery.trim()
        .split(' ')
        .filter(term => term.length > 1);
      
      // Crea una struttura OR più efficiente per ridurre le query ridondanti
      const OR = [];
      
      // Aggiungi prima la ricerca esatta del nome completo
      if (searchQuery.length > 2) {
        OR.push(
          { firstname: { contains: searchQuery } },
          { lastname: { contains: searchQuery } }
        );
      }
      
      // Se ci sono più termini e sono diversi dalla query completa, aggiungili solo se necessario
      if (searchTerms.length > 1) {
        // Usa solo i termini che non sono già inclusi nella query completa
        for (const term of searchTerms) {
          // Aggiungi il termine solo se è abbastanza lungo e non è già stato cercato
          if (term.length > 2) {
            OR.push(
              { firstname: { contains: term } },
              { lastname: { contains: term } }
            );
          }
        }
      }
      
      searchWhere = { OR };
    }
    
    // Utilizziamo i metodi estesi integrati direttamente nel client Prisma
    const { data: users, total: totalCount } = await prisma.findGameUsers({
      where: searchWhere,
      skip,
      take: limit
    });
    
    // Per ogni utente, ottieni gli arresti e i rapporti associati
    const citizensWithDetails = await Promise.all(
      users.map(async (user: any) => {
        const arrests = await prisma.arrest.findMany({
          where: { citizenId: user.id },
          select: {
            id: true,
            date: true,
            charges: true,
            officer: {
              select: {
                id: true,
                name: true,
                surname: true,
                badge: true,
              }
            }
          }
        });
        
        const reports = await prisma.report.findMany({
          where: { citizenId: user.id },
          select: {
            id: true,
            title: true,
            date: true,
            description: true,
            type: true,
            location: true,
            isAnonymous: true,
            officer: {
              select: {
                id: true,
                name: true,
                surname: true,
                badge: true,
              }
            }
          }
        });
        
        // Ottieni i porto d'armi attivi
        const weaponLicenses = await prisma.weaponLicense.findMany({
          where: { citizenId: user.id },
          select: {
            id: true,
            licenseNumber: true,
            licenseType: true,
            status: true,
            expiryDate: true,
          }
        });
        
        return {
          ...user,
          arrests,
          reports,
          weaponLicenses
        };
      })
    );

    // Calcola il numero totale di pagine
    const totalPages = Math.ceil(totalCount / limit);

    // Prepara i risultati
    const results = {
      citizens: citizensWithDetails,
      total: totalCount,
      page,
      limit,
      totalPages
    };
    
    // Salva i risultati in cache
    searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
    
    // Pulizia della cache se diventa troppo grande (opzionale)
    if (searchCache.size > 100) {
      const oldestEntries = [...searchCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 50);
      
      oldestEntries.forEach(([key]) => searchCache.delete(key));
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("========== ERRORE CITIZENS API ==========");
    console.error("Messaggio:", error?.message || "Nessun messaggio");
    console.error("Codice:", error?.code || "Nessun codice");
    console.error("Stack:", error?.stack || "Nessuno stack");
    console.error("Errore completo:", JSON.stringify(error, null, 2));
    console.error("==========================================");
    return NextResponse.json(
      { error: "Errore durante la ricerca dei cittadini", details: error?.message },
      { status: 500 }
    );
  }
}
