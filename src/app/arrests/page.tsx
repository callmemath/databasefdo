'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRealtimeRefresh } from '@/hooks/useRealtime';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import { formatDate } from '@/lib/utils';
import { 
  User, Search, AlertCircle, Clock, Calendar, ArrowRight, Check, Plus,
  FileText, MapPin, Info, X, Shield, FileInput, Users, BookOpen,
  Fingerprint, UserRound, Building2, FileSpreadsheet, Landmark, BadgeAlert,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function Arrests() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [isCreatingArrest, setIsCreatingArrest] = useState(false);
  const [selectedCrimes, setSelectedCrimes] = useState<string[]>([]);
  const [arrestNote, setArrestNote] = useState('');
  const [arrestLocation, setArrestLocation] = useState('');
  const [arrests, setArrests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [citizenSearchResults, setCitizenSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Nuovi campi aggiunti
  const [arrestDescription, setArrestDescription] = useState(''); // Descrizione accaduti
  const [seizedItems, setSeizedItems] = useState(''); // Oggetti sequestrati
  const [signingOfficers, setSigningOfficers] = useState<any[]>([]); // Firme operatori (oggetti completi)
  const [crimeSearchQuery, setCrimeSearchQuery] = useState(''); // Ricerca tra i reati
  const [filteredCrimes, setFilteredCrimes] = useState<any[]>([]); // Reati filtrati
  const [accomplices, setAccomplices] = useState<any[]>([]); // Complici noti
  const [accompliceSearchQuery, setAccompliceSearchQuery] = useState(''); // Ricerca complici
  const [accompliceSearchResults, setAccompliceSearchResults] = useState<any[]>([]); // Risultati ricerca complici
  const [isSearchingAccomplices, setIsSearchingAccomplices] = useState(false); // Stato ricerca complici
  const [officerSearchQuery, setOfficerSearchQuery] = useState(''); // Ricerca operatori
  const [officerSearchResults, setOfficerSearchResults] = useState<any[]>([]); // Risultati ricerca operatori
  const [isSearchingOfficers, setIsSearchingOfficers] = useState(false); // Stato ricerca operatori
  
  // Il dipartimento viene preso automaticamente dall'utente corrente
  const [currentUserDepartment, setCurrentUserDepartment] = useState('');
  
  // Available crimes list with sanctions
  const availableCrimes = [
    { id: 1, name: 'Rapina a mano armata', sentence: '8 anni', fine: 10000 },
    { id: 2, name: 'Guida in stato di ebbrezza', sentence: '6 mesi', fine: 1500 },
    { id: 3, name: 'Possesso di sostanze stupefacenti', sentence: '1 anno', fine: 2000 },
    { id: 4, name: 'Aggressione a pubblico ufficiale', sentence: '3 anni', fine: 5000 },
    { id: 5, name: 'Violazione di domicilio', sentence: '1 anno', fine: 1000 },
    { id: 6, name: 'Tentato omicidio', sentence: '10 anni', fine: 15000 },
    { id: 7, name: 'Furto d\'auto', sentence: '2 anni', fine: 3000 },
    { id: 8, name: 'Resistenza all\'arresto', sentence: '2 anni', fine: 2500 },
    { id: 9, name: 'Spaccio di sostanze stupefacenti', sentence: '5 anni', fine: 8000 },
    { id: 10, name: 'Omicidio', sentence: '20 anni', fine: 0 },
    { id: 11, name: 'Favoreggiamento', sentence: '3 anni', fine: 4000 },
    { id: 12, name: 'Ricettazione', sentence: '4 anni', fine: 6000 },
    { id: 13, name: 'Porto abusivo d\'armi', sentence: '3 anni', fine: 5000 },
    { id: 14, name: 'Sequestro di persona', sentence: '7 anni', fine: 9000 },
    { id: 15, name: 'Estorsione', sentence: '6 anni', fine: 8000 },
  ];
  
  // Dipartimenti disponibili
  const availableDepartments = [
    'Polizia di Stato',
    'Carabinieri',
    'Guardia di Finanza',
    'Polizia Penitenziaria',
    'Polizia Locale'
  ];
  
  // Recupera l'elenco degli arresti
  const fetchArrests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/arrests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Errore nel recupero degli arresti');
      }
      
      const data = await res.json();
      setArrests(data.arrests);
    } catch (error) {
      console.error('Errore durante il recupero degli arresti:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carica gli arresti all'avvio e inizializza i reati filtrati e il dipartimento dell'utente
  useEffect(() => {
    fetchArrests();
    setFilteredCrimes(availableCrimes);
    
    // Imposta il dipartimento dell'utente corrente
    if (session?.user?.department) {
      setCurrentUserDepartment(session.user.department);
    }
  }, [session]);

  // 🔴 Real-time: aggiorna automaticamente quando viene creato/modificato un arresto
  useRealtimeRefresh(['arrest_created', 'arrest_updated'], fetchArrests);
  
  // Removed months and fine calculations as per request #6
  const calculateTotals = () => {
    // Calculate crime totals with sanctions
    const crimes = selectedCrimes.map(crimeId => {
      const crime = availableCrimes.find(c => c.id === parseInt(crimeId));
      return crime || null;
    }).filter(crime => crime !== null);
    
    // Calculate total sentence and fine
    let totalFine = 0;
    const sentences: string[] = [];
    
    crimes.forEach(crime => {
      if (crime?.fine) totalFine += crime.fine;
      if (crime?.sentence) sentences.push(crime.sentence);
    });
    
    return { 
      totalCrimes: selectedCrimes.length,
      totalFine,
      sentences,
      crimes,
      crimesList: crimes.map(crime => crime?.name || '')
    };
  };
  
  // Riferimento per l'AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  const officerAbortControllerRef = useRef<AbortController | null>(null);
  const accompliceAbortControllerRef = useRef<AbortController | null>(null);
  
  // Cache per memorizzare l'ultima query di ricerca
  const lastSearchQueryRef = useRef<string>('');
  const lastOfficerSearchQueryRef = useRef<string>('');
  const lastAccompliceSearchQueryRef = useRef<string>('');
  
  // Cerca cittadini per nome - ottimizzato per evitare query multiple
  // Ricerca cittadini (sospetti)
  const handleSearch = async (query: string) => {
    // Salviamo la query in una costante per confronto
    const currentQuery = query.trim();
    setSearchQuery(currentQuery);
    
    // Se la query è la stessa dell'ultima ricerca, non fare nulla
    if (currentQuery === lastSearchQueryRef.current) {
      console.log('Query identica alla precedente, saltando la ricerca');
      return;
    }
    
    // Salva questa query come l'ultima eseguita
    lastSearchQueryRef.current = currentQuery;
    
    // Annulla eventuali richieste in corso
    if (abortControllerRef.current) {
      console.log('Annullamento richiesta precedente');
      abortControllerRef.current.abort();
    }
    
    // Se la query è vuota o troppo corta, pulisci i risultati e esci
    if (!currentQuery || currentQuery.length <= 2) {
      setCitizenSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // Crea un nuovo controller per questa richiesta
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      console.log(`Avvio ricerca per "${currentQuery}"`);
      setIsSearching(true);
      
      const res = await fetch(`/api/citizens?q=${encodeURIComponent(currentQuery)}&_=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        // Aggiungiamo l'AbortSignal alla richiesta
        signal: controller.signal
      });
      
      // Se la richiesta è stata annullata, non fare nulla
      if (controller.signal.aborted) {
        console.log('Richiesta annullata, ignorando i risultati');
        return;
      }
      
      // Handle 401 (Unauthorized) differently
      if (res.status === 401) {
        console.log('Sessione scaduta o non autorizzata per la ricerca cittadini');
        setCitizenSearchResults([]);
        return;
      }
      
      if (!res.ok) {
        console.error(`Errore nella ricerca dei cittadini: ${res.status} ${res.statusText}`);
        throw new Error(`Errore nella ricerca dei cittadini: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Verifica ancora una volta se la richiesta è stata annullata
      if (controller.signal.aborted) {
        console.log('Richiesta annullata dopo il parsing JSON, ignorando i risultati');
        return;
      }
      
      console.log(`Ricevuti ${data.citizens?.length || 0} risultati per "${currentQuery}"`);
      setCitizenSearchResults(data.citizens || []);
    } catch (error) {
      // Ignora gli errori dovuti all'annullamento
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Richiesta annullata');
        return;
      }
      
      console.error('Errore durante la ricerca dei cittadini:', error);
      setCitizenSearchResults([]);
    } finally {
      // Se questa richiesta non è stata annullata, rimuovi lo stato di ricerca
      if (abortControllerRef.current === controller) {
        console.log('Ricerca completata, rimozione stato di ricerca');
        // Add a small delay before removing the loading state to prevent flickering
        setTimeout(() => {
          setIsSearching(false);
        }, 300);
        
        // Pulizia del controller
        abortControllerRef.current = null;
      }
    }
  };
  
  // Ricerca complici (stessa API dei cittadini)
  const handleAccompliceSearch = async (query: string) => {
    const currentQuery = query.trim();
    setAccompliceSearchQuery(currentQuery);
    
    if (currentQuery === lastAccompliceSearchQueryRef.current) {
      return;
    }
    
    lastAccompliceSearchQueryRef.current = currentQuery;
    
    if (accompliceAbortControllerRef.current) {
      accompliceAbortControllerRef.current.abort();
    }
    
    if (!currentQuery || currentQuery.length <= 2) {
      setAccompliceSearchResults([]);
      setIsSearchingAccomplices(false);
      return;
    }
    
    const controller = new AbortController();
    accompliceAbortControllerRef.current = controller;
    
    try {
      setIsSearchingAccomplices(true);
      
      const res = await fetch(`/api/citizens?q=${encodeURIComponent(currentQuery)}&_=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      if (controller.signal.aborted) return;
      
      // Handle 401 (Unauthorized) differently
      if (res.status === 401) {
        console.log('Sessione scaduta o non autorizzata per la ricerca complici');
        setAccompliceSearchResults([]);
        return;
      }
      
      if (!res.ok) {
        console.error(`Errore nella ricerca dei complici: ${res.status} ${res.statusText}`);
        throw new Error(`Errore nella ricerca dei complici: ${res.status}`);
      }
      
      const data = await res.json();
      if (controller.signal.aborted) return;
      
      setAccompliceSearchResults(data.citizens || []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Errore durante la ricerca dei complici:', error);
      setAccompliceSearchResults([]);
    } finally {
      if (accompliceAbortControllerRef.current === controller) {
        setTimeout(() => setIsSearchingAccomplices(false), 300);
        accompliceAbortControllerRef.current = null;
      }
    }
  };
  
  // Ricerca operatori (agenti che firmano)
  const handleOfficerSearch = async (query: string) => {
    const currentQuery = query.trim();
    setOfficerSearchQuery(currentQuery);
    
    if (currentQuery === lastOfficerSearchQueryRef.current) {
      return;
    }
    
    lastOfficerSearchQueryRef.current = currentQuery;
    
    if (officerAbortControllerRef.current) {
      officerAbortControllerRef.current.abort();
    }
    
    if (!currentQuery || currentQuery.length <= 2) {
      setOfficerSearchResults([]);
      setIsSearchingOfficers(false);
      return;
    }
    
    const controller = new AbortController();
    officerAbortControllerRef.current = controller;
    
    try {
      setIsSearchingOfficers(true);
      
      // Usa l'API degli utenti invece che dei cittadini
      const res = await fetch(`/api/users?q=${encodeURIComponent(currentQuery)}&_=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      if (controller.signal.aborted) return;
      
      // Handle 401 (Unauthorized) differently - don't throw an error, just show empty results
      if (res.status === 401) {
        console.log('Sessione scaduta o non autorizzata per la ricerca operatori');
        setOfficerSearchResults([]);
        return;
      }
      
      if (!res.ok) {
        console.error(`Errore nella ricerca degli operatori: ${res.status} ${res.statusText}`);
        throw new Error(`Errore nella ricerca degli operatori: ${res.status}`);
      }
      
      const data = await res.json();
      if (controller.signal.aborted) return;
      
      setOfficerSearchResults(data.users || []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Errore durante la ricerca degli operatori:', error);
      setOfficerSearchResults([]);
    } finally {
      if (officerAbortControllerRef.current === controller) {
        setTimeout(() => setIsSearchingOfficers(false), 300);
        officerAbortControllerRef.current = null;
      }
    }
  };
  
  // Filtra i reati in base alla ricerca
  const handleCrimeSearch = (query: string) => {
    setCrimeSearchQuery(query);
    if (!query) {
      setFilteredCrimes(availableCrimes);
    } else {
      const searchTerm = query.toLowerCase();
      setFilteredCrimes(
        availableCrimes.filter(crime => crime.name.toLowerCase().includes(searchTerm))
      );
    }
  };

  // Seleziona un cittadino
  const selectCitizen = (citizen: any) => {
    console.log("Cittadino selezionato:", citizen);
    // Assicuriamoci che l'id sia presente e sia un numero
    const id = typeof citizen.id === 'string' ? parseInt(citizen.id) : citizen.id;
    setSelectedCitizen({
      ...citizen,
      id: id, // Assicuriamo che l'ID sia esplicitamente assegnato
      name: `${citizen.firstname} ${citizen.lastname}`,
      birthDate: citizen.dateofbirth ? formatDate(new Date(citizen.dateofbirth)) : 'N/A'
    });
    setCitizenSearchResults([]);
    setSearchQuery(`${citizen.firstname} ${citizen.lastname}`);
  };
  
  const handleCreateArrest = () => {
    setIsCreatingArrest(true);
  };
  
  // Toggle per i reati selezionati
  const handleCrimeToggle = (crimeId: string) => {
    if (selectedCrimes.includes(crimeId)) {
      setSelectedCrimes(selectedCrimes.filter(id => id !== crimeId));
    } else {
      setSelectedCrimes([...selectedCrimes, crimeId]);
    }
  };
  
  // Gestione dei complici
  const addAccomplice = (citizen: any) => {
    // Verifica che non sia già nella lista
    if (!accomplices.some(acc => acc.id === citizen.id)) {
      setAccomplices([
        ...accomplices, 
        {
          id: citizen.id,
          name: `${citizen.firstname} ${citizen.lastname}`,
          birthDate: citizen.dateofbirth ? formatDate(new Date(citizen.dateofbirth)) : 'N/A'
        }
      ]);
    }
    // Pulisci la ricerca
    setAccompliceSearchQuery('');
    setAccompliceSearchResults([]);
  };
  
  // Rimozione di un complice
  const removeAccomplice = (id: number) => {
    setAccomplices(accomplices.filter(acc => acc.id !== id));
  };
  
  // Aggiunta di un operatore che firma (ora salva l'oggetto officer completo)
  const addSigningOfficer = (officer: any) => {
    // Verifica che l'officer non sia già nella lista confrontando gli ID
    if (!signingOfficers.some(o => o.id === officer.id)) {
      setSigningOfficers([...signingOfficers, officer]);
    }
    // Pulisci la ricerca
    setOfficerSearchQuery('');
    setOfficerSearchResults([]);
  };
  
  // Rimozione di un operatore che firma
  const removeSigningOfficer = (officerId: string) => {
    setSigningOfficers(signingOfficers.filter(officer => officer.id.toString() !== officerId));
  };
  
  // Registra un nuovo arresto
  const handleSubmitArrest = async () => {
    if (!selectedCitizen || selectedCrimes.length === 0 || !arrestLocation || !arrestDescription) {
      alert("Devi compilare tutti i campi obbligatori: cittadino, reati, luogo dell'arresto e descrizione accaduti");
      return;
    }

    // Verifica esplicita dell'ID del cittadino
    if (!selectedCitizen.id) {
      alert("ID del cittadino mancante. Per favore, seleziona nuovamente il cittadino.");
      return;
    }

    try {
      // Prepara i dati dell'arresto
      const crimesList = selectedCrimes.map(id => {
        const crime = availableCrimes.find(c => c.id === parseInt(id));
        return crime ? crime.name : '';
      }).filter(name => name !== '');
      
      // Prepara i dati dei complici
      const accomplicesList = accomplices.map(acc => ({
        id: acc.id,
        name: acc.name,
        birthDate: acc.birthDate
      }));
      
      // Raccoglie le informazioni sugli agenti firmatori - ora usa direttamente gli oggetti salvati
      const signingOfficersList = signingOfficers.map(officer => ({
        id: officer.id,
        name: `${officer.name} ${officer.surname}`,
        badge: officer.badge
      }));
      
      // Calcola totale sanzioni
      const totals = calculateTotals();
      const totalSentence = totals.sentences.length > 0 ? totals.sentences.join(', ') : null;
      const totalFine = totals.totalFine > 0 ? totals.totalFine : null;
      
      console.log("📊 Sanzioni calcolate:", {
        reatiSelezionati: selectedCrimes,
        totals,
        totalSentence,
        totalFine
      });
      
      // Assicuriamo che citizenId sia un numero (o una stringa che rappresenta un numero)
      const citizenId = selectedCitizen.id;
      
      const arrestData = {
        citizenId: citizenId,
        location: arrestLocation,
        description: arrestNote || "Nessuna nota aggiuntiva",
        incidentDescription: arrestDescription, // Descrizione accaduti (nuovo)
        seizedItems: seizedItems, // Oggetti sequestrati (nuovo)
        department: currentUserDepartment, // Corpo di appartenenza preso dall'utente corrente
        charges: crimesList.join(', '),
        sentence: totalSentence, // Sentenza totale calcolata
        fine: totalFine, // Multa totale calcolata
        accomplices: accomplicesList, // Complici (nuovo)
        signingOfficers: signingOfficersList // Operatori firmatari (nuovo)
      };

      // Log dei dati che stiamo per inviare all'API
      console.log("📤 Dati completi dell'arresto che stiamo inviando:", arrestData);
      console.log("🔍 Dettaglio sanzioni - sentence:", totalSentence, "fine:", totalFine);

      // Invia i dati all'API
      const response = await fetch('/api/arrests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(arrestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Errore nella registrazione dell'arresto:", response.status, errorText);
        throw new Error(`Errore nella registrazione dell'arresto: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      // Reset form and refresh the list
      setSelectedCitizen(null);
      setIsCreatingArrest(false);
      setSelectedCrimes([]);
      setArrestNote('');
      setArrestLocation('');
      setArrestDescription('');
      setSeizedItems('');
      // Il department è preso automaticamente dall'utente corrente
      setSigningOfficers([]); // Pulisci gli operatori firmatari
      setAccomplices([]);
      setSearchQuery('');
      
      // Aggiorna la lista degli arresti
      fetchArrests();
    } catch (error) {
      console.error('Errore durante la registrazione dell\'arresto:', error);
      alert('Si è verificato un errore durante la registrazione dell\'arresto.');
    }
  };
  
  const { totalCrimes, crimesList } = calculateTotals();

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">
              Sistema Arresti
            </h1>
            <p className="text-police-gray-dark dark:text-gray-300 mt-2 flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Gestione degli arresti e dei crimini
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleCreateArrest}
              disabled={isCreatingArrest}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              Crea Nuovo Arresto
            </Button>
          </div>
        </div>
      </div>
      
      {isCreatingArrest ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="Ricerca Cittadino">
              <div className="relative">
                <SearchInput 
                  onSearch={handleSearch} 
                  placeholder="Cerca per nome o cognome..." 
                  className="mb-2"
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    
                    // Aggiorna solo il valore visualizzato, la ricerca viene gestita dal componente
                    setSearchQuery(newValue);
                    
                    // Gestisci lo stato di ricerca e i risultati vuoti quando l'input è troppo corto
                    if (newValue.length <= 2) {
                      setCitizenSearchResults([]);
                      setIsSearching(false);
                    } else if (newValue.trim() !== lastSearchQueryRef.current) {
                      // Mostra lo stato di ricerca solo se è una nuova query
                      setIsSearching(true);
                    }
                  }}
                  autoSearch={true}
                  searchDelay={1000} // Delay più lungo per garantire meno richieste
                  minLength={3}
                />
                
                {/* Risultati di ricerca */}
                {!selectedCitizen && searchQuery.length > 2 && (
                  <div className="absolute w-full z-10 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-police-gray dark:border-gray-600 max-h-60 overflow-y-auto">
                    {/* Always show results when available, even if still searching */}
                    {citizenSearchResults.length > 0 ? (
                      <>
                        {/* Show a subtle loading indicator at the top when searching */}
                        {isSearching && (
                          <div className="p-1 bg-police-blue-light bg-opacity-20 dark:bg-blue-900 dark:bg-opacity-30 text-center">
                            <div className="animate-pulse text-xs text-police-blue-dark dark:text-blue-300">
                              Aggiornamento risultati...
                            </div>
                          </div>
                        )}
                        {/* Always show available results */}
                        {citizenSearchResults.map((citizen, index) => (
                          <div 
                            key={`citizen-${citizen.id || index}`} 
                            className="p-2 hover:bg-police-gray-light dark:hover:bg-gray-700 cursor-pointer border-b border-police-gray dark:border-gray-600 last:border-b-0"
                            onClick={() => selectCitizen(citizen)}
                          >
                            <div className="font-medium dark:text-white">
                              {citizen.firstname} {citizen.lastname}
                            </div>
                            <div className="text-xs text-police-gray-dark dark:text-gray-300">
                              {citizen.dateofbirth ? formatDate(new Date(citizen.dateofbirth)) : 'N/A'} • {citizen.sex || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : isSearching ? (
                      <div className="p-3 text-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-police-blue mx-auto"></div>
                        <p className="text-sm text-police-gray-dark dark:text-gray-300 mt-1">Ricerca in corso...</p>
                      </div>
                    ) : (
                      <div className="p-3 text-center">
                        <p className="text-sm text-police-gray-dark dark:text-gray-300">
                          Nessun cittadino trovato. Prova con termini diversi.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              

              
              {selectedCitizen ? (
                <div className="bg-police-gray-light dark:bg-gray-700 rounded-lg p-4 animate-fade-in mt-4">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-police-blue dark:bg-police-blue-dark flex items-center justify-center text-white font-medium mr-3">
                      {selectedCitizen.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-medium text-police-blue-dark dark:text-white">
                        {selectedCitizen.name}
                      </h3>
                      <div className="flex items-center text-sm text-police-gray-dark dark:text-gray-300">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Nato il {selectedCitizen.birthDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-police-gray-dark dark:text-gray-300">
                    Seleziona i reati nella sezione a fianco per procedere con l'arresto.
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-police-gray-light dark:bg-gray-700 rounded-lg mt-4">
                  <Search className="h-10 w-10 text-police-gray-dark dark:text-gray-300 mx-auto mb-2" />
                  <p className="text-police-gray-dark dark:text-gray-300">
                    Cerca un cittadino per nome per procedere con l'arresto
                  </p>
                </div>
              )}
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card title="Dettagli Arresto">
              {selectedCitizen ? (
                <div className="space-y-6">
                  {/* Luogo dell'arresto */}
                  <div>
                    <label htmlFor="arrestLocation" className="block text-sm font-medium text-police-blue-dark dark:text-white mb-2">
                      Luogo dell'Arresto *
                    </label>
                    <input
                      id="arrestLocation"
                      type="text"
                      className="w-full rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light focus:border-police-blue dark:focus:border-blue-400 focus:ring focus:ring-police-blue dark:focus:ring-blue-400 focus:ring-opacity-50"
                      placeholder="Inserisci il luogo dell'arresto..."
                      value={arrestLocation}
                      onChange={(e) => setArrestLocation(e.target.value)}
                    />
                  </div>
                
                  {/* Selezione dei reati con ricerca */}
                  <div>
                    <h3 className="font-medium text-police-blue-dark dark:text-white mb-3">
                      Seleziona Reati *
                    </h3>
                    
                    {/* Ricerca reati */}
                    <div className="mb-3">
                      <input
                        type="text"
                        className="w-full rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light focus:border-police-blue dark:focus:border-blue-400 focus:ring focus:ring-police-blue dark:focus:ring-blue-400 focus:ring-opacity-50"
                        placeholder="Cerca tra i reati..."
                        value={crimeSearchQuery}
                        onChange={(e) => handleCrimeSearch(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredCrimes.map(crime => (
                        <div 
                          key={`crime-${crime.id}`}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedCrimes.includes(crime.id.toString())
                              ? 'border-police-blue bg-police-blue bg-opacity-5 dark:border-blue-400 dark:bg-blue-900 dark:bg-opacity-30'
                              : 'border-police-gray hover:border-police-blue-light dark:border-gray-600 dark:hover:border-blue-400'
                          }`}
                          onClick={() => handleCrimeToggle(crime.id.toString())}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm dark:text-white">
                              {crime.name}
                            </span>
                            {selectedCrimes.includes(crime.id.toString()) && (
                              <Check className="h-4 w-4 text-police-blue dark:text-blue-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Descrizione accaduti */}
                  <div className="mb-4">
                    <label htmlFor="arrestDescription" className="block text-sm font-medium text-police-blue-dark dark:text-white mb-2">
                      Descrizione Accaduti *
                    </label>
                    <textarea
                      id="arrestDescription"
                      rows={4}
                      className="w-full rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light focus:border-police-blue dark:focus:border-blue-400 focus:ring focus:ring-police-blue dark:focus:ring-blue-400 focus:ring-opacity-50"
                      placeholder="Descrivi dettagliatamente l'accaduto..."
                      value={arrestDescription}
                      onChange={(e) => setArrestDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  
                  {/* Oggetti sequestrati */}
                  <div className="mb-4">
                    <label htmlFor="seizedItems" className="block text-sm font-medium text-police-blue-dark dark:text-white mb-2">
                      Oggetti Sequestrati
                    </label>
                    <textarea
                      id="seizedItems"
                      rows={2}
                      className="w-full rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light focus:border-police-blue dark:focus:border-blue-400 focus:ring focus:ring-police-blue dark:focus:ring-blue-400 focus:ring-opacity-50"
                      placeholder="Elenca gli oggetti sequestrati (armi, droga, refurtiva, ecc.)..."
                      value={seizedItems}
                      onChange={(e) => setSeizedItems(e.target.value)}
                    ></textarea>
                  </div>
                  
                  {/* Corpo di appartenenza */}
                  <div className="mb-4">
                    <label htmlFor="department" className="block text-sm font-medium text-police-blue-dark dark:text-white mb-2">
                      Corpo di Appartenenza
                    </label>
                    <div className="flex items-center border rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-gray-100 px-4 py-2">
                      <Building2 className="h-4 w-4 mr-2 text-police-blue dark:text-blue-400" />
                      {currentUserDepartment ? (
                        <span>{currentUserDepartment}</span>
                      ) : (
                        <span className="text-police-gray-dark dark:text-gray-400 italic">Caricamento dipartimento...</span>
                      )}
                    </div>
                    <p className="text-xs text-police-gray-dark dark:text-gray-400 mt-1">
                      Il dipartimento viene impostato automaticamente in base all'utente corrente
                    </p>
                  </div>
                  
                  {/* Firme operatori */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-police-blue-dark dark:text-white mb-2">
                      Firme Operatori
                    </label>
                    
                    <div className="mb-2">
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light focus:border-police-blue dark:focus:border-blue-400 focus:ring focus:ring-police-blue dark:focus:ring-blue-400 focus:ring-opacity-50"
                          placeholder="Cerca operatore per nome o ID..."
                          value={officerSearchQuery}
                          onChange={(e) => {
                            setOfficerSearchQuery(e.target.value);
                            if (e.target.value.length > 2) {
                              handleOfficerSearch(e.target.value);
                            } else {
                              setOfficerSearchResults([]);
                              setIsSearchingOfficers(false);
                            }
                          }}
                        />
                        
                        {/* Risultati ricerca operatori */}
                        {officerSearchQuery.length > 2 && (
                          <div className="absolute w-full z-10 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-police-gray dark:border-gray-600 max-h-60 overflow-y-auto">
                            {isSearchingOfficers ? (
                              <div className="p-3 text-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-police-blue mx-auto"></div>
                                <p className="text-sm text-police-gray-dark dark:text-gray-300 mt-1">Ricerca in corso...</p>
                              </div>
                            ) : officerSearchResults.length > 0 ? (
                              officerSearchResults.map((officer) => (
                                <div 
                                  key={`officer-${officer.id}`} 
                                  className="p-2 hover:bg-police-gray-light dark:hover:bg-gray-700 cursor-pointer border-b border-police-gray dark:border-gray-600 last:border-b-0"
                                  onClick={() => addSigningOfficer(officer)}
                                >
                                  <div className="font-medium dark:text-white">
                                    {officer.name} {officer.surname}
                                  </div>
                                  <div className="text-xs text-police-gray-dark dark:text-gray-300">
                                    ID: {officer.id} • Badge: {officer.badge || 'N/A'}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center">
                                <p className="text-sm text-police-gray-dark dark:text-gray-300">
                                  Nessun operatore trovato
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Operatori selezionati */}
                    {signingOfficers.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {signingOfficers.map((officer) => (
                          <div key={`selected-officer-${officer.id}`} className="flex items-center justify-between bg-police-gray-light dark:bg-gray-700 rounded-md p-2">
                            <div>
                              <span className="text-sm font-medium text-police-blue-dark dark:text-white">
                                {officer.name} {officer.surname}
                              </span>
                              <div className="text-xs text-police-gray-dark dark:text-gray-300">
                                Badge: {officer.badge || 'N/A'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSigningOfficer(officer.id.toString())}
                              className="text-police-gray-dark hover:text-police-accent-red dark:text-gray-300 dark:hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Complici noti */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-police-blue-dark dark:text-white mb-2">
                      Complici Noti
                    </label>
                    
                    <div className="mb-2">
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light focus:border-police-blue dark:focus:border-blue-400 focus:ring focus:ring-police-blue dark:focus:ring-blue-400 focus:ring-opacity-50"
                          placeholder="Cerca complice per nome..."
                          value={accompliceSearchQuery}
                          onChange={(e) => {
                            setAccompliceSearchQuery(e.target.value);
                            if (e.target.value.length > 2) {
                              handleAccompliceSearch(e.target.value);
                            } else {
                              setAccompliceSearchResults([]);
                              setIsSearchingAccomplices(false);
                            }
                          }}
                        />
                        
                        {/* Risultati ricerca complici */}
                        {accompliceSearchQuery.length > 2 && (
                          <div className="absolute w-full z-10 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-police-gray dark:border-gray-600 max-h-60 overflow-y-auto">
                            {isSearchingAccomplices ? (
                              <div className="p-3 text-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-police-blue mx-auto"></div>
                                <p className="text-sm text-police-gray-dark dark:text-gray-300 mt-1">Ricerca in corso...</p>
                              </div>
                            ) : accompliceSearchResults.length > 0 ? (
                              accompliceSearchResults.map((citizen) => (
                                <div 
                                  key={`accomplice-${citizen.id}`} 
                                  className="p-2 hover:bg-police-gray-light dark:hover:bg-gray-700 cursor-pointer border-b border-police-gray dark:border-gray-600 last:border-b-0"
                                  onClick={() => addAccomplice(citizen)}
                                >
                                  <div className="font-medium dark:text-white">
                                    {citizen.firstname} {citizen.lastname}
                                  </div>
                                  <div className="text-xs text-police-gray-dark dark:text-gray-300">
                                    {citizen.dateofbirth ? formatDate(new Date(citizen.dateofbirth)) : 'N/A'} • {citizen.sex || 'N/A'}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center">
                                <p className="text-sm text-police-gray-dark dark:text-gray-300">
                                  Nessun cittadino trovato
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Complici selezionati */}
                    {accomplices.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {accomplices.map((accomplice) => (
                          <div key={`selected-accomplice-${accomplice.id}`} className="flex items-center justify-between bg-police-gray-light dark:bg-gray-700 rounded-md p-2">
                            <div>
                              <span className="text-sm font-medium text-police-blue-dark dark:text-white">
                                {accomplice.name}
                              </span>
                              <div className="text-xs text-police-gray-dark dark:text-gray-300">
                                Nato il: {accomplice.birthDate}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAccomplice(accomplice.id)}
                              className="text-police-gray-dark hover:text-police-accent-red dark:text-gray-300 dark:hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Note dell'arresto */}
                  <div className="mb-4">
                    <label htmlFor="arrestNote" className="block text-sm font-medium text-police-blue-dark dark:text-white mb-2">
                      Note Aggiuntive
                    </label>
                    <textarea
                      id="arrestNote"
                      rows={2}
                      className="w-full rounded-md border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light focus:border-police-blue dark:focus:border-blue-400 focus:ring focus:ring-police-blue dark:focus:ring-blue-400 focus:ring-opacity-50"
                      placeholder="Inserisci note aggiuntive sull'arresto..."
                      value={arrestNote}
                      onChange={(e) => setArrestNote(e.target.value)}
                    ></textarea>
                  </div>
                  
                  {/* Riepilogo reati con sanzioni */}
                  <div className="bg-police-gray-light dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-police-blue-dark dark:text-white mb-2">
                      Riepilogo Reati e Sanzioni
                    </h4>
                    <div className="flex justify-between mb-2">
                      <span className="text-police-gray-dark dark:text-gray-300">Reati selezionati:</span>
                      <span className="font-medium dark:text-white">{totalCrimes}</span>
                    </div>
                    
                    {calculateTotals().crimes.length > 0 && (
                      <div>
                        <div className="mt-3 border-t border-police-gray/30 dark:border-gray-600 pt-3">
                          <div className="grid grid-cols-3 gap-2 text-xs uppercase font-medium text-police-gray-dark dark:text-gray-400 mb-1">
                            <div>Reato</div>
                            <div>Sentenza</div>
                            <div>Multa</div>
                          </div>
                          <div className="space-y-2">
                            {calculateTotals().crimes.map((crime, index) => (
                              <div key={`crime-summary-${index}`} className="grid grid-cols-3 gap-2 text-sm border-b border-police-gray/20 dark:border-gray-700 pb-1">
                                <div className="text-police-blue-dark dark:text-blue-300">{crime?.name}</div>
                                <div className="text-police-blue-dark dark:text-blue-300 flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1 text-police-blue dark:text-blue-400" />
                                  {crime?.sentence || '-'}
                                </div>
                                <div className="text-police-accent-red dark:text-red-400 flex items-center">
                                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                                  {crime?.fine ? `€ ${crime.fine.toLocaleString()}` : '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-police-gray/30 dark:border-gray-600 flex justify-between">
                          <div className="font-medium text-police-blue-dark dark:text-white">Totale sanzioni:</div>
                          <div className="font-bold text-police-accent-red dark:text-red-400">
                            € {calculateTotals().totalFine.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Pulsanti di azione */}
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setIsCreatingArrest(false);
                        setSelectedCitizen(null);
                        setSelectedCrimes([]);
                        setArrestNote('');
                        setArrestLocation('');
                        setSearchQuery('');
                      }}
                    >
                      Annulla
                    </Button>
                    <Button
                      variant="primary"
                      disabled={selectedCrimes.length === 0 || !arrestLocation}
                      onClick={handleSubmitArrest}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Conferma Arresto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <AlertCircle className="h-12 w-12 text-police-gray-dark dark:text-gray-300 mx-auto mb-3" />
                  <p className="text-police-gray-dark dark:text-gray-300">
                    Seleziona prima un cittadino per procedere con l'arresto
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card title="Ultimi Arresti Effettuati" className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue"></div>
              <p className="ml-3 text-police-gray-dark dark:text-gray-300">Caricamento arresti...</p>
            </div>
          ) : arrests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <Table.Header>
                  <Table.Row className="bg-police-gray-light dark:bg-gray-700">
                    <Table.HeaderCell className="whitespace-nowrap">#</Table.HeaderCell>
                    <Table.HeaderCell className="whitespace-nowrap">Cittadino</Table.HeaderCell>
                    <Table.HeaderCell className="whitespace-nowrap">Data / Ora</Table.HeaderCell>
                    <Table.HeaderCell className="whitespace-nowrap">Luogo</Table.HeaderCell>
                    <Table.HeaderCell className="whitespace-nowrap">Accuse</Table.HeaderCell>
                    <Table.HeaderCell className="whitespace-nowrap">Sanzione</Table.HeaderCell>
                    <Table.HeaderCell className="whitespace-nowrap">Dipartimento</Table.HeaderCell>
                    <Table.HeaderCell className="whitespace-nowrap">Azioni</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {arrests.map((arrest, index) => {
                    // Format date and time
                    const arrestDate = arrest.date ? new Date(arrest.date) : null;
                    const formattedDate = arrestDate ? formatDate(arrestDate) : 'N/A';
                    const formattedTime = arrestDate 
                      ? `${arrestDate.getHours().toString().padStart(2, '0')}:${arrestDate.getMinutes().toString().padStart(2, '0')}` 
                      : 'N/A';
                    
                    // Get first charges for display
                    const charges = arrest.charges ? arrest.charges.split(',') : [];
                    const firstCharge = charges.length > 0 ? charges[0].trim() : 'N/A';
                    const otherCharges = charges.length > 1 ? `+ ${charges.length - 1} altri` : '';

                    return (
                      <Table.Row 
                        key={`arrest-${arrest.id || index}`}
                        className="hover:bg-police-gray-light/50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                      >
                        <Table.Cell className="font-medium text-police-blue-dark dark:text-blue-400">
                          #{index + 1}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-police-blue dark:bg-police-blue-dark flex items-center justify-center text-white font-medium mr-3 shadow-sm">
                              {arrest.citizen?.firstname?.[0] || '?'}{arrest.citizen?.lastname?.[0] || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-police-blue-dark dark:text-white">
                                {arrest.citizen ? `${arrest.citizen.firstname} ${arrest.citizen.lastname}` : 'Sconosciuto'}
                              </div>
                              <div className="text-xs text-police-gray-dark dark:text-gray-400">
                                ID: {arrest.citizen?.id || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formattedDate}</span>
                            <span className="text-xs text-police-gray-dark dark:text-gray-400">{formattedTime}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-police-blue dark:text-blue-400" />
                            <span className="truncate max-w-[150px]" title={arrest.location}>{arrest.location}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div>
                            <div className="font-medium">{firstCharge}</div>
                            {otherCharges && (
                              <div className="text-xs text-police-gray-dark dark:text-gray-400">{otherCharges}</div>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-col">
                            {arrest.sentence && (
                              <span className="flex items-center text-police-blue-dark dark:text-blue-400">
                                <Clock className="h-3.5 w-3.5 mr-1" /> {arrest.sentence}
                              </span>
                            )}
                            {arrest.fine && (
                              <span className="flex items-center text-police-accent-red dark:text-red-400">
                                <DollarSign className="h-3.5 w-3.5 mr-1" /> € {arrest.fine}
                              </span>
                            )}
                            {!arrest.sentence && !arrest.fine && (
                              <span className="text-police-gray-dark dark:text-gray-300 italic text-sm">
                                Non specificata
                              </span>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-1 text-police-blue dark:text-blue-400" />
                            <span>{arrest.department || arrest.officer?.department || 'Non specificato'}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Link href={`/arrests/${arrest.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Info className="h-3.5 w-3.5" />}
                              className="hover:bg-police-blue hover:text-white dark:hover:bg-blue-600 transition-colors duration-200"
                            >
                              Dettagli
                            </Button>
                          </Link>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <div className="text-center p-12 flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-police-gray-dark dark:text-gray-300 mb-4" />
              <p className="text-police-gray-dark dark:text-gray-300 text-lg">
                Nessun arresto recente. 
              </p>
              <p className="text-police-gray-dark dark:text-gray-300 mt-2">
                Clicca su "Crea Nuovo Arresto" per registrare un nuovo fermo.
              </p>
            </div>
          )}
        </Card>
      )}
    </MainLayout>
  );
}
