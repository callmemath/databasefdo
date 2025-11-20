'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Shield,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Ban,
  RotateCcw,
} from 'lucide-react';

interface WeaponLicense {
  id: string;
  licenseNumber: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
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
  carry: 'Porto d\'Armi',
};

export default function WeaponLicenseDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const [license, setLicense] = useState<WeaponLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [licenseId, setLicenseId] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      setLicenseId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (licenseId) {
      fetchLicense();
    }
  }, [licenseId]);

  const fetchLicense = async () => {
    if (!licenseId) return;
    
    try {
      const res = await fetch(`/api/weapon-licenses/${licenseId}`);
      if (!res.ok) throw new Error('Errore nel recupero della licenza');
      
      const data = await res.json();
      setLicense(data.license);
    } catch (error) {
      console.error('Errore:', error);
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
        body: JSON.stringify({
          status: newStatus,
          suspensionReason: reason,
        }),
      });

      if (!res.ok) throw new Error('Errore nell\'aggiornamento');

      await fetchLicense();
      setShowSuspendModal(false);
      setSuspensionReason('');
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore nell\'aggiornamento dello stato');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">Caricamento...</div>
      </MainLayout>
    );
  }

  if (!license) {
    return (
      <MainLayout>
        <div className="text-center py-8">Licenza non trovata</div>
      </MainLayout>
    );
  }

  const isExpired = new Date(license.expiryDate) < new Date();
  const isExpiringSoon = () => {
    const expiry = new Date(license.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">
                Porto d'Armi #{license.licenseNumber}
              </h1>
              {license.status === 'active' && (
                <Badge variant="green">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Attivo
                </Badge>
              )}
              {license.status === 'suspended' && (
                <Badge variant="yellow">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Sospeso
                </Badge>
              )}
              {license.status === 'revoked' && (
                <Badge variant="red">
                  <XCircle className="w-3 h-3 mr-1" />
                  Revocato
                </Badge>
              )}
              {license.status === 'expired' && (
                <Badge variant="red">
                  <XCircle className="w-3 h-3 mr-1" />
                  Scaduto
                </Badge>
              )}
            </div>
            <p className="text-police-gray-dark dark:text-gray-400">
              Tipo: {licenseTypeLabels[license.licenseType]}
            </p>
          </div>

          <div className="flex gap-2">
            {license.status === 'active' && (
              <Button
                variant="danger"
                onClick={() => setShowSuspendModal(true)}
                disabled={actionLoading}
              >
                <Ban className="w-4 h-4 mr-2" />
                Sospendi
              </Button>
            )}
            {(license.status === 'suspended' || license.status === 'revoked') && (
              <Button
                variant="primary"
                onClick={() => updateStatus('active')}
                disabled={actionLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Riattiva
              </Button>
            )}
          </div>
        </div>

        {/* Alert scadenza */}
        {isExpired && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex items-center text-red-800 dark:text-red-300">
              <XCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Questa licenza è scaduta il {new Date(license.expiryDate).toLocaleDateString('it-IT')}</span>
            </div>
          </div>
        )}

        {isExpiringSoon() && !isExpired && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex items-center text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-medium">Questa licenza scadrà il {new Date(license.expiryDate).toLocaleDateString('it-IT')}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informazioni Licenza */}
            <Card>
              <h2 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Informazioni Licenza
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-police-gray-dark dark:text-gray-400">Numero Licenza</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">{license.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-police-gray-dark dark:text-gray-400">Tipo</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">
                    {licenseTypeLabels[license.licenseType]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-police-gray-dark dark:text-gray-400">Data Rilascio</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">
                    {new Date(license.issueDate).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-police-gray-dark dark:text-gray-400">Data Scadenza</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon() ? 'text-yellow-600' : 'text-police-blue-dark dark:text-white'}`}>
                    {new Date(license.expiryDate).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-police-gray-dark dark:text-gray-400">Autorità Emittente</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">{license.issuingAuthority}</p>
                </div>
              </div>

              {license.restrictions && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-police-gray-dark dark:text-gray-400 mb-1">Restrizioni</p>
                  <p className="text-police-blue-dark dark:text-white">{license.restrictions}</p>
                </div>
              )}

              {license.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-police-gray-dark dark:text-gray-400 mb-1">Note</p>
                  <p className="text-police-blue-dark dark:text-white">{license.notes}</p>
                </div>
              )}

              {license.suspensionReason && (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4 rounded">
                  <p className="text-sm text-red-800 dark:text-red-400 mb-1 font-medium">Motivo Sospensione/Revoca</p>
                  <p className="text-red-900 dark:text-red-300">{license.suspensionReason}</p>
                </div>
              )}
            </Card>

            {/* Armi Autorizzate */}
            {license.authorizedWeapons && license.authorizedWeapons.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold text-police-blue-dark dark:text-white mb-4">
                  Armi Autorizzate
                </h2>
                
                <div className="space-y-3">
                  {license.authorizedWeapons.map((weapon: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md"
                    >
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-police-gray-dark dark:text-gray-400">Tipo:</span>
                          <span className="ml-2 font-medium text-police-blue-dark dark:text-white">{weapon.type}</span>
                        </div>
                        <div>
                          <span className="text-police-gray-dark dark:text-gray-400">Calibro:</span>
                          <span className="ml-2 font-medium text-police-blue-dark dark:text-white">{weapon.caliber}</span>
                        </div>
                        <div>
                          <span className="text-police-gray-dark dark:text-gray-400">Modello:</span>
                          <span className="ml-2 font-medium text-police-blue-dark dark:text-white">{weapon.model}</span>
                        </div>
                        <div>
                          <span className="text-police-gray-dark dark:text-gray-400">Matricola:</span>
                          <span className="ml-2 font-medium text-police-blue-dark dark:text-white">
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
          <div className="space-y-6">
            {/* Informazioni Cittadino */}
            <Card>
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Cittadino
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-police-gray-dark dark:text-gray-400">Nome Completo</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">
                    {license.citizen.firstname} {license.citizen.lastname}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-police-gray-dark dark:text-gray-400">Data di Nascita</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">
                    {new Date(license.citizen.dateofbirth).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => router.push(`/citizens/${license.citizen.id}`)}
                >
                  Visualizza Profilo
                </Button>
              </div>
            </Card>

            {/* Informazioni Operative */}
            <Card>
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Info Operative
              </h2>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-police-gray-dark dark:text-gray-400">Inserito da</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">
                    {license.officer.rank} {license.officer.name} {license.officer.surname}
                  </p>
                  <p className="text-xs text-police-gray-dark dark:text-gray-400">
                    {license.officer.badge} - {license.officer.department}
                  </p>
                </div>
                <div>
                  <p className="text-police-gray-dark dark:text-gray-400">Data Creazione</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">
                    {new Date(license.createdAt).toLocaleString('it-IT')}
                  </p>
                </div>
                <div>
                  <p className="text-police-gray-dark dark:text-gray-400">Ultimo Aggiornamento</p>
                  <p className="font-medium text-police-blue-dark dark:text-white">
                    {new Date(license.updatedAt).toLocaleString('it-IT')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal Sospensione */}
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
                className="w-full px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                placeholder="Motivo della sospensione..."
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspensionReason('');
                  }}
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
      </div>
    </MainLayout>
  );
}
