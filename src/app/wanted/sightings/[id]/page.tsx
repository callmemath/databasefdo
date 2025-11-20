'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '../../../../components/layout/MainLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { ArrowLeft, MapPin, Send, AlertCircle, User, Phone, Calendar } from 'lucide-react';

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
  insertedAt: string;
  citizen?: {
    firstname?: string | null;
    lastname?: string | null;
    dateofbirth?: string | null;
  };
}

interface SightingFormData {
  location: string;
  description: string;
  date: string;
  time: string;
  contactName: string;
  contactPhone: string;
  isAnonymous: boolean;
}

export default function ReportSighting() {
  const params = useParams();
  const router = useRouter();
  
  const [wantedPerson, setWantedPerson] = useState<WantedPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SightingFormData>({
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    time: new Date().toTimeString().slice(0, 5), // Formato HH:MM
    contactName: '',
    contactPhone: '',
    isAnonymous: false
  });
  
  // Carica i dati del ricercato
  useEffect(() => {
    const fetchWantedPerson = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/wanted/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei dati del ricercato');
        }
        
        const data = await response.json();
        setWantedPerson(data);
      } catch (err) {
        setError('Errore nel caricamento dei dati. Riprova più tardi.');
        console.error('Errore nel caricamento del ricercato:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchWantedPerson();
    }
  }, [params.id]);
  
  // Gestisce il cambiamento dei campi del form
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Reset degli errori quando l'utente inizia a compilare
    setFormError(null);
  };
  
  // Gestisce l'invio del form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validazione
    if (!formData.location.trim() || !formData.description.trim()) {
      setFormError('I campi Località e Descrizione sono obbligatori');
      return;
    }
    
    if (!formData.isAnonymous && (!formData.contactName.trim() || !formData.contactPhone.trim())) {
      setFormError('Per segnalazioni non anonime, i campi Nome e Telefono sono obbligatori');
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      // Formatta la data e l'ora
      const formattedDateTime = `${formData.date}T${formData.time}:00`;
      
      // Prepara i dati per l'API
      const sightingData = {
        wantedPersonId: params.id,
        location: formData.location,
        description: formData.description,
        sightingDateTime: formattedDateTime,
        contactName: formData.isAnonymous ? null : formData.contactName,
        contactPhone: formData.isAnonymous ? null : formData.contactPhone,
        isAnonymous: formData.isAnonymous
      };
      
      // Simula chiamata API - In una implementazione reale, questa sarebbe una vera chiamata a un endpoint
      console.log('Invio dati avvistamento:', sightingData);
      
      // Simula un ritardo nell'elaborazione
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula risposta di successo
      setSuccessMessage('Segnalazione inviata con successo! Grazie per la collaborazione.');
      
      // Reset form dopo il successo
      setFormData({
        location: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        contactName: '',
        contactPhone: '',
        isAnonymous: false
      });
      
      // In un'implementazione reale, dopo la segnalazione reindirizzare alla pagina dei dettagli
      // o mostrare un messaggio di conferma
    } catch (err) {
      console.error('Errore durante l\'invio della segnalazione:', err);
      setFormError('Si è verificato un errore durante l\'invio della segnalazione. Riprova più tardi.');
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = wantedPerson?.citizen 
    ? `${wantedPerson.citizen.firstname || ''} ${wantedPerson.citizen.lastname || ''}`.trim() 
    : 'Sconosciuto';

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue-dark mx-auto mb-4"></div>
          <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light">
            Caricamento...
          </h3>
        </div>
      </MainLayout>
    );
  }

  if (error || !wantedPerson) {
    return (
      <MainLayout>
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light mb-2">
            Errore
          </h3>
          <p className="text-police-gray-dark dark:text-police-text-muted mb-6">
            {error || 'Ricercato non trovato'}
          </p>
          <Button 
            variant="primary" 
            leftIcon={<ArrowLeft className="h-4 w-4" />} 
            onClick={() => router.push('/wanted')}
          >
            Torna all'elenco
          </Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          leftIcon={<ArrowLeft className="h-4 w-4" />} 
          onClick={() => router.push(`/wanted/${wantedPerson.id}`)}
          className="mr-4"
        >
          Indietro
        </Button>
        <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
          Segnala Avvistamento
        </h1>
      </div>
      
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
          Dettagli Ricercato
        </h2>
        
        <div className="flex items-start">
          <div className="h-24 w-24 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center overflow-hidden mr-6">
            {wantedPerson.imageUrl ? (
              <img src={wantedPerson.imageUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-police-blue">
                {(wantedPerson.citizen?.firstname?.[0] || '') + (wantedPerson.citizen?.lastname?.[0] || '')}
              </span>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-police-blue-dark dark:text-police-text-light">
              {fullName}
            </h3>
            
            <div className="mt-1 space-y-1">
              <div className="flex items-center text-sm text-police-gray-dark dark:text-police-text-muted">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>Data di nascita: {wantedPerson.citizen?.dateofbirth || 'Non disponibile'}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  wantedPerson.dangerLevel === 'high' || wantedPerson.dangerLevel === 'extreme' 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                    : wantedPerson.dangerLevel === 'medium' 
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {wantedPerson.dangerLevel === 'low' && 'Basso rischio'}
                  {wantedPerson.dangerLevel === 'medium' && 'Medio rischio'}
                  {wantedPerson.dangerLevel === 'high' && 'Alto rischio'}
                  {wantedPerson.dangerLevel === 'extreme' && 'Rischio estremo'}
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <h4 className="font-medium text-police-blue-dark dark:text-police-text-light text-sm">
                Reati contestati:
              </h4>
              <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                {wantedPerson.crimes}
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {successMessage ? (
        <Card className="text-center py-8">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            
            <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light mb-2">
              Segnalazione Inviata
            </h3>
            <p className="text-police-gray-dark dark:text-police-text-muted mb-6 max-w-md mx-auto">
              {successMessage}
            </p>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setSuccessMessage(null)}
              >
                Nuova Segnalazione
              </Button>
              <Button 
                variant="primary" 
                onClick={() => router.push(`/wanted/${wantedPerson.id}`)}
              >
                Torna ai Dettagli
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Informazioni Avvistamento
            </h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {formError}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                  Località*
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Es: Via Roma, 123 - Milano"
                  className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                  required
                />
              </div>
              
              <div className="md:grid md:grid-cols-2 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                    Data*
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                    Ora*
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                    required
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                  Descrizione Avvistamento*
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descrivi l'avvistamento nel dettaglio (cosa stava facendo, come era vestito, era solo o in compagnia, etc.)"
                  rows={4}
                  className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleChange}
                    className="h-4 w-4 text-police-blue dark:text-police-blue-light focus:ring-police-blue dark:focus:ring-police-blue-light"
                  />
                  <label htmlFor="isAnonymous" className="ml-2 block text-sm text-police-blue-dark dark:text-police-text-light">
                    Voglio rimanere anonimo
                  </label>
                </div>
              </div>
              
              {!formData.isAnonymous && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                      Nome e Cognome
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Inserisci il tuo nome e cognome"
                      className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="Inserisci il tuo numero di telefono"
                      className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 rounded-md focus:outline-none focus:border-police-blue dark:focus:border-police-blue-light dark:bg-gray-700 dark:text-police-text-light"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 border-t border-police-gray dark:border-gray-600 pt-4 mt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/wanted/${wantedPerson.id}`)}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                leftIcon={<Send className="h-4 w-4" />}
                disabled={submitting}
              >
                {submitting ? 'Invio in corso...' : 'Invia Segnalazione'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </MainLayout>
  );
}
