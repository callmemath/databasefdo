'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { User, FileText, AlertCircle, DollarSign, Calendar, Search, X, Target } from 'lucide-react';

// Interfaccia per i tipi di dati dei cittadini
interface Citizen {
  id: number;
  firstname: string;
  lastname: string;
  dateofbirth: string;
  sex: string;
  arrests: any[];
  reports: any[];
  weaponLicenses?: any[];
  // Campi aggiuntivi da users.sql
  accounts?: string;
  group?: string;
  inventory?: string;
  job?: string;
  job_grade?: number;
  loadout?: string;
  metadata?: string;
  position?: string;
  status?: string;
  nationality?: string;
  skin?: string;
  bankingData?: string;
  job2?: string;
  job2_grade?: number;
  immProfilo?: string;
  tattoos?: string;
  badge?: number;
  jail?: number;
  is_dead?: number;
}

export default function Citizens() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data from API
  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/citizens?${searchQuery ? `q=${encodeURIComponent(searchQuery)}` : ''}`);
        
        if (!res.ok) {
          throw new Error('Errore durante il recupero dei dati dei cittadini');
        }
        
        const data = await res.json();
        setCitizens(data.citizens || []);
      } catch (err) {
        console.error('Errore nel caricamento dei cittadini:', err);
        setError('Impossibile caricare i dati dei cittadini');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCitizens();
  }, [searchQuery]);
  
  // Filter citizens based on selected tab
  const filteredCitizens = citizens.filter(citizen => {
    const hasCriminalRecord = citizen.arrests && citizen.arrests.length > 0;
    
    const matchesTab = selectedTab === 'all' || 
                       (selectedTab === 'criminal' && hasCriminalRecord) ||
                       (selectedTab === 'clean' && !hasCriminalRecord);
    
    return matchesTab;
  });
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRowClick = (citizen: Citizen) => {
    router.push(`/citizens/${citizen.id}`);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Database Cittadini
            </h1>
            <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
              Informazioni complete su tutti i cittadini
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button
              variant="primary"
              leftIcon={<Search className="h-4 w-4" />}
            >
              Ricerca Avanzata
            </Button>
          </div>
        </div>
      </div>
      
      <Card>
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'all' 
                    ? 'bg-police-blue text-white dark:bg-police-blue-dark dark:text-white' 
                    : 'bg-police-gray-light text-police-gray-dark hover:bg-police-gray dark:bg-gray-800 dark:text-police-text-muted dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedTab('all')}
              >
                Tutti
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'criminal' 
                    ? 'bg-police-blue text-white dark:bg-police-blue-dark dark:text-white' 
                    : 'bg-police-gray-light text-police-gray-dark hover:bg-police-gray dark:bg-gray-800 dark:text-police-text-muted dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedTab('criminal')}
              >
                Pregiudicati
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'clean' 
                    ? 'bg-police-blue text-white dark:bg-police-blue-dark dark:text-white' 
                    : 'bg-police-gray-light text-police-gray-dark hover:bg-police-gray dark:bg-gray-800 dark:text-police-text-muted dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedTab('clean')}
              >
                Fedina Pulita
              </button>
            </div>
            
            <div className="w-full md:w-64">
              <SearchInput onSearch={handleSearch} placeholder="Cerca per nome..." />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-police-blue dark:border-police-blue-dark mx-auto"></div>
              <p className="mt-4 text-police-gray-dark dark:text-police-text-muted">Caricamento cittadini...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto" />
              <p className="mt-4">{error}</p>
            </div>
          ) : filteredCitizens.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-police-gray-dark dark:text-police-text-muted" />
              <p className="mt-4 text-police-gray-dark dark:text-police-text-muted">Nessun cittadino trovato</p>
            </div>
          ) : (
            <Table
              data={filteredCitizens}
              columns={[
                {
                  header: 'Nome e Cognome',
                  accessor: (citizen) => (
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center text-police-blue dark:text-blue-300 font-medium mr-3">
                        {citizen.firstname && citizen.lastname 
                          ? citizen.firstname[0] + citizen.lastname[0] 
                          : 'N/A'}
                      </div>
                      <span className="font-medium dark:text-police-text-light">
                        {citizen.firstname} {citizen.lastname}
                      </span>
                    </div>
                  ),
                },
                {
                  header: 'Data di Nascita',
                  accessor: (citizen) => citizen.dateofbirth || 'N/A',
                },
                {
                  header: 'Genere',
                  accessor: (citizen) => {
                    const sex = citizen.sex ? citizen.sex.toLowerCase() : '';
                    return (
                      <div>
                        {sex === 'm' || sex === 'male' || sex === 'uomo' ? 'Uomo' 
                         : sex === 'f' || sex === 'female' || sex === 'donna' ? 'Donna' 
                         : 'Non specificato'}
                      </div>
                    );
                  },
                },
                {
                  header: 'Status Penale',
                  accessor: (citizen) => {
                    const hasArrest = citizen.arrests && citizen.arrests.length > 0;
                    
                    return (
                      <div>
                        <Badge variant={hasArrest ? 'red' : 'green'}>
                          {hasArrest ? 'Pregiudicato' : 'Fedina Pulita'}
                        </Badge>
                        <div className="flex items-center text-xs mt-1 space-x-2">
                          <div className="flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1 text-police-accent-red dark:text-red-300" />
                            <span className="dark:text-police-text-muted">
                              Arresti: {citizen.arrests ? citizen.arrests.length : 0}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1 text-police-accent-gold dark:text-yellow-300" />
                            <span className="dark:text-police-text-muted">
                              Denunce: {citizen.reports ? citizen.reports.length : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  header: 'Porto d\'Armi',
                  accessor: (citizen) => {
                    const licenses = citizen.weaponLicenses || [];
                    const activeLicenses = licenses.filter((l: any) => l.status === 'active');
                    const hasActiveLicense = activeLicenses.length > 0;
                    const expiredLicenses = licenses.filter((l: any) => 
                      l.status === 'expired' || new Date(l.expiryDate) < new Date()
                    );
                    
                    return (
                      <div>
                        <Badge variant={hasActiveLicense ? 'green' : licenses.length > 0 ? 'yellow' : 'gray'}>
                          <Target className="h-3 w-3 mr-1" />
                          {hasActiveLicense ? 'Attivo' : licenses.length > 0 ? 'Non Attivo' : 'Nessuno'}
                        </Badge>
                        {licenses.length > 0 && (
                          <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                            {activeLicenses.length > 0 && (
                              <span className="text-green-600 dark:text-green-400">
                                {activeLicenses.length} attiv{activeLicenses.length === 1 ? 'a' : 'e'}
                              </span>
                            )}
                            {activeLicenses.length > 0 && expiredLicenses.length > 0 && <span>, </span>}
                            {expiredLicenses.length > 0 && (
                              <span className="text-red-600 dark:text-red-400">
                                {expiredLicenses.length} scadut{expiredLicenses.length === 1 ? 'a' : 'e'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  header: 'Azioni',
                  accessor: (citizen) => (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/citizens/${citizen.id}`);
                      }}
                    >
                      Dettagli
                    </Button>
                  ),
                },
              ]}
              onRowClick={handleRowClick}
            />
          )}
        </div>
      </Card>
    </MainLayout>
  );
}
