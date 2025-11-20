import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { discordWebhook } from "@/lib/discord-webhook";

// Verifica il token API
async function verifyApiToken(req: NextRequest): Promise<boolean> {
  // Controllo sia l'header Authorization che x-api-key per compatibilità
  let token = null;
  const authHeader = req.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = req.headers.get('x-api-key');
  }
  
  if (!token) return false;
  
  // Cerca il token nel database
  const apiToken = await prisma.apiToken.findUnique({
    where: { token },
  });
  
  // Verifica se il token è valido e non è scaduto
  if (!apiToken) return false;
  
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return false;
  }
  
  // Aggiorna l'ultimo utilizzo del token
  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsed: new Date() }
  });
  
  return true;
}

export async function POST(req: NextRequest) {
  // Verifica se il token API è valido
  const isValidToken = await verifyApiToken(req);
  if (!isValidToken) {
    return NextResponse.json({ error: "Token API non valido o scaduto" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { name, surname, email, password, badge, department, rank } = data;

    // Validazione dei dati
    if (!name || !surname || !email || !password || !badge || !department || !rank) {
      return NextResponse.json(
        { error: "Tutti i campi sono obbligatori" },
        { status: 400 }
      );
    }

    // Verifica se l'email o il badge sono già utilizzati
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { badge }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email o Badge già in uso" },
        { status: 400 }
      );
    }

    // Hash della password
    const hashedPassword = await hash(password, 10);

    // Crea il nuovo utente
    const user = await prisma.user.create({
      data: {
        name,
        surname,
        email,
        password: hashedPassword,
        badge,
        department,
        rank,
      },
    });

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    // 🔔 Invia notifica Discord per nuovo operatore
    try {
      await discordWebhook.notifyNewOperator({
        operatorId: Number(user.id),
        name: name,
        surname: surname,
        badge: badge,
        department: department,
        rank: rank,
      });
    } catch (webhookError) {
      // Non bloccare la creazione dell'operatore se il webhook fallisce
      console.error('Errore durante l\'invio della notifica Discord:', webhookError);
    }

    return NextResponse.json({
      user: userWithoutPassword,
      message: "Utente creato con successo"
    }, { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione dell'utente:", error);
    return NextResponse.json(
      { error: "Errore durante la creazione dell'utente" },
      { status: 500 }
    );
  }
}

// Endpoint per ottenere tutti gli utenti
export async function GET(req: NextRequest) {
  try {
    // Supporta sia l'autenticazione tramite token API che tramite sessione
    const isValidToken = await verifyApiToken(req);
    
    // Se non abbiamo un token API valido, verifichiamo la sessione
    if (!isValidToken) {
      // Importiamo getServerSession e authOptions qui per evitare errori di importazione circolare
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
      }
    }

    // Ottieni i parametri di query
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q') || "";
    
    // Se c'è una query di ricerca, filtriamo i risultati
    // MySQL non supporta mode: 'insensitive', quindi usiamo solo contains
    // La ricerca sarà comunque case-insensitive perché MySQL lo è di default
    const whereClause = searchQuery ? {
      OR: [
        { name: { contains: searchQuery } },
        { surname: { contains: searchQuery } },
        { email: { contains: searchQuery } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        badge: true,
        department: true,
        rank: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        // Non includiamo la password
      },
      orderBy: {
        surname: 'asc'
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Errore durante il recupero degli utenti:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero degli utenti" },
      { status: 500 }
    );
  }
}
