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

    const reqUrl = new URL(req.url);
    const page = parseInt(reqUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(reqUrl.searchParams.get('limit') || '200'), 500);
    const skip = (page - 1) * limit;

    const [total, operators] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          id: true, name: true, surname: true, email: true,
          badge: true, department: true, rank: true, image: true,
          createdAt: true, updatedAt: true,
        },
        orderBy: [{ department: 'asc' }, { rank: 'asc' }, { surname: 'asc' }],
        skip,
        take: limit,
      })
    ]);

    return NextResponse.json({ operators, total, page, limit }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
  } catch (error) {
    console.error("Errore durante il recupero degli operatori:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero degli operatori" },
      { status: 500 }
    );
  }
}
