// File: /src/app/api/citizens/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getApiAuthContext } from "@/lib/api-auth";

// Cache per memorizzare i risultati delle ricerche recenti
const searchCache = new Map<string, { results: any, timestamp: number }>();
const CACHE_TTL = 60000; // 60 secondi di validità della cache

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

  // Algoritmo corrente
  if (/^[0-9a-fA-F]+$/.test(hashPart)) {
    const numericPart = hashPart.substring(0, 8).padEnd(8, '0');
    const rawValue = Number.parseInt(numericPart, 16);
    if (!Number.isNaN(rawValue)) {
      const currentId = (rawValue % maxInt) + 1;
      if (currentId > 0) ids.add(currentId);

      // Variante legacy senza +1
      const legacyId = rawValue % maxInt;
      if (legacyId > 0) ids.add(legacyId);
    }
  }

  // Varianti storiche corte
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

function isMissingTableOrColumnError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022";
  }

  return false;
}

// Endpoint per cercare cittadini
export async function GET(req: NextRequest) {
  console.log("========== CITIZENS API CHIAMATA ==========");
  console.log("URL:", req.url);
  console.log("Timestamp:", new Date().toISOString());
  
  try {
    // Verifica autenticazione tramite sessione o token tablet
    const auth = await getApiAuthContext(req);
    console.log("Sessione:", auth.session ? "Presente" : "Assente");
    
    if (!auth.isAuthorized) {
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
    
    // Per ogni utente, ottieni gli arresti e i rapporti associati.
    // Se le tabelle FDO non sono ancora state create, manteniamo la pagina utilizzabile
    // restituendo array vuoti invece di un errore 500.
    const citizensWithDetails = await Promise.all(
      users.map(async (user: any) => {
        const citizenIdCandidates = getCitizenIdCandidates(user.identifier, user.id);
        let arrests: any[] = [];
        let reports: any[] = [];
        let weaponLicenses: any[] = [];

        try {
          arrests = await prisma.arrest.findMany({
            where: {
              citizenId: {
                in: citizenIdCandidates,
              },
            },
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
        } catch (queryError) {
          if (!isMissingTableOrColumnError(queryError)) {
            throw queryError;
          }
        }

        try {
          reports = await prisma.report.findMany({
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
        } catch (queryError) {
          if (!isMissingTableOrColumnError(queryError)) {
            throw queryError;
          }
        }

        try {
          weaponLicenses = await prisma.weaponLicense.findMany({
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
              expiryDate: true,
            }
          });
        } catch (queryError) {
          if (!isMissingTableOrColumnError(queryError)) {
            throw queryError;
          }
        }
        
        return {
          ...user,
          identifier: user.identifier ?? null,
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
