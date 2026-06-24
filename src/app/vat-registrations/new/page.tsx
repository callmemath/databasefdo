'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CitizenSelector from '@/components/citizens/CitizenSelector';
import { Briefcase } from 'lucide-react';

interface Citizen {
  id: number;
  firstname: string;
  lastname: string;
  dateofbirth?: string;
  identifier?: string;
  sex?: string;
}

export default function NewVatRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCitizenId = searchParams.get('citizenId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);

  const [formData, setFormData] = useState({
    registrationNumber: '',
    businessName: '',
    businessType: '',
    taxRegime: 'Regime Forfettario',
    notes: '',
  });

  const generateRegistrationNumber = (citizen: Citizen) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const citizenId = citizen.id.toString().padStart(6, '0');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `PIVA-${dateStr}-${citizenId}-${random}`;
  };

  useEffect(() => {
    if (!prefilledCitizenId) return;
    fetch(`/api/citizens/${prefilledCitizenId}`)
      .then(r => r.json())
      .then(data => {
        if (data.citizen) {
          const c: Citizen = {
            id: data.citizen.id,
            firstname: data.citizen.firstname,
            lastname: data.citizen.lastname,
            dateofbirth: data.citizen.dateofbirth,
            identifier: data.citizen.identifier,
            sex: data.citizen.sex,
          };
          setSelectedCitizen(c);
          setFormData(prev => ({ ...prev, registrationNumber: generateRegistrationNumber(c) }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledCitizenId]);

  const handleCitizenSelect = (citizen: Citizen | null) => {
    setSelectedCitizen(citizen);
    if (citizen) {
      setFormData(prev => ({ ...prev, registrationNumber: generateRegistrationNumber(citizen) }));
    }
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
      const res = await fetch('/api/vat-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, citizenId: selectedCitizen.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nella creazione');
      }

      const data = await res.json();
      router.push(`/vat-registrations/${data.registration.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">
            Nuova Registrazione Partita IVA
          </h1>
          <p className="text-police-gray-dark dark:text-gray-400 mt-1">
            Crea una richiesta pendente di apertura partita IVA.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Dati Registrazione
            </h2>

            <div className="space-y-4">
              <CitizenSelector
                selectedCitizen={selectedCitizen}
                onSelectCitizen={handleCitizenSelect}
                onClear={() => {
                  setSelectedCitizen(null);
                  setFormData(prev => ({ ...prev, registrationNumber: '' }));
                }}
                label="Cittadino Intestatario"
                placeholder="Cerca cittadino per nome o cognome..."
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numero Registrazione (Auto-generato)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.registrationNumber}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed font-mono text-sm"
                  placeholder="Seleziona prima un cittadino..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Questo numero verrà usato nel documento per attivare la registrazione.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome / Ragione Sociale *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es: Mario Rossi, Rossi Srl..."
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo Attività *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es: Commercio al dettaglio, Ristorazione, Consulenza..."
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Regime Fiscale *
                </label>
                <select
                  required
                  value={formData.taxRegime}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxRegime: e.target.value }))}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Regime Forfettario">Regime Forfettario</option>
                  <option value="Regime Ordinario">Regime Ordinario</option>
                  <option value="Regime dei Minimi">Regime dei Minimi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Note aggiuntive..."
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
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !selectedCitizen || !formData.businessName || !formData.businessType}
            >
              {loading ? 'Creazione...' : 'Crea Richiesta'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
