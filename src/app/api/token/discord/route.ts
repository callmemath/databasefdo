// File: /src/app/api/token/discord/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

// Funzione per generare un token casuale
function generateToken(length: number = 64): string {
  return randomBytes(length).toString("hex");
}

// POST /api/token/discord - Genera un nuovo token per il bot Discord
export async function POST(req: NextRequest) {
  try {
    // Ottieni il primo utente disponibile per associare il token
    // In un'implementazione reale, potresti voler richiedere l'autenticazione
    // o usare un sistema più sofisticato per gestire l'autorizzazione
    const firstUser = await prisma.user.findFirst();
    
    if (!firstUser) {
      return NextResponse.json(
        { error: "Nessun utente disponibile per creare il token" },
        { status: 404 }
      );
    }
    
    // Controlla se esiste già un token Discord
    const existingToken = await prisma.apiToken.findFirst({
      where: {
        name: "Discord Bot Token",
      },
    });
    
    let token;
    
    if (existingToken) {
      // Aggiorna il token esistente
      token = await prisma.apiToken.update({
        where: { id: existingToken.id },
        data: {
          token: generateToken(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Scade tra un anno
          lastUsed: null,
        },
      });
    } else {
      // Crea un nuovo token
      token = await prisma.apiToken.create({
        data: {
          token: generateToken(),
          name: "Discord Bot Token",
          userId: firstUser.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Scade tra un anno
        },
      });
    }
    
    return NextResponse.json({
      token: token.token,
      expiresAt: token.expiresAt,
      message: "Token Discord generato con successo",
    });
  } catch (error) {
    console.error("Errore durante la creazione del token Discord:", error);
    return NextResponse.json(
      { error: "Errore durante la creazione del token Discord" },
      { status: 500 }
    );
  }
}
