'use client';

import React, { useState, useEffect } from 'react';
import { Check, Plus, Save, Trash2, Edit, X, Lock, Settings, FileText, Shield, Globe, Bell, LayoutList, Briefcase } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { DEPARTMENTS, RANKS, PermissionRule, RolesConfig, RankConfig, buildDefaultRolesConfig } from '@/lib/permissions';
import { usePermissions } from '@/contexts/PermissionsContext';
import type { RouteRulesMap } from '@/contexts/PermissionsContext';

interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

// Password per accedere alla pagina di configurazione
const CONFIG_PASSWORD = 'admin123'; // In produzione, questa dovrebbe essere una variabile d'ambiente

export default function ConfigPage() {
  // Stato per la protezione con password
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Funzione per verificare la password
  const verifyPassword = () => {
    if (password === CONFIG_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      // Salva un token nel localStorage per mantenere l'accesso
      localStorage.setItem('config_auth_token', Date.now().toString());
    } else {
      setPasswordError('Password non valida');
    }
  };
  
  // Controlla se l'utente è già autenticato dal localStorage
  useEffect(() => {
    const authToken = localStorage.getItem('config_auth_token');
    if (authToken) {
      // Si potrebbe aggiungere una verifica di scadenza qui
      setIsAuthenticated(true);
    }
  }, []);
  
  // Funzione per disconnettersi
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('config_auth_token');
  };
  // Categorie per i report
  const [reportCategories, setReportCategories] = useState<ConfigCategory[]>([
    { id: 'furto', name: 'Furto', description: 'Denuncia di furto', color: 'blue' },
    { id: 'aggressione', name: 'Aggressione', description: 'Denuncia di aggressione', color: 'red' },
    { id: 'danneggiamento', name: 'Danneggiamento', description: 'Denuncia di danneggiamento', color: 'yellow' },
    { id: 'minaccia', name: 'Minaccia', description: 'Denuncia di minaccia', color: 'purple' },
  ]);
  
  // Categorie per i dipartimenti
  const [departments, setDepartments] = useState<ConfigCategory[]>([
    { id: 'polizia', name: 'Polizia', description: 'Polizia di Stato', color: 'blue' },
    { id: 'carabinieri', name: 'Carabinieri', description: 'Arma dei Carabinieri', color: 'blue' },
    { id: 'administration', name: 'Administration', description: 'Amministrazione', color: 'gray' },
    { id: 'lspd', name: 'LSPD', description: 'Los Santos Police Department', color: 'blue' },
  ]);


  
  // Categorie selezionate attualmente
  const [activeTab, setActiveTab] = useState<'reports' | 'permissions' | 'roles'>('reports');
  
  // Stato per i permessi di accesso alle sezioni
  const { rules: contextRules, reload: reloadPermissions } = usePermissions();
  const [permRules, setPermRules] = useState<RouteRulesMap>({});
  const [permSaving, setPermSaving] = useState(false);
  const [permSaved, setPermSaved] = useState(false);

  // Sezioni configurabili (path → etichetta)
  const CONFIGURABLE_SECTIONS: Record<string, string> = {
    '/arrests': 'Arresti',
    '/citizens': 'Cittadini',
    '/reports': 'Denunce',
    '/wanted': 'Ricercati',
    '/weapon-licenses': 'Porto d\'armi',
    '/operators': 'Operatori',
    '/codes': 'Codici',
  };

  // Stato per la nuova regola da aggiungere
  const [selectedSection, setSelectedSection] = useState<string>('/arrests');
  const [newRuleDeptId, setNewRuleDeptId] = useState<number>(1);
  const [newRuleMinRankId, setNewRuleMinRankId] = useState<number>(1);

  // Stato per la configurazione ruoli Discord
  const [rolesConfig, setRolesConfig] = useState<RolesConfig>(buildDefaultRolesConfig());
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesSaved, setRolesSaved] = useState(false);
  const [editingDeptNames, setEditingDeptNames] = useState<Record<string, string>>({});
  const [newRankPerDept, setNewRankPerDept] = useState<Record<string, { rank_name: string; role_id: number }>>({});
  const [newDept, setNewDept] = useState({ name: '', deptId: '' });
  
  // Stato per la modifica
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<ConfigCategory | null>(null);
  const [newItem, setNewItem] = useState<Partial<ConfigCategory>>({
    name: '',
    description: '',
    color: 'blue'
  });
  
  // Colori disponibili per le categorie
  const availableColors = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'yellow', class: 'bg-yellow-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'gray', class: 'bg-gray-500' },
    { name: 'gold', class: 'bg-yellow-600' },
  ];
  
  // Funzione per generare un ID unico
  const generateId = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
  };
  
  // Gestione dell'aggiunta di nuove categorie
  const handleAddItem = () => {
    if (!newItem.name) return;
    
    const item: ConfigCategory = {
      id: generateId(newItem.name),
      name: newItem.name,
      description: newItem.description || '',
      color: newItem.color || 'blue',
    };
    
    if (activeTab === 'reports') {
      setReportCategories([...reportCategories, item]);
    }
    
    // Resetta il form
    setNewItem({
      name: '',
      description: '',
      color: 'blue'
    });
    setIsEditing(false);
  };
  
  // Gestione dell'eliminazione di categorie
  const handleDeleteItem = (id: string) => {
    if (activeTab === 'reports') {
      setReportCategories(reportCategories.filter(item => item.id !== id));
    }
  };
  
  // Gestione dell'avvio della modifica di una categoria esistente
  const handleStartEdit = (item: ConfigCategory) => {
    setEditItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      color: item.color
    });
    setIsEditing(true);
  };
  
  // Gestione del salvataggio della modifica
  const handleSaveEdit = () => {
    if (!editItem || !newItem.name) return;
    
    const updatedItem: ConfigCategory = {
      id: editItem.id,
      name: newItem.name,
      description: newItem.description || '',
      color: newItem.color || 'blue',
    };
    
    if (activeTab === 'reports') {
      setReportCategories(reportCategories.map(item => 
        item.id === editItem.id ? updatedItem : item
      ));
    }
    
    // Resetta il form
    setNewItem({
      name: '',
      description: '',
      color: 'blue'
    });
    setEditItem(null);
    setIsEditing(false);
  };
  
  // Gestione dell'annullamento della modifica
  const handleCancelEdit = () => {
    setNewItem({
      name: '',
      description: '',
      color: 'blue'
    });
    setEditItem(null);
    setIsEditing(false);
  };
  
  // Sincronizza permRules con le regole caricate dal contesto
  useEffect(() => {
    setPermRules({ ...contextRules });
  }, [contextRules]);

  // Salva le regole di permesso sul backend
  const handleSavePermissions = async () => {
    setPermSaving(true);
    try {
      const res = await fetch('/api/config/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: permRules }),
      });
      if (res.ok) {
        setPermSaved(true);
        reloadPermissions();
        setTimeout(() => setPermSaved(false), 3000);
      }
    } finally {
      setPermSaving(false);
    }
  };

  // Aggiunge una regola alla sezione selezionata
  const handleAddPermRule = () => {
    const existing = permRules[selectedSection] ?? [];
    const duplicate = existing.some(
      (r) => r.deptId === newRuleDeptId && r.minRankId === newRuleMinRankId
    );
    if (duplicate) return;
    setPermRules({
      ...permRules,
      [selectedSection]: [...existing, { deptId: newRuleDeptId, minRankId: newRuleMinRankId }],
    });
  };

  // Rimuove una regola dalla sezione
  const handleRemovePermRule = (section: string, index: number) => {
    const updated = (permRules[section] ?? []).filter((_, i) => i !== index);
    setPermRules({ ...permRules, [section]: updated });
  };

  // Carica la configurazione ruoli quando si apre il tab
  useEffect(() => {
    if (activeTab !== 'roles') return;
    setRolesLoading(true);
    fetch('/api/config/roles')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setRolesConfig(data); })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, [activeTab]);

  // Aggiorna un campo di un grado nella configurazione ruoli
  const handleRankFieldChange = (
    deptName: string,
    rankId: number,
    field: 'rank_name' | 'role_id',
    value: string | number
  ) => {
    setRolesConfig((prev) => ({
      ...prev,
      [deptName]: {
        ...prev[deptName],
        ranks: prev[deptName].ranks.map((r: RankConfig) =>
          r.rank_id === rankId ? { ...r, [field]: field === 'role_id' ? Number(value) : value } : r
        ),
      },
    }));
  };

  // Salva la configurazione ruoli
  const handleSaveRoles = async () => {
    setRolesSaving(true);
    try {
      const res = await fetch('/api/config/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rolesConfig),
      });
      if (res.ok) {
        setRolesSaved(true);
        setTimeout(() => setRolesSaved(false), 3000);
      }
    } finally {
      setRolesSaving(false);
    }
  };

  const handleDeptNameEdit = (oldName: string, value: string) => {
    setEditingDeptNames((prev) => ({ ...prev, [oldName]: value }));
  };
  const handleDeptNameBlur = (oldName: string) => {
    const newName = (editingDeptNames[oldName] ?? oldName).trim();
    setEditingDeptNames((prev) => { const r = { ...prev }; delete r[oldName]; return r; });
    if (!newName || newName === oldName) return;
    setRolesConfig((prev) => {
      const { [oldName]: data, ...rest } = prev;
      return { ...rest, [newName]: data };
    });
  };
  const handleDeptIdChange = (deptName: string, value: string) => {
    setRolesConfig((prev) => ({ ...prev, [deptName]: { ...prev[deptName], dept_id: Number(value) } }));
  };
  const handleDeleteDept = (deptName: string) => {
    setRolesConfig((prev) => { const { [deptName]: _, ...rest } = prev; return rest; });
  };
  const handleAddDept = () => {
    const name = newDept.name.trim();
    if (!name) return;
    const id = newDept.deptId ? Number(newDept.deptId) : Object.keys(rolesConfig).length + 1;
    setRolesConfig((prev) => ({ ...prev, [name]: { dept_id: id, ranks: [] } }));
    setNewDept({ name: '', deptId: '' });
  };
  const handleDeleteRank = (deptName: string, rankId: number) => {
    setRolesConfig((prev) => ({
      ...prev,
      [deptName]: {
        ...prev[deptName],
        ranks: prev[deptName].ranks.filter((r: RankConfig) => r.rank_id !== rankId),
      },
    }));
  };
  const handleAddRank = (deptName: string) => {
    const newRankData = newRankPerDept[deptName];
    if (!newRankData?.rank_name.trim()) return;
    const ranks = rolesConfig[deptName]?.ranks ?? [];
    const maxId = ranks.reduce((m: number, r: RankConfig) => Math.max(m, r.rank_id), 0);
    setRolesConfig((prev) => ({
      ...prev,
      [deptName]: {
        ...prev[deptName],
        ranks: [...ranks, { rank_id: maxId + 1, rank_name: newRankData.rank_name.trim(), role_id: newRankData.role_id ?? 0 }],
      },
    }));
    setNewRankPerDept((prev) => ({ ...prev, [deptName]: { rank_name: '', role_id: 0 } }));
  };

  // Salvataggio delle configurazioni in localStorage
  useEffect(() => {
    const saveConfig = () => {
      localStorage.setItem('fdo_report_categories', JSON.stringify(reportCategories));
    };
    
    saveConfig();
  }, [reportCategories]);
  
  // Caricamento delle configurazioni da localStorage all'avvio
  useEffect(() => {
    const loadConfig = () => {
      const savedReportCategories = localStorage.getItem('fdo_report_categories');
      
      if (savedReportCategories) {
        try {
          setReportCategories(JSON.parse(savedReportCategories));
        } catch (e) {
          console.error('Errore nel parsing delle categorie dei report:', e);
        }
      }
    };
    
    loadConfig();
  }, []);
  
  // Se l'utente non è autenticato, mostra il form di login
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen -mt-16">
          <Card className="w-full max-w-md p-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-police-blue-light flex items-center justify-center">
                <Lock className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-police-blue-dark dark:text-police-text-light mb-6">
              Accesso alla Configurazione
            </h1>
            
            <div className="space-y-4">
              <p className="text-center text-police-gray-dark dark:text-police-text-muted">
                Inserisci la password per accedere alle impostazioni di configurazione del sistema.
              </p>
              
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password di configurazione"
                  className="w-full px-3 py-2 border border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue"
                  onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                />
                
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {passwordError}
                  </p>
                )}
              </div>
              
              <Button
                variant="primary"
                fullWidth
                onClick={verifyPassword}
                leftIcon={<Lock className="h-4 w-4" />}
              >
                Accedi
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
            Configurazione
          </h1>
          <p className="mt-2 text-police-gray-dark dark:text-police-text-muted">
            Gestisci tutte le impostazioni del sistema.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={logout}
            leftIcon={<Lock className="h-4 w-4" />}
          >
            Esci
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex overflow-x-auto">
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                  ${activeTab === 'reports' 
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('reports')}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Categorie Denunce
                </div>
              </button>
              
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                  ${activeTab === 'permissions' 
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('permissions')}
              >
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Permessi Sezioni
                </div>
              </button>

              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                  ${activeTab === 'roles' 
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('roles')}
              >
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Dipartimenti
                </div>
              </button>
            </div>
          </div>
          
          {/* Contenuto basato sulla tab attiva */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Intestazione della tabella */}
              <div className="grid grid-cols-5 gap-4 mb-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-md font-medium text-sm text-police-gray-dark dark:text-police-text-muted">
                <div className="col-span-1">Nome</div>
                <div className="col-span-2">Descrizione</div>
                <div className="col-span-1">Colore</div>
                <div className="col-span-1 text-right">Azioni</div>
              </div>
              
              {/* Lista degli elementi */}
              <div className="space-y-2">
                {(activeTab === 'reports' 
                  ? reportCategories 
                  : departments
                ).map((item: ConfigCategory) => (
                  <div key={item.id} className="grid grid-cols-5 gap-4 items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="col-span-1 font-medium text-police-blue-dark dark:text-police-text-light">
                      {item.name}
                    </div>
                    <div className="col-span-2 text-sm text-police-gray-dark dark:text-police-text-muted">
                      {item.description}
                    </div>
                    <div className="col-span-1">
                      <Badge variant={item.color as any}>{item.color}</Badge>
                    </div>
                    <div className="col-span-1 flex justify-end space-x-2">
                      <button 
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-police-blue hover:bg-police-gray-light focus:outline-none"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Form di aggiunta/modifica */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="text-md font-medium mb-4 text-police-blue-dark dark:text-police-text-light">
                  {isEditing ? 'Modifica categoria' : 'Aggiungi nuova categoria'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                      placeholder="Nome categoria"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                      Descrizione
                    </label>
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                      placeholder="Descrizione categoria"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                    Colore
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setNewItem({...newItem, color: color.name})}
                        className={`w-8 h-8 rounded-full ${color.class} ${newItem.color === color.name ? 'ring-2 ring-offset-2 ring-police-blue' : ''}`}
                        title={color.name}
                      >
                        {newItem.color === color.name && (
                          <Check className="h-5 w-5 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  {isEditing ? (
                    <>
                      <Button 
                        variant="outline"
                        onClick={handleCancelEdit}
                        leftIcon={<X className="h-4 w-4" />}
                      >
                        Annulla
                      </Button>
                      <Button 
                        variant="primary"
                        onClick={handleSaveEdit}
                        leftIcon={<Save className="h-4 w-4" />}
                        disabled={!newItem.name}
                      >
                        Salva modifiche
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="primary"
                      onClick={handleAddItem}
                      leftIcon={<Plus className="h-4 w-4" />}
                      disabled={!newItem.name}
                    >
                      Aggiungi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Permessi Sezioni */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                Per ogni sezione puoi definire quali dipartimenti e gradi minimi possono accedere.
                Se non sono presenti regole, la sezione è accessibile a tutti gli utenti autenticati.
              </p>

              {Object.entries(CONFIGURABLE_SECTIONS).map(([path, label]) => {
                const sectionRules = permRules[path] ?? [];
                return (
                  <div key={path} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-police-blue-dark dark:text-police-text-light">
                        {label}
                        <span className="ml-2 text-xs text-gray-400 font-mono">{path}</span>
                      </h3>
                      {sectionRules.length === 0 && (
                        <Badge variant="green">Aperto a tutti</Badge>
                      )}
                    </div>

                    {sectionRules.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {sectionRules.map((rule, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 text-sm">
                            <span>
                              <span className="font-medium">{DEPARTMENTS[rule.deptId] ?? `Dept ${rule.deptId}`}</span>
                              {' — '}
                              grado min.{' '}
                              <span className="font-medium">
                                {RANKS[rule.deptId]?.[rule.minRankId] ?? rule.minRankId}
                              </span>
                              <span className="text-gray-400 ml-1">(rankId {rule.minRankId})</span>
                            </span>
                            <button
                              onClick={() => handleRemovePermRule(path, idx)}
                              className="ml-3 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Form aggiunta regola */}
              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 space-y-4">
                <h3 className="font-medium text-police-blue-dark dark:text-police-text-light">Aggiungi regola</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">Sezione</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                    >
                      {Object.entries(CONFIGURABLE_SECTIONS).map(([path, label]) => (
                        <option key={path} value={path}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">Dipartimento</label>
                    <select
                      value={newRuleDeptId}
                      onChange={(e) => { setNewRuleDeptId(Number(e.target.value)); setNewRuleMinRankId(1); }}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                    >
                      {Object.entries(DEPARTMENTS).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">Grado minimo</label>
                    <select
                      value={newRuleMinRankId}
                      onChange={(e) => setNewRuleMinRankId(Number(e.target.value))}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                    >
                      {Object.entries(RANKS[newRuleDeptId] ?? {}).map(([id, name]) => (
                        <option key={id} value={id}>{name} (rankId {id})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAddPermRule}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Aggiungi regola
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSavePermissions}
                  disabled={permSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {permSaved ? 'Salvato!' : permSaving ? 'Salvataggio...' : 'Salva permessi'}
                </Button>
              </div>
            </div>
          )}

          {/* Tab Dipartimenti */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                Gestisci i dipartimenti e i relativi gradi. Associa ogni grado al proprio ID ruolo Discord (0 = non configurato).
              </p>

              {rolesLoading ? (
                <div className="text-center py-8 text-gray-400">Caricamento...</div>
              ) : (
                <>
                  {Object.entries(rolesConfig).map(([deptName, deptData]) => (
                    <div key={deptName} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      {/* Header dipartimento */}
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
                        <input
                          type="text"
                          value={editingDeptNames[deptName] ?? deptName}
                          onChange={(e) => handleDeptNameEdit(deptName, e.target.value)}
                          onBlur={() => handleDeptNameBlur(deptName)}
                          className="font-semibold text-police-blue-dark dark:text-police-text-light bg-transparent border-b border-transparent hover:border-gray-400 focus:border-police-blue focus:outline-none flex-1"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">dept_id:</span>
                          <input
                            type="number"
                            value={deptData.dept_id}
                            onChange={(e) => handleDeptIdChange(deptName, e.target.value)}
                            className="w-14 text-xs font-mono text-center bg-transparent border border-gray-300 dark:border-gray-600 dark:text-police-text-light rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
                          />
                          <button
                            onClick={() => handleDeleteDept(deptName)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Elimina dipartimento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {/* Tabella gradi */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                              <th className="text-left px-4 py-2 text-police-gray-dark dark:text-police-text-muted font-medium w-14">ID</th>
                              <th className="text-left px-4 py-2 text-police-gray-dark dark:text-police-text-muted font-medium">Nome grado</th>
                              <th className="text-left px-4 py-2 text-police-gray-dark dark:text-police-text-muted font-medium w-48">Role ID Discord</th>
                              <th className="w-10 px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {deptData.ranks.map((rank: RankConfig) => (
                              <tr key={rank.rank_id} className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-2 text-gray-400 font-mono text-xs">{rank.rank_id}</td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={rank.rank_name}
                                    onChange={(e) => handleRankFieldChange(deptName, rank.rank_id, 'rank_name', e.target.value)}
                                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-police-blue dark:text-police-text-light focus:outline-none py-0.5"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={rank.role_id}
                                    onChange={(e) => handleRankFieldChange(deptName, rank.rank_id, 'role_id', e.target.value)}
                                    className="w-full font-mono text-xs bg-transparent border border-gray-200 dark:border-gray-600 dark:text-police-text-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-police-blue"
                                    min={0}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <button
                                    onClick={() => handleDeleteRank(deptName, rank.rank_id)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                    title="Elimina grado"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {/* Riga aggiungi grado */}
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                              <td className="px-4 py-2 text-gray-300 font-mono text-xs">+</td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  placeholder="Nome grado..."
                                  value={newRankPerDept[deptName]?.rank_name ?? ''}
                                  onChange={(e) => setNewRankPerDept((prev) => ({ ...prev, [deptName]: { ...prev[deptName] ?? { role_id: 0 }, rank_name: e.target.value } }))}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddRank(deptName)}
                                  className="w-full bg-transparent border-b border-dashed border-gray-300 dark:border-gray-500 focus:border-police-blue dark:text-police-text-light focus:outline-none py-0.5 text-sm placeholder-gray-400"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={newRankPerDept[deptName]?.role_id ?? 0}
                                  onChange={(e) => setNewRankPerDept((prev) => ({ ...prev, [deptName]: { ...prev[deptName] ?? { rank_name: '' }, role_id: Number(e.target.value) } }))}
                                  className="w-full font-mono text-xs bg-transparent border border-dashed border-gray-300 dark:border-gray-500 dark:text-police-text-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-police-blue"
                                  min={0}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <button
                                  onClick={() => handleAddRank(deptName)}
                                  className="p-1 text-gray-400 hover:text-green-500 rounded"
                                  title="Aggiungi grado"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Aggiungi dipartimento */}
                  <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="Nome dipartimento..."
                      value={newDept.name}
                      onChange={(e) => setNewDept((prev) => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                      className="flex-1 min-w-40 bg-transparent border-b border-gray-300 dark:border-gray-500 focus:border-police-blue dark:text-police-text-light focus:outline-none py-0.5 text-sm placeholder-gray-400"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-400">dept_id:</span>
                      <input
                        type="number"
                        placeholder="auto"
                        value={newDept.deptId}
                        onChange={(e) => setNewDept((prev) => ({ ...prev, deptId: e.target.value }))}
                        className="w-16 font-mono text-xs bg-transparent border border-gray-300 dark:border-gray-500 dark:text-police-text-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-police-blue"
                        min={1}
                      />
                    </div>
                    <button
                      onClick={handleAddDept}
                      className="flex items-center gap-1 text-sm text-police-blue hover:text-police-blue-dark font-medium px-3 py-1.5 border border-police-blue rounded-md hover:bg-police-blue/10 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Aggiungi dipartimento
                    </button>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveRoles}
                  disabled={rolesSaving || rolesLoading}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {rolesSaved ? 'Salvato!' : rolesSaving ? 'Salvataggio...' : 'Salva configurazione'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                Le modifiche vengono salvate automaticamente.
              </p>
              <Button
                variant="outline"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={() => {
                  alert('Configurazioni salvate con successo!');
                }}
              >
                Salva configurazioni
              </Button>
            </div>
          </div>
        </Card>
        
                  <Card>
          <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
            Anteprima
          </h2>
          
          <div className="space-y-4">
            {activeTab === 'reports' ? (
              <>
                <h3 className="text-md font-medium text-police-gray-dark dark:text-police-text-muted">
                  Categorie di denunce disponibili:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {reportCategories.map((category) => (
                    <Badge key={category.id} variant={category.color as any}>
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-police-gray-dark dark:text-police-text-muted">
                Seleziona una categoria per visualizzare l'anteprima
              </p>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
