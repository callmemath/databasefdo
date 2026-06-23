'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '../../../components/layout/MainLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate } from '@/lib/utils';
import { getCitizenRouteRef } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';
import { usePermissions } from '@/contexts/PermissionsContext';
import {
  ArrowLeft, User, Calendar, Clock, AlertCircle, FileText,
  Shield, Euro, Printer, Edit, Camera, MapPin, Plus, Loader,
  Trash2, Save, X
} from 'lucide-react';
import Link from 'next/link';

export default function ArrestDetails() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { actionRules } = usePermissions();

  const deleteRules = actionRules['delete_arrest'] ?? [];
  const arrestId = params.id;
  const [arrest, setArrest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<{
    location: string;
    description: string;
    charges: string;
    sentence: string;
    fine: string;
    incidentDescription: string;
    seizedItems: string;
    department: string;
    // signingOfficers e accomplices sono gestiti separatamente poiché sono Json
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Può eliminare solo se soddisfa la soglia di rango (config) E l'arresto è della propria fazione
  const canDeleteArrest =
    (deleteRules.length === 0 ||
      hasPermission(
        { deptId: session?.user?.deptId ?? null, rankId: session?.user?.rankId ?? null },
        deleteRules
      )) &&
    !!arrest &&
    arrest.department === session?.user?.department;

  // Recupera i dati dell'arresto
  useEffect(() => {
    const fetchArrestDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/arrests/${arrestId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Arresto non trovato');
          } else {
            setError('Si è verificato un errore durante il recupero dei dati');
          }
          return;
        }
        
        const data = await response.json();
        setArrest(data.arrest);
        
        // Inizializza il form di modifica con i dati correnti
        setEditForm({
          location: data.arrest.location,
          description: data.arrest.description,
          charges: data.arrest.charges,
          sentence: data.arrest.sentence || '',
          fine: data.arrest.fine ? data.arrest.fine.toString() : '',
          incidentDescription: data.arrest.incidentDescription || '',
          seizedItems: data.arrest.seizedItems || '',
          department: data.arrest.department || 'Non specificato'
        });
      } catch (error) {
        console.error('Errore durante il recupero dei dati dell\'arresto:', error);
        setError('Si è verificato un errore durante il recupero dei dati');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArrestDetails();
  }, [arrestId]);
  
  // Gestione dell'aggiornamento dell'arresto
  const handleUpdateArrest = async () => {
    if (!editForm) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/arrests/${arrestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        throw new Error('Si è verificato un errore durante l\'aggiornamento dell\'arresto');
      }
      
      const data = await response.json();
      setArrest(data.arrest);
      setIsEditing(false);
      // Mostra messaggio di successo (puoi implementare una notifica)
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'arresto:', error);
      // Mostra messaggio di errore
    } finally {
      setIsSaving(false);
    }
  };
  
  // Gestione dell'eliminazione dell'arresto
  const handleDeleteArrest = async () => {
    if (!isDeleting) return;
    
    try {
      const response = await fetch(`/api/arrests/${arrestId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Si è verificato un errore durante l\'eliminazione dell\'arresto');
      }
      
      // Reindirizza alla lista degli arresti dopo l'eliminazione
      router.push('/arrests');
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'arresto:', error);
      setIsDeleting(false);
      // Mostra messaggio di errore
    }
  };
  
  // Gestione dell'input del form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editForm) return;
    
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };
  
  // Status badges
  const statusBadges = {
    processing: <Badge variant="blue">In elaborazione</Badge>,
    completed: <Badge variant="green">Completato</Badge>,
    released: <Badge variant="yellow">Rilasciato</Badge>
  };

  if (isLoading) {
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
  
  if (error || !arrest) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-police-accent-red mb-4" />
          <h2 className="text-xl font-bold text-police-blue-dark dark:text-white mb-2">
            {error || 'Arresto non trovato'}
          </h2>
          <p className="text-police-gray-dark dark:text-gray-300 mb-6">
            Non è stato possibile recuperare i dati richiesti.
          </p>
          <Link href="/arrests">
            <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Torna alla lista
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  // Prepara i dati da visualizzare
  const arrestDate = arrest.date ? new Date(arrest.date) : null;
  const formattedDate = arrestDate ? formatDate(arrestDate) : 'N/A';
  const formattedTime = arrestDate ? `${arrestDate.getHours().toString().padStart(2, '0')}:${arrestDate.getMinutes().toString().padStart(2, '0')}` : 'N/A';
  
  const citizenName = arrest.citizen ? `${arrest.citizen.firstname} ${arrest.citizen.lastname}` : 'N/A';
  const citizenBirthDate = arrest.citizen?.dateofbirth ? formatDate(new Date(arrest.citizen.dateofbirth)) : 'N/A';
  const officerFullName = arrest.officer ? `${arrest.officer.name} ${arrest.officer.surname}` : 'N/A';
  
  // Estrai le informazioni sui reati dalle charges
  const chargesList = arrest.charges ? arrest.charges.split(',').map((charge: string) => charge.trim()) : [];

  const handlePrint = () => {
    let accompliceList: any[] = [];
    try { accompliceList = JSON.parse(arrest.accomplices || '[]'); } catch {}
    let signingList: any[] = [];
    try { signingList = JSON.parse(arrest.signingOfficers || '[]'); } catch {}

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>Verbale di Arresto #${arrestId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; color: #1a1a2e; background: #fff; padding: 40px; font-size: 13px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 90px; color: rgba(0,0,0,0.04); font-weight: bold; pointer-events: none; white-space: nowrap; z-index: 0; letter-spacing: 8px; }
    .page { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; }
    .header { border-bottom: 3px double #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left { }
    .header-right { text-align: right; font-size: 11px; color: #555; }
    .logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .badge-icon { width: 48px; height: 48px; background: #1a1a2e; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: bold; }
    .agency { font-size: 18px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
    .doc-title { font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #444; margin-top: 4px; }
    .doc-number { font-size: 22px; font-weight: bold; color: #1a1a2e; margin-bottom: 2px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 16px; }
    .field { margin-bottom: 6px; }
    .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .value { font-size: 13px; font-weight: 500; color: #1a1a2e; }
    .charge-row { display: flex; align-items: flex-start; gap: 10px; padding: 7px 10px; border-left: 3px solid #b91c1c; background: #fef2f2; margin-bottom: 6px; border-radius: 0 4px 4px 0; }
    .charge-num { font-weight: bold; color: #b91c1c; font-size: 11px; min-width: 18px; }
    .charge-text { font-size: 13px; }
    .text-block { background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 4px; padding: 10px 12px; font-size: 12px; line-height: 1.6; color: #333; white-space: pre-wrap; }
    .accomplice-row { display: flex; justify-content: space-between; padding: 6px 10px; background: #f8f8f8; border: 1px solid #eee; border-radius: 4px; margin-bottom: 5px; font-size: 12px; }
    .signing-row { display: inline-block; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; padding: 3px 8px; margin: 3px; font-size: 11px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-released { background: #fef9c3; color: #92400e; }
    .fine-box { display: inline-block; background: #1a1a2e; color: #fff; padding: 6px 16px; border-radius: 4px; font-size: 16px; font-weight: bold; letter-spacing: 1px; }
    .sentence-box { font-size: 15px; font-weight: bold; color: #1a1a2e; }
    .disclaimer { margin-top: 32px; border: 1px dashed #bbb; border-radius: 6px; padding: 12px 16px; background: #fafafa; }
    .disclaimer-title { font-size: 10px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #888; margin-bottom: 5px; }
    .disclaimer-text { font-size: 10px; color: #999; line-height: 1.6; }
    .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
    .signature-area { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .sig-line { border-top: 1px solid #333; padding-top: 4px; font-size: 10px; color: #666; text-align: center; margin-top: 32px; }
    @media print { body { padding: 20px; } .watermark { font-size: 70px; } }
  </style>
</head>
<body>
<div class="watermark">ROLEPLAY</div>
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="logo-area">
        <div class="badge-icon">⚖</div>
        <div>
          <div class="agency">${arrest.department || 'Forze dell\'Ordine'}</div>
          <div class="doc-title">Verbale di Arresto</div>
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-number">#${arrestId}</div>
      <div>Data: ${formattedDate}</div>
      <div>Ora: ${formattedTime}</div>
      <div style="margin-top:4px;">
        <span class="status-badge status-${arrest.status || 'processing'}">${
          arrest.status === 'completed' ? 'Completato' :
          arrest.status === 'released' ? 'Rilasciato' : 'In elaborazione'
        }</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dati Soggetto Arrestato</div>
    <div class="grid3">
      <div class="field"><div class="label">Nome Completo</div><div class="value">${citizenName}</div></div>
      <div class="field"><div class="label">Data di Nascita</div><div class="value">${citizenBirthDate}</div></div>
      <div class="field"><div class="label">Sesso</div><div class="value">${arrest.citizen?.sex || 'N/D'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dettagli Arresto</div>
    <div class="grid2">
      <div class="field"><div class="label">Luogo</div><div class="value">${arrest.location || 'N/D'}</div></div>
      <div class="field"><div class="label">Dipartimento</div><div class="value">${arrest.department || 'Non specificato'}</div></div>
      <div class="field"><div class="label">Agente Responsabile</div><div class="value">${officerFullName}</div></div>
      <div class="field"><div class="label">Matricola / Reparto</div><div class="value">${arrest.officer?.badge || ''} · ${arrest.officer?.department || ''}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Reati Contestati (${chargesList.length})</div>
    ${chargesList.map((c: string, i: number) => `
      <div class="charge-row">
        <span class="charge-num">${i + 1}.</span>
        <span class="charge-text">${c}</span>
      </div>`).join('') || '<p style="color:#888;font-size:12px;">Nessun reato registrato</p>'}
  </div>

  ${arrest.incidentDescription ? `
  <div class="section">
    <div class="section-title">Descrizione degli Accaduti</div>
    <div class="text-block">${arrest.incidentDescription}</div>
  </div>` : ''}

  ${arrest.seizedItems ? `
  <div class="section">
    <div class="section-title">Oggetti Sequestrati</div>
    <div class="text-block">${arrest.seizedItems}</div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Sentenza e Sanzioni</div>
    <div class="grid2">
      <div class="field">
        <div class="label">Pena Detentiva</div>
        <div class="sentence-box">${arrest.sentence || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Ammenda</div>
        ${arrest.fine ? `<div class="fine-box">€ ${arrest.fine}</div>` : '<div class="value">—</div>'}
      </div>
    </div>
  </div>

  ${accompliceList.length > 0 ? `
  <div class="section">
    <div class="section-title">Complici (${accompliceList.length})</div>
    ${accompliceList.map((a: any) => `
      <div class="accomplice-row">
        <span>${a.name || 'N/D'}</span>
        <span style="color:#888;">${a.birthDate || ''}</span>
      </div>`).join('')}
  </div>` : ''}

  ${signingList.length > 0 ? `
  <div class="section">
    <div class="section-title">Operatori Firmatari</div>
    <div>${signingList.map((o: any) => `<span class="signing-row">${o.name || ''}${o.badge ? ' ('+o.badge+')' : ''}</span>`).join('')}</div>
  </div>` : ''}

  ${arrest.description ? `
  <div class="section">
    <div class="section-title">Note Aggiuntive</div>
    <div class="text-block">${arrest.description}</div>
  </div>` : ''}

  <div class="signature-area">
    <div><div class="sig-line">Firma Agente Responsabile</div></div>
    <div><div class="sig-line">Firma Superiore / Controfirma</div></div>
  </div>

  <div class="disclaimer">
    <div class="disclaimer-title">⚠ Avviso — Server Roleplay</div>
    <div class="disclaimer-text">
      Il presente documento è generato nell'ambito di un server di gioco di ruolo (FiveM Roleplay) a scopo puramente ludico e ricreativo.
      Tutti i dati, i nomi, gli eventi e le informazioni contenute in questo verbale sono fittizi e non hanno alcun valore legale, giuridico o amministrativo nella realtà.
      Qualsiasi riferimento a persone, luoghi o fatti reali è del tutto casuale e non intenzionale.
      Questo documento non costituisce un atto ufficiale di nessuna autorità pubblica o privata.
    </div>
  </div>

  <div class="footer">
    <span>DatabaseFDO — Sistema Gestionale Forze dell'Ordine</span>
    <span>Generato il ${new Date().toLocaleString('it-IT')}</span>
  </div>

</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };
  
  return (
    <MainLayout>
      {/* Dialogo di conferma per l'eliminazione */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-police-blue-dark dark:text-white mb-4">
              Conferma eliminazione
            </h2>
            <p className="text-police-gray-dark dark:text-gray-300 mb-6">
              Sei sicuro di voler eliminare questo arresto? Questa azione non può essere annullata.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleting(false)}
              >
                Annulla
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteArrest}
              >
                Elimina
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Link href="/arrests" className="mr-4">
              <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Torna agli arresti
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Dettagli Arresto #{arrestId}
            </h1>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <Button
              variant="outline"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Stampa
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Arrest Info */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Informazioni Arresto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Data arresto</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{formattedDate}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Ora arresto</div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{formattedTime}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Luogo arresto</div>
                  {isEditing && editForm ? (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                      <input
                        type="text"
                        name="location"
                        value={editForm.location}
                        onChange={handleInputChange}
                        className="flex-1 p-1 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                        placeholder="Inserisci il luogo dell'arresto"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                      <span className="font-medium dark:text-police-text-light">{arrest.location}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Dipartimento</div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{arrest.department || 'Non specificato'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Agente responsabile</div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-police-blue-dark dark:text-blue-400" />
                    <span className="font-medium dark:text-police-text-light">{officerFullName}</span>
                  </div>
                  {arrest.officer && (
                    <div className="text-xs text-police-gray-dark dark:text-police-text-muted mt-1 ml-6">
                      {arrest.officer.badge} • {arrest.officer.department || 'Polizia'}
                    </div>
                  )}
                </div>

                {arrest.signingOfficers && (
                  <div>
                    <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-2">Operatori firmatari</div>
                    <div className="bg-police-gray-light dark:bg-gray-700 rounded-md p-2 max-h-32 overflow-y-auto">
                      {Array.isArray(JSON.parse(arrest.signingOfficers)) ? (
                        JSON.parse(arrest.signingOfficers).map((officer: any, index: number) => (
                          <div key={`signing-officer-${index}`} className="flex items-center py-1 border-b last:border-b-0 border-police-gray-dark/20 dark:border-gray-600">
                            <User className="h-3 w-3 mr-2 text-police-blue-dark dark:text-blue-400" />
                            <span className="text-sm dark:text-police-text-light">{officer.name}</span>
                            {officer.badge && (
                              <span className="ml-1 text-xs text-police-gray-dark dark:text-gray-400">({officer.badge})</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-police-gray-dark dark:text-gray-400 p-1">Nessun operatore firmatario</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description and new fields */}
            <div className="mt-6">
              <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Descrizione Accaduti</div>
              <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                <p className="text-police-gray-dark dark:text-police-text-muted">
                  {arrest.incidentDescription || 'Nessuna descrizione degli accaduti disponibile'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Oggetti Sequestrati</div>
              <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                <p className="text-police-gray-dark dark:text-police-text-muted">
                  {arrest.seizedItems || 'Nessun oggetto sequestrato'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Note aggiuntive</div>
              {isEditing && editForm ? (
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                  rows={3}
                  placeholder="Descrivi i dettagli dell'arresto"
                />
              ) : (
                <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                  <p className="text-police-gray-dark dark:text-police-text-muted">
                    {arrest.description || 'Nessuna nota disponibile'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Sentenza e Multa */}
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <Euro className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
              Sentenza e Multa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pena detentiva */}
              <div>
                <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Pena detentiva</div>
                {isEditing && editForm ? (
                  <input
                    type="text"
                    name="sentence"
                    value={editForm.sentence}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                    placeholder="Es. 2 anni e 6 mesi"
                  />
                ) : (
                  <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                    <p className="text-police-gray-dark dark:text-police-text-muted">
                      {arrest.sentence || 'Nessuna pena detentiva specificata'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Multa */}
              <div>
                <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Multa (€)</div>
                {isEditing && editForm ? (
                  <input
                    type="number"
                    name="fine"
                    value={editForm.fine}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                    placeholder="Es. 1000"
                    min="0"
                  />
                ) : (
                  <div className="p-3 bg-police-gray-light dark:bg-gray-700 rounded-md">
                    <p className="text-police-gray-dark dark:text-police-text-muted">
                      {arrest.fine ? `€ ${arrest.fine}` : 'Nessuna multa specificata'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Crimes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-police-accent-red dark:text-red-400" />
                Reati Contestati
              </h2>
              {!isEditing && chargesList.length > 0 && (
                <span className="text-xs font-medium px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                  {chargesList.length} {chargesList.length === 1 ? 'reato' : 'reati'}
                </span>
              )}
            </div>

            {isEditing && editForm ? (
              <div>
                <div className="mb-2 text-sm text-police-gray-dark dark:text-police-text-muted">
                  Inserisci i reati separati da virgole
                </div>
                <textarea
                  name="charges"
                  value={editForm.charges}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-police-gray dark:border-gray-600 rounded-md text-police-blue-dark dark:text-police-text-light"
                  rows={3}
                  placeholder="Es. Furto, Rapina, Guida in stato di ebbrezza"
                />
              </div>
            ) : chargesList.length > 0 ? (
              <div className="space-y-2">
                {chargesList.map((charge: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-police-gray-light dark:bg-gray-700/50 rounded-lg border-l-4 border-police-accent-red dark:border-red-500"
                  >
                    <span className="text-xs font-bold text-police-accent-red dark:text-red-400 w-5 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-police-blue-dark dark:text-police-text-light text-sm">
                      {charge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-police-gray-dark dark:text-gray-400 text-sm">
                Nessun reato registrato per questo arresto
              </div>
            )}

            {/* Accomplices section */}
            {arrest.accomplices && (() => {
              let accompliceList: any[] = [];
              try { accompliceList = JSON.parse(arrest.accomplices || '[]'); } catch {}
              if (!Array.isArray(accompliceList) || accompliceList.length === 0) return null;
              return (
                <div className="mt-6 pt-4 border-t border-police-gray dark:border-gray-600">
                  <h3 className="font-semibold text-police-blue-dark dark:text-police-text-light mb-3 flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-police-accent-red dark:text-red-400" />
                    Complici
                    <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                      {accompliceList.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {accompliceList.map((accomplice: any, index: number) => (
                      <div
                        key={`accomplice-${index}`}
                        className="flex items-center justify-between p-3 bg-police-gray-light dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-police-gray dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-police-blue-dark dark:text-police-text-muted" />
                          </div>
                          <div>
                            <div className="font-medium text-sm dark:text-police-text-light">{accomplice.name}</div>
                            <div className="text-xs text-police-gray-dark dark:text-gray-400">
                              {accomplice.birthDate || 'Data di nascita non disponibile'}
                            </div>
                          </div>
                        </div>
                        <Link href={`/citizens/${getCitizenRouteRef(accomplice)}`}>
                          <Button variant="outline" size="sm">Profilo</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
        
        {/* Citizen information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light flex items-center">
                <User className="h-5 w-5 mr-2 text-police-blue dark:text-blue-400" />
                Informazioni Cittadino
              </h2>
              
              {arrest.citizen && (
                <Link href={`/citizens/${getCitizenRouteRef(arrest.citizen)}`}>
                  <Button variant="outline" size="sm">
                    Profilo completo
                  </Button>
                </Link>
              )}
            </div>
            
            {arrest.citizen ? (
              <>
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-police-gray-light dark:bg-gray-700 flex items-center justify-center overflow-hidden mr-4">
                    <span className="text-2xl font-bold text-police-blue dark:text-blue-400">
                      {arrest.citizen.firstname[0]}{arrest.citizen.lastname[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light">
                      {citizenName}
                    </h3>
                    <div className="flex items-center text-sm text-police-gray-dark dark:text-police-text-muted">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>Nato il {citizenBirthDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 border-t border-police-gray dark:border-gray-700 pt-4">
                  <div>
                    <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Nazionalità</div>
                    <div className="font-medium dark:text-police-text-light">
                      {arrest.citizen.nationality || 'Non specificata'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-police-gray-dark dark:text-police-text-muted mb-1">Sesso</div>
                    <div className="font-medium dark:text-police-text-light">
                      {arrest.citizen.sex || 'Non specificato'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-4 text-police-gray-dark dark:text-gray-300">
                Informazioni sul cittadino non disponibili
              </div>
            )}
          </Card>
          
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Azioni
            </h2>
            
            <div className="flex flex-col gap-3">
              {isEditing ? (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Save className="h-4 w-4" />}
                    onClick={handleUpdateArrest}
                    disabled={isSaving}
                  >
                    {isSaving ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    fullWidth
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={() => {
                      setIsEditing(false);
                      // Ripristina il form con i dati originali
                      setEditForm({
                        location: arrest.location,
                        description: arrest.description,
                        charges: arrest.charges,
                        sentence: arrest.sentence || '',
                        fine: arrest.fine ? arrest.fine.toString() : '',
                        incidentDescription: arrest.incidentDescription || '',
                        seizedItems: arrest.seizedItems || '',
                        department: arrest.department || 'Non specificato'
                      });
                    }}
                    disabled={isSaving}
                  >
                    Annulla
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Edit className="h-4 w-4" />}
                    onClick={() => setIsEditing(true)}
                  >
                    Modifica Arresto
                  </Button>
                  
                  {canDeleteArrest && (
                    <Button
                      variant="danger"
                      fullWidth
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setIsDeleting(true)}
                    >
                      Elimina Arresto
                    </Button>
                  )}
                  
                  <Link href="/arrests">
                    <Button
                      variant="secondary"
                      fullWidth
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Torna alla lista
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}


