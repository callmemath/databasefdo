import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PermissionRule } from "@/lib/permissions";

export type RouteRulesMap = Record<string, PermissionRule[]>;

// GET /api/config/permissions — Restituisce le regole di accesso per le sezioni
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "route_permissions" },
    });

    const rules: RouteRulesMap = setting ? JSON.parse(setting.value) : {};
    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json(
      { error: "Errore durante il recupero dei permessi" },
      { status: 500 }
    );
  }
}

// PUT /api/config/permissions — Salva le regole di accesso per le sezioni
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const { rules } = await req.json();

    if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
      return NextResponse.json({ error: "Formato non valido" }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key: "route_permissions" },
      update: { value: JSON.stringify(rules) },
      create: { key: "route_permissions", value: JSON.stringify(rules) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Errore durante il salvataggio dei permessi" },
      { status: 500 }
    );
  }
}
