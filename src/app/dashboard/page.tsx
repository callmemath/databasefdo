'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { 
  User, Loader2,
  FileText, AlertCircle,
  Users, AlertTriangle, Eye, MapPin, ArrowRight, Calendar, Shield
} from 'lucide-react';

// Lazy load dei componenti non critici per migliorare le performance
const DynamicCharts = dynamic(() => import('../../components/dashboard/DashboardCharts'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-40"></div>,
  ssr: false
});

interface StatsData {
  counts: {
    users: number;
    arrests: number;
    reports: number;
  };
  recent: {
    arrests: any[];
    reports: any[];
  };
  charts: {
    departmentArrestStats: { department: string; count: number }[];
    reportTypeStats: { type: string; count: number }[];
    monthlyArrestStats: { month: string; count: number }[];
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica le statistiche dal backend con debouncing
  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/stats', {
          credentials: 'include',
          // Aggiungi header per caching
          headers: {
            'Cache-Control': 'max-age=300', // 5 minuti
          }
        });

        if (!response.ok) {
          throw new Error(`Errore nel caricamento delle statistiche: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Solo aggiorna lo stato se il componente è ancora montato
        if (isMounted) {
          setStats(data);
        }
      } catch (err: any) {
        console.error('Errore durante il caricamento delle statistiche:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [status]);

  // Funzione per ottenere il colore del badge in base al tipo di rapporto
  const getReportTypeBadge = (type: string) => {
    const typeBadges: Record<string, any> = {
      'furto': 'red',
      'violenza': 'red',
      'disturbo': 'yellow',
      'vandalismo': 'blue',
      'truffa': 'gold',
      'droga': 'blue',
      'altro': 'gray'
    };

    return typeBadges[type] || 'gray';
  };

  // Stato di caricamento
  if (loading) {
    return (
      <MainLayout>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-police-blue animate-spin" />
          <span className="ml-4 text-lg">Caricamento dashboard...</span>
        </div>
      </MainLayout>
    );
  }

  // Stato di errore
  if (error) {
    return (
      <MainLayout>
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 mb-4">
          <p className="font-semibold">Si è verificato un errore:</p>
          <p>{error}</p>
        </div>
      </MainLayout>
    );
  }

  // Stato di sessione non valida
  if (!session) {
    return (
      <MainLayout>
        <div className="h-screen flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-red-500 mr-2" />
          <p className="text-lg text-red-600">Sessione non valida. Effettua nuovamente il login.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
          Dashboard Operativa
        </h1>
        <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
          Benvenuto, {session.user.name} - {session.user.department}
        </p>
      </div>
      
      {/* Statistiche generali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm uppercase font-semibold text-police-gray-dark dark:text-gray-400 mb-2">
                Operatori Registrati
              </div>
              <div className="text-3xl font-bold text-police-blue-dark dark:text-white">
                {stats?.counts.users || 0}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-police-gray-dark dark:text-gray-400">
            Personale attivo nel sistema
          </div>
        </Card>
        
        <Card className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm uppercase font-semibold text-police-gray-dark dark:text-gray-400 mb-2">
                Arresti Totali
              </div>
              <div className="text-3xl font-bold text-police-blue-dark dark:text-white">
                {stats?.counts.arrests || 0}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-police-gray-dark dark:text-gray-400">
            Procedure di arresto concluse
          </div>
        </Card>
        
        <Card className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm uppercase font-semibold text-police-gray-dark dark:text-gray-400 mb-2">
                Denunce Totali
              </div>
              <div className="text-3xl font-bold text-police-blue-dark dark:text-white">
                {stats?.counts.reports || 0}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-police-gray-dark dark:text-gray-400">
            Segnalazioni e denunce registrate
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profilo Operatore */}
        <Card title="Profilo Operatore" className="col-span-1">
          <div className="flex items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-police-blue flex items-center justify-center text-white font-bold text-xl">
              {session.user.name?.split(' ').map((n: string) => n[0]).join('') || 'OP'}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light">
                {session.user.name}
              </h3>
              <div className="flex items-center text-police-gray-dark dark:text-police-text-muted">
                <Badge variant="blue">{session.user.department}</Badge>
                <span className="mx-2">•</span>
                <Badge variant="gray">{session.user.rank}</Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-police-gray-dark dark:text-police-text-muted mr-3" />
              <span className="text-police-gray-dark dark:text-police-text-muted">Badge:</span>
              <span className="ml-auto font-medium dark:text-police-text-light">#{session.user.badge}</span>
            </div>
            
            <div className="flex items-center">
              <User className="h-5 w-5 text-police-gray-dark dark:text-police-text-muted mr-3" />
              <span className="text-police-gray-dark dark:text-police-text-muted">Grado:</span>
              <span className="ml-auto font-medium dark:text-police-text-light">{session.user.rank}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-police-gray-dark dark:text-police-text-muted mr-3" />
              <span className="text-police-gray-dark dark:text-police-text-muted">Dipartimento:</span>
              <span className="ml-auto font-medium dark:text-police-text-light">{session.user.department}</span>
            </div>
          </div>
        </Card>
        
        {/* Arresti Recenti */}
        <Card title="Arresti Recenti" className="col-span-1 lg:col-span-2">
          <div className="space-y-4">
            {stats?.recent.arrests && stats.recent.arrests.length > 0 ? (
              stats.recent.arrests.map((arrest, index) => (
                <div key={`arrest-${arrest.id || index}`} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium dark:text-white">{arrest.citizen ? `${arrest.citizen.firstname} ${arrest.citizen.lastname}` : 'N/A'}</div>
                        <div className="flex items-center text-xs text-police-gray-dark dark:text-gray-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(new Date(arrest.date))}</span>
                          <span className="mx-1">•</span>
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{arrest.location}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/arrests/${arrest.id}`}>
                      <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-2 text-sm text-police-gray-dark dark:text-gray-400 truncate">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Accuse:</span> {arrest.charges}
                  </div>
                  
                  <div className="mt-2 text-xs flex justify-between items-center">
                    <div className="text-police-gray-dark dark:text-gray-400">
                      Agente: {arrest.officer ? `${arrest.officer.name} ${arrest.officer.surname}` : 'N/A'}
                    </div>
                    <Badge variant="red">{arrest.fine ? `€ ${arrest.fine}` : ''} {arrest.sentence || ''}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6">
                <AlertCircle className="h-10 w-10 text-police-gray mx-auto mb-2" />
                <p className="text-police-gray-dark dark:text-police-text-muted">
                  Nessun arresto recente da mostrare.
                </p>
              </div>
            )}
            
            <div className="pt-2">
              <Link href="/arrests">
                <Button variant="outline" className="w-full flex items-center justify-center text-police-blue dark:text-blue-400">
                  Vedi tutti gli arresti <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
        
        {/* Denunce Recenti */}
        <Card title="Denunce Recenti" className="col-span-1 lg:col-span-2">
          <div className="space-y-4">
            {stats?.recent.reports && stats.recent.reports.length > 0 ? (
              stats.recent.reports.map((report, index) => (
                <div key={`report-${report.id || index}`} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium dark:text-white">{report.title}</div>
                        <div className="flex items-center text-xs text-police-gray-dark dark:text-gray-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(new Date(report.date))}</span>
                          <span className="mx-1">•</span>
                          <Badge variant={getReportTypeBadge(report.type)}>{report.type}</Badge>
                        </div>
                      </div>
                    </div>
                    <Link href={`/reports/${report.id}`}>
                      <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    {report.isAnonymous ? (
                      <span className="text-police-gray-dark dark:text-gray-400">Denuncia anonima</span>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-police-gray-dark dark:text-gray-400 truncate">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Denunciante:</span> {report.citizen ? `${report.citizen.firstname} ${report.citizen.lastname}` : 'N/A'}
                        </span>
                        {report.accused && (
                          <span className="text-police-gray-dark dark:text-gray-400 truncate ml-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Accusato:</span> {`${report.accused.firstname} ${report.accused.lastname}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs flex justify-between items-center">
                    <div className="text-police-gray-dark dark:text-gray-400">
                      Agente: {report.officer ? `${report.officer.name} ${report.officer.surname}` : 'N/A'}
                    </div>
                    <div className="text-police-gray-dark dark:text-gray-400">
                      {report.location}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6">
                <AlertCircle className="h-10 w-10 text-police-gray mx-auto mb-2" />
                <p className="text-police-gray-dark dark:text-police-text-muted">
                  Nessuna denuncia recente da mostrare.
                </p>
              </div>
            )}
            
            <div className="pt-2">
              <Link href="/reports">
                <Button variant="outline" className="w-full flex items-center justify-center text-police-blue dark:text-blue-400">
                  Vedi tutte le denunce <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
        
        {/* Statistiche Dipartimento - con lazy loading */}
        {stats?.charts && <DynamicCharts data={stats.charts} />}
      </div>
    </MainLayout>
  );
}
