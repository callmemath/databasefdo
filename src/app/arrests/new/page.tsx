'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { User, Calendar, AlertCircle, FileText, MapPin, Clock, Check, X } from 'lucide-react';

// Interfaccia per il cittadino
interface Citizen {
  id: number;
  firstname: string;
  lastname: string;
  dateofbirth?: string;
  sex?: string;
  nationality?: string;
}

// Interfaccia per l'ufficiale
interface Officer {
  id: string;
  name: string;
  surname: string;
  badge?: string;
  department?: string;
  rank?: string;
}

// Interfaccia per i dati dell'arresto
interface ArrestData {
  citizenId: number;
  officerId: string;
  date: string;
  location: string;
  charges: string;
  description: string;
}

function NewArrestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const citizenId = searchParams.get('citizenId');
  
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Officer | null>(null);
  const [formData, setFormData] = useState<ArrestData>({
    citizenId: citizenId ? parseInt(citizenId) : 0,
    officerId: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    charges: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // Carica i dati del cittadino e dell'utente corrente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Ottieni i dati del cittadino se l'ID è disponibile
        if (citizenId) {
          const citizenRes = await fetch(`/api/citizens/${citizenId}`);
          
          if (!citizenRes.ok) {
            throw new Error('Errore durante il recupero dei dati del cittadino');
          }
          
          const citizenData = await citizenRes.json();
          setCitizen(citizenData.citizen);
          
          // Aggiorna il citizenId nel formData
          setFormData(prev => ({ ...prev, citizenId: parseInt(citizenId) }));
        }
        
        // Ottieni i dati dell'utente corrente
        const profileRes = await fetch('/api/profile');
        
        if (!profileRes.ok) {
          throw new Error('Errore durante il recupero del profilo utente');
        }
        
        const profileData = await profileRes.json();
        setCurrentUser(profileData.user);
        
        // Aggiorna l'officerId nel formData
        setFormData(prev => ({ ...prev, officerId: profileData.user.id }));
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Impossibile caricare i dati necessari');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [citizenId]);
  
  // Gestisce la modifica dei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gestisce l'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione dei campi
    if (!formData.citizenId) {
      setFormError('ID del cittadino mancante');
      return;
    }
    
    if (!formData.officerId) {
      setFormError('ID dell\'ufficiale mancante');
      return;
    }
    
    if (!formData.date) {
      setFormError('Data dell\'arresto mancante');
      return;
    }
    
    if (!formData.location) {
      setFormError('Luogo dell\'arresto mancante');
      return;
    }
    
    if (!formData.charges) {
      setFormError('Capi d\'accusa mancanti');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      const res = await fetch('/api/arrests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Errore durante la creazione dell\'arresto');
      }
      
      const responseData = await res.json();
      
      // Mostra messaggio di successo
      setFormSuccess('Arresto registrato con successo!');
      
      // Reindirizza dopo un breve ritardo
      setTimeout(() => {
        router.push(`/arrests/${responseData.arrest.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Errore durante la creazione dell\'arresto:', err);
      setFormError(err.message || 'Errore durante la creazione dell\'arresto');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Nuovo Arresto
            </h1>
            <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
              Registra un nuovo arresto nel sistema
            </p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-police-blue dark:border-police-blue-dark mx-auto"></div>
            <p className="mt-4 text-police-gray-dark dark:text-police-text-muted">Caricamento dati...</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="text-center py-8 text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto" />
            <p className="mt-4">{error}</p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              Torna Indietro
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna sinistra - Informazioni sul Cittadino */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                <User className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
                Dati del Cittadino
              </h2>
              
              {citizen ? (
                <>
                  <div className="bg-police-blue/10 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-police-blue dark:border-blue-500 mb-4">
                    <h3 className="text-xl font-bold text-police-blue-dark dark:text-white">
                      {citizen.firstname} {citizen.lastname}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-police-blue/20 dark:bg-blue-800/50 text-police-blue-dark dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded">
                        ID: {citizen.id}
                      </span>
                    </div>
                  </div>
                
                  <div className="grid grid-cols-1 gap-3">
                    {citizen.dateofbirth && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Data di Nascita</p>
                        <p className="font-medium dark:text-white flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-police-blue dark:text-blue-400 inline" />
                          {citizen.dateofbirth}
                        </p>
                      </div>
                    )}
                    
                    {citizen.sex && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Genere</p>
                        <p className="font-medium dark:text-white flex items-center">
                          <User className="h-4 w-4 mr-2 text-police-blue dark:text-blue-400 inline" />
                          {citizen.sex === 'm' ? 'Uomo' : citizen.sex === 'f' ? 'Donna' : 'Non specificato'}
                        </p>
                      </div>
                    )}
                    
                    {citizen.nationality && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Nazionalità</p>
                        <p className="font-medium dark:text-white flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-police-blue dark:text-blue-400 inline" />
                          {citizen.nationality}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-yellow-700 dark:text-yellow-400 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Nessun cittadino selezionato
                  </p>
                  <Button 
                    variant="primary"
                    className="mt-4 w-full"
                    onClick={() => router.push('/citizens')}
                  >
                    Seleziona un Cittadino
                  </Button>
                </div>
              )}
            </Card>
            
            <Card className="mt-4">
              <h2 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                <User className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
                Ufficiale Responsabile
              </h2>
              
              {currentUser ? (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="font-medium dark:text-white">
                    {currentUser.name} {currentUser.surname}
                  </p>
                  {currentUser.badge && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Badge: #{currentUser.badge}
                    </p>
                  )}
                  {currentUser.department && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Dipartimento: {currentUser.department}
                    </p>
                  )}
                  {currentUser.rank && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Grado: {currentUser.rank}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-yellow-700 dark:text-yellow-400 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Informazioni dell'ufficiale non disponibili
                  </p>
                </div>
              )}
            </Card>
          </div>
          
          {/* Colonna centrale e destra - Form per l'arresto */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
                Dettagli dell'Arresto
              </h2>
              
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-700 dark:text-red-400 flex items-center">
                    <X className="h-5 w-5 mr-2" />
                    {formError}
                  </p>
                </div>
              )}
              
              {formSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <p className="text-green-700 dark:text-green-400 flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {formSuccess}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data dell'Arresto
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="block w-full pl-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-police-blue focus:border-police-blue dark:focus:ring-police-blue-dark dark:focus:border-police-blue-dark dark:bg-gray-700 text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Luogo dell'Arresto
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Es. Via Roma, 1"
                        className="block w-full pl-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-police-blue focus:border-police-blue dark:focus:ring-police-blue-dark dark:focus:border-police-blue-dark dark:bg-gray-700 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capi d'Accusa
                  </label>
                  <textarea
                    name="charges"
                    value={formData.charges}
                    onChange={handleChange}
                    placeholder="Es. Rapina a mano armata, resistenza a pubblico ufficiale"
                    className="block w-full py-2.5 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-police-blue focus:border-police-blue dark:focus:ring-police-blue-dark dark:focus:border-police-blue-dark dark:bg-gray-700 text-sm"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrizione Dettagliata
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descrivi in dettaglio le circostanze dell'arresto"
                    className="block w-full py-2.5 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-police-blue focus:border-police-blue dark:focus:ring-police-blue-dark dark:focus:border-police-blue-dark dark:bg-gray-700 text-sm"
                    rows={6}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Annulla
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Registrazione in corso...
                      </>
                    ) : (
                      'Registra Arresto'
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default function NewArrest() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    }>
      <NewArrestContent />
    </Suspense>
  );
}
