import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth";
import { resolveTabletLinkedUser } from "@/lib/tablet-link";

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);

    if (!auth.isServiceToken) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await request.json();
    const identifiers = body?.identifiers || {};
    const characterName = body?.characterName || null;

    const result = await resolveTabletLinkedUser({ identifiers, characterName });

    if (!result.linked) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      user: result.user,
    });
  } catch (error) {
    console.error("[tablet/auth-status] errore:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
