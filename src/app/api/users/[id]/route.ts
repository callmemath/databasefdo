import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

// Verifica il token amministratore
function verifyAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === process.env.ADMIN_API_SECRET;
}

// GET per recuperare un utente specifico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica se il token amministratore è valido
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        badge: true,
        department: true,
        rank: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        // Non includiamo la password
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Errore durante il recupero dell'utente:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero dell'utente" },
      { status: 500 }
    );
  }
}

// PUT per aggiornare un utente specifico
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica se il token amministratore è valido
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();
  const { name, surname, email, password, badge, department, rank, image, isAdmin } = data;

  try {
    // Verifica se l'utente esiste
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    // Prepara l'oggetto di aggiornamento
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (surname !== undefined) updateData.surname = surname;
    if (email !== undefined) updateData.email = email;
    if (badge !== undefined) updateData.badge = badge;
    if (department !== undefined) updateData.department = department;
    if (rank !== undefined) updateData.rank = rank;
    if (image !== undefined) updateData.image = image;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    // Aggiorna la password solo se fornita
    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        badge: true,
        department: true,
        rank: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      user: updatedUser,
      message: "Utente aggiornato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'utente:", error);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento dell'utente" },
      { status: 500 }
    );
  }
}

// DELETE per eliminare un utente specifico
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica se il token amministratore è valido
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verifica se l'utente esiste
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    // Elimina l'utente
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Utente eliminato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'utente:", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione dell'utente" },
      { status: 500 }
    );
  }
}
