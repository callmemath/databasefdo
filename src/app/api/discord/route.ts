// File: /src/app/api/discord/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

// Verifica il token del bot Discord
function verifyDiscordBotToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  const expectedToken = process.env.DISCORD_BOT_API_TOKEN;
  
  // Verifica che il token sia stato impostato nell'ambiente
  if (!expectedToken) {
    console.error("Token Discord non configurato nelle variabili d'ambiente");
    return false;
  }
  
  // Confronta il token fornito con quello atteso
  return token === expectedToken;
}

// Endpoint per creare un nuovo utente tramite bot Discord
export async function POST(req: NextRequest) {
  // Verifica il token del bot Discord
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Token non valido o non autorizzato" }, { status: 401 });
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
  // Verifica il token del bot Discord
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Token non valido o non autorizzato" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
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
