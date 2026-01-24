'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeRefresh } from '@/hooks/useRealtime';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Shield, Plus, Search, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WeaponLicense {
  id: string;
  licenseNumber: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  issuingAuthority: string;
  restrictions?: string;
  authorizedWeapons?: any;
  notes?: string;
  suspensionReason?: string;
  citizen: {
    id: number;
    firstname: string;
    lastname: string;
    dateofbirth: string;
  };
  officer: {
    name: string;
    surname: string;
    badge: string;
    department: string;
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

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Attivo', color: 'green', icon: CheckCircle },
  expired: { label: 'Scaduto', color: 'red', icon: XCircle },
  suspended: { label: 'Sospeso', color: 'yellow', icon: AlertTriangle },
  revoked: { label: 'Revocato', color: 'red', icon: XCircle },
};

export default function WeaponLicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<WeaponLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('licenseType', typeFilter);

      const res = await fetch(`/api/weapon-licenses?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Errore nel recupero dei porto d\'armi');
      }
      
      const data = await res.json();
      setLicenses(data.licenses || []);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  // Carica i dati all'avvio e quando cambiano i filtri
  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // 🔴 Real-time: aggiorna automaticamente quando viene creato/modificato un porto d'armi
  useRealtimeRefresh(['weapon_license_created', 'weapon_license_updated'], fetchLicenses);

  const getStatusBadge = (status: string) => {
    const statusInfo = statusLabels[status] || { label: status, color: 'gray', icon: Clock };
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.color as 'green' | 'red' | 'yellow' | 'gray'}>
        <Icon className="w-3 h-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const columns = [
    {
      header: 'N° Licenza',
      accessor: 'licenseNumber' as const,
      cell: (license: WeaponLicense) => (
        <div className="font-medium text-police-blue-dark dark:text-white">
          {license.licenseNumber}
        </div>
      ),
    },
    {
      header: 'Cittadino',
      accessor: 'citizen' as const,
      cell: (license: WeaponLicense) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {license.citizen.firstname} {license.citizen.lastname}
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessor: 'licenseType' as const,
      cell: (license: WeaponLicense) => (
        <Badge variant="blue">
          {licenseTypeLabels[license.licenseType] || license.licenseType}
        </Badge>
      ),
    },
    {
      header: 'Stato',
      accessor: 'status' as const,
      cell: (license: WeaponLicense) => getStatusBadge(license.status),
    },
    {
      header: 'Scadenza',
      accessor: 'expiryDate' as const,
      cell: (license: WeaponLicense) => {
        const expiry = new Date(license.expiryDate);
        const isExpiring = isExpiringSoon(license.expiryDate);
        const expired = isExpired(license.expiryDate);
        
        return (
          <div className="flex items-center gap-2">
            <span className={expired ? 'text-red-600 dark:text-red-400' : isExpiring ? 'text-yellow-600 dark:text-yellow-400' : ''}>
              {expiry.toLocaleDateString('it-IT')}
            </span>
            {isExpiring && !expired && (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
            {expired && (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
        );
      },
    },
    {
      header: 'Autorità',
      accessor: 'issuingAuthority' as const,
      cell: (license: WeaponLicense) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {license.issuingAuthority}
        </span>
      ),
    },
  ];

  const stats = [
    {
      title: 'Totale Licenze',
      value: licenses.length,
      icon: Shield,
      color: 'blue' as const,
    },
    {
      title: 'Attive',
      value: licenses.filter(l => l.status === 'active').length,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      title: 'In Scadenza',
      value: licenses.filter(l => isExpiringSoon(l.expiryDate) && l.status === 'active').length,
      icon: AlertTriangle,
      color: 'yellow' as const,
    },
    {
      title: 'Sospese/Revocate',
      value: licenses.filter(l => l.status === 'suspended' || l.status === 'revoked').length,
      icon: XCircle,
      color: 'red' as const,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">
              Porto d'Armi
            </h1>
            <p className="text-police-gray-dark dark:text-gray-400 mt-1">
              Gestione delle licenze per il porto d'armi
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/weapon-licenses/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuova Licenza
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-police-gray-dark dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-police-blue-dark dark:text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchInput
              placeholder="Cerca per numero licenza o cittadino..."
              onSearch={setSearchQuery}
              autoSearch
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attive</option>
              <option value="expired">Scadute</option>
              <option value="suspended">Sospese</option>
              <option value="revoked">Revocate</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-police-gray dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tutti i tipi</option>
              <option value="sport_target">Tiro Sportivo</option>
              <option value="hunting">Caccia</option>
              <option value="defense">Difesa Personale</option>
              <option value="collection">Collezione</option>
              <option value="carry">Porto d'Armi</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8 text-police-gray-dark dark:text-gray-400">
              Caricamento...
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-8 text-police-gray-dark dark:text-gray-400">
              Nessuna licenza trovata
            </div>
          ) : (
            <Table
              columns={columns}
              data={licenses}
              onRowClick={(license) => router.push(`/weapon-licenses/${license.id}`)}
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
