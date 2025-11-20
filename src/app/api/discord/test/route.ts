import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { discordWebhook } from "@/lib/discord-webhook";

/**
 * GET /api/discord/test
 * Endpoint per testare l'integrazione del webhook Discord
 */
export async function GET(req: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Verifica se il webhook è configurato
    if (!discordWebhook.isConfigured()) {
      return NextResponse.json({
        success: false,
        message: "Webhook Discord non configurato. Aggiungi DISCORD_WEBHOOK_URL al file .env",
        configured: false
      }, { status: 200 });
    }

    // Invia un messaggio di test
    const testSuccess = await discordWebhook.notifySystemEvent({
      title: "🧪 TEST WEBHOOK DISCORD",
      description: `Test eseguito da **${session.user.name}** (${session.user.department})`,
      fields: [
        {
          name: "✅ Stato",
          value: "Il webhook Discord è configurato correttamente!",
          inline: false,
        },
        {
          name: "👤 Utente",
          value: session.user.name || 'Sconosciuto',
          inline: true,
        },
        {
          name: "🏢 Dipartimento",
          value: session.user.department || 'Non specificato',
          inline: true,
        },
        {
          name: "📅 Data Test",
          value: new Date().toLocaleString('it-IT'),
          inline: false,
        },
      ],
    });

    if (testSuccess) {
      return NextResponse.json({
        success: true,
        message: "Notifica di test inviata con successo! Controlla il canale Discord.",
        configured: true
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Errore durante l'invio della notifica di test. Controlla i log del server.",
        configured: true
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Errore durante il test del webhook Discord:", error);
    return NextResponse.json({
      success: false,
      message: "Errore durante il test del webhook",
      error: error instanceof Error ? error.message : "Errore sconosciuto"
    }, { status: 500 });
  }
}

/**
 * POST /api/discord/test
 * Endpoint per testare notifiche specifiche
 */
export async function POST(req: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { type } = await req.json();

    // Verifica se il webhook è configurato
    if (!discordWebhook.isConfigured()) {
      return NextResponse.json({
        success: false,
        message: "Webhook Discord non configurato"
      }, { status: 400 });
    }

    let testSuccess = false;

    switch (type) {
      case 'arrest':
        testSuccess = await discordWebhook.notifyNewArrest({
          arrestId: 9999,
          citizenName: "Mario Rossi (TEST)",
          charges: "Test - Nessun reato reale",
          location: "Via Test, 123",
          officerName: session.user.name || 'Test Officer',
          department: session.user.department || 'Test Department',
          sentence: "0 anni",
          fine: 0,
        });
        break;

      case 'report':
        testSuccess = await discordWebhook.notifyNewReport({
          reportId: 9999,
          title: "Denuncia di Test",
          type: "test",
          location: "Via Test, 123",
          citizenName: "Anna Neri (TEST)",
          officerName: session.user.name || 'Test Officer',
          isAnonymous: false,
        });
        break;

      case 'wanted':
        testSuccess = await discordWebhook.notifyNewWanted({
          wantedId: 9999,
          citizenName: "Carlo Verdi (TEST)",
          charges: "Test - Nessun reato reale",
          severity: "BASSO",
          officerName: session.user.name || 'Test Officer',
          reward: 1000,
        });
        break;

      case 'weapon':
        testSuccess = await discordWebhook.notifyNewWeaponLicense({
          licenseId: 9999,
          citizenName: "Luigi Bianchi (TEST)",
          type: "Porto d'Armi Sportivo",
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 anno
          issuedBy: session.user.name || 'Test Officer',
        });
        break;

      case 'operator':
        testSuccess = await discordWebhook.notifyNewOperator({
          operatorId: 9999,
          name: "Test",
          surname: "Operatore",
          badge: "TEST-001",
          department: "Dipartimento Test",
          rank: "Agente Test",
        });
        break;

      default:
        return NextResponse.json({
          success: false,
          message: "Tipo di notifica non valido. Usa: arrest, report, wanted, weapon, operator"
        }, { status: 400 });
    }

    if (testSuccess) {
      return NextResponse.json({
        success: true,
        message: `Notifica di test (${type}) inviata con successo!`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Errore durante l'invio della notifica di test"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Errore durante il test del webhook Discord:", error);
    return NextResponse.json({
      success: false,
      message: "Errore durante il test del webhook",
      error: error instanceof Error ? error.message : "Errore sconosciuto"
    }, { status: 500 });
  }
}
