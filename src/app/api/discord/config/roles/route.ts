// File: /src/app/api/discord/config/roles/route.ts
// Endpoint chiamato dal bot per scaricare la configurazione gradi/ruoli Discord
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildDefaultRolesConfig, RolesConfig, RankConfig } from "@/lib/permissions";

function normalizeRoleIds(config: RolesConfig): RolesConfig {
  const result: RolesConfig = {};
  for (const [deptName, deptData] of Object.entries(config)) {
    result[deptName] = {
      ...deptData,
      dept_id: String(deptData.dept_id),
      dept_role_id: String(deptData.dept_role_id ?? "0"),
      transfer_forum_id: deptData.transfer_forum_id ? String(deptData.transfer_forum_id) : null,
      ranks: deptData.ranks.map((r: RankConfig) => ({
        ...r,
        role_id: String(r.role_id),
      })),
    };
  }
  return result;
}

/** Converte i numeri interi grandi (snowflake Discord) in stringhe prima che JSON.parse li tronchi. */
function parseSafeJson(raw: string): RolesConfig {
  const safe = raw.replace(/:[ \t]*(\d{15,})([,}\]])/g, ': "$1"$2');
  return JSON.parse(safe);
}

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

    const config = setting ? parseSafeJson(setting.value) : buildDefaultRolesConfig();
    return NextResponse.json(normalizeRoleIds(config));
  } catch (error) {
    console.error("Errore durante il recupero della configurazione ruoli:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero della configurazione" },
      { status: 500 }
    );
  }
}
