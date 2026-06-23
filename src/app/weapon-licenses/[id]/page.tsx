'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getCitizenRouteRef } from '@/lib/utils';
import Link from 'next/link';
import {
  Shield,
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
  Clock,
  MapPin,
} from 'lucide-react';

interface WeaponLicense {
  id: string;
  licenseNumber: string;
  licenseType: string;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  issuingAuthority: string;
  restrictions?: string;
  authorizedWeapons?: any[];
  notes?: string;
  suspensionReason?: string;
  citizen: {
    id: number;
    firstname: string;
    lastname: string;
    dateofbirth: string;
    sex?: string;
    phone_number?: string;
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

const licenseTypeLabels: Record<string, string> = {
  sport_target: 'Tiro Sportivo',
  hunting: 'Caccia',
  defense: 'Difesa Personale',
  collection: 'Collezione',
  carry: "Porto d'Armi",
};

export default function WeaponLicenseDetailPage() {
  const params = useParams();
  const licenseId = params.id as string;

  const [license, setLicense] = useState<WeaponLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    if (licenseId) fetchLicense();
  }, [licenseId]);

  const fetchLicense = async () => {
    try {
      const res = await fetch(`/api/weapon-licenses/${licenseId}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'Licenza non trovata' : 'Errore nel recupero della licenza');
        return;
      }
      const data = await res.json();
      setLicense(data.license);
    } catch (err) {
      console.error('Errore:', err);
      setError('Si è verificato un errore durante il recupero dei dati');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string, reason?: string) => {
    if (!licenseId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/weapon-licenses/${licenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, suspensionReason: reason }),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      await fetchLicense();
      setShowSuspendModal(false);
      setSuspensionReason('');
    } catch (err) {
      console.error('Errore:', err);
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

  if (error || !license) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-police-accent-red mb-4" />
          <h2 className="text-xl font-bold text-police-blue-dark dark:text-white mb-2">
            {error || 'Licenza non trovata'}
          </h2>
          <p className="text-police-gray-dark dark:text-gray-300 mb-6">
            Non è stato possibile recuperare i dati richiesti.
          </p>
          <Link href="/weapon-licenses">
            <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Torna alla lista
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isExpired = !!license.expiryDate && new Date(license.expiryDate) < new Date();
  const isExpiringSoon = (() => {
    if (!license.expiryDate) return false;
    const days = Math.floor(
      (new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days <= 30 && days > 0;
  })();

  const statusMap: Record<string, React.ReactElement> = {
    active: (
      <Badge variant="green">
        <CheckCircle className="w-3 h-3 mr-1" />
        Attivo
      </Badge>
    ),
    suspended: (
      <Badge variant="yellow">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Sospeso
      </Badge>
    ),
    revoked: (
      <Badge variant="red">
        <XCircle className="w-3 h-3 mr-1" />
        Revocato
      </Badge>
    ),
    expired: (
      <Badge variant="red">
        <XCircle className="w-3 h-3 mr-1" />
        Scaduto
      </Badge>
    ),
  };

  return (
    <MainLayout>
      {/* Modal sospensione */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4">
              Sospendi Licenza
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

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Link href="/weapon-licenses" className="mr-4">
              <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Torna alle licenze
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
                  Licenza #{license.licenseNumber}
                </h1>
                {statusMap[license.status]}
              </div>
              <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
                {licenseTypeLabels[license.licenseType] ?? license.licenseType}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert scadenza */}
      {isExpired && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center text-red-800 dark:text-red-300">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-medium">
              Licenza scaduta il{' '}
              {license.expiryDate
                ? new Date(license.expiryDate).toLocaleDateString('it-IT')
                : 'N/D'}
            </span>
          </div>
        </div>
      )}

      {isExpiringSoon && !isExpired && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center text-yellow-800 dark:text-yellow-300">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-medium">
              Licenza in scadenza il{' '}
              {license.expiryDate
                ? new Date(license.expiryDate).toLocaleDateString('it-IT')
                : 'N/D'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informazioni Licenza */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Informazioni Licenza
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Numero Licenza</div>
                  <div className="font-medium text-police-blue-dark dark:text-police-text-light">
                    {license.licenseNumber}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Tipo</div>
                  <div className="font-medium text-police-blue-dark dark:text-police-text-light">
                    {licenseTypeLabels[license.licenseType] ?? license.licenseType}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Autorità Emittente</div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{license.issuingAuthority}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Data Rilascio</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">
                      {license.issueDate
                        ? new Date(license.issueDate).toLocaleDateString('it-IT')
                        : 'In attesa di attivazione'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Data Scadenza</div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span
                      className={`font-medium ${
                        isExpired
                          ? 'text-red-600 dark:text-red-400'
                          : isExpiringSoon
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'dark:text-police-text-light'
                      }`}
                    >
                      {license.expiryDate
                        ? new Date(license.expiryDate).toLocaleDateString('it-IT')
                        : 'In attesa di attivazione'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {license.restrictions && (
              <div className="mt-4 pt-4 border-t border-police-gray dark:border-gray-700">
                <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Restrizioni</div>
                <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                  <p className="text-police-gray-dark dark:text-police-text-muted">{license.restrictions}</p>
                </div>
              </div>
            )}

            {license.notes && (
              <div className="mt-4 pt-4 border-t border-police-gray dark:border-gray-700">
                <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Note</div>
                <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                  <p className="text-police-gray-dark dark:text-police-text-muted">{license.notes}</p>
                </div>
              </div>
            )}

            {license.suspensionReason && (
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                <div className="bg-red-50 dark:bg-red-900/10 rounded-md p-4">
                  <div className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                    Motivo Sospensione/Revoca
                  </div>
                  <p className="text-red-900 dark:text-red-300">{license.suspensionReason}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Armi Autorizzate */}
          {license.authorizedWeapons && license.authorizedWeapons.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-police-accent-red dark:text-red-400" />
                Armi Autorizzate
              </h2>

              <div className="space-y-3">
                {license.authorizedWeapons.map((weapon: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border border-police-gray dark:border-gray-600 rounded-md"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-police-gray-dark dark:text-police-text-muted">Tipo:</span>
                        <span className="ml-2 font-medium dark:text-police-text-light">{weapon.type}</span>
                      </div>
                      <div>
                        <span className="text-police-gray-dark dark:text-police-text-muted">Calibro:</span>
                        <span className="ml-2 font-medium dark:text-police-text-light">{weapon.caliber}</span>
                      </div>
                      <div>
                        <span className="text-police-gray-dark dark:text-police-text-muted">Modello:</span>
                        <span className="ml-2 font-medium dark:text-police-text-light">{weapon.model}</span>
                      </div>
                      <div>
                        <span className="text-police-gray-dark dark:text-police-text-muted">Matricola:</span>
                        <span className="ml-2 font-medium dark:text-police-text-light">
                          {weapon.serialNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cittadino */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light flex items-center">
                <User className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
                Cittadino
              </h2>
              <Link href={`/citizens/${getCitizenRouteRef(license.citizen)}`}>
                <Button variant="outline" size="sm">
                  Profilo completo
                </Button>
              </Link>
            </div>

            <div className="flex items-center mb-4">
              <div className="h-14 w-14 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-xl font-bold text-police-blue dark:text-blue-400">
                  {license.citizen.firstname[0]}
                  {license.citizen.lastname[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-police-blue-dark dark:text-police-text-light">
                  {license.citizen.firstname} {license.citizen.lastname}
                </h3>
                <div className="flex items-center text-sm text-police-gray-dark dark:text-police-text-muted">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span>
                    Nato il{' '}
                    {new Date(license.citizen.dateofbirth).toLocaleDateString('it-IT')}
                  </span>
                </div>
                {license.citizen.sex && (
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted">
                    {license.citizen.sex}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Info Operative */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Info Operative
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-police-gray-dark dark:text-police-text-muted mb-1">Inserito da</div>
                <div className="font-medium dark:text-police-text-light">
                  {license.officer.rank} {license.officer.name} {license.officer.surname}
                </div>
                <div className="text-xs text-police-gray-dark dark:text-police-text-muted">
                  {license.officer.badge} · {license.officer.department}
                </div>
              </div>
              <div>
                <div className="text-police-gray-dark dark:text-police-text-muted mb-1">Data Creazione</div>
                <div className="font-medium dark:text-police-text-light">
                  {new Date(license.createdAt).toLocaleString('it-IT')}
                </div>
              </div>
              <div>
                <div className="text-police-gray-dark dark:text-police-text-muted mb-1">Ultimo Aggiornamento</div>
                <div className="font-medium dark:text-police-text-light">
                  {new Date(license.updatedAt).toLocaleString('it-IT')}
                </div>
              </div>
            </div>
          </Card>

          {/* Azioni */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Azioni
            </h2>

            <div className="flex flex-col gap-3">
              {license.status === 'active' && (
                <Button
                  variant="danger"
                  fullWidth
                  leftIcon={<Ban className="h-4 w-4" />}
                  onClick={() => setShowSuspendModal(true)}
                  disabled={actionLoading}
                >
                  Sospendi Licenza
                </Button>
              )}
              {(license.status === 'suspended' || license.status === 'revoked') && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => updateStatus('active')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Riattivazione...' : 'Riattiva Licenza'}
                </Button>
              )}
              <Link href="/weapon-licenses">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
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
