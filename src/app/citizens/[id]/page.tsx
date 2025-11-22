'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { 
  ArrowLeft, User, Calendar, MapPin, Briefcase, Phone, Mail, 
  AlertCircle, FileText, Shield, Users, Fingerprint, CreditCard, 
  Info, Clock, Flag, Ruler, UserCheck, AlertTriangle, Tag, Target,
  Edit, Trash2, Save, X
} from 'lucide-react';
import Link from 'next/link';

export default function CitizenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Estrai i parametri usando React.use()
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;

  const [citizen, setCitizen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'reports' | 'accusations' | 'arrests' | 'weapons' | 'notes'>('records');
  
  // Stato per le note
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  
  // Funzione per formattare la data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? dateString // Se non è una data valida, mostra la stringa originale
      : date.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  };

  // Funzione per formattare la data con ora
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? dateString 
      : date.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };
  
  // Combina tutte le attività per visualizzarle nel tab "Fascicolo"
  const allActivities = React.useMemo(() => {
    if (!citizen) return [];
    
    // Prepara gli arresti
    const arrests = (citizen.arrests || []).map((arrest: any) => ({
      ...arrest,
      type: 'arrest',
      date: arrest.date,
      title: `Arresto del ${formatDate(arrest.date)}`,
      reportType: null,
    }));
    
    // Prepara le denunce presentate
    const reports = (citizen.reports || []).map((report: any) => ({
      ...report,
      type: 'report',
      reportType: report.type,
    }));
    
    // Prepara le denunce ricevute
    const accusedReports = (citizen.accusedReports || []).map((report: any) => ({
      ...report,
      type: 'accusedReport',
      reportType: report.type,
    }));
    
    // Combina e ordina tutte le attività per data (più recenti prima)
    return [...arrests, ...reports, ...accusedReports].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [citizen]);

  useEffect(() => {
    const fetchCitizen = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/citizens/${id}`);
        
        if (!response.ok) {
          throw new Error(`Errore nel caricamento del cittadino: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.citizen) {
          setCitizen(data.citizen);
        } else {
          throw new Error('Cittadino non trovato');
        }
      } catch (err: any) {
        console.error('Errore durante il caricamento dei dati:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCitizen();
  }, [id]);

  // Funzione per caricare le note
  const fetchNotes = React.useCallback(async () => {
    try {
      setNotesLoading(true);
      const response = await fetch(`/api/citizens/${id}/notes`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle note');
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Errore durante il caricamento delle note:', err);
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  // Carica le note quando si seleziona il tab notes
  useEffect(() => {
    if (activeTab === 'notes') {
      fetchNotes();
    }
  }, [activeTab, fetchNotes]);

  // Funzione per aggiungere una nota
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      setNoteError(null);
      const response = await fetch(`/api/citizens/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newNote.trim() }),
      });

      if (!response.ok) {
        throw new Error('Errore nell\'aggiunta della nota');
      }

      const data = await response.json();
      setNotes([data.note, ...notes]); // Aggiungi la nota all'inizio
      setNewNote(''); // Pulisci il campo
    } catch (err) {
      console.error('Errore durante l\'aggiunta della nota:', err);
      setNoteError('Errore nell\'aggiunta della nota. Riprova più tardi.');
    } finally {
      setAddingNote(false);
    }
  };

  // Funzione per eliminare una nota
  const handleDeleteNote = async (noteId: string) => {
    try {
      setNoteError(null);
      const response = await fetch(`/api/citizens/${id}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione della nota');
      }

      setNotes(notes.filter(note => note.id !== noteId));
      setDeleteConfirmNoteId(null);
    } catch (err) {
      console.error('Errore durante l\'eliminazione della nota:', err);
      setNoteError('Errore nell\'eliminazione della nota. Riprova più tardi.');
      setDeleteConfirmNoteId(null);
    }
  };

  // Funzione per iniziare la modifica di una nota
  const handleStartEdit = (note: any) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  // Funzione per annullare la modifica
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  // Funzione per salvare la modifica
  const handleSaveEdit = async (noteId: string) => {
    if (!editingContent.trim()) return;
    
    try {
      setNoteError(null);
      const response = await fetch(`/api/citizens/${id}/notes/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editingContent.trim() }),
      });

      if (!response.ok) {
        throw new Error('Errore nella modifica della nota');
      }

      const data = await response.json();
      setNotes(notes.map(note => note.id === noteId ? data.note : note));
      setEditingNoteId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Errore durante la modifica della nota:', err);
      setNoteError('Errore nella modifica della nota. Riprova più tardi.');
    }
  };

  // Funzione per ottenere le prime iniziali del nome e cognome
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName && firstName.length > 0 ? firstName[0] : '';
    const last = lastName && lastName.length > 0 ? lastName[0] : '';
    return (first + last).toUpperCase();
  };

  // Funzione per visualizzare i JSON in modo leggibile
  const parseJson = (jsonString?: string) => {
    if (!jsonString) return null;
    
    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (e) {
      return null;
    }
  };

  // Controlla se il cittadino è ricercato (per ora simula con arresti recenti)
  const isWanted = citizen && citizen.arrests && citizen.arrests.length > 0;

  // Controlla se ci sono denunce recenti (ultimi 30 giorni)
  const hasRecentReports = () => {
    if (!citizen || !citizen.reports || citizen.reports.length === 0) return false;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return citizen.reports.some((report: any) => {
      const reportDate = new Date(report.date);
      return !isNaN(reportDate.getTime()) && reportDate > thirtyDaysAgo;
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
            onClick={() => window.history.back()}
          >
            Torna indietro
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!citizen) {
    return (
      <MainLayout>
        <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 mb-4">
          <p>Cittadino non trovato</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Torna indietro
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Link href="/citizens" className="mr-4">
              <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Torna ai cittadini
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Scheda Cittadino #{citizen.id}
            </h1>
          </div>
          <div className="mt-3 md:mt-0 flex flex-wrap gap-2">
            {/* Badge rimossi - non mostriamo più lo stato */}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sezione informazioni personali */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-police-blue-light to-police-blue p-6 dark:from-police-blue-dark dark:to-police-blue-darker text-white">
              <div className="flex items-start gap-6">
                {/* Immagine profilo migliorata */}
                <div className="flex-shrink-0">
                  {citizen.immProfilo ? (
                    <div className="relative group">
                      <img 
                        src={citizen.immProfilo} 
                        alt={`${citizen.firstname} ${citizen.lastname}`}
                        className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-xl transition-transform group-hover:scale-105"
                        onError={(e) => {
                          // Fallback se l'immagine non carica
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLDivElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                            fallback.classList.add('flex');
                          }
                        }}
                      />
                      <div className="hidden h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white shadow-xl items-center justify-center">
                        <div className="text-center">
                          <User className="h-12 w-12 mx-auto mb-2 opacity-60" />
                          <span className="text-4xl font-bold">
                            {getInitials(citizen.firstname, citizen.lastname)}
                          </span>
                        </div>
                      </div>
                      {/* Badge overlay per stato speciale */}
                      {citizen.badge && (
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2 shadow-lg border-2 border-white">
                          <Shield className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white shadow-xl flex items-center justify-center">
                      <div className="text-center">
                        <User className="h-12 w-12 mx-auto mb-2 opacity-60" />
                        <span className="text-4xl font-bold">
                          {getInitials(citizen.firstname, citizen.lastname)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Informazioni intestazione */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-bold mb-2">
                    {citizen.firstname} {citizen.lastname}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <Fingerprint className="h-4 w-4 mr-2" />
                      <span className="font-medium">ID: {citizen.id}</span>
                    </div>
                    {citizen.nationality && (
                      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <Flag className="h-4 w-4 mr-2" />
                        <span>{citizen.nationality}</span>
                      </div>
                    )}
                    {citizen.phone_number && (
                      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{citizen.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-police-blue" />
                    Informazioni Personali
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                        Nome Completo
                      </h4>
                      <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                        <User className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                        {citizen.firstname} {citizen.lastname}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                        Data di Nascita
                      </h4>
                      <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                        {formatDate(citizen.dateofbirth)}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                        Genere
                      </h4>
                      <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                        <Users className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                        {citizen.sex === 'm' ? 'Maschile' : 
                         citizen.sex === 'f' ? 'Femminile' : 'Non specificato'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                        Nazionalità
                      </h4>
                      <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                        <Flag className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                        {citizen.nationality || 'Non specificata'}
                      </p>
                    </div>
                    
                    {citizen.height && (
                      <div>
                        <h4 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                          Altezza
                        </h4>
                        <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                          <Ruler className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                          {citizen.height} cm
                        </p>
                      </div>
                    )}
                    
                    {citizen.phone_number && (
                      <div>
                        <h4 className="text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                          Numero di Telefono
                        </h4>
                        <p className="text-police-blue-dark dark:text-police-text-light flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-police-gray-dark dark:text-police-text-muted" />
                          {citizen.phone_number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Occupazione e Stato rimossi per richiesta */}
              </div>
            </div>
          </Card>
          
          {/* Sezione con tabs per i dettagli */}
          <Card>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex overflow-x-auto">
                <button 
                  className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                    ${activeTab === 'records' 
                      ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('records')}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Fascicolo {(citizen.arrests?.length || 0) + (citizen.reports?.length || 0) + (citizen.accusedReports?.length || 0) > 0 && (
                      <span className="ml-1.5 bg-police-blue/10 dark:bg-police-blue-light/20 text-police-blue-dark dark:text-police-blue-light text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                        {(citizen.arrests?.length || 0) + (citizen.reports?.length || 0) + (citizen.accusedReports?.length || 0)}
                      </span>
                    )}
                  </div>
                </button>
                
                <button 
                  className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                    ${activeTab === 'reports' 
                      ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Denunce Presentate {citizen.reports?.length > 0 && (
                      <span className="ml-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                        {citizen.reports.length}
                      </span>
                    )}
                  </div>
                </button>
                
                <button 
                  className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                    ${activeTab === 'accusations' 
                      ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('accusations')}
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Denunce Ricevute {citizen.accusedReports?.length > 0 && (
                      <span className="ml-1.5 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                        {citizen.accusedReports.length}
                      </span>
                    )}
                  </div>
                </button>
                
                <button 
                  className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                    ${activeTab === 'arrests' 
                      ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('arrests')}
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Arresti {citizen.arrests?.length > 0 && (
                      <span className="ml-1.5 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                        {citizen.arrests.length}
                      </span>
                    )}
                  </div>
                </button>

                <button 
                  className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                    ${activeTab === 'weapons' 
                      ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('weapons')}
                >
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Porto d'Armi {citizen.weaponLicenses?.length > 0 && (
                      <span className="ml-1.5 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                        {citizen.weaponLicenses.length}
                      </span>
                    )}
                  </div>
                </button>

                <button 
                  className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                    ${activeTab === 'notes' 
                      ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('notes')}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Note {notes.length > 0 && (
                      <span className="ml-1.5 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                        {notes.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
            
            {/* Contenuto delle tab */}
            <div className="p-1">
              {/* Tab Fascicolo (sommario di tutto) */}
              {activeTab === 'records' && (
                <div className="space-y-6">
                  {/* Sommario statistico */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {citizen.reports?.length || 0}
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">Denunce Presentate</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {citizen.accusedReports?.length || 0}
                      </span>
                      <span className="text-sm text-amber-700 dark:text-amber-300">Denunce Ricevute</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {citizen.arrests?.length || 0}
                      </span>
                      <span className="text-sm text-red-700 dark:text-red-300">Arresti</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {citizen.weaponLicenses?.length || 0}
                      </span>
                      <span className="text-sm text-green-700 dark:text-green-300">Porto d'Armi</span>
                    </div>
                  </div>
                  
                  {/* Ultime attività */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Ultime attività
                    </h3>
                    
                    {/* Unione e ordinamento di tutte le attività recenti */}
                    {allActivities.length > 0 ? (
                      <div className="space-y-3">
                        {allActivities.map((activity) => (
                          <div 
                            key={`${activity.type}-${activity.id}`} 
                            className={`p-3 border rounded-md transition-colors ${
                              activity.type === 'arrest' 
                                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 hover:bg-red-100/50 dark:hover:bg-red-900/20' 
                                : activity.type === 'accusedReport'
                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/20'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                          >
                            <Link href={activity.type === 'arrest' ? `/arrests/${activity.id}` : `/reports/${activity.id}`} className="block">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-2">
                                  {activity.type === 'arrest' && (
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  {activity.type === 'accusedReport' && (
                                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  {activity.type === 'report' && (
                                    <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  
                                  <div>
                                    <h4 className="font-medium">
                                      {activity.type === 'arrest' ? `Arresto del ${formatDate(activity.date)}` : activity.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                                      {activity.type === 'arrest' ? activity.charges : activity.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(activity.date)}
                                </div>
                              </div>
                              
                              <div className="mt-2 flex justify-between items-center text-xs">
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {activity.location}
                                </div>
                                
                                {activity.officer && (
                                  <div className="flex items-center text-police-blue-dark dark:text-police-blue-light">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {activity.officer.name} {activity.officer.surname}
                                  </div>
                                )}
                              </div>
                              
                              {/* Badge specifici per tipo di attività */}
                              <div className="mt-2">
                                {activity.type === 'arrest' && (
                                  <Badge variant="red">Arresto</Badge>
                                )}
                                {activity.type === 'accusedReport' && (
                                  <Badge variant="yellow">Accusato</Badge>
                                )}
                                {activity.type === 'report' && (
                                  <Badge variant="blue">Denuncia</Badge>
                                )}
                                
                                {activity.type !== 'arrest' && activity.type && (
                                  <Badge variant="gray" className="ml-2">{activity.type === 'report' || activity.type === 'accusedReport' ? activity.reportType : ''}</Badge>
                                )}
                                
                                {(activity.type === 'report' || activity.type === 'accusedReport') && activity.isAnonymous && (
                                  <Badge variant="yellow" className="ml-2">Anonima</Badge>
                                )}
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-md text-center">
                        <p className="text-police-gray-dark dark:text-police-text-muted">
                          Nessuna attività registrata per questo cittadino.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Link href={`/reports/new?citizenId=${citizen.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<FileText className="h-4 w-4" />}>
                        Nuova denuncia
                      </Button>
                    </Link>
                    <Link href={`/reports/new?accusedId=${citizen.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<AlertCircle className="h-4 w-4" />}>
                        Denuncia come accusato
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Tab Denunce Presentate */}
              {activeTab === 'reports' && (
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-police-blue" />
                    Denunce presentate da {citizen.firstname} {citizen.lastname}
                  </h3>
                  
                  {citizen.reports && citizen.reports.length > 0 ? (
                    <div className="space-y-4">
                      {citizen.reports.map((report: any) => (
                        <div key={report.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <Link href={`/reports/${report.id}`} className="block">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="font-medium text-police-blue-dark dark:text-police-text-light">
                                    {report.title}
                                  </h3>
                                  <Badge variant="blue" className="ml-2">{report.type}</Badge>
                                </div>
                                <p className="text-sm text-police-gray-dark dark:text-police-text-muted mt-1 line-clamp-2">
                                  {report.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-police-gray-dark dark:text-police-text-muted">
                                  {formatDateTime(report.date)}
                                </span>
                                <div className="flex items-center text-xs mt-1">
                                  <MapPin className="h-3 w-3 mr-1 text-police-gray-dark" />
                                  <span className="text-police-gray-dark dark:text-police-text-muted">{report.location}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <Shield className="h-3 w-3 mr-1 text-police-blue-dark dark:text-police-blue-light" />
                                <span className="text-xs text-police-blue-dark dark:text-police-blue-light">
                                  Ufficiale: {report.officer ? `${report.officer.name} ${report.officer.surname}` : 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5">
                                {report.isAnonymous && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded">
                                    Anonima
                                  </span>
                                )}
                                
                                {report.accusedId && (
                                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded">
                                    Accusa
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-md text-center">
                      <p className="text-police-gray-dark dark:text-police-text-muted">
                        Nessuna denuncia presentata da questo cittadino.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link href={`/reports/new?citizenId=${citizen.id}`}>
                      <Button variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
                        Nuova denuncia
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Tab Denunce Ricevute */}
              {activeTab === 'accusations' && (
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                    Denunce in cui {citizen.firstname} {citizen.lastname} è accusato
                  </h3>
                  
                  {citizen.accusedReports && citizen.accusedReports.length > 0 ? (
                    <div className="space-y-4">
                      {citizen.accusedReports.map((report: any) => (
                        <div key={report.id} className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <Link href={`/reports/${report.id}`} className="block">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="font-medium text-police-blue-dark dark:text-police-text-light">
                                    {report.title}
                                  </h3>
                                  <Badge variant="yellow" className="ml-2">{report.type}</Badge>
                                </div>
                                <p className="text-sm text-police-gray-dark dark:text-police-text-muted mt-1 line-clamp-2">
                                  {report.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-police-gray-dark dark:text-police-text-muted">
                                  {formatDateTime(report.date)}
                                </span>
                                <div className="flex items-center text-xs mt-1">
                                  <MapPin className="h-3 w-3 mr-1 text-police-gray-dark" />
                                  <span className="text-police-gray-dark dark:text-police-text-muted">{report.location}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <Shield className="h-3 w-3 mr-1 text-police-blue-dark dark:text-police-blue-light" />
                                <span className="text-xs text-police-blue-dark dark:text-police-blue-light">
                                  Ufficiale: {report.officer ? `${report.officer.name} ${report.officer.surname}` : 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5">
                                {report.citizen && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded">
                                    Denunciante: {report.citizen.firstname} {report.citizen.lastname}
                                  </span>
                                )}
                                
                                {report.isAnonymous && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded">
                                    Anonima
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-md text-center">
                      <p className="text-police-gray-dark dark:text-police-text-muted">
                        Nessuna denuncia in cui questo cittadino è accusato.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link href={`/reports/new?accusedId=${citizen.id}`}>
                      <Button variant="outline" leftIcon={<AlertCircle className="h-4 w-4" />}>
                        Denuncia come accusato
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Tab Arresti */}
              {activeTab === 'arrests' && (
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Arresti di {citizen.firstname} {citizen.lastname}
                  </h3>
                  
                  {citizen.arrests && citizen.arrests.length > 0 ? (
                    <div className="space-y-4">
                      {citizen.arrests.map((arrest: any) => (
                        <div key={arrest.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors">
                          <Link href={`/arrests/${arrest.id}`} className="block">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                              <div>
                                <h3 className="font-medium text-red-800 dark:text-red-400">
                                  Arresto del {formatDate(arrest.date)}
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                  <span className="font-semibold">Accuse:</span> {arrest.charges}
                                </p>
                                <p className="text-sm text-police-gray-dark dark:text-police-text-muted mt-2 line-clamp-2">
                                  {arrest.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="flex items-center text-xs mt-1">
                                  <MapPin className="h-3 w-3 mr-1 text-police-gray-dark" />
                                  <span className="text-police-gray-dark dark:text-police-text-muted">{arrest.location}</span>
                                </div>
                                {arrest.fine && (
                                  <div className="flex items-center text-xs mt-1 text-red-700 dark:text-red-300">
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Multa: ${arrest.fine}
                                  </div>
                                )}
                                {arrest.sentence && (
                                  <div className="flex items-center text-xs mt-1 text-red-700 dark:text-red-300">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Sentenza: {arrest.sentence}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center">
                              <Shield className="h-3 w-3 mr-1 text-police-blue-dark dark:text-police-blue-light" />
                              <span className="text-xs text-police-blue-dark dark:text-police-blue-light">
                                Ufficiale: {arrest.officer ? `${arrest.officer.name} ${arrest.officer.surname} (${arrest.officer.badge})` : 'N/A'}
                              </span>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-md text-center">
                      <p className="text-police-gray-dark dark:text-police-text-muted">
                        Nessun arresto associato a questo cittadino.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Tab Porto d'Armi */}
              {activeTab === 'weapons' && (
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-green-500" />
                    Porto d'Armi di {citizen.firstname} {citizen.lastname}
                  </h3>
                  
                  {citizen.weaponLicenses && citizen.weaponLicenses.length > 0 ? (
                    <div className="space-y-4">
                      {citizen.weaponLicenses.map((license: any) => {
                        const isActive = license.status === 'active';
                        const isExpired = new Date(license.expiryDate) < new Date();
                        const statusColor = isActive && !isExpired ? 'green' : isExpired ? 'red' : 'yellow';
                        
                        return (
                          <div 
                            key={license.id} 
                            className={`p-4 border rounded-md transition-colors ${
                              isActive && !isExpired
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 hover:bg-green-100/50 dark:hover:bg-green-900/30'
                                : isExpired
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 hover:bg-red-100/50 dark:hover:bg-red-900/30'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30'
                            }`}
                          >
                            <Link href={`/weapon-licenses/${license.id}`} className="block">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className={`font-semibold ${
                                      isActive && !isExpired 
                                        ? 'text-green-800 dark:text-green-400' 
                                        : isExpired
                                        ? 'text-red-800 dark:text-red-400'
                                        : 'text-yellow-800 dark:text-yellow-400'
                                    }`}>
                                      Licenza N° {license.licenseNumber}
                                    </h4>
                                    <Badge variant={statusColor}>
                                      {isExpired ? 'Scaduto' : license.status === 'active' ? 'Attivo' : license.status === 'suspended' ? 'Sospeso' : 'Revocato'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-1 text-sm">
                                    <p className="text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">Tipo:</span> {
                                        license.licenseType === 'sport_target' ? 'Tiro Sportivo' :
                                        license.licenseType === 'hunting' ? 'Caccia' :
                                        license.licenseType === 'defense' ? 'Difesa Personale' :
                                        license.licenseType === 'collection' ? 'Collezione' :
                                        license.licenseType === 'carry' ? 'Porto d\'Armi' :
                                        license.licenseType
                                      }
                                    </p>
                                    
                                    <p className="text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">Emissione:</span> {formatDate(license.issueDate)}
                                    </p>
                                    
                                    <p className={`font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                      <span className="font-medium">Scadenza:</span> {formatDate(license.expiryDate)}
                                      {isExpired && ' - SCADUTO'}
                                    </p>
                                    
                                    {license.issuingAuthority && (
                                      <p className="text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Autorità:</span> {license.issuingAuthority}
                                      </p>
                                    )}
                                    
                                    {license.authorizedWeapons && Array.isArray(license.authorizedWeapons) && license.authorizedWeapons.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Armi autorizzate ({license.authorizedWeapons.length}):
                                        </p>
                                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-0.5">
                                          {license.authorizedWeapons.slice(0, 3).map((weapon: any, idx: number) => (
                                            <li key={idx} className="text-xs">
                                              {weapon.type} {weapon.caliber} - {weapon.model}
                                            </li>
                                          ))}
                                          {license.authorizedWeapons.length > 3 && (
                                            <li className="text-xs italic">
                                              ... e altre {license.authorizedWeapons.length - 3} armi
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                  <Target className={`h-6 w-6 ${
                                    isActive && !isExpired 
                                      ? 'text-green-500' 
                                      : isExpired
                                      ? 'text-red-500'
                                      : 'text-yellow-500'
                                  }`} />
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-md text-center">
                      <p className="text-police-gray-dark dark:text-police-text-muted">
                        Nessun porto d'armi associato a questo cittadino.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link href={`/weapon-licenses/new`}>
                      <Button variant="primary" leftIcon={<Target className="h-4 w-4" />}>
                        Rilascia Porto d'Armi
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Tab Note */}
              {activeTab === 'notes' && (
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-gray-500" />
                    Note su {citizen.firstname} {citizen.lastname}
                  </h3>
                  
                  {/* Messaggio di errore */}
                  {noteError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">{noteError}</p>
                      <button
                        onClick={() => setNoteError(null)}
                        className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Form per aggiungere nota */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Aggiungi Nota
                    </h4>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Scrivi una nota su questo cittadino..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-police-blue dark:focus:ring-police-blue-light resize-none"
                      rows={4}
                      disabled={addingNote}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="primary"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || addingNote}
                        leftIcon={<FileText className="h-4 w-4" />}
                      >
                        {addingNote ? 'Salvataggio...' : 'Aggiungi Nota'}
                      </Button>
                    </div>
                  </div>

                  {/* Lista note */}
                  {notesLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Caricamento note...</p>
                    </div>
                  ) : notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note: any) => (
                        <div
                          key={note.id}
                          className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1">
                              <Shield className="h-4 w-4 text-police-blue" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {note.officer.rank} {note.officer.name} {note.officer.surname}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {note.officer.department} - Badge {note.officer.badge}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDateTime(note.createdAt)}
                              </div>
                              {editingNoteId !== note.id && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleStartEdit(note)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Modifica nota"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmNoteId(note.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Elimina nota"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {editingNoteId === note.id ? (
                            <div className="mt-2 pl-6">
                              <textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-police-blue dark:focus:ring-police-blue-light resize-none"
                                rows={3}
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  Annulla
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(note.id)}
                                  disabled={!editingContent.trim()}
                                  className="px-3 py-1.5 text-sm bg-police-blue text-white hover:bg-police-blue-dark rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Save className="h-4 w-4" />
                                  Salva
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2 pl-6">
                              {note.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-md text-center">
                      <p className="text-police-gray-dark dark:text-police-text-muted">
                        Nessuna nota disponibile su questo cittadino.
                      </p>
                    </div>
                  )}
                  
                  {/* Modale conferma eliminazione */}
                  {deleteConfirmNoteId && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center mb-4">
                          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Conferma Eliminazione
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Sei sicuro di voler eliminare questa nota? Questa azione non può essere annullata.
                        </p>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setDeleteConfirmNoteId(null)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            Annulla
                          </button>
                          <button
                            onClick={() => handleDeleteNote(deleteConfirmNoteId)}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Colonna laterale */}
        <div className="lg:col-span-1 space-y-6">
          {/* Azioni Rapide */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-police-blue" />
              Azioni Rapide
            </h2>
            
            <div className="space-y-3">
              <Link href={`/reports/new?citizenId=${citizen.id}`} className="block w-full">
                <Button variant="outline" fullWidth leftIcon={<FileText className="h-4 w-4" />}>
                  Crea Denuncia
                </Button>
              </Link>
              
              <Link href={`/reports/new?accusedId=${citizen.id}`} className="block w-full">
                <Button variant="outline" fullWidth leftIcon={<AlertTriangle className="h-4 w-4" />}>
                  Denuncia come Accusato
                </Button>
              </Link>
            </div>
          </Card>
          
          {/* Statistiche */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-police-blue" />
              Statistiche
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md text-center">
                <p className="text-xl font-bold text-police-blue-dark dark:text-police-text-light">
                  {citizen.reports ? citizen.reports.length : 0}
                </p>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                  Denunce Presentate
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-md text-center">
                <p className="text-xl font-bold text-police-blue-dark dark:text-police-text-light">
                  {citizen.accusedReports ? citizen.accusedReports.length : 0}
                </p>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                  Denunce Ricevute
                </p>
              </div>
              
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md text-center">
                <p className="text-xl font-bold text-police-blue-dark dark:text-police-text-light">
                  {citizen.arrests ? citizen.arrests.length : 0}
                </p>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                  Arresti
                </p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-md text-center">
                <p className="text-xl font-bold text-police-blue-dark dark:text-police-text-light">
                  {citizen.weaponLicenses ? citizen.weaponLicenses.length : 0}
                </p>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                  Porto d'Armi
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
