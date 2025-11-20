'use client';

import React, { useState, useEffect } from 'react';
import { Check, Plus, Save, Trash2, Edit, X, Lock, Settings, FileText, Shield, Globe, Bell, LayoutList, Briefcase } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

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
  const [activeTab, setActiveTab] = useState<'reports' | 'departments'>('reports');
  
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
    } else if (activeTab === 'departments') {
      setDepartments([...departments, item]);
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
    } else if (activeTab === 'departments') {
      setDepartments(departments.filter(item => item.id !== id));
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
    } else if (activeTab === 'departments') {
      // Gestione speciale per i dipartimenti: traccia la mappatura quando cambia il nome
      const oldName = editItem.name;
      const newName = updatedItem.name;
      
      if (oldName !== newName) {
        // Salva la mappatura dal vecchio nome all'ID del reparto
        const departmentMappings = JSON.parse(localStorage.getItem('fdo_department_mappings') || '{}');
        departmentMappings[oldName] = updatedItem.id;
        localStorage.setItem('fdo_department_mappings', JSON.stringify(departmentMappings));
        
        // Visualizza una notifica all'utente
        alert(`Il nome del reparto è stato modificato da "${oldName}" a "${newName}". Gli utenti associati al reparto "${oldName}" saranno ora associati al reparto "${newName}".`);
      }
      
      setDepartments(departments.map(item => 
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
  
  // Salvataggio delle configurazioni in localStorage
  useEffect(() => {
    const saveConfig = () => {
      localStorage.setItem('fdo_report_categories', JSON.stringify(reportCategories));
      localStorage.setItem('fdo_departments', JSON.stringify(departments));
    };
    
    saveConfig();
  }, [reportCategories, departments]);
  
  // Caricamento delle configurazioni da localStorage all'avvio
  useEffect(() => {
    const loadConfig = () => {
      const savedReportCategories = localStorage.getItem('fdo_report_categories');
      const savedDepartments = localStorage.getItem('fdo_departments');
      
      if (savedReportCategories) {
        try {
          setReportCategories(JSON.parse(savedReportCategories));
        } catch (e) {
          console.error('Errore nel parsing delle categorie dei report:', e);
        }
      }
      
      if (savedDepartments) {
        try {
          setDepartments(JSON.parse(savedDepartments));
        } catch (e) {
          console.error('Errore nel parsing dei dipartimenti:', e);
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
                  ${activeTab === 'departments' 
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('departments')}
              >
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Dipartimenti
                </div>
              </button>
            </div>
          </div>
          
          {/* Contenuto basato sulla tab attiva */}
          {(
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
            ) : activeTab === 'departments' ? (
              <>
                <h3 className="text-md font-medium text-police-gray-dark dark:text-police-text-muted">
                  Dipartimenti disponibili:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {departments.map((department) => (
                    <Badge key={department.id} variant={department.color as any}>
                      {department.name}
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
