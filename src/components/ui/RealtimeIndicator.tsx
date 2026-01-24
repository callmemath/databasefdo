// File: /src/components/ui/RealtimeIndicator.tsx
// Componente che mostra lo stato della connessione real-time

'use client';

import { useRealtime, EventType } from '@/hooks/useRealtime';
import { useState, useEffect } from 'react';

interface RealtimeIndicatorProps {
  showEvents?: boolean; // Mostra gli ultimi eventi
  onEvent?: (type: EventType, data: any) => void;
}

export function RealtimeIndicator({ showEvents = false, onEvent }: RealtimeIndicatorProps) {
  const { isConnected, lastEvent, events } = useRealtime({
    onEvent: (event) => {
      if (onEvent && event.type !== 'heartbeat' && event.type !== 'connected') {
        onEvent(event.type, event.data);
      }
    },
  });
  
  const [showNotification, setShowNotification] = useState(false);
  
  // Mostra notifica quando arriva un nuovo evento (non heartbeat)
  useEffect(() => {
    if (lastEvent && lastEvent.type !== 'heartbeat' && lastEvent.type !== 'connected') {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  // Traduci il tipo di evento in italiano
  const translateEventType = (type: EventType): string => {
    const translations: Record<EventType, string> = {
      connected: 'Connesso',
      heartbeat: 'Heartbeat',
      arrest_created: 'Nuovo arresto',
      arrest_updated: 'Arresto aggiornato',
      report_created: 'Nuovo rapporto',
      report_updated: 'Rapporto aggiornato',
      wanted_created: 'Nuovo ricercato',
      wanted_updated: 'Ricercato aggiornato',
      citizen_updated: 'Cittadino aggiornato',
      weapon_license_created: 'Nuovo porto d\'armi',
      weapon_license_updated: 'Porto d\'armi aggiornato',
    };
    return translations[type] || type;
  };

  return (
    <div className="relative">
      {/* Indicatore stato connessione */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
          title={isConnected ? 'Connesso (live updates)' : 'Disconnesso'}
        />
        <span className="text-xs text-gray-500">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Notifica popup per nuovi eventi */}
      {showNotification && lastEvent && lastEvent.type !== 'heartbeat' && lastEvent.type !== 'connected' && (
        <div className="absolute top-full right-0 mt-2 z-50 animate-slide-in">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
            🔔 {translateEventType(lastEvent.type)}
          </div>
        </div>
      )}

      {/* Lista eventi (opzionale) */}
      {showEvents && events.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto z-50">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500">Ultimi eventi</span>
          </div>
          {events
            .filter(e => e.type !== 'heartbeat' && e.type !== 'connected')
            .slice(-10)
            .reverse()
            .map((event, idx) => (
              <div
                key={idx}
                className="p-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="text-sm font-medium">{translateEventType(event.type)}</div>
                <div className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString('it-IT')}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default RealtimeIndicator;
