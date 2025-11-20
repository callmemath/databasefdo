'use client';

import { useState, useEffect } from 'react';

export interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export function useReportCategories() {
  const [categories, setCategories] = useState<ConfigCategory[]>([
    { id: 'furto', name: 'Furto', description: 'Denuncia di furto', color: 'blue' },
    { id: 'aggressione', name: 'Aggressione', description: 'Denuncia di aggressione', color: 'red' },
    { id: 'danneggiamento', name: 'Danneggiamento', description: 'Denuncia di danneggiamento', color: 'yellow' },
    { id: 'minaccia', name: 'Minaccia', description: 'Denuncia di minaccia', color: 'purple' },
  ]);
  
  useEffect(() => {
    const loadCategories = () => {
      const savedCategories = localStorage.getItem('fdo_report_categories');
      
      if (savedCategories) {
        try {
          setCategories(JSON.parse(savedCategories));
        } catch (e) {
          console.error('Errore nel parsing delle categorie dei report:', e);
        }
      }
    };
    
    loadCategories();
    
    // Aggiunge un listener per gli aggiornamenti del localStorage da altre schede
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fdo_report_categories' && e.newValue) {
        try {
          setCategories(JSON.parse(e.newValue));
        } catch (e) {
          console.error('Errore nel parsing delle categorie dei report:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return categories;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<ConfigCategory[]>([
    { id: 'polizia', name: 'Polizia', description: 'Polizia di Stato', color: 'blue' },
    { id: 'carabinieri', name: 'Carabinieri', description: 'Arma dei Carabinieri', color: 'blue' },
    { id: 'administration', name: 'Administration', description: 'Amministrazione', color: 'gray' },
    { id: 'lspd', name: 'LSPD', description: 'Los Santos Police Department', color: 'blue' },
  ]);
  
  // State per la mappatura dei nomi di dipartimento agli ID
  const [departmentMappings, setDepartmentMappings] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    const loadDepartments = () => {
      const savedDepartments = localStorage.getItem('fdo_departments');
      const savedMappings = localStorage.getItem('fdo_department_mappings');
      
      if (savedDepartments) {
        try {
          setDepartments(JSON.parse(savedDepartments));
        } catch (e) {
          console.error('Errore nel parsing dei dipartimenti:', e);
        }
      }
      
      if (savedMappings) {
        try {
          setDepartmentMappings(JSON.parse(savedMappings));
        } catch (e) {
          console.error('Errore nel parsing delle mappature dei dipartimenti:', e);
        }
      }
    };
    
    loadDepartments();
    
    // Aggiunge un listener per gli aggiornamenti del localStorage da altre schede
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fdo_departments' && e.newValue) {
        try {
          setDepartments(JSON.parse(e.newValue));
        } catch (e) {
          console.error('Errore nel parsing dei dipartimenti:', e);
        }
      }
      
      if (e.key === 'fdo_department_mappings' && e.newValue) {
        try {
          setDepartmentMappings(JSON.parse(e.newValue));
        } catch (e) {
          console.error('Errore nel parsing delle mappature dei dipartimenti:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Restituisce sia i dipartimenti che le mappature
  return { departments, departmentMappings };
}

export function useFdoCategories() {
  const [categories, setCategories] = useState<ConfigCategory[]>([
    { id: 'agenti', name: 'Agenti', description: 'Agenti di Polizia', color: 'blue' },
    { id: 'ispettori', name: 'Ispettori', description: 'Ispettori di Polizia', color: 'green' },
    { id: 'commissari', name: 'Commissari', description: 'Commissari di Polizia', color: 'purple' },
    { id: 'dirigenti', name: 'Dirigenti', description: 'Dirigenti di Polizia', color: 'gold' },
  ]);
  
  useEffect(() => {
    const loadCategories = () => {
      const savedCategories = localStorage.getItem('fdo_categories');
      
      if (savedCategories) {
        try {
          setCategories(JSON.parse(savedCategories));
        } catch (e) {
          console.error('Errore nel parsing delle categorie FDO:', e);
        }
      }
    };
    
    loadCategories();
    
    // Aggiunge un listener per gli aggiornamenti del localStorage da altre schede
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fdo_categories' && e.newValue) {
        try {
          setCategories(JSON.parse(e.newValue));
        } catch (e) {
          console.error('Errore nel parsing delle categorie FDO:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return categories;
}

export function useConfig() {
  const reportCategories = useReportCategories();
  const { departments, departmentMappings } = useDepartments();
  const fdoCategories = useFdoCategories();
  
  // Utility functions for categories
  const getReportCategoryById = (id: string) => reportCategories.find(cat => cat.id === id);
  
  // Funzione per ottenere un dipartimento dal suo ID
  const getDepartmentById = (id: string) => departments.find((dep: ConfigCategory) => dep.id === id);
  
  // Funzione per ottenere un dipartimento dal suo nome (usa la mappatura se necessario)
  const getDepartmentByName = (name: string) => {
    // Cerca direttamente per nome
    const directMatch = departments.find((dep: ConfigCategory) => dep.name === name);
    if (directMatch) return directMatch;
    
    // Se non trova una corrispondenza diretta, controlla le mappature
    const mappedId = departmentMappings[name];
    if (mappedId) {
      return departments.find((dep: ConfigCategory) => dep.id === mappedId);
    }
    
    return null;
  };
  
  // Funzione per risolvere il nome del dipartimento all'ID corretto
  const resolveDepartmentId = (departmentName: string) => {
    const department = getDepartmentByName(departmentName);
    return department ? department.id : null;
  };
  
  const getFdoCategoryById = (id: string) => fdoCategories.find(cat => cat.id === id);
  
  return {
    reportCategories,
    departments,
    fdoCategories,
    departmentMappings,
    getReportCategoryById,
    getDepartmentById,
    getDepartmentByName,
    resolveDepartmentId,
    getFdoCategoryById
  };
}
