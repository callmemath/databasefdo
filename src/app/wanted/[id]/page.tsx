'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Zap, 
  CheckCircle, 
  XCircle,
  User,
  Phone,
  Ruler,
  Edit,
  Trash,
  Eye
} from 'lucide-react';

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
  citizen?: {
    id: number;
    firstname?: string | null;
    lastname?: string | null;
    dateofbirth?: string | null;
    sex?: string | null;
    height?: number | null;
    phone_number?: string | null;
  };
  officer?: {
    id: string;
    name: string;
    surname: string;
    badge: string;
    department: string;
    rank: string;
  };
}

export default function WantedDetails() {
  const params = useParams();
  const router = useRouter();
  const [wantedPerson, setWantedPerson] = useState<WantedPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        setError(null);
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
  
  const calculateAge = (dateOfBirth: string | undefined | null): number => {
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
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }
    
    return 0;
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getDangerLevelBadge = (level: string) => {
    const dangerBadges: {[key: string]: React.ReactNode} = {
      low: <Badge variant="blue">Basso rischio</Badge>,
      medium: <Badge variant="yellow">Medio rischio</Badge>,
      high: <Badge variant="red">Alto rischio</Badge>,
      extreme: <Badge variant="red">RISCHIO ESTREMO</Badge>
    };
    
    return dangerBadges[level] || <Badge variant="gray">Sconosciuto</Badge>;
  };
  
  const getStatusBadge = (status: string) => {
    const statusBadges: {[key: string]: React.ReactNode} = {
      active: <Badge variant="red">Ricercato Attivo</Badge>,
      captured: <Badge variant="green">Catturato</Badge>,
      closed: <Badge variant="gray">Caso Chiuso</Badge>
    };
    
    return statusBadges[status] || <Badge variant="gray">Stato Sconosciuto</Badge>;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue-dark mx-auto mb-4"></div>
          <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light">
            Caricamento dati ricercato...
          </h3>
        </div>
      </MainLayout>
    );
  }

  if (error || !wantedPerson) {
    return (
      <MainLayout>
        <Card className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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

  const fullName = wantedPerson.citizen 
    ? `${wantedPerson.citizen.firstname || ''} ${wantedPerson.citizen.lastname || ''}`.trim() 
    : 'Sconosciuto';
  
  const age = calculateAge(wantedPerson.citizen?.dateofbirth);
  
  const crimesList = wantedPerson.crimes.split(',').map(crime => crime.trim());
  
  const officerName = wantedPerson.officer 
    ? `${wantedPerson.officer.rank} ${wantedPerson.officer.name} ${wantedPerson.officer.surname}` 
    : 'Sconosciuto';

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
          Dettaglio Ricercato
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna sinistra - Info Personali */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <div className="flex flex-col items-center mb-4">
              <div className="h-32 w-32 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center overflow-hidden mb-4">
                {wantedPerson.imageUrl ? (
                  <img src={wantedPerson.imageUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-police-blue">
                    {(wantedPerson.citizen?.firstname?.[0] || '') + (wantedPerson.citizen?.lastname?.[0] || '')}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-police-blue-dark dark:text-police-text-light text-center">
                {fullName}
              </h2>
              
              <div className="flex flex-col items-center justify-center space-y-1 mt-2">
                {getDangerLevelBadge(wantedPerson.dangerLevel)}
                <div className="mt-2">{getStatusBadge(wantedPerson.status)}</div>
              </div>
            </div>
            
            <div className="border-t border-police-gray dark:border-gray-700 pt-4 mt-4">
              <h3 className="font-semibold text-police-blue-dark dark:text-police-text-light mb-3">
                Informazioni Personali
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-police-gray-dark dark:text-police-text-muted mr-2" />
                  <span className="text-sm text-police-gray-dark dark:text-police-text-muted font-medium w-24">
                    Data nascita:
                  </span>
                  <span className="text-sm text-police-blue-dark dark:text-police-text-light">
                    {wantedPerson.citizen?.dateofbirth || 'Non disponibile'}
                    {age > 0 && ` (${age} anni)`}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <User className="h-4 w-4 text-police-gray-dark dark:text-police-text-muted mr-2" />
                  <span className="text-sm text-police-gray-dark dark:text-police-text-muted font-medium w-24">
                    Sesso:
                  </span>
                  <span className="text-sm text-police-blue-dark dark:text-police-text-light">
                    {wantedPerson.citizen?.sex === 'M' ? 'Maschio' : 
                      wantedPerson.citizen?.sex === 'F' ? 'Femmina' : 'Non specificato'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Ruler className="h-4 w-4 text-police-gray-dark dark:text-police-text-muted mr-2" />
                  <span className="text-sm text-police-gray-dark dark:text-police-text-muted font-medium w-24">
                    Altezza:
                  </span>
                  <span className="text-sm text-police-blue-dark dark:text-police-text-light">
                    {wantedPerson.citizen?.height ? `${wantedPerson.citizen.height} cm` : 'Non disponibile'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-police-gray-dark dark:text-police-text-muted mr-2" />
                  <span className="text-sm text-police-gray-dark dark:text-police-text-muted font-medium w-24">
                    Telefono:
                  </span>
                  <span className="text-sm text-police-blue-dark dark:text-police-text-light">
                    {wantedPerson.citizen?.phone_number || 'Non disponibile'}
                  </span>
                </div>
              </div>
            </div>
            
            {wantedPerson.bounty && (
              <div className="border-t border-police-gray dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
                  <Zap className="h-5 w-5 text-police-accent-gold dark:text-yellow-300 mr-2" />
                  <span className="text-lg font-bold text-police-accent-gold dark:text-yellow-300">
                    Taglia: €{wantedPerson.bounty.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            <div className="border-t border-police-gray dark:border-gray-700 pt-4 mt-4">
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="primary" 
                  className="w-full" 
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={() => router.push(`/wanted/edit/${wantedPerson.id}`)}
                >
                  Modifica Scheda
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  leftIcon={<FileText className="h-4 w-4" />}
                  onClick={() => router.push(`/wanted/sightings/${wantedPerson.id}`)}
                >
                  Segnala Avvistamento
                </Button>
                
                {wantedPerson.status === 'active' && (
                  <Button 
                    variant="primary" 
                    className="w-full" 
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => {
                      // Implementazione per segnalare come catturato
                    }}
                  >
                    Segna come Catturato
                  </Button>
                )}
                
                {wantedPerson.status !== 'closed' && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    leftIcon={<XCircle className="h-4 w-4" />}
                    onClick={() => {
                      // Implementazione per chiudere il caso
                    }}
                  >
                    Chiudi Caso
                  </Button>
                )}
                
                <Button 
                  variant="danger" 
                  className="w-full" 
                  leftIcon={<Trash className="h-4 w-4" />}
                  onClick={() => {
                    // Implementazione per eliminare
                    if (confirm('Sei sicuro di voler eliminare questo ricercato?')) {
                      // Elimina e reindirizza
                    }
                  }}
                >
                  Elimina Scheda
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Colonna centrale e destra - Dettagli del caso e Reati */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Dettagli del Caso
            </h3>
            
            <div className="space-y-4">
              {wantedPerson.lastSeen && (
                <div>
                  <h4 className="font-medium text-police-blue-dark dark:text-police-text-light mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Ultimo avvistamento:
                  </h4>
                  <p className="text-police-gray-dark dark:text-police-text-muted bg-police-gray-light dark:bg-gray-700/50 p-2 rounded">
                    {wantedPerson.lastSeen}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-police-blue-dark dark:text-police-text-light mb-1 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Descrizione:
                </h4>
                <p className="text-police-gray-dark dark:text-police-text-muted bg-police-gray-light dark:bg-gray-700/50 p-2 rounded whitespace-pre-wrap">
                  {wantedPerson.description}
                </p>
              </div>
              
              {wantedPerson.notes && (
                <div>
                  <h4 className="font-medium text-police-blue-dark dark:text-police-text-light mb-1 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Note aggiuntive:
                  </h4>
                  <p className="text-police-gray-dark dark:text-police-text-muted bg-police-gray-light dark:bg-gray-700/50 p-2 rounded whitespace-pre-wrap">
                    {wantedPerson.notes}
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t border-police-gray dark:border-gray-700 pt-4 mt-4">
              <h4 className="font-medium text-police-blue-dark dark:text-police-text-light mb-3">
                Reati contestati:
              </h4>
              <ul className="space-y-2">
                {crimesList.map((crime: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="text-police-accent-red dark:text-red-400 mr-1.5 mt-1">•</span>
                    <span className="text-police-blue-dark dark:text-police-text-light">{crime}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          
          <Card>
            <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Informazioni Amministrative
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                  Inserito da:
                </h4>
                <p className="text-police-gray-dark dark:text-police-text-muted">
                  {officerName}
                </p>
                {wantedPerson.officer?.badge && (
                  <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                    Badge: {wantedPerson.officer.badge}
                  </p>
                )}
                {wantedPerson.officer?.department && (
                  <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                    Dipartimento: {wantedPerson.officer.department}
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-police-blue-dark dark:text-police-text-light mb-1">
                  Date:
                </h4>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                  <span className="font-medium">Inserito il:</span> {formatDate(wantedPerson.insertedAt)}
                </p>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                  <span className="font-medium">Aggiornato il:</span> {formatDate(wantedPerson.updatedAt)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
