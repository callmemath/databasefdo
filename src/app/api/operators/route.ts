import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Endpoint per ottenere tutti gli operatori
export async function GET(req: NextRequest) {
  try {
    // Verifica autenticazione tramite sessione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Ottieni gli operatori con i dati necessari
    const operators = await prisma.user.findMany({
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
        // Non includiamo la password per sicurezza
      },
      orderBy: [
        { department: 'asc' },
        { rank: 'asc' },
        { surname: 'asc' }
      ]
    });

    return NextResponse.json({ operators });
  } catch (error) {
    console.error("Errore durante il recupero degli operatori:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero degli operatori" },
      { status: 500 }
    );
  }
}
