import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Attiva una richiesta di porto d'armi pendente
// Chiamato da iarp-legal-docs quando viene creato il documento
export async function POST(request: NextRequest) {
  try {
    // Autenticazione tramite API token (stesso sistema del tablet)
    const authHeader = request.headers.get('authorization');
    const xApiToken = request.headers.get('x-api-token');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : xApiToken;

    if (!token) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 401 });
    }

    // Verifica il token
    const apiToken = await prisma.apiToken.findFirst({
      where: { token, isActive: true },
    });

    if (!apiToken) {
      return NextResponse.json({ error: 'Token non valido o revocato' }, { status: 401 });
    }

    const body = await request.json();
    const { licenseNumber } = body;

    if (!licenseNumber) {
      return NextResponse.json(
        { error: 'licenseNumber obbligatorio' },
        { status: 400 }
      );
    }

    // Trova la richiesta pendente
    const license = await prisma.weaponLicense.findUnique({
      where: { licenseNumber },
    });

    if (!license) {
      return NextResponse.json(
        { error: 'Richiesta porto d\'armi non trovata' },
        { status: 404 }
      );
    }

    if (license.status !== 'pending') {
      return NextResponse.json(
        { error: `Impossibile attivare: la licenza è in stato "${license.status}"` },
        { status: 400 }
      );
    }

    // Calcola date: rilascio oggi, scadenza tra 5 anni
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);

    const activated = await prisma.weaponLicense.update({
      where: { licenseNumber },
      data: {
        status: 'active',
        issueDate,
        expiryDate,
      },
    });

    return NextResponse.json({ license: activated, message: 'Porto d\'armi attivato con successo' });
  } catch (error) {
    console.error('Errore nell\'attivazione del porto d\'armi:', error);
    return NextResponse.json(
      { error: 'Errore nell\'attivazione del porto d\'armi' },
      { status: 500 }
    );
  }
}
