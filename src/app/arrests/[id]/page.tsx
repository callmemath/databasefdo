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
  
  const handlePrint = () => {
    const accomplices = (() => {
      try { return JSON.parse(arrest.accomplices || '[]'); } catch { return []; }
    })();
    const signingOfficers = (() => {
      try { return JSON.parse(arrest.signingOfficers || '[]'); } catch { return []; }
    })();

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <title>Verbale di Arresto #${arrestId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 11pt; color: #1a1a2e; background: #f0f2f5; }
    .page { max-width: 800px; margin: 32px auto; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.12); border-radius: 8px; overflow: hidden; }

    /* Header */
    .header { background: linear-gradient(135deg, #1a237e 0%, #283593 60%, #1565c0 100%); color: #fff; padding: 32px 40px 28px; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,.06); }
    .header::after { content: ''; position: absolute; bottom: -60px; right: 60px; width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,.04); }
    .header-top { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
    .badge-icon { width: 56px; height: 56px; background: rgba(255,255,255,.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; border: 2px solid rgba(255,255,255,.3); }
    .header-dept { font-size: 9pt; letter-spacing: 2px; text-transform: uppercase; opacity: .75; margin-bottom: 4px; }
    .header-title { font-size: 22pt; font-weight: 700; letter-spacing: -0.5px; }
    .header-sub { font-size: 11pt; opacity: .8; margin-top: 2px; }
    .header-meta { display: flex; gap: 24px; flex-wrap: wrap; }
    .header-chip { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); border-radius: 20px; padding: 4px 14px; font-size: 9pt; letter-spacing: .5px; }

    /* Status banner */
    .status-bar { background: #e8f5e9; border-left: 5px solid #2e7d32; padding: 10px 40px; font-size: 10pt; color: #1b5e20; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #2e7d32; flex-shrink: 0; }

    /* Body */
    .body { padding: 32px 40px; }

    /* Section */
    .section { margin-bottom: 28px; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .section-icon { width: 28px; height: 28px; border-radius: 6px; background: #1a237e; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; flex-shrink: 0; }
    .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a237e; }
    .section-divider { flex: 1; height: 1px; background: linear-gradient(to right, #c5cae9, transparent); }

    /* Info card */
    .info-card { background: #f8f9fc; border: 1px solid #e8eaf6; border-radius: 8px; padding: 18px 20px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 32px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px 16px; }
    .field .label { font-size: 8pt; color: #7986cb; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 3px; }
    .field .value { font-size: 11pt; font-weight: 600; color: #1a1a2e; }
    .field .value.mono { font-family: 'Courier New', monospace; font-size: 10pt; }

    /* Citizen highlight */
    .citizen-card { background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%); border: 1px solid #c5cae9; border-radius: 8px; padding: 18px 20px; display: flex; align-items: center; gap: 16px; }
    .citizen-avatar { width: 50px; height: 50px; border-radius: 50%; background: #1a237e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18pt; font-weight: 700; flex-shrink: 0; }
    .citizen-name { font-size: 15pt; font-weight: 700; color: #1a237e; }
    .citizen-meta { font-size: 9pt; color: #555; margin-top: 2px; }

    /* Charges */
    .charge-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 6px; margin-bottom: 6px; background: #fff; border: 1px solid #e0e0e0; }
    .charge-item:nth-child(odd) { background: #fafafa; }
    .charge-num { width: 24px; height: 24px; border-radius: 50%; background: #c62828; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 700; flex-shrink: 0; }
    .charge-text { font-size: 11pt; color: #1a1a2e; font-weight: 500; }

    /* Sentence chips */
    .sentence-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .sentence-chip { padding: 10px 20px; border-radius: 8px; text-align: center; flex: 1; min-width: 160px; }
    .sentence-chip.prison { background: #fce4ec; border: 1px solid #f48fb1; }
    .sentence-chip.fine { background: #fff8e1; border: 1px solid #ffe082; }
    .sentence-chip .chip-label { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .sentence-chip .chip-value { font-size: 14pt; font-weight: 700; color: #1a1a2e; }

    /* Text block */
    .text-block { background: #f8f9fc; border: 1px solid #e8eaf6; border-left: 4px solid #7986cb; border-radius: 0 6px 6px 0; padding: 12px 16px; font-size: 11pt; line-height: 1.6; color: #333; white-space: pre-wrap; }

    /* Person rows */
    .person-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; margin-bottom: 4px; background: #f8f9fc; border: 1px solid #e8eaf6; }
    .person-initial { width: 30px; height: 30px; border-radius: 50%; background: #3949ab; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11pt; font-weight: 700; flex-shrink: 0; }
    .person-name { font-weight: 600; font-size: 11pt; flex: 1; }
    .person-meta { font-size: 9pt; color: #888; }

    /* Footer / signatures */
    .footer { margin-top: 40px; padding-top: 24px; border-top: 2px solid #e8eaf6; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .signature-box { text-align: center; padding: 0 20px; }
    .signature-role { font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
    .signature-name { font-size: 10pt; font-weight: 600; color: #333; margin-bottom: 40px; }
    .signature-line { border-bottom: 1px solid #aaa; padding-top: 10px; }

    /* Doc meta */
    .doc-meta { background: #f8f9fc; border-top: 1px solid #e8eaf6; padding: 12px 40px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #999; }
    .doc-meta .confidential { font-weight: 700; color: #c62828; letter-spacing: 1px; text-transform: uppercase; }

    @media print {
      body { background: #fff; }
      .page { box-shadow: none; margin: 0; border-radius: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="badge-icon">⚖️</div>
      <div>
        <div class="header-dept">${arrest.department || 'Forze dell\'Ordine'}</div>
        <div class="header-title">Verbale di Arresto</div>
        <div class="header-sub">Documento Ufficiale — Uso Riservato</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="header-chip">📋 Pratica N° ${arrestId}</div>
      <div class="header-chip">📅 ${formattedDate}</div>
      <div class="header-chip">🕐 ${formattedTime}</div>
      <div class="header-chip">🏛️ ${arrest.department || 'N/D'}</div>
    </div>
  </div>

  <div class="status-bar">
    <div class="status-dot"></div>
    Documento redatto in data ${formattedDate} da ${officerFullName} — ${arrest.officer?.badge ?? 'N/D'}
  </div>

  <div class="body">

    <div class="section">
      <div class="section-header">
        <div class="section-icon">👤</div>
        <div class="section-title">Soggetto Arrestato</div>
        <div class="section-divider"></div>
      </div>
      <div class="citizen-card">
        <div class="citizen-avatar">${(arrest.citizen?.firstname?.[0] ?? '?')}${(arrest.citizen?.lastname?.[0] ?? '')}</div>
        <div>
          <div class="citizen-name">${citizenName}</div>
          <div class="citizen-meta">
            Nato il ${citizenBirthDate}
            ${arrest.citizen?.sex ? ` &nbsp;·&nbsp; ${arrest.citizen.sex}` : ''}
            ${arrest.citizen?.nationality ? ` &nbsp;·&nbsp; ${arrest.citizen.nationality}` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔒</div>
        <div class="section-title">Dati Arresto</div>
        <div class="section-divider"></div>
      </div>
      <div class="info-card">
        <div class="grid-2">
          <div class="field">
            <div class="label">Data e Ora</div>
            <div class="value">${formattedDate} — ${formattedTime}</div>
          </div>
          <div class="field">
            <div class="label">Luogo</div>
            <div class="value">${arrest.location || 'N/D'}</div>
          </div>
          <div class="field">
            <div class="label">Dipartimento</div>
            <div class="value">${arrest.department || 'Non specificato'}</div>
          </div>
          <div class="field">
            <div class="label">Agente Responsabile</div>
            <div class="value">${arrest.officer?.rank ?? ''} ${officerFullName}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#c62828">⚠️</div>
        <div class="section-title">Reati Contestati</div>
        <div class="section-divider"></div>
      </div>
      ${chargesList.length > 0
        ? chargesList.map((c: string, i: number) => `
          <div class="charge-item">
            <div class="charge-num">${i + 1}</div>
            <div class="charge-text">${c}</div>
          </div>`).join('')
        : '<p style="color:#999;padding:12px 0">Nessun reato registrato</p>'}
    </div>

    ${arrest.sentence || arrest.fine ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#4a148c">⚖️</div>
        <div class="section-title">Sentenza</div>
        <div class="section-divider"></div>
      </div>
      <div class="sentence-row">
        ${arrest.sentence ? `
        <div class="sentence-chip prison">
          <div class="chip-label">Pena Detentiva</div>
          <div class="chip-value">${arrest.sentence}</div>
        </div>` : ''}
        ${arrest.fine ? `
        <div class="sentence-chip fine">
          <div class="chip-label">Multa</div>
          <div class="chip-value">€ ${arrest.fine}</div>
        </div>` : ''}
      </div>
    </div>` : ''}

    ${arrest.incidentDescription ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📝</div>
        <div class="section-title">Descrizione Accaduti</div>
        <div class="section-divider"></div>
      </div>
      <div class="text-block">${arrest.incidentDescription}</div>
    </div>` : ''}

    ${arrest.seizedItems ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📦</div>
        <div class="section-title">Oggetti Sequestrati</div>
        <div class="section-divider"></div>
      </div>
      <div class="text-block">${arrest.seizedItems}</div>
    </div>` : ''}

    ${arrest.description ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🗒️</div>
        <div class="section-title">Note Aggiuntive</div>
        <div class="section-divider"></div>
      </div>
      <div class="text-block">${arrest.description}</div>
    </div>` : ''}

    ${accomplices.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#e65100">👥</div>
        <div class="section-title">Complici (${accomplices.length})</div>
        <div class="section-divider"></div>
      </div>
      ${accomplices.map((a: any) => `
        <div class="person-row">
          <div class="person-initial">${(a.name?.[0] ?? '?').toUpperCase()}</div>
          <div class="person-name">${a.name || 'N/D'}</div>
          <div class="person-meta">${a.birthDate || ''}</div>
        </div>`).join('')}
    </div>` : ''}

    ${signingOfficers.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🪪</div>
        <div class="section-title">Operatori Firmatari</div>
        <div class="section-divider"></div>
      </div>
      ${signingOfficers.map((o: any) => `
        <div class="person-row">
          <div class="person-initial">${(o.name?.[0] ?? '?').toUpperCase()}</div>
          <div class="person-name">${o.name || 'N/D'}</div>
          <div class="person-meta">${o.badge ? 'Badge: ' + o.badge : ''}</div>
        </div>`).join('')}
    </div>` : ''}

    <div class="footer">
      <div class="signature-box">
        <div class="signature-role">Agente Responsabile</div>
        <div class="signature-name">${arrest.officer?.rank ?? ''} ${officerFullName}<br><span style="font-size:9pt;color:#888">${arrest.officer?.badge ?? ''} — ${arrest.officer?.department ?? ''}</span></div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-box">
        <div class="signature-role">Comandante / Responsabile</div>
        <div class="signature-name">&nbsp;</div>
        <div class="signature-line"></div>
      </div>
    </div>

  </div><!-- /body -->

  <div class="doc-meta">
    <span class="confidential">🔒 Riservato</span>
    <span>Arresto #${arrestId} &nbsp;·&nbsp; Generato il ${new Date().toLocaleString('it-IT')}</span>
  </div>
</div><!-- /page -->

  <div class="meta">Documento generato il ${new Date().toLocaleString('it-IT')} &nbsp;|&nbsp; Arresto #${arrestId}</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
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


