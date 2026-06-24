import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hasValidTabletApiToken } from '@/lib/api-auth';

// POST - Endpoint unificato per attivare licenze FDO pendenti
// Supporta: porto d'armi (type=weapon_license) e partita IVA (type=vat_registration)
// Chiamato da iarp-legal-docs quando viene creato il documento
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const xApiToken = request.headers.get('x-api-token');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : xApiToken;

    if (!token) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 401 });
    }

    const apiToken = await prisma.apiToken.findFirst({
      where: {
        token,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    const isTabletServiceToken = hasValidTabletApiToken(request);

    if (!apiToken && !isTabletServiceToken) {
      return NextResponse.json({ error: 'Token non valido o revocato' }, { status: 401 });
    }

    const body = await request.json();
    const { type, number } = body;

    if (!type || !number) {
      return NextResponse.json(
        { error: 'Parametri obbligatori mancanti: type (weapon_license|vat_registration), number' },
        { status: 400 }
      );
    }

    if (type === 'weapon_license') {
      const license = await prisma.weaponLicense.findUnique({ where: { licenseNumber: number } });

      if (!license) {
        return NextResponse.json({ error: "Richiesta porto d'armi non trovata" }, { status: 404 });
      }
      if (license.status !== 'pending') {
        return NextResponse.json(
          { error: `Impossibile attivare: licenza in stato "${license.status}"` },
          { status: 400 }
        );
      }

      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 5);

      const activated = await prisma.weaponLicense.update({
        where: { licenseNumber: number },
        data: { status: 'active', issueDate, expiryDate },
      });

      return NextResponse.json({ result: activated, message: "Porto d'armi attivato con successo" });
    }

    if (type === 'vat_registration') {
      const registration = await prisma.vatRegistration.findUnique({ where: { registrationNumber: number } });

      if (!registration) {
        return NextResponse.json({ error: 'Partita IVA non trovata' }, { status: 404 });
      }
      if (registration.status !== 'pending') {
        return NextResponse.json(
          { error: `Impossibile attivare: partita IVA in stato "${registration.status}"` },
          { status: 400 }
        );
      }

      const activated = await prisma.vatRegistration.update({
        where: { registrationNumber: number },
        data: { status: 'active', issueDate: new Date() },
      });

      return NextResponse.json({ result: activated, message: 'Partita IVA attivata con successo' });
    }

    return NextResponse.json(
      { error: `Tipo non supportato: "${type}". Usa weapon_license o vat_registration` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Errore attivazione FDO:', error);
    return NextResponse.json({ error: "Errore nell'attivazione" }, { status: 500 });
  }
}
