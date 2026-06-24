'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Briefcase, Plus, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
  } | null;
  officer: {
    name: string;
    surname: string;
    badge: string;
    department: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'In Attesa', color: 'gray', icon: Clock },
  active: { label: 'Attiva', color: 'green', icon: CheckCircle },
  suspended: { label: 'Sospesa', color: 'yellow', icon: AlertTriangle },
  revoked: { label: 'Revocata', color: 'red', icon: XCircle },
};

export default function VatRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<VatRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/vat-registrations?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Errore nel recupero delle partite IVA');
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const getStatusBadge = (status: string) => {
    const info = statusLabels[status] || { label: status, color: 'gray', icon: Clock };
    const Icon = info.icon;
    return (
      <Badge variant={info.color as 'green' | 'red' | 'yellow' | 'gray'}>
        <Icon className="w-3 h-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  const columns = [
    {
      header: 'N° Registrazione',
      accessor: 'registrationNumber' as const,
      cell: (r: VatRegistration) => (
        <div className="font-medium text-police-blue-dark dark:text-white font-mono text-sm">
          {r.registrationNumber}
        </div>
      ),
    },
    {
      header: 'Intestatario',
      accessor: 'citizen' as const,
      cell: (r: VatRegistration) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {r.citizen ? `${r.citizen.firstname} ${r.citizen.lastname}` : 'Cittadino non disponibile'}
        </div>
      ),
    },
    {
      header: 'Attività',
      accessor: 'businessName' as const,
      cell: (r: VatRegistration) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{r.businessName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{r.businessType}</div>
        </div>
      ),
    },
    {
      header: 'Regime Fiscale',
      accessor: 'taxRegime' as const,
      cell: (r: VatRegistration) => (
        <Badge variant="blue">{r.taxRegime}</Badge>
      ),
    },
    {
      header: 'Stato',
      accessor: 'status' as const,
      cell: (r: VatRegistration) => getStatusBadge(r.status),
    },
    {
      header: 'Data Apertura',
      accessor: 'issueDate' as const,
      cell: (r: VatRegistration) => {
        if (!r.issueDate || r.status === 'pending') {
          return <span className="text-gray-400 italic text-sm">In attesa di attivazione</span>;
        }
        return <span>{new Date(r.issueDate).toLocaleDateString('it-IT')}</span>;
      },
    },
  ];

  const stats = [
    { title: 'Totale', value: registrations.length, icon: Briefcase, color: 'blue' as const },
    { title: 'In Attesa', value: registrations.filter(r => r.status === 'pending').length, icon: Clock, color: 'gray' as const },
    { title: 'Attive', value: registrations.filter(r => r.status === 'active').length, icon: CheckCircle, color: 'green' as const },
    { title: 'Sospese/Revocate', value: registrations.filter(r => r.status === 'suspended' || r.status === 'revoked').length, icon: XCircle, color: 'red' as const },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">Partita IVA</h1>
            <p className="text-police-gray-dark dark:text-gray-400 mt-1">
              Gestione delle registrazioni di partita IVA
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push('/vat-registrations/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nuova Registrazione
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-police-gray-dark dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-police-blue-dark dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchInput
              placeholder="Cerca per numero registrazione o cittadino..."
              onSearch={setSearchQuery}
              autoSearch
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-police-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">In Attesa</option>
              <option value="active">Attive</option>
              <option value="suspended">Sospese</option>
              <option value="revoked">Revocate</option>
            </select>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="text-center py-8 text-police-gray-dark dark:text-gray-400">Caricamento...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-police-gray-dark dark:text-gray-400">
              Nessuna registrazione trovata
            </div>
          ) : (
            <Table
              columns={columns}
              data={registrations}
              onRowClick={(r) => router.push(`/vat-registrations/${r.id}`)}
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
