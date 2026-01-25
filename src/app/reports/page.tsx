'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { FileText, User, Calendar, Filter, Plus, Clock, CheckCircle, XCircle, Edit, Eye, AlertCircle } from 'lucide-react';

export default function Reports() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Funzione per caricare i report
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports');
      
      if (!response.ok) {
        throw new Error('Errore durante il recupero delle denunce');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Errore nel caricamento delle denunce:', err);
      setError('Impossibile caricare le denunce');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica i report all'avvio
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Opzioni per i tipi di report
  const typeOptions = [
    { id: 'all', name: 'Tutti i tipi' },
    { id: 'furto', name: 'Furto' },
    { id: 'violenza', name: 'Violenza o aggressione' },
    { id: 'disturbo', name: 'Disturbo della quiete' },
    { id: 'vandalismo', name: 'Vandalismo' },
    { id: 'truffa', name: 'Truffa' },
    { id: 'droga', name: 'Droga' },
    { id: 'altro', name: 'Altro' }
  ];
  
  const tabOptions = [
    { id: 'all', name: 'Tutte' },
    { id: 'furto', name: 'Furti' },
    { id: 'violenza', name: 'Violenze' },
    { id: 'disturbo', name: 'Disturbi' },
    { id: 'vandalismo', name: 'Vandalismi' },
    { id: 'truffa', name: 'Truffe' },
    { id: 'droga', name: 'Droga' },
    { id: 'altro', name: 'Altro' }
  ];
  
  const typeBadges: Record<string, React.ReactNode> = {
    furto: <Badge variant="red">Furto</Badge>,
    violenza: <Badge variant="red">Violenza</Badge>,
    disturbo: <Badge variant="yellow">Disturbo</Badge>,
    vandalismo: <Badge variant="blue">Vandalismo</Badge>,
    truffa: <Badge variant="gold">Truffa</Badge>,
    droga: <Badge variant="blue">Droga</Badge>,
    altro: <Badge variant="gray">Altro</Badge>
  };
  
  const priorityBadges: Record<string, React.ReactNode> = {
    low: <Badge variant="gray">Bassa</Badge>,
    medium: <Badge variant="blue">Media</Badge>,
    high: <Badge variant="red">Alta</Badge>
  };
  
  // Filtra i report in base alla ricerca e ai filtri
  const filteredReports = reports.filter((report: any) => {
    // Verifica se il report corrisponde alla ricerca
    const matchesSearch = !searchQuery || 
      (report.title && report.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.citizen && report.citizen.firstname && report.citizen.firstname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.citizen && report.citizen.lastname && report.citizen.lastname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.officer && `${report.officer.name} ${report.officer.surname}`.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Verifica se corrisponde al filtro di tipo
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    // Verifica se corrisponde alla tab attiva
    const matchesTab = activeTab === 'all' || report.type === activeTab;
    
    return matchesSearch && matchesType && matchesTab;
  });
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleRowClick = (report: any) => {
    // Navigate to report details
    console.log('Navigate to report details:', report.id);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Sistema Denunce
            </h1>
            <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
              Gestione delle segnalazioni e denunce dei cittadini
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link href="/reports/new">
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Nuova Denuncia
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
        <div className="flex overflow-x-auto">
          {tabOptions.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-police-blue text-white dark:bg-police-blue-dark' 
                : 'text-police-gray-dark dark:text-police-text-muted hover:bg-police-gray-light dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
              <span className="ml-2 bg-white dark:bg-gray-700 text-police-blue dark:text-blue-400 text-xs py-0.5 px-1.5 rounded-full">
                {reports.filter((r: any) => tab.id === 'all' || r.type === tab.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="w-full md:w-64">
            <SearchInput onSearch={handleSearch} placeholder="Cerca denuncia..." />
          </div>
          
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-police-gray-dark dark:text-police-text-muted mr-2" />
            <span className="text-sm text-police-gray-dark dark:text-police-text-muted mr-3">Stato:</span>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
            >
              {typeOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-police-blue dark:border-police-blue-dark mx-auto"></div>
            <p className="mt-4 text-police-gray-dark dark:text-police-text-muted">Caricamento denunce...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-red-600 dark:text-red-400 mb-2">
              Si è verificato un errore
            </h3>
            <p className="text-police-gray-dark dark:text-police-text-muted">
              {error}
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-police-gray-dark dark:text-police-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-medium text-police-blue-dark dark:text-police-text-light mb-2">
              Nessun risultato trovato
            </h3>
            <p className="text-police-gray-dark dark:text-police-text-muted">
              Nessuna denuncia corrisponde ai criteri di ricerca selezionati.
            </p>
          </div>
        ) : (
          <Table
            data={filteredReports}
            columns={[
              {
                header: 'Denuncia',
                accessor: (report: any) => (
                  <div>
                    <div className="font-medium dark:text-police-text-light">{report.title}</div>
                    <div className="flex items-center text-xs text-police-gray-dark dark:text-police-text-muted mt-1">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>Tipo: {report.type}</span>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Cittadino',
                accessor: (report: any) => {
                  const citizenName = report.isAnonymous 
                    ? 'Anonimo' 
                    : report.citizen 
                      ? `${report.citizen.firstname} ${report.citizen.lastname}` 
                      : 'N/A';
                  
                  const citizenId = report.isAnonymous 
                    ? 'N/A' 
                    : report.citizen 
                      ? report.citizen.id 
                      : 'N/A';
                  
                  const initials = report.isAnonymous 
                    ? 'A' 
                    : report.citizen 
                      ? (report.citizen.firstname?.[0] || '') + (report.citizen.lastname?.[0] || '')
                      : 'N/A';
                  
                  return (
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center text-police-blue dark:text-blue-400 font-medium mr-2">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm dark:text-police-text-light">{citizenName}</div>
                        <div className="text-xs text-police-gray-dark dark:text-police-text-muted">
                          ID: {citizenId}
                        </div>
                      </div>
                    </div>
                  );
                },
              },
              {
                header: 'Data',
                accessor: (report: any) => (
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 text-police-gray-dark dark:text-police-text-muted mr-1.5" />
                    <span className="dark:text-police-text-light">
                      {new Date(report.date).toLocaleDateString()}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Tipo',
                accessor: (report: any) => (
                  <div>
                    {typeBadges[report.type] || <Badge variant="gray">{report.type}</Badge>}
                    {report.accused && (
                      <div className="mt-1 text-xs text-police-gray-dark dark:text-police-text-muted flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>Denunciato: {report.accused.firstname} {report.accused.lastname}</span>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                header: 'Agente',
                accessor: (report: any) => (
                  <div className="flex items-center">
                    <User className="h-3.5 w-3.5 text-police-blue dark:text-blue-400 mr-1.5" />
                    <span className="dark:text-police-text-light">
                      {report.officer ? `${report.officer.name} ${report.officer.surname}` : 'N/A'}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Azioni',
                accessor: (report: any) => (
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                      onClick={() => router.push(`/reports/${report.id}`)}
                    >
                      Visualizza
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit className="h-3.5 w-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/reports/${report.id}/edit`);
                      }}
                    >
                      Modifica
                    </Button>
                  </div>
                ),
              },
            ]}
            onRowClick={(report) => router.push(`/reports/${report.id}`)}
          />
        )}
      </Card>
    </MainLayout>
  );
}
