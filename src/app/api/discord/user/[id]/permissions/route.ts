// File: /src/app/api/discord/user/[id]/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDeptName, getRankName } from "@/lib/permissions";

function verifyDiscordBotToken(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.substring(7);
  const expectedToken = process.env.DISCORD_BOT_API_TOKEN;
  if (!expectedToken) {
    console.error("Token Discord non configurato nelle variabili d'ambiente");
    return false;
  }
  return token === expectedToken;
}

// GET /api/discord/user/[id]/permissions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { deptId: true, rankId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    const deptId = user.deptId ?? 0;
    const rankId = user.rankId ?? 0;

    return NextResponse.json({
      deptId,
      deptName: getDeptName(deptId),
      rankId,
      rankName: getRankName(deptId, rankId),
    });
  } catch (error) {
    console.error("Errore durante il recupero dei permessi:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero dei permessi" },
      { status: 500 }
    );
  }
}
