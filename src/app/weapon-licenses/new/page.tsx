'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CitizenSelector from '@/components/citizens/CitizenSelector';
import { Shield, Clock } from 'lucide-react';

interface Citizen {
  id: number;
  firstname: string;
  lastname: string;
  dateofbirth?: string;
  identifier?: string;
  sex?: string;
}

export default function NewWeaponLicensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  
  const [formData, setFormData] = useState({
    licenseNumber: '',
    licenseType: 'carry',
    notes: '',
  });

  const generateLicenseNumber = (citizen: Citizen, licenseType: string) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const typePrefix: Record<string, string> = {
      sport_target: 'TS',
      hunting: 'CA',
      defense: 'DP',
      collection: 'CO',
      carry: 'PA',
    };
    const prefix = typePrefix[licenseType] || 'PA';
    const citizenId = citizen.id.toString().padStart(6, '0');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${dateStr}-${citizenId}-${random}`;
  };

  const handleCitizenSelect = (citizen: Citizen | null) => {
    setSelectedCitizen(citizen);
    if (citizen) {
      setFormData(prev => ({ ...prev, licenseNumber: generateLicenseNumber(citizen, prev.licenseType) }));
    }
  };

  const handleLicenseTypeChange = (newType: string) => {
    setFormData(prev => ({
      ...prev,
      licenseType: newType,
      licenseNumber: selectedCitizen ? generateLicenseNumber(selectedCitizen, newType) : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedCitizen) {
      setError('Seleziona un cittadino');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/weapon-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          citizenId: selectedCitizen.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nella creazione');
      }

      const data = await res.json();
      router.push(`/weapon-licenses/${data.license.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">
            Nuova Richiesta Porto d'Armi
          </h1>
          <p className="text-police-gray-dark dark:text-gray-400 mt-1">
            Crea una richiesta pendente. La licenza sarà attivata tramite iarp-legal-docs.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Flusso richiesta:</strong> Crea la richiesta qui → Il player completa i passaggi necessari → 
            Torna dall'operatore → L'operatore emette il documento "Porto d'Armi Personale" tramite iarp-legal-docs → 
            La licenza viene attivata automaticamente.
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Dati Richiesta
            </h2>
            
            <div className="space-y-4">
              <div>
                <CitizenSelector
                  selectedCitizen={selectedCitizen}
                  onSelectCitizen={handleCitizenSelect}
                  onClear={() => {
                    setSelectedCitizen(null);
                    setFormData(prev => ({ ...prev, licenseNumber: '' }));
                  }}
                  label="Cittadino Richiedente"
                  placeholder="Cerca cittadino per nome o cognome..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo Licenza *
                </label>
                <select
                  required
                  value={formData.licenseType}
                  onChange={(e) => handleLicenseTypeChange(e.target.value)}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="sport_target">Tiro Sportivo (TS)</option>
                  <option value="hunting">Caccia (CA)</option>
                  <option value="defense">Difesa Personale (DP)</option>
                  <option value="collection">Collezione (CO)</option>
                  <option value="carry">Porto d'Armi (PA)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numero Richiesta (Auto-generato)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.licenseNumber}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed font-mono text-sm"
                  placeholder="Seleziona prima un cittadino..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Questo numero verrà usato nel documento iarp-legal-docs per attivare la licenza.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Note aggiuntive sulla richiesta..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
              Annulla
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !selectedCitizen}>
              {loading ? 'Creazione...' : 'Crea Richiesta'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
