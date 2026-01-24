// File: /src/app/api/realtime/route.ts
// API per aggiornamenti in tempo reale usando Server-Sent Events (SSE)

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Store per i client connessi e gli ultimi eventi
const clients = new Map<string, WritableStreamDefaultWriter>();
const lastEvents = new Map<string, { type: string; data: any; timestamp: number }>();

// Tipi di eventi supportati
export type EventType = 
  | 'arrest_created' 
  | 'arrest_updated' 
  | 'report_created' 
  | 'report_updated'
  | 'wanted_created'
  | 'wanted_updated'
  | 'citizen_updated'
  | 'weapon_license_created'
  | 'weapon_license_updated';

// Funzione per inviare eventi a tutti i client connessi
export function broadcastEvent(type: EventType, data: any) {
  const event = { type, data, timestamp: Date.now() };
  lastEvents.set(type, event);
  
  // Mantieni solo gli ultimi 50 eventi
  if (lastEvents.size > 50) {
    const oldest = [...lastEvents.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    lastEvents.delete(oldest[0]);
  }
  
  const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  
  clients.forEach((writer, clientId) => {
    try {
      const encoder = new TextEncoder();
      writer.write(encoder.encode(message));
    } catch (error) {
      console.error(`Errore invio a client ${clientId}:`, error);
      clients.delete(clientId);
    }
  });
}

// GET - Stabilisce connessione SSE
export async function GET(req: NextRequest) {
  // Verifica autenticazione
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new Response("Non autorizzato", { status: 401 });
  }

  const clientId = `${session.user.id}-${Date.now()}`;
  
  // Crea uno stream per SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Registra il client
  clients.set(clientId, writer);
  // Log rimosso per ridurre output

  // Invia un messaggio di connessione
  writer.write(encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`));

  // Invia un heartbeat ogni 30 secondi per mantenere la connessione
  const heartbeat = setInterval(() => {
    try {
      writer.write(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`));
    } catch (error) {
      clearInterval(heartbeat);
      clients.delete(clientId);
    }
  }, 30000);

  // Gestisci la disconnessione
  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
    // Log rimosso per ridurre output
    try {
      writer.close();
    } catch (e) {
      // Ignora errori di chiusura
    }
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// POST - Invia un evento (per uso interno dalle altre API)
export async function POST(req: NextRequest) {
  try {
    // Verifica che la richiesta sia interna (header speciale o token)
    const internalToken = req.headers.get('x-internal-token');
    if (internalToken !== process.env.NEXTAUTH_SECRET) {
      // Se non è interno, verifica la sessione
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return new Response("Non autorizzato", { status: 401 });
      }
    }

    const { type, data } = await req.json();
    
    if (!type || !data) {
      return new Response("Tipo ed evento richiesti", { status: 400 });
    }

    broadcastEvent(type as EventType, data);
    
    return new Response(JSON.stringify({ success: true, clients: clients.size }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[SSE] Errore POST:", error);
    return new Response("Errore interno", { status: 500 });
  }
}
