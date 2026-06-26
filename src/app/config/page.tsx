'use client';

import React, { useState, useEffect } from 'react';
import { Check, Plus, Save, Trash2, Edit, X, Lock, FileText, Shield, Briefcase, BookOpen, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import type { NormativeSectionsData } from '../api/normative/sections/route';
import { renderMarkdownContent } from '@/lib/normative-md';
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
  const [activeTab, setActiveTab] = useState<'reports' | 'permissions' | 'actions' | 'roles' | 'normative'>('reports');
  
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
    '/vat-registrations': 'Partita IVA',
    '/operators': 'Operatori',
    '/normative': 'Normative',
  };

  // Stato per la nuova regola da aggiungere
  const [selectedSection, setSelectedSection] = useState<string>('/arrests');
  const [selectedDeptName, setSelectedDeptName] = useState<string>('');
  const [newRuleDeptId, setNewRuleDeptId] = useState<number>(1);
  const [newRuleMinRankId, setNewRuleMinRankId] = useState<number>(1);

  // Stato per i permessi azioni UI
  const [actionRules, setActionRules] = useState<RouteRulesMap>({});
  const [actionSaving, setActionSaving] = useState(false);
  const [actionSaved, setActionSaved] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('delete_arrest');
  const [actionDeptName, setActionDeptName] = useState<string>('');
  const [actionDeptId, setActionDeptId] = useState<number>(1);
  const [actionMinRankId, setActionMinRankId] = useState<number>(1);

  const CONFIGURABLE_ACTIONS: Record<string, string> = {
    delete_arrest: 'Elimina Arresto',
  };

  // Stato per la configurazione ruoli Discord
  const [rolesConfig, setRolesConfig] = useState<RolesConfig>(buildDefaultRolesConfig());
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesSaved, setRolesSaved] = useState(false);
  const [editingDeptNames, setEditingDeptNames] = useState<Record<string, string>>({});
  const [newRankPerDept, setNewRankPerDept] = useState<Record<string, { rank_name: string; role_id: string }>>({});
  const [newDept, setNewDept] = useState({ name: '', deptId: '' });
  
  // ----- Stato per le Normative (CrimeCategory + Crime) -----
  interface CrimeCategoryData {
    id: string;
    name: string;
    color: string;
    order: number;
    sectionId?: string | null;
    crimes: CrimeData[];
  }
  interface CrimeData {
    id: string;
    name: string;
    description: string;
    sentence: string;
    fine: number;
    order: number;
    categoryId: string;
  }

  const [normCategories, setNormCategories] = useState<CrimeCategoryData[]>([]);
  const [normLoading, setNormLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Category form state
  const [catForm, setCatForm] = useState({ name: '', color: 'blue', sectionId: '' });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  // Crime form state
  const [crimeForm, setCrimeForm] = useState({ name: '', description: '', sentence: '', fine: '0' });
  const [editingCrimeId, setEditingCrimeId] = useState<string | null>(null);
  const [crimeSaving, setCrimeSaving] = useState(false);

  // ----- Stato per le Sezioni Statiche Normative -----
  const [normSections, setNormSections] = useState<NormativeSectionsData>({});
  const [normSectionsLoading, setNormSectionsLoading] = useState(false);
  const [normSectionsSaving, setNormSectionsSaving] = useState(false);
  const [normSectionsSaved, setNormSectionsSaved] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [staticSectionsOpen, setStaticSectionsOpen] = useState(true);

  // Load categories when normative tab is opened
  const loadNormCategories = async () => {
    setNormLoading(true);
    try {
      const res = await fetch('/api/crimes/categories');
      if (res.ok) {
        const data = await res.json();
        setNormCategories(data.categories ?? []);
      }
    } catch { /* silent */ }
    finally { setNormLoading(false); }
  };

  const loadNormSections = async () => {
    setNormSectionsLoading(true);
    try {
      const res = await fetch('/api/normative/sections');
      if (res.ok) {
        const data = await res.json();
        setNormSections(data.sections ?? {});
      }
    } catch { /* silent */ }
    finally { setNormSectionsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'normative') {
      if (normCategories.length === 0 && !normLoading) {
        loadNormCategories();
      }
      if (Object.keys(normSections).length === 0 && !normSectionsLoading) {
        loadNormSections();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSaveNormSections = async () => {
    setNormSectionsSaving(true);
    try {
      const res = await fetch('/api/normative/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: normSections }),
      });
      if (res.ok) {
        setNormSectionsSaved(true);
        setTimeout(() => setNormSectionsSaved(false), 2000);
      }
    } catch { /* silent */ }
    finally { setNormSectionsSaving(false); }
  };

  const generateSectionSlug = (title: string): string => {
    const base = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const slug = base || 'sezione';
    // ensure uniqueness
    if (!normSections[slug]) return slug;
    return `${slug}-${Date.now().toString().slice(-4)}`;
  };

  const handleAddSection = () => {
    const slug = generateSectionSlug('nuova-sezione');
    setNormSections((prev) => ({
      ...prev,
      [slug]: { title: 'Nuova Sezione', topics: [] },
    }));
    setExpandedSections((prev) => new Set([...prev, slug]));
    setSelectedSectionId(slug);
    setSelectedTopicIndex(null);
  };

  const handleDeleteSection = (id: string) => {
    if (!confirm('Eliminare questa sezione e tutti i suoi topic?')) return;
    setNormSections((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
      setSelectedTopicIndex(null);
    }
  };

  const handleMoveSectionUp = (id: string) => {
    const keys = Object.keys(normSections);
    const idx = keys.indexOf(id);
    if (idx <= 0) return;
    const newKeys = [...keys];
    [newKeys[idx - 1], newKeys[idx]] = [newKeys[idx], newKeys[idx - 1]];
    const reordered: NormativeSectionsData = {};
    for (const k of newKeys) reordered[k] = normSections[k];
    setNormSections(reordered);
  };

  const handleMoveSectionDown = (id: string) => {
    const keys = Object.keys(normSections);
    const idx = keys.indexOf(id);
    if (idx < 0 || idx >= keys.length - 1) return;
    const newKeys = [...keys];
    [newKeys[idx], newKeys[idx + 1]] = [newKeys[idx + 1], newKeys[idx]];
    const reordered: NormativeSectionsData = {};
    for (const k of newKeys) reordered[k] = normSections[k];
    setNormSections(reordered);
  };

  const handleAddTopic = (sectionId: string) => {
    setNormSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        topics: [...prev[sectionId].topics, { title: 'Nuovo Topic', content: '' }],
      },
    }));
    const newIdx = normSections[sectionId]?.topics.length ?? 0;
    setSelectedSectionId(sectionId);
    setSelectedTopicIndex(newIdx);
    setExpandedSections((prev) => new Set([...prev, sectionId]));
  };

  const handleDeleteTopic = (sectionId: string, topicIdx: number) => {
    if (!confirm('Eliminare questo topic?')) return;
    setNormSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        topics: prev[sectionId].topics.filter((_, i) => i !== topicIdx),
      },
    }));
    if (selectedSectionId === sectionId && selectedTopicIndex === topicIdx) {
      setSelectedTopicIndex(null);
    }
  };

  const handleMoveTopicUp = (sectionId: string, topicIdx: number) => {
    if (topicIdx <= 0) return;
    setNormSections((prev) => {
      const topics = [...prev[sectionId].topics];
      [topics[topicIdx - 1], topics[topicIdx]] = [topics[topicIdx], topics[topicIdx - 1]];
      return { ...prev, [sectionId]: { ...prev[sectionId], topics } };
    });
    if (selectedSectionId === sectionId && selectedTopicIndex === topicIdx) {
      setSelectedTopicIndex(topicIdx - 1);
    }
  };

  const handleMoveTopicDown = (sectionId: string, topicIdx: number) => {
    const topics = normSections[sectionId]?.topics ?? [];
    if (topicIdx >= topics.length - 1) return;
    setNormSections((prev) => {
      const t = [...prev[sectionId].topics];
      [t[topicIdx], t[topicIdx + 1]] = [t[topicIdx + 1], t[topicIdx]];
      return { ...prev, [sectionId]: { ...prev[sectionId], topics: t } };
    });
    if (selectedSectionId === sectionId && selectedTopicIndex === topicIdx) {
      setSelectedTopicIndex(topicIdx + 1);
    }
  };

  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    setNormSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], title },
    }));
  };

  const handleUpdateTopicTitle = (sectionId: string, topicIdx: number, title: string) => {
    setNormSections((prev) => {
      const topics = [...prev[sectionId].topics];
      topics[topicIdx] = { ...topics[topicIdx], title };
      return { ...prev, [sectionId]: { ...prev[sectionId], topics } };
    });
  };

  const handleUpdateTopicContent = (sectionId: string, topicIdx: number, content: string) => {
    setNormSections((prev) => {
      const topics = [...prev[sectionId].topics];
      topics[topicIdx] = { ...topics[topicIdx], content };
      return { ...prev, [sectionId]: { ...prev[sectionId], topics } };
    });
  };

  const selectedTopic =
    selectedSectionId !== null && selectedTopicIndex !== null
      ? normSections[selectedSectionId]?.topics[selectedTopicIndex] ?? null
      : null;

  const selectedCategory = normCategories.find((c) => c.id === selectedCategoryId) ?? null;

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    try {
      if (editingCatId) {
        const res = await fetch(`/api/crimes/categories/${editingCatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catForm.name.trim(), color: catForm.color, sectionId: catForm.sectionId || null }),
        });
        if (res.ok) {
          const data = await res.json();
          setNormCategories((prev) => prev.map((c) => (c.id === editingCatId ? data.category : c)));
          setEditingCatId(null);
          setCatForm({ name: '', color: 'blue', sectionId: '' });
        }
      } else {
        const res = await fetch('/api/crimes/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catForm.name.trim(), color: catForm.color, order: normCategories.length, sectionId: catForm.sectionId || null }),
        });
        if (res.ok) {
          const data = await res.json();
          setNormCategories((prev) => [...prev, data.category]);
          setCatForm({ name: '', color: 'blue', sectionId: '' });
        }
      }
    } catch { /* silent */ }
    finally { setCatSaving(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Eliminare questa categoria e tutti i reati collegati?')) return;
    try {
      const res = await fetch(`/api/crimes/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNormCategories((prev) => prev.filter((c) => c.id !== id));
        if (selectedCategoryId === id) setSelectedCategoryId(null);
      }
    } catch { /* silent */ }
  };

  const handleSaveCrime = async () => {
    if (!crimeForm.name.trim() || !crimeForm.sentence.trim() || !selectedCategoryId) return;
    setCrimeSaving(true);
    try {
      const payload = {
        name: crimeForm.name.trim(),
        description: crimeForm.description.trim(),
        sentence: crimeForm.sentence.trim(),
        fine: parseInt(crimeForm.fine) || 0,
        categoryId: selectedCategoryId,
        order: selectedCategory?.crimes.length ?? 0,
      };
      if (editingCrimeId) {
        const res = await fetch(`/api/crimes/${editingCrimeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setNormCategories((prev) =>
            prev.map((c) =>
              c.id === selectedCategoryId
                ? { ...c, crimes: c.crimes.map((cr) => (cr.id === editingCrimeId ? data.crime : cr)) }
                : c
            )
          );
          setEditingCrimeId(null);
          setCrimeForm({ name: '', description: '', sentence: '', fine: '0' });
        }
      } else {
        const res = await fetch('/api/crimes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setNormCategories((prev) =>
            prev.map((c) =>
              c.id === selectedCategoryId
                ? { ...c, crimes: [...c.crimes, data.crime] }
                : c
            )
          );
          setCrimeForm({ name: '', description: '', sentence: '', fine: '0' });
        }
      }
    } catch { /* silent */ }
    finally { setCrimeSaving(false); }
  };

  const handleDeleteCrime = async (id: string) => {
    if (!confirm('Eliminare questo reato?')) return;
    try {
      const res = await fetch(`/api/crimes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNormCategories((prev) =>
          prev.map((c) =>
            c.id === selectedCategoryId
              ? { ...c, crimes: c.crimes.filter((cr) => cr.id !== id) }
              : c
          )
        );
        if (editingCrimeId === id) {
          setEditingCrimeId(null);
          setCrimeForm({ name: '', description: '', sentence: '', fine: '0' });
        }
      }
    } catch { /* silent */ }
  };

  const normColorBadge: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  const normColorDot: Record<string, string> = {
    blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500',
    yellow: 'bg-yellow-500', purple: 'bg-purple-500', gray: 'bg-gray-500',
  };
  const normAvailableColors = ['blue', 'red', 'green', 'yellow', 'purple', 'gray'];

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

  // Carica la configurazione ruoli all'avvio (serve anche per i dropdown permessi)
  useEffect(() => {
    setRolesLoading(true);
    fetch('/api/config/roles')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setRolesConfig(data); })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, []);

  // Inizializza il dipartimento selezionato nel form permessi quando la config è caricata
  useEffect(() => {
    if (selectedDeptName || Object.keys(rolesConfig).length === 0) return;
    const firstName = Object.keys(rolesConfig)[0];
    setSelectedDeptName(firstName);
    setNewRuleDeptId(Number(rolesConfig[firstName]?.dept_id ?? 1));
  }, [rolesConfig]);

  // Inizializza il dipartimento selezionato nel form azioni
  useEffect(() => {
    if (actionDeptName || Object.keys(rolesConfig).length === 0) return;
    const firstName = Object.keys(rolesConfig)[0];
    setActionDeptName(firstName);
    setActionDeptId(Number(rolesConfig[firstName]?.dept_id ?? 1));
  }, [rolesConfig]);

  // Carica i permessi azioni
  useEffect(() => {
    fetch('/api/config/action-permissions')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.rules) {
          const coerced: RouteRulesMap = {};
          for (const [action, arr] of Object.entries(data.rules as RouteRulesMap)) {
            coerced[action] = (arr as PermissionRule[]).map((r) => ({
              deptId: Number(r.deptId),
              minRankId: Number(r.minRankId),
            }));
          }
          setActionRules(coerced);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveActionPermissions = async () => {
    setActionSaving(true);
    try {
      const res = await fetch('/api/config/action-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: actionRules }),
      });
      if (res.ok) {
        setActionSaved(true);
        setTimeout(() => setActionSaved(false), 3000);
      }
    } finally {
      setActionSaving(false);
    }
  };

  const handleAddActionRule = () => {
    const existing = actionRules[selectedAction] ?? [];
    const duplicate = existing.some(
      (r) => r.deptId === actionDeptId && r.minRankId === actionMinRankId
    );
    if (duplicate) return;
    setActionRules({
      ...actionRules,
      [selectedAction]: [...existing, { deptId: actionDeptId, minRankId: actionMinRankId }],
    });
  };

  const handleRemoveActionRule = (action: string, index: number) => {
    const updated = (actionRules[action] ?? []).filter((_, i) => i !== index);
    setActionRules({ ...actionRules, [action]: updated });
  };

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
          r.rank_id === rankId ? { ...r, [field]: value } : r
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

  // Helper: nome dipartimento da deptId (prova prima DEPARTMENTS, poi rolesConfig per indice)
  const getDeptDisplayName = (deptId: number): string => {
    if (DEPARTMENTS[deptId]) return DEPARTMENTS[deptId];
    return Object.keys(rolesConfig)[deptId - 1] ?? `Dept ${deptId}`;
  };

  // Helper: nome grado da deptId+rankId — prova prima rolesConfig, poi RANKS statico
  const getRankDisplayName = (deptId: number, rankId: number): string => {
    const deptName = getDeptDisplayName(deptId);
    const fromConfig = rolesConfig[deptName]?.ranks?.find((r: RankConfig) => r.rank_id === rankId)?.rank_name;
    if (fromConfig) return fromConfig;
    return RANKS[deptId]?.[rankId] ?? String(rankId);
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
    setRolesConfig((prev) => ({ ...prev, [deptName]: { ...prev[deptName], dept_id: value } }));
  };
  const handleDeleteDept = (deptName: string) => {
    setRolesConfig((prev) => { const { [deptName]: _, ...rest } = prev; return rest; });
  };
  const handleAddDept = () => {
    const name = newDept.name.trim();
    if (!name) return;
    const id = newDept.deptId.trim() || String(Object.keys(rolesConfig).length + 1);
    setRolesConfig((prev) => ({ ...prev, [name]: { dept_id: id, dept_role_id: '0', transfer_forum_id: null, ranks: [] } }));
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
        ranks: [...ranks, { rank_id: maxId + 1, rank_name: newRankData.rank_name.trim(), role_id: newRankData.role_id ?? '0' }],
      },
    }));
    setNewRankPerDept((prev) => ({ ...prev, [deptName]: { rank_name: '', role_id: '0' } }));
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
                  ${activeTab === 'actions'
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('actions')}
              >
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Permessi Azioni
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

              <button
                className={`py-3 px-4 border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap
                  ${activeTab === 'normative'
                    ? 'border-police-blue text-police-blue-dark dark:text-police-blue-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('normative')}
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Normative
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
                              <span className="font-medium">{getDeptDisplayName(rule.deptId)}</span>
                              {' — '}
                              grado min.{' '}
                              <span className="font-medium">
                                {getRankDisplayName(rule.deptId, rule.minRankId)}
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
                      value={selectedDeptName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedDeptName(name);
                        setNewRuleDeptId(Number(rolesConfig[name]?.dept_id ?? 1));
                        setNewRuleMinRankId(1);
                      }}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                    >
                      {Object.keys(rolesConfig).map((name) => (
                        <option key={name} value={name}>{name}</option>
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
                      {(rolesConfig[selectedDeptName]?.ranks ?? []).map((rank: RankConfig) => (
                        <option key={rank.rank_id} value={rank.rank_id}>{rank.rank_name} (rankId {rank.rank_id})</option>
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

          {/* Tab Permessi Azioni */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                Per ogni azione puoi definire quali dipartimenti e gradi minimi possono eseguirla.
                Se non sono presenti regole, l&apos;azione è disponibile a tutti gli utenti autenticati.
              </p>

              {Object.entries(CONFIGURABLE_ACTIONS).map(([actionKey, actionLabel]) => {
                const rules = actionRules[actionKey] ?? [];
                return (
                  <div key={actionKey} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-police-blue-dark dark:text-police-text-light">
                        {actionLabel}
                        <span className="ml-2 text-xs text-gray-400 font-mono">{actionKey}</span>
                      </h3>
                      {rules.length === 0 && (
                        <Badge variant="green">Visibile a tutti</Badge>
                      )}
                    </div>

                    {rules.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {rules.map((rule, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 text-sm">
                            <span>
                              <span className="font-medium">{getDeptDisplayName(rule.deptId)}</span>
                              {' — '}
                              grado min.{' '}
                              <span className="font-medium">
                                {getRankDisplayName(rule.deptId, rule.minRankId)}
                              </span>
                              <span className="text-gray-400 ml-1">(rankId {rule.minRankId})</span>
                            </span>
                            <button
                              onClick={() => handleRemoveActionRule(actionKey, idx)}
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

              {/* Form aggiunta regola azione */}
              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 space-y-4">
                <h3 className="font-medium text-police-blue-dark dark:text-police-text-light">Aggiungi regola</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">Azione</label>
                    <select
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                    >
                      {Object.entries(CONFIGURABLE_ACTIONS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">Dipartimento</label>
                    <select
                      value={actionDeptName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setActionDeptName(name);
                        setActionDeptId(Number(rolesConfig[name]?.dept_id ?? 1));
                        setActionMinRankId(1);
                      }}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                    >
                      {Object.keys(rolesConfig).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">Grado minimo</label>
                    <select
                      value={actionMinRankId}
                      onChange={(e) => setActionMinRankId(Number(e.target.value))}
                      className="form-input block w-full sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
                    >
                      {(rolesConfig[actionDeptName]?.ranks ?? []).map((rank: RankConfig) => (
                        <option key={rank.rank_id} value={rank.rank_id}>{rank.rank_name} (rankId {rank.rank_id})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAddActionRule}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Aggiungi regola
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveActionPermissions}
                  disabled={actionSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {actionSaved ? 'Salvato!' : actionSaving ? 'Salvataggio...' : 'Salva permessi azioni'}
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
                            type="text"
                            inputMode="numeric"
                            value={deptData.dept_id}
                            onChange={(e) => handleDeptIdChange(deptName, e.target.value)}
                            className="w-28 text-xs font-mono text-center bg-transparent border border-gray-300 dark:border-gray-600 dark:text-police-text-light rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
                          />
                          <span className="text-xs text-gray-400">role dept:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={deptData.dept_role_id ?? '0'}
                            onChange={(e) => setRolesConfig((prev) => ({ ...prev, [deptName]: { ...prev[deptName], dept_role_id: e.target.value } }))}
                            className="w-28 text-xs font-mono text-center bg-transparent border border-gray-300 dark:border-gray-600 dark:text-police-text-light rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
                          />
                          <span className="text-xs text-gray-400">forum trasf.:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="null"
                            value={deptData.transfer_forum_id ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setRolesConfig((prev) => ({ ...prev, [deptName]: { ...prev[deptName], transfer_forum_id: val || null } }));
                            }}
                            className="w-36 text-xs font-mono text-center bg-transparent border border-gray-300 dark:border-gray-600 dark:text-police-text-light rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
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
                                    className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-police-blue dark:text-police-text-light focus:outline-none rounded px-2 py-0.5"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={rank.role_id}
                                    onChange={(e) => handleRankFieldChange(deptName, rank.rank_id, 'role_id', e.target.value)}
                                    className="w-full font-mono text-xs bg-transparent border border-gray-200 dark:border-gray-600 dark:text-police-text-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-police-blue"
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
                                  onChange={(e) => setNewRankPerDept((prev) => ({ ...prev, [deptName]: { ...prev[deptName] ?? { role_id: '0' }, rank_name: e.target.value } }))}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddRank(deptName)}
                                  className="w-full bg-transparent border border-dashed border-gray-300 dark:border-gray-500 focus:border-police-blue dark:text-police-text-light focus:outline-none rounded px-2 py-0.5 text-sm placeholder-gray-400"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={newRankPerDept[deptName]?.role_id ?? '0'}
                                  onChange={(e) => setNewRankPerDept((prev) => ({ ...prev, [deptName]: { ...prev[deptName] ?? { rank_name: '' }, role_id: e.target.value } }))}
                                  className="w-full font-mono text-xs bg-transparent border border-dashed border-gray-300 dark:border-gray-500 dark:text-police-text-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-police-blue"
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
                        className="w-16 font-mono text-xs bg-transparent border border-gray-300 dark:border-gray-500 dark:text-police-text-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-police-blue [appearance:textfield]"
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

          {/* Tab Normative */}
          {activeTab === 'normative' && (
            <div className="space-y-6">
              <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                Gestisci le sezioni statiche e le categorie di reato.
              </p>

              {/* ── Sezioni Statiche ── */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Collapsible header */}
                <button
                  onClick={() => setStaticSectionsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                >
                  <div className="flex items-center gap-2 font-medium text-police-blue-dark dark:text-police-text-light">
                    <FileText className="h-4 w-4" />
                    Sezioni Statiche
                    <span className="text-xs font-normal text-gray-400">
                      ({Object.keys(normSections).length} sezioni)
                    </span>
                  </div>
                  {staticSectionsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {staticSectionsOpen && (
                  <div className="p-4">
                    {normSectionsLoading ? (
                      <div className="text-center py-6 text-gray-400 text-sm">Caricamento...</div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Left: section + topic tree */}
                        <div className="lg:col-span-2 space-y-1">
                          {Object.keys(normSections).length === 0 && (
                            <p className="text-sm text-gray-400 italic py-2">Nessuna sezione. Aggiungine una.</p>
                          )}
                          {Object.entries(normSections).map(([sectionId, section], sectionIdx) => {
                            const isExpanded = expandedSections.has(sectionId);
                            const sectionKeys = Object.keys(normSections);
                            return (
                              <div key={sectionId}>
                                {/* Section row */}
                                <div
                                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
                                    selectedSectionId === sectionId && selectedTopicIndex === null
                                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                                  }`}
                                  onClick={() => {
                                    setSelectedSectionId(sectionId);
                                    setSelectedTopicIndex(null);
                                    setExpandedSections((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(sectionId)) next.delete(sectionId);
                                      else next.add(sectionId);
                                      return next;
                                    });
                                  }}
                                >
                                  <span className="text-xs text-gray-400 mr-0.5">
                                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3 rotate-180" />}
                                  </span>
                                  <span className="flex-1 text-sm font-medium truncate">{section.title}</span>
                                  <span className="text-xs text-gray-400 shrink-0">{section.topics.length}</span>
                                  {/* reorder + delete */}
                                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMoveSectionUp(sectionId); }}
                                      disabled={sectionIdx === 0}
                                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                                      title="Sposta su"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMoveSectionDown(sectionId); }}
                                      disabled={sectionIdx === sectionKeys.length - 1}
                                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                                      title="Sposta giù"
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleAddTopic(sectionId); }}
                                      className="p-0.5 text-gray-400 hover:text-green-600"
                                      title="Aggiungi topic"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(sectionId); }}
                                      className="p-0.5 text-gray-400 hover:text-red-500"
                                      title="Elimina sezione"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </span>
                                </div>
                                {/* Topic rows */}
                                {isExpanded && section.topics.map((topic, topicIdx) => (
                                  <div
                                    key={topicIdx}
                                    onClick={() => { setSelectedSectionId(sectionId); setSelectedTopicIndex(topicIdx); }}
                                    className={`flex items-center gap-1 pl-6 pr-2 py-1 rounded-md cursor-pointer group transition-colors ${
                                      selectedSectionId === sectionId && selectedTopicIndex === topicIdx
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    <span className="flex-1 text-sm truncate">{topic.title}</span>
                                    <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveTopicUp(sectionId, topicIdx); }}
                                        disabled={topicIdx === 0}
                                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                                        title="Sposta su"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveTopicDown(sectionId, topicIdx); }}
                                        disabled={topicIdx === section.topics.length - 1}
                                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                                        title="Sposta giù"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTopic(sectionId, topicIdx); }}
                                        className="p-0.5 text-gray-400 hover:text-red-500"
                                        title="Elimina topic"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                          <button
                            onClick={handleAddSection}
                            className="mt-2 flex items-center gap-1.5 text-sm text-police-blue hover:text-police-blue-dark font-medium px-2 py-1.5 border border-dashed border-police-blue/50 rounded-md hover:bg-police-blue/5 transition-colors w-full justify-center"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Nuova Sezione
                          </button>
                        </div>

                        {/* Right: editor */}
                        <div className="lg:col-span-3">
                          {!selectedSectionId ? (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                              Seleziona una sezione o un topic per modificarlo
                            </div>
                          ) : selectedTopicIndex === null ? (
                            /* Section title editor */
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted">
                                Titolo Sezione
                              </label>
                              <input
                                type="text"
                                value={normSections[selectedSectionId]?.title ?? ''}
                                onChange={(e) => handleUpdateSectionTitle(selectedSectionId, e.target.value)}
                                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-police-blue"
                              />
                              <p className="text-xs text-gray-400">
                                ID sezione (slug): <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{selectedSectionId}</code>
                              </p>
                              <button
                                onClick={() => handleAddTopic(selectedSectionId)}
                                className="flex items-center gap-1.5 text-sm text-police-blue hover:text-police-blue-dark font-medium px-3 py-1.5 border border-police-blue/50 rounded-md hover:bg-police-blue/5 transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Aggiungi Topic
                              </button>
                            </div>
                          ) : selectedTopic !== null ? (
                            /* Topic editor */
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                                  Titolo Topic
                                </label>
                                <input
                                  type="text"
                                  value={selectedTopic.title}
                                  onChange={(e) => handleUpdateTopicTitle(selectedSectionId, selectedTopicIndex, e.target.value)}
                                  className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-police-blue"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-police-gray-dark dark:text-police-text-muted mb-1">
                                  Contenuto Markdown
                                </label>
                                {/* Split-pane: editor + live preview affiancati */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col">
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Editor</div>
                                    <textarea
                                      value={selectedTopic.content}
                                      onChange={(e) => handleUpdateTopicContent(selectedSectionId, selectedTopicIndex, e.target.value)}
                                      rows={16}
                                      className="flex-1 text-xs font-mono border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-police-blue resize-none"
                                      spellCheck={false}
                                      placeholder={`## Titolo\n\nTesto della sezione...\n\n| Colonna A | Colonna B |\n|-----------|----------|\n| valore    | valore   |`}
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Anteprima</div>
                                    <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 overflow-y-auto min-h-[16rem] max-h-[28rem]">
                                      {selectedTopic.content.trim() ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300">
                                          {renderMarkdownContent(selectedTopic.content)}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400 italic">Scrivi del Markdown per vedere l&apos;anteprima...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* Save button */}
                    <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="primary"
                        onClick={handleSaveNormSections}
                        disabled={normSectionsSaving}
                        leftIcon={normSectionsSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      >
                        {normSectionsSaved ? 'Salvato!' : normSectionsSaving ? 'Salvataggio...' : 'Salva Sezioni'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Categorie Reato ── */}
              <div>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted mb-4">
                  Gestisci le categorie di reato e i relativi articoli del codice penale.
                </p>

              {normLoading ? (
                <div className="text-center py-8 text-gray-400">Caricamento...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left panel: Categories */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-police-blue-dark dark:text-police-text-light flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Categorie
                    </h3>

                    {normCategories.length === 0 && (
                      <p className="text-sm text-gray-400 italic">Nessuna categoria. Creane una qui sotto.</p>
                    )}

                    <div className="space-y-2">
                      {normCategories.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            selectedCategoryId === cat.id
                              ? 'border-police-blue bg-police-blue/5 dark:border-blue-500 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${normColorDot[cat.color] ?? normColorDot.gray}`} />
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${normColorBadge[cat.color] ?? normColorBadge.gray}`}>
                              {cat.name}
                            </span>
                            <span className="text-xs text-gray-400">{cat.crimes.length} reati</span>
                            {cat.sectionId && (
                              <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                {normSections[cat.sectionId]?.title ?? cat.sectionId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCatId(cat.id);
                                setCatForm({ name: cat.name, color: cat.color, sectionId: cat.sectionId ?? '' });
                              }}
                              className="p-1 text-gray-400 hover:text-police-blue rounded"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${selectedCategoryId === cat.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Category form */}
                    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-3 space-y-3">
                      <h4 className="text-sm font-medium text-police-blue-dark dark:text-police-text-light">
                        {editingCatId ? 'Modifica categoria' : 'Nuova categoria'}
                      </h4>
                      <input
                        type="text"
                        placeholder="Nome categoria..."
                        value={catForm.name}
                        onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
                      />
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Colore</label>
                        <div className="flex gap-2 flex-wrap">
                          {normAvailableColors.map((c) => (
                            <button
                              key={c}
                              onClick={() => setCatForm((p) => ({ ...p, color: c }))}
                              className={`h-6 w-6 rounded-full ${normColorDot[c]} ${catForm.color === c ? 'ring-2 ring-offset-1 ring-police-blue' : ''}`}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Sezione</label>
                        <select
                          value={catForm.sectionId}
                          onChange={(e) => setCatForm((p) => ({ ...p, sectionId: e.target.value }))}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
                        >
                          <option value="">— Nessuna sezione —</option>
                          {Object.entries(normSections).map(([sectionId, section]) => (
                            <option key={sectionId} value={sectionId}>{section.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        {editingCatId && (
                          <button
                            onClick={() => { setEditingCatId(null); setCatForm({ name: '', color: 'blue', sectionId: '' }); }}
                            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                          >
                            Annulla
                          </button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveCategory}
                          disabled={catSaving || !catForm.name.trim()}
                          leftIcon={<Save className="h-3.5 w-3.5" />}
                        >
                          {catSaving ? 'Salvo...' : editingCatId ? 'Aggiorna' : 'Aggiungi'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Crimes in selected category */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-police-blue-dark dark:text-police-text-light flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {selectedCategory ? `Reati: ${selectedCategory.name}` : 'Reati'}
                    </h3>

                    {!selectedCategory ? (
                      <p className="text-sm text-gray-400 italic">Seleziona una categoria per gestire i reati.</p>
                    ) : (
                      <>
                        {selectedCategory.crimes.length === 0 && (
                          <p className="text-sm text-gray-400 italic">Nessun reato in questa categoria.</p>
                        )}
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {selectedCategory.crimes.map((crime) => (
                            <div key={crime.id} className="flex items-start justify-between border border-gray-200 dark:border-gray-700 rounded-md p-2.5 bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{crime.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {crime.sentence}{crime.fine > 0 ? ` · €${crime.fine.toLocaleString('it-IT')}` : ''}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingCrimeId(crime.id);
                                    setCrimeForm({ name: crime.name, description: crime.description, sentence: crime.sentence, fine: String(crime.fine) });
                                  }}
                                  className="p-1 text-gray-400 hover:text-police-blue rounded"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCrime(crime.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Crime form */}
                        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-3 space-y-2.5">
                          <h4 className="text-sm font-medium text-police-blue-dark dark:text-police-text-light">
                            {editingCrimeId ? 'Modifica reato' : 'Nuovo reato'}
                          </h4>
                          <input
                            type="text"
                            placeholder="Nome reato *"
                            value={crimeForm.name}
                            onChange={(e) => setCrimeForm((p) => ({ ...p, name: e.target.value }))}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
                          />
                          <textarea
                            placeholder="Descrizione..."
                            value={crimeForm.description}
                            onChange={(e) => setCrimeForm((p) => ({ ...p, description: e.target.value }))}
                            rows={2}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-police-blue resize-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Pena (es. 3 anni) *"
                              value={crimeForm.sentence}
                              onChange={(e) => setCrimeForm((p) => ({ ...p, sentence: e.target.value }))}
                              className="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-police-blue"
                            />
                            <input
                              type="number"
                              placeholder="Sanzione €"
                              value={crimeForm.fine}
                              onChange={(e) => setCrimeForm((p) => ({ ...p, fine: e.target.value }))}
                              min={0}
                              className="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-police-blue [appearance:textfield]"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            {editingCrimeId && (
                              <button
                                onClick={() => { setEditingCrimeId(null); setCrimeForm({ name: '', description: '', sentence: '', fine: '0' }); }}
                                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                              >
                                Annulla
                              </button>
                            )}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveCrime}
                              disabled={crimeSaving || !crimeForm.name.trim() || !crimeForm.sentence.trim()}
                              leftIcon={<Save className="h-3.5 w-3.5" />}
                            >
                              {crimeSaving ? 'Salvo...' : editingCrimeId ? 'Aggiorna' : 'Aggiungi'}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

        </Card>

        {activeTab === 'reports' && (
          <Card>
            <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">
              Anteprima
            </h2>
            <div className="space-y-4">
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
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
