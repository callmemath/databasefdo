// File: /src/hooks/useRealtime.ts
// Hook per ricevere aggiornamenti in tempo reale tramite SSE

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export type EventType = 
  | 'arrest_created' 
  | 'arrest_updated' 
  | 'report_created' 
  | 'report_updated'
  | 'wanted_created'
  | 'wanted_updated'
  | 'citizen_updated'
  | 'weapon_license_created'
  | 'weapon_license_updated'
  | 'connected'
  | 'heartbeat';

interface RealtimeEvent {
  type: EventType;
  data: any;
  timestamp: number;
}

interface UseRealtimeOptions {
  onEvent?: (event: RealtimeEvent) => void;
  eventTypes?: EventType[]; // Filtra solo questi tipi di eventi
  autoReconnect?: boolean;
  reconnectInterval?: number; // ms
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    onEvent,
    eventTypes,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const connect = useCallback(() => {
    if (status !== 'authenticated' || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[Realtime] Connesso');
        setIsConnected(true);
      };

      eventSource.onerror = (error) => {
        console.error('[Realtime] Errore:', error);
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        // Auto-reconnect
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[Realtime] Tentativo di riconnessione...');
            connect();
          }, reconnectInterval);
        }
      };

      // Handler generico per tutti gli eventi
      const handleEvent = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const realtimeEvent: RealtimeEvent = {
            type: event.type as EventType,
            data,
            timestamp: data.timestamp || Date.now(),
          };

          // Filtra per tipo se specificato
          if (eventTypes && !eventTypes.includes(realtimeEvent.type)) {
            return;
          }

          setLastEvent(realtimeEvent);
          setEvents(prev => [...prev.slice(-99), realtimeEvent]); // Mantieni ultimi 100

          if (onEvent) {
            onEvent(realtimeEvent);
          }
        } catch (e) {
          console.error('[Realtime] Errore parsing evento:', e);
        }
      };

      // Registra listener per tutti i tipi di eventi
      const allEventTypes: EventType[] = [
        'connected',
        'heartbeat',
        'arrest_created',
        'arrest_updated',
        'report_created',
        'report_updated',
        'wanted_created',
        'wanted_updated',
        'citizen_updated',
        'weapon_license_created',
        'weapon_license_updated',
      ];

      allEventTypes.forEach(type => {
        eventSource.addEventListener(type, handleEvent);
      });

    } catch (error) {
      console.error('[Realtime] Errore connessione:', error);
    }
  }, [status, onEvent, eventTypes, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connetti quando autenticato
  useEffect(() => {
    if (status === 'authenticated') {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [status, connect, disconnect]);

  // Funzione per pulire gli eventi
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  return {
    isConnected,
    lastEvent,
    events,
    clearEvents,
    reconnect: connect,
    disconnect,
  };
}

// Hook semplificato per ricaricare dati quando arriva un evento specifico
export function useRealtimeRefresh(
  eventTypes: EventType[],
  onRefresh: () => void | Promise<void>
) {
  const [refreshCount, setRefreshCount] = useState(0);

  useRealtime({
    eventTypes,
    onEvent: (event) => {
      console.log(`[Realtime] Evento ${event.type} ricevuto, refresh...`);
      setRefreshCount(prev => prev + 1);
      onRefresh();
    },
  });

  return refreshCount;
}
