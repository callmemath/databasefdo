'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import { 
  ArrowLeft, Save, User, Trash2, Calendar, MapPin, Check, X, 
  AlertCircle, Edit, FileText, Lock, Unlock, Eye
} from 'lucide-react';
import Link from 'next/link';
import { reportTypes, getReportTypeName } from '@/config/report-types';
import React from 'react';

export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Estrai i parametri usando React.use() come raccomandato da Next.js
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form data per le modifiche
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    citizenName: '',
    citizenId: '',
    accusedName: '',
    accusedId: '',
    date: '',
    priority: 'medium',
    description: '',
    location: '',
    isAnonymous: false,
  });
  
  // Stati per la ricerca dei cittadini
  const [searchQuery, setSearchQuery] = useState('');
  const [accusedSearchQuery, setAccusedSearchQuery] = useState('');
  const [citizenSearchResults, setCitizenSearchResults] = useState<any[]>([]);
  const [accusedSearchResults, setAccusedSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAccusedSearching, setIsAccusedSearching] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [selectedAccused, setSelectedAccused] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Carica i dati della denuncia
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reports/${id}`);
        
        if (!response.ok) {
          throw new Error(`Errore nel caricamento della denuncia: ${response.statusText}`);
        }
        
        const data = await response.json();
        setReport(data.report);
        
        // Imposta il formData con i dati attuali
        setFormData({
          title: data.report.title,
          type: data.report.type,
          citizenName: data.report.citizen ? `${data.report.citizen.firstname} ${data.report.citizen.lastname}` : '',
          citizenId: data.report.citizenId?.toString() || '',
          accusedName: data.report.accused ? `${data.report.accused.firstname} ${data.report.accused.lastname}` : '',
          accusedId: data.report.accusedId?.toString() || '',
          date: new Date(data.report.date).toISOString().split('T')[0],
          priority: data.report.priority || 'medium',
          description: data.report.description,
          location: data.report.location,
          isAnonymous: Boolean(data.report.isAnonymous),
        });
        
        // Imposta anche i cittadini selezionati se presenti
        if (data.report.citizen) {
          setSelectedCitizen(data.report.citizen);
          setSearchQuery(`${data.report.citizen.firstname} ${data.report.citizen.lastname}`);
        }
        
        if (data.report.accused) {
          setSelectedAccused(data.report.accused);
          setAccusedSearchQuery(`${data.report.accused.firstname} ${data.report.accused.lastname}`);
        }
        
      } catch (err: any) {
        setError(err.message);
        console.error('Errore durante il caricamento della denuncia:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [id]);
  
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
      const response = await fetch(`/api/citizens?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!isAccused) {
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
    if (!isEditing) return;
    
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchCitizens(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isEditing]);

  // Aggiorna la ricerca per l'accusato quando cambia l'input
  useEffect(() => {
    if (!isEditing) return;
    
    const timer = setTimeout(() => {
      if (accusedSearchQuery) {
        searchCitizens(accusedSearchQuery, true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [accusedSearchQuery, isEditing]);
  
  // Gestisci il cambiamento dei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gestisci il cambiamento dei checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name === 'isAnonymous' && checked) {
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
  
  // Funzione per salvare le modifiche
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isAnonymous: formData.isAnonymous
        }),
      });
      
      if (!response.ok) {
        throw new Error('Errore durante il salvataggio delle modifiche');
      }
      
      const result = await response.json();
      setReport(result.report);
      setIsEditing(false);
      
      // Mostra un messaggio di conferma (potrebbe essere implementato con un toast)
      alert('Denuncia aggiornata con successo');
    } catch (error) {
      console.error('Errore durante il salvataggio delle modifiche:', error);
      alert('Si è verificato un errore durante il salvataggio delle modifiche');
    }
  };
  
  // Funzione per eliminare la denuncia
  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questa denuncia? Questa azione è irreversibile.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione della denuncia");
      }
      
      router.push('/reports');
    } catch (error) {
      console.error("Errore durante l'eliminazione della denuncia:", error);
      alert("Si è verificato un errore durante l'eliminazione della denuncia");
    }
  };
  
  // Funzione per formattare la data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 mb-4">
          <p className="font-semibold">Si è verificato un errore:</p>
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/reports')}
          >
            Torna alle denunce
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  if (!report) {
    return (
      <MainLayout>
        <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 mb-4">
          <p>Denuncia non trovata</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/reports')}
          >
            Torna alle denunce
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/reports" className="mr-4">
              <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Torna alle denunce
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              {isEditing ? 'Modifica Denuncia' : 'Dettagli Denuncia'}
            </h1>
          </div>
          
          {!isEditing && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                leftIcon={<Edit className="h-4 w-4" />}
                onClick={() => setIsEditing(true)}
              >
                Modifica
              </Button>
              <Button 
                variant="danger" 
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
              >
                Elimina
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSaveChanges}>
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
                      {reportTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
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
                        id="isAnonymous"
                        name="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-police-blue focus:ring-police-blue border-police-gray dark:border-gray-600 rounded"
                      />
                      <label htmlFor="isAnonymous" className="ml-2 block text-sm text-police-gray-dark dark:text-police-text-muted">
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
                        disabled={formData.isAnonymous}
                        className={`w-full pl-10 px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue ${
                          formData.isAnonymous ? 'bg-police-gray-light dark:bg-gray-600 cursor-not-allowed' : ''
                        }`}
                        placeholder={formData.isAnonymous ? 'Anonimo' : 'Cerca denunciante...'}
                        required={!formData.isAnonymous}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-police-blue"></div>
                        </div>
                      )}
                    </div>
                    
                    {!formData.isAnonymous && citizenSearchResults.length > 0 && (
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
                  
                  {formData.isAnonymous && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" />
                        <div className="text-yellow-700 dark:text-yellow-300">
                          <p className="font-medium mb-1">Denuncia anonima</p>
                          <p className="text-yellow-600 dark:text-yellow-400">
                            I dati personali non saranno registrati. Non sarà possibile contattare il denunciante per ulteriori informazioni.
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
                  <div className="flex flex-col space-y-3">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Salva Modifiche
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={() => setIsEditing(false)}
                    >
                      Annulla
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
                {report.title}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                    Tipo di Denuncia
                  </h3>
                  <p className="text-police-blue-dark dark:text-police-text-light">
                    {getReportTypeName(report.type)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                    Data dell'Accaduto
                  </h3>
                  <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                    {formatDate(report.date)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                    Luogo dell'Accaduto
                  </h3>
                  <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                    {report.location}
                  </p>
                </div>
                
                {/* Rimuoviamo la priorità poiché non è nella tabella del database */}
              </div>
              
              <div className="border-t border-police-gray dark:border-gray-600 pt-4">
                <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-2">
                  Descrizione Dettagliata
                </h3>
                <div className="prose prose-sm max-w-none text-police-blue-dark dark:text-police-text-light">
                  <p className="whitespace-pre-line">{report.description}</p>
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                <div className="flex items-center">
                  {report.isAnonymous ? (
                    <Lock className="h-4 w-4 text-police-blue dark:text-police-blue mr-2" />
                  ) : (
                    <Unlock className="h-4 w-4 text-police-blue dark:text-police-blue mr-2" />
                  )}
                  <span className="text-sm text-police-gray-dark dark:text-police-text-muted">
                    {report.isAnonymous ? 'Denuncia anonima' : 'Denuncia non anonima'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ufficiale che ha registrato la denuncia */}
            <Card>
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-police-blue" />
                Dettagli Registrazione
              </h2>
              
              {report.officer && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-2">
                    Registrata da
                  </h3>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-police-blue/10 dark:bg-police-blue/20 flex items-center justify-center mr-3">
                      <User className="h-6 w-6 text-police-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-police-blue-dark dark:text-police-text-light">
                        {report.officer.name} {report.officer.surname}
                      </p>
                      <p className="text-xs text-police-gray-dark dark:text-police-text-muted">
                        {report.officer.rank} • Badge #{report.officer.badge}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <h3 className="text-xs font-medium text-police-gray-dark dark:text-police-text-muted">
                    Data creazione
                  </h3>
                  <p className="text-police-blue-dark dark:text-police-text-light">
                    {formatDate(report.createdAt)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium text-police-gray-dark dark:text-police-text-muted">
                    Ultimo aggiornamento
                  </h3>
                  <p className="text-police-blue-dark dark:text-police-text-light">
                    {formatDate(report.updatedAt)}
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Informazioni sul cittadino */}
            <Card>
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
                Informazioni Cittadini
              </h2>
              
              {report.isAnonymous ? (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md mb-4">
                  <div className="flex">
                    <Lock className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-300">Denuncia anonima</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        I dati del denunciante sono stati mantenuti anonimi.
                      </p>
                    </div>
                  </div>
                </div>
              ) : report.citizen ? (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-2">
                    Denunciante
                  </h3>
                  <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-police-blue/10 dark:bg-police-blue/20 flex items-center justify-center mr-3">
                        <User className="h-6 w-6 text-police-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-police-blue-dark dark:text-police-text-light">
                          {report.citizen.firstname} {report.citizen.lastname}
                        </p>
                        <p className="text-xs text-police-gray-dark dark:text-police-text-muted">
                          ID: {report.citizen.id}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Link href={`/citizens/${report.citizen.id}`}>
                          <Button size="sm" variant="outline" leftIcon={<Eye className="h-3 w-3" />}>
                            Profilo
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-2">
                    Denunciante
                  </h3>
                  <p className="text-police-gray-dark dark:text-police-text-muted italic">
                    Nessun cittadino associato
                  </p>
                </div>
              )}
              
              {report.accused ? (
                <div>
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-2">
                    Denunciato
                  </h3>
                  <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                        <User className="h-6 w-6 text-red-500 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-police-blue-dark dark:text-police-text-light">
                          {report.accused.firstname} {report.accused.lastname}
                        </p>
                        <p className="text-xs text-police-gray-dark dark:text-police-text-muted">
                          ID: {report.accused.id}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Link href={`/citizens/${report.accused.id}`}>
                          <Button size="sm" variant="outline" leftIcon={<Eye className="h-3 w-3" />}>
                            Profilo
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-2">
                    Denunciato
                  </h3>
                  <p className="text-police-gray-dark dark:text-police-text-muted italic">
                    Nessun denunciato identificato
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
