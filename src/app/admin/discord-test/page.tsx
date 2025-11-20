'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Bell, CheckCircle, XCircle, Send, AlertCircle, Info, Check, X } from 'lucide-react';

export default function DiscordTestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    configured?: boolean;
  } | null>(null);

  const [testingType, setTestingType] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);

  // Controlla lo stato dei webhook all'avvio
  useEffect(() => {
    checkWebhookStatus();
  }, []);

  const checkWebhookStatus = async () => {
    try {
      const response = await fetch('/api/discord/status');
      if (response.ok) {
        const data = await response.json();
        setWebhookStatus(data);
      }
    } catch (error) {
      console.error('Errore durante il controllo dello stato webhook:', error);
    }
  };

  const testWebhook = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/discord/test', {
        method: 'GET',
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore di connessione. Controlla la console.',
      });
    } finally {
      setTesting(false);
    }
  };

  const testSpecificNotification = async (type: string) => {
    setTestingType(type);
    setResult(null);

    try {
      const response = await fetch('/api/discord/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore di connessione. Controlla la console.',
      });
    } finally {
      setTestingType(null);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">
          Test Webhook Discord
        </h1>
        <p className="text-police-gray-dark dark:text-gray-300 mt-2">
          Testa l'integrazione del webhook Discord per verificare che le notifiche funzionino correttamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stato Webhook */}
        <Card title="📊 Stato Configurazione Webhook" className="lg:col-span-2 mb-6">
          {webhookStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium dark:text-white">Webhook Generale</span>
                </div>
                {webhookStatus.general ? (
                  <Badge variant="green">
                    <Check className="h-4 w-4 mr-1" />
                    Configurato
                  </Badge>
                ) : (
                  <Badge variant="red">
                    <X className="h-4 w-4 mr-1" />
                    Non Configurato
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium dark:text-white flex items-center">
                    <span className="mr-2">🚨</span>
                    Arresti
                  </span>
                  {webhookStatus.arrests ? (
                    <Badge variant="green" className="text-xs">
                      <Check className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <Badge variant="gray" className="text-xs">
                      Generale
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium dark:text-white flex items-center">
                    <span className="mr-2">📝</span>
                    Denunce
                  </span>
                  {webhookStatus.reports ? (
                    <Badge variant="green" className="text-xs">
                      <Check className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <Badge variant="gray" className="text-xs">
                      Generale
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium dark:text-white flex items-center">
                    <span className="mr-2">🔴</span>
                    Ricercati
                  </span>
                  {webhookStatus.wanted ? (
                    <Badge variant="green" className="text-xs">
                      <Check className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <Badge variant="gray" className="text-xs">
                      Generale
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium dark:text-white flex items-center">
                    <span className="mr-2">🔫</span>
                    Licenze
                  </span>
                  {webhookStatus.weapons ? (
                    <Badge variant="green" className="text-xs">
                      <Check className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <Badge variant="gray" className="text-xs">
                      Generale
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium dark:text-white flex items-center">
                    <span className="mr-2">👮</span>
                    Operatori
                  </span>
                  {webhookStatus.operators ? (
                    <Badge variant="green" className="text-xs">
                      <Check className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <Badge variant="gray" className="text-xs">
                      Generale
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <Info className="h-4 w-4 inline mr-1" />
                  <strong>Nota:</strong> I webhook marcati con "Generale" useranno il webhook generale come fallback.
                  Configura webhook specifici nel file .env per canali Discord separati.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto"></div>
              <p className="text-police-gray-dark dark:text-gray-400 mt-2">Caricamento...</p>
            </div>
          )}
        </Card>

        {/* Test Connessione */}
        <Card title="Test Connessione Webhook" className="h-fit">
          <div className="space-y-4">
            <p className="text-sm text-police-gray-dark dark:text-gray-300">
              Verifica che il webhook Discord sia configurato correttamente e invio un messaggio di test.
            </p>

            <Button
              variant="primary"
              onClick={testWebhook}
              disabled={testing}
              leftIcon={testing ? undefined : <Bell className="h-4 w-4" />}
              className="w-full"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Invio in corso...
                </>
              ) : (
                'Testa Connessione Webhook'
              )}
            </Button>

            {result && !testingType && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex items-start">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        result.success
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}
                    >
                      {result.success ? 'Successo!' : 'Errore'}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        result.success
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Informazioni Configurazione */}
        <Card title="Configurazione" className="h-fit">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Come configurare il webhook
                  </p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                    <li>Vai sul tuo server Discord</li>
                    <li>Modifica il canale desiderato</li>
                    <li>Vai su Integrazioni {'>'} Webhook</li>
                    <li>Crea un nuovo webhook e copia l'URL</li>
                    <li>Aggiungi l'URL al file .env</li>
                    <li>Riavvia il server</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="text-sm text-police-gray-dark dark:text-gray-300">
              <p className="font-medium mb-2">📌 Configurazione Base (un canale):</p>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                DISCORD_WEBHOOK_URL="https://..."
              </code>
            </div>

            <div className="text-sm text-police-gray-dark dark:text-gray-300">
              <p className="font-medium mb-2">🎯 Configurazione Avanzata (canali multipli):</p>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs whitespace-pre">
{`DISCORD_WEBHOOK_ARRESTS="https://..."
DISCORD_WEBHOOK_REPORTS="https://..."
DISCORD_WEBHOOK_WANTED="https://..."
DISCORD_WEBHOOK_WEAPONS="https://..."
DISCORD_WEBHOOK_OPERATORS="https://..."`}
              </code>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-800 dark:text-green-200">
                💡 Consulta <strong>DISCORD_MULTIPLE_WEBHOOKS.md</strong> per la guida completa
              </p>
            </div>
          </div>
        </Card>

        {/* Test Notifiche Specifiche */}
        <Card title="Test Notifiche Specifiche" className="lg:col-span-2">
          <div className="space-y-4">
            <p className="text-sm text-police-gray-dark dark:text-gray-300">
              Testa le diverse tipologie di notifiche che il sistema può inviare.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Test Arresto */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mr-3">
                    <span className="text-red-600 dark:text-red-400 text-xl">🚨</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-police-blue-dark dark:text-white">Arresto</h3>
                    <p className="text-xs text-police-gray-dark dark:text-gray-400">Notifica rossa</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSpecificNotification('arrest')}
                  disabled={!!testingType}
                  leftIcon={<Send className="h-3 w-3" />}
                  className="w-full"
                >
                  {testingType === 'arrest' ? 'Invio...' : 'Testa'}
                </Button>
              </div>

              {/* Test Denuncia */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mr-3">
                    <span className="text-orange-600 dark:text-orange-400 text-xl">📝</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-police-blue-dark dark:text-white">Denuncia</h3>
                    <p className="text-xs text-police-gray-dark dark:text-gray-400">Notifica arancione</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSpecificNotification('report')}
                  disabled={!!testingType}
                  leftIcon={<Send className="h-3 w-3" />}
                  className="w-full"
                >
                  {testingType === 'report' ? 'Invio...' : 'Testa'}
                </Button>
              </div>

              {/* Test Ricercato */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mr-3">
                    <span className="text-purple-600 dark:text-purple-400 text-xl">🔴</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-police-blue-dark dark:text-white">Ricercato</h3>
                    <p className="text-xs text-police-gray-dark dark:text-gray-400">Notifica viola</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSpecificNotification('wanted')}
                  disabled={!!testingType}
                  leftIcon={<Send className="h-3 w-3" />}
                  className="w-full"
                >
                  {testingType === 'wanted' ? 'Invio...' : 'Testa'}
                </Button>
              </div>

              {/* Test Licenza Armi */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mr-3">
                    <span className="text-yellow-600 dark:text-yellow-400 text-xl">🔫</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-police-blue-dark dark:text-white">Licenza Armi</h3>
                    <p className="text-xs text-police-gray-dark dark:text-gray-400">Notifica oro</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSpecificNotification('weapon')}
                  disabled={!!testingType}
                  leftIcon={<Send className="h-3 w-3" />}
                  className="w-full"
                >
                  {testingType === 'weapon' ? 'Invio...' : 'Testa'}
                </Button>
              </div>

              {/* Test Operatore */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mr-3">
                    <span className="text-green-600 dark:text-green-400 text-xl">👮</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-police-blue-dark dark:text-white">Operatore</h3>
                    <p className="text-xs text-police-gray-dark dark:text-gray-400">Notifica verde</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSpecificNotification('operator')}
                  disabled={!!testingType}
                  leftIcon={<Send className="h-3 w-3" />}
                  className="w-full"
                >
                  {testingType === 'operator' ? 'Invio...' : 'Testa'}
                </Button>
              </div>
            </div>

            {/* Risultato Test Specifico */}
            {result && testingType && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex items-start">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        result.success
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}
                    >
                      {result.success ? 'Successo!' : 'Errore'}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        result.success
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
