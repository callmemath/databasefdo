import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const webhookStatus = {
      general: !!process.env.DISCORD_WEBHOOK_URL,
      arrests: !!process.env.DISCORD_WEBHOOK_ARRESTS,
      reports: !!process.env.DISCORD_WEBHOOK_REPORTS,
      wanted: !!process.env.DISCORD_WEBHOOK_WANTED,
      weapons: !!process.env.DISCORD_WEBHOOK_WEAPONS,
      operators: !!process.env.DISCORD_WEBHOOK_OPERATORS,
    };

    return NextResponse.json(webhookStatus);
  } catch (error) {
    console.error('Errore durante il controllo dello stato dei webhook:', error);
    return NextResponse.json(
      { 
        error: 'Errore durante il controllo dello stato dei webhook',
        general: false,
        arrests: false,
        reports: false,
        wanted: false,
        weapons: false,
        operators: false,
      },
      { status: 500 }
    );
  }
}
