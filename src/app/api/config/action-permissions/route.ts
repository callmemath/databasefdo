import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PermissionRule } from "@/lib/permissions";

export type ActionRulesMap = Record<string, PermissionRule[]>;

// GET /api/config/action-permissions — Restituisce le regole per le azioni UI
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "action_permissions" },
    });

    const rules: ActionRulesMap = setting ? JSON.parse(setting.value) : {};
    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json(
      { error: "Errore durante il recupero dei permessi azione" },
      { status: 500 }
    );
  }
}

// PUT /api/config/action-permissions — Salva le regole per le azioni UI
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
      where: { key: "action_permissions" },
      update: { value: JSON.stringify(rules) },
      create: { key: "action_permissions", value: JSON.stringify(rules) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Errore durante il salvataggio dei permessi azione" },
      { status: 500 }
    );
  }
}
