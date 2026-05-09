// GET /api/discord/by-discord/:discordId — cerca un utente tramite Discord ID
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ discordId: string }> }
) {
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { discordId } = await params;

  if (!discordId) {
    return NextResponse.json({ error: "discordId mancante" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { discordId },
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
        discordId: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Errore durante la ricerca per discordId:", error);
    return NextResponse.json(
      { error: "Errore durante la ricerca dell'utente" },
      { status: 500 }
    );
  }
}
