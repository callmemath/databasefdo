// File: /src/app/api/config/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildDefaultRolesConfig, RolesConfig } from "@/lib/permissions";

// GET /api/config/roles — Restituisce la config attuale (per la UI admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "fdo_roles_config" },
    });
    const config: RolesConfig = setting
      ? JSON.parse(setting.value)
      : buildDefaultRolesConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Errore durante il recupero della configurazione ruoli:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero della configurazione" },
      { status: 500 }
    );
  }
}

// PUT /api/config/roles — Salva la config aggiornata
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Formato non valido" }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key: "fdo_roles_config" },
      update: { value: JSON.stringify(body) },
      create: { key: "fdo_roles_config", value: JSON.stringify(body) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Errore durante il salvataggio della configurazione ruoli:", error);
    return NextResponse.json(
      { error: "Errore durante il salvataggio" },
      { status: 500 }
    );
  }
}
