'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import {
  ArrowLeft, User, Mail, Shield, Clock, FileText, Handshake,
} from 'lucide-react';
import Link from 'next/link';

interface Operator {
  id: string;
  name: string;
  surname: string;
  email: string;
  badge: string;
  department: string;
  deptId: number | null;
  rank: string;
  rankId: number | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  arrestsAsOfficer: {
    id: string;
    date: string;
    location: string;
    description: string;
    charges: string;
    sentence: string | null;
    fine: number | null;
    citizenId: number;
    createdAt: string;
  }[];
  reportsAsOfficer: {
    id: string;
    date: string;
    type: string;
    description: string;
    location: string;
    createdAt: string;
  }[];
}

export default function OperatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'arrests' | 'reports'>('arrests');

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? dateString
      : date.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  };

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

  useEffect(() => {
    const fetchOperator = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/operators/${id}`);

        if (!response.ok) {
          throw new Error(`Errore nel caricamento dell'operatore: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.operator) {
          setOperator(data.operator);
        } else {
          throw new Error('Operatore non trovato');
        }
      } catch (err: any) {
        console.error('Errore durante il caricamento dei dati:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOperator();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !operator) {
    return (
      <MainLayout>
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 mb-4">
          <p className="font-semibold">Si è verificato un errore:</p>
          <p>{error ?? 'Operatore non trovato'}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/operators')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Torna agli operatori
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <Link href="/operators">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-4">
            Torna agli operatori
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {operator.image ? (
              <img
                src={operator.image}
                alt={`${operator.name} ${operator.surname}`}
                className="h-20 w-20 rounded-full object-cover border-4 border-police-blue-light"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-police-blue-light flex items-center justify-center text-white text-2xl font-bold border-4 border-police-blue">
                {operator.name[0]}{operator.surname[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
                {operator.name} {operator.surname}
              </h1>
              <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
                {operator.rank} — {operator.department}
              </p>
              <Badge variant="blue" className="mt-2">Badge: {operator.badge}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dati anagrafici */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
            Informazioni
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-police-gray-dark dark:text-police-text-muted shrink-0" />
              <div>
                <p className="text-xs text-police-gray-dark dark:text-police-text-muted">Nome completo</p>
                <p className="text-sm font-medium dark:text-police-text-light">{operator.name} {operator.surname}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-police-gray-dark dark:text-police-text-muted shrink-0" />
              <div>
                <p className="text-xs text-police-gray-dark dark:text-police-text-muted">Email</p>
                <p className="text-sm font-medium dark:text-police-text-light">{operator.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 mt-0.5 text-police-gray-dark dark:text-police-text-muted shrink-0" />
              <div>
                <p className="text-xs text-police-gray-dark dark:text-police-text-muted">Dipartimento</p>
                <p className="text-sm font-medium dark:text-police-text-light">{operator.department}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 mt-0.5 text-police-gray-dark dark:text-police-text-muted shrink-0" />
              <div>
                <p className="text-xs text-police-gray-dark dark:text-police-text-muted">Grado</p>
                <p className="text-sm font-medium dark:text-police-text-light">{operator.rank}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-0.5 text-police-gray-dark dark:text-police-text-muted shrink-0" />
              <div>
                <p className="text-xs text-police-gray-dark dark:text-police-text-muted">Registrato il</p>
                <p className="text-sm font-medium dark:text-police-text-light">{formatDate(operator.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Statistiche rapide */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
                {operator.arrestsAsOfficer.length}
              </p>
              <p className="text-xs text-police-gray-dark dark:text-police-text-muted mt-1">Arresti</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
                {operator.reportsAsOfficer.length}
              </p>
              <p className="text-xs text-police-gray-dark dark:text-police-text-muted mt-1">Denunce</p>
            </div>
          </div>
        </Card>

        {/* Attività */}
        <Card className="lg:col-span-2">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex">
              <button
                className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none flex items-center gap-2
                  ${activeTab === 'arrests'
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('arrests')}
              >
                <Handshake className="h-4 w-4" />
                Arresti ({operator.arrestsAsOfficer.length})
              </button>
              <button
                className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none flex items-center gap-2
                  ${activeTab === 'reports'
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('reports')}
              >
                <FileText className="h-4 w-4" />
                Denunce ({operator.reportsAsOfficer.length})
              </button>
            </div>
          </div>

          {/* Arresti */}
          {activeTab === 'arrests' && (
            <div className="space-y-3">
              {operator.arrestsAsOfficer.length === 0 ? (
                <p className="text-center text-police-gray-dark dark:text-police-text-muted py-8">
                  Nessun arresto registrato.
                </p>
              ) : (
                operator.arrestsAsOfficer.map((arrest) => (
                  <div
                    key={arrest.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-police-blue-dark dark:text-police-text-light">
                        {formatDate(arrest.date)}
                      </span>
                      <Link href={`/arrests/${arrest.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Dettagli
                        </Button>
                      </Link>
                    </div>
                    <p className="text-xs text-police-gray-dark dark:text-police-text-muted mb-1">
                      {arrest.location}
                    </p>
                    <p className="text-sm text-police-blue-dark dark:text-police-text-light line-clamp-2">
                      {arrest.charges}
                    </p>
                    {(arrest.sentence || arrest.fine != null) && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {arrest.sentence && (
                          <Badge variant="red">{arrest.sentence}</Badge>
                        )}
                        {arrest.fine != null && arrest.fine > 0 && (
                          <Badge variant="yellow">€{arrest.fine.toLocaleString('it-IT')}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Denunce */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              {operator.reportsAsOfficer.length === 0 ? (
                <p className="text-center text-police-gray-dark dark:text-police-text-muted py-8">
                  Nessuna denuncia registrata.
                </p>
              ) : (
                operator.reportsAsOfficer.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-police-blue-dark dark:text-police-text-light">
                        {formatDate(report.date)}
                      </span>
                      <Link href={`/reports/${report.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Dettagli
                        </Button>
                      </Link>
                    </div>
                    <p className="text-xs text-police-gray-dark dark:text-police-text-muted mb-1">
                      {report.location} — <Badge variant="blue">{report.type}</Badge>
                    </p>
                    <p className="text-sm text-police-blue-dark dark:text-police-text-light line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
