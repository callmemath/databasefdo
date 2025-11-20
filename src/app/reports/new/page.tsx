'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import { ArrowLeft, Save, User, FileText, Calendar, AlertCircle, MapPin, Check, X, Search } from 'lucide-react';
import Link from 'next/link';
import { useReportTypes } from '@/config/report-types';

export default function ReportForm() {
  const router = useRouter();
  const reportCategories = useReportTypes();
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    citizenName: '',
    citizenId: '',
    accusedName: '',
    accusedId: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    description: '',
    location: '',
    anonymous: false,
  });
  
  // Carica il cittadino selezionato dall'URL se presente
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const citizenId = searchParams.get('citizenId');
    
    if (citizenId) {
      fetchCitizenById(parseInt(citizenId));
    }
  }, []);
  
  // Stati per la ricerca dei cittadini
  const [searchQuery, setSearchQuery] = useState('');
  const [accusedSearchQuery, setAccusedSearchQuery] = useState('');
  const [citizenSearchResults, setCitizenSearchResults] = useState<any[]>([]);
  const [accusedSearchResults, setAccusedSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAccusedSearching, setIsAccusedSearching] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [selectedAccused, setSelectedAccused] = useState<any>(null);
  
  // Utilizziamo i tipi di denuncia dalla configurazione
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // Se l'utente seleziona "anonymous", resetta i campi del cittadino
    if (name === 'anonymous' && checked) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: checked,
        citizenName: '',
        citizenId: ''
      }));
      setSearchQuery('');
      setSelectedCitizen(null);
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };
  
  // Funzione per cercare i cittadini in base al nome
  const searchCitizens = async (query: string, isAccused: boolean = false) => {
    if (query.length < 2) {
      if (!isAccused) {
        setCitizenSearchResults([]);
        setIsSearching(false);
      } else {
        setAccusedSearchResults([]);
        setIsAccusedSearching(false);
      }
      return;
    }

    if (!isAccused) {
      setIsSearching(true);
    } else {
      setIsAccusedSearching(true);
    }

    try {
      // Usa il parametro 'q' invece di 'search' come richiesto dall'API
      const response = await fetch(`/api/citizens?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!isAccused) {
        // Assicurati di utilizzare il campo citizens dalla risposta
        setCitizenSearchResults(data.citizens || []);
        setIsSearching(false);
      } else {
        setAccusedSearchResults(data.citizens || []);
        setIsAccusedSearching(false);
      }
    } catch (error) {
      console.error('Error searching citizens:', error);
      if (!isAccused) {
        setIsSearching(false);
      } else {
        setIsAccusedSearching(false);
      }
    }
  };

  // Gestisci la selezione di un cittadino
  const handleSelectCitizen = (citizen: any, isAccused: boolean = false) => {
    // Costruisci il nome completo dal nome e cognome
    const fullName = `${citizen.firstname || ''} ${citizen.lastname || ''}`.trim();
    
    if (!isAccused) {
      setSelectedCitizen(citizen);
      setFormData({
        ...formData,
        citizenName: fullName,
        citizenId: citizen.id
      });
      setCitizenSearchResults([]);
      // Imposta anche la query di ricerca per mostrare il nome nel campo input
      setSearchQuery(fullName);
    } else {
      setSelectedAccused(citizen);
      setFormData({
        ...formData,
        accusedName: fullName,
        accusedId: citizen.id
      });
      setAccusedSearchResults([]);
      // Imposta anche la query di ricerca per l'accusato
      setAccusedSearchQuery(fullName);
    }
  };

  // Aggiorna la ricerca quando cambia l'input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchCitizens(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Aggiorna la ricerca per l'accusato quando cambia l'input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (accusedSearchQuery) {
        searchCitizens(accusedSearchQuery, true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [accusedSearchQuery]);
  
  // Funzione per caricare un cittadino tramite ID
  const fetchCitizenById = async (id: number) => {
    try {
      const response = await fetch(`/api/citizens/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch citizen data');
      }
      
      const data = await response.json();
      if (data.citizen) {
        // Usa direttamente l'oggetto citizen restituito dall'API
        const citizen = data.citizen;
        
        // Seleziona il cittadino come denunciante
        handleSelectCitizen(citizen);
      }
    } catch (error) {
      console.error('Error fetching citizen:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isAnonymous: formData.anonymous, // Rinomina il campo per il backend
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create report');
      }
      
      const result = await response.json();
      console.log('Report created:', result);
      router.push('/reports');
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/reports" className="mr-4">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Torna alle denunce
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
            Nuova Denuncia
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main information */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
                Informazioni Denuncia
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                    Titolo Denuncia
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue"
                    placeholder="Inserisci un titolo descrittivo"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                    Tipo di Denuncia
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue"
                    required
                  >
                    <option value="">Seleziona tipo</option>
                    {reportCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                    Descrizione Dettagliata
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue"
                    placeholder="Descrivi in dettaglio l'accaduto..."
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                    Luogo dell'Accaduto
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-police-gray-dark dark:text-police-text-muted" />
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full pl-10 px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue"
                      placeholder="Indirizzo o descrizione del luogo"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <div className="w-full sm:w-1/2 mb-4 sm:mb-0">
                    <label htmlFor="date" className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                      Data dell'Accaduto
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-police-gray-dark dark:text-police-text-muted" />
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full pl-10 px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-1/2">
                    {/* Rimuoviamo la priorità poiché non è nella tabella del database */}
                    <div className="relative">
                      <div className="h-11"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="anonymous"
                      name="anonymous"
                      checked={formData.anonymous}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-police-blue focus:ring-police-blue border-police-gray dark:border-gray-600 rounded"
                    />
                    <label htmlFor="anonymous" className="ml-2 block text-sm text-police-gray-dark dark:text-police-text-muted">
                      Denuncia anonima
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar information */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
                Informazioni Cittadino
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="citizenName" className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                    Nome Denunciante
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-police-gray-dark dark:text-police-text-muted" />
                    <input
                      type="text"
                      id="citizenName"
                      name="citizenName"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        
                        // Aggiorna anche il campo del form quando si modifica l'input
                        setFormData({
                          ...formData,
                          citizenName: e.target.value
                        });
                        
                        if (!e.target.value) {
                          setSelectedCitizen(null);
                          setFormData({
                            ...formData,
                            citizenName: '',
                            citizenId: ''
                          });
                        }
                      }}
                      disabled={formData.anonymous}
                      className={`w-full pl-10 px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue ${
                        formData.anonymous ? 'bg-police-gray-light dark:bg-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder={formData.anonymous ? 'Anonimo' : 'Cerca denunciante...'}
                      required={!formData.anonymous}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-police-blue"></div>
                      </div>
                    )}
                  </div>
                  
                  {!formData.anonymous && citizenSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <ul className="py-1">
                        {citizenSearchResults.map((citizen) => (
                          <li 
                            key={citizen.id}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                            onClick={() => handleSelectCitizen(citizen)}
                          >
                            <User className="h-4 w-4 mr-2 text-police-gray-dark dark:text-gray-400" />
                            <div>
                              <div className="font-medium text-police-blue-dark dark:text-police-text-light">
                                {citizen.firstname} {citizen.lastname}
                              </div>
                              <div className="text-xs text-police-gray-dark dark:text-police-text-muted">
                                ID: {citizen.id}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {selectedCitizen && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                      <div>
                        <div className="font-medium text-green-700 dark:text-green-300">
                          Denunciante selezionato
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          {selectedCitizen.firstname} {selectedCitizen.lastname} (ID: {selectedCitizen.id})
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="accusedName" className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                    Nome Denunciato (opzionale)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-police-gray-dark dark:text-police-text-muted" />
                    <input
                      type="text"
                      id="accusedName"
                      name="accusedName"
                      value={accusedSearchQuery}
                      onChange={(e) => {
                        setAccusedSearchQuery(e.target.value);
                        
                        // Aggiorna anche il campo del form quando si modifica l'input
                        setFormData({
                          ...formData,
                          accusedName: e.target.value
                        });
                        
                        if (!e.target.value) {
                          setSelectedAccused(null);
                          setFormData({
                            ...formData,
                            accusedName: '',
                            accusedId: ''
                          });
                        }
                      }}
                      className="w-full pl-10 px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue"
                      placeholder="Cerca denunciato (se noto)..."
                    />
                    {isAccusedSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-police-blue"></div>
                      </div>
                    )}
                  </div>
                  
                  {accusedSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <ul className="py-1">
                        {accusedSearchResults.map((citizen) => (
                          <li 
                            key={citizen.id}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                            onClick={() => handleSelectCitizen(citizen, true)}
                          >
                            <User className="h-4 w-4 mr-2 text-police-gray-dark dark:text-gray-400" />
                            <div>
                              <div className="font-medium text-police-blue-dark dark:text-police-text-light">
                                {citizen.firstname} {citizen.lastname}
                              </div>
                              <div className="text-xs text-police-gray-dark dark:text-police-text-muted">
                                ID: {citizen.id}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {selectedAccused && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                      <div>
                        <div className="font-medium text-blue-700 dark:text-blue-300">
                          Denunciato selezionato
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {selectedAccused.firstname} {selectedAccused.lastname} (ID: {selectedAccused.id})
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.anonymous && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" />
                      <div className="text-yellow-700 dark:text-yellow-300">
                        <p className="font-medium mb-1">Denuncia anonima</p>
                        <p className="text-yellow-600 dark:text-yellow-400">
                          I dati personali non saranno registrati. Non sarà possibile contattarti per ulteriori informazioni.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            <Card>
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
                Azioni
              </h2>
              
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-police-blue dark:text-blue-400 mr-2 flex-shrink-0" />
                    <div className="text-police-blue-dark dark:text-blue-300">
                      <p className="font-medium mb-1">Informazione importante</p>
                      <p className="text-police-blue-dark/80 dark:text-blue-400">
                        Le false denunce sono perseguibili penalmente. Assicurati che le informazioni fornite siano accurate e veritiere.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Salva Denuncia
                  </Button>
                  
                  <Link href="/reports">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      leftIcon={<X className="h-4 w-4" />}
                    >
                      Annulla
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
