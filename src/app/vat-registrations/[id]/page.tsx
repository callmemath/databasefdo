'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getCitizenRouteRef } from '@/lib/utils';
import Link from 'next/link';
import {
  Briefcase,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  ArrowLeft,
  Loader,
  AlertCircle,
  MapPin,
} from 'lucide-react';

interface VatRegistration {
  id: string;
  registrationNumber: string;
  businessName: string;
  businessType: string;
  taxRegime: string;
  issueDate: string | null;
  status: string;
  issuingAuthority: string;
  notes?: string;
  suspensionReason?: string;
  citizen: {
    id: number;
    firstname: string;
    lastname: string;
    dateofbirth: string;
    sex?: string;
  };
  officer: {
    id: string;
    name: string;
    surname: string;
    badge: string;
    department: string;
    rank: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function VatRegistrationDetailPage() {
  const params = useParams();
  const registrationId = params.id as string;

  const [registration, setRegistration] = useState<VatRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    if (registrationId) fetchRegistration();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      const res = await fetch(`/api/vat-registrations/${registrationId}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'Partita IVA non trovata' : 'Errore nel recupero');
        return;
      }
      const data = await res.json();
      setRegistration(data.registration);
    } catch {
      setError('Si è verificato un errore durante il recupero dei dati');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string, reason?: string) => {
    if (!registrationId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/vat-registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, suspensionReason: reason }),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      await fetchRegistration();
      setShowSuspendModal(false);
      setSuspensionReason('');
    } catch {
      alert("Errore nell'aggiornamento dello stato");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
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

  if (error || !registration) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-police-accent-red mb-4" />
          <h2 className="text-xl font-bold text-police-blue-dark dark:text-white mb-2">
            {error || 'Registrazione non trovata'}
          </h2>
          <Link href="/vat-registrations">
            <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Torna alla lista
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const statusMap: Record<string, React.ReactElement> = {
    pending: <Badge variant="gray"><Loader className="w-3 h-3 mr-1" />In Attesa</Badge>,
    active: <Badge variant="green"><CheckCircle className="w-3 h-3 mr-1" />Attiva</Badge>,
    suspended: <Badge variant="yellow"><AlertTriangle className="w-3 h-3 mr-1" />Sospesa</Badge>,
    revoked: <Badge variant="red"><XCircle className="w-3 h-3 mr-1" />Revocata</Badge>,
  };

  return (
    <MainLayout>
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4">
              Sospendi Partita IVA
            </h3>
            <p className="text-police-gray-dark dark:text-gray-400 mb-4">
              Inserisci il motivo della sospensione:
            </p>
            <textarea
              rows={4}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              placeholder="Motivo della sospensione..."
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowSuspendModal(false); setSuspensionReason(''); }}
                disabled={actionLoading}
              >
                Annulla
              </Button>
              <Button
                variant="danger"
                onClick={() => updateStatus('suspended', suspensionReason)}
                disabled={actionLoading || !suspensionReason}
              >
                {actionLoading ? 'Sospensione...' : 'Conferma Sospensione'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/vat-registrations" className="mr-4">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Torna alle registrazioni
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
                P.IVA #{registration.registrationNumber}
              </h1>
              {statusMap[registration.status]}
            </div>
            <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
              {registration.businessName} · {registration.businessType}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Informazioni Registrazione
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Numero Registrazione</div>
                  <div className="font-medium text-police-blue-dark dark:text-police-text-light font-mono text-sm">
                    {registration.registrationNumber}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Ragione Sociale</div>
                  <div className="font-medium text-police-blue-dark dark:text-police-text-light">
                    {registration.businessName}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Tipo Attività</div>
                  <div className="font-medium text-police-blue-dark dark:text-police-text-light">
                    {registration.businessType}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Regime Fiscale</div>
                  <Badge variant="blue">{registration.taxRegime}</Badge>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Data Apertura</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">
                      {registration.issueDate
                        ? new Date(registration.issueDate).toLocaleDateString('it-IT')
                        : 'In attesa di attivazione'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Autorità Emittente</div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{registration.issuingAuthority}</span>
                  </div>
                </div>
              </div>
            </div>

            {registration.notes && (
              <div className="mt-4 pt-4 border-t border-police-gray dark:border-gray-700">
                <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Note</div>
                <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                  <p className="text-police-gray-dark dark:text-police-text-muted">{registration.notes}</p>
                </div>
              </div>
            )}

            {registration.suspensionReason && (
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                <div className="bg-red-50 dark:bg-red-900/10 rounded-md p-4">
                  <div className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                    Motivo Sospensione/Revoca
                  </div>
                  <p className="text-red-900 dark:text-red-300">{registration.suspensionReason}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light flex items-center">
                <User className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
                Intestatario
              </h2>
              {registration.citizen && (
                <Link href={`/citizens/${getCitizenRouteRef(registration.citizen)}`}>
                  <Button variant="outline" size="sm">Profilo completo</Button>
                </Link>
              )}
            </div>

            {registration.citizen ? (
              <div className="flex items-center">
                <div className="h-14 w-14 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-police-blue dark:text-blue-400">
                    {registration.citizen.firstname[0]}
                    {registration.citizen.lastname[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-police-blue-dark dark:text-police-text-light">
                    {registration.citizen.firstname} {registration.citizen.lastname}
                  </h3>
                  <div className="flex items-center text-sm text-police-gray-dark dark:text-police-text-muted">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>Nato il {new Date(registration.citizen.dateofbirth).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-police-gray-dark dark:text-police-text-muted">Cittadino non disponibile</p>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Info Operative
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-police-gray-dark dark:text-police-text-muted mb-1">Inserito da</div>
                <div className="font-medium dark:text-police-text-light">
                  {registration.officer.rank} {registration.officer.name} {registration.officer.surname}
                </div>
                <div className="text-xs text-police-gray-dark dark:text-police-text-muted">
                  {registration.officer.badge} · {registration.officer.department}
                </div>
              </div>
              <div>
                <div className="text-police-gray-dark dark:text-police-text-muted mb-1">Data Creazione</div>
                <div className="font-medium dark:text-police-text-light">
                  {new Date(registration.createdAt).toLocaleString('it-IT')}
                </div>
              </div>
              <div>
                <div className="text-police-gray-dark dark:text-police-text-muted mb-1">Ultimo Aggiornamento</div>
                <div className="font-medium dark:text-police-text-light">
                  {new Date(registration.updatedAt).toLocaleString('it-IT')}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Azioni
            </h2>
            <div className="flex flex-col gap-3">
              {registration.status === 'active' && (
                <Button
                  variant="danger"
                  fullWidth
                  leftIcon={<Ban className="h-4 w-4" />}
                  onClick={() => setShowSuspendModal(true)}
                  disabled={actionLoading}
                >
                  Sospendi Registrazione
                </Button>
              )}
              {(registration.status === 'suspended' || registration.status === 'revoked') && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => updateStatus('active')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Riattivazione...' : 'Riattiva Registrazione'}
                </Button>
              )}
              <Link href="/vat-registrations">
                <Button variant="secondary" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Torna alla lista
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
