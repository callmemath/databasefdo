'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CitizenSelector from '@/components/citizens/CitizenSelector';
import { Shield, Plus, Trash2 } from 'lucide-react';

interface Weapon {
  type: string;
  caliber: string;
  model: string;
  serialNumber: string;
}

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
    licenseNumber: '', // Verrà generato automaticamente
    licenseType: 'sport_target',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    issuingAuthority: 'Questura di Roma',
    restrictions: '',
    notes: '',
  });

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [newWeapon, setNewWeapon] = useState<Weapon>({
    type: '',
    caliber: '',
    model: '',
    serialNumber: '',
  });

  // Genera automaticamente il numero di licenza quando viene selezionato un cittadino
  const generateLicenseNumber = (citizen: Citizen, licenseType: string) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // Prefisso basato sul tipo di licenza
    const typePrefix: { [key: string]: string } = {
      'sport_target': 'TS',
      'hunting': 'CA',
      'defense': 'DP',
      'collection': 'CO',
      'carry': 'PA'
    };
    
    const prefix = typePrefix[licenseType] || 'PL';
    const citizenId = citizen.id.toString().padStart(6, '0');
    
    return `${prefix}-${year}${month}${day}-${citizenId}-${random}`;
  };

  // Aggiorna il numero di licenza quando cambia il cittadino o il tipo
  const handleCitizenSelect = (citizen: Citizen | null) => {
    setSelectedCitizen(citizen);
    if (citizen) {
      const newLicenseNumber = generateLicenseNumber(citizen, formData.licenseType);
      setFormData({ ...formData, licenseNumber: newLicenseNumber });
    }
  };

  const handleLicenseTypeChange = (newType: string) => {
    setFormData({ ...formData, licenseType: newType });
    if (selectedCitizen) {
      const newLicenseNumber = generateLicenseNumber(selectedCitizen, newType);
      setFormData({ ...formData, licenseType: newType, licenseNumber: newLicenseNumber });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validazione
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
          authorizedWeapons: weapons.length > 0 ? weapons : null,
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

  const addWeapon = () => {
    if (newWeapon.type && newWeapon.caliber && newWeapon.model) {
      setWeapons([...weapons, newWeapon]);
      setNewWeapon({
        type: '',
        caliber: '',
        model: '',
        serialNumber: '',
      });
    }
  };

  const removeWeapon = (index: number) => {
    setWeapons(weapons.filter((_, i) => i !== index));
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">
            Nuova Licenza Porto d'Armi
          </h1>
          <p className="text-police-gray-dark dark:text-gray-400 mt-1">
            Registra un nuovo porto d'armi nel sistema
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informazioni di Base */}
          <Card>
            <h2 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Informazioni di Base
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selettore Cittadino */}
              <div className="md:col-span-2">
                <CitizenSelector
                  selectedCitizen={selectedCitizen}
                  onSelectCitizen={handleCitizenSelect}
                  onClear={() => {
                    setSelectedCitizen(null);
                    setFormData({ ...formData, licenseNumber: '' });
                  }}
                  label="Cittadino"
                  placeholder="Cerca cittadino per nome o cognome..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numero Licenza (Generato Automaticamente)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.licenseNumber}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  placeholder="Seleziona prima un cittadino..."
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
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="sport_target">Tiro Sportivo (TS)</option>
                  <option value="hunting">Caccia (CA)</option>
                  <option value="defense">Difesa Personale (DP)</option>
                  <option value="collection">Collezione (CO)</option>
                  <option value="carry">Porto d'Armi (PA)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Il numero di licenza verrà aggiornato automaticamente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autorità Emittente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.issuingAuthority}
                  onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Rilascio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Scadenza *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Restrizioni
                </label>
                <textarea
                  rows={3}
                  placeholder="Es: Solo per tiro al bersaglio..."
                  value={formData.restrictions}
                  onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </Card>

          {/* Armi Autorizzate */}
          <Card>
            <h2 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4">
              Armi Autorizzate
            </h2>

            {/* Lista armi aggiunte */}
            {weapons.length > 0 && (
              <div className="mb-4 space-y-2">
                {weapons.map((weapon, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <span><strong>Tipo:</strong> {weapon.type}</span>
                      <span><strong>Calibro:</strong> {weapon.caliber}</span>
                      <span><strong>Modello:</strong> {weapon.model}</span>
                      <span><strong>Matricola:</strong> {weapon.serialNumber || 'N/A'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWeapon(index)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form per aggiungere arma */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="Tipo arma"
                value={newWeapon.type}
                onChange={(e) => setNewWeapon({ ...newWeapon, type: e.target.value })}
                className="px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Calibro"
                value={newWeapon.caliber}
                onChange={(e) => setNewWeapon({ ...newWeapon, caliber: e.target.value })}
                className="px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Modello"
                value={newWeapon.model}
                onChange={(e) => setNewWeapon({ ...newWeapon, model: e.target.value })}
                className="px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Matricola"
                value={newWeapon.serialNumber}
                onChange={(e) => setNewWeapon({ ...newWeapon, serialNumber: e.target.value })}
                className="px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={addWeapon}
              disabled={!newWeapon.type || !newWeapon.caliber || !newWeapon.model}
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Arma
            </Button>
          </Card>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Creazione...' : 'Crea Licenza'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
