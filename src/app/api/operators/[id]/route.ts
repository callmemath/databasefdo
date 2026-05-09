import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/operators/[id] - Ottieni i dettagli di un operatore specifico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;

    const operator = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        badge: true,
        department: true,
        deptId: true,
        rank: true,
        rankId: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        arrestsAsOfficer: {
          select: {
            id: true,
            date: true,
            location: true,
            description: true,
            charges: true,
            sentence: true,
            fine: true,
            citizenId: true,
            createdAt: true,
          },
          orderBy: { date: "desc" },
        },
        reportsAsOfficer: {
          select: {
            id: true,
            date: true,
            type: true,
            description: true,
            location: true,
            createdAt: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!operator) {
      return NextResponse.json(
        { error: "Operatore non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({ operator });
  } catch (error) {
    console.error("Errore durante il recupero dell'operatore:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero dell'operatore" },
      { status: 500 }
    );
  }
}
