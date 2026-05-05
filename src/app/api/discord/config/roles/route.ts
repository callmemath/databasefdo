// File: /src/app/api/discord/config/roles/route.ts
// Endpoint chiamato dal bot per scaricare la configurazione gradi/ruoli Discord
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildDefaultRolesConfig } from "@/lib/permissions";

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

// GET /api/discord/config/roles
export async function GET(req: NextRequest) {
  if (!verifyDiscordBotToken(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "fdo_roles_config" },
    });

    const config = setting ? JSON.parse(setting.value) : buildDefaultRolesConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Errore durante il recupero della configurazione ruoli:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero della configurazione" },
      { status: 500 }
    );
  }
}
