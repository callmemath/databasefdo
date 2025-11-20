'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { ArrowLeft, Plus, Search, AlertCircle, User } from 'lucide-react';

interface GameUser {
  id: number;
  firstname?: string | null;
  lastname?: string | null;
  dateofbirth?: string | null;
  phone_number?: string | null;
  height?: number | null;
  sex?: string | null;
}

interface WantedFormData {
  citizenId: number | null;
  crimes: string;
  description: string;
  lastSeen: string;
  dangerLevel: string;
  bounty: string;
  notes: string;
  imageUrl: string;
}

export default function AddWanted() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<WantedFormData>({
    citizenId: null,
    crimes: '',
    description: '',
    lastSeen: '',
    dangerLevel: 'medium',
    bounty: '',
    notes: '',
    imageUrl: ''
  });
  
  const [citizenSearchQuery, setCitizenSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameUser[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<GameUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const dangerLevels = [
    { id: 'low', name: 'Basso rischio' },
    { id: 'medium', name: 'Medio rischio' },
    { id: 'high', name: 'Alto rischio' },
    { id: 'extreme', name: 'Rischio estremo' }
  ];

  // Gestisce la ricerca dei cittadini
  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    
    if (!citizenSearchQuery.trim()) return;
    
    try {
      setSearching(true);
      setErrorMsg(null);
      
      const response = await fetch(`/api/citizens?search=${encodeURIComponent(citizenSearchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Errore durante la ricerca');
      }
      
      const data = await response.json();
      setSearchResults(data.citizens || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      setErrorMsg('Si è verificato un errore durante la ricerca. Riprova più tardi.');
    } finally {
      setSearching(false);
    }
  };

  // Gestisce la selezione di un cittadino dalla lista di ricerca
  const handleSelectCitizen = (citizen: GameUser) => {
    setSelectedCitizen(citizen);
    setFormData({
      ...formData,
      citizenId: citizen.id,
    });
    setShowSearchResults(false);
  };

  // Gestisce il cambiamento dei campi del form
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gestisce l'invio del form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.citizenId) {
      setErrorMsg('È necessario selezionare un cittadino');
      return;
    }
    
    if (!formData.crimes.trim() || !formData.description.trim()) {
      setErrorMsg('I campi "Reati" e "Descrizione" sono obbligatori');
      return;
    }
    
    try {
      setSubmitting(true);
      setErrorMsg(null);
      
      // Prepara i dati per la richiesta API
      const requestData = {
        ...formData,
        bounty: formData.bounty ? parseInt(formData.bounty) : null,
      };
      
      const response = await fetch('/api/wanted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante il salvataggio');
      }
      
      const data = await response.json();
      
      // Reindirizza alla pagina dei dettagli del nuovo ricercato
      router.push(`/wanted/${data.id}`);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setErrorMsg('Si è verificato un errore durante il salvataggio. Riprova più tardi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          leftIcon={<ArrowLeft className="h-4 w-4" />} 
          onClick={() => router.push('/wanted')}
          className="mr-4"
        >
          Indietro
        </Button>
        <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
          Aggiungi Ricercato
        </h1>
      </div>
      
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
          Cerca e seleziona un cittadino
        </h2>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={citizenSearchQuery}
              onChange={(e) => setCitizenSearchQuery(e.target.value)}
              placeholder="Cerca per nome, cognome, ID..."
              className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Search className="h-4 w-4" />}
            disabled={searching || !citizenSearchQuery.trim()}
          >
            {searching ? 'Ricerca...' : 'Cerca'}
          </Button>
        </form>
        
        {showSearchResults && (
          <div className="mt-4">
            <h3 className="font-medium text-police-blue-dark dark:text-police-text-light mb-2">
              Risultati della ricerca:
            </h3>
            
            {searchResults.length === 0 ? (
              <div className="text-center py-4 text-police-gray-dark dark:text-police-text-muted">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Nessun risultato trovato</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-police-gray dark:divide-gray-600">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-police-gray-dark dark:text-police-text-muted">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-police-gray-dark dark:text-police-text-muted">Nome</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-police-gray-dark dark:text-police-text-muted">Data di nascita</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-police-gray-dark dark:text-police-text-muted">Telefono</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-police-gray-dark dark:text-police-text-muted">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-police-gray dark:divide-gray-600">
                    {searchResults.map((citizen) => (
                      <tr key={citizen.id} className="hover:bg-police-gray-light dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 text-sm text-police-blue-dark dark:text-police-text-light">{citizen.id}</td>
                        <td className="px-3 py-2 text-sm text-police-blue-dark dark:text-police-text-light">
                          {citizen.firstname} {citizen.lastname}
                        </td>
                        <td className="px-3 py-2 text-sm text-police-gray-dark dark:text-police-text-muted">
                          {citizen.dateofbirth || 'N/D'}
                        </td>
                        <td className="px-3 py-2 text-sm text-police-gray-dark dark:text-police-text-muted">
                          {citizen.phone_number || 'N/D'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectCitizen(citizen)}
                          >
                            Seleziona
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {selectedCitizen && (
          <div className="mt-4 p-3 border border-police-blue dark:border-police-blue-light rounded-md bg-police-blue-light/10 dark:bg-police-blue-dark/20">
            <h3 className="font-medium text-police-blue-dark dark:text-police-text-light mb-2 flex items-center">
              <User className="h-4 w-4 mr-1" />
              Cittadino selezionato:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">Nome:</p>
                <p className="font-medium text-police-blue-dark dark:text-police-text-light">
                  {selectedCitizen.firstname} {selectedCitizen.lastname}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">ID:</p>
                <p className="font-medium text-police-blue-dark dark:text-police-text-light">
                  {selectedCitizen.id}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">Data di nascita:</p>
                <p className="font-medium text-police-blue-dark dark:text-police-text-light">
                  {selectedCitizen.dateofbirth || 'Non disponibile'}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedCitizen(null);
                setFormData({
                  ...formData,
                  citizenId: null,
                });
              }}
            >
              Cambia cittadino
            </Button>
          </div>
        )}
      </Card>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
            Dettagli Ricercato
          </h2>
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errorMsg}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                Reati Contestati*
              </label>
              <input
                type="text"
                name="crimes"
                value={formData.crimes}
                onChange={handleChange}
                placeholder="Es: Rapina a mano armata, Aggressione"
                className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                required
              />
              <p className="mt-1 text-xs text-police-gray-dark dark:text-police-text-muted">
                Inserisci i reati separati da virgole
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                Livello di Pericolosità*
              </label>
              <select
                name="dangerLevel"
                value={formData.dangerLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                required
              >
                {dangerLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                Ultimo Avvistamento
              </label>
              <input
                type="text"
                name="lastSeen"
                value={formData.lastSeen}
                onChange={handleChange}
                placeholder="Es: Visto vicino alla stazione centrale il 10/09"
                className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                Taglia (€)
              </label>
              <input
                type="number"
                name="bounty"
                value={formData.bounty}
                onChange={handleChange}
                placeholder="Es: 5000"
                min="0"
                className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                URL Immagine
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://esempio.com/immagine.jpg"
                className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                Descrizione*
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Inserisci una descrizione dettagliata delle attività criminali o altri dettagli rilevanti"
                rows={4}
                className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                Note Aggiuntive
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Inserisci eventuali note aggiuntive (persone frequentate, luoghi abituali, etc.)"
                rows={3}
                className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 border-t border-police-gray dark:border-gray-600 pt-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/wanted')}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={submitting || !formData.citizenId || !formData.crimes.trim() || !formData.description.trim()}
            >
              {submitting ? 'Salvataggio in corso...' : 'Aggiungi Ricercato'}
            </Button>
          </div>
        </Card>
      </form>
    </MainLayout>
  );
}
