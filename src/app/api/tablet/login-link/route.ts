import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth";
import { loginAndLinkTabletUser } from "@/lib/tablet-link";

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);

    if (!auth.isServiceToken) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await request.json();
    const email = (body?.email || "").toString().trim().toLowerCase();
    const password = (body?.password || "").toString();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password sono obbligatori" }, { status: 400 });
    }

    const result = await loginAndLinkTabletUser({
      email,
      password,
      identifiers: body?.identifiers || {},
      characterName: body?.characterName || null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      linked: true,
      user: result.user,
    });
  } catch (error: any) {
    console.error("[tablet/login-link] errore:", error);

    const message = error?.message || "Errore interno";
    if (message.includes("identificatore")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
