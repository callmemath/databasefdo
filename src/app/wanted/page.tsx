'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeRefresh } from '@/hooks/useRealtime';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { AlertCircle, Calendar, Clock, Zap, Plus, FileText } from 'lucide-react';

// Tipo per i dati dei ricercati
interface WantedPerson {
  id: string;
  citizenId: number;
  crimes: string;
  description: string;
  lastSeen?: string | null;
  dangerLevel: string;
  bounty?: number | null;
  status: string;
  notes?: string | null;
  imageUrl?: string | null;
  officerId: string;
  insertedAt: string;
  updatedAt: string;
  citizen_firstname?: string;
  citizen_lastname?: string;
  citizen_dateofbirth?: string;
  citizen_gender?: string;
  citizen_height?: number;
  citizen_phone?: string;
  officer_name?: string;
  officer_surname?: string;
  officer_badge?: string;
}

export default function Wanted() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [dangerFilter, setDangerFilter] = useState('all');
  const [wantedPersons, setWantedPersons] = useState<WantedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funzione per caricare i ricercati
  const fetchWantedPersons = useCallback(async () => {
    try {
      setLoading(true);
      // Costruisci la query string con i parametri di filtro
      const queryParams = new URLSearchParams();
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (dangerFilter !== 'all') {
        queryParams.append('dangerLevel', dangerFilter);
      }

      const response = await fetch(`/api/wanted?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei ricercati');
      }
      
      const data = await response.json();
      setWantedPersons(data);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
      console.error('Errore nel caricamento dei ricercati:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dangerFilter]);

  // Carica i dati dei ricercati
  useEffect(() => {
    fetchWantedPersons();
  }, [fetchWantedPersons]);

  // 🔴 Real-time: aggiorna automaticamente quando viene creato/modificato un ricercato
  useRealtimeRefresh(['wanted_created', 'wanted_updated'], fetchWantedPersons);
  
  const dangerLevels = [
    { id: 'all', name: 'Tutti i livelli' },
    { id: 'low', name: 'Basso rischio' },
    { id: 'medium', name: 'Medio rischio' },
    { id: 'high', name: 'Alto rischio' },
    { id: 'extreme', name: 'Rischio estremo' }
  ];
  
  const dangerBadges = {
    low: <Badge variant="blue">Basso rischio</Badge>,
    medium: <Badge variant="yellow">Medio rischio</Badge>,
    high: <Badge variant="red">Alto rischio</Badge>,
    extreme: <Badge variant="red">RISCHIO ESTREMO</Badge>
  };
  
  // Funzione per calcolare l'età approssimativa dal dateofbirth (formato 'DD/MM/YYYY')
  const calculateAge = (dateOfBirth: string | undefined): number => {
    if (!dateOfBirth) return 0;
    
    // Controlla se il formato è DD/MM/YYYY
    const parts = dateOfBirth.split('/');
    if (parts.length === 3) {
      const birthDate = new Date(
        parseInt(parts[2]), // anno
        parseInt(parts[1]) - 1, // mese (0-based)
        parseInt(parts[0]) // giorno
      );
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Sottrai un anno se il mese corrente è precedente al mese di nascita,
      // o se il mese è lo stesso ma il giorno corrente è precedente al giorno di nascita
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }
    
    return 0;
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleRowClick = (person: WantedPerson) => {
    // Naviga alla pagina di dettaglio del ricercato
    router.push(`/wanted/${person.id}`);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Database Ricercati
            </h1>
            <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
              Gestione e ricerca dei soggetti ricercati
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push('/wanted/new')}
            >
              Aggiungi Ricercato
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="w-full md:w-64">
            <SearchInput onSearch={handleSearch} placeholder="Cerca ricercato..." />
          </div>
          
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-police-gray-dark dark:text-police-text-muted mr-2" />
            <span className="text-sm text-police-gray-dark dark:text-police-text-muted mr-3">Livello pericolo:</span>
            <select 
              value={dangerFilter}
              onChange={(e) => setDangerFilter(e.target.value)}
              className="form-input text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
            >
              {dangerLevels.map(level => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      {loading ? (
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue-dark mx-auto mb-4"></div>
          <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light">
            Caricamento ricercati...
          </h3>
        </Card>
      ) : error ? (
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light mb-2">
            Errore
          </h3>
          <p className="text-police-gray-dark dark:text-police-text-muted">
            {error}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wantedPersons.map((person: WantedPerson) => {
              // Preparare il nome completo del cittadino ricercato
              const fullName = `${person.citizen_firstname || ''} ${person.citizen_lastname || ''}`.trim() || 'Sconosciuto';
              
              // Calcolare l'età dal dateofbirth
              const age = calculateAge(person.citizen_dateofbirth);
              
              // Preparare la lista dei crimini (nel database è una stringa separata da virgole)
              const crimesList = person.crimes.split(',').map(crime => crime.trim());
              
              return (
                <Card 
                  key={person.id} 
                  className="flex flex-col hover:cursor-pointer h-full" 
                  hover
                  onClick={() => handleRowClick(person)}
                >
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center overflow-hidden mr-4">
                      {person.imageUrl ? (
                        <img src={person.imageUrl} alt={fullName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-police-blue">
                          {(person.citizen_firstname?.[0] || '') + (person.citizen_lastname?.[0] || '')}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light">
                        {fullName}
                      </h3>
                      <div className="flex items-center text-sm text-police-gray-dark dark:text-police-text-muted">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{age > 0 ? `${age} anni` : 'Età sconosciuta'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    {dangerBadges[person.dangerLevel as keyof typeof dangerBadges]}
                    
                    {person.lastSeen && (
                      <div className="flex items-center mt-2 text-sm text-police-gray-dark dark:text-police-text-muted">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>Ultimo avvistamento: {person.lastSeen}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-police-blue-dark dark:text-police-text-light text-sm mb-1">
                      Reati:
                    </h4>
                    <ul className="text-sm space-y-1 max-h-24 overflow-y-auto">
                      {crimesList.slice(0, 3).map((crime: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-police-accent-red dark:text-red-400 mr-1.5">•</span>
                          <span className="text-police-gray-dark dark:text-police-text-muted">{crime}</span>
                        </li>
                      ))}
                      {crimesList.length > 3 && (
                        <li className="text-police-gray-dark dark:text-police-text-muted text-sm italic">
                          + altri {crimesList.length - 3} reati
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-4 flex-1">
                    <p className="line-clamp-3">{person.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-police-gray dark:border-gray-700">
                    {person.bounty ? (
                      <div className="flex items-center text-police-accent-gold dark:text-yellow-300 font-semibold">
                        <Zap className="h-4 w-4 mr-1" />
                        <span>Taglia: €{person.bounty}</span>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/wanted/${person.id}`);
                        }}
                      >
                        Dettagli
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        leftIcon={<FileText className="h-3.5 w-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/wanted/sightings/${person.id}`);
                        }}
                      >
                        Segnala
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {wantedPersons.length === 0 && (
            <Card className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-police-gray-dark dark:text-police-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light mb-2">
                Nessun risultato trovato
              </h3>
              <p className="text-police-gray-dark dark:text-police-text-muted">
                Nessun ricercato corrisponde ai criteri di ricerca selezionati.
              </p>
            </Card>
          )}
        </>
      )}
    </MainLayout>
  );
}
