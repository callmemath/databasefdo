// File: /src/app/api/token/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/token/verify - Verifica la validità di un token API
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { error: "Token non fornito" },
        { status: 400 }
      );
    }
    
    // Cerca il token nel database
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            badge: true,
            department: true,
            rank: true,
          }
        }
      }
    });
    
    // Verifica se il token esiste
    if (!apiToken) {
      return NextResponse.json(
        { valid: false, message: "Token non valido" },
        { status: 200 }
      );
    }
    
    // Verifica se il token è scaduto
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, message: "Token scaduto" },
        { status: 200 }
      );
    }
    
    // Aggiorna l'ultimo utilizzo del token
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() }
    });
    
    // Token valido
    return NextResponse.json({
      valid: true,
      message: "Token valido",
      tokenName: apiToken.name,
      user: apiToken.user,
      expiresAt: apiToken.expiresAt,
    });
    
  } catch (error) {
    console.error("Errore durante la verifica del token:", error);
    return NextResponse.json(
      { error: "Errore durante la verifica del token" },
      { status: 500 }
    );
  }
}
