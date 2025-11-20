// File: /src/app/api/discord/user/[id]/route.ts
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

// GET /api/discord/user/[id] - Ottieni un utente specifico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica se il token Discord è valido
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    // Cerca l'utente per ID
    const user = await prisma.user.findUnique({
      where: { id },
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
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Errore durante il recupero dell'utente:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero dell'utente" },
      { status: 500 }
    );
  }
}

// PUT /api/discord/user/[id] - Aggiorna un utente specifico
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica il token del bot Discord
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Token non valido o non autorizzato" }, { status: 401 });
  }

  try {
    const { id: userId } = await params;
    const data = await req.json();
    
    // Verifica se l'utente esiste
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }
    
    // Prepara i dati per l'aggiornamento
    const updateData: any = {};
    
    // Aggiorna solo i campi forniti
    if (data.name) updateData.name = data.name;
    if (data.surname) updateData.surname = data.surname;
    if (data.email) updateData.email = data.email;
    if (data.badge) updateData.badge = data.badge;
    if (data.department) updateData.department = data.department;
    if (data.rank) updateData.rank = data.rank;
    if (data.image) updateData.image = data.image;
    
    // Se è fornita una nuova password, hashala
    if (data.password) {
      updateData.password = await hash(data.password, 10);
    }
    
    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
      }
    });
    
    return NextResponse.json({
      user: updatedUser,
      message: "Utente aggiornato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'utente:", error);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento dell'utente" },
      { status: 500 }
    );
  }
}

// DELETE /api/discord/user/[id] - Elimina un utente specifico
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica il token del bot Discord
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Token non valido o non autorizzato" }, { status: 401 });
  }

  try {
    const { id: userId } = await params;
    
    // Verifica se l'utente esiste
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }
    
    // Elimina l'utente
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({
      message: "Utente eliminato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'utente:", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione dell'utente" },
      { status: 500 }
    );
  }
}
