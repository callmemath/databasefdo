'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft, User, Calendar, Clock, AlertCircle, FileText, 
  Shield, DollarSign, Printer, Edit, Camera, MapPin, Plus, Loader,
  Trash2, Save, X
} from 'lucide-react';
import Link from 'next/link';

export default function ArrestDetails() {
  const params = useParams();
  const router = useRouter();
  const arrestId = params.id;
  const [arrest, setArrest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<{
    location: string;
    description: string;
    charges: string;
    sentence: string;
    fine: string;
    incidentDescription: string;
    seizedItems: string;
    department: string;
    // signingOfficers e accomplices sono gestiti separatamente poiché sono Json
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Recupera i dati dell'arresto
  useEffect(() => {
    const fetchArrestDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/arrests/${arrestId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Arresto non trovato');
          } else {
            setError('Si è verificato un errore durante il recupero dei dati');
          }
          return;
        }
        
        const data = await response.json();
        setArrest(data.arrest);
        
        // Inizializza il form di modifica con i dati correnti
        setEditForm({
          location: data.arrest.location,
          description: data.arrest.description,
          charges: data.arrest.charges,
          sentence: data.arrest.sentence || '',
          fine: data.arrest.fine ? data.arrest.fine.toString() : '',
          incidentDescription: data.arrest.incidentDescription || '',
          seizedItems: data.arrest.seizedItems || '',
          department: data.arrest.department || 'Non specificato'
        });
      } catch (error) {
        console.error('Errore durante il recupero dei dati dell\'arresto:', error);
        setError('Si è verificato un errore durante il recupero dei dati');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArrestDetails();
  }, [arrestId]);
  
  // Gestione dell'aggiornamento dell'arresto
  const handleUpdateArrest = async () => {
    if (!editForm) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/arrests/${arrestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        throw new Error('Si è verificato un errore durante l\'aggiornamento dell\'arresto');
      }
      
      const data = await response.json();
      setArrest(data.arrest);
      setIsEditing(false);
      // Mostra messaggio di successo (puoi implementare una notifica)
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'arresto:', error);
      // Mostra messaggio di errore
    } finally {
      setIsSaving(false);
    }
  };
  
  // Gestione dell'eliminazione dell'arresto
  const handleDeleteArrest = async () => {
    if (!isDeleting) return;
    
    try {
      const response = await fetch(`/api/arrests/${arrestId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Si è verificato un errore durante l\'eliminazione dell\'arresto');
      }
      
      // Reindirizza alla lista degli arresti dopo l'eliminazione
      router.push('/arrests');
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'arresto:', error);
      setIsDeleting(false);
      // Mostra messaggio di errore
    }
  };
  
  // Gestione dell'input del form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editForm) return;
    
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };
  
  // Status badges
  const statusBadges = {
    processing: <Badge variant="blue">In elaborazione</Badge>,
    completed: <Badge variant="green">Completato</Badge>,
    released: <Badge variant="yellow">Rilasciato</Badge>
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-police-blue" />
            <p className="text-police-gray-dark dark:text-gray-300">Caricamento dati in corso...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !arrest) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-police-accent-red mb-4" />
          <h2 className="text-xl font-bold text-police-blue-dark dark:text-white mb-2">
            {error || 'Arresto non trovato'}
          </h2>
          <p className="text-police-gray-dark dark:text-gray-300 mb-6">
            Non è stato possibile recuperare i dati richiesti.
          </p>
          <Link href="/arrests">
            <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Torna alla lista
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  // Prepara i dati da visualizzare
  const arrestDate = arrest.date ? new Date(arrest.date) : null;
  const formattedDate = arrestDate ? formatDate(arrestDate) : 'N/A';
  const formattedTime = arrestDate ? `${arrestDate.getHours().toString().padStart(2, '0')}:${arrestDate.getMinutes().toString().padStart(2, '0')}` : 'N/A';
  
  const citizenName = arrest.citizen ? `${arrest.citizen.firstname} ${arrest.citizen.lastname}` : 'N/A';
  const citizenBirthDate = arrest.citizen?.dateofbirth ? formatDate(new Date(arrest.citizen.dateofbirth)) : 'N/A';
  const officerFullName = arrest.officer ? `${arrest.officer.name} ${arrest.officer.surname}` : 'N/A';
  
  // Estrai le informazioni sui reati dalle charges
  const chargesList = arrest.charges ? arrest.charges.split(',').map((charge: string) => charge.trim()) : [];
  
  return (
    <MainLayout>
      {/* Dialogo di conferma per l'eliminazione */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-police-blue-dark dark:text-white mb-4">
              Conferma eliminazione
            </h2>
            <p className="text-police-gray-dark dark:text-gray-300 mb-6">
              Sei sicuro di voler eliminare questo arresto? Questa azione non può essere annullata.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleting(false)}
              >
                Annulla
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteArrest}
              >
                Elimina
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Link href="/arrests" className="mr-4">
              <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Torna agli arresti
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Dettagli Arresto #{arrestId}
            </h1>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <Button
              variant="outline"
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Stampa
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Arrest Info */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Informazioni Arresto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Data arresto</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{formattedDate}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Ora arresto</div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{formattedTime}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Luogo arresto</div>
                  {isEditing && editForm ? (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                      <input
                        type="text"
                        name="location"
                        value={editForm.location}
                        onChange={handleInputChange}
                        className="flex-1 p-1 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                        placeholder="Inserisci il luogo dell'arresto"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                      <span className="font-medium dark:text-police-text-light">{arrest.location}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Dipartimento</div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{arrest.department || 'Non specificato'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Agente responsabile</div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{officerFullName}</span>
                  </div>
                  {arrest.officer && (
                    <div className="text-xs text-police-gray-dark dark:text-police-text-muted mt-1 ml-6">
                      {arrest.officer.badge} • {arrest.officer.department || 'Polizia'}
                    </div>
                  )}
                </div>

                {arrest.signingOfficers && (
                  <div>
                    <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-2">Operatori firmatari</div>
                    <div className="bg-police-gray-light dark:bg-gray-700 rounded-md p-2 max-h-32 overflow-y-auto">
                      {Array.isArray(JSON.parse(arrest.signingOfficers)) ? (
                        JSON.parse(arrest.signingOfficers).map((officer: any, index: number) => (
                          <div key={`signing-officer-${index}`} className="flex items-center py-1 border-b last:border-b-0 border-police-gray-dark/20 dark:border-gray-600">
                            <User className="h-3 w-3 mr-2 text-police-blue-dark dark:text-blue-400" />
                            <span className="text-sm dark:text-police-text-light">{officer.name}</span>
                            {officer.badge && (
                              <span className="ml-1 text-xs text-police-gray-dark dark:text-gray-400">({officer.badge})</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-police-gray-dark dark:text-gray-400 p-1">Nessun operatore firmatario</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description and new fields */}
            <div className="mt-6">
              <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Descrizione Accaduti</div>
              <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                <p className="text-police-gray-dark dark:text-police-text-muted">
                  {arrest.incidentDescription || 'Nessuna descrizione degli accaduti disponibile'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Oggetti Sequestrati</div>
              <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                <p className="text-police-gray-dark dark:text-police-text-muted">
                  {arrest.seizedItems || 'Nessun oggetto sequestrato'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Note aggiuntive</div>
              {isEditing && editForm ? (
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                  rows={3}
                  placeholder="Descrivi i dettagli dell'arresto"
                />
              ) : (
                <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                  <p className="text-police-gray-dark dark:text-police-text-muted">
                    {arrest.description || 'Nessuna nota disponibile'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Sentenza e Multa */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Sentenza e Multa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pena detentiva */}
              <div>
                <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Pena detentiva</div>
                {isEditing && editForm ? (
                  <input
                    type="text"
                    name="sentence"
                    value={editForm.sentence}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                    placeholder="Es. 2 anni e 6 mesi"
                  />
                ) : (
                  <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                    <p className="text-police-gray-dark dark:text-police-text-muted">
                      {arrest.sentence || 'Nessuna pena detentiva specificata'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Multa */}
              <div>
                <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Multa (€)</div>
                {isEditing && editForm ? (
                  <input
                    type="number"
                    name="fine"
                    value={editForm.fine}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                    placeholder="Es. 1000"
                    min="0"
                  />
                ) : (
                  <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                    <p className="text-police-gray-dark dark:text-police-text-muted">
                      {arrest.fine ? `€ ${arrest.fine}` : 'Nessuna multa specificata'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Crimes */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-police-accent-red dark:text-red-400" />
              Reati Contestati
            </h2>
            
            {isEditing && editForm ? (
              <div className="space-y-4">
                <div className="p-4 border border-police-gray dark:border-gray-600 rounded-md">
                  <div className="mb-2 text-sm text-police-gray-dark dark:text-police-text-muted">
                    Inserisci i reati separati da virgole (es. Furto, Rapina, Guida in stato di ebbrezza)
                  </div>
                  <textarea
                    name="charges"
                    value={editForm.charges}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                    rows={3}
                    placeholder="Inserisci i reati separati da virgole"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chargesList.length > 0 ? (
                  chargesList.map((charge: string, index: number) => (
                    <div key={index} className="p-4 border border-police-gray dark:border-gray-600 rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium dark:text-police-text-light">{charge}</h3>
                        </div>
                        <div className="text-lg font-bold bg-police-gray-light dark:bg-gray-700 h-8 w-8 flex items-center justify-center rounded-full text-police-blue-dark dark:text-police-text-light">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-police-gray-dark dark:text-gray-300">
                    Nessun reato registrato per questo arresto
                  </div>
                )}
              </div>
            )}

            {/* Accomplices section */}
            {arrest.accomplices && (
              <div className="mt-6 border-t border-police-gray dark:border-gray-600 pt-4">
                <h3 className="font-medium text-police-blue-dark dark:text-police-text-light mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2 text-police-accent-red dark:text-red-400" />
                  Complici
                </h3>
                
                <div className="space-y-3">
                  {Array.isArray(JSON.parse(arrest.accomplices || '[]')) && JSON.parse(arrest.accomplices || '[]').length > 0 ? (
                    JSON.parse(arrest.accomplices).map((accomplice: any, index: number) => (
                      <div key={`accomplice-${index}`} className="flex items-center justify-between bg-police-gray-light dark:bg-gray-700 p-2 rounded-md">
                        <div>
                          <div className="font-medium text-sm dark:text-police-text-light">{accomplice.name}</div>
                          <div className="text-xs text-police-gray-dark dark:text-gray-400">
                            {accomplice.birthDate || 'Data di nascita non disponibile'}
                          </div>
                        </div>
                        <Link href={`/citizens/${accomplice.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            Profilo
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-2 text-police-gray-dark dark:text-gray-300 text-sm">
                      Nessun complice registrato per questo arresto
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
        
        {/* Citizen information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light flex items-center">
                <User className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
                Informazioni Cittadino
              </h2>
              
              {arrest.citizen && (
                <Link href={`/citizens/${arrest.citizen.id}`}>
                  <Button variant="outline" size="sm">
                    Profilo completo
                  </Button>
                </Link>
              )}
            </div>
            
            {arrest.citizen ? (
              <>
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center overflow-hidden mr-4">
                    <span className="text-2xl font-bold text-police-blue dark:text-blue-400">
                      {arrest.citizen.firstname[0]}{arrest.citizen.lastname[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light">
                      {citizenName}
                    </h3>
                    <div className="flex items-center text-sm text-police-gray-dark dark:text-police-text-muted">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>Nato il {citizenBirthDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 border-t border-police-gray dark:border-gray-700 pt-4">
                  <div>
                    <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Nazionalità</div>
                    <div className="font-medium dark:text-police-text-light">
                      {arrest.citizen.nationality || 'Non specificata'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Sesso</div>
                    <div className="font-medium dark:text-police-text-light">
                      {arrest.citizen.sex || 'Non specificato'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-4 text-police-gray-dark dark:text-gray-300">
                Informazioni sul cittadino non disponibili
              </div>
            )}
          </Card>
          
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Azioni
            </h2>
            
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Save className="h-4 w-4" />}
                    onClick={handleUpdateArrest}
                    disabled={isSaving}
                  >
                    {isSaving ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    fullWidth
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={() => {
                      setIsEditing(false);
                      // Ripristina il form con i dati originali
                      setEditForm({
                        location: arrest.location,
                        description: arrest.description,
                        charges: arrest.charges,
                        sentence: arrest.sentence || '',
                        fine: arrest.fine ? arrest.fine.toString() : '',
                        incidentDescription: arrest.incidentDescription || '',
                        seizedItems: arrest.seizedItems || '',
                        department: arrest.department || 'Non specificato'
                      });
                    }}
                    disabled={isSaving}
                  >
                    Annulla
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Edit className="h-4 w-4" />}
                    onClick={() => setIsEditing(true)}
                  >
                    Modifica Arresto
                  </Button>
                  
                  <Button
                    variant="danger"
                    fullWidth
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setIsDeleting(true)}
                  >
                    Elimina Arresto
                  </Button>
                  
                  <Link href="/arrests">
                    <Button
                      variant="secondary"
                      fullWidth
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Torna alla lista
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}


